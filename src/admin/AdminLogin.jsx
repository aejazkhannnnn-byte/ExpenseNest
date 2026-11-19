import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  LayoutDashboard,
  LoaderCircle,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from 'lucide-react';
import { supabase } from '../supabase';
import './AdminLogin.css';

export default function AdminLogin({ onAdminSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(event) {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (loginError) throw loginError;

      const { data: admin, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (adminError) throw adminError;
      if (!admin) {
        await supabase.auth.signOut();
        throw new Error('This account does not have administrator access.');
      }

      onAdminSuccess?.(data.user);
    } catch (err) {
      setError(err.message || 'Unable to sign in. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-glow login-glow-one" />
      <div className="admin-login-glow login-glow-two" />

      <div className="admin-login-shell">
        <section className="admin-login-visual">
          <a className="admin-login-brand" href="/" aria-label="ExpenseNest home">
            <span className="admin-login-brand-mark">₹</span>
            <span>ExpenseNest</span>
          </a>

          <div className="admin-login-visual-copy">
            <span className="admin-login-kicker"><Sparkles size={14} /> ADMIN WORKSPACE</span>
            <h1>Your platform,<br />in clear view.</h1>
            <p>A focused workspace for reviewing registrations and keeping your platform organized.</p>
          </div>

          <div className="admin-login-feature-list">
            <div><span><LayoutDashboard size={17} /></span><div><strong>Platform overview</strong><small>See the latest dashboard activity</small></div></div>
            <div><span><UsersRound size={17} /></span><div><strong>User directory</strong><small>Find and review registered accounts</small></div></div>
            <div><span><ShieldCheck size={17} /></span><div><strong>Protected access</strong><small>Only approved admin accounts can enter</small></div></div>
          </div>

          <div className="admin-login-decor-card" aria-hidden="true">
            <div className="decor-card-top"><span><LayoutDashboard size={15} /></span><i /><i /><i /></div>
            <div className="decor-card-lines"><b /><b /><b /></div>
            <div className="decor-card-chart"><span /><span /><span /><span /><span /><span /></div>
          </div>
        </section>

        <section className="admin-login-form-side">
          <div className="admin-login-card">
            <span className="admin-login-form-icon"><LockKeyhole size={20} /></span>
            <div className="admin-login-heading">
              <span className="admin-login-form-eyebrow">SECURE SIGN IN</span>
              <h2>Welcome back</h2>
              <p>Sign in with your approved administrator account.</p>
            </div>

            <form onSubmit={handleLogin}>
              <div className="admin-login-field">
                <label htmlFor="admin-email">Email address</label>
                <input
                  id="admin-email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                  required
                  disabled={loading}
                />
              </div>

              <div className="admin-login-field">
                <label htmlFor="admin-password">Password</label>
                <div className="admin-password-wrap">
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    autoComplete="current-password"
                    required
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="admin-password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {error && <div className="admin-login-error" role="alert">{error}</div>}

              <button type="submit" className="admin-login-submit" disabled={loading}>
                {loading ? <><LoaderCircle size={17} className="admin-login-spinner" /> Checking access…</> : <>Sign in to admin <ArrowRight size={16} /></>}
              </button>
            </form>

            <div className="admin-login-security"><ShieldCheck size={15} /> Supabase protected administrator access</div>
            <a href="/" className="admin-user-login"><ArrowLeft size={15} /> Back to ExpenseNest login</a>
          </div>
          <p className="admin-login-form-footnote">Access is limited to accounts approved by your administrator.</p>
        </section>
      </div>

      <footer className="admin-login-footer">© {new Date().getFullYear()} ExpenseNest · Admin Portal</footer>
    </main>
  );
}
