import { supabase } from '../../supabaseClient';

/**
 * Check budgets and create notifications if thresholds are exceeded.
 * Respects notification preferences when provided.
 */
export const triggerNotification = async (userId, transactions, baseCurrency, preferences = {}) => {
  try {
    console.log('dY"S Checking budgets for user:', userId);

    if (preferences.budgetAlerts === false) {
      console.log('Budget alerts disabled in settings, skipping budget notifications.');
      return;
    }
    
    // Fetch all active budgets for the user
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId);

    if (budgetsError) throw budgetsError;
    
    if (!budgets || budgets.length === 0) {
      console.log('Г,1Л,? No budgets found for user');
      return;
    }
    
    console.log(`dY"< Found ${budgets.length} budget(s) to check`);
    
    // Check each budget
    for (const budget of budgets) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const endDate = new Date(budget.end_date + 'T00:00:00');
      const startDate = new Date(budget.start_date + 'T00:00:00');
      
      // Calculate spending for this budget
      const spent = transactions
        .filter(t => {
          const transactionDate = new Date(t.date + 'T00:00:00');
          
          return budget.categories.includes(t.category) &&
            transactionDate >= startDate &&
            transactionDate <= endDate;
        })
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);

      const limit = budget.limit;
      const percentSpent = (spent / limit) * 100;
      const categoriesText = budget.categories.join(', ');
      

      // Check if notification already exists for this budget and threshold
      const checkExistingNotification = async (type) => {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .eq('type', type)
          .eq('metadata->>budget_id', budget.id)
          .maybeSingle();
        
        return data;
      };

      // Budget exceeded (100%+)
      if (percentSpent >= 100) {
        const existing = await checkExistingNotification('budget_exceeded');
        
        if (!existing) {
          console.log('dYs" Creating BUDGET EXCEEDED notification');
          await supabase.from('notifications').insert({
            user_id: userId,
            title: 'Budget Exceeded!',
            message: `Your ${categoriesText} budget has exceeded ${baseCurrency} ${limit.toFixed(2)}. You've spent ${baseCurrency} ${spent.toFixed(2)}.`,
            type: 'budget_exceeded',
            metadata: {
              budget_id: budget.id,
              categories: budget.categories,
              budget_limit: limit,
              current_spent: spent,
              percent_spent: percentSpent.toFixed(1)
            }
          });
        } else {
          console.log('Г,1Л,? Budget exceeded notification already exists');
        }
      }
      // Budget warning (80%+)
      else if (percentSpent >= 80) {
        const existing = await checkExistingNotification('budget_warning');
        
        if (!existing) {
          console.log('Гs Л,? Creating BUDGET WARNING notification');
          await supabase.from('notifications').insert({
            user_id: userId,
            title: 'Budget Warning',
            message: `You've used ${percentSpent.toFixed(0)}% of your ${categoriesText} budget. ${baseCurrency} ${(limit - spent).toFixed(2)} remaining.`,
            type: 'budget_warning',
            metadata: {
              budget_id: budget.id,
              categories: budget.categories,
              budget_limit: limit,
              current_spent: spent,
              percent_spent: percentSpent.toFixed(1)
            }
          });
        } else {
          console.log('Г,1Л,? Budget warning notification already exists');
        }
      }
      // Budget milestone (50% or 75%)
      else if (percentSpent >= 75 || percentSpent >= 50) {
        const milestoneType = percentSpent >= 75 ? '75' : '50';
        
        // Check if milestone notification exists
        const { data: existing } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .eq('type', 'budget_milestone')
          .eq('metadata->>budget_id', budget.id)
          .eq('metadata->>milestone', milestoneType)
          .maybeSingle();
        
        if (!existing) {
          console.log(`dYZ_ Creating BUDGET MILESTONE (${milestoneType}%) notification`);
          await supabase.from('notifications').insert({
            user_id: userId,
            title: `Budget Milestone: ${milestoneType}%`,
            message: `You've reached ${milestoneType}% of your ${categoriesText} budget. ${baseCurrency} ${(limit - spent).toFixed(2)} remaining.`,
            type: 'budget_milestone',
            metadata: {
              budget_id: budget.id,
              categories: budget.categories,
              budget_limit: limit,
              current_spent: spent,
              percent_spent: percentSpent.toFixed(1),
              milestone: milestoneType
            }
          });
        } else {
          console.log(`Г,1Л,? Budget milestone (${milestoneType}%) notification already exists`);
        }
      }
    }
  } catch (error) {
    console.error('Error checking budget notifications:', error);
  }
};

/**
 * Create a transaction-level notification (on add/update) if enabled.
 */
export const createTransactionNotification = async (userId, transaction, baseCurrency, preferences = {}) => {
  if (preferences.transactionAlerts === false) {
    console.log('Transaction alerts disabled in settings, skipping transaction notification.');
    return;
  }

  const isExpense = transaction.type === 'expense';
  const amountAbs = Math.abs(Number(transaction.amount) || 0).toFixed(2);
  const direction = isExpense ? 'Expense' : 'Income';
  const title = isExpense ? 'Expense Recorded' : 'Income Recorded';
  const message = `${direction}: ${transaction.category || 'Uncategorized'} • ${transaction.currency || baseCurrency} ${amountAbs} on ${transaction.date}`;

  try {
    await supabase.from('notifications').insert({
      user_id: userId,
      title,
      message,
      type: 'transaction_alert',
      metadata: {
        transaction_id: transaction.id,
        category: transaction.category,
        amount: amountAbs,
        currency: transaction.currency || baseCurrency,
        type: transaction.type
      }
    });
  } catch (error) {
    console.error('Error creating transaction notification:', error);
  }
};
