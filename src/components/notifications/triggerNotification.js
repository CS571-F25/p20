import { supabase } from '../../supabaseClient';

/**
 * Check budgets and create notifications if thresholds are exceeded
 * Call this after adding or editing a transaction
 */
export const triggerNotification = async (userId, transactions, baseCurrency) => {
  try {
    console.log('📊 Checking budgets for user:', userId);
    
    // Fetch all active budgets for the user
    const { data: budgets, error: budgetsError } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId);

    if (budgetsError) throw budgetsError;
    
    if (!budgets || budgets.length === 0) {
      console.log('ℹ️ No budgets found for user');
      return;
    }
    
    console.log(`📋 Found ${budgets.length} budget(s) to check`);
    
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
          console.log('🚨 Creating BUDGET EXCEEDED notification');
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
          console.log('ℹ️ Budget exceeded notification already exists');
        }
      }
      // Budget warning (80%+)
      else if (percentSpent >= 80) {
        const existing = await checkExistingNotification('budget_warning');
        
        if (!existing) {
          console.log('⚠️ Creating BUDGET WARNING notification');
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
          console.log('ℹ️ Budget warning notification already exists');
        }
      }
      // Budget milestone (50% or 75%)
      else if (percentSpent >= 75 || percentSpent >= 50) {
        const milestoneType = percentSpent >= 75 ? '75' : '50';
        
        // Check if milestone notification exists
        const { data: existing, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .eq('type', 'budget_milestone')
          .eq('metadata->>budget_id', budget.id)
          .eq('metadata->>milestone', milestoneType)
          .maybeSingle();
        
        if (!existing) {
          console.log(`🎯 Creating BUDGET MILESTONE (${milestoneType}%) notification`);
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
          console.log(`ℹ️ Budget milestone (${milestoneType}%) notification already exists`);
        }
      }
    }
  } catch (error) {
    console.error('Error checking budget notifications:', error);
  }
};