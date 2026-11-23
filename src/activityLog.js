import { supabase } from './supabase';

const USER_ACTIVITY_TYPES = new Set([
  'transaction_added', 'transaction_updated', 'transaction_deleted', 'csv_imported', 'csv_exported', 'backup_restored', 'backup_exported',
  'account_added', 'account_updated', 'account_deleted', 'legacy_entries_assigned',
  'monthly_budget_updated', 'category_limit_updated',
  'recurring_schedule_created', 'recurring_schedule_updated', 'recurring_schedule_deleted', 'recurring_payment_recorded',
  'savings_goal_created', 'savings_goal_contribution', 'savings_goal_deleted',
  'category_created', 'category_deleted', 'settings_updated', 'user_signed_in', 'user_signed_out', 'feedback_submitted',
  'family_created', 'family_invitation_sent', 'family_invitation_accepted', 'family_member_removed',
  'family_transaction_added', 'family_transaction_updated', 'family_transaction_deleted',
]);

function cursorFilter(cursor) {
  if (!cursor?.created_at || !cursor?.id) return null;
  return `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`;
}

export async function recordUserActivity(eventType) {
  if (!USER_ACTIVITY_TYPES.has(eventType)) return false;
  const { error } = await supabase.rpc('record_user_activity', { _event_type: eventType });
  if (error) return false;
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('expensenest:user-activity-recorded'));
  return true;
}

export async function loadUserActivity(userId, { before = null, limit = 40 } = {}) {
  if (!userId) return [];

  let query = supabase
    .from('user_activity_logs')
    .select('id, user_id, event_type, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);

  const cursor = cursorFilter(before);
  if (cursor) query = query.or(cursor);
  const { data, error } = await query;
  if (error) {
    const missingTable = error.code === '42P01' || error.code === 'PGRST205';
    throw new Error(missingTable
      ? 'Your activity history is not set up yet. Run supabase/user_activity_log.sql in the Supabase SQL Editor.'
      : error.message || 'Could not load your activity history.');
  }
  return Array.isArray(data) ? data : [];
}

export async function clearUserActivity(userId) {
  if (!userId) throw new Error('Sign in to clear your activity history.');
  const { error } = await supabase
    .from('user_activity_logs')
    .delete()
    .eq('user_id', userId);
  if (error) throw new Error(error.message || 'Could not clear your activity history.');
}

export async function recordAdminActivity(action, settingKey = null) {
  try {
    const { error } = await supabase.rpc('record_admin_activity', {
      _action: action,
      _setting_key: settingKey,
    });
    return !error;
  } catch {
    return false;
  }
}

export async function loadMoreAdminActivity(cursor, limit = 100) {
  let query = supabase
    .from('admin_activity_logs')
    .select('id, actor_id, actor_email, action, target_type, target_id, details, created_at')
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit);
  const cursorValue = cursorFilter(cursor);
  if (cursorValue) query = query.or(cursorValue);
  const { data, error } = await query;
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}
