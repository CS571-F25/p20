import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../../supabaseClient';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSettings } from '../contexts/SettingsContext';
import TransactionSummary from "./TransactionSummary";
import AppCard from '../reusable/AppCard';
import ClickOutsideWrapper from '../reusable/ClickOutsideWrapper';
import { triggerNotification } from '../notifications/triggerNotification';
import './Transactions.css';

export default function Transactions() {
  const { user } = useAuth();
  const { settings } = useSettings();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingId, setEditingId] = useState(null);
  const itemsPerPage = 20;
  const [searchQuery, setSearchQuery] = useState('');
  
  const categories = ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Income', 'Other'];

  const allCurrencies = [
    "AED", "AUD", "BRL", "CAD", "CHF", "CLP", "COP", "CNY", "CZK", "DKK",
    "EUR", "GBP", "HKD", "HUF", "IDR", "ILS", "INR", "JPY", "KRW", "MXN",
    "MYR", "NOK", "NZD", "PHP", "PLN", "RON", "RUB", "SAR", "SEK", "SGD",
    "THB", "TWD", "TRY", "USD", "ZAR"
  ];

  // Default currency
  const defaultCurrency = settings.currency;

  // Create array with default on top and rest alphabetized
  const currencies = [
    defaultCurrency,
    ...allCurrencies.filter(c => c !== defaultCurrency).sort()
  ];

  // State variable for transaction form
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    description: '',
    category: '',
    amount: '',
    currency: defaultCurrency,
    type: 'expense'
  });

  // State variable for current filters
   const [filters, setFilters] = useState({
    category: '',
    type: '',
    dateRange: {
      start: '',
      end: ''
    }
  });

  const isFiltered =
    filters.category !== '' ||
    filters.type !== '' ||
    filters.dateRange.start !== '' ||
    filters.dateRange.end !== '' ||
    searchQuery !== ''

  const [tempDateRange, setTempDateRange] = useState({
    start: '',
    end: ''
  });


  // State variable for delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    transactionId: null,
    transactionDescription: ''
  });

  // State variable for error on the add transcation forms
  const [error, setError] = useState('');

  // Helper function to get filtered transactions
  const getFilteredTransactions = () => {
    let filtered = [...transactions];
    
  // Filter by search query
  if (searchQuery) {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    if (normalizedQuery.length > 0) {
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(normalizedQuery) ||
        t.currency.toLowerCase().includes(normalizedQuery) ||
        t.amount.toString().includes(normalizedQuery)
      )
    }
  }
    
    // Filter by category
    if (filters.category) {
      filtered = filtered.filter(t => t.category === filters.category);
    }
    
    // Filter by type
    if (filters.type) {
      filtered = filtered.filter(t => t.type === filters.type);
    }
    
    // Filter by date range
    if (filters.dateRange.start && filters.dateRange.end) {
      filtered = filtered.filter(t => {
        const transactionDate = new Date(t.date);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
    }
    
    return filtered;
  };

  // Pagination logic
  const filteredTransactions = getFilteredTransactions();
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Helper function to get week label
  const getWeekLabel = (dateString) => {
    const date = new Date(dateString + 'T00:00:00'); // Force midnight in local timezone
    const today = new Date();
    
    // Reset time for accurate comparison
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    // Get the start of the week (Sunday) for the transaction date
    const transactionWeekStart = new Date(date);
    transactionWeekStart.setDate(date.getDate() - date.getDay());
    transactionWeekStart.setHours(0, 0, 0, 0);
    
    // Get the start of this week (Sunday)
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    thisWeekStart.setHours(0, 0, 0, 0);
    
    // Get the start of last week
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(thisWeekStart.getDate() - 7);
    
    // Calculate difference in days
    const diffTime = transactionWeekStart.getTime() - thisWeekStart.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    
    let weekText = null;

    // Compare weeks
    if (diffDays === 0) {
      weekText = 'This Week';
    } else if (diffDays === -7) {
      weekText = 'Last Week';
    }
    
    const weekEnd = new Date(transactionWeekStart);
    weekEnd.setDate(transactionWeekStart.getDate() + 6);
    
    // Compare weeks
    if (diffDays === 0) {
      return `This Week (${transactionWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
    } else if (diffDays === -7) {
      return `Last Week (${transactionWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
    } else {
      return `${transactionWeekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
  };

  // Helper function to group current page transactions by week
  const groupCurrentPageByWeek = (transactions) => {
    const groups = {};
    const order = [];
    
    transactions.forEach(transaction => {
      const weekLabel = getWeekLabel(transaction.date);
      
      if (!groups[weekLabel]) {
        groups[weekLabel] = [];
        order.push(weekLabel);
      }
      
      groups[weekLabel].push(transaction);
    });
    
    return { groups, order };
  };

  // -- Fetch transactions from Supabase --
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

  // -- Adding transactions -- 
  const handleAddTransaction = async () => {

    // Input validations
    if (!formData.date || !formData.description || !formData.category || !formData.amount) {
      setError('Please fill in all fields');
      return;
    }

    if (!user) {
      setError('You must be logged in to add transactions');
      return;
    }
    
    // Remove existing error if pass all transaction validations
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
    
    // Add transaction to the database
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([newTransaction])
        .select();

      if (error) throw error;

      // Add to local state
      const updatedTransactions = [data[0], ...transactions];
      updatedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(updatedTransactions);
    
      // notifications!
      if (formData.type === 'expense') {
        await triggerNotification(user.id, updatedTransactions, defaultCurrency);
      }

      toast.success('Transaction added successfully!', {
        position: "top-right",
        autoClose: 2000, // disappears after 2 seconds
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
      });
      // Clears form after successfully adding transaction
      setFormData({ date: '', description: '', category: '', amount: '', currency: defaultCurrency, type: 'expense' });
    } catch (error) {
      console.error('Error adding transaction:', error);
      setError('Failed to add transaction');
    }
  };

  // -- Deleting transactions --
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
      toast.success('Transaction deleted successfully!', {
        position: "top-right",
        autoClose: 2000, // disappears after 2 seconds
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
      });
      
    } catch (error) {
      console.error('Error deleting transaction:', error);
      setError('Failed to delete transaction');
      closeDeleteModal();
    }
  };

  // -- Editing transactions --
  const [editFormData, setEditFormData] = useState({
    description: '',
    category: '',
    date: '',
    type: '',
    amount: '',
    currency: ''
  });

  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    message: ''
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
    // Input validations
    if (!editFormData.date || !editFormData.description || !editFormData.category || !editFormData.amount) {
      setErrorModal({ isOpen: true, message: 'Please fill in all fields' });
      return;
    }

    if (!user) {
      setErrorModal({ isOpen: true, message: 'You must be logged in to edit transactions' });
      return;
    }
    
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
      const updatedTransactions = transactions.map(t => 
        t.id === id ? { ...t, ...editFormData, amount } : t
      );
      updatedTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

      setTransactions(updatedTransactions);
      
      // Check budget notifications with updated transactions
      if (editFormData.type === 'expense') {
        await triggerNotification(user.id, updatedTransactions, defaultCurrency);
      }

      toast.info('Transaction updated successfully!', {
        position: "top-right",
        autoClose: 2000, // disappears after 2 seconds
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: false,
        draggable: false,
      });
      setEditingId(null);
      setError(''); // Clear any previous errors
    } catch (error) {
      console.error('Error updating transaction:', error);
      setErrorModal({ isOpen: true, message: 'Failed to update transaction' });

    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setError(''); // Clear any errors when canceling
  };

  // -- Filtering transactions --

  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);
  const [showTypeFilter, setShowTypeFilter] = useState(false);

  // Placeholder filter functions
 const handleFilterByCategory = () => {
    // Toggle dropdown/modal to show category options
    setShowCategoryFilter(!showCategoryFilter);
    setShowDateFilter(false);
    setShowTypeFilter(false);
  };

  const handleFilterByDateRange = () => {
    setTempDateRange(filters.dateRange); // Initialize with current filter values
    setShowDateFilter(!showDateFilter);
    setShowCategoryFilter(false);
    setShowTypeFilter(false);
  };

  const handleFilterByType = () => {
    // Toggle dropdown/modal to show type options (expense/income)
    setShowTypeFilter(!showTypeFilter);
    setShowCategoryFilter(false);
    setShowDateFilter(false);
  };

  const handleClearFilters = () => {
    setFilters({
      category: '',
      type: '',
      dateRange: { start: '', end: '' }
    });
    setSearchQuery(''); // Add this line
    setShowCategoryFilter(false);
    setShowDateFilter(false);
    setShowTypeFilter(false);
    setCurrentPage(1);
  };

  // -- Exporting transactiosn features --
  const exportToCSV = () => {
    if (transactions.length === 0) {
      alert('No transactions to export!');
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
      return (
          <div className="loading-page">
              <div className="spinner"></div>
              <p style={{ marginTop: '16px', color: '#4f5b6cff', fontSize: '14px', marginLeft: '13px'}}>
                  Loading transactions...
              </p>
          </div>
      );
  }

  return (
    <div className="page-content transactions-page">
      <ToastContainer position="top-right" autoClose={3000} />
      <div className="transactions-content">
        
        <div>
          {/* Summary card */}
          <AppCard width="400px">
            <TransactionSummary transactions={filteredTransactions} baseCurrency={defaultCurrency} isFiltered={isFiltered} filterCount={filteredTransactions.length} totalCount={transactions.length}/> 
          </AppCard>

          {/* Add Transaction Form */}
          <AppCard width="400px" marginTop="40px">
          <h3>➕ Add Transaction</h3>
            {error && <div className="error-message">{error}</div>}
            
            <div className="transaction-form">
              {/* Type and Date in a row */}
              <div className="form-row">
                <select 
                  aria-label="Transaction type"
                  value={formData.type} 
                  onChange={(e) => setFormData({...formData, type: e.target.value})}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>

                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) =>
                    setFormData({ ...formData, date: e.target.value })
                  }
                  className="modern-date-input"
                  aria-label="Transaction date"
                />
              </div>

              <input 
                type="text" 
                placeholder="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                aria-label="Transaction description"
              />

              <select
                aria-label="Category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>


              {/* Amount and Currency in a row */}
              <div className="form-row">
                <input 
                  type="number" 
                  step="1"
                  placeholder="Amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  aria-label="Amount"
                />

                <select
                  aria-label="Currency"
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
            
            <h3 style={{ margin: 0, marginLeft: "15px", marginTop: "17px" }}>📋 Recent Transactions</h3>
            
            <div className="filter-buttons">
              {/* Category Filter */}
              <ClickOutsideWrapper onClickOutside={() => setShowCategoryFilter(false)}>
                <div style={{ position: 'relative' }}>
                  <button onClick={handleFilterByCategory} 
                    className="btn-filter"
                    aria-haspopup="true"
                    aria-expanded={showCategoryFilter ? "true" : "false"}
                    aria-label="Filter by category">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                    </svg>
                    Category
                  </button>
                  
                  {showCategoryFilter && (
                    <div className="filter-dropdown">
                      {categories.map(cat => (
                        <button 
                          key={cat}
                          onClick={() => {
                            setFilters({...filters, category: cat});
                            setShowCategoryFilter(false);
                            setCurrentPage(1);
                          }}
                          className={filters.category === cat ? 'filter-option-active' : 'filter-option'}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </ClickOutsideWrapper>

              {/* Date Filter */}
              <ClickOutsideWrapper onClickOutside={() => setShowDateFilter(false)}>
                <div style={{ position: 'relative' }}>
                  <button onClick={handleFilterByDateRange} className="btn-filter">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Date
                  </button>
                  
                  {showDateFilter && (
                  <div className="filter-dropdown" style={{ minWidth: '250px' }}>
                    <div style={{ padding: '8px' }}>
                      {/* Quick Presets */}
                      <div style={{ marginBottom: '12px', borderBottom: '1px solid #e2e8f0', paddingBottom: '8px' }}>
                        <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Quick Select</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {[
                            { label: 'Today', days: 0 },
                            { label: 'Yesterday', days: 1 },
                            { label: 'Last 7 Days', days: 7 },
                            { label: 'Last 30 Days', days: 30 },
                            { label: 'Last 60 Days', days: 60 },
                            { label: 'All History', days: null }
                          ].map((preset) => {
                            // Check if this preset is currently active
                            const isActive = (() => {
                              if (preset.days === null) {
                                return !filters.dateRange.start && !filters.dateRange.end;
                              }
                              
                              const today = new Date();
                              today.setHours(0, 0, 0, 0);
                              const todayStr = today.toISOString().split('T')[0];
                              
                              if (preset.days === 0) {
                                return filters.dateRange.start === todayStr && filters.dateRange.end === todayStr;
                              } else if (preset.days === 1) {
                                const yesterday = new Date(today);
                                yesterday.setDate(today.getDate() - 1);
                                const yesterdayStr = yesterday.toISOString().split('T')[0];
                                return filters.dateRange.start === yesterdayStr && filters.dateRange.end === yesterdayStr;
                              } else {
                                const startDate = new Date(today);
                                startDate.setDate(today.getDate() - preset.days);
                                const startStr = startDate.toISOString().split('T')[0];
                                return filters.dateRange.start === startStr && filters.dateRange.end === todayStr;
                              }
                            })();
                            
                            return (
                              <button
                                key={preset.label}
                                onClick={() => {
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  
                                  if (preset.days === null) {
                                    setFilters({...filters, dateRange: { start: '', end: '' }});
                                    setShowDateFilter(false);
                                    setCurrentPage(1);
                                  } else if (preset.days === 0) {
                                    const todayStr = today.toISOString().split('T')[0];
                                    setFilters({...filters, dateRange: { start: todayStr, end: todayStr }});
                                    setShowDateFilter(false);
                                    setCurrentPage(1);
                                  } else if (preset.days === 1) {
                                    const yesterday = new Date(today);
                                    yesterday.setDate(today.getDate() - 1);
                                    const yesterdayStr = yesterday.toISOString().split('T')[0];
                                    setFilters({...filters, dateRange: { start: yesterdayStr, end: yesterdayStr }});
                                    setShowDateFilter(false);
                                    setCurrentPage(1);
                                  } else {
                                    const startDate = new Date(today);
                                    startDate.setDate(today.getDate() - preset.days);
                                    setFilters({
                                      ...filters,
                                      dateRange: {
                                        start: startDate.toISOString().split('T')[0],
                                        end: today.toISOString().split('T')[0]
                                      }
                                    });
                                    setShowDateFilter(false);
                                    setCurrentPage(1);
                                  }
                                }}
                                className={isActive ? 'filter-option-active' : 'filter-option'}
                              >
                                {preset.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Custom Date Range */}
                      <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '6px', fontWeight: '600' }}>Custom Range</label>
                      <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>Start Date</label>
                      <input 
                        aria-label='Select date start'
                        type="date" 
                        value={tempDateRange.start}
                        max={tempDateRange.end || undefined}
                        onChange={(e) => setTempDateRange({...tempDateRange, start: e.target.value})}
                        style={{ width: '100%', padding: '6px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                      />
                      <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>End Date</label>
                      <input 
                        aria-label='Select date end'
                        type="date" 
                        value={tempDateRange.end}
                        min={tempDateRange.start || undefined}
                        onChange={(e) => setTempDateRange({...tempDateRange, end: e.target.value})}
                        style={{ width: '100%', padding: '6px', marginBottom: '12px', borderRadius: '4px', border: '1px solid #e2e8f0' }}
                      />
                      <button 
                        onClick={() => {
                          setFilters({...filters, dateRange: tempDateRange});
                          setShowDateFilter(false);
                          setCurrentPage(1);
                        }}
                        style={{ width: '100%', padding: '8px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                      >
                        Apply Custom Range
                      </button>
                    </div>
                  </div>)}
                </div>
              </ClickOutsideWrapper>

              {/* Type Filter */}
              <ClickOutsideWrapper onClickOutside={() => setShowTypeFilter(false)}>
                <div style={{ position: 'relative' }}>
                  <button onClick={handleFilterByType} className="btn-filter">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <polyline points="19 12 12 19 5 12"></polyline>
                    </svg>
                    Type
                  </button>
                  
                  {showTypeFilter && (
                    <div className="filter-dropdown">
                      <button 
                        onClick={() => { setFilters({...filters, type: 'expense'}); setShowTypeFilter(false); setCurrentPage(1); }}
                        className={filters.type === 'expense' ? 'filter-option-active' : 'filter-option'}
                      >
                        Expense
                      </button>
                      <button 
                        onClick={() => { setFilters({...filters, type: 'income'}); setShowTypeFilter(false); setCurrentPage(1); }}
                        className={filters.type === 'income' ? 'filter-option-active' : 'filter-option'}
                      >
                        Income
                      </button>
                    </div>
                  )}
                </div>
              </ClickOutsideWrapper>
              
              {isFiltered && (
                <button onClick={handleClearFilters} className="btn-clear">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Clear
              </button>
              )}
              
              
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

          {/* Search Bar */}
          <div className="search-bar-container">
            <div className="search-input-wrapper">
              <svg 
                width="18" 
                height="18" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                viewBox="0 0 24 24"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>

              <input
                id="transaction-search"
                type="text"
                className="search-input"
                placeholder="Search transactions..."
                aria-label='Search transactions'
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>

          {/* Active Filter Badges */}
          {(isFiltered) && (
            <div style={{ marginBottom: '4px', marginLeft: '15px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {filters.category && (
                <span className="filter-badge">
                  Category: {filters.category} 
                  <button onClick={() => setFilters({...filters, category: ''})}>✕</button>
                </span>
              )}
              {filters.type && (
                <span className="filter-badge">
                  Type: {filters.type.charAt(0).toUpperCase() + filters.type.slice(1)}
                  <button onClick={() => setFilters({...filters, type: ''})}>✕</button>
                </span>
              )}
              {filters.dateRange.start && filters.dateRange.end && (
                <span className="filter-badge">
                {filters.dateRange.start === filters.dateRange.end 
                  ? filters.dateRange.start 
                  : `${filters.dateRange.start} - ${filters.dateRange.end}`}
                <button onClick={() => setFilters({...filters, dateRange: {start: '', end: ''}})}>✕</button>
              </span>
              )}
              {searchQuery !== '' && (
                <span className="filter-badge">
                {`Search: "${searchQuery}"`}
                <button onClick={() => setSearchQuery('')}>✕</button>
              </span>
              )}
            </div>
          )}

          <AppCard width="100%">
            {transactions.length === 0 ? (
                <p className="empty-state">No transactions yet. Add your first one!</p>
              ) : filteredTransactions.length === 0 ? (
                <div className="empty-state">
                  <p>No transactions match your filters.</p>
                  <button 
                    onClick={handleClearFilters}
                    style={{
                      marginTop: '12px',
                      padding: '8px 16px',
                      backgroundColor: '#3b82f6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}
                  >
                    Clear Filters
                  </button>
                </div>
              ) : (
                <>
              <div className="transactions-container">
                
                {(() => {
                  const { groups, order } = groupCurrentPageByWeek(currentTransactions);
                  
                  return order.map((weekLabel) => (
                    <div key={weekLabel} style={{ marginBottom: '24px' }}>
                      {/* Week Header */}
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        marginBottom: '5px',
                        marginTop: '2px',
                        paddingBottom: '8px',
                        borderBottom: '2px solid #e2e8f0'
                      }}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ marginRight: '8px' }}>
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                          <line x1="16" y1="2" x2="16" y2="6"></line>
                          <line x1="8" y1="2" x2="8" y2="6"></line>
                          <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <span style={{
                          fontSize: '14px', 
                          fontWeight: '600', 
                          color: (weekLabel.includes('This Week') || weekLabel.includes('Last Week')) ? '#1e40af' : '#1a202c',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px'
                        }}>
                          {weekLabel}
                        </span>
                      </div>
                      
                      {/* Transactions for this week */}
                      {groups[weekLabel].map((transaction) => (
                        <div key={transaction.id} className="transaction-item">
                          {/* Your existing transaction item code stays exactly the same */}
                          <div className="transaction-left">
                            {editingId === transaction.id ? (
                              <div className="edit-form">
                                <input 
                                  aria-label='Description'
                                  type="text" 
                                  value={editFormData.description}
                                  onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                                  className="edit-input"
                                  placeholder="Description"
                                />
                                <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                                  <select
                                    aria-label='Select Category'
                                    value={editFormData.category}
                                    onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
                                    className="edit-select"
                                  >
                                    <option value="">Select category</option>
                                    {categories.map(cat => (
                                      <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                  </select>
                                  <input 
                                    aria-label='Select date'
                                    type="date" 
                                    value={editFormData.date}
                                    onChange={(e) => setEditFormData({...editFormData, date: e.target.value})}
                                    className="edit-input-small modern-date-input"
                                  />
                                </div>
                              </div>
                            ) : (
                              <>
                                <strong>{transaction.description}</strong>
                                <div className="transaction-details">
                                  {transaction.category} • {new Date(transaction.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                </div>
                              </>
                            )}
                          </div>
                          
                          <div className="transaction-right">
                            {editingId === transaction.id ? (
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <select 
                                  aria-label='Select transaction type'
                                  value={editFormData.type}
                                  onChange={(e) => setEditFormData({...editFormData, type: e.target.value})}
                                  className="edit-select-small"
                                >
                                  <option value="expense">Expense</option>
                                  <option value="income">Income</option>
                                </select>
                                <input 
                                  aria-label='Input transaction amount'
                                  type="number" 
                                  step="1"
                                  value={editFormData.amount}
                                  onChange={(e) => setEditFormData({...editFormData, amount: e.target.value})}
                                  className="edit-input-small"
                                  style={{ width: '100px' }}
                                />
                                <select 
                                  aria-label='Select transaction currency'
                                  value={editFormData.currency}
                                  onChange={(e) => setEditFormData({...editFormData, currency: e.target.value})}
                                  className="edit-select-small" 
                                  style={{ width: '80px' }}
                                >
                                  {currencies.map(curr => (
                                    <option key={curr} value={curr}>{curr}</option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <span className={transaction.type === 'income' ? 'amount-income' : 'amount-expense'}>
                                {transaction.type === 'income' ? '+' : '-'}{transaction.currency} {Math.abs(transaction.amount).toFixed(2)}
                              </span>
                            )}
                            
                            <button
                              onClick={() =>
                                editingId === transaction.id
                                  ? handleSaveEdit(transaction.id)
                                  : handleEdit(transaction.id)
                              }
                              className="btn-edit"
                              aria-label={
                                editingId === transaction.id ? "Save transaction" : "Edit transaction"
                              }
                            >
                              {editingId === transaction.id ? (
                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  aria-hidden="true"
                                >
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                              ) : (
                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  aria-hidden="true"
                                >
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                              )}
                            </button>

                            
                            {editingId === transaction.id && (
                              <button onClick={handleCancelEdit} className="btn-cancel-edit">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18"></line>
                                  <line x1="6" y1="6" x2="18" y2="18"></line>
                                </svg>
                              </button>
                            )}
                            
                            {editingId !== transaction.id && (
                              <button
                                className="btn-delete"
                                onClick={() =>
                                  openDeleteModal(transaction.id, transaction.description)
                                }
                                aria-label="Delete transaction"
                              >
                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  aria-hidden="true"
                                >
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
                  ));
                })()}
              </div>
              {currentPage == totalPages && (
                <div className="end-of-list">
                  <p>------ End of transaction list ------</p>
                </div>)}

              {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button 
                      aria-label='previous page button'
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
                          aria-label={`Page ${index + 1} button`}
                          key={index + 1}
                          onClick={() => setCurrentPage(index + 1)}
                          className={`page-number ${currentPage === index + 1 ? 'active' : ''}`}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                    
                    <button 
                      aria-label='next page button'
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
              <button className="btn-cancel" onClick={closeDeleteModal} autoFocus>
                Cancel
              </button>
              <button className="btn-confirm-delete" onClick={handleDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {errorModal.isOpen && (
        <div className="modal-overlay" onClick={() => setErrorModal({ isOpen: false, message: '' })}>
          <div className="modal-content error-modal" onClick={(e) => e.stopPropagation()}>
            <div className="error-modal-header">
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: '#fee2e2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
              </div>
              <h3 style={{ color: '#dc2626', marginTop: '16px', marginBottom: '8px' }}>Error</h3>
            </div>
            <p style={{ fontSize: '15px', color: '#4b5563', textAlign: 'center', margin: '8px 0 24px 0' }}>
              {errorModal.message}
            </p>
            <div className="modal-actions">
              <button 
                autoFocus
                className="btn-error-ok" 
                onClick={() => setErrorModal({ isOpen: false, message: '' })}
                style={{
                  width: '100%',
                  padding: '10px 20px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}