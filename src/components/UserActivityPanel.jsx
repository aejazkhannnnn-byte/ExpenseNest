import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowDownToLine,
  CalendarDays,
  Clock3,
  Database,
  Filter,
  History,
  LoaderCircle,
  RefreshCw,
  Search,
  SearchX,
  Settings2,
  ShieldCheck,
  Target,
  UsersRound,
  WalletCards,
  X,
} from 'lucide-react';
import { clearUserActivity, loadUserActivity } from '../activityLog';
import { formatAppDateTime } from '../dateFormatting';

const PAGE_SIZE = 40;
const EVENT_LABELS = {
  transaction_added: ['Added a transaction', 'Transactions'],
  transaction_updated: ['Updated a transaction', 'Transactions'],
  transaction_deleted: ['Deleted a transaction', 'Transactions'],
  csv_imported: ['Imported transactions from CSV', 'Data'],
  csv_exported: ['Exported transactions to CSV', 'Data'],
  backup_restored: ['Restored a data backup', 'Data'],
  backup_exported: ['Downloaded a data backup', 'Data'],
  account_added: ['Added an account', 'Accounts'],
  account_updated: ['Updated an account', 'Accounts'],
  account_deleted: ['Removed an account', 'Accounts'],
  legacy_entries_assigned: ['Assigned older entries to an account', 'Accounts'],
  monthly_budget_updated: ['Updated a monthly budget', 'Planning'],
  category_limit_updated: ['Updated a category spending limit', 'Planning'],
  recurring_schedule_created: ['Created a recurring schedule', 'Planning'],
  recurring_schedule_updated: ['Updated a recurring schedule', 'Planning'],
  recurring_schedule_deleted: ['Removed a recurring schedule', 'Planning'],
  recurring_payment_recorded: ['Recorded a recurring payment', 'Planning'],
  savings_goal_created: ['Created a savings goal', 'Planning'],
  savings_goal_contribution: ['Added progress to a savings goal', 'Planning'],
  savings_goal_deleted: ['Removed a savings goal', 'Planning'],
  category_created: ['Added a custom category', 'Settings'],
  category_deleted: ['Removed a custom category', 'Settings'],
  settings_updated: ['Updated application preferences', 'Settings'],
  user_signed_in: ['Signed in to ExpenseNest', 'Security'],
  user_signed_out: ['Signed out of ExpenseNest', 'Security'],
  feedback_submitted: ['Sent feedback to ExpenseNest', 'Communication'],
  family_created: ['Created a family group', 'Family'],
  family_invitation_sent: ['Sent a family invitation', 'Family'],
  family_invitation_accepted: ['Joined a family group', 'Family'],
  family_member_removed: ['Removed a family member', 'Family'],
  family_transaction_added: ['Added a family transaction', 'Family'],
  family_transaction_updated: ['Updated a family transaction', 'Family'],
  family_transaction_deleted: ['Removed a family transaction', 'Family'],
};

const GROUP_ICONS = {
  Transactions: WalletCards,
  Planning: Target,
  Accounts: Database,
  Settings: Settings2,
  Family: UsersRound,
  Data: ShieldCheck,
  Security: ShieldCheck,
  Communication: Activity,
};

function exportCell(value) {
  return `"${String(value ?? '').replaceAll('"', '""')}"`;
}

