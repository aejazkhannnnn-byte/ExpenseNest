
import { supabase } from './supabase';

const STORAGE_KEYS = {
  transactions: 'expenseNestTransactions',
  accounts: 'expenseNestAccounts',
  monthlyBudget: 'expenseNestMonthlyBudget',
  monthlyBudgets: 'expenseNestMonthlyBudgets',
  categoryBudgets: 'expenseNestCategoryBudgets',
  recurringRules: 'expenseNestRecurringRules',
  goals: 'expenseNestSavingsGoals',
  customCategories: 'expenseNestCustomCategories',
  theme: 'expenseNestTheme',
};

export function getLocalExpenseData() {
  const data = {};

  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    data[name] = localStorage.getItem(key);
  });

  return data;
}

export function applyExpenseData(data) {
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    const value = data?.[name];

    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  });
}

export async function loadCloudData(userId) {
  const { data, error } = await supabase
    .from('user_data')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;

  return data?.data ?? null;
}

export async function saveCloudData(userId, expenseData) {
  const { error } = await supabase
    .from('user_data')
    .upsert(
      {
        user_id: userId,
        data: expenseData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' }
    );

  if (error) throw error;
}
