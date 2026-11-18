
import {
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';

import { supabase } from '../supabase';
import './AdminDashboard.css';

const MENU = [
  { name: 'Overview', icon: '📊' },
  { name: 'Users', icon: '👥' },
  { name: 'Analytics', icon: '📈' },
  { name: 'Feedback', icon: '💬' },
  { name: 'Settings', icon: '⚙️' },
];

export default function AdminDashboard({ onLogout }) {
  const [section, setSection] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [lastUpdated, setLastUpdated] = useState(null);

  // LOAD ADMIN DASHBOARD DATA
  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) throw sessionError;

      if (!sessionData.session) {
        throw new Error('Please login again.');
      }

      const { data, error: functionError } =
        await supabase.functions.invoke('admin-dashboard');

      if (functionError) throw functionError;

      if (!data?.success) {
        throw new Error(
          data?.message || 'Unable to load dashboard.'
        );
      }

      setStats(data.stats || {});
      setUsers(Array.isArray(data.users) ? data.users : []);
      setLastUpdated(new Date());

    } catch (err) {
      setError(err.message || 'Dashboard loading failed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // FILTER USERS
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const email = (user.email || '').toLowerCase();
      const searchText = search.trim().toLowerCase();

      const matchesSearch = email.includes(searchText);

      const matchesFilter =
        filter === 'All' ||
        (filter === 'Registered' &&
          (!user.status || user.status === 'Registered'));

      return matchesSearch && matchesFilter;
    });
  }, [users, search, filter]);

  // MONTHLY REGISTRATIONS
  const monthlyRegistrations = useMemo(() => {
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - i);

      const count = users.filter((user) => {
        if (!user.created_at) return false;

        const created = new Date(user.created_at);

        return (
          created.getFullYear() === date.getFullYear() &&
          created.getMonth() === date.getMonth()
        );
      }).length;

      months.push({
        label: date.toLocaleDateString('en-IN', {
          month: 'short',
        }),
        count,
      });
    }

    return months;
  }, [users]);

  const maxRegistrations = Math.max(
    1,
    ...monthlyRegistrations.map((item) => item.count)
  );

  // DASHBOARD STATISTICS
  const cards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers ?? users.length,
      icon: '👥',
      note: 'Registered accounts',
      type: 'accounts',
    },
    {
      title: 'New Registrations',
      value: stats?.newUsers ?? '—',
      icon: '🆕',
      note: 'Backend reported data',
      type: 'new',
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers ?? '—',
      icon: '🟢',
      note: 'Backend reported data',
      type: 'active',
    },
    {
      title: 'Page Views',
      value: stats?.pageViews ?? '—',
      icon: '🌐',
      note: 'Analytics integration required',
      type: 'views',
    },
  ];

  // RECENT USERS
  const recentUsers = useMemo(() => {
    return [...users]
      .sort(
        (a, b) =>
          new Date(b.created_at || 0) -
          new Date(a.created_at || 0)
      )
      .slice(0, 5);
  }, [users]);

  const navigateTo = (target) => {
    setSection(target);
    setSearch('');
    setFilter('All');
  };

  return (
    <div className="admin-layout">

      {/* SIDEBAR */}
      <aside className="admin-sidebar">

        <div className="admin-brand">
          <span className="admin-brand-icon">₹</span>
          <span>ExpenseNest</span>
        </div>

        <div className="admin-label">ADMIN MENU</div>

        <nav className="admin-navigation">
          {MENU.map((item) => (
            <button
              key={item.name}
              className={`admin-menu ${
                section === item.name ? 'active' : ''
              }`}
              onClick={() => navigateTo(item.name)}
              aria-current={
                section === item.name ? 'page' : undefined
              }
            >
              <span>{item.icon}</span>
              {item.name}
              {section === item.name && (
                <span className="admin-menu-indicator">●</span>
              )}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-sidebar-note">
            <span>🛡️</span>
            <div>
              <strong>Secure Portal</strong>
              <small>Administrator access</small>
            </div>
          </div>

          <button
            className="admin-logout"
            onClick={onLogout}
          >
            <span>↪</span>
            Logout
          </button>
        </div>

      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">

        {/* HEADER */}
        <header className="admin-header">

          <div>
            <div className="admin-breadcrumb">
              Dashboard / {section}
            </div>

            <h1>{section}</h1>

            <p>ExpenseNest Administration</p>
          </div>

          <div className="admin-header-actions">

            <button
              className="admin-refresh"
              onClick={loadDashboard}
              disabled={loading}
            >
              ↻ {loading ? 'Loading...' : 'Refresh'}
            </button>

            <div className="admin-badge">
              🔐 Admin
            </div>

          </div>

        </header>

        {lastUpdated && (
          <p className="admin-updated">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}

        {/* LOADING */}
        {loading ? (
          <div className="admin-message">
            Loading dashboard...
          </div>
        ) : error ? (
          <div className="admin-message admin-error">
            <strong>Unable to load dashboard</strong>
            <p>{error}</p>

            <button onClick={loadDashboard}>
              Try Again
            </button>
          </div>
        ) : (

          <>

            {/* OVERVIEW */}
            {section === 'Overview' && (
              <>

                <div className="overview-hero">
                  <div>
                    <span className="overview-eyebrow">
                      ADMIN CONTROL CENTER
                    </span>

                    <h2>Welcome to ExpenseNest 👋</h2>

                    <p>
                      Monitor your platform, track registrations
                      and manage your website from one place.
                    </p>
                  </div>

                  <div className="overview-hero-icon">
                    ₹
                  </div>
                </div>

                {/* STATISTICS */}
                <div className="admin-stats">
                  {cards.map((card, index) => (
                    <div
                      className={`admin-stat overview-stat stat-${index}`}
                      key={card.title}
                    >
                      <div className="overview-stat-top">
                        <span>{card.icon}</span>
                        <small>
                          {card.type.toUpperCase()}
                        </small>
                      </div>

                      <p>{card.title}</p>
                      <h2>{card.value}</h2>
                      <small>{card.note}</small>
                    </div>
                  ))}
                </div>

                {/* CHART AND QUICK ACTIONS */}
                <div className="overview-grid">

                  <div className="admin-panel overview-chart-panel">

                    <div className="overview-panel-heading">
                      <div>
                        <h3>Registration Growth</h3>
                        <p>
                          Monthly registrations from available user records
                        </p>
                      </div>

                      <span className="overview-tag">
                        6 Months
                      </span>
                    </div>

                    <div className="admin-chart">
                      {monthlyRegistrations.map((item) => (
                        <div
                          className="admin-chart-column"
                          key={item.label}
                        >
                          <strong>{item.count}</strong>

                          <div className="admin-chart-track">
                            <div
                              className="admin-chart-bar"
                              style={{
                                height: `${
                                  Math.max(
                                    5,
                                    (item.count / maxRegistrations) * 100
                                  )
                                }%`,
                              }}
                            />
                          </div>

                          <span>{item.label}</span>
                        </div>
                      ))}
                    </div>

                  </div>

                  <div className="admin-panel overview-quick-panel">

                    <h3>Quick Actions</h3>
                    <p>Quick access to admin sections</p>

                    {[
                      ['👥', 'Manage Users', 'Users'],
                      ['📈', 'View Analytics', 'Analytics'],
                      ['💬', 'User Feedback', 'Feedback'],
                      ['⚙️', 'Admin Settings', 'Settings'],
                    ].map(([icon, label, target]) => (
                      <button
                        key={target}
                        onClick={() => navigateTo(target)}
                      >
                        <span>{icon}</span>
                        <span>{label}</span>
                        <span>→</span>
                      </button>
                    ))}

                  </div>

                </div>

                {/* RECENT USERS */}
                <div className="admin-panel overview-recent-panel">

                  <div className="overview-panel-heading">
                    <div>
                      <h3>Recent Registrations</h3>
                      <p>Latest registered user accounts</p>
                    </div>

                    <button
                      className="admin-secondary-btn"
                      onClick={() => navigateTo('Users')}
                    >
                      View All →
                    </button>
                  </div>

                  <UserTable users={recentUsers} />

                </div>

              </>
            )}

            {/* USERS */}
            {section === 'Users' && (
              <div className="admin-panel">

                <div className="admin-users-heading">
                  <div>
                    <h3>User Management</h3>
                    <p>
                      {filteredUsers.length} matching accounts
                    </p>
                  </div>

                  <span className="overview-tag">
                    Total: {users.length}
                  </span>
                </div>

                <div className="admin-user-tools">

                  <input
                    type="search"
                    placeholder="Search by email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />

                  <select
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="All">All Users</option>
                    <option value="Registered">Registered</option>
                  </select>

                </div>

                <UserTable users={filteredUsers} />

              </div>
            )}

            {/* ANALYTICS */}
            {section === 'Analytics' && (
              <>

                <div className="admin-stats">
                  {cards.map((card) => (
                    <div className="admin-stat" key={card.title}>
                      <span>{card.icon}</span>
                      <p>{card.title}</p>
                      <h2>{card.value}</h2>
                      <small>{card.note}</small>
                    </div>
                  ))}
                </div>

                <div className="admin-panel">

                  <div className="overview-panel-heading">
                    <div>
                      <h3>Monthly Registrations</h3>
                      <p>
                        Registration counts based on user records
                        returned by the backend.
                      </p>
                    </div>
                  </div>

                  <div className="admin-chart">
                    {monthlyRegistrations.map((item) => (
                      <div
                        className="admin-chart-column"
                        key={item.label}
                      >
                        <strong>{item.count}</strong>

                        <div className="admin-chart-track">
                          <div
                            className="admin-chart-bar"
                            style={{
                              height: `${
                                Math.max(
                                  5,
                                  (item.count / maxRegistrations) * 100
                                )
                              }%`,
                            }}
                          />
                        </div>

                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>

                </div>

                <div className="admin-panel">
                  <h3>Analytics Information</h3>
                  <p>
                    The registration chart is calculated from the
                    user records returned by your backend. Page
                    views and active-user figures require their
                    own analytics data source.
                  </p>
                </div>

              </>
            )}

            {/* FEEDBACK */}
            {section === 'Feedback' && (
              <div className="admin-panel">

                <h3>User Feedback</h3>

                <p>
                  Feedback database integration is not configured yet.
                </p>

                <div className="admin-message">
                  Feedback records will appear after a secure
                  feedback backend is connected.
                </div>

              </div>
            )}

            {/* SETTINGS */}
            {section === 'Settings' && (
              <div className="admin-panel">

                <h3>Admin Settings</h3>
                <p>ExpenseNest administrator portal</p>

                <div className="admin-setting-row">
                  <div>
                    <strong>Admin Access</strong>
                    <p>
                      Protected by Supabase authentication
                    </p>
                  </div>

                  <span className="admin-status">
                    Protected
                  </span>
                </div>

                <div className="admin-setting-row">
                  <div>
                    <strong>Database Connection</strong>
                    <p>
                      Supabase dashboard data service
                    </p>
                  </div>

                  <span className="admin-status">
                    Connected
                  </span>
                </div>

                <div className="admin-setting-row">
                  <div>
                    <strong>Portal Theme</strong>
                    <p>Current theme: Premium Light</p>
                  </div>

                  <span className="admin-status">
                    Active
                  </span>
                </div>

                <button
                  className="admin-secondary-btn"
                  onClick={loadDashboard}
                >
                  ↻ Refresh Dashboard Data
                </button>

              </div>
            )}

          </>
        )}

      </main>
    </div>
  );
}

// USER TABLE COMPONENT
function UserTable({ users }) {

  if (!users.length) {
    return (
      <div className="admin-empty-state">
        <span>👥</span>
        <h3>No user records found</h3>
        <p>
          Registered accounts will appear here when available.
        </p>
      </div>
    );
  }

  return (
    <div className="admin-table-wrap">

      <table className="admin-table">

        <thead>
          <tr>
            <th>Email Address</th>
            <th>Registration Date</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user, index) => (
            <tr key={user.id || user.user_id || user.email || index}>

              <td>
                <div className="admin-user-email">
                  <span className="admin-user-avatar">
                    {(user.email || 'U').charAt(0).toUpperCase()}
                  </span>

                  {user.email || '—'}
                </div>
              </td>

              <td>
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-IN')
                  : '—'}
              </td>

              <td>
                <span className="admin-user-status">
                  {user.status || 'Registered'}
                </span>
              </td>

            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );
}
