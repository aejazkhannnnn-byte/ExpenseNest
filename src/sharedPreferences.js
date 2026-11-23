import { CURRENCY_STORAGE_KEY, isSupportedCurrency } from './currency';

export const SHARED_PREFERENCES_STORAGE_KEY = 'expenseNestSharedPreferences';
export const DEFAULT_SHARED_PREFERENCES = {
  theme: 'dark',
  currency: 'INR',
  dateFormat: 'regional',
  density: 'comfortable',
  privacyMode: false,
  weekStart: 'sunday',
  motionPreference: 'system',
};

export const SHARED_PREFERENCE_STORAGE_KEYS = {
  theme: 'expenseNestTheme',
  currency: CURRENCY_STORAGE_KEY,
  dateFormat: 'expenseNestDateFormat',
  density: 'expenseNestDensity',
  privacyMode: 'expenseNestPrivacyMode',
  weekStart: 'expenseNestWeekStart',
  motionPreference: 'expenseNestMotionPreference',
};

const STORAGE_KEY_BY_SETTING = SHARED_PREFERENCE_STORAGE_KEYS;

function isValidSetting(name, value) {
  if (name === 'theme') return value === 'light' || value === 'dark';
  if (name === 'currency') return isSupportedCurrency(value);
  if (name === 'dateFormat') return ['regional', 'dmy', 'mdy', 'ymd'].includes(value);
  if (name === 'density') return value === 'comfortable' || value === 'compact';
  if (name === 'privacyMode') return typeof value === 'boolean';
  if (name === 'weekStart') return ['sunday', 'monday', 'saturday'].includes(value);
  if (name === 'motionPreference') return ['system', 'reduced'].includes(value);
  return false;
}

function parsePreferences(value) {
  try {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(STORAGE_KEY_BY_SETTING).flatMap(([name]) => {
      const setting = parsed[name];
      if (!setting || !isValidSetting(name, setting.value)) return [];
      return [[name, { value: setting.value, updatedAt: Number(setting.updatedAt) || 0 }]];
    }));
  } catch {
    return {};
  }
}

export function readSharedPreferences() {
  try {
    return parsePreferences(window.localStorage.getItem(SHARED_PREFERENCES_STORAGE_KEY));
  } catch {
    return {};
  }
}

export function getSharedPreference(name) {
  return readSharedPreferences()[name]?.value ?? null;
}

export function writeSharedPreference(name, value) {
  const storageKey = STORAGE_KEY_BY_SETTING[name];
  if (!storageKey || !isValidSetting(name, value)) return false;

  const preferences = readSharedPreferences();
  if (preferences[name]?.value === value && window.localStorage.getItem(storageKey) === String(value)) return true;
  preferences[name] = { value, updatedAt: Date.now() };
  const serialized = JSON.stringify(preferences);
  window.localStorage.setItem(storageKey, value);
  window.localStorage.setItem(SHARED_PREFERENCES_STORAGE_KEY, serialized);
  window.dispatchEvent(new CustomEvent('expensenest:preferences-changed', { detail: preferences }));
  return true;
}

export function writeSharedPreferences(values) {
  const entries = Object.entries(STORAGE_KEY_BY_SETTING);
  if (!values || entries.some(([name]) => !isValidSetting(name, values[name]))) return false;

  const updatedAt = Date.now();
  const preferences = Object.fromEntries(entries.map(([name]) => (
    [name, { value: values[name], updatedAt }]
  )));
  const previousValues = new Map([
    ...entries.map(([, storageKey]) => [storageKey, window.localStorage.getItem(storageKey)]),
    [SHARED_PREFERENCES_STORAGE_KEY, window.localStorage.getItem(SHARED_PREFERENCES_STORAGE_KEY)],
  ]);

  try {
    entries.forEach(([name, storageKey]) => window.localStorage.setItem(storageKey, values[name]));
    window.localStorage.setItem(SHARED_PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
  } catch (error) {
    previousValues.forEach((value, storageKey) => {
      try {
        if (value === null) window.localStorage.removeItem(storageKey);
        else window.localStorage.setItem(storageKey, value);
      } catch {
        // Preserve the original storage error while attempting to restore earlier values.
      }
    });
    throw error;
  }

  window.dispatchEvent(new CustomEvent('expensenest:preferences-changed', { detail: preferences }));
  return preferences;
}

export function resetSharedPreferences() {
  return writeSharedPreferences(DEFAULT_SHARED_PREFERENCES);
}

export function mergeSharedPreferencesWithCloudData(cloudData) {
  const data = cloudData && typeof cloudData === 'object' ? cloudData : {};
  const localPreferences = readSharedPreferences();
  const cloudPreferences = parsePreferences(data.preferences);
  const mergedPreferences = {};
  let localPreferenceIsNewer = false;

  Object.keys(STORAGE_KEY_BY_SETTING).forEach((name) => {
    const localSetting = localPreferences[name];
    const cloudSetting = cloudPreferences[name];
    const settingFromLegacyCloudData = isValidSetting(name, data[name])
      ? { value: data[name], updatedAt: 0 }
      : null;
    const savedSetting = cloudSetting || settingFromLegacyCloudData;

    if (localSetting && (!savedSetting || localSetting.updatedAt >= savedSetting.updatedAt)) {
      mergedPreferences[name] = localSetting;
      if (!savedSetting || localSetting.updatedAt > savedSetting.updatedAt || localSetting.value !== savedSetting.value) {
        localPreferenceIsNewer = true;
      }
    } else if (savedSetting) {
      mergedPreferences[name] = savedSetting;
    }
  });

  const mergedData = {
    ...data,
    preferences: JSON.stringify(mergedPreferences),
    ...Object.fromEntries(Object.entries(mergedPreferences).map(([name, setting]) => [name, setting.value])),
  };

  return { data: mergedData, localPreferenceIsNewer };
}
