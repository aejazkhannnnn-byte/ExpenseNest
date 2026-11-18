
import { useCallback, useEffect, useMemo, useState } from 'react';
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

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();

      if (!sessionData.session) {
        throw new Error('Please login again.');
      }

      const { data, error: functionError } =
        await supabase.functions.invoke('admin-dashboard');

      if (functionError) throw functionError;

      if (!data?.success) {
        throw new Error(data?.message || 'Unable to load dashboard.');
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

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const email = (user.email || '').toLowerCase();
      const matchesSearch = email.includes(search.toLowerCase());

      const matchesFilter =
        filter === 'All' ||
        (filter === 'Registered' &&
          (!user.status || user.status === 'Registered'));

      return matchesSearch && matchesFilter;
    });
  }, [users, search, filter]);

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
        label: date.toLocaleDateString('en-IN', { month: 'short' }),
        count,
      });
    }

    return months;
  }, [users]);

  const maxRegistrations = Math.max(
    1,
    ...monthlyRegistrations.map((item) => item.count)
  );

  const cards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers ?? users.length,
      icon: '👥',
      note: 'Registered accounts',
    },
    {
      title: 'New Registrations',
      value: stats?.newUsers ?? '—',
      icon: '🆕',
      note: 'Backend reported data',
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers ?? '—',
      icon: '🟢',
      note: 'Backend reported data',
    },
    {
      title: 'Page Views',
      value: stats?.pageViews ?? '—',
      icon: '🌐',
      note: 'Analytics integration required',
    },
  ];

  const recentUsers = [...users]
    .sort(
      (a, b) =>
        new Date(b.created_at || 0) -
        new Date(a.created_at || 0)
    )
    .slice(0, 5);

  return (
    <div className="admin-layout">
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
              onClick={() => setSection(item.name)}
            >
              <span>{item.icon}</span>
              {item.name}
            </button>
          ))}
        </nav>

        <button className="admin-logout" onClick={onLogout}>
          ↪ Logout
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
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

            <div className="admin-badge">🔐 Admin</div>
          </div>
        </header>

        {lastUpdated && (
          <p className="admin-updated">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        )}

        {loading ? (
          <div className="admin-message">Loading dashboard...</div>
        ) : error ? (
          <div className="admin-message admin-error">
            {error}
            <button onClick={loadDashboard}>Try again</button>
          </div>
        ) : (
          <>
            {section === 'Overview' && (
              <>
                <div className="overview-hero">
                  <div>
                    <span className="overview-eyebrow">
                      ADMIN CONTROL CENTER
                    </span>
                    <h2>Welcome to ExpenseNest 👋</h2>
                    <p>
                      Monitor your platform, track registrations and
                      manage your website from one place.
                    </p>
                  </div>

                  <div className="overview-hero-icon">₹</div>
                </div>

                <div className="admin-stats">
                  {cards.map((card, index) => (
                    <div
                      className={`admin-stat overview-stat stat-${index}`}
                      key={card.title}
                    >
                      <div className="overview-stat-top">
                        <span>{card.icon}</span>
                        <small>
                          {index === 0 ? 'ACCOUNTS' : 'OVERVIEW'}
                        </small>
                      </div>

                      <p>{card.title}</p>
                      <h2>{card.value}</h2>
                      <small>{card.note}</small>
                    </div>
                  ))}
                </div>

                <div className="overview-grid">
                  <div className="admin-panel overview-chart-panel">
                    <div className="overview-panel-heading">
                      <div>
                        <h3>Registration Growth</h3>
                        <p>
                          Monthly registrations from available user records
                        </p>
                      </div>

                      <span className="overview-tag">6 Months</span>
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
                                height: `${Math.max(
                                  5,
                                  (item.count / maxRegistrations) * 100
                                )}%`,
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
                        onClick={() => setSection(target)}
                      >
                        <span>{icon}</span>
                        <span>{label}</span>
                        <span>→</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="admin-panel overview-recent-panel">
                  <div className="overview-panel-heading">
                    <div>
                      <h3>Recent Registrations</h3>
                      <p>Latest registered user accounts</p>
                    </div>

                    <button
                      className="admin-secondary-btn"
                      onClick={() => setSection('Users')}
                    >
                      View All →
                    </button>
                  </div>

                  <UserTable users={recentUsers} />
                </div>
              </>
            )}

            {section === 'Users' && (
              <div className="admin-panel">
                <h3>User Management</h3>
                <p>{filteredUsers.length} matching accounts</p>

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

            {section === 'Analytics' && (
              <>
                <div className="admin-stats">
                  {cards.map((card) => (
                    <div className="admin-stat" key={card.title}>
                      <span>{card.icon}</span>
                      <p>{card.title}</p>
                      <h2>{card.value}</h2>
                    </div>
                  ))}
                </div>

                <div className="admin-panel">
                  <h3>Monthly Registrations</h3>
                  <p>
                    Registration counts based on user records
                    returned by the backend.
                  </p>

                  <div className="admin-chart">
                    {monthlyRegistrations.map((item) => (
                      <div className="admin-chart-column" key={item.label}>
                        <strong>{item.count}</strong>

                        <div className="admin-chart-track">
                          <div
                            className="admin-chart-bar"
                            style={{
                              height: `${Math.max(
                                5,
                                (item.count / maxRegistrations) * 100
                              )}%`,
                            }}
                          />
                        </div>

                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

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

            {section === 'Settings' && (
              <div className="admin-panel">
                <h3>Admin Settings</h3>
                <p>ExpenseNest administrator portal</p>

                <div className="admin-setting-row">
                  <div>
                    <strong>Admin access</strong>
                    <p>Protected by Supabase authentication</p>
                  </div>
                  <span className="admin-status">Protected</span>
                </div>

                <div className="admin-setting-row">
                  <div>
                    <strong>Database connection</strong>
                    <p>Supabase dashboard data service</p>
                  </div>
                  <span className="admin-status">Connected</span>
                </div>

                <button
                  className="admin-secondary-btn"
                  onClick={loadDashboard}
                >
                  Refresh dashboard data
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function UserTable({ users }) {
  if (!users.length) {
    return <p>No user records available.</p>;
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Email</th>
            <th>Registered</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.email || '—'}</td>
              <td>
                {user.created_at
                  ? new Date(user.created_at).toLocaleDateString('en-IN')
                  : '—'}
              </td>
              <td>{user.status || 'Registered'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