export default function UserActivityPanel({ user }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [range, setRange] = useState('30');
  const [hasMore, setHasMore] = useState(false);
  const [clearing, setClearing] = useState(false);

  const loadFirstPage = useCallback(async (active = () => true) => {
    if (!user?.id) {
      setItems([]);
      setHasMore(false);
      setError('Sign in to keep your activity history with your account.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const rows = await loadUserActivity(user.id, { limit: PAGE_SIZE });
      if (!active()) return;
      setItems(rows);
      setHasMore(rows.length === PAGE_SIZE);
    } catch (loadError) {
      if (active()) setError(loadError.message || 'Could not load your activity history.');
    } finally {
      if (active()) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    let active = true;
    loadFirstPage(() => active);
    return () => { active = false; };
  }, [loadFirstPage]);

  useEffect(() => {
    function refreshWhenActivityIsRecorded() {
      loadFirstPage();
    }
    window.addEventListener('expensenest:user-activity-recorded', refreshWhenActivityIsRecorded);
    return () => window.removeEventListener('expensenest:user-activity-recorded', refreshWhenActivityIsRecorded);
  }, [loadFirstPage]);

  const filteredItems = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    const cutoff = range === 'all' ? null : Date.now() - Number(range) * 86_400_000;
    return items.filter((item) => {
      const [label, group] = EVENT_LABELS[item.event_type] || ['Updated ExpenseNest', 'Settings'];
      const matchesCategory = category === 'all' || category === group;
      const matchesSearch = !query || `${label} ${group}`.toLowerCase().includes(query);
      const matchesRange = cutoff === null || new Date(item.created_at).getTime() >= cutoff;
      return matchesCategory && matchesSearch && matchesRange;
    });
  }, [items, searchTerm, category, range]);

  async function loadOlder() {
    const cursor = items.at(-1);
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    setError('');
    try {
      const rows = await loadUserActivity(user.id, { before: cursor, limit: PAGE_SIZE });
      setItems((current) => {
        const knownIds = new Set(current.map((item) => item.id));
        return [...current, ...rows.filter((item) => !knownIds.has(item.id))];
      });
      setHasMore(rows.length === PAGE_SIZE);
    } catch (loadError) {
      setError(loadError.message || 'Could not load older activity.');
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleClearHistory() {
    if (!user?.id || !window.confirm('Clear your activity history? This does not delete transactions or other ExpenseNest data.')) return;
    setClearing(true);
    setError('');
    try {
      await clearUserActivity(user.id);
      setItems([]);
      setHasMore(false);
    } catch (clearError) {
      setError(clearError.message || 'Could not clear your activity history.');
    } finally {
      setClearing(false);
    }
  }

  function exportHistory() {
    if (!filteredItems.length) return;
    const rows = [
      ['Date', 'Activity', 'Category'],
      ...filteredItems.map((item) => [
        item.created_at,
        EVENT_LABELS[item.event_type]?.[0] || 'Updated ExpenseNest',
        EVENT_LABELS[item.event_type]?.[1] || 'Settings',
      ]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(exportCell).join(',')).join('\r\n')}`;
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `ExpenseNest_my_activity_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  return (
    <section className="panel user-activity-panel" id="activity" aria-labelledby="user-activity-title">
      <div className="user-activity-heading">
        <div className="user-activity-title">
          <span className="user-activity-heading-icon"><History size={19} aria-hidden="true" /></span>
          <div>
            <p className="eyebrow">YOUR ACCOUNT</p>
            <h2 id="user-activity-title">Activity history</h2>
            <p>Your recent account changes, kept private to your signed-in account.</p>
          </div>
        </div>
        <div className="user-activity-actions">
          <button type="button" className="user-activity-icon-button" onClick={() => loadFirstPage()} disabled={loading} aria-label="Refresh activity history" title="Refresh">
            <RefreshCw size={15} className={loading ? 'is-spinning' : ''} />
          </button>
          <button type="button" className="user-activity-export" onClick={exportHistory} disabled={!filteredItems.length}>
            <ArrowDownToLine size={14} /> Export CSV
          </button>
          <button type="button" className="user-activity-clear" onClick={handleClearHistory} disabled={!items.length || clearing}>
            {clearing ? 'Clearing...' : 'Clear history'}
          </button>
        </div>
      </div>

      <div className="user-activity-toolbar">
        <label className="user-activity-search">
          <Search size={15} aria-hidden="true" />
          <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search your activity" aria-label="Search your activity" />
          {searchTerm && <button type="button" onClick={() => setSearchTerm('')} aria-label="Clear search"><X size={14} /></button>}
        </label>
        <label className="user-activity-select">
          <Filter size={14} aria-hidden="true" />
          <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter activity category">
            <option value="all">All activity</option>
            {Object.keys(GROUP_ICONS).map((group) => <option key={group} value={group}>{group}</option>)}
          </select>
        </label>
        <label className="user-activity-select">
          <CalendarDays size={14} aria-hidden="true" />
          <select value={range} onChange={(event) => setRange(event.target.value)} aria-label="Filter activity date range">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All available</option>
          </select>
        </label>
        <span className="user-activity-count"><strong>{filteredItems.length}</strong> shown</span>
      </div>

      {error && <div className="user-activity-message error" role="alert"><Activity size={15} />{error}</div>}
      {loading ? (
        <div className="user-activity-state"><LoaderCircle size={19} className="is-spinning" /> Loading activity...</div>
      ) : filteredItems.length === 0 ? (
        <div className="user-activity-empty">
          <span><SearchX size={20} aria-hidden="true" /></span>
          <strong>{items.length ? 'No activity matches these filters' : 'Your activity will appear here'}</strong>
          <small>{items.length ? 'Try a longer date range or clear your search.' : 'Transactions, budgets and other important changes are recorded without storing transaction details.'}</small>
          {items.length > 0 && <button type="button" onClick={() => { setSearchTerm(''); setCategory('all'); setRange('all'); }}>Clear filters</button>}
        </div>
      ) : (
        <div className="user-activity-list">
          {filteredItems.map((item) => {
            const [label, group] = EVENT_LABELS[item.event_type] || ['Updated ExpenseNest', 'Settings'];
            const Icon = GROUP_ICONS[group] || Activity;
            return (
              <article className="user-activity-row" key={item.id}>
                <span className={`user-activity-row-icon ${group.toLowerCase()}`}><Icon size={16} aria-hidden="true" /></span>
                <div className="user-activity-row-copy"><strong>{label}</strong><small>{group}</small></div>
                <time dateTime={item.created_at}><Clock3 size={12} aria-hidden="true" />{formatAppDateTime(item.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}</time>
              </article>
            );
          })}
        </div>
      )}

      {!loading && hasMore && <button type="button" className="user-activity-load-more" onClick={loadOlder} disabled={loadingMore}>{loadingMore ? 'Loading older activity...' : 'Load older activity'}</button>}
      {!error && items.length > 0 && <p className="user-activity-footnote"><ShieldCheck size={13} /> Only this signed-in account can read or clear this history. Event records omit amounts and descriptions.</p>}
    </section>
  );
}
