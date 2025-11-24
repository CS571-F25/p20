import { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { ToastContainer, toast } from 'react-toastify';
import { fetchExchangeRates, convertToBase } from '../reusable/currencyConverter';
import { useSettings } from '../contexts/SettingsContext';
import 'react-toastify/dist/ReactToastify.css';
import './Budgets.css';

export default function Budgets() {
  const { user } = useAuth();
  const [rates, setRates] = useState({});
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { settings } = useSettings();
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    budgetId: null,
    budgetCategories: []
  });

  const categories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Other'];

  const [formData, setFormData] = useState({
    categories: [],
    startDate: '',
    endDate: '',
    limit: ''
  });

  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchBudgets();
      fetchTransactions();
    }
  }, [user]);

  useEffect(() => {
    async function loadRates() {
      const exchangeRates = await fetchExchangeRates(settings.currency);
      setRates(exchangeRates);
    }
    loadRates();
  }, []);

  const fetchBudgets = async () => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) throw error;
      setBudgets(data || []);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('type', 'expense');

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const calculateSpending = (budget) => {
    const spent = transactions
      .filter(t => {
        const transactionDate = new Date(t.date + 'T00:00:00');
        const startDate = new Date(budget.start_date + 'T00:00:00');
        const endDate = new Date(budget.end_date + 'T00:00:00');
        
        return budget.categories.includes(t.category) &&
          transactionDate >= startDate &&
          transactionDate <= endDate;
      })
      .reduce((sum, t) => {
        // Convert each transaction to the default currency
        const convertedAmount = convertToBase(Math.abs(t.amount), t.currency || 'USD', rates);
        return sum + convertedAmount;
      }, 0);

    return spent;
  };

  const getDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getBudgetStatus = (budget) => {
    const spent = calculateSpending(budget);
    const limit = budget.limit;
    const remaining = limit - spent;
    const daysRemaining = getDaysRemaining(budget.end_date);
    const percentSpent = (spent / limit) * 100;

    if (daysRemaining < 0) {
      return {
        status: 'expired',
        message: 'Budget period has ended',
        color: '#718096',
        icon: '⏱️'
      };
    }

    if (spent > limit) {
      const overspent = spent - limit;
      return {
        status: 'over',
        message: `Exceeded by ${overspent.toFixed(2)}`,
        color: '#ef4444',
        icon: '🚫',
        spent,
        remaining: -overspent,
        percentSpent
      };
    }

    if (daysRemaining === 0) {
      return {
        status: 'lastday',
        message: remaining > 0 ? `$${remaining.toFixed(2)} left` : 'At budget',
        color: remaining > 0 ? '#3b82f6' : '#48bb78',
        icon: '🎯',
        spent,
        remaining,
        percentSpent
      };
    }

    const dailyBudget = remaining / daysRemaining;
    return {
      status: 'good',
      message: `$${dailyBudget.toFixed(2)}/day left`,
      color: percentSpent >= 80 ? '#f59e0b' : '#48bb78',
      icon: percentSpent >= 80 ? '⚠️' : '✅',
      spent,
      remaining,
      percentSpent,
      dailyBudget
    };
  };

  const handleCreateBudget = async () => {
    if (formData.categories.length === 0 || !formData.startDate || !formData.endDate || !formData.limit) {
      setError('Please fill in all fields');
      return;
    }

    if (parseFloat(formData.limit) <= 0) {
      setError('Budget limit must be greater than 0');
      return;
    }

    if (new Date(formData.startDate) > new Date(formData.endDate)) {
      setError('End date must be after start date');
      return;
    }

    setError('');

    const newBudget = {
      user_id: user.id,
      categories: formData.categories,
      start_date: formData.startDate,
      end_date: formData.endDate,
      limit: parseFloat(formData.limit)
    };

    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert([newBudget])
        .select();

      if (error) throw error;

      toast.success('Budget created successfully!', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
      });

      setBudgets([...data, ...budgets]);
      setFormData({ categories: [], startDate: '', endDate: '', limit: '' });
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating budget:', error);
      setError('Failed to create budget');
    }
  };

  const toggleCategory = (category) => {
    if (formData.categories.includes(category)) {
      setFormData({
        ...formData,
        categories: formData.categories.filter(c => c !== category)
      });
    } else {
      setFormData({
        ...formData,
        categories: [...formData.categories, category]
      });
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', deleteModal.budgetId);

      if (error) throw error;

      toast.success('Budget deleted successfully!', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
      });
      setBudgets(budgets.filter(b => b.id !== deleteModal.budgetId));
      setDeleteModal({ isOpen: false, budgetId: null, budgetCategories: [] });
    } catch (error) {
      console.error('Error deleting budget:', error);
      setError('Failed to delete budget');
      setDeleteModal({ isOpen: false, budgetId: null, budgetCategories: [] });
    }
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner"></div>
        <p style={{ marginTop: '16px', color: '#4f5b6cff', fontSize: '14px', marginLeft: '13px'}}>
          Loading budgets...
        </p>
      </div>
    );
  }

  return (
    <div className="page-content budgets-page">
      <ToastContainer position="top-right" autoClose={3000} />
      <h3 style={{
        marginBottom: "14px",
        marginLeft: "15px",
        color: "#2d3748",
        fontSize: "1.3em",
        fontWeight: "600"
      }}>💰 Your Budgets ({settings.currency})</h3>
      <div className="budgets-grid-layout">

        {/* Budget Cards */}
        {budgets.map(budget => {
          const status = getBudgetStatus(budget);
          const daysRemaining = getDaysRemaining(budget.end_date);
          
          return (
            <div key={budget.id} className="budget-card-item">
              <div className="budget-card-header">
                <div>
                  <h4 className="budget-title">
                    {new Intl.ListFormat("en", {style: "long", type: "conjunction"})
                      .format(budget.categories.sort((a,b) => (a === "Other" ? 1 : b === "Other" ? -1 : 0)))}
                  </h4>
                  <p className="budget-dates-small">
                    {new Date(budget.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {new Date(budget.end_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
                <button 
                  className="btn-delete-small"
                  onClick={() => setDeleteModal({
                    isOpen: true,
                    budgetId: budget.id,
                    budgetCategories: budget.categories
                  })}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                  </svg>
                </button>
              </div>

              {status.status !== 'expired' && (
                <>
                  <div className="budget-amount-display">
                    <div className="amount-spent">
                      <span className="amount-label">Spent</span>
                      <span className="amount-value" style={{ color: status.color }}>
                        {status.spent?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    <div className="amount-divider">/</div>
                    <div className="amount-limit">
                      <span className="amount-label">Limit</span>
                      <span className="amount-value">{budget.limit.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="budget-progress-bar-container">
                    <div 
                      className="budget-progress-bar-fill"
                      style={{
                        width: `${Math.min(status.percentSpent, 100)}%`,
                        backgroundColor: status.color
                      }}
                    ></div>
                  </div>

                  <div className="budget-status-badge" style={{ backgroundColor: `${status.color}15`, color: status.color }}>
                    <span>{status.icon}</span>
                    <span>{status.message}</span>
                  </div>

                  {daysRemaining >= 0 && (
                    <div className="budget-days-badge">
                      {daysRemaining === 0 ? 'Last day' : 
                      daysRemaining === 1 ? '1 day left' : 
                      `${daysRemaining} days left`}
                    </div>
                  )}
                </>
              )}

              {status.status === 'expired' && (
                <div className="budget-expired">
                  <span className="expired-icon">⏱️</span>
                  <span>Period ended</span>
                </div>
              )}
            </div>
          );
        })}

        {/* Create Budget Card */}
        <div className="create-budget-card" onClick={() => setShowCreateModal(true)}>
          <div className="create-budget-content">
            <Plus className="create-plus-icon" />
            <h3>Create Budget</h3>
            <p>Set spending limits for categories</p>
          </div>
        </div>

      </div>

      {/* Create Budget Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content-large" onClick={(e) => e.stopPropagation()}>
            <h3>Create New Budget</h3>
            {error && <div className="error-message">{error}</div>}
            
            <div className="modal-form">
              <div className="form-group-full">
                <label>Categories</label>
                <div className="category-chips">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      type="button"
                      className={`category-chip ${formData.categories.includes(cat) ? 'selected' : ''}`}
                      onClick={() => toggleCategory(cat)}
                    >
                      {formData.categories.includes(cat) && (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: '4px' }}>
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      )}
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Budget Limit ({settings.currency})</label>
                <input 
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.limit}
                  onChange={(e) => setFormData({...formData, limit: e.target.value})}
                  className="form-input"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Start Date</label>
                  <input 
                    type="date" 
                    value={formData.startDate}
                    max={formData.endDate || undefined}
                    onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label>End Date</label>
                  <input 
                    type="date" 
                    value={formData.endDate}
                    min={formData.startDate || undefined}
                    onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button className="modal-button cancel" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button className="modal-button confirm" onClick={handleCreateBudget}>
                  Create Budget
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteModal.isOpen && (
        <div className="modal-overlay" onClick={() => setDeleteModal({ isOpen: false, budgetId: null, budgetCategories: [] })}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Budget</h3>
            <p>Are you sure you want to delete the budget for "<strong>
              {new Intl.ListFormat("en", {style: "long", type: "conjunction"})
                .format(deleteModal.budgetCategories)}
            </strong>"?</p>
            <p className="modal-warning">This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="modal-button cancel" onClick={() => setDeleteModal({ isOpen: false, budgetId: null, budgetCategories: [] })}>
                Cancel
              </button>
              <button className="modal-button confirm-delete" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}