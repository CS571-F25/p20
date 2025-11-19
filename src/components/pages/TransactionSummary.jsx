import { useEffect, useState } from "react";

export default function TransactionSummary({ transactions, baseCurrency, isFiltered, totalCount, filterCount }) {
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch exchange rates once on mount
  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
        const data = await res.json();
        setRates(data.rates);
      } catch (err) {
        console.error("Failed to fetch exchange rates", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRates();
  }, []);

  const convertToBase = (transaction) => {
    if (!rates[transaction.currency]) return 0;
    return Number(transaction.amount) / rates[transaction.currency];
  };

  if (loading) return <div>Loading summary...</div>;

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + convertToBase(t), 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + convertToBase(t), 0);

  const balance = totalIncome + totalExpense;

  // Style colors like your transaction list
  const incomeColor = (totalIncome === 0)? "#2e392fff" : "#4CAF50";   // green for income
  const expenseColor = (totalExpense === 0)? "#2e392fff" : "#F44336";  // red for expense
  const balanceColor = (balance === 0) ? "#2e392fff" : (balance >= 0)? "#2196F3" : "#F44336" ;  // blue for balance

  return (
    <div className="transaction-summary">
       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: "15px" }}>
        <h3 style={{ margin: 0 }}>Summary ({baseCurrency})</h3>
        {isFiltered && (
          <span style={{
            fontSize: '11px',
            backgroundColor: '#dbeafe',
            color: '#1e40af',
            padding: '4px 8px',
            borderRadius: '12px',
            fontWeight: '600',
            border: '1px solid #93c5fd'
          }}>
            Filtered ({filterCount}/{totalCount})
          </span>
        )}
      </div>
      <div 
        className="summary-item" 
        style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}
      >
        <span>💰 Total Income:</span> 
        <strong style={{ color: incomeColor }}>{totalIncome.toFixed(2)}</strong>
      </div>
      <div 
        className="summary-item" 
        style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}
      >
        <span>💸 Total Expenses:</span> 
        <strong style={{ color: expenseColor }}>{totalExpense.toFixed(2)}</strong>
      </div>
      <div 
        className="summary-item" 
        style={{ display: "flex", justifyContent: "space-between" }}
      >
        <span>📊 Balance:</span> 
        <strong style={{ color: balanceColor }}>{balance.toFixed(2)}</strong>
      </div>
    </div>
  );

}
