import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import AppCard from '../reusable/AppCard';
import './Budgets.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";


export default function Budgets() {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // for delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({
  isOpen: false,
  budgetId: null,
  budgetCategories: []
    });

  const openDeleteModal = (id, categories) => {
    setDeleteModal({
      isOpen: true,
      budgetId: id,
      budgetCategories: categories
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      budgetId: null,
      budgetCategories: []
    });
  };

  

  // Categories from Transactions page
  const categories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Other'];

  // Form state for creating new budget
  const [formData, setFormData] = useState({
    categories: [], // Changed to array for multiple selection
    startDate: '',
    endDate: '',
    limit: ''
  });

  const [error, setError] = useState('');

  // Fetch budgets and transactions
  useEffect(() => {
    if (user) {
      fetchBudgets();
      fetchTransactions();
    }
  }, [user]);

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

  // Only fetch expense transactions
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

  // Calculate spending for a budget
  const calculateSpending = (budget) => {
    console.log('Budget:', budget);
  console.log('All transactions:', transactions);
    const spent = transactions
      .filter(t => {
          const transactionDate = new Date(t.date + 'T00:00:00');
          const startDate = new Date(budget.start_date + 'T00:00:00');
          const endDate = new Date(budget.end_date + 'T00:00:00');
          
          return budget.categories.includes(t.category) &&
            transactionDate >= startDate &&
            transactionDate <= endDate
        }
      )
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    return spent;
  };

  // Calculate days remaining
  const getDaysRemaining = (endDate) => {
    const today = new Date();
    const end = new Date(endDate);
    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get budget status and message
  const getBudgetStatus = (budget) => {
    const spent = calculateSpending(budget);
    const limit = budget.limit;
    const remaining = limit - spent;
    const daysRemaining = getDaysRemaining(budget.end_date);
    const daysTotal = Math.ceil((new Date(budget.end_date) - new Date(budget.start_date)) / (1000 * 60 * 60 * 24)) + 1;
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
        message: `Stop spending! You've exceeded your budget by $${overspent.toFixed(2)}`,
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
        message: remaining > 0 
          ? `Last day! You have $${remaining.toFixed(2)} left to spend`
          : `Last day! You're at budget`,
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
      message: `Keep going! You can spend $${dailyBudget.toFixed(2)} per day to stay under budget`,
      color: percentSpent > 80 ? '#f59e0b' : '#48bb78',
      icon: percentSpent > 80 ? '⚠️' : '✅',
      spent,
      remaining,
      percentSpent,
      dailyBudget
    };
  };

  // Handle create budget
  const handleCreateBudget = async () => {
    // Validation
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
      categories: formData.categories,  // Array like ["Food", "Transportation"]
      start_date: formData.startDate,
      end_date: formData.endDate,
      limit: parseFloat(formData.limit)
    };

    try {
      const { data, error } = await supabase
        .from('budgets')
        .insert([newBudget])  // Insert single budget
        .select();

      if (error) throw error;

      setBudgets([...data, ...budgets]);
      setFormData({ categories: [], startDate: '', endDate: '', limit: '' });
    } catch (error) {
      console.error('Error creating budget:', error);
      setError('Failed to create budget', error);
    }
  };

  // Handle category toggle
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

  // Handle delete budget
  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', deleteModal.budgetId);

      if (error) throw error;

      setBudgets(budgets.filter(b => b.id !== deleteModal.budgetId));
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting budget:', error);
      setError('Failed to delete budget');
      closeDeleteModal();
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

      <div className="budgets-content">
        {/* Create Budget Form */}
        <div className="create-budget-section">
          <AppCard width="380px">
            <h3>Create New Budget</h3>
            {error && <div className="error-message">{error}</div>}
            
            <div className="budget-form">
              <div className="form-group-full">
                <label>Categories (Select one or more)</label>
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

              <div className="form-row">
                <div className="form-group">
                  <label>Budget Limit ($)</label>
                  <input 
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formData.limit}
                    onChange={(e) => setFormData({...formData, limit: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                <label>Start Date</label>
                <DatePicker
                    selected={formData.startDate ? new Date(formData.startDate) : null}
                    onChange={(date) =>
                    setFormData({
                        ...formData,
                        startDate: date ? date.toISOString().split('T')[0] : ''
                    })
                    }
                    maxDate={formData.endDate ? new Date(formData.endDate) : null}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select start date"
                    className="budget-date-input"
                    portalTarget={document.body}   // <-- Render calendar at body level
                    popperPlacement="bottom-start" // optional: controls placement
                />
                </div>

                <div className="form-group">
                <label>End Date</label>
                <DatePicker
                    selected={formData.endDate ? new Date(formData.endDate) : null}
                    onChange={(date) =>
                    setFormData({
                        ...formData,
                        endDate: date ? date.toISOString().split('T')[0] : ''
                    })
                    }
                    minDate={formData.startDate ? new Date(formData.startDate) : null}
                    dateFormat="yyyy-MM-dd"
                    placeholderText="Select end date"
                    className="budget-date-input"
                    portalTarget={document.body}   // <-- Render calendar at body level
                    popperPlacement="bottom-start"
                />
                </div>
              </div>

              <button className="btn-create-budget" onClick={handleCreateBudget}>
                Create Budget
              </button>
            </div>
          </AppCard>
        </div>

        {/* Active Budgets List */}
        <div className="budgets-list">
          <h3>Your Budgets</h3>
          
          {budgets.length === 0 ? (
            <AppCard width="100%">
              <p className="empty-state">No budgets yet. Create your first one above!</p>
            </AppCard>
          ) : (
            <div className="budgets-grid">
              {budgets.map(budget => {
                const status = getBudgetStatus(budget);
                const daysRemaining = getDaysRemaining(budget.end_date);
                
                return (
                  <AppCard key={budget.id} width="850px">
                    <div className="budget-card">
                      {/* Header */}
                      <div className="budget-header">
                        <div className="budget-category">
                          <h4>{new 
                              Intl.ListFormat("en", {style: "long", type: "conjunction"})
                              .format(budget.categories
                              .sort((a,b) => (a === "Other" ? 1 : b === "Other" ? -1 : 0)))}</h4>
                          <h5 className="budget-dates">
                            {new Date(budget.start_date + 'T00:00:00').toLocaleDateString()} - {new Date(budget.end_date + 'T00:00:00').toLocaleDateString()}
                          </h5>
                        </div>
                        <button 
                          className="btn-delete-budget"
                          onClick={() => openDeleteModal(budget.id, budget.categories)}
                        >
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 6h18"></path>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>

                      {/* Progress Bar */}
                      {status.status !== 'expired' && (
                        <>
                          <div className="budget-progress">
                            <div 
                              className="budget-progress-bar"
                              style={{
                                width: `${Math.min(status.percentSpent, 100)}%`,
                                backgroundColor: status.color
                              }}
                            ></div>
                          </div>

                          <div className="budget-stats">
                            <div className="budget-stat">
                              <span className="stat-label">Spent</span>
                              <span className="stat-value" style={{ color: status.color }}>
                                ${status.spent?.toFixed(2) || '0.00'}
                              </span>
                            </div>
                            <div className="budget-stat">
                              <span className="stat-label">Limit</span>
                              <span className="stat-value">${budget.limit.toFixed(2)}</span>
                            </div>
                            <div className="budget-stat">
                              <span className="stat-label">{status.remaining >= 0? "Remaining" : "Overspent"}</span>
                              <span className="stat-value" style={{ 
                                color: status.remaining >= 0 ? '#48bb78' : '#ef4444' 
                              }}>
                                ${Math.abs(status.remaining || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </>
                      )}

                      {/* Status Message */}
                      <div 
                        className="budget-message"
                        style={{ 
                          backgroundColor: `${status.color}15`,
                          borderLeft: `4px solid ${status.color}`
                        }}
                      >
                        <span className="budget-icon">{status.icon}</span>
                        <span style={{ color: status.color, fontWeight: '600' }}>
                          {status.message}
                        </span>
                      </div>

                      {/* Days Remaining Badge */}
                      {daysRemaining >= 0 && status.status !== 'expired' && (
                        <div className="budget-days-remaining">
                          {daysRemaining === 0 ? 'Last day' : 
                           daysRemaining === 1 ? '1 day remaining' : 
                           `${daysRemaining} days remaining`}
                        </div>
                      )}
                    </div>
                  </AppCard>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Budget</h3>
            <p>Are you sure you want to delete the budget for "<strong>
              {new Intl.ListFormat("en", {style: "long", type: "conjunction"})
                .format(deleteModal.budgetCategories)}
            </strong>"?</p>
            <p className="modal-warning">This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={closeDeleteModal}>
                Cancel
              </button>
              <button className="btn-confirm-delete" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}