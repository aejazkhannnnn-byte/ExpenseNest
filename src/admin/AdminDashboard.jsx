import { Component, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock3,
  Copy,
  Database,
  Download,
  Eye,
  Filter,
  History,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Mail,
  MessageCircle,
  MessageSquareText,
  RefreshCw,
  RotateCcw,
  Search,
  SearchX,
  Send,
  Settings2,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react';
import { supabase } from '../supabase';
import BrandAsset from '../components/BrandAsset.jsx';
import { CURRENCIES } from '../currency';
import { DATE_FORMAT_OPTIONS, formatAppDate, formatAppDateTime } from '../dateFormatting';
import { loadMoreAdminActivity } from '../activityLog';
import { getFeedbackUnreadCount, loadFeedbackReplies, markFeedbackRepliesRead, sendAdminFeedbackReply } from '../feedbackConversations';
import AdminThemeControl from './AdminThemeControl';
import './AdminDashboard.css';

const MENU = [
  { name: 'Overview', icon: LayoutDashboard },
  { name: 'Users', icon: UsersRound },
  { name: 'Analytics', icon: BarChart3 },
  { name: 'Feedback', icon: MessageSquareText },
  { name: 'Activity', icon: History },
  { name: 'Settings', icon: Settings2 },
];

const SECTION_COPY = {
  Overview: 'A clear view of your platform activity.',
  Users: 'Review registered accounts and their access to ExpenseNest.',
  Analytics: 'Server-counted signups, feedback, and shared-family activity.',
  Feedback: 'Read user submissions, reply in-app, and manage resolution status.',
  Activity: 'Admin sessions, settings, account access decisions, and feedback updates.',
  Settings: 'Admin account and service status.',
};

const SUSPENSION_DURATIONS = [
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'indefinite', label: 'Indefinitely' },
];

function suspensionDurationLabel(value) {
  return SUSPENSION_DURATIONS.find((option) => option.value === value)?.label || 'Indefinitely';
}

function suspensionExpiryLabel(value) {
  if (!value) return 'No automatic restore date';
  const expiry = new Date(value);
  if (Number.isNaN(expiry.getTime())) return 'Restore date unavailable';
  if (expiry.getTime() - Date.now() > 5 * 365 * 24 * 60 * 60 * 1000) {
    return 'No automatic restore date';
  }
  return `Access restores ${formatDateTime(value)}`;
}

function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat('en-IN').format(number) : value;
}

function formatDate(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  return value ? formatAppDate(value, options) : 'Not available';
}

function formatDateTime(value) {
  return value ? formatAppDateTime(value, { day: 'numeric', month: 'long', year: 'numeric' }) : 'Not available';
}

function isUserSuspended(user) {
  if (user?.banned_until) {
    const banExpiresAt = new Date(user.banned_until).getTime();
    if (Number.isFinite(banExpiresAt)) return banExpiresAt > Date.now();
  }
  return String(user?.status || '').toLowerCase() === 'suspended';
}

function localDateValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function feedbackCursorFilter(cursor) {
  if (!cursor?.created_at || !cursor?.id) return null;
  return `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`;
}

function periodComparison(currentValue, previousValue, days, metric = 'signups') {
  const current = Number(currentValue || 0);
  const previous = Number(previousValue || 0);
  if (previous === 0) return current === 0
    ? `No ${metric} in this or previous ${days}-day period`
    : `No ${metric} in the previous ${days}-day period`;
  const change = Math.round(((current - previous) / previous) * 100);
  return `${change > 0 ? '+' : ''}${change}% vs previous ${days} days`;
}

function csvCell(value) {
  const text = String(value ?? '');
  const safeText = /^[\u0000-\u0020]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}

function getMonthlyRegistrations(users) {
  const months = [];
  const now = new Date();

  for (let offset = 5; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    const count = users.reduce((total, user) => {
      if (!user.created_at) return total;
      const created = new Date(user.created_at);
      return created.getFullYear() === date.getFullYear() && created.getMonth() === date.getMonth()
        ? total + 1
        : total;
    }, 0);

    months.push({
      key: `${date.getFullYear()}-${date.getMonth()}`,
      label: date.toLocaleDateString('en-IN', { month: 'short' }),
      count,
    });
  }

  return months;
}

