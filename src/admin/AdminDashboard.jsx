
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import './AdminDashboard.css';
export default function AdminDashboard({ onLogout }) {
  const [section, setSection] = useState('Overview');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      setLoading(true);
      setError('');

      try {
        const { data: sessionData } =
          await supabase.auth.getSession();

        if (!sessionData.session) {
          throw new Error('Please login again.');
        }

        // Secure backend function will provide dashboard data.
        const { data, error: functionError } =
          await supabase.functions.invoke('admin-dashboard');

        if (functionError) throw functionError;
        if (!data?.success) {
          throw new Error(data?.message || 'Unable to load dashboard.');
        }

        if (active) {
          setStats(data.stats || null);
          setUsers(data.users || []);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Dashboard loading failed.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();

    return () => {
      active = false;
    };
  }, []);

  const menu = [
    { name: 'Overview', icon: '📊' },
    { name: 'Users', icon: '👥' },
    { name: 'Analytics', icon: '📈' },
    { name: 'Feedback', icon: '💬' },
    { name: 'Settings', icon: '⚙️' },
  ];

  const cards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers ?? '—',
      icon: '👥',
    },
    {
      title: 'New Registrations',
      value: stats?.newUsers ?? '—',
      icon: '🆕',
    },
    {
      title: 'Active Users',
      value: stats?.activeUsers ?? '—',
      icon: '🟢',
    },
    {
      title: 'Page Views',
      value: stats?.pageViews ?? '—',
      icon: '🌐',
    },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-icon">₹</span>
          <span>ExpenseNest</span>
        </div>

        <div className="admin-label">ADMIN MENU</div>

        {menu.map((item) => (
          <button
            key={item.name}
            className={
              section === item.name
                ? 'admin-menu active'
                : 'admin-menu'
            }
            onClick={() => setSection(item.name)}
          >
            <span>{item.icon}</span>
            {item.name}
          </button>
        ))}

        <button
          className="admin-logout"
          onClick={onLogout}
        >
          ↪ Logout
        </button>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <h1>{section}</h1>
            <p>ExpenseNest Administration</p>
          </div>
          <div className="admin-badge">🔐 Admin</div>
        </header>

        {loading ? (
          <div className="admin-message">
            Loading dashboard...
          </div>
        ) : error ? (
          <div className="admin-message admin-error">
            {error}
            <p>
              Dashboard data will appear after the secure
              backend is configured.
            </p>
          </div>
        ) : (
          <>
            {section === 'Overview' && (
              <>
                <div className="admin-welcome">
                  <h2>Welcome to ExpenseNest Admin 👋</h2>
                  <p>
                    Monitor your website and manage registered
                    accounts.
                  </p>
                </div>

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
                  <h3>Recent Registrations</h3>
                  <p>
                    Basic account information only. Personal
                    financial records are not displayed.
                  </p>
                  <UserTable users={users.slice(0, 5)} />
                </div>
              </>
            )}

            {section === 'Users' && (
              <div className="admin-panel">
                <h3>User Management</h3>
                <p>Registered user account details</p>
                <UserTable users={users} />
              </div>
            )}

            {section === 'Analytics' && (
              <div className="admin-panel">
                <h3>Website Analytics</h3>
                <p>Total page views: {stats?.pageViews ?? '—'}</p>
                <p>Active users: {stats?.activeUsers ?? '—'}</p>
                <p>
                  Analytics data will be connected through the
                  secure backend.
                </p>
              </div>
            )}

            {section === 'Feedback' && (
              <div className="admin-panel">
                <h3>User Feedback</h3>
                <p>
                  Feedback management will be connected in the
                  next development step.
                </p>
              </div>
            )}

            {section === 'Settings' && (
              <div className="admin-panel">
                <h3>Admin Settings</h3>
                <p>ExpenseNest administrator portal</p>
                <p>Access: Administrator</p>
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
    return <p>No user records available yet.</p>;
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
                  ? new Date(user.created_at).toLocaleDateString()
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
