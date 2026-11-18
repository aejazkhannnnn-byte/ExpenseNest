
import { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';

export default function AdminPortal() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      const { data, error } = await supabase.auth.getSession();

      if (!mounted) return;

      if (error) {
        setError(error.message);
        setChecking(false);
        return;
      }

      setSession(data.session);
      setChecking(false);
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setIsAdmin(false);
      setError('');
      setChecking(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function verifyAdmin() {
      if (!session?.user?.id) {
        setIsAdmin(false);
        return;
      }

      setChecking(true);
      setError('');

      const { data, error } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        setError('Admin permission verify nahi ho saki.');
        setIsAdmin(false);
      } else {
        setIsAdmin(Boolean(data));
      }

      setChecking(false);
    }

    verifyAdmin();

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      setError(error.message);
      return;
    }

    setSession(null);
    setIsAdmin(false);
  }

  if (checking) {
    return (
      <div className="admin-portal-loading">
        Verifying Admin Access...
        <style>{`
          .admin-portal-loading {
            min-height: 100vh;
            display: grid;
            place-items: center;
            background: #080f20;
            color: white;
            font-family: Arial, sans-serif;
          }
        `}</style>
      </div>
    );
  }

  if (!session) {
    return (
      <>
        <AdminLogin
          onAdminSuccess={(user) => {
            setSession({
              user,
            });
          }}
        />
        {error && <p role="alert">{error}</p>}
      </>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-denied">
        <div>
          <h1>Access Denied</h1>
          <p>This account does not have administrator permission.</p>
          {error && <p>{error}</p>}
          <button onClick={handleLogout}>Logout</button>
        </div>

        <style>{`
          .admin-denied {
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 20px;
            box-sizing: border-box;
            background: #080f20;
            color: white;
            font-family: Arial, sans-serif;
            text-align: center;
          }

          .admin-denied button {
            padding: 12px 25px;
            border: 0;
            border-radius: 9px;
            background: #2563eb;
            color: white;
            cursor: pointer;
          }
        `}</style>
      </div>
    );
  }

  return <AdminDashboard onLogout={handleLogout} />;
}
