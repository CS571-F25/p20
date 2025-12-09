import { useEffect, useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../contexts/AuthContext";
import { useSettings } from "../contexts/SettingsContext";
import { fetchExchangeRates, convertToBase } from "../reusable/currencyConverter";
import "./Dashboard.css";

const CATEGORY_COLORS = ["#2563eb", "#22c55e", "#f97316", "#a855f7", "#06b6d4", "#ef4444"];
const RADIAN = Math.PI / 180;

export default function Dashboard() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, settings.currency]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      const [txRes, budgetRes, exchangeRates] = await Promise.all([
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("date", { ascending: false }),
        supabase
          .from("budgets")
          .select("*")
          .eq("user_id", user.id)
          .order("start_date", { ascending: false }),
        fetchExchangeRates(settings.currency || "USD"),
      ]);

      if (txRes.error) throw txRes.error;
      if (budgetRes.error) throw budgetRes.error;

      setTransactions(txRes.data || []);
      setBudgets(budgetRes.data || []);
      setRates(exchangeRates || {});
    } catch (err) {
      console.error("Error loading dashboard data:", err);
      setError("We could not load your dashboard data. Please refresh.");
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (value = 0) => {
    try {
      return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: settings.currency || "USD",
        maximumFractionDigits: 2,
      }).format(value);
    } catch (e) {
      return `${settings.currency || "USD"} ${Number(value).toFixed(2)}`;
    }
  };

  const toBaseAmount = (transaction) => {
    const amount = Math.abs(Number(transaction.amount) || 0);
    const currency = transaction.currency || settings.currency || "USD";
    if (!rates[currency]) return amount;
    return convertToBase(amount, currency, rates);
  };

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactions.forEach((t) => {
      const amt = toBaseAmount(t);
      if (t.type === "income") {
        income += amt;
      } else {
        expense += amt;
      }
    });

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [transactions, rates, settings.currency]);

  const monthlyTrend = useMemo(() => {
    const buckets = {};
    transactions.forEach((t) => {
      const date = new Date(`${t.date}T00:00:00`);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      if (!buckets[key]) {
        buckets[key] = {
          month: date.toLocaleString("en-US", { month: "short" }),
          income: 0,
          expense: 0,
        };
      }
      const amt = toBaseAmount(t);
      if (t.type === "income") {
        buckets[key].income += amt;
      } else {
        buckets[key].expense += amt;
      }
    });

    const result = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      result.push({
        month: d.toLocaleString("en-US", { month: "short" }),
        income: buckets[key]?.income || 0,
        expense: buckets[key]?.expense || 0,
      });
    }
    return result;
  }, [transactions, rates, settings.currency]);

  const categoryBreakdown = useMemo(() => {
    const totalsByCategory = {};
    transactions.forEach((t) => {
      if (t.type !== "expense") return;
      const category = t.category || "Other";
      totalsByCategory[category] = (totalsByCategory[category] || 0) + toBaseAmount(t);
    });

    return Object.entries(totalsByCategory)
      .map(([name, value]) => ({ name, value: Number(value.toFixed(2)) }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [transactions, rates, settings.currency]);

  const budgetProgress = useMemo(() => {
    const today = new Date();

    return budgets
      .map((budget) => {
        const spent = transactions
          .filter((t) => t.type === "expense")
          .filter((t) => budget.categories?.includes(t.category))
          .filter((t) => {
            const date = new Date(`${t.date}T00:00:00`);
            const start = new Date(`${budget.start_date}T00:00:00`);
            const end = new Date(`${budget.end_date}T00:00:00`);
            return date >= start && date <= end;
          })
          .reduce((sum, t) => sum + toBaseAmount(t), 0);

        const remaining = (budget.limit || 0) - spent;
        const percent = budget.limit ? Math.min(100, (spent / budget.limit) * 100) : 0;
        const daysLeft = Math.ceil(
          (new Date(`${budget.end_date}T00:00:00`) - today) / (1000 * 60 * 60 * 24)
        );

        return {
          ...budget,
          spent,
          remaining,
          percent,
          daysLeft,
        };
      })
      .sort((a, b) => new Date(a.end_date) - new Date(b.end_date));
  }, [budgets, transactions, rates, settings.currency]);

  const recentTransactions = useMemo(
    () =>
      transactions.slice(0, 5).map((t) => ({
        ...t,
        baseAmount: toBaseAmount(t),
        displayDate: new Date(`${t.date}T00:00:00`).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      })),
    [transactions, rates, settings.currency]
  );

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <p style={{ marginTop: "16px", color: "#4f5b6cff", fontSize: "14px", marginLeft: "13px" }}>
          Loading dashboard...
        </p>
      </div>
    );
  }

  return (
    <main className="dashboard-page" aria-labelledby="dashboard-title">
      <div className="dashboard-header">
        <div>
          <p className="eyebrow">Overview / Base currency {settings.currency}</p>
          <h1 id="dashboard-title">Dashboard</h1>
          <p className="muted">A quick look at your money, budgets, and recent activity.</p>
        </div>
        <button className="refresh-btn" onClick={loadDashboardData} aria-label="Refresh dashboard data">
          Refresh
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <section aria-labelledby="key-metrics-title" className="section-block">
        <div className="section-header">
          <h2 id="key-metrics-title" className="section-title">
            Key metrics
          </h2>
          <p className="muted">Shown in {settings.currency}</p>
        </div>
        <div className="metric-grid">
          <div className="metric-card primary">
            <span className="label">Balance</span>
            <p className="metric-value">{formatAmount(totals.balance)}</p>
            <p className="muted">
              Income {formatAmount(totals.income)} | Expenses {formatAmount(totals.expense)}
            </p>
          </div>
          <div className="metric-card">
            <span className="label">Income (30d)</span>
            <p className="metric-value">
              {formatAmount(
                transactions
                  .filter((t) => t.type === "income")
                  .filter((t) => new Date(`${t.date}T00:00:00`) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
                  .reduce((sum, t) => sum + toBaseAmount(t), 0)
              )}
            </p>
            <p className="muted">Last 30 days</p>
          </div>
          <div className="metric-card">
            <span className="label">Expenses (30d)</span>
            <p className="metric-value">
              {formatAmount(
                transactions
                  .filter((t) => t.type === "expense")
                  .filter((t) => new Date(`${t.date}T00:00:00`) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
                  .reduce((sum, t) => sum + toBaseAmount(t), 0)
              )}
            </p>
            <p className="muted">Last 30 days</p>
          </div>
          <div className="metric-card">
            <span className="label">Active Budgets</span>
            <p className="metric-value">{budgetProgress.filter((b) => b.daysLeft >= 0).length}</p>
            <p className="muted">{budgets.length} total budgets</p>
          </div>
        </div>
      </section>

      <section className="chart-row" aria-label="Financial insights - trends and categories">
        <article className="chart-card span-2" aria-labelledby="monthly-trend-title">
          <div className="card-header">
            <div>
              <h2 id="monthly-trend-title">Monthly Trend</h2>
              <p className="muted">Income vs. expenses (last 6 months)</p>
            </div>
          </div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="chart-card span-2" aria-labelledby="category-breakdown-title">
          <div className="card-header">
            <div>
              <h2 id="category-breakdown-title">Spending by Category</h2>
              <p className="muted">Top categories (expenses)</p>
            </div>
          </div>
          <div className="category-grid">
            <div style={{ width: "100%", height: 240 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    labelLine={false}
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                      const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
                      const x = cx + radius * Math.cos(-midAngle * RADIAN);
                      const y = cy + radius * Math.sin(-midAngle * RADIAN);
                      return (
                        <text
                          x={x}
                          y={y}
                          fill="#fff"
                          textAnchor="middle"
                          dominantBaseline="central"
                          fontSize={12}
                          fontWeight="600"
                        >
                          {`${Math.round(percent * 100)}%`}
                        </text>
                      );
                    }}
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={entry.name} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="category-list">
              {categoryBreakdown.length === 0 ? (
                <p className="muted">No expenses yet.</p>
              ) : (
                categoryBreakdown.map((item, index) => (
                  <div key={item.name} className="category-row">
                    <span className="dot" style={{ background: CATEGORY_COLORS[index % CATEGORY_COLORS.length] }}></span>
                    <div>
                      <p className="label">{item.name}</p>
                      <p className="muted">{formatAmount(item.value)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </article>
      </section>

      <section className="chart-row" aria-label="Financial insights - budgets and activity">
        <article className="chart-card span-2" aria-labelledby="budget-health-title">
          <div className="card-header">
            <div>
              <h2 id="budget-health-title">Budget Health</h2>
              <p className="muted">Spending against your limits</p>
            </div>
          </div>
          {budgetProgress.length === 0 ? (
            <p className="muted">You have not created any budgets yet.</p>
          ) : (
            <div className="budget-list">
              {budgetProgress.slice(0, 4).map((budget) => (
                <div key={budget.id} className="budget-row">
                  <div className="budget-row-header">
                    <div>
                      <p className="label">{budget.categories?.join(", ") || "Uncategorized"}</p>
                      <p className="muted">
                        {budget.start_date} - {budget.end_date}
                      </p>
                    </div>
                    <div className="budget-amounts">
                      <span>{formatAmount(budget.spent)} spent</span>
                      <span className="muted">of {formatAmount(budget.limit || 0)}</span>
                    </div>
                  </div>
                  <div className="progress" role="presentation" aria-hidden="true">
                    <div
                      className={`progress-fill ${budget.percent > 90 ? "danger" : budget.percent > 70 ? "warn" : "ok"}`}
                      style={{ width: `${budget.percent}%` }}
                    ></div>
                  </div>
                  <div className="budget-meta">
                    <span>{Math.max(0, Math.round(budget.percent))}% used</span>
                    <span className={budget.remaining < 0 ? "danger-text" : ""}>
                      {budget.remaining < 0
                        ? `${formatAmount(Math.abs(budget.remaining))} over`
                        : `${formatAmount(budget.remaining)} left`}
                    </span>
                    <span>{budget.daysLeft >= 0 ? `${budget.daysLeft} days left` : "Ended"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="chart-card span-2" aria-labelledby="recent-transactions-title">
          <div className="card-header">
            <div>
              <h2 id="recent-transactions-title">Recent Transactions</h2>
              <p className="muted">Latest activity</p>
            </div>
          </div>
          {recentTransactions.length === 0 ? (
            <p className="muted">No transactions yet.</p>
          ) : (
            <div className="recent-list">
              {recentTransactions.map((t) => (
                <div key={t.id} className="recent-row">
                  <div>
                    <p className="label">{t.description}</p>
                    <p className="muted">
                      {t.category || "Uncategorized"} | {t.displayDate}
                    </p>
                  </div>
                  <span className={t.type === "income" ? "income" : "expense"}>
                    {t.type === "income" ? "+" : "-"}
                    {formatAmount(t.baseAmount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </article>
      </section>
    </main>
  );
}
