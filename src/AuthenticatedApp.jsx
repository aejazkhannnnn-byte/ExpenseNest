
import { useCallback, useEffect, useRef, useState } from 'react';
import { CircleAlert, LogOut, RefreshCw, ShieldAlert } from 'lucide-react';
import { supabase } from './supabase';
import Auth from './Auth';
import App from './App';

import {
  getLocalExpenseData,
  applyExpenseData,
  loadCloudData,
  saveCloudData,
} from './cloudSync';

export default function AuthenticatedApp() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ready, setReady] = useState(false);
  const [accountAccessState, setAccountAccessState] = useState('checking');
  const [accountAccessError, setAccountAccessError] = useState('');
  const [choiceLoading, setChoiceLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Synced');
  const [error, setError] = useState('');

  const timerRef = useRef(null);
  const userIdRef = useRef(null);
  const readyRef = useRef(false);
  const accountAccessStateRef = useRef('checking');
  const activityLoggedForRef = useRef(null);
  const activityAttemptRef = useRef({ key: null, at: 0 });
  const activityTrackingDisabledRef = useRef(false);
  const savingRef = useRef(false);
  const pendingRef = useRef(false);
  const savePromiseRef = useRef(Promise.resolve());

  const updateAccountAccessState = useCallback((state) => {
    accountAccessStateRef.current = state;
    setAccountAccessState(state);
  }, []);

  const verifyAccountAccess = useCallback(async () => {
    const { data, error: accessError } = await supabase.rpc('is_account_allowed');

    if (accessError) {
      const migrationMissing = accessError.code === 'PGRST202' || accessError.code === '42883';
      throw new Error(migrationMissing
        ? 'Account protection is not installed yet. Ask the administrator to run supabase/suspended_account_access.sql in the Supabase SQL Editor.'
        : accessError.message || 'Account access could not be verified.');
    }

    return data === true;
  }, []);

  const recordAppActivity = useCallback(async (userId) => {
    if (!userId || activityTrackingDisabledRef.current) return;

    const dateParts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const localDate = `${dateParts.find((part) => part.type === 'year')?.value}-${dateParts.find((part) => part.type === 'month')?.value}-${dateParts.find((part) => part.type === 'day')?.value}`;
    const activityKey = `${userId}:${localDate}`;
    if (activityLoggedForRef.current === activityKey) return;
    if (activityAttemptRef.current.key === activityKey
      && Date.now() - activityAttemptRef.current.at < 15 * 60 * 1000) return;
    activityAttemptRef.current = { key: activityKey, at: Date.now() };

    try {
      const { error: activityError } = await supabase.rpc('record_account_activity');
      if (activityError) {
        if (activityError.code === 'PGRST202' || activityError.code === '42883') {
          activityTrackingDisabledRef.current = true;
        }
        return;
      }
      activityLoggedForRef.current = activityKey;
    } catch {
      // Usage analytics are optional; a tracking outage must not interrupt financial data access.
    }
  }, []);

  // Keep current session updated
  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;

      if (error) {
        setError(error.message);
      }

      setSession(data?.session ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;

      setSession(newSession);
      setError('');
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Load data when user logs in
  useEffect(() => {
    let active = true;

    async function initializeUser() {
      setReady(false);
      readyRef.current = false;
      userIdRef.current = session?.user?.id ?? null;

      if (!session?.user?.id) {
        updateAccountAccessState('checking');
        setAccountAccessError('');
        return;
      }

      setLoading(true);
      setError('');
      updateAccountAccessState('checking');
      setAccountAccessError('');

      try {
        const allowed = await verifyAccountAccess();

        if (!active) return;

        if (!allowed) {
          updateAccountAccessState('blocked');
          return;
        }

        updateAccountAccessState('allowed');
        void recordAppActivity(session.user.id);
        const cloudData = await loadCloudData(session.user.id);

        if (!active) return;

        if (cloudData !== null) {
          applyExpenseData(cloudData);
          readyRef.current = true;
          setReady(true);
        } else {
          setReady(false);
        }
      } catch (err) {
        if (active) {
          readyRef.current = false;
          setReady(false);
          updateAccountAccessState('unavailable');
          setAccountAccessError(err?.message || 'Account access could not be verified.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    initializeUser();

    return () => {
      active = false;
    };
  }, [session?.user?.id, recordAppActivity, updateAccountAccessState, verifyAccountAccess]);

  // Recheck access while the app is open so an administrator's suspension takes effect promptly.
  useEffect(() => {
    if (!session?.user?.id) return undefined;

    let active = true;
    const interval = window.setInterval(async () => {
      try {
        const allowed = await verifyAccountAccess();
        if (!active) return;

        if (!allowed) {
          clearTimeout(timerRef.current);
          readyRef.current = false;
          setReady(false);
          setAccountAccessError('');
          updateAccountAccessState('blocked');
          return;
        }

        void recordAppActivity(session.user.id);

        const previousState = accountAccessStateRef.current;
        if (previousState === 'blocked' || previousState === 'unavailable') {
          window.location.reload();
          return;
        }

        setAccountAccessError('');
        updateAccountAccessState('allowed');
      } catch (accessError) {
        if (!active) return;
        clearTimeout(timerRef.current);
        readyRef.current = false;
        setReady(false);
        setAccountAccessError(accessError?.message || 'Account access could not be verified.');
        updateAccountAccessState('unavailable');
      }
    }, 30_000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, [session?.user?.id, recordAppActivity, updateAccountAccessState, verifyAccountAccess]);

  // Save current local data to cloud
  const syncNow = useCallback(async () => {
    const userId = userIdRef.current;

    if (!userId || !readyRef.current) return;

    if (savingRef.current) {
      pendingRef.current = true;
      return savePromiseRef.current;
    }

    savingRef.current = true;
    pendingRef.current = false;
    setSyncStatus('Saving...');

    const expenseData = getLocalExpenseData();

    const operation = saveCloudData(userId, expenseData)
      .then(() => {
        setSyncStatus('All changes saved');
      })
      .catch((err) => {
        setSyncStatus('Sync failed');
        setError(
          'Cloud sync error: ' +
          (err?.message || 'Unknown error')
        );
      })
      .finally(() => {
        savingRef.current = false;

        if (pendingRef.current) {
          pendingRef.current = false;
          syncNow();
        }
      });

    savePromiseRef.current = operation;
    return operation;
  }, []);

  // Automatic localStorage sync
  useEffect(() => {
    if (!ready || !session?.user?.id) return;

    const originalSetItem = Storage.prototype.setItem;
    const originalRemoveItem = Storage.prototype.removeItem;

    const scheduleSync = () => {
      if (!readyRef.current) return;

      setSyncStatus('Unsaved changes');

      clearTimeout(timerRef.current);

      timerRef.current = setTimeout(() => {
        syncNow();
      }, 1000);
    };

    Storage.prototype.setItem = function (key, value) {
      originalSetItem.call(this, key, value);

      if (this === window.localStorage) {
        scheduleSync();
      }
    };

    Storage.prototype.removeItem = function (key) {
      originalRemoveItem.call(this, key);

      if (this === window.localStorage) {
        scheduleSync();
      }
    };

    return () => {
      clearTimeout(timerRef.current);

      Storage.prototype.setItem = originalSetItem;
      Storage.prototype.removeItem = originalRemoveItem;
    };
  }, [ready, session?.user?.id, syncNow]);

  // Import existing local data
  const handleImport = async () => {
    if (!session?.user?.id) return;

    setChoiceLoading(true);
    setError('');

    try {
      const localData = getLocalExpenseData();

      await saveCloudData(session.user.id, localData);

      readyRef.current = true;
      setReady(true);
      setSyncStatus('All changes saved');
    } catch (err) {
      setError(err?.message || 'Data import nahi ho saka.');
    } finally {
      setChoiceLoading(false);
    }
  };

  // Start with fresh data
  const handleFresh = async () => {
    if (!session?.user?.id) return;

    const confirmed = window.confirm(
      'Start Fresh karne se is browser ka existing ExpenseNest data clear ho jayega. Kya aap sure hain?'
    );

    if (!confirmed) return;

    setChoiceLoading(true);
    setError('');

    try {
      readyRef.current = false;

      // Clear only ExpenseNest data keys
      const keys = Object.keys(getLocalExpenseData());

      const storageKeys = [
        'expenseNestTransactions',
        'expenseNestAccounts',
        'expenseNestMonthlyBudget',
        'expenseNestMonthlyBudgets',
        'expenseNestCategoryBudgets',
        'expenseNestRecurringRules',
        'expenseNestSavingsGoals',
        'expenseNestCustomCategories',
        'expenseNestTheme',
        'expenseNestCurrency',
      ];

      storageKeys.forEach((key) => {
        localStorage.removeItem(key);
      });

      const freshData = getLocalExpenseData();

      await saveCloudData(session.user.id, freshData);

      readyRef.current = true;
      setReady(true);
      setSyncStatus('All changes saved');
    } catch (err) {
      setError(err?.message || 'Fresh account start nahi ho saka.');
    } finally {
      setChoiceLoading(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    const confirmed = window.confirm(
      'Kya aap ExpenseNest se logout karna chahte hain?'
    );

    if (!confirmed) return;

    clearTimeout(timerRef.current);

    if (readyRef.current) {
      await syncNow();
    }

    readyRef.current = false;
    setReady(false);

    const { error } = await supabase.auth.signOut();

    if (error) {
      setError(error.message);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <div className="en-loading">
        <div className="en-loader"></div>
        <h2>ExpenseNest</h2>
        <p>Preparing your financial dashboard...</p>

        <style>{`
          .en-loading {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            background: #080f20;
            color: white;
            font-family: var(--font-ui);
          }
          .en-loader {
            width: 45px;
            height: 45px;
            border: 4px solid #263957;
            border-top-color: #38bdf8;
            border-radius: 50%;
            animation: enSpin 0.8s linear infinite;
          }
          @keyframes enSpin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Login and signup
  if (!session) {
    return <Auth />;
  }

  if (accountAccessState === 'blocked' || accountAccessState === 'unavailable') {
    const accessUnavailable = accountAccessState === 'unavailable';

    const signOutLockedAccount = async () => {
      await supabase.auth.signOut({ scope: 'local' });
    };

    return (
      <main className="en-access-lock">
        <section className="en-access-card" role="alert" aria-labelledby="en-access-title">
          <span className={`en-access-icon${accessUnavailable ? ' warning' : ''}`}>
            {accessUnavailable ? <CircleAlert size={25} /> : <ShieldAlert size={25} />}
          </span>
          <span className="en-access-kicker">ACCOUNT ACCESS</span>
          <h1 id="en-access-title">{accessUnavailable ? 'We could not verify access' : 'This account is temporarily blocked'}</h1>
          <p>
            {accessUnavailable
              ? 'ExpenseNest paused this session to protect your data. Ask the administrator to install account protection, then try again.'
              : 'An administrator has temporarily suspended this account. Synced transactions and family data are protected. Data saved on this device has not been deleted.'}
          </p>
          {accessUnavailable && accountAccessError && <div className="en-access-error">{accountAccessError}</div>}
          <div className="en-access-actions">
            <button type="button" className="en-access-primary" onClick={() => window.location.reload()}>
              <RefreshCw size={16} /> Check access again
            </button>
            <button type="button" className="en-access-secondary" onClick={signOutLockedAccount}>
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </section>
        <style>{`
          .en-access-lock {
            min-height: 100vh;
            box-sizing: border-box;
            display: grid;
            place-items: center;
            padding: 24px;
            color: #edf3ff;
            background: radial-gradient(ellipse at 50% 0%, #172a4b 0%, #0b1220 55%, #080d17 100%);
            font-family: var(--font-ui, Inter, sans-serif);
          }
          .en-access-card {
            width: min(100%, 510px);
            box-sizing: border-box;
            padding: 38px;
            border: 1px solid rgba(148, 163, 184, .17);
            border-radius: 24px;
            background: rgba(17, 28, 47, .94);
            box-shadow: 0 28px 90px rgba(0, 0, 0, .38);
            text-align: center;
          }
          .en-access-icon {
            width: 58px;
            height: 58px;
            margin: 0 auto 20px;
            display: grid;
            place-items: center;
            border: 1px solid rgba(248, 113, 113, .22);
            border-radius: 18px;
            color: #fb8c8c;
            background: rgba(127, 29, 29, .19);
          }
          .en-access-icon.warning {
            color: #fbbf70;
            border-color: rgba(251, 191, 36, .22);
            background: rgba(120, 70, 16, .2);
          }
          .en-access-kicker {
            color: #91a4c4;
            font-size: 11px;
            font-weight: 700;
            letter-spacing: .16em;
          }
          .en-access-card h1 {
            margin: 10px 0 12px;
            color: #f4f7ff;
            font-size: clamp(23px, 5vw, 29px);
            line-height: 1.22;
            letter-spacing: -.035em;
          }
          .en-access-card p {
            margin: 0;
            color: #9dacc4;
            font-size: 14px;
            line-height: 1.7;
          }
          .en-access-error {
            margin-top: 18px;
            padding: 12px 14px;
            border: 1px solid rgba(251, 191, 36, .18);
            border-radius: 12px;
            color: #f6d38d;
            background: rgba(120, 70, 16, .16);
            font-size: 12px;
            line-height: 1.6;
            text-align: left;
            overflow-wrap: anywhere;
          }
          .en-access-actions {
            margin-top: 26px;
            display: flex;
            justify-content: center;
            gap: 10px;
            flex-wrap: wrap;
          }
          .en-access-actions button {
            min-height: 44px;
            padding: 0 16px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            border: 1px solid transparent;
            border-radius: 12px;
            color: #f6f8ff;
            font: 600 13px var(--font-ui, Inter, sans-serif);
            cursor: pointer;
          }
          .en-access-primary { background: linear-gradient(110deg, #6676ee, #2fb7a8); }
          .en-access-secondary { border-color: rgba(148, 163, 184, .2) !important; background: rgba(255, 255, 255, .045); }
          .en-access-actions button:focus-visible { outline: 2px solid #91a5ff; outline-offset: 3px; }
          @media (max-width: 520px) {
            .en-access-card { padding: 30px 22px; }
            .en-access-actions { flex-direction: column; }
            .en-access-actions button { width: 100%; }
          }
        `}</style>
      </main>
    );
  }

  // Cloud data not found: ask user what to do
  if (!ready) {
    return (
      <div className="en-welcome">
        <div className="en-welcome-card">
          <div className="en-logo">₹</div>

          <div className="en-brand">ExpenseNest</div>

          <h1>Welcome to ExpenseNest!</h1>

          <p className="en-description">
            Your account is ready. Choose how to start.
          </p>

          <div className="en-actions">
            <button
              className="en-primary"
              onClick={handleImport}
              disabled={choiceLoading}
            >
              {choiceLoading
                ? 'Please wait...'
                : 'Import Existing Data'}
            </button>

            <button
              className="en-secondary"
              onClick={handleFresh}
              disabled={choiceLoading}
            >
              Start Fresh
            </button>
          </div>

          {error && (
            <div className="en-error">{error}</div>
          )}

          <div className="en-footer">
            YOUR MONEY. YOUR CONTROL.
          </div>
        </div>

        <style>{`
          .en-welcome {
            min-height: 100vh;
            width: 100%;
            padding: 24px;
            box-sizing: border-box;
            display: flex;
            align-items: center;
            justify-content: center;
            background:
              radial-gradient(
                circle at 50% 0%,
                #1d3764 0%,
                transparent 48%
              ),
              linear-gradient(
                135deg,
                #080f20,
                #101b32 55%,
                #080f20
              );
            font-family: var(--font-ui);
          }

          .en-welcome-card {
            width: 100%;
            max-width: 510px;
            padding: 42px 38px 30px;
            box-sizing: border-box;
            text-align: center;
            border: 1px solid rgba(255,255,255,.12);
            border-radius: 26px;
            background: rgba(24,37,61,.96);
            box-shadow: 0 24px 70px rgba(0,0,0,.4);
            animation: enAppear .65s ease both;
          }

          .en-logo {
            width: 66px;
            height: 66px;
            margin: 0 auto 14px;
            display: grid;
            place-items: center;
            border-radius: 20px;
            color: white;
            font-size: 34px;
            font-weight: 700;
            background: linear-gradient(135deg,#2563eb,#06b6d4);
            box-shadow: 0 10px 30px rgba(37,99,235,.3);
          }

          .en-brand {
            color: #8dbbff;
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 1.2px;
            margin-bottom: 22px;
          }

          .en-welcome-card h1 {
            color: white;
            font-size: clamp(25px,4vw,32px);
            line-height: 1.2;
            margin: 0 0 12px;
            font-weight: 700;
            letter-spacing: -.7px;
          }

          .en-description {
            color: #b9c7dc;
            font-size: 15px;
            line-height: 1.6;
            margin: 0 0 30px;
          }

          .en-actions {
            display: flex;
            flex-direction: column;
            gap: 14px;
          }

          .en-actions button {
            width: 100%;
            min-height: 54px;
            padding: 13px 18px;
            border-radius: 13px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform .2s ease, box-shadow .2s ease;
          }

          .en-primary {
            color: white;
            border: 0;
            background: linear-gradient(110deg,#2563eb,#0ea5e9);
          }

          .en-secondary {
            color: #e7efff;
            border: 1px solid rgba(120,160,220,.35);
            background: rgba(255,255,255,.07);
          }

          .en-actions button:hover:not(:disabled) {
            transform: translateY(-3px);
            box-shadow: 0 10px 25px rgba(37,99,235,.25);
          }

          .en-actions button:disabled {
            opacity: .6;
            cursor: not-allowed;
          }

          .en-error {
            margin-top: 18px;
            padding: 12px;
            border-radius: 10px;
            color: #fecaca;
            background: rgba(220,38,38,.13);
            font-size: 13px;
            overflow-wrap: anywhere;
          }

          .en-footer {
            margin-top: 28px;
            color: #8195b5;
            font-size: 11px;
            letter-spacing: 1.5px;
          }

          @keyframes enAppear {
            from {
              opacity: 0;
              transform: translateY(18px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @media(max-width:600px) {
            .en-welcome {
              padding: 18px;
            }
            .en-welcome-card {
              padding: 34px 22px 26px;
              border-radius: 21px;
            }
          }

          @media(prefers-reduced-motion:reduce) {
            .en-welcome-card {
              animation: none;
            }
            .en-actions button {
              transition: none;
            }
          }
        `}</style>
      </div>
    );
  }

  // Main ExpenseNest application
  return (
    <>
      <div className="en-cloud-bar">
        <span>
          ☁ {syncStatus}
        </span>

        <button onClick={handleLogout}>
          Logout
        </button>
      </div>

      <App user={session.user} />

      <style>{`
        .en-cloud-bar {
          min-height: 36px;
          padding: 5px 18px;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 16px;
          background: #101b32;
          color: #b9d7ff;
          font: 12px var(--font-ui);
        }

        .en-cloud-bar button {
          border: 1px solid #45658f;
          border-radius: 7px;
          padding: 5px 12px;
          background: transparent;
          color: white;
          cursor: pointer;
        }
      `}</style>
    </>
  );
}
