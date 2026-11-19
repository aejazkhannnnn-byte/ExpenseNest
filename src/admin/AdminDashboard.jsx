import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  Check,
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
  MessageSquareText,
  RefreshCw,
  Search,
  SearchX,
  Settings2,
  ShieldCheck,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react';
import { supabase } from '../supabase';
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
  Users: 'Search and review registered ExpenseNest accounts.',
  Analytics: 'Registration activity from the admin data service.',
  Feedback: 'Review the state of your feedback inbox.',
  Activity: 'A record of administrator changes to feedback status.',
  Settings: 'Admin account and service status.',
};

function formatNumber(value) {
  if (value === null || value === undefined || value === '') return '—';
  const number = Number(value);
  return Number.isFinite(number) ? new Intl.NumberFormat('en-IN').format(number) : value;
}

function formatDate(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleDateString('en-IN', options);
}

function formatDateTime(value) {
  if (!value) return 'Not available';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not available';
  return date.toLocaleString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: 'numeric', minute: '2-digit' });
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

export default function AdminDashboard({ onLogout, adminUser }) {
  const [section, setSection] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [toast, setToast] = useState('');
  const [feedbackItems, setFeedbackItems] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);
  const [feedbackError, setFeedbackError] = useState('');
  const [feedbackFilter, setFeedbackFilter] = useState('all');
  const [updatingFeedbackId, setUpdatingFeedbackId] = useState(null);
  const [activityItems, setActivityItems] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState('');

  const adminEmail = adminUser?.email || '';
  const adminName = adminUser?.user_metadata?.full_name || adminEmail.split('@')[0] || 'Admin';
  const adminInitial = (adminName || 'A').charAt(0).toUpperCase();

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

      setStats(data.stats || {});
      setUsers(Array.isArray(data.users)
        ? data.users.filter((user) => user && typeof user === 'object')
        : []);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message || 'Dashboard loading failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFeedback = useCallback(async () => {
    setFeedbackLoading(true);
    setFeedbackError('');

    try {
      const { data, error: queryError } = await supabase
        .from('feedback_messages')
        .select('id, user_id, user_email, category, message, status, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (queryError) {
        const missingTable = queryError.code === '42P01' || queryError.code === 'PGRST205';
        throw new Error(missingTable
          ? 'Feedback inbox is not set up yet. Run supabase/feedback_setup.sql in the Supabase SQL Editor.'
          : queryError.message || 'Could not load feedback.');
      }

      setFeedbackItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setFeedbackError(err.message || 'Could not load feedback.');
    } finally {
      setFeedbackLoading(false);
    }
  }, []);

  const loadActivity = useCallback(async () => {
    setActivityLoading(true);
    setActivityError('');

    try {
      const { data, error: queryError } = await supabase
        .from('admin_activity_logs')
        .select('id, actor_id, actor_email, action, target_type, target_id, details, created_at')
        .order('created_at', { ascending: false })
        .limit(100);

      if (queryError) {
        const missingTable = queryError.code === '42P01' || queryError.code === 'PGRST205';
        throw new Error(missingTable
          ? 'Activity log is not set up yet. Run supabase/admin_activity_log.sql in the Supabase SQL Editor.'
          : queryError.message || 'Could not load the activity log.');
      }

      setActivityItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setActivityError(err.message || 'Could not load the activity log.');
    } finally {
      setActivityLoading(false);
    }
  }, []);

  async function updateFeedbackStatus(feedbackId, status) {
    setUpdatingFeedbackId(feedbackId);
    setFeedbackError('');

    try {
      const { data, error: updateError } = await supabase
        .from('feedback_messages')
        .update({ status })
        .eq('id', feedbackId)
        .select('id, status')
        .maybeSingle();

      if (updateError) throw updateError;
      if (!data) throw new Error('The feedback status was not updated. Refresh and try again.');

      setFeedbackItems((current) => current.map((item) => (
        item.id === feedbackId ? { ...item, status: data.status } : item
      )));
    } catch (err) {
      setFeedbackError(err.message || 'Could not update feedback status.');
    } finally {
      setUpdatingFeedbackId(null);
    }
  }

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  useEffect(() => {
    loadFeedback();
  }, [loadFeedback]);

  useEffect(() => {
    if (section === 'Feedback') loadFeedback();
  }, [section, loadFeedback]);

  useEffect(() => {
    if (section === 'Activity') loadActivity();
  }, [section, loadActivity]);

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
      const matchesSearch = !query || [user.email, user.id, user.user_id]
        .some((value) => String(value || '').toLowerCase().includes(query));
      const status = String(user.status || 'Registered').toLowerCase();
      const matchesFilter = filter === 'All' || status === filter.toLowerCase();
      return matchesSearch && matchesFilter;
    });
  }, [users, search, filter]);

  const newFeedbackCount = feedbackItems.filter((item) => item.status === 'new').length;

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
        user.id || user.user_id || '',
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
          <span className="admin-brand-mark"><span>₹</span></span>
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
                {item.name === 'Feedback' && newFeedbackCount > 0 && (
                  <span className="admin-menu-badge" aria-label={`${newFeedbackCount} new feedback messages`}>
                    {newFeedbackCount > 99 ? '99+' : newFeedbackCount}
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
            <button
              type="button"
              className="admin-refresh"
              onClick={section === 'Feedback' ? loadFeedback : section === 'Activity' ? loadActivity : loadDashboard}
              disabled={section === 'Feedback' ? feedbackLoading : section === 'Activity' ? activityLoading : loading}
            >
              <RefreshCw size={15} className={(section === 'Feedback' ? feedbackLoading : section === 'Activity' ? activityLoading : loading) ? 'is-spinning' : ''} />
              <span>{(section === 'Feedback' ? feedbackLoading : section === 'Activity' ? activityLoading : loading) ? 'Updating' : 'Refresh data'}</span>
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
                <UsersSection
                  users={filteredUsers}
                  loadedCount={users.length}
                  search={search}
                  setSearch={setSearch}
                  filter={filter}
                  setFilter={setFilter}
                  onViewUser={setSelectedUser}
                  onExport={exportUsersCsv}
                />
              )}

              {section === 'Analytics' && (
                <AnalyticsSection metrics={metrics} monthlyRegistrations={monthlyRegistrations} />
              )}

              {section === 'Feedback' && (
                <FeedbackSection
                  items={feedbackItems}
                  loading={feedbackLoading}
                  error={feedbackError}
                  filter={feedbackFilter}
                  setFilter={setFeedbackFilter}
                  onRefresh={loadFeedback}
                  onUpdateStatus={updateFeedbackStatus}
                  updatingId={updatingFeedbackId}
                />
              )}

              {section === 'Activity' && (
                <ActivitySection
                  items={activityItems}
                  loading={activityLoading}
                  error={activityError}
                  onRefresh={loadActivity}
                />
              )}

              {section === 'Settings' && (
                <SettingsSection adminName={adminName} adminEmail={adminEmail} serviceReady={hasLoadedData} loading={loading} />
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

function UsersSection({ users, loadedCount, search, setSearch, filter, setFilter, onViewUser, onExport }) {
  return (
    <section className="admin-panel admin-users-panel">
      <div className="admin-panel-heading admin-users-heading">
        <div><span className="admin-panel-kicker">ACCOUNT DIRECTORY</span><h2>User management</h2><p>{users.length} matching {users.length === 1 ? 'account' : 'accounts'}</p></div>
        <div className="admin-users-heading-actions">
          <span className="admin-count-chip">{users.length} <small>shown / {loadedCount} loaded</small></span>
          <button type="button" className="admin-export-button" onClick={() => onExport(users)} disabled={!users.length} title="Export the currently shown users to CSV">
            <Download size={14} /> Export shown
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
          </select>
        </label>
      </div>
      <UserTable users={users} onViewUser={onViewUser} emptyTitle="No users match this search" emptyMessage="Try a different email, user ID, or status filter." />
    </section>
  );
}

function AnalyticsSection({ metrics, monthlyRegistrations }) {
  return (
    <div className="admin-page-content">
      <section className="admin-metrics-grid" aria-label="Analytics summary">
        {metrics.map((metric) => <MetricCard key={metric.title} {...metric} />)}
      </section>
      <section className="admin-panel admin-analytics-panel">
        <div className="admin-panel-heading">
          <div><span className="admin-panel-kicker">REGISTRATION ACTIVITY</span><h2>Monthly registrations</h2><p>Calculated from user records returned by the admin data service.</p></div>
          <span className="admin-period-chip"><CalendarDays size={14} /> Six months</span>
        </div>
        <RegistrationChart months={monthlyRegistrations} />
      </section>
      <section className="admin-panel admin-data-coverage">
        <div className="admin-panel-heading"><div><span className="admin-panel-kicker">DATA COVERAGE</span><h2>What this dashboard can report</h2><p>Metrics appear here when the admin service returns them.</p></div></div>
        <div className="admin-coverage-grid">
          <div><span className="coverage-icon available"><UsersRound size={17} /></span><strong>Registrations</strong><small>Available from returned user records.</small><span className="coverage-status available">Available</span></div>
          <div><span className="coverage-icon"><Activity size={17} /></span><strong>Active users</strong><small>Requires an activity data source.</small><span className="coverage-status">When connected</span></div>
          <div><span className="coverage-icon"><Eye size={17} /></span><strong>Page views</strong><small>Requires web analytics integration.</small><span className="coverage-status">When connected</span></div>
        </div>
      </section>
    </div>
  );
}

function FeedbackSection({ items, loading, error, filter, setFilter, onRefresh, onUpdateStatus, updatingId }) {
  const [searchTerm, setSearchTerm] = useState('');
  const counts = {
    all: items.length,
    new: items.filter((item) => item.status === 'new').length,
    in_review: items.filter((item) => item.status === 'in_review').length,
    resolved: items.filter((item) => item.status === 'resolved').length,
  };
  const statusLabels = { new: 'New', in_review: 'In review', resolved: 'Resolved' };
  const categoryLabels = { general: 'General', idea: 'Feature idea', bug: 'Bug report', other: 'Other' };
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleItems = items.filter((item) => {
    const matchesFilter = filter === 'all' || item.status === filter;
    const matchesSearch = !normalizedSearch || [
      item.user_email,
      item.user_id,
      item.category,
      categoryLabels[item.category],
      item.message,
    ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
    return matchesFilter && matchesSearch;
  });

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
          <div><span className="admin-panel-kicker">FEEDBACK INBOX</span><h2>Messages from users</h2><p>Review submissions and update their status.</p></div>
          <span className="admin-count-chip">{counts.all} <small>total</small></span>
        </div>

        <div className="admin-feedback-toolbar">
          <div className="admin-feedback-filters" aria-label="Filter feedback">
            {[
              ['all', 'All'],
              ['new', 'New'],
              ['in_review', 'In review'],
              ['resolved', 'Resolved'],
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
          <button type="button" className="admin-feedback-refresh" onClick={onRefresh} disabled={loading} aria-label="Refresh feedback">
            <RefreshCw size={15} className={loading ? 'is-spinning' : ''} />
          </button>
        </div>

        {error && <div className="admin-feedback-error" role="alert"><CircleAlert size={16} /><span>{error}</span></div>}

        {loading ? (
          <div className="admin-feedback-loading"><LoaderCircle size={20} className="is-spinning" /> Loading feedback…</div>
        ) : visibleItems.length === 0 ? (
          <div className="admin-empty-state admin-feedback-empty">
            <span className="admin-empty-icon"><MessageSquareText size={22} /></span>
            <h3>{error ? 'Feedback inbox is unavailable' : normalizedSearch ? 'No matching feedback' : filter === 'all' ? 'No feedback yet' : `No ${statusLabels[filter]?.toLowerCase() || ''} feedback`}</h3>
            <p>{error ? 'Set up the feedback table or refresh after resolving the issue.' : normalizedSearch ? 'Try another email, category, or search phrase.' : 'User submissions will appear here when they send feedback from the Contact page.'}</p>
          </div>
        ) : (
          <div className="admin-feedback-list">
            {visibleItems.map((item) => {
              const sender = item.user_email || `User ${String(item.user_id || '').slice(0, 8)}`;
              return (
                <article className="admin-feedback-card" key={item.id}>
                  <div className="admin-feedback-card-top">
                    <div className="admin-feedback-sender">
                      <span className="admin-feedback-avatar">{sender.charAt(0).toUpperCase()}</span>
                      <div>
                        {item.user_email ? <a href={`mailto:${item.user_email}`}>{item.user_email}</a> : <strong>{sender}</strong>}
                        <small><Clock3 size={12} /> {formatDateTime(item.created_at)}</small>
                      </div>
                    </div>
                    <span className={`admin-feedback-status status-${item.status}`}>{statusLabels[item.status] || item.status}</span>
                  </div>
                  <div className="admin-feedback-message-heading">
                    <span className={`admin-feedback-category category-${item.category}`}>
                      {categoryLabels[item.category] || item.category || 'General'}
                    </span>
                    <span className="admin-feedback-id">#{String(item.id).slice(0, 8)}</span>
                  </div>
                  <p className="admin-feedback-message">{item.message}</p>
                  <div className="admin-feedback-card-bottom">
                    <label>
                      <span>Update status</span>
                      <select value={item.status} onChange={(event) => onUpdateStatus(item.id, event.target.value)} disabled={updatingId === item.id} aria-label={`Update feedback status for ${sender}`}>
                        <option value="new">New</option>
                        <option value="in_review">In review</option>
                        <option value="resolved">Resolved</option>
                      </select>
                      {updatingId === item.id && <LoaderCircle size={14} className="is-spinning" />}
                    </label>
                    {item.user_email && <a className="admin-feedback-reply" href={`mailto:${item.user_email}?subject=${encodeURIComponent('ExpenseNest feedback')}`}><Mail size={14} /> Reply by email</a>}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function ActivitySection({ items, loading, error, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const statusLabels = { new: 'New', in_review: 'In review', resolved: 'Resolved' };
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const visibleItems = items.filter((item) => {
    const details = item.details && typeof item.details === 'object' ? item.details : {};
    const matchesStatus = statusFilter === 'all' || details.to === statusFilter;
    const matchesSearch = !normalizedSearch || [
      item.actor_email,
      item.actor_id,
      details.user_email,
      details.category,
      item.target_id,
      details.from,
      details.to,
    ].some((value) => String(value || '').toLowerCase().includes(normalizedSearch));
    return matchesStatus && matchesSearch;
  });

  function exportVisibleActivity() {
    if (!visibleItems.length) return;
    const rows = [
      ['Changed at', 'Admin email', 'Feedback email', 'Category', 'Previous status', 'New status', 'Feedback ID'],
      ...visibleItems.map((item) => {
        const details = item.details && typeof item.details === 'object' ? item.details : {};
        return [
          item.created_at || '',
          item.actor_email || item.actor_id || '',
          details.user_email || '',
          details.category || '',
          statusLabels[details.from] || details.from || '',
          statusLabels[details.to] || details.to || '',
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
            <p>Feedback status changes made by administrators, newest first.</p>
          </div>
          <button type="button" className="admin-feedback-refresh" onClick={onRefresh} disabled={loading} aria-label="Refresh activity log">
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
            <p>When an administrator changes a feedback status, the change and time will appear here.</p>
          </div>
        ) : items.length === 0 ? (
          <div className="admin-empty-state admin-feedback-empty">
            <span className="admin-empty-icon"><Database size={22} /></span>
            <h3>Activity log is unavailable</h3>
            <p>Set up the activity log SQL or refresh after resolving the issue.</p>
          </div>
        ) : (
          <>
            <div className="admin-activity-toolbar">
              <label className="admin-activity-search">
                <Search size={15} aria-hidden="true" />
                <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search admin, email, or feedback ID" aria-label="Search activity log" />
                {searchTerm && <button type="button" onClick={() => setSearchTerm('')} aria-label="Clear activity search"><X size={14} /></button>}
              </label>
              <label className="admin-activity-filter">
                <Filter size={14} aria-hidden="true" />
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter activity by new status">
                  <option value="all">All statuses</option>
                  <option value="new">Changed to New</option>
                  <option value="in_review">Changed to In review</option>
                  <option value="resolved">Changed to Resolved</option>
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
                <p>Try a different search or status filter.</p>
              </div>
            ) : (
              <div className="admin-activity-list">
                {visibleItems.map((item) => {
                  const details = item.details && typeof item.details === 'object' ? item.details : {};
                  const fromStatus = statusLabels[details.from] || details.from || 'Unknown';
                  const toStatus = statusLabels[details.to] || details.to || 'Unknown';
                  const target = details.user_email || details.category || `Feedback #${String(item.target_id || '').slice(0, 8)}`;

                  return (
                    <article className="admin-activity-row" key={item.id}>
                      <span className="admin-activity-icon"><MessageSquareText size={17} /></span>
                      <div className="admin-activity-copy">
                        <div className="admin-activity-title-row">
                          <strong>Feedback status changed</strong>
                          <span className="admin-activity-transition">
                            <span className={`status-${details.from || 'unknown'}`}>{fromStatus}</span>
                            <ArrowRight size={13} />
                            <span className={`status-${details.to || 'unknown'}`}>{toStatus}</span>
                          </span>
                        </div>
                        <p>{target}</p>
                        <small><ShieldCheck size={12} /> {item.actor_email || `Admin ${String(item.actor_id || '').slice(0, 8) || 'account'}`} <span>·</span> <Clock3 size={12} /> {formatDateTime(item.created_at)}</small>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </>
        )}
        {!error && items.length > 0 && <div className="admin-activity-footer">Showing {visibleItems.length} of {items.length} loaded records. The log loads the latest 100 changes.</div>}
      </section>
    </div>
  );
}

function SettingsSection({ adminName, adminEmail, serviceReady, loading }) {
  const rows = [
    { icon: ShieldCheck, title: 'Administrator access', detail: 'Signed in through Supabase and checked against the admin list.', status: 'Verified', ready: true },
    { icon: Database, title: 'Dashboard data service', detail: 'Supabase Edge Function: admin-dashboard.', status: loading ? 'Updating' : serviceReady ? 'Responding' : 'Not checked', ready: serviceReady },
    { icon: BarChart3, title: 'Analytics source', detail: 'Active user and page view metrics are not configured in the current response.', status: 'Not connected', ready: false },
  ];

  return (
    <div className="admin-settings-layout">
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
            const status = user.status || 'Registered';
            return (
              <tr key={id}>
                <td>
                  <div className="admin-user-cell">
                    <span className="admin-user-avatar">{(user.email || 'U').charAt(0).toUpperCase()}</span>
                    <span><strong>{email}</strong><small>{user.id || user.user_id || 'User ID not available'}</small></span>
                  </div>
                </td>
                <td>{formatDate(user.created_at, { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                <td><span className="admin-user-status"><span />{status}</span></td>
                <td><button type="button" className="admin-view-user" onClick={() => onViewUser?.(user)}><Eye size={15} /> View</button></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function UserDetailsModal({ user, onClose, onCopy }) {
  const email = user.email || '';
  const id = user.id || user.user_id || '';
  const initial = (email || 'U').charAt(0).toUpperCase();

  return (
    <div className="admin-modal-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="admin-user-modal" role="dialog" aria-modal="true" aria-labelledby="admin-user-modal-title">
        <div className="admin-modal-heading">
          <div><span className="admin-panel-kicker">ACCOUNT DETAILS</span><h2 id="admin-user-modal-title">User profile</h2></div>
          <button type="button" className="admin-icon-button" onClick={onClose} aria-label="Close details"><X size={18} /></button>
        </div>
        <div className="admin-modal-profile"><span className="admin-modal-avatar">{initial}</span><div><strong>{email || 'User account'}</strong><small>{user.status || 'Registered'}</small></div></div>
        <div className="admin-modal-details">
          <div><span>Email address</span><strong>{email || 'Not available'}</strong>{email && <button type="button" onClick={() => onCopy(email, 'Email')}><Copy size={14} /> Copy email</button>}</div>
          <div><span>User ID</span><strong className="admin-mono-text">{id || 'Not available'}</strong>{id && <button type="button" onClick={() => onCopy(id, 'User ID')}><Copy size={14} /> Copy ID</button>}</div>
          <div><span>Registration date</span><strong>{formatDateTime(user.created_at)}</strong></div>
          <div><span>Account status</span><strong>{user.status || 'Registered'}</strong></div>
        </div>
        <button type="button" className="admin-primary-button admin-modal-done" onClick={onClose}>Done</button>
      </section>
    </div>
  );
}
