
import { supabase } from './supabase';
import { mergeSharedPreferencesWithCloudData, SHARED_PREFERENCES_STORAGE_KEY } from './sharedPreferences';

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
  language: 'expenseNestLanguage',
  currency: 'expenseNestCurrency',
  dateFormat: 'expenseNestDateFormat',
  density: 'expenseNestDensity',
  privacyMode: 'expenseNestPrivacyMode',
  weekStart: 'expenseNestWeekStart',
  motionPreference: 'expenseNestMotionPreference',
  preferences: SHARED_PREFERENCES_STORAGE_KEY,
};

export function getLocalExpenseData() {
  const data = {};

  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    data[name] = localStorage.getItem(key);
  });

  return data;
}

export function applyExpenseData(data) {
  const { data: mergedData, localPreferenceIsNewer } = mergeSharedPreferencesWithCloudData(data);

  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    const value = mergedData?.[name];

    if (value === null || value === undefined) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  });

  return localPreferenceIsNewer;
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
