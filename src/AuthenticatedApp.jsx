
import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [choiceLoading, setChoiceLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState('Synced');
  const [error, setError] = useState('');

  const timerRef = useRef(null);
  const userIdRef = useRef(null);
  const readyRef = useRef(false);
  const savingRef = useRef(false);
  const pendingRef = useRef(false);
  const savePromiseRef = useRef(Promise.resolve());

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

      if (!session?.user?.id) return;

      setLoading(true);
      setError('');

      try {
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
          setError(
            'Cloud data load nahi ho saka: ' +
            (err?.message || 'Unknown error')
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    initializeUser();

    return () => {
      active = false;
    };
  }, [session?.user?.id]);

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
            font-family: Arial, sans-serif;
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
            font-family: Arial, sans-serif;
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
            font-weight: 800;
            background: linear-gradient(135deg,#2563eb,#06b6d4);
            box-shadow: 0 10px 30px rgba(37,99,235,.3);
          }

          .en-brand {
            color: #8dbbff;
            font-size: 14px;
            font-weight: 700;
            letter-spacing: 2px;
            margin-bottom: 22px;
          }

          .en-welcome-card h1 {
            color: white;
            font-size: clamp(25px,4vw,32px);
            line-height: 1.2;
            margin: 0 0 12px;
            font-weight: 750;
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
            font-weight: 650;
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

      <App />

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
          font: 12px Arial, sans-serif;
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
