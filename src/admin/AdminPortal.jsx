import { useEffect, useState } from 'react';
import { ArrowLeft, LoaderCircle, LogOut, ShieldX } from 'lucide-react';
import { supabase } from '../supabase';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import './AdminPortal.css';

export default function AdminPortal() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [verifiedAdminId, setVerifiedAdminId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (!active) return;

      if (sessionError) setError(sessionError.message);
      setSession(data?.session || null);
      setChecking(false);
    }

    loadSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setError('');
      if (!newSession) setVerifiedAdminId(null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;
    const userId = session?.user?.id;

    async function verifyAdmin() {
      if (!userId) {
        setVerifiedAdminId(null);
        return;
      }

      setChecking(true);
      setError('');

      const { data, error: queryError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (!active) return;

      if (queryError) {
        setError('Could not verify administrator access. Please try again.');
        setVerifiedAdminId(null);
      } else {
        setVerifiedAdminId(data?.user_id || null);
      }
      setChecking(false);
    }

    verifyAdmin();
    return () => { active = false; };
  }, [session?.user?.id]);

  async function handleLogout() {
    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) {
      setError(logoutError.message);
      return;
    }
    setSession(null);
    setVerifiedAdminId(null);
    setError('');
  }

  if (checking) {
    return (
      <main className="admin-portal-state">
        <div className="admin-portal-state-card">
          <span className="admin-portal-state-icon loading"><LoaderCircle size={22} /></span>
          <h1>Checking admin access</h1>
          <p>Securely verifying your ExpenseNest workspace.</p>
        </div>
      </main>
    );
  }

  if (!session) {
    return (
      <>
        <AdminLogin onAdminSuccess={(user) => setSession({ user })} />
        {error && <div className="admin-portal-login-error" role="alert">{error}</div>}
      </>
    );
  }

  if (verifiedAdminId !== session.user.id) {
    return (
      <main className="admin-portal-state">
        <section className="admin-portal-state-card denied">
          <span className="admin-portal-state-icon"><ShieldX size={23} /></span>
          <span className="admin-portal-eyebrow">ACCESS CONTROL</span>
          <h1>Admin access required</h1>
          <p>{error || 'This account is not on the approved administrator list.'}</p>
          <div className="admin-portal-state-actions">
            <button type="button" className="admin-portal-button secondary" onClick={() => window.location.assign('/')}>
              <ArrowLeft size={15} /> User login
            </button>
            <button type="button" className="admin-portal-button" onClick={handleLogout}>
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </section>
      </main>
    );
  }

  return <AdminDashboard onLogout={handleLogout} adminUser={session.user} />;
}
