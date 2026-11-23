import { getAppLocale } from './gujaratiLocalization.js';

export const CURRENCY_STORAGE_KEY = 'expenseNestCurrency';
export const DEFAULT_CURRENCY = 'INR';

export const CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee', locale: 'en-IN' },
  { code: 'USD', name: 'US Dollar', locale: 'en-IN' },
  { code: 'EUR', name: 'Euro', locale: 'en-IN' },
  { code: 'GBP', name: 'British Pound', locale: 'en-IN' },
  { code: 'AED', name: 'UAE Dirham', locale: 'en-IN' },
  { code: 'PKR', name: 'Pakistani Rupee', locale: 'en-IN' },
];

const currencyByCode = new Map(CURRENCIES.map((currency) => [currency.code, currency]));

export function isSupportedCurrency(currency) {
  return currencyByCode.has(currency);
}

export function getPreferredCurrency() {
  if (typeof localStorage === 'undefined') return DEFAULT_CURRENCY;
  const savedCurrency = localStorage.getItem(CURRENCY_STORAGE_KEY);
  return isSupportedCurrency(savedCurrency) ? savedCurrency : DEFAULT_CURRENCY;
}

function formatCurrencyValue(amount, currency, notation) {
  const config = currencyByCode.get(currency) ?? currencyByCode.get(DEFAULT_CURRENCY);
  return new Intl.NumberFormat(getAppLocale(), {
    style: 'currency',
    currency: config.code,
    maximumFractionDigits: notation === 'compact' ? 1 : 2,
    ...(notation ? { notation } : {}),
  }).format(Number(amount) || 0);
}

export function formatCurrency(amount, currency = getPreferredCurrency(), notation) {
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem('expenseNestPrivacyMode') === 'true') return '••••';
  } catch {
    // A storage restriction should not prevent the amount from being formatted.
  }
  return formatCurrencyValue(amount, currency, notation);
}

export function formatCurrencyForExport(amount, currency = getPreferredCurrency(), notation) {
  return formatCurrencyValue(amount, currency, notation);
}
