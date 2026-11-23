import { supabase } from './supabase';

export async function loadFeedbackReplies(feedbackIds = []) {
  const ids = [...new Set((feedbackIds || []).filter(Boolean))];
  if (!ids.length) return [];

  const { data, error } = await supabase
    .from('feedback_replies')
    .select('id, feedback_id, author_id, author_role, message, created_at, user_read_at, admin_read_at')
    .in('feedback_id', ids)
    .order('created_at', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function getFeedbackUnreadCount() {
  const { data, error } = await supabase.rpc('get_feedback_unread_count');
  if (error) throw error;
  return Number(data) || 0;
}

export async function markFeedbackRepliesRead(feedbackId) {
  const { error } = await supabase.rpc('mark_feedback_replies_read', { _feedback_id: feedbackId });
  if (error) throw error;
}

export async function sendUserFeedbackReply(feedbackId, message) {
  const { data, error } = await supabase.rpc('user_reply_to_feedback', {
    _feedback_id: feedbackId,
    _message: message,
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}

export async function sendAdminFeedbackReply(feedbackId, message, status) {
  const { data, error } = await supabase.rpc('admin_reply_to_feedback', {
    _feedback_id: feedbackId,
    _message: message,
    _status: status,
  });
  if (error) throw error;
  return Array.isArray(data) ? data[0] : data;
}
