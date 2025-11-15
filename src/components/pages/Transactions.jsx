import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import AppCard from '../reusable/AppCard';
import './Transactions.css';

export default function Transactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const itemsPerPage = 5;

  // state variable for transaction form
  const [formData, setFormData] = useState({
    date: '',
    description: '',
    category: '',
    amount: '',
    currency: 'USD',
    type: 'expense'
  });

  // state for delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    transactionId: null,
    transactionDescription: ''
  });

  const [error, setError] = useState('');

  const categories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Income', 'Other'];
  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD'];

  // Pagination logic
  const totalPages = Math.ceil(transactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = transactions.slice(startIndex, endIndex);

  // Fetch transactions from Supabase
  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async () => {
    // Validate all fields
    if (!formData.date || !formData.description || !formData.category || !formData.amount) {
      setError('Please fill in all fields');
      return;
    }

    if (!user) {
      setError('You must be logged in to add transactions');
      return;
    }
    
    setError('');
    
    const amount = formData.type === 'expense' 
      ? -Math.abs(parseFloat(formData.amount)) 
      : Math.abs(parseFloat(formData.amount));
    
    const newTransaction = {
      user_id: user.id,
      date: formData.date,
      description: formData.description,
      category: formData.category,
      amount,
      currency: formData.currency,
      type: formData.type
    };
    
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([newTransaction])
        .select();

      if (error) throw error;

      // Add to local state
      setTransactions([data[0], ...transactions]);
      setFormData({ date: '', description: '', category: '', amount: '', currency: 'USD', type: 'expense' });
    } catch (error) {
      console.error('Error adding transaction:', error);
      setError('Failed to add transaction');
    }
  };

  const openDeleteModal = (id, description) => {
    setDeleteModal({
      isOpen: true,
      transactionId: id,
      transactionDescription: description
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      transactionId: null,
      transactionDescription: ''
    });
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', deleteModal.transactionId);

      if (error) throw error;

      // Remove from local state
      setTransactions(transactions.filter(t => t.id !== deleteModal.transactionId));
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setError('Failed to delete transaction');
      closeDeleteModal();
    }
  };

  const [editFormData, setEditFormData] = useState({
    description: '',
    category: '',
    date: '',
    type: '',
    amount: '',
    currency: ''
  });

  const handleEdit = (id) => {
    const transaction = transactions.find(t => t.id === id);
    setEditingId(id);
    setEditFormData({
      description: transaction.description,
      category: transaction.category,
      date: transaction.date,
      type: transaction.type,
      amount: Math.abs(transaction.amount).toString(),
      currency: transaction.currency
    });
  };

  const handleSaveEdit = async (id) => {
    const amount = editFormData.type === 'expense' 
      ? -Math.abs(parseFloat(editFormData.amount)) 
      : Math.abs(parseFloat(editFormData.amount));

    try {
      const { error } = await supabase
        .from('transactions')
        .update({
          description: editFormData.description,
          category: editFormData.category,
          date: editFormData.date,
          type: editFormData.type,
          amount: amount,
          currency: editFormData.currency
        })
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setTransactions(transactions.map(t => 
        t.id === id ? { ...t, ...editFormData, amount } : t
      ));
      setEditingId(null);
    } catch (error) {
      console.error('Error updating transaction:', error);
      setError('Failed to update transaction');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  // Placeholder filter functions
  const handleFilterByCategory = () => {
    console.log('Filter by category clicked');
    // You'll implement this
  };

  const handleFilterByDateRange = () => {
    console.log('Filter by date range clicked');
    // You'll implement this
  };

  const handleFilterByType = () => {
    console.log('Filter by type clicked');
    // You'll implement this
  };

  const handleClearFilters = () => {
    console.log('Clear filters clicked');
    // You'll implement this
  };

  const exportToCSV = () => {
    if (transactions.length === 0) {
      alert('No transactions to export');
      return;
    }

    // Define CSV headers
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount', 'Currency'];
    
    // Convert transactions to CSV rows
    const rows = transactions.map(t => [
      t.date,
      `"${t.description}"`,
      t.category,
      t.type,
      Math.abs(t.amount).toFixed(2),
      t.currency
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create a Blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `transactions_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return <div className="page-content">Loading transactions...</div>;
  }

  return (
    <div className="page-content transactions-page">
      <div className="transactions-content">
        {/* Add Transaction Form */}
        <div style={{marginTop: "10px"}}>
          <h3>Add Transaction</h3>
          <AppCard width="400px">
            {error && <div className="error-message">{error}</div>}
            
            <div className="transaction-form">
              {/* Type and Date in a row */}
              <div className="form-row">
                <select 
                  value={formData.type} 
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>

                <input 
                  type="date" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                />
              </div>

              <input 
                type="text" 
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />

              <select 
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value})}
              >
                <option value="">Select category</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Amount and Currency in a row */}
              <div className="form-row">
                <input 
                  type="number" 
                  step="0.01"
                  placeholder="Amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />

                <select 
                  value={formData.currency}
                  onChange={(e) => setFormData({...formData, currency: e.target.value})}
                  style={{ flex: '0 0 100px' }}
                >
                  {currencies.map(curr => (
                    <option key={curr} value={curr}>{curr}</option>
                  ))}
                </select>
              </div>

              <button className="btn-add" onClick={handleAddTransaction}>
                Add Transaction
              </button>
            </div>
          </AppCard>
        </div>

        {/* Transactions History List */}
        <div className="transactions-list">
          {/* Header with Filter Buttons and Export to CSV button */}
          <div className="transactions-header">
            <h3 style={{ margin: 0, marginLeft: "15px" }}>Recent Transactions</h3>
            
            <div className="filter-buttons">
              <button onClick={handleFilterByCategory} className="btn-filter">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>
                Category
              </button>
              
              <button onClick={handleFilterByDateRange} className="btn-filter">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                Date
              </button>
              
              <button onClick={handleFilterByType} className="btn-filter">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <polyline points="19 12 12 19 5 12"></polyline>
                </svg>
                Type
              </button>
              
              <button onClick={handleClearFilters} className="btn-clear">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Clear
              </button>
              
              <button onClick={exportToCSV} className="btn-export">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Export CSV
              </button>
            </div>
          </div>

          <AppCard width="100%">
            {transactions.length === 0 ? (
              <p className="empty-state">No transactions yet. Add your first one!</p>
            ) : (
              <>
                <div className="transactions-container">
                  {currentTransactions.map((transaction, index) => (
                    <div key={transaction.id} className="transaction-item">
                      <div className="transaction-left">
                        {editingId === transaction.id ? (
                          // Edit mode - show inputs
                          <div className="edit-form">
                            <input 
                              type="text" 
                              value={editFormData.description}
                              onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                              className="edit-input"
                              placeholder="Description"
                            />
                            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                              <select defaultValue={transaction.category} className="edit-select">
                                <option value="">Select category</option>
                                {categories.map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                              <input 
                                type="date" 
                                defaultValue={transaction.date}
                                className="edit-input-small"
                              />
                            </div>
                          </div>
                        ) : (
                          // View mode - show text
                          <>
                            <strong>{transaction.description}</strong>
                            <div className="transaction-details">
                              {transaction.category} • {transaction.date}
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div className="transaction-right">
                        {editingId === transaction.id ? (
                          // Edit mode - show amount input
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <select defaultValue={transaction.type} className="edit-select-small">
                              <option value="expense">Expense</option>
                              <option value="income">Income</option>
                            </select>
                            <input 
                              type="number" 
                              step="0.01"
                              defaultValue={Math.abs(transaction.amount)}
                              className="edit-input-small"
                              style={{ width: '100px' }}
                            />
                            <select defaultValue={transaction.currency} className="edit-select-small" style={{ width: '80px' }}>
                              {currencies.map(curr => (
                                <option key={curr} value={curr}>{curr}</option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          // View mode - show amount
                          <span className={transaction.type === 'income' ? 'amount-income' : 'amount-expense'}>
                            {transaction.type === 'income' ? '+' : '-'}{transaction.currency} ${Math.abs(transaction.amount).toFixed(2)}
                          </span>
                        )}
                        
                        {/* Edit Button */}
                        <button 
                          onClick={() => editingId === transaction.id ? handleSaveEdit(transaction.id) : handleEdit(transaction.id)}
                          className="btn-edit"
                        >
                          {editingId === transaction.id ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                          ) : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                            </svg>
                          )}
                        </button>
                        
                        {/* Cancel Button (shows when editing) */}
                        {editingId === transaction.id && (
                          <button onClick={handleCancelEdit} className="btn-cancel-edit">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </button>
                        )}
                        
                        {/* Hide delete button when editing */}
                        {editingId !== transaction.id && (
                          <button className="btn-delete" onClick={() => openDeleteModal(transaction.id, transaction.description)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="pagination-btn"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6"></polyline>
                      </svg>
                    </button>
                    
                    <div className="page-numbers">
                      {[...Array(totalPages)].map((_, index) => (
                        <button
                          key={index + 1}
                          onClick={() => setCurrentPage(index + 1)}
                          className={`page-number ${currentPage === index + 1 ? 'active' : ''}`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                    
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="pagination-btn"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                      </svg>
                    </button>
                    
                    <span className="page-indicator">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>
                )}
              </>
            )}
          </AppCard>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="modal-overlay" onClick={closeDeleteModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Delete Transaction</h3>
            <p>Are you sure you want to delete "<strong>{deleteModal.transactionDescription}</strong>"?</p>
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