import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowDown,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock3,
  Filter,
  LoaderCircle,
  MessageCircle,
  MessageSquareText,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '../supabase';
import { recordUserActivity } from '../activityLog';
import { formatAppDateTime } from '../dateFormatting';
import { getFeedbackUnreadCount, loadFeedbackReplies, markFeedbackRepliesRead, sendUserFeedbackReply } from '../feedbackConversations';
import './UserFeedbackCenter.css';

const PAGE_SIZE = 25;
const STATUS_LABELS = { new: 'Received', in_review: 'In review', resolved: 'Resolved' };
const CATEGORY_LABELS = { general: 'General', idea: 'Feature idea', bug: 'Problem report', other: 'Other' };

function cursorFilter(cursor) {
  if (!cursor?.created_at || !cursor?.id) return null;
  return `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`;
}

export default function UserFeedbackCenter({ user, onUnreadCountChange }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(null);
  const [category, setCategory] = useState('general');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [openFeedbackId, setOpenFeedbackId] = useState(null);
  const [sendingReplyId, setSendingReplyId] = useState(null);
  const requestIdRef = useRef(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }
    try {
      const nextCount = await getFeedbackUnreadCount();
      setUnreadCount(nextCount);
      onUnreadCountChange?.(nextCount);
    } catch {
      // The conversations migration may not have been applied yet.
    }
  }, [onUnreadCountChange, user?.id]);

  const loadPage = useCallback(async (before = null) => {
    if (!user?.id) {
      requestIdRef.current += 1;
      setItems([]);
      setHasMore(false);
      setError('Sign in to view your feedback and any replies.');
      setLoading(false);
      setLoadingMore(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    if (before) setLoadingMore(true);
    else setLoading(true);
    setError('');
    try {
      let query = supabase
        .from('feedback_messages')
        .select('id, category, message, status, created_at, admin_response, responded_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(PAGE_SIZE);
      const cursor = cursorFilter(before);
      if (cursor) query = query.or(cursor);

      const { data, error: queryError } = await query;
      if (requestId !== requestIdRef.current) return;
      if (queryError) {
        const missingTable = queryError.code === '42P01' || queryError.code === 'PGRST205';
        const missingColumns = queryError.code === '42703' || queryError.code === 'PGRST204';
        throw new Error(missingTable || missingColumns
          ? 'Feedback inbox setup is incomplete. Run supabase/feedback_setup.sql and supabase/feedback_responses.sql in the Supabase SQL Editor.'
          : queryError.message || 'Could not load your feedback.');
      }

      const rows = Array.isArray(data) ? data : [];
      let replies = [];
      try {
        replies = await loadFeedbackReplies(rows.map((item) => item.id));
      } catch (repliesError) {
        const missingTable = repliesError.code === '42P01' || repliesError.code === 'PGRST205';
        throw new Error(missingTable
          ? 'Feedback conversations are not set up yet. Run supabase/feedback_conversations.sql in the Supabase SQL Editor.'
          : repliesError.message || 'Could not load conversation replies.');
      }
      if (requestId !== requestIdRef.current) return;
      const repliesByFeedback = new Map();
      replies.forEach((reply) => {
        const thread = repliesByFeedback.get(reply.feedback_id) || [];
        thread.push(reply);
        repliesByFeedback.set(reply.feedback_id, thread);
      });
      const rowsWithReplies = rows.map((item) => ({ ...item, replies: repliesByFeedback.get(item.id) || [] }));
      if (before) {
        setItems((current) => {
          const ids = new Set(current.map((item) => item.id));
          return [...current, ...rowsWithReplies.filter((item) => !ids.has(item.id))];
        });
      } else {
        setItems(rowsWithReplies);
      }
      setHasMore(rows.length === PAGE_SIZE);
    } catch (loadError) {
      if (requestId === requestIdRef.current) setError(loadError.message || 'Could not load your feedback.');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  useEffect(() => {
    void refreshUnreadCount();
  }, [refreshUnreadCount]);

  async function toggleConversation(item) {
    const opening = openFeedbackId !== item.id;
    setOpenFeedbackId(opening ? item.id : null);
    if (!opening) return;
    try {
      const latestReplies = await loadFeedbackReplies([item.id]);
      await markFeedbackRepliesRead(item.id);
      const markedAt = new Date().toISOString();
      setItems((current) => current.map((entry) => entry.id !== item.id ? entry : ({
        ...entry,
        replies: latestReplies.map((reply) => reply.author_role === 'admin' && !reply.user_read_at
          ? { ...reply, user_read_at: markedAt }
          : reply),
      })));
      await refreshUnreadCount();
    } catch (readError) {
      setError(readError.message || 'Could not update the conversation read status.');
    }
  }

  async function replyToFeedback(feedbackId, replyText) {
    setSendingReplyId(feedbackId);
    setError('');
    try {
      await sendUserFeedbackReply(feedbackId, replyText);
      const latestReplies = await loadFeedbackReplies([feedbackId]);
      setItems((current) => current.map((item) => item.id !== feedbackId ? item : ({
        ...item,
        status: item.status === 'resolved' ? 'in_review' : item.status,
        replies: latestReplies,
      })));
      await refreshUnreadCount();
      return true;
    } catch (replyError) {
      const missingFunction = replyError.code === 'PGRST202' || replyError.code === '42883';
      setError(missingFunction
        ? 'Feedback conversations are not set up yet. Run supabase/feedback_conversations.sql in the Supabase SQL Editor.'
        : replyError.message || 'Could not send your reply.');
      return false;
    } finally {
      setSendingReplyId(null);
    }
  }

  async function submitFeedback(event) {
    event.preventDefault();
    setError('');
    setNotice(null);
    const cleanMessage = message.trim();
    if (!user?.id) {
      setError('Sign in before sending feedback.');
      return;
    }
    if (cleanMessage.length < 10 || cleanMessage.length > 2000) {
      setError('Please write between 10 and 2,000 characters.');
      return;
    }

    setSending(true);
    try {
      const { data, error: insertError } = await supabase
        .from('feedback_messages')
        .insert({
          user_id: user.id,
          user_email: user.email || null,
          category,
          message: cleanMessage,
        })
        .select('id, category, message, status, created_at, admin_response, responded_at')
        .single();
      if (insertError) {
        const missingTable = insertError.code === '42P01' || insertError.code === 'PGRST205';
        const missingColumns = insertError.code === '42703' || insertError.code === 'PGRST204';
        throw new Error(missingTable
          ? 'Feedback is not set up yet. Run supabase/feedback_setup.sql in the Supabase SQL Editor.'
          : missingColumns
            ? 'Feedback replies are not set up yet. Run supabase/feedback_responses.sql in the Supabase SQL Editor.'
          : insertError.message || 'Could not send feedback.');
      }

      setItems((current) => [data, ...current]);
      setMessage('');
      setCategory('general');
      setNotice({ type: 'success', text: 'Your feedback has been sent. You can follow its status and replies below.' });
      void recordUserActivity('feedback_submitted').catch(() => {});
    } catch (submitError) {
      setError(submitError.message || 'Could not send feedback. Please try again.');
    } finally {
      setSending(false);
    }
  }

  const counts = useMemo(() => ({
    all: items.length,
    new: items.filter((item) => item.status === 'new').length,
    in_review: items.filter((item) => item.status === 'in_review').length,
    resolved: items.filter((item) => item.status === 'resolved').length,
  }), [items]);

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => (
      (filter === 'all' || item.status === filter)
      && (!term || `${item.message} ${item.admin_response || ''} ${CATEGORY_LABELS[item.category] || item.category}`.toLowerCase().includes(term))
    ));
  }, [items, filter, search]);

  return (
    <section className="user-feedback-center panel" id="feedback" aria-labelledby="user-feedback-title">
      <header className="user-feedback-heading">
        <div className="user-feedback-heading-copy">
          <span className="user-feedback-heading-icon"><MessageSquareText size={19} aria-hidden="true" /></span>
          <div>
            <p className="eyebrow">SUPPORT &amp; IDEAS</p>
            <h2 id="user-feedback-title">Feedback {unreadCount > 0 && <span className="user-feedback-unread-count">{unreadCount > 99 ? '99+' : unreadCount} new</span>}</h2>
            <p>Send a note to the ExpenseNest team and follow its progress here.</p>
          </div>
        </div>
        <button type="button" className="user-feedback-refresh" onClick={() => loadPage()} disabled={loading} aria-label="Refresh my feedback">
          <RefreshCw size={15} className={loading ? 'is-spinning' : ''} />
          <span>Refresh</span>
        </button>
      </header>

      {!user?.id ? (
        <div className="user-feedback-signin"><ShieldCheck size={18} /><p>{error}</p><a href="/">Sign in</a></div>
      ) : (
        <div className="user-feedback-grid">
          <form className="user-feedback-compose" onSubmit={submitFeedback}>
            <div className="user-feedback-compose-heading"><span><Send size={16} /></span><div><h3>Send feedback</h3><p>Tell us what would make your experience better.</p></div></div>
            <label className="user-feedback-field">
              <span>Feedback type</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)} disabled={sending}>
                <option value="general">General feedback</option>
                <option value="idea">Feature idea</option>
                <option value="bug">Report a problem</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="user-feedback-field">
              <span>Your message</span>
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Describe your idea or what happened…" minLength={10} maxLength={2000} rows={6} required disabled={sending} />
              <small className="user-feedback-character-count">{message.length}/2,000</small>
            </label>
            <p className="user-feedback-privacy"><ShieldCheck size={13} /> Your message is visible to the ExpenseNest support team and to you. Avoid including passwords or bank details.</p>
            {error && <div className="user-feedback-notice error" role="alert"><AlertCircle size={15} />{error}</div>}
            {notice && <div className="user-feedback-notice success" role="status"><CheckCircle2 size={15} />{notice.text}</div>}
            <button type="submit" className="user-feedback-submit" disabled={sending || message.trim().length < 10}>
              {sending ? <><LoaderCircle size={15} className="is-spinning" /> Sending…</> : <><Send size={15} /> Send feedback</>}
            </button>
          </form>

          <div className="user-feedback-inbox">
            <div className="user-feedback-inbox-heading">
              <div><p className="eyebrow">YOUR SUBMISSIONS</p><h3>My feedback</h3></div>
              <span className="user-feedback-total">{counts.all} loaded</span>
            </div>
            <div className="user-feedback-toolbar">
              <label className="user-feedback-search"><Search size={14} /><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search my feedback" aria-label="Search my feedback" /></label>
              <label className="user-feedback-filter"><Filter size={14} /><select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter my feedback status">
                <option value="all">All statuses ({counts.all})</option>
                <option value="new">Received ({counts.new})</option>
                <option value="in_review">In review ({counts.in_review})</option>
                <option value="resolved">Resolved ({counts.resolved})</option>
              </select></label>
            </div>

            {error && !user?.id && <div className="user-feedback-notice error" role="alert"><AlertCircle size={15} />{error}</div>}
            {loading ? (
              <div className="user-feedback-state"><LoaderCircle size={18} className="is-spinning" /> Loading your feedback…</div>
            ) : visibleItems.length === 0 ? (
              <div className="user-feedback-empty"><MessageSquareText size={21} /><strong>{items.length ? 'No matching messages' : 'Nothing here yet'}</strong><small>{items.length ? 'Try another status or search phrase.' : 'Your submissions and team replies will appear here.'}</small></div>
            ) : (
              <div className="user-feedback-list">
                {visibleItems.map((item) => (
                  <UserFeedbackThread
                    key={item.id}
                    item={item}
                    open={openFeedbackId === item.id}
                    unread={item.replies?.filter((reply) => reply.author_role === 'admin' && !reply.user_read_at).length || 0}
                    sending={sendingReplyId === item.id}
                    onToggle={() => toggleConversation(item)}
                    onReply={(text) => replyToFeedback(item.id, text)}
                  />
                ))}
              </div>
            )}
            {!loading && hasMore && <button type="button" className="user-feedback-load-more" onClick={() => loadPage(items.at(-1))} disabled={loadingMore}>{loadingMore ? <><LoaderCircle size={14} className="is-spinning" /> Loading…</> : <><ArrowDown size={14} /> Load older feedback</>}</button>}
            {!error && <p className="user-feedback-footnote"><ShieldCheck size={13} /> Only you can see your submissions and replies in your account.</p>}
          </div>
        </div>
      )}
    </section>
  );
}