function MetricCard({ icon: Icon, title, value, note, tone }) {
  return (
    <article className={`admin-metric-card tone-${tone}`}>
      <div className="admin-metric-top">
        <span className="admin-metric-icon"><Icon size={19} strokeWidth={1.8} /></span>
        <span className="admin-metric-arrow"><ArrowUpRight size={16} /></span>
      </div>
      <p>{title}</p>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

function RegistrationChart({ months, compact = false }) {
  const maximum = Math.max(1, ...months.map((month) => month.count));

  return (
    <div className={`admin-chart${compact ? ' compact' : ''}`} role="group" aria-label="Monthly user registrations for the last six months">
      <div className="admin-chart-grid-lines" aria-hidden="true">
        <span /><span /><span /><span />
      </div>
      <div className="admin-chart-columns">
        {months.map((month) => (
          <div className="admin-chart-column" key={month.key} title={`${month.count} registrations in ${month.label}`} aria-label={`${month.label}: ${month.count} registrations`}>
            <div className="admin-chart-value">{month.count}</div>
            <div className="admin-chart-bar-track">
              <div
                className="admin-chart-bar"
                style={{ height: `${month.count === 0 ? 4 : Math.max(12, (month.count / maximum) * 100)}%` }}
              />
            </div>
            <span>{month.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ActiveAccountsChart({ days }) {
  const values = Array.isArray(days) ? days : [];
  const maximum = Math.max(1, ...values.map((day) => Number(day.count) || 0));
  const plotWidth = 760;
  const baseline = 166;
  const plotHeight = 132;
  const slotWidth = plotWidth / Math.max(values.length, 1);
  const barWidth = Math.max(2, Math.min(18, slotWidth * 0.58));
  const labelStep = Math.max(1, Math.ceil(values.length / 7));

  return (
    <div className="admin-active-chart">
      <svg viewBox="0 0 800 210" role="img" aria-label="Daily unique accounts that opened ExpenseNest">
        <defs>
          <linearGradient id="activeAccountBar" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#7d8bff" />
            <stop offset="100%" stopColor="#37c7a7" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3].map((line) => {
          const y = 34 + (line * 44);
          return <line key={line} x1="18" x2="782" y1={y} y2={y} className="admin-active-chart-grid" />;
        })}
        {values.map((day, index) => {
          const count = Number(day.count) || 0;
          const height = count ? Math.max(3, (count / maximum) * plotHeight) : 2;
          const x = 20 + index * slotWidth + ((slotWidth - barWidth) / 2);
          const y = baseline - height;
          const showLabel = index % labelStep === 0 || index === values.length - 1;
          return (
            <g key={day.date}>
              <rect x={x} y={y} width={barWidth} height={height} rx="2" fill="url(#activeAccountBar)">
                <title>{`${day.label}: ${count} active ${count === 1 ? 'account' : 'accounts'}`}</title>
              </rect>
              {showLabel && <text x={x + (barWidth / 2)} y="194" textAnchor="middle" className="admin-active-chart-label">{day.label}</text>}
            </g>
          );
        })}
      </svg>
      <div className="admin-active-chart-note">
        <span><i /> Daily unique accounts</span>
        <span>Tracking begins after the analytics update is deployed.</span>
      </div>
    </div>
  );
}

class AdminSectionErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error(`Admin ${this.props.sectionName} section failed to render:`, error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <section className="admin-error-state admin-section-render-error" role="alert">
          <span className="admin-empty-icon"><CircleAlert size={22} /></span>
          <h2>{this.props.sectionName} could not load</h2>
          <p>{this.state.error.message || 'An unexpected page error occurred.'}</p>
          <button type="button" className="admin-primary-button" onClick={() => window.location.reload()}>
            <RefreshCw size={16} /> Reload admin page
          </button>
        </section>
      );
    }
    return this.props.children;
  }
}

export default function AdminDashboard({ onLogout, adminUser, theme, onThemeChange, currency, onCurrencyChange, dateFormat, onDateFormatChange, density, onDensityChange, privacyMode, onPrivacyModeChange, weekStart, onWeekStartChange, motionPreference, onMotionPreferenceChange, onResetPreferences }) {
  const [section, setSection] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [userDisplayIdWarning, setUserDisplayIdWarning] = useState('');
  const [userAccessSetupWarning, setUserAccessSetupWarning] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [toast, setToast] = useState('');
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackLoadingMore, setFeedbackLoadingMore] = useState(false);
  const [feedbackHasMore, setFeedbackHasMore] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState('');
  const [feedbackUnreadCount, setFeedbackUnreadCount] = useState(0);
  const [feedbackAssignees, setFeedbackAssignees] = useState([]);
  const [feedbackTriageError, setFeedbackTriageError] = useState('');
  const [feedbackFilter, setFeedbackFilter] = useState('all');
  const [updatingFeedbackId, setUpdatingFeedbackId] = useState(null);
  const [activityItems, setActivityItems] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityLoadingMore, setActivityLoadingMore] = useState(false);
  const [activityHasMore, setActivityHasMore] = useState(false);
  const [activityError, setActivityError] = useState('');
  const activityCursorRef = useRef(null);
  const [analyticsRange, setAnalyticsRange] = useState(30);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsError, setAnalyticsError] = useState('');
  const feedbackCursorRef = useRef(null);

  const refreshFeedbackUnreadCount = useCallback(async () => {
    try {
      setFeedbackUnreadCount(await getFeedbackUnreadCount());
    } catch {
      // The conversation migration may not yet be present in the database.
    }
  }, []);

  const loadFeedbackAssignees = useCallback(async () => {
    const { data, error: assigneeError } = await supabase.rpc('get_feedback_assignees');
    if (assigneeError) {
      const missingFunction = assigneeError.code === 'PGRST202' || assigneeError.code === '42883';
      setFeedbackTriageError(missingFunction
        ? 'Assignment and priority tools are not set up. Run supabase/feedback_triage.sql in the Supabase SQL Editor after the conversation migration.'
        : assigneeError.message || 'Could not load admin assignees.');
      setFeedbackAssignees([]);
      return;
    }
    setFeedbackTriageError('');
    setFeedbackAssignees(Array.isArray(data) ? data : []);
  }, []);

  const adminEmail = adminUser?.email || '';
  const adminName = adminUser?.user_metadata?.full_name || adminEmail.split('@')[0] || 'Admin';
  const adminInitial = (adminName || 'A').charAt(0).toUpperCase();
  const feedbackBusy = feedbackLoading || feedbackLoadingMore;
  const activityBusy = activityLoading || activityLoadingMore;

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!sessionData.session) throw new Error('Your session has expired. Please sign in again.');

      const { data, error: functionError } = await supabase.functions.invoke('admin-dashboard');
      if (functionError) throw functionError;
      if (!data?.success) throw new Error(data?.message || 'The admin data service could not load dashboard data.');

      const dashboardUsers = Array.isArray(data.users)
        ? data.users.filter((user) => user && typeof user === 'object')
        : [];
      const { data: displayIdRows, error: displayIdError } = await supabase
        .from('user_display_ids')
        .select('user_id, display_id');
      const [
        { data: suspendedRows, error: suspendedError },
        { error: accountAccessError },
      ] = await Promise.all([
        supabase.rpc('get_admin_user_suspensions'),
        supabase.rpc('is_account_allowed'),
      ]);
      const displayIds = new Map((displayIdRows || []).map((row) => [row.user_id, row.display_id]));
      const suspendedUsers = new Map((suspendedRows || []).map((row) => [row.user_id, row.banned_until]));

      setStats(data.stats || {});
      setUsers(dashboardUsers.map((user) => ({
        ...user,
        banned_until: suspendedUsers.get(user.id || user.user_id) || user.banned_until || null,
        status: isUserSuspended({ ...user, banned_until: suspendedUsers.get(user.id || user.user_id) || user.banned_until })
          ? 'Suspended'
          : String(user.status || '').toLowerCase() === 'suspended' ? 'Registered' : user.status || 'Registered',
        display_id: displayIds.get(user.id || user.user_id) || '',
      })));
      setUserDisplayIdWarning(displayIdError
        ? 'Short IDs are not set up yet. Run supabase/user_display_ids.sql in the Supabase SQL Editor.'
        : '');
      setUserAccessSetupWarning(suspendedError || accountAccessError
        ? 'Account access protection needs setup. Run supabase/admin_user_actions.sql and supabase/suspended_account_access.sql in the Supabase SQL Editor.'
        : '');
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Dashboard loading failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFeedback = useCallback(async (append = false) => {
    if (append && !feedbackCursorRef.current) return;
    if (append) setFeedbackLoadingMore(true);
    else setFeedbackLoading(true);
    setFeedbackError('');
    setFeedbackNotice('');

    try {
      let query = supabase
        .from('feedback_messages')
        .select('id, user_id, user_email, category, message, status, created_at, admin_response, responded_at, admin_read_at')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(100);
      const cursor = feedbackCursorFilter(append ? feedbackCursorRef.current : null);
      if (cursor) query = query.or(cursor);
      const { data, error: queryError } = await query;

      if (queryError) {
        const missingTable = queryError.code === '42P01' || queryError.code === 'PGRST205';
        throw new Error(missingTable
          ? 'Feedback inbox is not set up yet. Run supabase/feedback_setup.sql in the Supabase SQL Editor.'
          : queryError.code === '42703' || queryError.code === 'PGRST204'
            ? 'Feedback conversations are not set up yet. Run supabase/feedback_conversations.sql in the Supabase SQL Editor.'
          : queryError.message || 'Could not load feedback.');
      }

      const rows = Array.isArray(data) ? data : [];
      let triageByFeedback = new Map();
      if (rows.length) {
        const { data: triageRows, error: triageQueryError } = await supabase
          .from('feedback_triage')
          .select('feedback_id, assigned_to, priority')
          .in('feedback_id', rows.map((item) => item.id));
        if (triageQueryError) {
          setFeedbackTriageError(triageQueryError.code === '42P01' || triageQueryError.code === 'PGRST205'
            ? 'Assignment and priority tools are not set up. Run supabase/feedback_triage.sql in the Supabase SQL Editor.'
            : triageQueryError.message || 'Could not load feedback assignments.');
        } else {
          setFeedbackTriageError('');
          triageByFeedback = new Map((triageRows || []).map((item) => [item.feedback_id, item]));
        }
      }
      let replies = [];
      try {
        replies = await loadFeedbackReplies(rows.map((item) => item.id));
      } catch (replyError) {
        const missingTable = replyError.code === '42P01' || replyError.code === 'PGRST205';
        throw new Error(missingTable
          ? 'Feedback conversations are not set up yet. Run supabase/feedback_conversations.sql in the Supabase SQL Editor.'
          : replyError.message || 'Could not load feedback conversations.');
      }
      const repliesByFeedback = new Map();
      replies.forEach((reply) => {
        const thread = repliesByFeedback.get(reply.feedback_id) || [];
        thread.push(reply);
        repliesByFeedback.set(reply.feedback_id, thread);
      });
      const rowsWithReplies = rows.map((item) => {
        const triage = triageByFeedback.get(item.id);
        return {
          ...item,
          assigned_to: triage?.assigned_to || null,
          priority: triage?.priority || 'normal',
          replies: repliesByFeedback.get(item.id) || [],
        };
      });
      if (append) {
        setFeedbackItems((current) => {
          const ids = new Set(current.map((item) => item.id));
          return [...current, ...rowsWithReplies.filter((item) => !ids.has(item.id))];
        });
      } else {
        setFeedbackItems(rowsWithReplies);
      }
      if (rows.length) feedbackCursorRef.current = rows.at(-1);
      else if (!append) feedbackCursorRef.current = null;
      setFeedbackHasMore(rows.length === 100);
      void refreshFeedbackUnreadCount();
    } catch (err) {
      setFeedbackError(err.message || 'Could not load feedback.');
    } finally {
      if (append) setFeedbackLoadingMore(false);
      else setFeedbackLoading(false);
    }
  }, [refreshFeedbackUnreadCount]);

  const loadActivity = useCallback(async (append = false) => {
    if (append && !activityCursorRef.current) return;
    if (append) setActivityLoadingMore(true);
    else setActivityLoading(true);
    setActivityError('');

    try {
      const rows = await loadMoreAdminActivity(append ? activityCursorRef.current : null, 100);
      if (append) {
        setActivityItems((current) => {
          const knownIds = new Set(current.map((item) => item.id));
          return [...current, ...rows.filter((item) => !knownIds.has(item.id))];
        });
      } else {
        setActivityItems(rows);
      }
      if (rows.length) activityCursorRef.current = rows.at(-1);
      else if (!append) activityCursorRef.current = null;
      setActivityHasMore(rows.length === 100);
    } catch (err) {
      const missingTable = err.code === '42P01' || err.code === 'PGRST205';
      setActivityError(missingTable
        ? 'Activity tracking is not fully set up. Run supabase/admin_activity_log.sql, supabase/admin_user_actions.sql, and supabase/admin_activity_tracking.sql in the Supabase SQL Editor.'
        : err.message || 'Could not load the activity log.');
    } finally {
      if (append) setActivityLoadingMore(false);
      else setActivityLoading(false);
    }
  }, []);

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    setAnalyticsError('');

    try {
      const toDate = new Date();
      const fromDate = new Date(toDate);
      fromDate.setDate(fromDate.getDate() - analyticsRange + 1);

      const { data, error: rpcError } = await supabase.rpc('get_admin_analytics', {
        _from_date: localDateValue(fromDate),
        _to_date: localDateValue(toDate),
      });

      if (rpcError) {
        const missingFunction = rpcError.code === 'PGRST202' || rpcError.code === '42883';
        throw new Error(missingFunction
          ? 'Admin analytics is not set up yet. Run supabase/admin_analytics.sql in the Supabase SQL Editor.'
          : rpcError.message || 'Could not load analytics.');
      }

      setAnalyticsData(data || null);
    } catch (err) {
      setAnalyticsError(err.message || 'Could not load analytics.');
    } finally {
      setAnalyticsLoading(false);
    }
  }, [analyticsRange]);

  async function updateFeedback(feedbackId, status, response = null) {
    setUpdatingFeedbackId(feedbackId);
    setFeedbackError('');
    setFeedbackNotice('');

    try {
      const { data, error: updateError } = await supabase.rpc('admin_update_feedback', {
        _feedback_id: feedbackId,
        _status: status,
        _response: response,
        _update_response: response !== null,
      });

      if (updateError) throw updateError;
      const updated = Array.isArray(data) ? data[0] : data;
      if (!updated?.id) throw new Error('The feedback update was not saved. Refresh and try again.');

      setFeedbackItems((current) => current.map((item) => (item.id === feedbackId ? { ...item, ...updated } : item)));
      setFeedbackNotice(response !== null ? 'Reply saved. The user can now see it in their Feedback section.' : 'Feedback status updated.');
      return true;
    } catch (err) {
      const missingFunction = err.code === 'PGRST202' || err.code === '42883';
      setFeedbackError(missingFunction
        ? 'Feedback response tools are not set up yet. Run supabase/feedback_responses.sql in the Supabase SQL Editor.'
        : err.message || 'Could not update feedback.');
      return false;
    } finally {
      setUpdatingFeedbackId(null);
    }
  }

  function updateFeedbackStatus(feedbackId, status) {
    return updateFeedback(feedbackId, status);
  }

  function respondToFeedback(feedbackId, response, status) {
    return sendFeedbackReply(feedbackId, response, status);
  }

  async function sendFeedbackReply(feedbackId, message, status) {
    setUpdatingFeedbackId(feedbackId);
    setFeedbackError('');
    setFeedbackNotice('');
    try {
      const reply = await sendAdminFeedbackReply(feedbackId, message, status);
      if (!reply?.id) throw new Error('The reply was not saved. Refresh and try again.');
      setFeedbackItems((current) => current.map((item) => item.id !== feedbackId ? item : ({
        ...item,
        status,
        admin_response: message.trim(),
        responded_at: reply.created_at,
        responded_by: adminUser?.id || null,
        replies: [...(item.replies || []), reply],
      })));
      setFeedbackNotice('Reply sent in the feedback conversation.');
      await refreshFeedbackUnreadCount();
      return true;
    } catch (err) {
      const missingFunction = err.code === 'PGRST202' || err.code === '42883';
      setFeedbackError(missingFunction
        ? 'Feedback conversations are not set up yet. Run supabase/feedback_conversations.sql in the Supabase SQL Editor.'
        : err.message || 'Could not send the reply.');
      return false;
    } finally {
      setUpdatingFeedbackId(null);
    }
  }

  async function markAdminFeedbackRead(feedbackId) {
    try {
      const latestReplies = await loadFeedbackReplies([feedbackId]);
      await markFeedbackRepliesRead(feedbackId);
      const readAt = new Date().toISOString();
      setFeedbackItems((current) => current.map((item) => item.id !== feedbackId ? item : ({
        ...item,
        admin_read_at: item.admin_read_at || readAt,
        replies: latestReplies.map((reply) => reply.author_role === 'user' && !reply.admin_read_at
          ? { ...reply, admin_read_at: readAt }
          : reply),
      })));
      await refreshFeedbackUnreadCount();
    } catch (err) {
      setFeedbackError(err.message || 'Could not mark the conversation as read.');
    }
  }

  async function updateFeedbackTriage(feedbackId, assignedTo, priority) {
    setUpdatingFeedbackId(feedbackId);
    setFeedbackError('');
    setFeedbackNotice('');
    try {
      const { data, error: triageError } = await supabase.rpc('admin_update_feedback_triage', {
        _feedback_id: feedbackId,
        _assigned_to: assignedTo || null,
        _priority: priority,
      });
      if (triageError) throw triageError;
      const updated = Array.isArray(data) ? data[0] : data;
      if (!updated?.feedback_id) throw new Error('The assignment update was not saved. Refresh and try again.');
      setFeedbackItems((current) => current.map((item) => item.id !== feedbackId ? item : ({
        ...item,
        assigned_to: updated.assigned_to || null,
        priority: updated.priority || 'normal',
      })));
      setFeedbackTriageError('');
      setFeedbackNotice('Assignment and priority saved.');
      return true;
    } catch (err) {
      const missingFunction = err.code === 'PGRST202' || err.code === '42883';
      setFeedbackTriageError(missingFunction
        ? 'Assignment and priority tools are not set up. Run supabase/feedback_triage.sql in the Supabase SQL Editor.'
        : err.message || 'Could not update feedback assignment.');
      return false;
    } finally {
      setUpdatingFeedbackId(null);
    }
  }

  async function updateUserSignInAccess(user, action, suspensionDuration) {
    const userId = user.id || user.user_id;
    const { data, error: functionError } = await supabase.functions.invoke('admin-user-actions', {
      body: {
        user_id: userId,
        action,
        ...(action === 'suspend' ? { suspension_duration: suspensionDuration } : {}),
      },
    });

    if (functionError) {
      let message = functionError.message || 'The account action service could not be reached.';
      try {
        const response = functionError.context;
        if (response instanceof Response) {
          if (response.status === 404) {
            message = 'Deploy supabase/functions/admin-user-actions and configure its server secret before using this control.';
          } else {
            const responseBody = await response.clone().json();
            message = responseBody?.message || message;
          }
        }
      } catch {
        // Keep the Functions client message when the response has no JSON body.
      }
      throw new Error(message);
    }
    if (!data?.success) throw new Error(data?.message || 'The account access change was not applied.');

    const nextUser = {
      ...user,
      status: action === 'suspend' ? 'Suspended' : 'Registered',
      banned_until: data.banned_until || null,
    };
    setUsers((current) => current.map((item) => (
      (item.id || item.user_id) === userId ? { ...item, ...nextUser } : item
    )));
    setSelectedUser(nextUser);
    const durationUnsupported = action === 'suspend' && data.suspension_duration !== suspensionDuration;
    setToast(data.audit_warning
      ? 'Access changed; audit entry needs review'
      : durationUnsupported
        ? 'Account was blocked indefinitely; deploy the updated action function for timed access'
        : action === 'suspend' ? `Account suspended for ${suspensionDurationLabel(suspensionDuration)}` : 'Account access restored');
    await loadActivity();
    return { ...data, durationUnsupported };
  }

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  useEffect(() => {
    void loadFeedbackAssignees();
  }, [loadFeedbackAssignees]);

  useEffect(() => {
    const refresh = () => { void refreshFeedbackUnreadCount(); };
    refresh();
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 45000);
    return () => {
      window.removeEventListener('focus', refresh);
      window.clearInterval(timer);
    };
  }, [refreshFeedbackUnreadCount]);

  useEffect(() => {
    if (section === 'Feedback') loadFeedback();
  }, [section, loadFeedback]);

  useEffect(() => {
    if (section === 'Activity') loadActivity();
  }, [section, loadActivity]);

  useEffect(() => {
    if (section === 'Analytics') loadAnalytics();
  }, [section, loadAnalytics]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(''), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!selectedUser) return undefined;
    function closeOnEscape(event) {
      if (event.key === 'Escape') setSelectedUser(null);
    }
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedUser]);

  const monthlyRegistrations = useMemo(() => getMonthlyRegistrations(users), [users]);
  const recentUsers = useMemo(() => [...users]
    .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
    .slice(0, 5), [users]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const matchesSearch = !query || [user.email, user.display_id, user.id, user.user_id]
        .some((value) => String(value || '').toLowerCase().includes(query));
      const status = isUserSuspended(user) ? 'suspended' : 'registered';
      const matchesFilter = filter === 'All' || status === filter.toLowerCase();
      return matchesSearch && matchesFilter;
    });
  }, [users, search, filter]);

  const unreadFeedbackCount = feedbackUnreadCount;

  const currentMonthCount = monthlyRegistrations[monthlyRegistrations.length - 1]?.count ?? 0;
  const metrics = [
    {
      title: 'Total users',
      value: formatNumber(stats?.totalUsers ?? users.length),
      note: stats?.totalUsers !== undefined ? 'All registered accounts' : 'Accounts returned by admin service',
      icon: UsersRound,
      tone: 'violet',
    },
    {
      title: 'New this month',
      value: formatNumber(stats?.newUsers ?? currentMonthCount),
      note: stats?.newUsers !== undefined ? 'Reported by admin service' : 'Counted from loaded user records',
      icon: Activity,
      tone: 'mint',
    },
    {
      title: 'Active users',
      value: formatNumber(stats?.activeUsers),
      note: stats?.activeUsers !== undefined ? 'Reported by admin service' : 'Not provided by current data service',
      icon: Eye,
      tone: 'blue',
    },
    {
      title: 'Page views',
      value: formatNumber(stats?.pageViews),
      note: stats?.pageViews !== undefined ? 'Reported by admin service' : 'Analytics source not connected',
      icon: BarChart3,
      tone: 'amber',
    },
  ];

  function navigateTo(target) {
    setSection(target);
    setSearch('');
    setFilter('All');
    setSelectedUser(null);
  }

  async function copyUserInfo(value, label) {
    if (!value) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard is unavailable in this browser.');
      await navigator.clipboard.writeText(value);
      setToast(`${label} copied`);
    } catch {
      setToast('Could not copy. You can select the text and copy it manually.');
    }
  }

  function exportUsersCsv(exportedUsers) {
    if (!exportedUsers.length) return;
    const rows = [
      ['Email', 'User ID', 'Registration date', 'Status'],
      ...exportedUsers.map((user) => [
        user.email || '',
        user.display_id || user.id || user.user_id || '',
        user.created_at || '',
        user.status || 'Registered',
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `ExpenseNest_users_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    setToast(`Exported ${exportedUsers.length} visible user${exportedUsers.length === 1 ? '' : 's'}`);
  }

  const loadingFirstTime = loading && !lastUpdated;
  const hasLoadedData = Boolean(lastUpdated);

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar" aria-label="Admin navigation">
        <a className="admin-brand" href="/admin" aria-label="ExpenseNest admin home">
          <span className="admin-brand-mark"><BrandAsset /></span>
          <span className="admin-brand-copy"><strong>ExpenseNest</strong><small>ADMIN CONSOLE</small></span>
        </a>

        <div className="admin-sidebar-label">WORKSPACE</div>
        <nav className="admin-navigation">
          {MENU.map((item) => {
            const Icon = item.icon;
            const active = section === item.name;
            return (
              <button
                type="button"
                key={item.name}
                className={`admin-menu${active ? ' active' : ''}`}
                onClick={() => navigateTo(item.name)}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span>{item.name}</span>
                {item.name === 'Feedback' && unreadFeedbackCount > 0 && (
                  <span className="admin-menu-badge" aria-label={`${unreadFeedbackCount} unread feedback messages`}>
                    {unreadFeedbackCount > 99 ? '99+' : unreadFeedbackCount}
                  </span>
                )}
                {active && <span className="admin-menu-active-dot" />}
              </button>
            );
          })}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-security-card">
            <span className="security-card-icon"><ShieldCheck size={18} /></span>
            <div><strong>Protected workspace</strong><small>Admin access verified</small></div>
            <span className="security-live-dot" />
          </div>
          <div className="admin-profile-card">
            <span className="admin-avatar">{adminInitial}</span>
            <span className="admin-profile-copy"><strong>{adminName}</strong><small>{adminEmail || 'Administrator'}</small></span>
            <button type="button" className="admin-logout" onClick={onLogout} aria-label="Log out" title="Log out">
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      <div className="admin-main-shell">
        <header className="admin-topbar">
          <div className="admin-breadcrumb">
            <span>Workspace</span><ChevronRight size={14} /><strong>{section}</strong>
          </div>
          <div className="admin-topbar-actions">
            <span className={`admin-connection-pill${error && !hasLoadedData ? ' needs-attention' : ''}`}>
              <span />{error && !hasLoadedData ? 'Service issue' : 'Admin workspace'}
            </span>
            <AdminThemeControl theme={theme} onChange={onThemeChange} variant="topbar" />
            <button
              type="button"
              className="admin-refresh"
              onClick={section === 'Feedback' ? () => loadFeedback() : section === 'Activity' ? () => loadActivity() : section === 'Analytics' ? loadAnalytics : loadDashboard}
              disabled={section === 'Feedback' ? feedbackBusy : section === 'Activity' ? activityBusy : section === 'Analytics' ? analyticsLoading : loading}
            >
              <RefreshCw size={15} className={(section === 'Feedback' ? feedbackBusy : section === 'Activity' ? activityBusy : section === 'Analytics' ? analyticsLoading : loading) ? 'is-spinning' : ''} />
              <span>{(section === 'Feedback' ? feedbackBusy : section === 'Activity' ? activityBusy : section === 'Analytics' ? analyticsLoading : loading) ? 'Updating' : 'Refresh data'}</span>
            </button>
            <span className="admin-topbar-avatar" title={adminEmail || adminName}>{adminInitial}</span>
          </div>
        </header>

        <main className="admin-main">
          <div className="admin-page-heading">
            <div>
              <span className="admin-page-eyebrow">EXPENSENEST / ADMIN</span>
              <h1>{section}</h1>
              <p>{SECTION_COPY[section]}</p>
            </div>
            {lastUpdated && (
              <div className="admin-last-updated"><Clock3 size={14} /> Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}</div>
            )}
          </div>

          {error && (
            <div className="admin-alert" role="alert">
              <CircleAlert size={17} />
              <span>{error}</span>
              <button type="button" onClick={loadDashboard} disabled={loading}>Retry</button>
            </div>
          )}

          {loadingFirstTime ? (
            <div className="admin-loading-panel"><LoaderCircle size={24} className="is-spinning" /><span>Loading your admin workspace…</span></div>
          ) : error && !hasLoadedData ? (
            <div className="admin-error-state">
              <span className="admin-empty-icon"><Database size={22} /></span>
              <h2>Dashboard data is unavailable</h2>
              <p>Check the admin data service and try loading the dashboard again.</p>
              <button type="button" className="admin-primary-button" onClick={loadDashboard} disabled={loading}>
                <RefreshCw size={16} /> Try again
              </button>
            </div>
          ) : (
            <>
              {section === 'Overview' && (
                <OverviewSection
                  adminName={adminName}
                  metrics={metrics}
                  monthlyRegistrations={monthlyRegistrations}
                  recentUsers={recentUsers}
                  navigateTo={navigateTo}
                  onViewUser={setSelectedUser}
                  serviceReady={hasLoadedData}
                />
              )}

              {section === 'Users' && (
                <AdminSectionErrorBoundary sectionName="Users">
                  <UsersSection
                    users={filteredUsers}
                    loadedCount={users.length}
                    search={search}
                    setSearch={setSearch}
                    filter={filter}
                    setFilter={setFilter}
                    idSetupWarning={userDisplayIdWarning}
                    accessSetupWarning={userAccessSetupWarning}
                    onViewUser={setSelectedUser}
                    onExport={exportUsersCsv}
                  />
                </AdminSectionErrorBoundary>
              )}

              {section === 'Analytics' && (
                <AnalyticsSection
                  data={analyticsData}
                  loading={analyticsLoading}
                  error={analyticsError}
                  range={analyticsRange}
                  setRange={setAnalyticsRange}
                  onRefresh={loadAnalytics}
                />
              )}

              {section === 'Feedback' && (
                <FeedbackSection
                  items={feedbackItems}
                  loading={feedbackLoading}
                  error={feedbackError}
                  notice={feedbackNotice}
                  unreadCount={feedbackUnreadCount}
                  triageError={feedbackTriageError}
                  assignees={feedbackAssignees}
                  currentAdminId={adminUser?.id}
                  filter={feedbackFilter}
                  setFilter={setFeedbackFilter}
                  onRefresh={() => loadFeedback()}
                  onLoadMore={() => loadFeedback(true)}
                  hasMore={feedbackHasMore}
                  loadingMore={feedbackLoadingMore}
                  onUpdateStatus={updateFeedbackStatus}
                  onRespond={respondToFeedback}
                  onMarkRead={markAdminFeedbackRead}
                  onUpdateTriage={updateFeedbackTriage}
                  updatingId={updatingFeedbackId}
                />
              )}

              {section === 'Activity' && (
                <ActivitySection
                  items={activityItems}
                  loading={activityLoading}
                  loadingMore={activityLoadingMore}
                  error={activityError}
                  onRefresh={() => loadActivity()}
                  onLoadMore={() => loadActivity(true)}
                  hasMore={activityHasMore}
                />
              )}

              {section === 'Settings' && (
                <SettingsSection
                  adminName={adminName}
                  adminEmail={adminEmail}
                  serviceReady={hasLoadedData}
                  loading={loading}
                  theme={theme}
                  onThemeChange={onThemeChange}
                  currency={currency}
                  onCurrencyChange={onCurrencyChange}
                  dateFormat={dateFormat}
                  onDateFormatChange={onDateFormatChange}
                  density={density}
                  onDensityChange={onDensityChange}
                  privacyMode={privacyMode}
                  onPrivacyModeChange={onPrivacyModeChange}
                  weekStart={weekStart}
                  onWeekStartChange={onWeekStartChange}
                  motionPreference={motionPreference}
                  onMotionPreferenceChange={onMotionPreferenceChange}
                  onResetPreferences={onResetPreferences}
                />
              )}
            </>
          )}
        </main>
      </div>

      {toast && <div className="admin-toast" role="status"><Check size={16} />{toast}</div>}

      {selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onCopy={copyUserInfo}
          onAccountAction={updateUserSignInAccess}
          adminUserId={adminUser?.id}
          accessSetupWarning={userAccessSetupWarning}
        />
      )}
    </div>
  );
}

function OverviewSection({ adminName, metrics, monthlyRegistrations, recentUsers, navigateTo, onViewUser, serviceReady }) {
  const quickActions = [
    { label: 'Browse users', detail: 'Search registered accounts', icon: UsersRound, target: 'Users' },
    { label: 'Registration analytics', detail: 'Review the last six months', icon: BarChart3, target: 'Analytics' },
    { label: 'Admin settings', detail: 'Check workspace and service', icon: Settings2, target: 'Settings' },
  ];

  return (
    <div className="admin-page-content">
      <section className="admin-welcome-hero">
        <div className="admin-welcome-copy">
          <span className="admin-hero-kicker"><Sparkles size={14} /> ADMIN CONTROL CENTER</span>
          <h2>Welcome back, {adminName}</h2>
          <p>Keep track of registrations and manage your ExpenseNest workspace.</p>
          <button type="button" className="admin-hero-button" onClick={() => navigateTo('Users')}>
            Manage users <ArrowRight size={16} />
          </button>
        </div>
        <div className="admin-hero-art" aria-hidden="true">
          <div className="admin-hero-orbit orbit-one" />
          <div className="admin-hero-orbit orbit-two" />
          <div className="admin-hero-art-core"><LayoutDashboard size={36} /></div>
          <span className="admin-hero-float float-one"><UsersRound size={17} /></span>
          <span className="admin-hero-float float-two"><Activity size={17} /></span>
        </div>
      </section>

      <section className="admin-metrics-grid" aria-label="Platform metrics">
        {metrics.map((metric) => <MetricCard key={metric.title} {...metric} />)}
      </section>

      <div className="admin-overview-grid">
        <section className="admin-panel admin-registration-panel">
          <div className="admin-panel-heading">
            <div><span className="admin-panel-kicker">USER ACTIVITY</span><h2>Registration growth</h2><p>Monthly registrations from user records returned by the admin service.</p></div>
            <span className="admin-period-chip"><CalendarDays size={14} /> Last 6 months</span>
          </div>
          <RegistrationChart months={monthlyRegistrations} />
          <div className="admin-chart-footnote"><span className="chart-legend-dot" /> New accounts <span className="admin-chart-caption">Counts reflect the records currently available to this dashboard.</span></div>
        </section>

        <section className="admin-panel admin-quick-panel">
          <div className="admin-panel-heading"><div><span className="admin-panel-kicker">SHORTCUTS</span><h2>Quick actions</h2><p>Jump to a workspace area.</p></div></div>
          <div className="admin-quick-actions">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button type="button" className="admin-quick-action" key={action.target} onClick={() => navigateTo(action.target)}>
                  <span className="admin-quick-icon"><Icon size={18} /></span>
                  <span className="admin-quick-copy"><strong>{action.label}</strong><small>{action.detail}</small></span>
                  <ArrowRight size={16} className="admin-quick-arrow" />
                </button>
              );
            })}
          </div>
          <div className={`admin-service-note${serviceReady ? ' ready' : ''}`}>
            <span className="admin-service-indicator" />
            <span><strong>{serviceReady ? 'Dashboard service responding' : 'Waiting for dashboard service'}</strong><small>{serviceReady ? 'Latest data loaded successfully' : 'Data status has not been confirmed'}</small></span>
          </div>
        </section>
      </div>

      <section className="admin-panel admin-recent-panel">
        <div className="admin-panel-heading">
          <div><span className="admin-panel-kicker">LATEST ACCOUNTS</span><h2>Recent registrations</h2><p>The newest accounts returned by the admin service.</p></div>
          <button type="button" className="admin-text-button" onClick={() => navigateTo('Users')}>View all users <ArrowRight size={15} /></button>
        </div>
        <UserTable users={recentUsers} onViewUser={onViewUser} emptyTitle="No registrations yet" emptyMessage="New user accounts will appear here when available." />
      </section>
    </div>
  );
}

function UsersSection({ users, loadedCount, search, setSearch, filter, setFilter, idSetupWarning, accessSetupWarning, onViewUser, onExport }) {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [search, filter, startDate, endDate, pageSize]);

  const dateFilteredUsers = users.filter((user) => {
    const createdDate = String(user.created_at || '').slice(0, 10);
    if (startDate && (!createdDate || createdDate < startDate)) return false;
    if (endDate && (!createdDate || createdDate > endDate)) return false;
    return true;
  });
  const pageCount = Math.max(1, Math.ceil(dateFilteredUsers.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const firstResult = dateFilteredUsers.length ? ((currentPage - 1) * pageSize) + 1 : 0;
  const lastResult = Math.min(currentPage * pageSize, dateFilteredUsers.length);
  const pageUsers = dateFilteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <section className="admin-panel admin-users-panel">
      <div className="admin-panel-heading admin-users-heading">
        <div><span className="admin-panel-kicker">ACCOUNT DIRECTORY</span><h2>User management</h2><p>{dateFilteredUsers.length} matching {dateFilteredUsers.length === 1 ? 'account' : 'accounts'} in the loaded records</p></div>
        <div className="admin-users-heading-actions">
          <span className="admin-count-chip">{dateFilteredUsers.length} <small>match / {loadedCount} loaded</small></span>
          <button type="button" className="admin-export-button" onClick={() => onExport(dateFilteredUsers)} disabled={!dateFilteredUsers.length} title="Export all users matching the current search, status, and date filters">
            <Download size={14} /> Export results
          </button>
        </div>
      </div>
      <div className="admin-user-tools">
        <label className="admin-search-field">
          <Search size={17} />
          <input type="search" placeholder="Search email or user ID" value={search} onChange={(event) => setSearch(event.target.value)} aria-label="Search users by email or ID" />
          {search && <button type="button" onClick={() => setSearch('')} aria-label="Clear search"><X size={15} /></button>}
        </label>
        <label className="admin-filter-select">
          <Filter size={15} />
          <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter users by status">
            <option value="All">All statuses</option>
            <option value="Registered">Registered</option>
            <option value="Suspended">Suspended</option>
          </select>
        </label>
        <div className="admin-date-filter" aria-label="Filter users by registration date">
          <CalendarDays size={15} aria-hidden="true" />
          <label><span>From</span><input type="date" value={startDate} max={endDate || undefined} onChange={(event) => setStartDate(event.target.value)} aria-label="Registration date from" /></label>
          <label><span>To</span><input type="date" value={endDate} min={startDate || undefined} onChange={(event) => setEndDate(event.target.value)} aria-label="Registration date to" /></label>
        </div>
      </div>
      {idSetupWarning && <div className="admin-feedback-error admin-user-id-warning" role="status"><CircleAlert size={15} /><span>{idSetupWarning}</span></div>}
      {accessSetupWarning && <div className="admin-feedback-error admin-user-id-warning" role="status"><CircleAlert size={15} /><span>{accessSetupWarning}</span></div>}
      <UserTable users={pageUsers} onViewUser={onViewUser} emptyTitle="No users match these filters" emptyMessage="Try another search, status, or registration date range." />
      {dateFilteredUsers.length > 0 && (
        <nav className="admin-user-pagination" aria-label="User list pages">
          <span aria-live="polite">Showing {firstResult}–{lastResult} of {dateFilteredUsers.length}</span>
          <label>Rows per page
            <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))} aria-label="Rows per page">
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </label>
          <div className="admin-user-page-controls">
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage <= 1} aria-label="Previous page"><ChevronLeft size={15} /></button>
            <strong>Page {currentPage} of {pageCount}</strong>
            <button type="button" onClick={() => setPage((current) => Math.min(pageCount, current + 1))} disabled={currentPage >= pageCount} aria-label="Next page"><ChevronRight size={15} /></button>
          </div>
        </nav>
      )}
    </section>
  );
}

function AnalyticsSection({ data, loading, error, range, setRange, onRefresh }) {
  const registrationMonths = Array.isArray(data?.monthly_signups) ? data.monthly_signups : [];
  const activeTrackingReady = Array.isArray(data?.daily_active_users)
    && Number.isFinite(Number(data?.users?.active));
  const metrics = data ? [
    {
      title: `New users · ${data.period.days} days`,
      value: formatNumber(data.users.new),
      note: periodComparison(data.users.new, data.users.previous_new, data.period.days),
      icon: UsersRound,
      tone: 'violet',
    },
    {
      title: 'Total users',
      value: formatNumber(data.users.total),
      note: 'All registered accounts',
      icon: Activity,
      tone: 'mint',
    },
    {
      title: 'Active accounts',
      value: activeTrackingReady ? formatNumber(data.users.active) : '—',
      note: activeTrackingReady
        ? periodComparison(data.users.active, data.users.previous_active, data.period.days, 'active accounts')
        : 'Tracking setup required',
      icon: Activity,
      tone: 'blue',
    },
    {
      title: 'Returning accounts',
      value: activeTrackingReady ? formatNumber(data.users.returning) : '—',
      note: activeTrackingReady
        ? `${Number(data.users.returning_rate || 0).toFixed(1)}% of active accounts in this period`
        : 'Tracking setup required',
      icon: UsersRound,
      tone: 'violet',
    },
    {
      title: 'Feedback received',
      value: formatNumber(data.feedback.total),
      note: `Selected ${data.period.days}-day period`,
      icon: MessageSquareText,
      tone: 'blue',
    },
    {
      title: 'Shared transactions',
      value: formatNumber(data.transactions.count),
      note: `Based on transaction date · ${data.period.days} days`,
      icon: BarChart3,
      tone: 'amber',
    },
  ] : [];

  return (
    <div className="admin-page-content">
      <section className="admin-panel admin-analytics-control-panel">
        <div className="admin-panel-heading">
          <div><span className="admin-panel-kicker">PLATFORM REPORT</span><h2>Real activity from your database</h2><p>Server-side aggregates. No individual transaction details are returned.</p></div>
          <div className="admin-analytics-actions">
            <label className="admin-analytics-range"><CalendarDays size={14} /><span className="sr-only">Analytics date range</span>
              <select value={range} onChange={(event) => setRange(Number(event.target.value))} aria-label="Analytics date range">
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
            </label>
            <button type="button" className="admin-feedback-refresh" onClick={onRefresh} disabled={loading} aria-label="Refresh analytics">
              <RefreshCw size={15} className={loading ? 'is-spinning' : ''} />
            </button>
          </div>
        </div>
        {error && <div className="admin-feedback-error" role="alert"><CircleAlert size={16} /><span>{error}</span></div>}
        {loading && !data ? (
          <div className="admin-feedback-loading"><LoaderCircle size={20} className="is-spinning" /> Loading secure analytics…</div>
        ) : !data ? (
          <div className="admin-empty-state admin-feedback-empty">
            <span className="admin-empty-icon"><Database size={22} /></span>
            <h3>Analytics are not available yet</h3>
            <p>Apply the admin analytics SQL migration, then refresh this page.</p>
          </div>
        ) : (
          <>
            <div className="admin-analytics-period-note"><CalendarDays size={13} /> {formatDate(data.period.from)} – {formatDate(data.period.to)}</div>
            <section className="admin-metrics-grid" aria-label="Analytics summary">
              {metrics.map((metric) => <MetricCard key={metric.title} {...metric} />)}
            </section>
          </>
        )}
      </section>

      {data && <>
      <section className="admin-panel admin-analytics-panel">
        <div className="admin-panel-heading">
          <div><span className="admin-panel-kicker">SIGNUP TREND</span><h2>Monthly registrations</h2><p>Exact account totals from Supabase Auth, including accounts beyond the user table page limit.</p></div>
          <span className="admin-period-chip"><CalendarDays size={14} /> Six months</span>
        </div>
        <RegistrationChart months={registrationMonths} />
      </section>
      <section className="admin-panel admin-analytics-panel">
        <div className="admin-panel-heading">
          <div><span className="admin-panel-kicker">ACCOUNT ACTIVITY</span><h2>Daily active accounts</h2><p>Unique accounts that opened ExpenseNest each day. Earlier dates are not backfilled.</p></div>
          <span className="admin-period-chip"><Activity size={14} /> {data.period.days} days</span>
        </div>
        {activeTrackingReady ? (
          <ActiveAccountsChart days={data.daily_active_users} />
        ) : (
          <div className="admin-feedback-error" role="status">
            <CircleAlert size={16} />
            <span>Run the updated supabase/admin_analytics.sql and deploy the app to start collecting daily activity.</span>
          </div>
        )}
      </section>
      <section className="admin-analytics-detail-grid">
        <article className="admin-panel admin-analytics-detail-panel">
          <div className="admin-panel-heading"><div><span className="admin-panel-kicker">SUPPORT INBOX</span><h2>Feedback status</h2><p>{data.feedback.total} submissions in the selected period.</p></div><MessageSquareText size={17} /></div>
          <div className="admin-analytics-status-list">
            <div><span className="analytics-status-dot new" /><span>New</span><strong>{formatNumber(data.feedback.new)}</strong></div>
            <div><span className="analytics-status-dot in-review" /><span>In review</span><strong>{formatNumber(data.feedback.in_review)}</strong></div>
            <div><span className="analytics-status-dot resolved" /><span>Resolved</span><strong>{formatNumber(data.feedback.resolved)}</strong></div>
          </div>
        </article>
        <article className="admin-panel admin-analytics-detail-panel">
          <div className="admin-panel-heading"><div><span className="admin-panel-kicker">FAMILY ACTIVITY</span><h2>Shared finances</h2><p>Totals for groups and shared entries.</p></div><UsersRound size={17} /></div>
          <div className="admin-analytics-status-list">
            <div><span className="analytics-status-dot family" /><span>Family groups</span><strong>{formatNumber(data.families.total)}</strong></div>
            <div><span className="analytics-status-dot family" /><span>Groups created in period</span><strong>{formatNumber(data.families.new)}</strong></div>
            <div><span className="analytics-status-dot income" /><span>Income entries in period</span><strong>{formatNumber(data.transactions.income_count)}</strong></div>
            <div><span className="analytics-status-dot expense" /><span>Expense entries in period</span><strong>{formatNumber(data.transactions.expense_count)}</strong></div>
          </div>
        </article>
      </section>
      <p className="admin-analytics-footnote"><ShieldCheck size={13} /> Financial amounts are intentionally not combined: family accounts may use different currencies.</p>
      </>}
    </div>
  );
}

function FeedbackSection({ items, loading, loadingMore, hasMore, error, notice, unreadCount, triageError, assignees, currentAdminId, filter, setFilter, onRefresh, onLoadMore, onUpdateStatus, onRespond, onMarkRead, onUpdateTriage, updatingId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const assigneeById = new Map(assignees.map((admin) => [admin.user_id, admin]));
  const counts = {
    all: items.length,
    new: items.filter((item) => item.status === 'new').length,
    in_review: items.filter((item) => item.status === 'in_review').length,
    resolved: items.filter((item) => item.status === 'resolved').length,
    needs_response: items.filter((item) => item.status !== 'resolved' && (!item.replies?.length || item.replies.at(-1)?.author_role === 'user')).length,
    urgent: items.filter((item) => item.priority === 'urgent').length,
    mine: currentAdminId ? items.filter((item) => item.assigned_to === currentAdminId).length : 0,
  };
  const statusLabels = { new: 'New', in_review: 'In review', resolved: 'Resolved', needs_response: 'Needs a reply', urgent: 'Urgent', mine: 'Assigned to me' };
  const categoryLabels = { general: 'General', idea: 'Feature idea', bug: 'Bug report', other: 'Other' };
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleItems = items.filter((item) => {
    const matchesFilter = filter === 'all'
      || (filter === 'needs_response' ? item.status !== 'resolved' && (!item.replies?.length || item.replies.at(-1)?.author_role === 'user')
        : filter === 'urgent' ? item.priority === 'urgent'
          : filter === 'mine' ? item.assigned_to === currentAdminId
            : item.status === filter);
    const matchesSearch = !normalizedSearch || [
      item.user_email,
      item.user_id,
      item.category,
      categoryLabels[item.category],
      item.message,
      item.admin_response,
      item.priority,
      assigneeById.get(item.assigned_to)?.email,
      assigneeById.get(item.assigned_to)?.display_name,
      ...(item.replies || []).map((reply) => reply.message),
    ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
    return matchesFilter && matchesSearch;
  });

  function exportVisibleFeedback() {
    if (!visibleItems.length) return;
    const rows = [
      ['Submitted at', 'Email', 'User ID', 'Category', 'Status', 'Priority', 'Assigned admin', 'Message', 'Admin response', 'Responded at', 'Feedback ID'],
      ...visibleItems.map((item) => [
        item.created_at || '',
        item.user_email || '',
        item.user_id || '',
        categoryLabels[item.category] || item.category || 'General',
        statusLabels[item.status] || item.status || '',
        item.priority || 'normal',
        assigneeById.get(item.assigned_to)?.email || assigneeById.get(item.assigned_to)?.display_name || '',
        item.message || '',
        item.admin_response || '',
        item.responded_at || '',
        item.id || '',
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `ExpenseNest_feedback_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <div className="admin-page-content">
      <section className="admin-feedback-summary" aria-label="Feedback counts">
        {[
          ['new', 'New feedback'],
          ['in_review', 'In review'],
          ['resolved', 'Resolved'],
        ].map(([status, label]) => (
          <button
            type="button"
            className={`admin-feedback-count ${filter === status ? 'selected' : ''}`}
            key={status}
            onClick={() => setFilter(filter === status ? 'all' : status)}
          >
            <span>{label}</span><strong>{counts[status]}</strong>
          </button>
        ))}
      </section>

      <section className="admin-panel admin-feedback-panel">
        <div className="admin-panel-heading admin-feedback-heading">
          <div><span className="admin-panel-kicker">FEEDBACK INBOX</span><h2>Messages from users</h2><p>Review, respond in the app, and keep each submission up to date.</p></div>
          <div className="admin-feedback-heading-stats">
            {unreadCount > 0 && <span className="admin-feedback-unread-total">{unreadCount > 99 ? '99+' : unreadCount} unread</span>}
            <span className="admin-count-chip">{counts.all} <small>total</small></span>
          </div>
        </div>

        <div className="admin-feedback-toolbar">
          <div className="admin-feedback-filters" aria-label="Filter feedback">
            {[
              ['all', 'All'],
              ['needs_response', 'Needs reply'],
              ['new', 'New'],
              ['in_review', 'In review'],
              ['resolved', 'Resolved'],
              ['urgent', 'Urgent'],
              ...(currentAdminId ? [['mine', 'Assigned to me']] : []),
            ].map(([value, label]) => (
              <button type="button" key={value} className={filter === value ? 'active' : ''} onClick={() => setFilter(value)} aria-pressed={filter === value}>
                {label}<span>{counts[value]}</span>
              </button>
            ))}
          </div>
          <label className="admin-feedback-search">
            <Search size={14} aria-hidden="true" />
            <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search email or message" aria-label="Search feedback by email, category, or message" />
            {searchTerm && <button type="button" onClick={() => setSearchTerm('')} aria-label="Clear feedback search"><X size={14} /></button>}
          </label>
          <span className="admin-count-chip admin-feedback-shown-count">{visibleItems.length} <small>shown</small></span>
          <button type="button" className="admin-export-button admin-feedback-export" onClick={exportVisibleFeedback} disabled={!visibleItems.length} title="Export feedback matching the current search and status filter">
            <Download size={14} /> Export CSV
          </button>
          <button type="button" className="admin-feedback-refresh" onClick={onRefresh} disabled={loading || loadingMore} aria-label="Refresh feedback">
            <RefreshCw size={15} className={loading ? 'is-spinning' : ''} />
          </button>
        </div>

        {error && <div className="admin-feedback-error" role="alert"><CircleAlert size={16} /><span>{error}</span></div>}
        {triageError && <div className="admin-feedback-error" role="status"><CircleAlert size={16} /><span>{triageError}</span></div>}
        {notice && <div className="admin-feedback-notice" role="status"><Check size={15} /><span>{notice}</span></div>}

        {loading ? (
          <div className="admin-feedback-loading"><LoaderCircle size={20} className="is-spinning" /> Loading feedback…</div>
        ) : visibleItems.length === 0 ? (
          <div className="admin-empty-state admin-feedback-empty">
            <span className="admin-empty-icon"><MessageSquareText size={22} /></span>
            <h3>{error ? 'Feedback inbox is unavailable' : normalizedSearch ? 'No matching feedback' : filter === 'all' ? 'No feedback yet' : filter === 'needs_response' ? 'No pending replies' : `No ${statusLabels[filter]?.toLowerCase() || ''} feedback`}</h3>
            <p>{error ? 'Set up the feedback table or refresh after resolving the issue.' : normalizedSearch ? 'Try another email, category, or search phrase.' : filter === 'needs_response' ? 'No submissions are waiting for a response.' : 'User submissions will appear here when they send feedback from the app or Contact page.'}</p>
          </div>
        ) : (
          <div className="admin-feedback-list">
            {visibleItems.map((item) => {
              return <AdminFeedbackCard key={item.id} item={item} assignees={assignees} assigneeById={assigneeById} triageReady={!triageError} onUpdateStatus={onUpdateStatus} onRespond={onRespond} onMarkRead={onMarkRead} onUpdateTriage={onUpdateTriage} updating={updatingId === item.id} />;
            })}
          </div>
        )}
        {!loading && items.length > 0 && (
          <div className="admin-feedback-pagination">
            <span>Showing {visibleItems.length} of {items.length} loaded submissions.</span>
            {hasMore ? <button type="button" onClick={onLoadMore} disabled={loadingMore}>{loadingMore ? <><LoaderCircle size={14} className="is-spinning" /> Loading…</> : 'Load older feedback'}</button> : <small>All submissions are loaded.</small>}
          </div>
        )}
      </section>
    </div>
  );
}

function AdminFeedbackCard({ item, assignees, assigneeById, triageReady, onUpdateStatus, onRespond, onMarkRead, onUpdateTriage, updating }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [responseDraft, setResponseDraft] = useState('');
  const [responseStatus, setResponseStatus] = useState(item.status === 'new' ? 'in_review' : item.status);
  const [responseError, setResponseError] = useState('');
  const sender = item.user_email || `User ${String(item.user_id || '').slice(0, 8)}`;
  const statusLabels = { new: 'New', in_review: 'In review', resolved: 'Resolved' };
  const categoryLabels = { general: 'General', idea: 'Feature idea', bug: 'Bug report', other: 'Other' };
  const priorityLabels = { low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent' };
  const unreadCount = Number(!item.admin_read_at) + (item.replies || []).filter((reply) => reply.author_role === 'user' && !reply.admin_read_at).length;

  useEffect(() => {
    setResponseDraft('');
    setResponseStatus(item.status === 'new' ? 'in_review' : item.status);
  }, [item.id, item.status]);

  function toggleConversation() {
    const opening = !replyOpen;
    setReplyOpen(opening);
    setResponseError('');
    if (opening) void onMarkRead(item.id);
  }

  async function submitResponse(event) {
    event.preventDefault();
    const cleanResponse = responseDraft.trim();
    if (!cleanResponse || cleanResponse.length > 2000) {
      setResponseError('Write a response between 1 and 2,000 characters.');
      return;
    }
    setResponseError('');
    const saved = await onRespond(item.id, cleanResponse, responseStatus);
    if (saved) setReplyOpen(false);
  }

  return (
    <article className="admin-feedback-card">
      <div className="admin-feedback-card-top">
        <div className="admin-feedback-sender">
          <span className="admin-feedback-avatar">{sender.charAt(0).toUpperCase()}</span>
          <div>
            {item.user_email ? <a href={`mailto:${item.user_email}`}>{item.user_email}</a> : <strong>{sender}</strong>}
            <small><Clock3 size={12} /> {formatDateTime(item.created_at)}</small>
          </div>
        </div>
        <div className="admin-feedback-status-group">
          <span className={`admin-feedback-priority priority-${item.priority || 'normal'}`}>{priorityLabels[item.priority] || 'Normal'}</span>
          <span className={`admin-feedback-status status-${item.status}`}>{statusLabels[item.status] || item.status}</span>
        </div>
      </div>
      <div className="admin-feedback-message-heading">
        <span className={`admin-feedback-category category-${item.category}`}>{categoryLabels[item.category] || item.category || 'General'}</span>
        <span className="admin-feedback-id">#{String(item.id).slice(0, 8)}</span>
      </div>
      <p className="admin-feedback-message">{item.message}</p>

      <div className="admin-feedback-card-bottom">
        <label>
          <span>Manage status</span>
          <select value={item.status} onChange={(event) => onUpdateStatus(item.id, event.target.value)} disabled={updating} aria-label={`Update feedback status for ${sender}`}>
            <option value="new">New</option>
            <option value="in_review">In review</option>
            <option value="resolved">Resolved</option>
          </select>
          {updating && <LoaderCircle size={14} className="is-spinning" />}
        </label>
        <div className="admin-feedback-triage-controls">
          <label>
            <span>Assigned admin</span>
            <select value={item.assigned_to || ''} onChange={(event) => onUpdateTriage(item.id, event.target.value || null, item.priority || 'normal')} disabled={updating || !triageReady || !assignees.length} aria-label={`Assign feedback for ${sender}`}>
              <option value="">Unassigned</option>
              {assignees.map((admin) => <option value={admin.user_id} key={admin.user_id}>{admin.display_name}{admin.email ? ` · ${admin.email}` : ''}</option>)}
            </select>
            {item.assigned_to && <small>{assigneeById.get(item.assigned_to)?.email || ''}</small>}
          </label>
          <label>
            <span>Priority</span>
            <select value={item.priority || 'normal'} onChange={(event) => onUpdateTriage(item.id, item.assigned_to || null, event.target.value)} disabled={updating || !triageReady} aria-label={`Set feedback priority for ${sender}`}>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </label>
        </div>
        <div className="admin-feedback-actions">
          <button type="button" className="admin-feedback-reply-button" onClick={toggleConversation} disabled={updating} aria-expanded={replyOpen}>
            <MessageCircle size={14} /> {replyOpen ? 'Hide conversation' : 'Conversation'}
            {unreadCount > 0 && <span className="admin-feedback-card-unread">{unreadCount}</span>}
          </button>
          {item.user_email && <a className="admin-feedback-reply" href={`mailto:${item.user_email}?subject=${encodeURIComponent('ExpenseNest feedback')}`}><Mail size={14} /> Email user</a>}
        </div>
      </div>

      {replyOpen && (
        <div className="admin-feedback-conversation">
          <div className="admin-feedback-thread-list">
            <div className="admin-feedback-thread-message user-message">
              <div><strong>{sender}</strong><time>{formatDateTime(item.created_at)}</time></div>
              <p>{item.message}</p>
            </div>
            {(item.replies || []).length === 0 && <p className="admin-feedback-thread-empty">No replies yet. Send the first response below.</p>}
            {(item.replies || []).map((reply) => (
              <div className={`admin-feedback-thread-message${reply.author_role === 'admin' ? ' admin-message' : ' user-message'}`} key={reply.id}>
                <div><strong>{reply.author_role === 'admin' ? 'ExpenseNest support' : sender}</strong><time>{formatDateTime(reply.created_at)}</time></div>
                <p>{reply.message}</p>
              </div>
            ))}
          </div>
          <form className="admin-feedback-response-form" onSubmit={submitResponse}>
          <label>
            <span>Reply shown in the user’s Feedback section</span>
            <textarea value={responseDraft} onChange={(event) => setResponseDraft(event.target.value)} rows={4} maxLength={2000} placeholder="Write a helpful response…" disabled={updating} />
            <small>{responseDraft.length}/2,000 characters</small>
          </label>
          <div className="admin-feedback-response-actions">
            <label><span>After replying</span><select value={responseStatus} onChange={(event) => setResponseStatus(event.target.value)} disabled={updating}>
              <option value="new">Keep as new</option>
              <option value="in_review">Keep in review</option>
              <option value="resolved">Mark resolved</option>
            </select></label>
            <button type="submit" className="admin-feedback-send-response" disabled={updating || !responseDraft.trim()}>{updating ? <><LoaderCircle size={14} className="is-spinning" /> Saving…</> : <><Send size={14} /> Save response</>}</button>
          </div>
          {responseError && <p className="admin-feedback-response-error" role="alert">{responseError}</p>}
          </form>
        </div>
      )}
    </article>
  );
}

function ActivitySection({ items, loading, loadingMore, error, onRefresh, onLoadMore, hasMore }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [rangeFilter, setRangeFilter] = useState('30');
  const statusLabels = { new: 'New', in_review: 'In review', resolved: 'Resolved' };
  const settingLabels = {
    theme: 'Appearance theme', currency: 'Currency', dateFormat: 'Date format', density: 'Layout density',
    privacyMode: 'Privacy mode', weekStart: 'Week start day', motionPreference: 'Motion preference', all_preferences: 'All preferences',
  };
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const cutoff = rangeFilter === 'all' ? null : Date.now() - Number(rangeFilter) * 86_400_000;
  const visibleItems = items.filter((item) => {
    const details = item.details && typeof item.details === 'object' ? item.details : {};
    const matchesType = typeFilter === 'all'
      || (typeFilter === 'users' && item.target_type === 'user')
      || (typeFilter === 'feedback' && item.target_type === 'feedback')
      || (typeFilter === 'admin' && item.target_type === 'admin');
    const matchesSearch = !normalizedSearch || [
      item.actor_email,
      item.actor_id,
      details.user_email,
      details.user_display_id,
      details.category,
      details.requested_action,
      details.suspension_duration,
      details.response_length,
      details.from_priority,
      details.to_priority,
      details.from_assignee,
      details.to_assignee,
      details.setting,
      item.target_id,
      details.from,
      details.to,
    ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
    const matchesRange = cutoff === null || new Date(item.created_at).getTime() >= cutoff;
    return matchesType && matchesSearch && matchesRange;
  });

  function getActionLabel(item, details) {
    if (item.target_type === 'admin') {
      if (item.action === 'admin_signed_in') return 'Administrator signed in';
      if (item.action === 'admin_signed_out') return 'Administrator signed out';
      return 'Global setting changed';
    }
    if (item.target_type === 'feedback') {
      if (item.action === 'feedback_response_sent') return 'Replied to user feedback';
      if (item.action === 'feedback_response_updated') return 'Updated a feedback reply';
      if (item.action === 'feedback_triage_updated') return 'Updated feedback assignment or priority';
      return 'Feedback status changed';
    }
    return details.requested_action === 'suspend' ? 'Account access blocked'
      : details.requested_action === 'reactivate' ? 'Account access restored'
        : 'Account access updated';
  }

  function exportVisibleActivity() {
    if (!visibleItems.length) return;
    const rows = [
      ['Changed at', 'Admin email', 'Action', 'Target', 'Result', 'Details', 'Record ID'],
      ...visibleItems.map((item) => {
        const details = item.details && typeof item.details === 'object' ? item.details : {};
        const isAccountAction = item.target_type === 'user';
        const isAdminAction = item.target_type === 'admin';
        const action = getActionLabel(item, details);
        const target = isAccountAction
          ? details.user_display_id || item.target_id || ''
          : isAdminAction ? (details.setting ? settingLabels[details.setting] || details.setting : item.actor_email || 'Administrator session')
            : details.user_email || details.category || '';
        const result = isAccountAction ? details.result || 'processing'
          : item.target_type === 'feedback' ? item.action === 'feedback_status_changed'
            ? `${statusLabels[details.from] || details.from || ''} -> ${statusLabels[details.to] || details.to || ''}`
            : 'Response saved'
            : isAdminAction ? (details.setting ? 'Setting updated' : 'Recorded') : '';
        const extra = isAccountAction
          ? details.suspension_duration ? `Suspension duration: ${suspensionDurationLabel(details.suspension_duration)}` : details.reason || ''
          : isAdminAction && details.setting ? `Setting: ${settingLabels[details.setting] || details.setting}`
            : details.category || '';
        return [
          item.created_at || '',
          item.actor_email || item.actor_id || '',
          action,
          target,
          result,
          extra,
          item.target_id || '',
        ];
      }),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(csvCell).join(',')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `ExpenseNest_admin_activity_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <div className="admin-page-content">
      <section className="admin-panel admin-activity-panel">
        <div className="admin-panel-heading">
          <div>
            <span className="admin-panel-kicker">ADMIN AUDIT TRAIL</span>
            <h2>Recent activity</h2>
            <p>Admin sessions and settings, account access decisions, and feedback updates.</p>
          </div>
          <button type="button" className="admin-feedback-refresh" onClick={onRefresh} disabled={loading || loadingMore} aria-label="Refresh activity log">
            <RefreshCw size={15} className={loading ? 'is-spinning' : ''} />
          </button>
        </div>

        {error && <div className="admin-feedback-error" role="alert"><CircleAlert size={16} /><span>{error}</span></div>}

        {loading ? (
          <div className="admin-feedback-loading"><LoaderCircle size={20} className="is-spinning" /> Loading activity…</div>
        ) : items.length === 0 && !error ? (
          <div className="admin-empty-state admin-feedback-empty">
            <span className="admin-empty-icon"><History size={22} /></span>
            <h3>No admin activity yet</h3>
            <p>Admin sessions, settings changes, account access decisions and feedback updates will appear here.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="admin-empty-state admin-feedback-empty">
            <span className="admin-empty-icon"><Database size={22} /></span>
            <h3>Activity log is unavailable</h3>
            <p>Apply the activity log SQL migrations, then refresh this section.</p>
          </div>
        ) : (
          <>
            <div className="admin-activity-toolbar">
              <label className="admin-activity-search">
                <Search size={15} aria-hidden="true" />
                <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search admin, user ID, email, or setting" aria-label="Search activity log" />
                {searchTerm && <button type="button" onClick={() => setSearchTerm('')} aria-label="Clear activity search"><X size={14} /></button>}
              </label>
              <label className="admin-activity-filter">
                <Filter size={14} aria-hidden="true" />
                <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Filter activity type">
                  <option value="all">All activity</option>
                  <option value="admin">Admin sessions &amp; settings</option>
                  <option value="users">Account access</option>
                  <option value="feedback">Feedback updates</option>
                </select>
              </label>
              <label className="admin-activity-filter admin-activity-range">
                <CalendarDays size={14} aria-hidden="true" />
                <select value={rangeFilter} onChange={(event) => setRangeFilter(event.target.value)} aria-label="Filter activity date range">
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="all">All loaded</option>
                </select>
              </label>
              <span className="admin-count-chip">{visibleItems.length} <small>shown</small></span>
              <button type="button" className="admin-export-button" onClick={exportVisibleActivity} disabled={!visibleItems.length}>
                <Download size={14} /> Export CSV
              </button>
            </div>
            {visibleItems.length === 0 ? (
              <div className="admin-empty-state admin-feedback-empty">
                <span className="admin-empty-icon"><SearchX size={22} /></span>
                <h3>No matching activity</h3>
                <p>Try another search, activity type, or date range.</p>
              </div>
            ) : (
              <div className="admin-activity-list">
                {visibleItems.map((item) => {
                  const details = item.details && typeof item.details === 'object' ? item.details : {};
                  const fromStatus = statusLabels[details.from] || details.from || 'Unknown';
                  const toStatus = statusLabels[details.to] || details.to || 'Unknown';
                  const isAccountAction = item.target_type === 'user';
                  const isAdminAction = item.target_type === 'admin';
                  const isFeedbackAction = item.target_type === 'feedback';
                  const actionLabel = getActionLabel(item, details);
                  const actionFailed = details.result === 'failed';
                  const target = isAccountAction
                    ? `User ${details.user_display_id || `#${String(item.target_id || '').slice(0, 8)}`}`
                    : isAdminAction ? details.setting ? `Setting: ${settingLabels[details.setting] || details.setting}` : 'Administrator session'
                      : details.user_email || details.category || `Feedback #${String(item.target_id || '').slice(0, 8)}`;

                  return (
                    <article className="admin-activity-row" key={item.id}>
                      <span className={`admin-activity-icon${isAccountAction ? ' account' : isAdminAction ? ' admin' : ''}`}>
                        {isAccountAction ? <ShieldCheck size={17} /> : isAdminAction ? <Settings2 size={17} /> : <MessageSquareText size={17} />}
                      </span>
                      <div className="admin-activity-copy">
                        <div className="admin-activity-title-row">
                          <strong>{isAccountAction && actionFailed ? `Failed: ${actionLabel}` : actionLabel}</strong>
                          {isAccountAction ? <span className={`admin-activity-result ${details.result || 'processing'}`}>{details.result || 'processing'}</span> : (
                            isFeedbackAction && item.action === 'feedback_status_changed' ? <span className="admin-activity-transition">
                              <span className={`status-${details.from || 'unknown'}`}>{fromStatus}</span>
                              <ArrowRight size={13} />
                              <span className={`status-${details.to || 'unknown'}`}>{toStatus}</span>
                            </span> : <span className="admin-activity-result completed">{isFeedbackAction ? item.action === 'feedback_triage_updated' ? 'Triage' : 'Response' : details.setting ? 'Setting' : 'Session'}</span>
                          )}
                        </div>
                        <p>{target}</p>
                        {isAccountAction && details.suspension_duration && <small>Suspension duration: {suspensionDurationLabel(details.suspension_duration)}</small>}
                        <small><ShieldCheck size={12} /> {item.actor_email || `Admin ${String(item.actor_id || '').slice(0, 8) || 'account'}`} <span>·</span> <Clock3 size={12} /> {formatDateTime(item.created_at)}</small>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
        {!error && items.length > 0 && (
          <div className="admin-activity-footer">
            <span>Showing {visibleItems.length} of {items.length} loaded records.</span>
            {hasMore ? <button type="button" className="admin-activity-load-more" onClick={onLoadMore} disabled={loadingMore}>{loadingMore ? <><LoaderCircle size={14} className="is-spinning" /> Loading older activity...</> : 'Load older activity'}</button> : <small>All available records are loaded.</small>}
          </div>
        )}
      </section>
    </div>
  );
}

function SettingsSection({ adminName, adminEmail, serviceReady, loading, theme, onThemeChange, currency, onCurrencyChange, dateFormat, onDateFormatChange, density, onDensityChange, privacyMode, onPrivacyModeChange, weekStart, onWeekStartChange, motionPreference, onMotionPreferenceChange, onResetPreferences }) {
  const rows = [
    { icon: ShieldCheck, title: 'Administrator access', detail: 'Signed in through Supabase and checked against the admin list.', status: 'Verified', ready: true },
    { icon: Database, title: 'Dashboard data service', detail: 'Supabase Edge Function: admin-dashboard.', status: loading ? 'Updating' : serviceReady ? 'Responding' : 'Not checked', ready: serviceReady },
    { icon: BarChart3, title: 'Usage reporting', detail: 'Daily app activity is aggregated in Admin Analytics. Page views and transaction details are not tracked.', status: 'Aggregate only', ready: true },
  ];

  return (
    <div className="admin-settings-layout">
      <section className="admin-panel admin-appearance-panel">
        <div className="admin-panel-heading"><div><span className="admin-panel-kicker">APPLICATION PREFERENCES</span><h2>Global settings</h2><p>These preferences are shared across the User Screen and the rest of ExpenseNest.</p></div></div>
        <div className="admin-global-preferences-grid">
          <div className="admin-global-preference">
            <div><strong>Appearance theme</strong><small>Applied across the whole application.</small></div>
            <AdminThemeControl theme={theme} onChange={onThemeChange} variant="segmented" />
          </div>
          <label className="admin-global-preference admin-currency-preference">
            <span><strong>Currency display</strong><small>Updates amount labels throughout the User Screen.</small></span>
            <select value={currency} onChange={onCurrencyChange} aria-label="Application currency">
              {CURRENCIES.map((option) => <option key={option.code} value={option.code}>{option.code} · {option.name}</option>)}
            </select>
            <small className="admin-currency-note">Changes the currency symbol and number format only; it does not convert amounts using exchange rates.</small>
          </label>
          <label className="admin-global-preference admin-currency-preference">
            <span><strong>Date format</strong><small>Updates dates in transactions, reports, activity and account details.</small></span>
            <select value={dateFormat} onChange={onDateFormatChange} aria-label="Application date format">
              {DATE_FORMAT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="admin-global-preference admin-currency-preference">
            <span><strong>Layout density</strong><small>Choose how much content fits on each screen.</small></span>
            <select value={density} onChange={onDensityChange} aria-label="Application layout density">
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </label>
          <label className="admin-global-preference admin-privacy-setting">
            <span><strong>Privacy mode</strong><small>Mask money amounts across the User Panel and family views. Exports keep full values.</small></span>
            <span className="admin-privacy-control">
              <input type="checkbox" checked={privacyMode} onChange={onPrivacyModeChange} />
              <span>{privacyMode ? 'Amounts hidden' : 'Amounts visible'}</span>
            </span>
          </label>
          <label className="admin-global-preference admin-currency-preference">
            <span><strong>Week starts on</strong><small>Changes the weekday order in the spending calendar.</small></span>
            <select value={weekStart} onChange={onWeekStartChange} aria-label="First day of the week">
              <option value="sunday">Sunday</option>
              <option value="monday">Monday</option>
              <option value="saturday">Saturday</option>
            </select>
          </label>
          <label className="admin-global-preference admin-currency-preference">
            <span><strong>Motion and animation</strong><small>Respect system accessibility settings or reduce movement throughout ExpenseNest.</small></span>
            <select value={motionPreference} onChange={onMotionPreferenceChange} aria-label="Motion preference">
              <option value="system">Follow device setting</option>
              <option value="reduced">Reduce animations</option>
            </select>
          </label>
        </div>
        <div className="admin-preferences-footer">
          <p>Settings are saved to this account and shared with the User Screen.</p>
          <button type="button" className="admin-reset-preferences" onClick={onResetPreferences}><RotateCcw size={14} /> Reset preferences</button>
        </div>
      </section>
      <section className="admin-panel admin-account-panel">
        <div className="admin-panel-heading"><div><span className="admin-panel-kicker">ADMIN ACCOUNT</span><h2>Workspace profile</h2><p>Account currently signed in to this admin portal.</p></div></div>
        <div className="admin-account-summary">
          <span className="admin-account-avatar">{(adminName || 'A').charAt(0).toUpperCase()}</span>
          <div><strong>{adminName}</strong><span>{adminEmail || 'Email not available'}</span></div>
          <span className="admin-account-role"><ShieldCheck size={14} /> Administrator</span>
        </div>
      </section>
      <section className="admin-panel admin-service-panel">
        <div className="admin-panel-heading"><div><span className="admin-panel-kicker">SYSTEM STATUS</span><h2>Connected services</h2><p>Statuses reflect the latest dashboard response.</p></div></div>
        <div className="admin-setting-list">
          {rows.map((row) => {
            const Icon = row.icon;
            return (
              <div className="admin-setting-row" key={row.title}>
                <span className="admin-setting-icon"><Icon size={18} /></span>
                <div className="admin-setting-copy"><strong>{row.title}</strong><small>{row.detail}</small></div>
                <span className={`admin-setting-status${row.ready ? ' ready' : ''}`}>{row.status}</span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function UserTable({ users, onViewUser, emptyTitle, emptyMessage }) {
  if (!users.length) {
    return (
      <div className="admin-empty-state">
        <span className="admin-empty-icon"><SearchX size={22} /></span>
        <h3>{emptyTitle}</h3>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead><tr><th>Account</th><th>Registration date</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
        <tbody>
          {users.map((user, index) => {
            const email = user.email || 'Email not available';
            const id = user.id || user.user_id || email || index;
            const displayId = user.display_id || user.id || user.user_id || 'User ID not available';
            const status = isUserSuspended(user)
              ? 'Suspended'
              : String(user.status || '').toLowerCase() === 'suspended' ? 'Registered' : user.status || 'Registered';
            return (
              <tr key={id}>
                <td>
                  <div className="admin-user-cell">
                    <span className="admin-user-avatar">{(user.email || 'U').charAt(0).toUpperCase()}</span>
                    <span><strong>{email}</strong><small>{displayId}</small></span>
                  </div>
                </td>
                <td>{formatDate(user.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td><span className={`admin-user-status${status === 'Suspended' ? ' suspended' : ''}`}><span />{status}</span></td>
                <td><button type="button" className="admin-view-user" onClick={() => onViewUser?.(user)}><Eye size={15} /> View</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function UserDetailsModal({ user, onClose, onCopy, onAccountAction, adminUserId, accessSetupWarning }) {
  const email = user.email || '';
  const id = user.display_id || user.id || user.user_id || '';
  const userId = user.id || user.user_id;
  const initial = (email || 'U').charAt(0).toUpperCase();
  const suspended = isUserSuspended(user);
  const accountStatusLabel = suspended
    ? 'Suspended'
    : String(user.status || '').toLowerCase() === 'suspended' ? 'Registered' : user.status || 'Registered';
  const isOwnAccount = userId === adminUserId;
  const [health, setHealth] = useState(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [healthError, setHealthError] = useState('');
  const [pendingAction, setPendingAction] = useState('');
  const [suspensionDuration, setSuspensionDuration] = useState('7d');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadUserHealth() {
      const userId = user.id || user.user_id;
      if (!userId) {
        setHealthError('The internal account reference is not available.');
        setHealthLoading(false);
        return;
      }

      setHealthLoading(true);
      setHealthError('');
      try {
        const { data, error } = await supabase.rpc('get_admin_user_health', { _user_id: userId });
        if (!active) return;

        if (error) {
          const missingRpc = error.code === 'PGRST202' || error.code === '42883';
          setHealthError(missingRpc
            ? 'Account health is not set up yet. Run supabase/admin_user_health.sql in Supabase SQL Editor.'
            : error.message || 'Could not load account health.');
        } else {
          setHealth(Array.isArray(data) ? data[0] || null : data || null);
          if (!data || (Array.isArray(data) && data.length === 0)) {
            setHealthError('No account health information was found for this user.');
          }
        }
      } catch (requestError) {
        if (active) setHealthError(requestError.message || 'Could not load account health.');
      } finally {
        if (active) setHealthLoading(false);
      }
    }

    loadUserHealth();
    return () => { active = false; };
  }, [user.id, user.user_id]);

  const healthStats = [
    { label: 'Family groups', value: health?.family_group_count, icon: UsersRound },
    { label: 'Transactions added', value: health?.transaction_count, icon: Activity },
    { label: 'Feedback sent', value: health?.feedback_count, icon: MessageSquareText },
  ];

  async function confirmAccountAction() {
    setActionLoading(true);
    setActionError('');
    try {
      await onAccountAction(user, pendingAction, suspensionDuration);
      setPendingAction('');
    } catch (requestError) {
      setActionError(requestError.message || 'The account access change could not be applied.');
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div className="admin-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="admin-user-modal" role="dialog" aria-modal="true" aria-labelledby="admin-user-modal-title">
        <div className="admin-modal-heading">
          <div><span className="admin-panel-kicker">ACCOUNT DETAILS</span><h2 id="admin-user-modal-title">User profile</h2></div>
          <button type="button" className="admin-icon-button" onClick={onClose} aria-label="Close details"><X size={18} /></button>
        </div>
        <div className="admin-modal-profile"><span className="admin-modal-avatar">{initial}</span><div><strong>{email || 'User account'}</strong><small>{accountStatusLabel}</small></div></div>
        <div className="admin-modal-details">
          <div><span>Email address</span><strong>{email || 'Not available'}</strong>{email && <button type="button" onClick={() => onCopy(email, 'Email')}><Copy size={14} /> Copy email</button>}</div>
          <div><span>User ID</span><strong className="admin-mono-text">{id || 'Not available'}</strong>{id && <button type="button" onClick={() => onCopy(id, 'User ID')}><Copy size={14} /> Copy ID</button>}</div>
          <div><span>Registration date</span><strong>{formatDateTime(user.created_at)}</strong></div>
          <div><span>Account status</span><strong>{accountStatusLabel}</strong></div>
        </div>
        <section className="admin-user-health" aria-label="Account health">
          <div className="admin-user-health-heading"><div><span className="admin-panel-kicker">ACCOUNT HEALTH</span><h3>Usage overview</h3></div><Clock3 size={16} /></div>
          {healthLoading ? (
            <div className="admin-user-health-state"><LoaderCircle size={16} className="is-spinning" /> Loading account activity…</div>
          ) : healthError ? (
            <div className="admin-user-health-state warning" role="status">{healthError}</div>
          ) : (
            <>
              <div className="admin-user-health-stats">
                {healthStats.map(({ label, value, icon: Icon }) => (
                  <div className="admin-user-health-stat" key={label}><span><Icon size={14} /></span><strong>{formatNumber(value ?? 0)}</strong><small>{label}</small></div>
                ))}
              </div>
              <div className="admin-user-health-activity">
                <span>Last sign-in</span><strong>{formatDateTime(health?.last_sign_in_at)}</strong>
                <span>Last transaction added</span><strong>{formatDateTime(health?.last_transaction_at)}</strong>
                <span>Last feedback sent</span><strong>{formatDateTime(health?.last_feedback_at)}</strong>
              </div>
              <p className="admin-user-health-note">Counts and timestamps only. Transaction details remain private.</p>
            </>
          )}
        </section>
        <section className="admin-user-access" aria-label="Account access">
          <div className="admin-user-access-heading">
            <div><span className="admin-panel-kicker">ACCOUNT ACCESS</span><h3>{suspended ? 'Access blocked' : 'Access allowed'}</h3></div>
            <ShieldCheck size={17} />
          </div>
          <p>Blocking an account prevents new sign-ins and protects its synced finance, family, and feedback data. An open page locks within 30 seconds; data already displayed may remain visible until then.</p>
          {suspended && <div className="admin-user-access-expiry">{suspensionExpiryLabel(user.banned_until)}</div>}
          {accessSetupWarning ? (
            <div className="admin-user-access-note" role="status">{accessSetupWarning} Apply the SQL setup before changing account access.</div>
          ) : isOwnAccount ? (
            <div className="admin-user-access-note">You cannot change access for your own admin account.</div>
          ) : pendingAction ? (
            <div className="admin-user-action-prompt" role="group" aria-label="Confirm account access change">
              <strong>{pendingAction === 'suspend'
                ? `Block account access for ${id} for ${suspensionDurationLabel(suspensionDuration)}?`
                : `Restore account access for ${id}?`}</strong>
              {pendingAction === 'suspend' && (
                <label className="admin-suspension-duration">
                  <span>Suspension duration</span>
                  <select value={suspensionDuration} onChange={(event) => setSuspensionDuration(event.target.value)} disabled={actionLoading}>
                    {SUSPENSION_DURATIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                </label>
              )}
              {actionError && <span className="admin-user-action-error" role="alert">{actionError}</span>}
              <div>
                <button type="button" className="admin-user-action-cancel" onClick={() => { setPendingAction(''); setActionError(''); }} disabled={actionLoading}>Cancel</button>
                <button type="button" className={`admin-user-action-confirm${pendingAction === 'suspend' ? ' danger' : ''}`} onClick={confirmAccountAction} disabled={actionLoading}>
                  {actionLoading ? <LoaderCircle size={14} className="is-spinning" /> : <ShieldCheck size={14} />}
                  {actionLoading ? 'Saving…' : pendingAction === 'suspend' ? 'Confirm block' : 'Confirm restore'}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" className={`admin-user-access-button${suspended ? ' restore' : ''}`} onClick={() => setPendingAction(suspended ? 'reactivate' : 'suspend')}>
              <ShieldCheck size={14} />{suspended ? 'Restore account access' : 'Block account access'}
            </button>
          )}
        </section>
        <button type="button" className="admin-primary-button admin-modal-done" onClick={onClose}>Done</button>
      </section>
    </div>
  );
}
