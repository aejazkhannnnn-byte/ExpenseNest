import { useState } from 'react';
import { supabase } from './supabase';
import BrandAsset from './components/BrandAsset.jsx';

export default function Auth({ onAuthSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    if (!isLogin && password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        setMessage('Login successful!');
        onAuthSuccess?.(data.user);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

        if (error) throw error;

        if (data.session) {
          setMessage('Account created successfully!');
          onAuthSuccess?.(data.user);
        } else {
          setMessage('Account created. Please login to continue.');
          setIsLogin(true);
          setPassword('');
        }
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Please enter your email address first.');
      return;
    }

    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: 'https://expense-nest-opal.vercel.app',
        }
      );

      if (error) throw error;

      setMessage(
        'If your account exists, a password reset email has been sent.'
      );
    } catch (err) {
      setError(err.message || 'Unable to send reset email.');
    } finally {
      setResetLoading(false);
    }
  }

  function switchMode() {
    setIsLogin(!isLogin);
    setPassword('');
    setError('');
    setMessage('');
    setShowPassword(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-decoration auth-decoration-one"></div>
      <div className="auth-decoration auth-decoration-two"></div>

      <div className="auth-card">
        <div className="auth-brand">
          <span className="auth-brand-mark"><BrandAsset /></span>
          <span className="auth-brand-copy">
                <strong data-gujarati-preserve>ExpenseNest</strong>
                <small>Smart money · Better future</small>
          </span>
        </div>

        <div className="auth-heading">
          <h1>
            {isLogin ? 'Welcome Back!' : 'Create Your Account'}
          </h1>
          <p>
            {isLogin
              ? 'Sign in to manage your money smarter.'
              : 'Start your journey towards smarter money management.'}
          </p>
        </div>

        <div className="auth-tabs">
          <button
            type="button"
            className={isLogin ? 'active' : ''}
            onClick={() => {
              if (!isLogin) switchMode();
            }}
          >
            Login
          </button>

          <button
            type="button"
            className={!isLogin ? 'active' : ''}
            onClick={() => {
              if (isLogin) switchMode();
            }}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="auth-field">
            <label>Email Address</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">✉</span>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <div className="auth-label-row">
              <label>Password</label>

              {isLogin && (
                <button
                  type="button"
                  className="forgot-btn"
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                >
                  {resetLoading ? 'Sending...' : 'Forgot Password?'}
                </button>
              )}
            </div>

            <div className="auth-input-wrap">
              <span className="auth-input-icon">▣</span>

              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={
                  isLogin ? 'current-password' : 'new-password'
                }
                minLength={6}
                required
              />

              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword ? 'Hide password' : 'Show password'
                }
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            {!isLogin && (
              <small className="auth-hint">
                Use at least 6 characters.
              </small>
            )}
          </div>

          {error && (
            <div className="auth-alert auth-error">
              {error}
            </div>
          )}

          {message && (
            <div className="auth-alert auth-success">
              {message}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? 'Please wait...'
              : isLogin
                ? 'Login to ExpenseNest →'
                : 'Create My Account →'}
          </button>
        </form>

        <div className="auth-switch">
          {isLogin
            ? "Don't have an account?"
            : 'Already have an account?'}

          <button type="button" onClick={switchMode}>
            {isLogin ? 'Create Account' : 'Login'}
          </button>
        </div>

        <div className="auth-bottom">
          <span>🔒</span>
          Your financial information is protected.
        </div>

        {/* ADMIN LOGIN LINK */}
        <div className="auth-admin-link">
          <span>🛡️</span>
          <a href="/admin">Admin Login</a>
        </div>
      </div>

      <style>{`
        /* ExpenseNest Login Layout Fix */

        .auth-page .auth-card {
          width: 100% !important;
          max-width: 440px !important;
          margin: auto !important;
          padding: 32px !important;
          box-sizing: border-box !important;
        }

        .auth-page .auth-card form {
          display: flex !important;
          flex-direction: column !important;
          width: 100% !important;
          gap: 0 !important;
        }

        .auth-page .auth-field {
          display: block !important;
          width: 100% !important;
          min-width: 0 !important;
          margin-bottom: 20px !important;
        }

        .auth-page .auth-input-wrap {
          display: flex !important;
          width: 100% !important;
          min-width: 0 !important;
          box-sizing: border-box !important;
        }

        .auth-page .auth-input-wrap input {
          flex: 1 !important;
          width: 0 !important;
          min-width: 0 !important;
          height: 49px !important;
          color: #ffffff !important;
          background: transparent !important;
          font-size: 14px !important;
        }

        .auth-page .auth-input-wrap input:-webkit-autofill,
        .auth-page .auth-input-wrap input:-webkit-autofill:hover,
        .auth-page .auth-input-wrap input:-webkit-autofill:focus {
          -webkit-text-fill-color: #ffffff !important;
          -webkit-box-shadow: 0 0 0 1000px #0b1425 inset !important;
          transition: background-color 9999s ease-in-out 0s;
        }

        .auth-page .auth-submit {
          display: block !important;
          width: 100% !important;
          min-height: 54px !important;
          margin: 8px 0 0 !important;
          white-space: normal !important;
        }

        .auth-page .auth-tabs {
          width: 100% !important;
          box-sizing: border-box !important;
        }

        @media(max-width: 520px) {
          .auth-page .auth-card {
            padding: 26px 20px !important;
          }
        }

        .auth-page {
          min-height: 100vh;
          width: 100%;
          box-sizing: border-box;
          padding: 25px;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
          overflow: hidden;
          background:
            radial-gradient(
              circle at 15% 15%,
              rgba(37,99,235,.20),
              transparent 35%
            ),
            radial-gradient(
              circle at 85% 85%,
              rgba(6,182,212,.13),
              transparent 35%
            ),
            #080f20;
          font-family: var(--font-ui);
        }

        .auth-decoration {
          position: absolute;
          border-radius: 50%;
          filter: blur(2px);
          pointer-events: none;
        }

        .auth-decoration-one {
          width: 250px;
          height: 250px;
          top: -120px;
          right: -80px;
          background: rgba(37,99,235,.12);
        }

        .auth-decoration-two {
          width: 280px;
          height: 280px;
          bottom: -160px;
          left: -100px;
          background: rgba(6,182,212,.10);
        }

        .auth-card {
          width: 100%;
          max-width: 440px;
          box-sizing: border-box;
          position: relative;
          z-index: 1;
          padding: 38px;
          border-radius: 25px;
          background: rgba(20,32,53,.96);
          border: 1px solid rgba(148,163,184,.16);
          box-shadow: 0 25px 80px rgba(0,0,0,.42);
          animation: authAppear .6s ease both;
        }

        .auth-brand {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          margin-bottom: 30px;
        }

        .auth-brand-mark { width: 58px; height: 58px; flex: 0 0 58px; overflow: hidden; border: 1px solid rgba(67,218,183,.28); border-radius: 16px; background: #061329; box-shadow: 0 10px 26px rgba(0,0,0,.28); }
        .auth-brand-mark .brand-asset-mark { width: 100%; height: 100%; object-fit: cover; }
        .auth-brand-copy { display: grid; gap: 5px; text-align: left; }
        .auth-brand-copy strong { color: #f3f6ff; font-size: 22px; font-weight: 700; letter-spacing: -.03em; }
        .auth-brand-copy small { color: #9eafc9; font-size: 11px; line-height: 1.45; }

        .auth-heading {
          text-align: center;
          margin-bottom: 26px;
        }

        .auth-heading h1 {
          margin: 0 0 10px;
          color: white;
          font-size: 29px;
          font-weight: 700;
          letter-spacing: -.7px;
        }

        .auth-heading p {
          margin: 0;
          color: #9eafc9;
          font-size: 14px;
          line-height: 1.6;
        }

        .auth-tabs {
          display: flex;
          gap: 5px;
          padding: 5px;
          margin-bottom: 27px;
          border-radius: 12px;
          background: #0b1629;
        }

        .auth-tabs button {
          flex: 1;
          border: none;
          border-radius: 9px;
          padding: 12px;
          background: transparent;
          color: #91a2bd;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .auth-tabs button.active {
          background: linear-gradient(110deg,#2563eb,#0ea5e9);
          color: white;
          box-shadow: 0 5px 15px rgba(37,99,235,.25);
        }

        .auth-field {
          margin-bottom: 21px;
        }

        .auth-field label {
          display: block;
          margin-bottom: 9px;
          color: #e3eaf5;
          font-size: 13px;
          font-weight: 600;
        }

        .auth-label-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
        }

        .auth-input-wrap {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 13px;
          border: 1px solid #34445e;
          border-radius: 11px;
          background: #0b1425;
          transition: border-color .2s, box-shadow .2s;
        }

        .auth-input-wrap:focus-within {
          border-color: #38bdf8;
          box-shadow: 0 0 0 3px rgba(56,189,248,.12);
        }

        .auth-input-icon {
          color: #7c9cc7;
          font-size: 17px;
        }

        .auth-input-wrap input {
          width: 100%;
          min-width: 0;
          height: 49px;
          border: none;
          outline: none;
          background: transparent;
          color: white;
          font-size: 14px;
        }

        .auth-input-wrap input::placeholder {
          color: #64748b;
        }

        .password-toggle,
        .forgot-btn {
          flex-shrink: 0;
          border: none;
          background: transparent;
          color: #38bdf8;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
        }

        .forgot-btn {
          margin-bottom: 9px;
        }

        .auth-hint {
          display: block;
          margin-top: 8px;
          color: #8397b4;
          font-size: 11px;
        }

        .auth-submit {
          width: 100%;
          min-height: 53px;
          margin-top: 7px;
          border: none;
          border-radius: 11px;
          background: linear-gradient(110deg,#2563eb,#0ea5e9);
          color: white;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: transform .2s, box-shadow .2s;
        }

        .auth-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(37,99,235,.3);
        }

        .auth-submit:disabled {
          opacity: .65;
          cursor: not-allowed;
        }

        .auth-alert {
          padding: 12px;
          margin-bottom: 16px;
          border-radius: 9px;
          font-size: 13px;
          line-height: 1.5;
          overflow-wrap: anywhere;
        }

        .auth-error {
          color: #fecaca;
          background: rgba(220,38,38,.13);
          border: 1px solid rgba(248,113,113,.2);
        }

        .auth-success {
          color: #a7f3d0;
          background: rgba(16,185,129,.12);
          border: 1px solid rgba(52,211,153,.2);
        }

        .auth-switch {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 25px;
          color: #9eafc9;
          font-size: 13px;
        }

        .auth-switch button {
          padding: 0;
          border: none;
          background: transparent;
          color: #38bdf8;
          font-weight: 700;
          cursor: pointer;
        }

        .auth-bottom {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 7px;
          margin-top: 27px;
          padding-top: 19px;
          border-top: 1px solid rgba(148,163,184,.13);
          color: #8093af;
          font-size: 11px;
        }

        .auth-admin-link {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          margin-top: 18px;
          padding-top: 16px;
          border-top: 1px solid rgba(148,163,184,.13);
          font-size: 13px;
        }

        .auth-admin-link a {
          color: #38bdf8;
          font-weight: 700;
          text-decoration: none;
          transition: color .2s ease;
        }

        .auth-admin-link a:hover {
          color: #7dd3fc;
          text-decoration: underline;
        }

        @keyframes authAppear {
          from {
            opacity: 0;
            transform: translateY(18px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media(max-width: 520px) {
          .auth-page {
            padding: 16px;
          }

          .auth-brand-mark { width: 52px; height: 52px; flex-basis: 52px; }
          .auth-brand-copy strong { font-size: 20px; }

          .auth-card {
            padding: 28px 22px;
            border-radius: 20px;
          }

          .auth-heading h1 {
            font-size: 25px;
          }
        }

        @media(prefers-reduced-motion: reduce) {
          .auth-card {
            animation: none;
          }

          .auth-submit {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
}
