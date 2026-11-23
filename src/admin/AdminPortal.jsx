import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, LoaderCircle, LogOut, ShieldX } from 'lucide-react';
import { supabase } from '../supabase';
import AdminLogin from './AdminLogin';
import AdminDashboard from './AdminDashboard';
import AdminThemeControl from './AdminThemeControl';
import { recordAdminActivity } from '../activityLog';
import { CURRENCY_STORAGE_KEY, DEFAULT_CURRENCY, isSupportedCurrency } from '../currency';
import {
  DEFAULT_SHARED_PREFERENCES,
  getSharedPreference,
  resetSharedPreferences,
  SHARED_PREFERENCE_STORAGE_KEYS,
  writeSharedPreference,
} from '../sharedPreferences';
import './AdminPortal.css';
import './AdminTheme.css';

function readSavedTheme() {
  try {
    return getSharedPreference('theme') || (window.localStorage.getItem('expenseNestTheme') === 'light' ? 'light' : 'dark');
  } catch {
    return 'dark';
  }
}

function readSavedCurrency() {
  try {
    const value = getSharedPreference('currency') || window.localStorage.getItem(CURRENCY_STORAGE_KEY);
    return isSupportedCurrency(value) ? value : DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
}

function readSavedPreference(name) {
  try {
    return getSharedPreference(name) ?? DEFAULT_SHARED_PREFERENCES[name];
  } catch {
    return DEFAULT_SHARED_PREFERENCES[name];
  }
}

export default function AdminPortal() {
  const [theme, setTheme] = useState(readSavedTheme);
  const [currency, setCurrency] = useState(readSavedCurrency);
  const [dateFormat, setDateFormat] = useState(() => readSavedPreference('dateFormat'));
  const [density, setDensity] = useState(() => readSavedPreference('density'));
  const [privacyMode, setPrivacyMode] = useState(() => readSavedPreference('privacyMode'));
  const [weekStart, setWeekStart] = useState(() => readSavedPreference('weekStart'));
  const [motionPreference, setMotionPreference] = useState(() => readSavedPreference('motionPreference'));
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [verifiedAdminId, setVerifiedAdminId] = useState(null);
  const [error, setError] = useState('');
  const loggedAdminIdRef = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0b1120' : '#ffffff');
    try {
      window.localStorage.setItem('expenseNestTheme', theme);
    } catch {
      // Keep the current page theme even when browser storage is unavailable.
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.dataset.density = density;
  }, [density]);

  useEffect(() => {
    if (motionPreference === 'system') delete document.documentElement.dataset.motion;
    else document.documentElement.dataset.motion = motionPreference;
  }, [motionPreference]);

  useEffect(() => {
    function syncPreferences(event) {
      if (event.type === 'storage' && event.key && ![...Object.values(SHARED_PREFERENCE_STORAGE_KEYS), 'expenseNestSharedPreferences'].includes(event.key)) return;
      const nextTheme = readSavedTheme();
      const nextCurrency = readSavedCurrency();
      const nextDateFormat = readSavedPreference('dateFormat');
      const nextDensity = readSavedPreference('density');
      const nextPrivacyMode = readSavedPreference('privacyMode');
      const nextWeekStart = readSavedPreference('weekStart');
      const nextMotionPreference = readSavedPreference('motionPreference');
      setTheme(nextTheme);
      setCurrency(nextCurrency);
      setDateFormat(nextDateFormat);
      setDensity(nextDensity);
      setPrivacyMode(nextPrivacyMode);
      setWeekStart(nextWeekStart);
      setMotionPreference(nextMotionPreference);
    }
    window.addEventListener('storage', syncPreferences);
    window.addEventListener('expensenest:preferences-changed', syncPreferences);
    return () => {
      window.removeEventListener('storage', syncPreferences);
      window.removeEventListener('expensenest:preferences-changed', syncPreferences);
    };
  }, []);

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

  useEffect(() => {
    if (!verifiedAdminId || verifiedAdminId !== session?.user?.id) {
      loggedAdminIdRef.current = null;
      return;
    }
    if (loggedAdminIdRef.current === verifiedAdminId) return;
    loggedAdminIdRef.current = verifiedAdminId;
    void recordAdminActivity('admin_signed_in');
  }, [verifiedAdminId, session?.user?.id]);

  async function handleLogout() {
    if (verifiedAdminId && verifiedAdminId === session?.user?.id) {
      await recordAdminActivity('admin_signed_out');
    }
    const { error: logoutError } = await supabase.auth.signOut();
    if (logoutError) {
      setError(logoutError.message);
      return;
    }
    setSession(null);
    setVerifiedAdminId(null);
    setError('');
  }

  function handleThemeChange(nextTheme) {
    if (nextTheme !== 'dark' && nextTheme !== 'light') return;
    if (nextTheme === theme) return;
    writeSharedPreference('theme', nextTheme);
    setTheme(nextTheme);
    void recordAdminActivity('admin_setting_changed', 'theme');
  }

  function handleCurrencyChange(event) {
    const nextCurrency = event.target.value;
    if (!isSupportedCurrency(nextCurrency) || nextCurrency === currency) return;
    writeSharedPreference('currency', nextCurrency);
    setCurrency(nextCurrency);
    void recordAdminActivity('admin_setting_changed', 'currency');
  }

  function handleDateFormatChange(event) {
    const nextDateFormat = event.target.value;
    if (nextDateFormat === dateFormat) return;
    writeSharedPreference('dateFormat', nextDateFormat);
    setDateFormat(nextDateFormat);
    void recordAdminActivity('admin_setting_changed', 'dateFormat');
  }

  function handleDensityChange(event) {
    const nextDensity = event.target.value;
    if (nextDensity === density) return;
    writeSharedPreference('density', nextDensity);
    setDensity(nextDensity);
    void recordAdminActivity('admin_setting_changed', 'density');
  }

  function handlePrivacyModeChange(event) {
    const nextPrivacyMode = event.target.checked;
    if (nextPrivacyMode === privacyMode) return;
    writeSharedPreference('privacyMode', nextPrivacyMode);
    setPrivacyMode(nextPrivacyMode);
    void recordAdminActivity('admin_setting_changed', 'privacyMode');
  }

  function handleWeekStartChange(event) {
    const nextWeekStart = event.target.value;
    if (nextWeekStart === weekStart) return;
    writeSharedPreference('weekStart', nextWeekStart);
    setWeekStart(nextWeekStart);
    void recordAdminActivity('admin_setting_changed', 'weekStart');
  }

  function handleMotionPreferenceChange(event) {
    const nextMotionPreference = event.target.value;
    if (nextMotionPreference === motionPreference) return;
    writeSharedPreference('motionPreference', nextMotionPreference);
    setMotionPreference(nextMotionPreference);
    void recordAdminActivity('admin_setting_changed', 'motionPreference');
  }

  function handleResetPreferences() {
    const confirmed = window.confirm('Reset application preferences to their defaults? Transactions, budgets and account data will not be changed.');
    if (!confirmed) return;
    resetSharedPreferences();
    setTheme(DEFAULT_SHARED_PREFERENCES.theme);
    setCurrency(DEFAULT_SHARED_PREFERENCES.currency);
    setDateFormat(DEFAULT_SHARED_PREFERENCES.dateFormat);
    setDensity(DEFAULT_SHARED_PREFERENCES.density);
    setPrivacyMode(DEFAULT_SHARED_PREFERENCES.privacyMode);
    setWeekStart(DEFAULT_SHARED_PREFERENCES.weekStart);
    setMotionPreference(DEFAULT_SHARED_PREFERENCES.motionPreference);
    void recordAdminActivity('admin_setting_changed', 'all_preferences');
  }

  if (checking) {
    return (
      <main className="admin-portal-state">
        <AdminThemeControl theme={theme} onChange={handleThemeChange} variant="portal" />
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
        <AdminLogin theme={theme} onThemeChange={handleThemeChange} onAdminSuccess={(user) => setSession({ user })} />
        {error && <div className="admin-portal-login-error" role="alert">{error}</div>}
      </>
    );
  }

  if (verifiedAdminId !== session.user.id) {
    return (
      <main className="admin-portal-state">
        <AdminThemeControl theme={theme} onChange={handleThemeChange} variant="portal" />
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

  return <AdminDashboard
    onLogout={handleLogout}
    adminUser={session.user}
    theme={theme}
    onThemeChange={handleThemeChange}
    currency={currency}
    onCurrencyChange={handleCurrencyChange}
    dateFormat={dateFormat}
    onDateFormatChange={handleDateFormatChange}
    density={density}
    onDensityChange={handleDensityChange}
    privacyMode={privacyMode}
    onPrivacyModeChange={handlePrivacyModeChange}
    weekStart={weekStart}
    onWeekStartChange={handleWeekStartChange}
    motionPreference={motionPreference}
    onMotionPreferenceChange={handleMotionPreferenceChange}
    onResetPreferences={handleResetPreferences}
  />;
}
