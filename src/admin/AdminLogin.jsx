
import { useState } from 'react';
import { supabase } from '../supabase';
import './AdminLogin.css';

export default function AdminLogin({ onAdminSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) throw loginError;

      const { data: admin, error: adminError } =
        await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', data.user.id)
          .maybeSingle();

      if (adminError) throw adminError;

      if (!admin) {
        await supabase.auth.signOut();
        throw new Error('Access denied. You are not an admin.');
      }

      onAdminSuccess?.(data.user);
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="admin-login-page">
      <div className="admin-login-decoration admin-decoration-one" />
      <div className="admin-login-decoration admin-decoration-two" />

      <form className="admin-login-card" onSubmit={handleLogin}>
        <div className="admin-login-brand">
          <div className="admin-login-logo">₹</div>
          <span>ExpenseNest</span>
        </div>

        <div className="admin-login-heading">
          <div className="admin-login-lock">🔐</div>
          <h1>Welcome Back!</h1>
          <h2>Admin Portal</h2>
          <p>Sign in to access your administration dashboard.</p>
        </div>

        <div className="admin-login-field">
          <label htmlFor="admin-email">Email Address</label>
          <input
            id="admin-email"
            type="email"
            placeholder="Enter your admin email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
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
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <button
              type="button"
              className="admin-password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>

        {error && (
          <div className="admin-login-error" role="alert">
            <span>⚠</span>
            {error}
          </div>
        )}

        <button
          type="submit"
          className="admin-login-submit"
          disabled={loading}
        >
          {loading ? 'Verifying your account...' : 'Sign In to Admin →'}
        </button>

        <div className="admin-login-security">
          <span>🔒</span>
          Secure Administrator Access
        </div>
      </form>

      <div className="admin-login-footer">
        © {new Date().getFullYear()} ExpenseNest. Admin Portal.
      </div>
    </div>
  );
}