function UserFeedbackThread({ item, open, unread, sending, onToggle, onReply }) {
  const [draft, setDraft] = useState('');
  const [replyError, setReplyError] = useState('');
  const [replySent, setReplySent] = useState(false);

  async function submitReply(event) {
    event.preventDefault();
    const cleanText = draft.trim();
    if (!cleanText || cleanText.length > 2000) {
      setReplyError('Write a reply between 1 and 2,000 characters.');
      return;
    }
    setReplyError('');
    const sent = await onReply(cleanText);
    if (sent) {
      setDraft('');
      setReplySent(true);
      window.setTimeout(() => setReplySent(false), 2500);
    }
  }

  return (
    <article className="user-feedback-entry">
      <div className="user-feedback-entry-top">
        <span className={`user-feedback-status status-${item.status}`}>{STATUS_LABELS[item.status] || item.status}</span>
        <time dateTime={item.created_at}><Clock3 size={12} />{formatAppDateTime(item.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}</time>
      </div>
      <div className="user-feedback-entry-meta"><span>{CATEGORY_LABELS[item.category] || 'General'}</span><span>#{String(item.id).slice(0, 8)}</span></div>
      <p className="user-feedback-message">{item.message}</p>
      <button type="button" className="user-feedback-thread-toggle" onClick={onToggle} aria-expanded={open}>
        <MessageCircle size={14} />
        <span>{open ? 'Hide conversation' : `Conversation · ${(item.replies || []).length} ${(item.replies || []).length === 1 ? 'reply' : 'replies'}`}</span>
        {unread > 0 && !open && <span className="user-feedback-thread-unread">{unread} new</span>}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && (
        <div className="user-feedback-thread">
          <div className="user-feedback-thread-message from-user">
            <div><strong>You</strong><time dateTime={item.created_at}>{formatAppDateTime(item.created_at, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</time></div>
            <p>{item.message}</p>
          </div>
          {(item.replies || []).map((reply) => (
            <div className={`user-feedback-thread-message${reply.author_role === 'admin' ? ' from-support' : ' from-user'}`} key={reply.id}>
              <div><strong>{reply.author_role === 'admin' ? 'ExpenseNest support' : 'You'}</strong><time dateTime={reply.created_at}>{formatAppDateTime(reply.created_at, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}</time></div>
              <p>{reply.message}</p>
            </div>
          ))}
          <form className="user-feedback-thread-reply" onSubmit={submitReply}>
            <label htmlFor={`feedback-reply-${item.id}`}>Reply to this conversation</label>
            <textarea id={`feedback-reply-${item.id}`} value={draft} onChange={(event) => setDraft(event.target.value)} rows={3} maxLength={2000} placeholder="Add details or answer the support team…" disabled={sending} />
            <div><small>{draft.length}/2,000</small><button type="submit" disabled={sending || !draft.trim()}>{sending ? <><LoaderCircle size={13} className="is-spinning" /> Sending…</> : <><Send size={13} /> Send reply</>}</button></div>
            {replyError && <p className="user-feedback-thread-error" role="alert">{replyError}</p>}
            {replySent && <p className="user-feedback-thread-success" role="status">Reply sent. The support team can now see it.</p>}
          </form>
        </div>
      )}
    </article>
  );
}
