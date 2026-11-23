import FamilySharing from './FamilySharing';
import UserActivityPanel from './components/UserActivityPanel';
import UserFeedbackCenter from './components/UserFeedbackCenter';
import BrandAsset from './components/BrandAsset.jsx';
import { getAppLocale, getPreferredLanguage, setPreferredLanguage, translateForCurrentLanguage } from './gujaratiLocalization.js';
import Footer from './components/Footer.jsx';
import LanguageControl from './components/LanguageControl.jsx';
import { recordUserActivity } from './activityLog';
import { getFeedbackUnreadCount } from './feedbackConversations';
import { CURRENCIES, CURRENCY_STORAGE_KEY, DEFAULT_CURRENCY, formatCurrency, formatCurrencyForExport, getPreferredCurrency, isSupportedCurrency } from './currency.js';
import {
  DEFAULT_SHARED_PREFERENCES,
  getSharedPreference,
  SHARED_PREFERENCE_STORAGE_KEYS,
  SHARED_PREFERENCES_STORAGE_KEY,
  writeSharedPreference,
  writeSharedPreferences,
} from './sharedPreferences.js';
import { DATE_FORMAT_OPTIONS, formatAppDate } from './dateFormatting.js';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  UsersRound,
  ArrowDownRight,
  ArrowLeftRight,
  ArrowRight,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  History,
  MessageSquareText,
  Pencil,
  PieChart,
  PiggyBank,
  Plane,
  Pause,
  Plus,
  Play,
  Printer,
  Repeat,
  Search,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  Moon,
  Target,
  Trash2,
  TrendingUp,
  Utensils,
  Upload,
  WalletCards,
  Zap,
} from 'lucide-react';

const STORAGE_KEY = 'expenseNestTransactions';
const ACCOUNTS_KEY = 'expenseNestAccounts';
const BUDGET_KEY = 'expenseNestMonthlyBudget';
const BUDGETS_KEY = 'expenseNestMonthlyBudgets';
const CATEGORY_BUDGETS_KEY = 'expenseNestCategoryBudgets';
const RECURRING_KEY = 'expenseNestRecurringRules';
const GOALS_KEY = 'expenseNestSavingsGoals';
const CUSTOM_CATEGORIES_KEY = 'expenseNestCustomCategories';
const CURRENCY_KEY = CURRENCY_STORAGE_KEY;
const REMINDER_NOTIFICATIONS_KEY = 'expenseNestReminderNotifications';
const defaultCategories = ['Food', 'Travel', 'Shopping', 'Bills', 'Other'];
const defaultAccounts = [
  { id: 'cash', name: 'Cash', openingBalance: 0 },
  { id: 'bank', name: 'Bank', openingBalance: 0 },
  { id: 'upi', name: 'UPI', openingBalance: 0 },
];
const sectionNavigation = [
  { id: 'overview', label: 'Home', icon: WalletCards },
  { id: 'settings', label: 'Settings', icon: Settings2 },
  { id: 'family-sharing', label: 'Family', icon: UsersRound },
  { id: 'accounts', label: 'Accounts', icon: WalletCards },
  { id: 'budget', label: 'Budget', icon: PiggyBank },
  { id: 'cash-flow', label: 'Forecast', icon: TrendingUp },
  { id: 'monthly-report', label: 'Report', icon: Sparkles },
  { id: 'savings-goals', label: 'Goals', icon: Target },
  { id: 'category-budgets', label: 'Limits', icon: Zap },
  { id: 'recurring', label: 'Recurring', icon: Repeat },
  { id: 'add-transaction', label: 'Add entry', icon: Plus },
  { id: 'analytics', label: 'Analytics', icon: PieChart },
  { id: 'trends', label: 'Trends', icon: TrendingUp },
  { id: 'daily-calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'transactions', label: 'Transactions', icon: ShoppingBag },
  { id: 'activity', label: 'Activity', icon: History },
  { id: 'feedback', label: 'Feedback', icon: MessageSquareText },
  { id: 'backup', label: 'Backup', icon: ShieldCheck },
];
const categoryIcons = { Food: Utensils, Travel: Plane, Shopping: ShoppingBag, Bills: Zap, Other: Sparkles };
const categoryColors = { Food: '#8490ff', Travel: '#54c4e6', Shopping: '#d58af1', Bills: '#ffb85c', Other: '#63d6a5' };

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function transactionDateKey(value) {
  const date = String(value ?? '');
  if (/^\d{4}-\d{2}-\d{2}/.test(date)) return date.slice(0, 10);
  const legacyDate = date.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (legacyDate) return `${legacyDate[3]}-${legacyDate[2].padStart(2, '0')}-${legacyDate[1].padStart(2, '0')}`;
  return localDateKey();
}

function displayDate(value) {
  return formatAppDate(transactionDateKey(value));
}

function currentMonthKey() { return localDateKey().slice(0, 7); }

function shiftMonth(month, offset) {
  const [year, monthNumber] = month.split('-').map(Number);
  const shifted = new Date(year, monthNumber - 1 + offset, 1);
  return `${shifted.getFullYear()}-${String(shifted.getMonth() + 1).padStart(2, '0')}`;
}

function getSavedTheme() {
  return getSharedPreference('theme') || (localStorage.getItem('expenseNestTheme') === 'light' ? 'light' : 'dark');
}

function shouldReduceMotion() {
  const preference = getSharedPreference('motionPreference');
  return preference === 'reduced'
    || (preference !== 'reduced' && typeof window.matchMedia === 'function'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
}

function getNotificationPermission() {
  return typeof window !== 'undefined' && 'Notification' in window
    ? window.Notification.permission
    : 'unsupported';
}

function getSavedCustomCategories() {
  const saved = readLocalJson(CUSTOM_CATEGORIES_KEY, []);
  if (!Array.isArray(saved)) return [];
  const usedNames = new Set(defaultCategories.map((category) => category.toLowerCase()));
  return saved.filter((value) => {
    if (typeof value !== 'string') return false;
    const category = value.trim();
    const normalized = category.toLowerCase();
    if (!category || category.length > 24 || usedNames.has(normalized)) return false;
    usedNames.add(normalized);
    return true;
  }).slice(0, 20);
}

function defaultDateForMonth(month) {
  const today = localDateKey();
  return today.startsWith(month) ? today : `${month}-01`;
}

function lastDayOfMonth(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(year, monthNumber, 0).getDate();
}

function recurringDate(rule, month) {
  const day = Math.min(Math.max(Number(rule.dayOfMonth) || 1, 1), lastDayOfMonth(month));
  return `${month}-${String(day).padStart(2, '0')}`;
}

function daysBetween(dateKey, otherDateKey) {
  const toUtcDay = (key) => {
    const [year, month, day] = key.split('-').map(Number);
    return Date.UTC(year, month - 1, day);
  };
  return Math.round((toUtcDay(dateKey) - toUtcDay(otherDateKey)) / 86_400_000);
}

function readLocalJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) ?? JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function getSavedTransactions() {
  const saved = readLocalJson(STORAGE_KEY, []);
  return Array.isArray(saved) ? saved : [];
}

function getSavedAccounts() {
  const saved = readLocalJson(ACCOUNTS_KEY, null);
  const savedAccounts = Array.isArray(saved) ? saved : [];
  const builtInAccounts = defaultAccounts.map((account) => {
    const stored = savedAccounts.find((item) => item?.id === account.id);
    const openingBalance = Number(stored?.openingBalance);
    return {
      ...account,
      openingBalance: Number.isFinite(openingBalance) ? openingBalance : 0,
    };
  });
  const customAccounts = savedAccounts.filter((item) => (
    isRecord(item) && typeof item.id === 'string' && item.id && !defaultAccounts.some((account) => account.id === item.id)
    && typeof item.name === 'string' && item.name.trim() && Number.isFinite(Number(item.openingBalance))
  )).map((item) => ({
    id: item.id,
    name: item.name.trim(),
    openingBalance: Number(item.openingBalance),
  }));
  return [...builtInAccounts, ...customAccounts];
}

function getSavedBudgets() {
  const saved = readLocalJson(BUDGETS_KEY, {});
  if (saved && typeof saved === 'object' && !Array.isArray(saved) && Object.keys(saved).length) return saved;
  const legacyBudget = Number(localStorage.getItem(BUDGET_KEY));
  return legacyBudget > 0 ? { [currentMonthKey()]: legacyBudget } : {};
}

function getSavedCategoryBudgets() {
  const saved = readLocalJson(CATEGORY_BUDGETS_KEY, {});
  return saved && typeof saved === 'object' && !Array.isArray(saved) ? saved : {};
}

function getSavedRecurringRules() {
  const saved = readLocalJson(RECURRING_KEY, []);
  return Array.isArray(saved) ? saved : [];
}

function getSavedGoals() {
  const saved = readLocalJson(GOALS_KEY, []);
  return Array.isArray(saved) ? saved : [];
}

function csvCell(value) {
  const rawText = String(value ?? '');
  const text = /^[\s]*[=+\-@]/.test(rawText) ? `'${rawText}` : rawText;
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function parseCsvRows(source) {
  const text = String(source).replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"' && cell.length === 0) {
      quoted = true;
    } else if (character === ',') {
      row.push(cell);
      cell = '';
    } else if (character === '\n' || character === '\r') {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += character;
    }
  }

  if (quoted) throw new Error('The CSV has an unfinished quoted field.');
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((cells) => cells.some((value) => value.trim() !== ''));
}

function parseCsvDate(value) {
  const text = String(value ?? '').trim();
  let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  let year;
  let month;
  let day;
  if (match) {
    [, year, month, day] = match;
  } else {
    match = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (!match) return '';
    [, day, month, year] = match;
  }
  const parts = [Number(year), Number(month), Number(day)];
  const parsed = new Date(parts[0], parts[1] - 1, parts[2]);
  if (parsed.getFullYear() !== parts[0] || parsed.getMonth() !== parts[1] - 1 || parsed.getDate() !== parts[2]) return '';
  return `${String(parts[0]).padStart(4, '0')}-${String(parts[1]).padStart(2, '0')}-${String(parts[2]).padStart(2, '0')}`;
}

function transactionFingerprint(transaction) {
  return [
    transactionDateKey(transaction.date),
    String(transaction.title).trim().toLowerCase(),
    Number(transaction.amount).toFixed(2),
    String(transaction.type).toLowerCase(),
    String(transaction.category).toLowerCase(),
    transaction.accountId ?? '',
    transaction.fromAccountId ?? '',
    transaction.toAccountId ?? '',
  ].join('|');
}

function transactionBaseFingerprint(transaction) {
  const { accountId, ...baseTransaction } = transaction;
  return transactionFingerprint({ ...baseTransaction, accountId: '' });
}

function parseTransactionCsv(source, existingTransactions, availableCategories = defaultCategories, availableAccounts = defaultAccounts) {
  const [headerRow, ...dataRows] = parseCsvRows(source);
  if (!headerRow || !dataRows.length) throw new Error('This CSV does not contain transaction rows.');

  const headers = headerRow.map((value) => value.trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
  const findColumn = (...aliases) => headers.findIndex((header) => aliases.includes(header));
  const columns = {
    date: findColumn('date', 'transactiondate'),
    title: findColumn('description', 'title', 'name', 'transaction'),
    type: findColumn('type', 'transactiontype'),
    category: findColumn('category'),
    amount: findColumn('amount', 'amountinr', 'value'),
    account: findColumn('account', 'accountname', 'wallet', 'paymentaccount'),
    fromAccount: findColumn('fromaccount', 'sourceaccount'),
    toAccount: findColumn('toaccount', 'destinationaccount'),
  };
  const missing = Object.entries(columns).filter(([name, index]) => name !== 'account' && index < 0).map(([name]) => name);
  if (missing.length) throw new Error(`Missing CSV columns: ${missing.join(', ')}.`);

  const knownTransactions = new Set(existingTransactions.map(transactionFingerprint));
  const legacyTransactions = new Set(existingTransactions.filter((item) => !item.accountId).map(transactionBaseFingerprint));
  const accountByName = new Map(availableAccounts.map((account) => [account.name.toLowerCase(), account.id]));
  const accountIdFromName = (name) => accountByName.get(String(name ?? '').trim().toLowerCase()) ?? '';
  const imported = [];
  let duplicates = 0;
  let invalid = 0;

  dataRows.forEach((cells) => {
    const rawDate = cells[columns.date] ?? '';
    const title = (cells[columns.title] ?? '').trim();
    const type = (cells[columns.type] ?? '').trim().toLowerCase();
    const rawCategory = (cells[columns.category] ?? '').trim();
    const category = type === 'transfer' && rawCategory.toLowerCase() === 'transfer'
      ? 'Other'
      : availableCategories.find((item) => item.toLowerCase() === rawCategory.toLowerCase());
    const rawAccount = columns.account >= 0 ? (cells[columns.account] ?? '').trim() : '';
    const accountId = columns.account < 0 ? 'cash' : rawAccount.toLowerCase() === 'unassigned' ? '' : accountByName.get(rawAccount.toLowerCase());
    const rawFromAccount = columns.fromAccount >= 0 ? (cells[columns.fromAccount] ?? '') : '';
    const rawToAccount = columns.toAccount >= 0 ? (cells[columns.toAccount] ?? '') : '';
    const fromAccountId = accountIdFromName(rawFromAccount);
    const toAccountId = accountIdFromName(rawToAccount);
    const rawAmount = (cells[columns.amount] ?? '').replace(/[\s,\u20b9]/g, '');
    const amount = Number(rawAmount);
    const date = parseCsvDate(rawDate);

    const validTransfer = type !== 'transfer' || (fromAccountId && toAccountId && fromAccountId !== toAccountId);
    if (!date || !title || !['income', 'expense', 'transfer'].includes(type) || !category || !Number.isFinite(amount) || amount <= 0 || !validTransfer
      || (columns.account >= 0 && rawAccount && !accountId && rawAccount.toLowerCase() !== 'unassigned')) {
      invalid += 1;
      return;
    }

    const transaction = {
      id: crypto.randomUUID(), title, amount, type, category, date,
      ...(type === 'transfer'
        ? { fromAccountId, toAccountId }
        : accountId ? { accountId } : {}),
    };
    const fingerprint = transactionFingerprint(transaction);
    if (knownTransactions.has(fingerprint) || (!rawAccount && legacyTransactions.has(transactionBaseFingerprint(transaction)))) {
      duplicates += 1;
      return;
    }
    knownTransactions.add(fingerprint);
    imported.push(transaction);
  });

  return { transactions: imported, duplicates, invalid };
}

function isRecord(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function parseFullBackup(source) {
  const backup = JSON.parse(source);
  const data = backup?.data;
  if (backup?.app !== 'ExpenseNest' || backup?.version !== 1 || !isRecord(data)) {
    throw new Error('This is not a supported ExpenseNest backup file.');
  }
  if (!Array.isArray(data.transactions) || !Array.isArray(data.recurringRules) || !Array.isArray(data.goals)) {
    throw new Error('The backup is missing transaction, schedule or goal data.');
  }
  const customCategories = data.categories ?? [];
  if (!Array.isArray(customCategories) || customCategories.length > 20) {
    throw new Error('The backup contains an invalid category list.');
  }
  const knownNames = new Set(defaultCategories.map((category) => category.toLowerCase()));
  const invalidCategories = customCategories.some((category) => {
    if (typeof category !== 'string' || !category.trim() || category.trim().length > 24) return true;
    const normalized = category.trim().toLowerCase();
    if (knownNames.has(normalized)) return true;
    knownNames.add(normalized);
    return false;
  });
  if (invalidCategories) throw new Error('The backup contains an invalid or duplicate category.');
  const backupCategories = [...defaultCategories, ...customCategories.map((category) => category.trim())];
  const backupAccounts = data.accounts ?? defaultAccounts;
  if (!Array.isArray(backupAccounts) || backupAccounts.length < defaultAccounts.length || backupAccounts.length > 100) {
    throw new Error('The backup contains an invalid account list.');
  }
  const accountIds = new Set();
  const accountNames = new Set();
  const invalidAccounts = backupAccounts.some((account) => {
    if (!isRecord(account) || typeof account.id !== 'string' || !account.id.trim()
      || typeof account.name !== 'string' || !account.name.trim() || account.name.trim().length > 24
      || !Number.isFinite(Number(account.openingBalance))) return true;
    const normalizedName = account.name.trim().toLowerCase();
    if (accountIds.has(account.id) || accountNames.has(normalizedName)) return true;
    accountIds.add(account.id);
    accountNames.add(normalizedName);
    return false;
  }) || defaultAccounts.some((account) => !accountIds.has(account.id));
  if (invalidAccounts) throw new Error('The backup contains an invalid or duplicate account.');
  const invalidTransaction = data.transactions.some((item) => (
    !isRecord(item) || !String(item.title ?? '').trim() || !['income', 'expense', 'transfer'].includes(item.type)
    || !backupCategories.includes(item.category) || !Number.isFinite(Number(item.amount)) || Number(item.amount) <= 0
    || !parseCsvDate(item.date) || (item.accountId && !accountIds.has(item.accountId))
    || (item.type === 'transfer' && (!accountIds.has(item.fromAccountId) || !accountIds.has(item.toAccountId) || item.fromAccountId === item.toAccountId))
    || (item.type !== 'transfer' && (item.fromAccountId || item.toAccountId))
  ));
  if (invalidTransaction) throw new Error('The backup contains an invalid transaction.');
  if (!isRecord(data.monthlyBudgets) || !isRecord(data.categoryBudgets)) {
    throw new Error('The backup is missing budget data.');
  }
  const validMonth = (month) => /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
  const validAmount = (amount) => Number.isFinite(Number(amount)) && Number(amount) >= 0;
  const invalidMonthlyBudgets = Object.entries(data.monthlyBudgets).some(([month, amount]) => !validMonth(month) || !validAmount(amount));
  const invalidCategoryBudgets = Object.entries(data.categoryBudgets).some(([month, limits]) => (
    !validMonth(month) || !isRecord(limits)
    || Object.entries(limits).some(([category, amount]) => !backupCategories.includes(category) || !validAmount(amount))
  ));
  const invalidRule = data.recurringRules.some((rule) => (
    !isRecord(rule) || !String(rule.title ?? '').trim() || !['income', 'expense'].includes(rule.type)
    || !backupCategories.includes(rule.category) || !Number.isFinite(Number(rule.amount)) || Number(rule.amount) <= 0
    || (rule.accountId && !accountIds.has(rule.accountId))
    || !Number.isInteger(Number(rule.dayOfMonth)) || Number(rule.dayOfMonth) < 1 || Number(rule.dayOfMonth) > 31
    || !validMonth(rule.startMonth) || typeof rule.active !== 'boolean'
  ));
  const invalidGoal = data.goals.some((goal) => (
    !isRecord(goal) || !String(goal.title ?? '').trim()
    || !Number.isFinite(Number(goal.targetAmount)) || Number(goal.targetAmount) <= 0
    || !Number.isFinite(Number(goal.savedAmount)) || Number(goal.savedAmount) < 0
    || (goal.deadline && !parseCsvDate(goal.deadline))
  ));
  if (invalidMonthlyBudgets || invalidCategoryBudgets || invalidRule || invalidGoal) {
    throw new Error('The backup contains invalid budget, recurring schedule or savings goal data.');
  }
  if (data.monthlyBudget !== undefined && data.monthlyBudget !== '' && !validAmount(data.monthlyBudget)) {
    throw new Error('The backup contains an invalid monthly budget.');
  }
  if (data.currency !== undefined && !isSupportedCurrency(data.currency)) {
    throw new Error('The backup contains an unsupported currency preference.');
  }
  if (data.dateFormat !== undefined && !DATE_FORMAT_OPTIONS.some(({ value }) => value === data.dateFormat)) {
    throw new Error('The backup contains an unsupported date format preference.');
  }
  if (data.density !== undefined && !['comfortable', 'compact'].includes(data.density)) {
    throw new Error('The backup contains an unsupported layout density preference.');
  }
  if (data.privacyMode !== undefined && typeof data.privacyMode !== 'boolean') {
    throw new Error('The backup contains an unsupported privacy preference.');
  }
  if (data.weekStart !== undefined && !['sunday', 'monday', 'saturday'].includes(data.weekStart)) {
    throw new Error('The backup contains an unsupported first day of week.');
  }
  if (data.motionPreference !== undefined && !['system', 'reduced'].includes(data.motionPreference)) {
    throw new Error('The backup contains an unsupported motion preference.');
  }
  if (data.language !== undefined && !['en', 'gu'].includes(data.language)) {
    throw new Error('The backup contains an unsupported language preference.');
  }
  return backup;
}

export default function App({ user }) {
  const [transactions, setTransactions] = useState(getSavedTransactions);
  const [accounts, setAccounts] = useState(getSavedAccounts);
  const [form, setForm] = useState({ title: '', amount: '', type: 'expense', category: 'Food', accountId: 'cash', fromAccountId: 'cash', toAccountId: 'bank', date: localDateKey() });
  const [accountForm, setAccountForm] = useState({ name: '', openingBalance: '' });
  const [accountOpeningDrafts, setAccountOpeningDrafts] = useState(() => Object.fromEntries(getSavedAccounts().map((account) => [account.id, String(account.openingBalance)])));
  const [accountStatus, setAccountStatus] = useState('');
  const [legacyAssignmentDraft, setLegacyAssignmentDraft] = useState('cash');
  const [repeatMonthly, setRepeatMonthly] = useState(false);
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [activeSection, setActiveSection] = useState('overview');
  const [feedbackUnreadCount, setFeedbackUnreadCount] = useState(0);
  const sectionNavRef = useRef(null);
  const sectionProgressRef = useRef(null);
  const [customCategories, setCustomCategories] = useState(getSavedCustomCategories);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [customCategoryStatus, setCustomCategoryStatus] = useState('');
  const [hoveredCategory, setHoveredCategory] = useState('');
  const [message, setMessage] = useState('');
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [minimumAmount, setMinimumAmount] = useState('');
  const [maximumAmount, setMaximumAmount] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [editingId, setEditingId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthKey);
  const [monthlyBudgets, setMonthlyBudgets] = useState(getSavedBudgets);
  const [categoryBudgets, setCategoryBudgets] = useState(getSavedCategoryBudgets);
  const [recurringRules, setRecurringRules] = useState(getSavedRecurringRules);
  const [goals, setGoals] = useState(getSavedGoals);
  const [goalFormOpen, setGoalFormOpen] = useState(false);
  const [goalForm, setGoalForm] = useState({ title: '', targetAmount: '', savedAmount: '', deadline: '' });
  const [goalContributionDrafts, setGoalContributionDrafts] = useState({});
  const [budgetDraft, setBudgetDraft] = useState('');
  const [categoryBudgetDrafts, setCategoryBudgetDrafts] = useState({});
  const [categoryBudgetNotice, setCategoryBudgetNotice] = useState('');
  const [theme, setTheme] = useState(getSavedTheme);
  const [language, setLanguage] = useState(() => getSharedPreference('language') || getPreferredLanguage());
  const [currency, setCurrency] = useState(() => getSharedPreference('currency') || getPreferredCurrency());
  const [dateFormat, setDateFormat] = useState(() => getSharedPreference('dateFormat') || DEFAULT_SHARED_PREFERENCES.dateFormat);
  const [density, setDensity] = useState(() => getSharedPreference('density') || DEFAULT_SHARED_PREFERENCES.density);
  const [privacyMode, setPrivacyMode] = useState(() => getSharedPreference('privacyMode') ?? DEFAULT_SHARED_PREFERENCES.privacyMode);
  const [weekStart, setWeekStart] = useState(() => getSharedPreference('weekStart') || DEFAULT_SHARED_PREFERENCES.weekStart);
  const [motionPreference, setMotionPreference] = useState(() => getSharedPreference('motionPreference') || DEFAULT_SHARED_PREFERENCES.motionPreference);
  const [notificationPermission, setNotificationPermission] = useState(getNotificationPermission);
  const [notificationStatus, setNotificationStatus] = useState('');
  const [importPreview, setImportPreview] = useState(null);
  const [importStatus, setImportStatus] = useState('');
  const [backupPreview, setBackupPreview] = useState(null);
  const [backupStatus, setBackupStatus] = useState('');
  function trackActivity(eventType) {
    if (!user?.id) return;
    void recordUserActivity(eventType).catch(() => {
      // Activity history is optional and must never block the financial action itself.
    });
  }

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const quickAction = currentUrl.searchParams.get('quickAction');
    const targetId = currentUrl.hash.slice(1);
    if (quickAction === 'income' || quickAction === 'expense') {
      setForm((current) => ({ ...current, type: quickAction }));
    }
    if (quickAction) {
      currentUrl.searchParams.delete('quickAction');
      window.history.replaceState({}, '', `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`);
    }
    if (!targetId) return undefined;
    if (sectionNavigation.some((item) => item.id === targetId)) setActiveSection(targetId);
    let attempts = 0;
    let timer = 0;
    const scrollToTarget = () => {
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (attempts < 16) {
        attempts += 1;
        timer = window.setTimeout(scrollToTarget, 80);
      }
    };
    const frame = window.requestAnimationFrame(scrollToTarget);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (!user?.id) {
      setFeedbackUnreadCount(0);
      return undefined;
    }
    let active = true;
    const refreshUnread = () => {
      void getFeedbackUnreadCount()
        .then((count) => { if (active) setFeedbackUnreadCount(count); })
        .catch(() => {});
    };
    refreshUnread();
    window.addEventListener('focus', refreshUnread);
    const timer = window.setInterval(refreshUnread, 45000);
    return () => {
      active = false;
      window.removeEventListener('focus', refreshUnread);
      window.clearInterval(timer);
    };
  }, [user?.id]);

  function setUserTheme(nextTheme) {
    const value = typeof nextTheme === 'function' ? nextTheme(theme) : nextTheme;
    if (value === theme) return;
    setTheme(value);
    trackActivity('settings_updated');
  }

  const categories = useMemo(() => [...defaultCategories, ...customCategories], [customCategories]);
  const activeNavItem = sectionNavigation.find((item) => item.id === activeSection) ?? sectionNavigation[0];
  const ActiveSectionIcon = activeNavItem.icon;

  const monthTransactions = useMemo(
    () => transactions.filter((item) => transactionDateKey(item.date).slice(0, 7) === selectedMonth),
    [transactions, selectedMonth],
  );

  const totals = useMemo(() => {
    const income = monthTransactions
      .filter((item) => item.type === 'income')
      .reduce((sum, item) => sum + Number(item.amount), 0);
    const expense = monthTransactions
      .filter((item) => item.type === 'expense')
      .reduce((sum, item) => sum + Number(item.amount), 0);
    return { income, expense, balance: income - expense };
  }, [monthTransactions]);

  const expenseByCategory = useMemo(() => Object.fromEntries(categories.map((category) => [
    category,
    monthTransactions
      .filter((item) => item.type === 'expense' && item.category === category)
      .reduce((sum, item) => sum + Number(item.amount), 0),
  ])), [monthTransactions]);

  const categoryTotals = useMemo(() => categories.map((category) => ({
    category,
    amount: monthTransactions
      .filter((item) => item.type === 'expense' && item.category === category)
      .reduce((sum, item) => sum + Number(item.amount), 0),
  })).filter((item) => item.amount > 0).sort((a, b) => b.amount - a.amount), [monthTransactions]);

  const monthlyTrend = useMemo(() => Array.from({ length: 6 }, (_, index) => {
    const month = shiftMonth(selectedMonth, index - 5);
    const monthItems = transactions.filter((item) => transactionDateKey(item.date).slice(0, 7) === month);
    return {
      key: month,
      label: new Date(`${month}-01T00:00:00`).toLocaleDateString(getAppLocale(), { month: 'short' }),
      fullLabel: new Date(`${month}-01T00:00:00`).toLocaleDateString(getAppLocale(), { month: 'long', year: 'numeric' }),
      income: monthItems.filter((item) => item.type === 'income').reduce((sum, item) => sum + Number(item.amount), 0),
      expense: monthItems.filter((item) => item.type === 'expense').reduce((sum, item) => sum + Number(item.amount), 0),
    };
  }), [transactions, selectedMonth]);

  const hasDateRange = Boolean(dateFrom || dateTo);
  const dateRangeInvalid = Boolean(dateFrom && dateTo && dateFrom > dateTo);
  const amountRangeInvalid = minimumAmount !== '' && maximumAmount !== '' && Number(minimumAmount) > Number(maximumAmount);
  const transactionPool = hasDateRange ? transactions : monthTransactions;
  const dateScopedTransactions = dateRangeInvalid ? [] : transactionPool.filter((item) => {
    const date = transactionDateKey(item.date);
    return (!dateFrom || date >= dateFrom) && (!dateTo || date <= dateTo);
  });
  const filteredTransactions = amountRangeInvalid ? [] : dateScopedTransactions.filter((item) => {
    const matchesType = filter === 'all' || item.type === filter;
    const matchesCategory = !categoryFilter || (item.type !== 'transfer' && item.category === categoryFilter);
    const amount = Number(item.amount);
    const matchesAmount = (minimumAmount === '' || amount >= Number(minimumAmount))
      && (maximumAmount === '' || amount <= Number(maximumAmount));
    const search = query.trim().toLowerCase();
    const matchesSearch = String(item.title).toLowerCase().includes(search)
      || String(item.category).toLowerCase().includes(search);
    return matchesType && matchesCategory && matchesAmount && matchesSearch;
  });
  const visibleTransactions = [...filteredTransactions].sort((first, second) => {
    const firstDate = transactionDateKey(first.date);
    const secondDate = transactionDateKey(second.date);
    if (sortOrder === 'amount-high') return Number(second.amount) - Number(first.amount) || secondDate.localeCompare(firstDate);
    if (sortOrder === 'amount-low') return Number(first.amount) - Number(second.amount) || secondDate.localeCompare(firstDate);
    return sortOrder === 'oldest' ? firstDate.localeCompare(secondDate) : secondDate.localeCompare(firstDate);
  });
  const hasTransactionFilters = Boolean(
    query.trim() || dateFrom || dateTo || minimumAmount || maximumAmount
    || categoryFilter || filter !== 'all' || sortOrder !== 'newest',
  );

  const savingsRate = totals.income
    ? Math.max(0, Math.round(((totals.income - totals.expense) / totals.income) * 100))
    : 0;
  const previousMonthKey = shiftMonth(selectedMonth, -1);
  const previousMonthTotals = monthlyTrend.find((item) => item.key === previousMonthKey) ?? { income: 0, expense: 0 };
  const previousSavingsRate = previousMonthTotals.income
    ? ((previousMonthTotals.income - previousMonthTotals.expense) / previousMonthTotals.income) * 100
    : null;
  const budget = Number(monthlyBudgets[selectedMonth] ?? 0);
  const budgetUsed = budget ? Math.min(100, Math.round((totals.expense / budget) * 100)) : 0;
  const budgetRemaining = budget - totals.expense;
  const activeCategoryBudgets = categoryBudgets[selectedMonth] ?? {};
  const categoriesOverLimit = categories.filter((category) => (
    Object.hasOwn(activeCategoryBudgets, category)
    && expenseByCategory[category] > Number(activeCategoryBudgets[category])
  ));
  const visibleRecurringRules = recurringRules.filter((rule) => rule.startMonth <= selectedMonth);
  const selectedMonthLabel = new Date(`${selectedMonth}-01T00:00:00`)
    .toLocaleDateString(getAppLocale(), { month: 'long', year: 'numeric' });
  const previousMonthLabel = new Date(`${previousMonthKey}-01T00:00:00`)
    .toLocaleDateString(getAppLocale(), { month: 'long', year: 'numeric' });
  const todayKey = localDateKey();
  const knownAccountIds = new Set(accounts.map((account) => account.id));
  const accountStats = accounts.map((account) => {
    const balanceChange = transactions
      .filter((item) => transactionDateKey(item.date) <= todayKey)
      .reduce((balance, item) => {
        if (item.type === 'transfer') {
          if (item.fromAccountId === account.id) return balance - Number(item.amount);
          if (item.toAccountId === account.id) return balance + Number(item.amount);
          return balance;
        }
        return item.accountId === account.id ? balance + (item.type === 'income' ? 1 : -1) * Number(item.amount) : balance;
      }, 0);
    const monthExpenses = monthTransactions
      .filter((item) => item.accountId === account.id && item.type === 'expense')
      .reduce((sum, item) => sum + Number(item.amount), 0);
    return {
      ...account,
      balance: Number(account.openingBalance) + balanceChange,
      monthExpenses,
      transactionCount: transactions.filter((item) => item.accountId === account.id || item.fromAccountId === account.id || item.toAccountId === account.id).length,
    };
  });
  const unassignedTransactions = transactions.filter((item) => item.type === 'transfer'
    ? !knownAccountIds.has(item.fromAccountId) || !knownAccountIds.has(item.toAccountId)
    : !knownAccountIds.has(item.accountId));
  const unassignedBalance = unassignedTransactions
    .filter((item) => transactionDateKey(item.date) <= todayKey)
    .reduce((balance, item) => balance + (item.type === 'transfer' ? 0 : (item.type === 'income' ? 1 : -1) * Number(item.amount)), 0);
  const totalAccountBalance = accountStats.reduce((sum, account) => sum + account.balance, 0) + unassignedBalance;
  const accountName = (accountId) => accounts.find((account) => account.id === accountId)?.name ?? (accountId ? 'Unknown account' : 'Unassigned');
  const isForecastMonth = selectedMonth === todayKey.slice(0, 7);
  const forecastDaysElapsed = isForecastMonth ? Number(todayKey.slice(-2)) : 0;
  const forecastDaysInMonth = lastDayOfMonth(selectedMonth);
  const forecastExpenseToDate = isForecastMonth
    ? monthTransactions
      .filter((item) => item.type === 'expense' && transactionDateKey(item.date) <= todayKey)
      .reduce((sum, item) => sum + Number(item.amount), 0)
    : 0;
  const hasForecastData = forecastExpenseToDate > 0 && forecastDaysElapsed > 0;
  const projectedMonthExpense = hasForecastData
    ? (forecastExpenseToDate / forecastDaysElapsed) * forecastDaysInMonth
    : 0;
  const forecastStatus = !hasForecastData
    ? 'forecast-empty'
    : !budget
      ? 'forecast-no-budget'
      : projectedMonthExpense > budget
        ? 'forecast-over'
        : projectedMonthExpense >= budget * 0.8
          ? 'forecast-near'
          : 'forecast-on-track';
  const recurringItems = visibleRecurringRules.map((rule) => {
    const dueDate = recurringDate(rule, selectedMonth);
    return {
      rule,
      dueDate,
      daysUntil: daysBetween(dueDate, todayKey),
      isPaid: monthTransactions.some((item) => item.recurringRuleId === rule.id),
    };
  });
  const dueReminders = selectedMonth === todayKey.slice(0, 7)
    ? recurringItems.filter(({ rule, daysUntil, isPaid }) => rule.active && !isPaid && daysUntil <= 7)
    : [];
  const actualCashflowTransactions = isForecastMonth
    ? monthTransactions.filter((item) => transactionDateKey(item.date) <= todayKey)
    : [];
  const plannedCashflowTransactions = isForecastMonth
    ? monthTransactions.filter((item) => transactionDateKey(item.date) > todayKey)
    : [];
  const unpaidRecurringItems = isForecastMonth
    ? recurringItems.filter(({ rule, isPaid }) => rule.active && !isPaid)
    : [];
  const recordedIncomeToDate = actualCashflowTransactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const recordedExpensesToDate = actualCashflowTransactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const recordedCashflowNet = recordedIncomeToDate - recordedExpensesToDate;
  const expectedIncome = plannedCashflowTransactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + Number(item.amount), 0)
    + unpaidRecurringItems.filter(({ rule }) => rule.type === 'income').reduce((sum, { rule }) => sum + Number(rule.amount), 0);
  const expectedScheduledExpenses = plannedCashflowTransactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount), 0)
    + unpaidRecurringItems.filter(({ rule }) => rule.type === 'expense').reduce((sum, { rule }) => sum + Number(rule.amount), 0);
  const dailySpendExpenseToDate = actualCashflowTransactions
    .filter((item) => item.type === 'expense' && !item.recurringRuleId)
    .reduce((sum, item) => sum + Number(item.amount), 0);
  const projectedDailyExpenses = forecastDaysElapsed > 0
    ? (dailySpendExpenseToDate / forecastDaysElapsed) * Math.max(0, forecastDaysInMonth - forecastDaysElapsed)
    : 0;
  const expectedExpenses = expectedScheduledExpenses + projectedDailyExpenses;
  const projectedAccountBalance = totalAccountBalance + expectedIncome - expectedExpenses;
  const hasCashflowData = isForecastMonth && (
    actualCashflowTransactions.length > 0
    || plannedCashflowTransactions.length > 0
    || unpaidRecurringItems.length > 0
    || accounts.some((account) => Number(account.openingBalance) !== 0)
  );
  const cashflowEvents = [
    ...plannedCashflowTransactions.filter((item) => item.type !== 'transfer').map((item) => ({
      id: item.id,
      date: transactionDateKey(item.date),
      title: item.title,
      amount: Number(item.amount),
      type: item.type,
      recurring: Boolean(item.recurringRuleId),
    })),
    ...unpaidRecurringItems.map(({ rule, dueDate }) => ({
      id: rule.id,
      date: dueDate,
      title: rule.title,
      amount: Number(rule.amount),
      type: rule.type,
      recurring: true,
    })),
  ].sort((first, second) => first.date.localeCompare(second.date)).slice(0, 4);

  useEffect(() => {
    setBudgetDraft(monthlyBudgets[selectedMonth] ? String(monthlyBudgets[selectedMonth]) : '');
  }, [selectedMonth, monthlyBudgets]);

  useEffect(() => {
    setCategoryBudgetDrafts({ ...(categoryBudgets[selectedMonth] ?? {}) });
  }, [selectedMonth, categoryBudgets]);

  useEffect(() => {
    let frame = 0;
    const updateActiveSection = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        const current = sectionNavigation.reduce((active, { id }) => {
          const section = document.getElementById(id);
          if (!section) return active;

          const sectionTop = section.getBoundingClientRect().top;
          const activeTop = document.getElementById(active)?.getBoundingClientRect().top ?? -Infinity;
          return sectionTop <= 145 && sectionTop > activeTop ? id : active;
        }, 'overview');
        const atPageEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8;
        const nextActive = atPageEnd ? 'settings' : current;
        setActiveSection((previous) => previous === nextActive ? previous : nextActive);
        const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollableHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollableHeight)) : 0;
        if (sectionProgressRef.current) sectionProgressRef.current.style.transform = `scaleX(${progress})`;
      });
    };
    window.addEventListener('scroll', updateActiveSection, { passive: true });
    updateActiveSection();
    return () => {
      window.removeEventListener('scroll', updateActiveSection);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const navScroller = sectionNavRef.current;
    const activeLink = navScroller?.querySelector('a.active');
    if (!navScroller || !activeLink) return;
    const scrollerBounds = navScroller.getBoundingClientRect();
    const linkBounds = activeLink.getBoundingClientRect();
    const left = navScroller.scrollLeft + linkBounds.left - scrollerBounds.left - (navScroller.clientWidth - linkBounds.width) / 2;
    navScroller.scrollTo({
      left: Math.max(0, left),
      behavior: shouldReduceMotion() ? 'auto' : 'smooth',
    });
  }, [activeSection]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0b1120' : '#ffffff');
    writeSharedPreference('theme', theme);
  }, [theme]);

  useEffect(() => {
    writeSharedPreference('language', language);
    setPreferredLanguage(language);
  }, [language]);

  useEffect(() => {
    writeSharedPreference('currency', currency);
  }, [currency]);

  useEffect(() => {
    writeSharedPreference('dateFormat', dateFormat);
  }, [dateFormat]);

  useEffect(() => {
    document.documentElement.dataset.density = density;
    writeSharedPreference('density', density);
  }, [density]);

  useEffect(() => {
    writeSharedPreference('privacyMode', privacyMode);
  }, [privacyMode]);

  useEffect(() => {
    writeSharedPreference('weekStart', weekStart);
  }, [weekStart]);

  useEffect(() => {
    if (motionPreference === 'system') delete document.documentElement.dataset.motion;
    else document.documentElement.dataset.motion = motionPreference;
    writeSharedPreference('motionPreference', motionPreference);
  }, [motionPreference]);

  useEffect(() => {
    function syncSharedPreferences(event) {
      const changedKey = event.type === 'storage' ? event.key : null;
      if (event.type === 'storage' && changedKey && ![...Object.values(SHARED_PREFERENCE_STORAGE_KEYS), SHARED_PREFERENCES_STORAGE_KEY].includes(changedKey)) return;

      const nextTheme = getSharedPreference('theme');
      const nextLanguage = getSharedPreference('language');
      const nextCurrency = getSharedPreference('currency');
      const nextDateFormat = getSharedPreference('dateFormat');
      const nextDensity = getSharedPreference('density');
      const nextPrivacyMode = getSharedPreference('privacyMode');
      const nextWeekStart = getSharedPreference('weekStart');
      const nextMotionPreference = getSharedPreference('motionPreference');
      if (nextTheme) setTheme(nextTheme);
      if (nextLanguage) setLanguage(nextLanguage);
      if (nextCurrency && isSupportedCurrency(nextCurrency)) setCurrency(nextCurrency);
      if (nextDateFormat) setDateFormat(nextDateFormat);
      if (nextDensity) setDensity(nextDensity);
      if (nextPrivacyMode !== null) setPrivacyMode(nextPrivacyMode);
      if (nextWeekStart) setWeekStart(nextWeekStart);
      if (nextMotionPreference) setMotionPreference(nextMotionPreference);
    }

    window.addEventListener('storage', syncSharedPreferences);
    window.addEventListener('expensenest:preferences-changed', syncSharedPreferences);
    return () => {
      window.removeEventListener('storage', syncSharedPreferences);
      window.removeEventListener('expensenest:preferences-changed', syncSharedPreferences);
    };
  }, []);

  useEffect(() => {
    if (notificationPermission !== 'granted' || dueReminders.length === 0) return;

    const today = localDateKey();
    const storedNotifications = readLocalJson(REMINDER_NOTIFICATIONS_KEY, []);
    const previouslyNotified = Array.isArray(storedNotifications) ? storedNotifications : [];
    const notifiedKeys = new Set(previouslyNotified);
    const newReminders = dueReminders.filter(({ rule }) => !notifiedKeys.has(`${today}:${rule.id}`));
    if (newReminders.length === 0) return;

    const messages = newReminders.slice(0, 3).map(({ rule, daysUntil }) => (
      daysUntil < 0
        ? `${rule.title} is overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? '' : 's'}`
        : daysUntil === 0
          ? `${rule.title} is due today`
          : `${rule.title} is due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`
    ));
    if (newReminders.length > messages.length) messages.push(`and ${newReminders.length - messages.length} more`);

    try {
      const notification = new window.Notification(
        translateForCurrentLanguage(newReminders.some(({ daysUntil }) => daysUntil < 0) ? 'Recurring payment overdue' : 'Upcoming recurring payment'),
        { body: translateForCurrentLanguage(messages.join(' · ')), tag: `expensenest-reminders-${today}-${newReminders.map(({ rule }) => rule.id).join('-').slice(0, 80)}` },
      );
      notification.onclick = () => {
        window.focus();
        document.getElementById('recurring')?.scrollIntoView({ behavior: shouldReduceMotion() ? 'auto' : 'smooth', block: 'start' });
        notification.close();
      };
      const nextNotified = [
        ...previouslyNotified.filter((value) => typeof value === 'string' && value.startsWith(`${today}:`)),
        ...newReminders.map(({ rule }) => `${today}:${rule.id}`),
      ].slice(-200);
      localStorage.setItem(REMINDER_NOTIFICATIONS_KEY, JSON.stringify(nextNotified));
    } catch (error) {
      console.error('Could not show recurring payment notification:', error);
      setNotificationStatus('Browser could not show the alert. The in-app reminder is still available.');
    }
  }, [dueReminders, notificationPermission]);

  function handleCurrencyChange(event) {
    const nextCurrency = event.target.value;
    if (!isSupportedCurrency(nextCurrency)) return;
    setCurrency(nextCurrency);
    trackActivity('settings_updated');
  }

  async function enablePaymentNotifications() {
    if (notificationPermission === 'unsupported') {
      setNotificationStatus('This browser does not support desktop alerts. In-app reminders are still available.');
      return;
    }
    if (notificationPermission === 'denied') {
      setNotificationStatus('Browser alerts are blocked. Allow notifications for ExpenseNest in your browser site settings.');
      return;
    }

    try {
      const permission = await window.Notification.requestPermission();
      setNotificationPermission(permission);
      setNotificationStatus(permission === 'granted'
        ? 'Alerts are enabled. ExpenseNest will remind you while it is open.'
        : 'Alerts were not enabled. You can still see reminders inside ExpenseNest.');
    } catch (error) {
      console.error('Could not request notification permission:', error);
      setNotificationStatus('Could not enable browser alerts. You can still see reminders inside ExpenseNest.');
    }
  }

  useEffect(() => {
    setCategoryFilter('');
    setHoveredCategory('');
    if (!editingId) setForm((current) => ({ ...current, date: defaultDateForMonth(selectedMonth) }));
  }, [selectedMonth, editingId]);

  function save(nextTransactions) {
    setTransactions(nextTransactions);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTransactions));
  }

  function saveAccounts(nextAccounts) {
    setAccounts(nextAccounts);
    localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(nextAccounts));
  }

  function createAccount(event) {
    event.preventDefault();
    const name = accountForm.name.trim();
    const openingBalance = Number(accountForm.openingBalance || 0);
    if (!name || name.length > 24 || !Number.isFinite(openingBalance)) {
      setAccountStatus('Enter an account name (up to 24 characters) and a valid starting balance.');
      return;
    }
    if (accounts.some((account) => account.name.toLowerCase() === name.toLowerCase())) {
      setAccountStatus('An account with that name already exists.');
      return;
    }
    const account = { id: `account-${crypto.randomUUID()}`, name, openingBalance };
    saveAccounts([...accounts, account]);
    trackActivity('account_added');
    setAccountOpeningDrafts((current) => ({ ...current, [account.id]: String(openingBalance) }));
    setAccountForm({ name: '', openingBalance: '' });
    setAccountStatus(`${name} account added.`);
  }

  function saveAccountOpeningBalance(event, accountId) {
    event.preventDefault();
    const openingBalance = Number(accountOpeningDrafts[accountId]);
    if (!Number.isFinite(openingBalance)) {
      setAccountStatus('Enter a valid starting balance.');
      return;
    }
    const nextAccounts = accounts.map((account) => account.id === accountId ? { ...account, openingBalance } : account);
    saveAccounts(nextAccounts);
    trackActivity('account_updated');
    setAccountStatus(`${accountName(accountId)} starting balance saved.`);
  }

  function deleteAccount(accountId) {
    if (defaultAccounts.some((account) => account.id === accountId)) return;
    if (transactions.some((item) => item.accountId === accountId || item.fromAccountId === accountId || item.toAccountId === accountId)
      || recurringRules.some((rule) => rule.accountId === accountId)) {
      setAccountStatus('This account is in use. Reassign its transactions and recurring schedules before removing it.');
      return;
    }
    const nextAccounts = accounts.filter((account) => account.id !== accountId);
    saveAccounts(nextAccounts);
    trackActivity('account_deleted');
    setAccountOpeningDrafts((current) => {
      const nextDrafts = { ...current };
      delete nextDrafts[accountId];
      return nextDrafts;
    });
    setForm((current) => current.accountId === accountId || current.fromAccountId === accountId || current.toAccountId === accountId
      ? { ...current, accountId: 'cash', fromAccountId: 'cash', toAccountId: 'bank' }
      : current);
    setAccountStatus('Account removed.');
  }

  function assignUnassignedTransactions(event) {
    event.preventDefault();
    if (!knownAccountIds.has(legacyAssignmentDraft) || !unassignedTransactions.length) return;
    const legacyTransactionIds = new Set(unassignedTransactions.map((item) => item.id));
    save(transactions.map((item) => {
      if (!legacyTransactionIds.has(item.id)) return item;
      if (item.type === 'transfer') {
        const fromAccountId = knownAccountIds.has(item.fromAccountId) ? item.fromAccountId : legacyAssignmentDraft;
        const toAccountId = knownAccountIds.has(item.toAccountId)
          ? item.toAccountId
          : accounts.find((account) => account.id !== fromAccountId)?.id ?? '';
        return { ...item, fromAccountId, toAccountId };
      }
      return { ...item, accountId: legacyAssignmentDraft };
    }));
    trackActivity('legacy_entries_assigned');
    const legacyRecurringRuleIds = new Set(unassignedTransactions.map((item) => item.recurringRuleId).filter(Boolean));
    if (legacyRecurringRuleIds.size) {
      saveRecurringRules(recurringRules.map((rule) => (
        legacyRecurringRuleIds.has(rule.id) && !rule.accountId ? { ...rule, accountId: legacyAssignmentDraft } : rule
      )));
    }
    setAccountStatus(`${legacyTransactionIds.size} older entries assigned to ${accountName(legacyAssignmentDraft)}.`);
  }

  function handleChange(event) {
    const { name, value } = event.target;
    if (name === 'type') {
      if (value === 'transfer') {
        setRepeatMonthly(false);
        setForm((current) => {
          const fromAccountId = accounts.some((account) => account.id === current.accountId) ? current.accountId : 'cash';
          const toAccountId = accounts.find((account) => account.id !== fromAccountId)?.id ?? '';
          return { ...current, type: value, category: 'Other', fromAccountId, toAccountId };
        });
      } else {
        setForm((current) => ({ ...current, type: value }));
      }
      return;
    }
    if (name === 'fromAccountId') {
      setForm((current) => ({
        ...current,
        fromAccountId: value,
        ...(current.toAccountId === value ? { toAccountId: accounts.find((account) => account.id !== value)?.id ?? '' } : {}),
      }));
      return;
    }
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.title.trim() || !Number.isFinite(amount) || amount <= 0) return;
    const isTransfer = form.type === 'transfer';
    if (isTransfer && (!knownAccountIds.has(form.fromAccountId) || !knownAccountIds.has(form.toAccountId) || form.fromAccountId === form.toAccountId)) {
      setMessage('Choose two different accounts for the transfer.');
      return;
    }
    if (!isTransfer && !knownAccountIds.has(form.accountId)) return;

    const existingTransaction = editingId ? transactions.find((item) => item.id === editingId) : null;
    const recurringRule = !editingId && !isTransfer && repeatMonthly ? {
      id: crypto.randomUUID(),
      title: form.title.trim(),
      amount,
      type: form.type,
      category: form.category,
      accountId: form.accountId,
      dayOfMonth: Number(form.date.slice(-2)),
      startMonth: form.date.slice(0, 7),
      active: true,
    } : null;
    const transaction = {
      ...existingTransaction,
      id: existingTransaction?.id ?? crypto.randomUUID(),
      title: form.title.trim(),
      amount,
      type: form.type,
      category: isTransfer ? 'Other' : form.category,
      accountId: isTransfer ? undefined : form.accountId,
      fromAccountId: isTransfer ? form.fromAccountId : undefined,
      toAccountId: isTransfer ? form.toAccountId : undefined,
      date: form.date,
      recurringRuleId: isTransfer ? undefined : recurringRule?.id ?? existingTransaction?.recurringRuleId,
    };
    const nextTransactions = editingId
      ? transactions.map((item) => item.id === editingId ? transaction : item)
      : [...transactions, transaction];
    save(nextTransactions);
    trackActivity(editingId ? 'transaction_updated' : 'transaction_added');
    if (recurringRule) saveRecurringRules([...recurringRules, recurringRule]);
    if (recurringRule) trackActivity('recurring_schedule_created');
    setForm({ title: '', amount: '', type: 'expense', category: 'Food', accountId: 'cash', fromAccountId: 'cash', toAccountId: 'bank', date: defaultDateForMonth(selectedMonth) });
    setRepeatMonthly(false);
    setEditingId(null);
    setMessage(editingId ? 'Transaction updated successfully' : isTransfer ? 'Transfer recorded successfully' : recurringRule ? 'Transaction added with a monthly schedule' : 'Transaction added successfully');
    window.setTimeout(() => setMessage(''), 2500);
  }

  function removeTransaction(id) {
    save(transactions.filter((item) => item.id !== id));
    trackActivity('transaction_deleted');
  }

  function editTransaction(transaction) {
    setForm({
      title: transaction.title,
      amount: String(transaction.amount),
      type: transaction.type,
      category: transaction.category,
      accountId: transaction.accountId ?? '',
      fromAccountId: transaction.fromAccountId ?? 'cash',
      toAccountId: transaction.toAccountId ?? 'bank',
      date: transactionDateKey(transaction.date),
    });
    setRepeatMonthly(false);
    setEditingId(transaction.id);
    document.querySelector('.add-panel')?.scrollIntoView({ behavior: shouldReduceMotion() ? 'auto' : 'smooth', block: 'center' });
  }

  function cancelEdit() {
    setEditingId(null);
    setRepeatMonthly(false);
    setForm({ title: '', amount: '', type: 'expense', category: 'Food', accountId: 'cash', fromAccountId: 'cash', toAccountId: 'bank', date: defaultDateForMonth(selectedMonth) });
  }

  function saveRecurringRules(nextRules) {
    setRecurringRules(nextRules);
    localStorage.setItem(RECURRING_KEY, JSON.stringify(nextRules));
  }

  function markRecurringPaid(rule) {
    const alreadyAdded = monthTransactions.some((item) => item.recurringRuleId === rule.id);
    if (alreadyAdded) return;
    save([...transactions, {
      id: crypto.randomUUID(),
      title: rule.title,
      amount: Number(rule.amount),
      type: rule.type,
      category: rule.category,
      accountId: rule.accountId ?? 'cash',
      date: recurringDate(rule, selectedMonth),
      recurringRuleId: rule.id,
    }]);
    trackActivity('recurring_payment_recorded');
  }

  function toggleRecurringRule(ruleId) {
    saveRecurringRules(recurringRules.map((rule) => rule.id === ruleId ? { ...rule, active: !rule.active } : rule));
    trackActivity('recurring_schedule_updated');
  }

  function deleteRecurringRule(ruleId) {
    saveRecurringRules(recurringRules.filter((rule) => rule.id !== ruleId));
    trackActivity('recurring_schedule_deleted');
  }

  function persistGoals(nextGoals) {
    setGoals(nextGoals);
    localStorage.setItem(GOALS_KEY, JSON.stringify(nextGoals));
  }

  function createGoal(event) {
    event.preventDefault();
    const targetAmount = Number(goalForm.targetAmount);
    const savedAmount = Number(goalForm.savedAmount || 0);
    if (!goalForm.title.trim() || !Number.isFinite(targetAmount) || targetAmount <= 0 || !Number.isFinite(savedAmount) || savedAmount < 0) return;
    persistGoals([...goals, {
      id: crypto.randomUUID(),
      title: goalForm.title.trim(),
      targetAmount,
      savedAmount,
      deadline: goalForm.deadline,
      createdAt: localDateKey(),
    }]);
    trackActivity('savings_goal_created');
    setGoalForm({ title: '', targetAmount: '', savedAmount: '', deadline: '' });
    setGoalFormOpen(false);
  }

  function addGoalContribution(event, goal) {
    event.preventDefault();
    const contribution = Number(goalContributionDrafts[goal.id]);
    const remaining = Math.max(0, Number(goal.targetAmount) - Number(goal.savedAmount));
    if (!Number.isFinite(contribution) || contribution <= 0 || contribution > remaining) return;
    persistGoals(goals.map((item) => item.id === goal.id ? { ...item, savedAmount: Number(item.savedAmount) + contribution } : item));
    trackActivity('savings_goal_contribution');
    setGoalContributionDrafts((current) => ({ ...current, [goal.id]: '' }));
  }

  function deleteGoal(goalId) {
    if (!window.confirm('Delete this savings goal? Its saved progress will be removed.')) return;
    persistGoals(goals.filter((goal) => goal.id !== goalId));
    trackActivity('savings_goal_deleted');
  }

  function saveBudget(event) {
    event.preventDefault();
    const nextBudget = Number(budgetDraft);
    if (!Number.isFinite(nextBudget) || nextBudget < 0) return;
    const nextBudgets = { ...monthlyBudgets, [selectedMonth]: nextBudget };
    setMonthlyBudgets(nextBudgets);
    localStorage.setItem(BUDGETS_KEY, JSON.stringify(nextBudgets));
    localStorage.setItem(BUDGET_KEY, String(nextBudget));
    trackActivity('monthly_budget_updated');
    setMessage('Monthly budget saved');
    window.setTimeout(() => setMessage(''), 2500);
  }

  function saveCategoryBudget(event, category) {
    event.preventDefault();
    const draft = String(categoryBudgetDrafts[category] ?? '').trim();
    const nextForMonth = { ...(categoryBudgets[selectedMonth] ?? {}) };
    if (draft === '') {
      delete nextForMonth[category];
    } else {
      const amount = Number(draft);
      if (!Number.isFinite(amount) || amount < 0) return;
      nextForMonth[category] = amount;
    }
    const nextBudgets = { ...categoryBudgets, [selectedMonth]: nextForMonth };
    setCategoryBudgets(nextBudgets);
    localStorage.setItem(CATEGORY_BUDGETS_KEY, JSON.stringify(nextBudgets));
    trackActivity('category_limit_updated');
    setCategoryBudgetNotice(`${category} limit ${draft ? 'saved' : 'cleared'}`);
    window.setTimeout(() => setCategoryBudgetNotice(''), 2200);
  }

  function exportCsv() {
    const rows = [
      ['Date', 'Description', 'Type', 'Category', `Amount (${currency})`, 'Account', 'From account', 'To account'],
      ...visibleTransactions.map((item) => [
        transactionDateKey(item.date), item.title, item.type, item.type === 'transfer' ? 'Transfer' : item.category, Number(item.amount),
        item.type === 'transfer' ? '' : accountName(item.accountId),
        item.type === 'transfer' ? accountName(item.fromAccountId) : '',
        item.type === 'transfer' ? accountName(item.toAccountId) : '',
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ExpenseNest_Transactions_${localDateKey()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    trackActivity('csv_exported');
  }

  function downloadFullBackup() {
    const backup = {
      app: 'ExpenseNest',
      version: 1,
      exportedAt: new Date().toISOString(),
      data: {
        selectedMonth,
        categories: customCategories,
        accounts,
        transactions,
        monthlyBudget: localStorage.getItem(BUDGET_KEY) ?? '',
        monthlyBudgets,
        categoryBudgets,
        recurringRules,
        goals,
        theme,
        language,
        currency,
        dateFormat,
        density,
        privacyMode,
        weekStart,
        motionPreference,
      },
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ExpenseNest_backup_${localDateKey()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    trackActivity('backup_exported');
  }

  function printFullBackup() {
    const clearPrintMode = () => document.body.classList.remove('print-full-backup');
    document.body.classList.add('print-full-backup');
    window.addEventListener('afterprint', clearPrintMode, { once: true });
    trackActivity('backup_exported');
    window.setTimeout(() => window.print(), 50);
  }

  async function handleBackupFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setBackupPreview(null);
    setBackupStatus('');
    if (file.size > 5_000_000) {
      setBackupStatus('Please choose a backup smaller than 5 MB.');
      return;
    }
    try {
      const backup = parseFullBackup(await file.text());
      const data = backup.data;
      setBackupPreview({
        backup,
        fileName: file.name,
        transactionCount: data.transactions.length,
        accountCount: data.accounts?.length ?? defaultAccounts.length,
        goalCount: data.goals.length,
        scheduleCount: data.recurringRules.length,
        categoryCount: data.categories?.length ?? 0,
      });
    } catch (error) {
      setBackupStatus(error instanceof Error ? error.message : 'Could not read this backup file.');
    }
  }

  function restoreFullBackup() {
    if (!backupPreview) return;
    const data = backupPreview.backup.data;
    const nextMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(data.selectedMonth) ? data.selectedMonth : currentMonthKey();
    const nextTheme = data.theme === 'light' ? 'light' : 'dark';
    const nextLanguage = data.language === 'gu' ? 'gu' : 'en';
    const nextCurrency = isSupportedCurrency(data.currency) ? data.currency : DEFAULT_CURRENCY;
    const nextDateFormat = DATE_FORMAT_OPTIONS.some(({ value }) => value === data.dateFormat)
      ? data.dateFormat
      : DEFAULT_SHARED_PREFERENCES.dateFormat;
    const nextDensity = ['comfortable', 'compact'].includes(data.density)
      ? data.density
      : DEFAULT_SHARED_PREFERENCES.density;
    const nextPrivacyMode = typeof data.privacyMode === 'boolean' ? data.privacyMode : DEFAULT_SHARED_PREFERENCES.privacyMode;
    const nextWeekStart = ['sunday', 'monday', 'saturday'].includes(data.weekStart) ? data.weekStart : DEFAULT_SHARED_PREFERENCES.weekStart;
    const nextMotionPreference = ['system', 'reduced'].includes(data.motionPreference) ? data.motionPreference : DEFAULT_SHARED_PREFERENCES.motionPreference;
    const nextCustomCategories = Array.isArray(data.categories) ? data.categories : [];
    const nextAccounts = Array.isArray(data.accounts) ? data.accounts : defaultAccounts;
    const storageValues = new Map([
      [CUSTOM_CATEGORIES_KEY, JSON.stringify(nextCustomCategories)],
      [ACCOUNTS_KEY, JSON.stringify(nextAccounts)],
      [STORAGE_KEY, JSON.stringify(data.transactions)],
      [BUDGETS_KEY, JSON.stringify(data.monthlyBudgets)],
      [CATEGORY_BUDGETS_KEY, JSON.stringify(data.categoryBudgets)],
      [RECURRING_KEY, JSON.stringify(data.recurringRules)],
      [GOALS_KEY, JSON.stringify(data.goals)],
      [BUDGET_KEY, data.monthlyBudget ? String(data.monthlyBudget) : null],
      ['expenseNestTheme', nextTheme],
      [SHARED_PREFERENCE_STORAGE_KEYS.language, nextLanguage],
      [CURRENCY_KEY, nextCurrency],
      [SHARED_PREFERENCE_STORAGE_KEYS.dateFormat, nextDateFormat],
      [SHARED_PREFERENCE_STORAGE_KEYS.density, nextDensity],
      [SHARED_PREFERENCE_STORAGE_KEYS.privacyMode, String(nextPrivacyMode)],
      [SHARED_PREFERENCE_STORAGE_KEYS.weekStart, nextWeekStart],
      [SHARED_PREFERENCE_STORAGE_KEYS.motionPreference, nextMotionPreference],
      [SHARED_PREFERENCES_STORAGE_KEY, null],
    ]);
    const previousValues = new Map([...storageValues.keys()].map((key) => [key, localStorage.getItem(key)]));
    try {
      storageValues.forEach((value, key) => {
        if (value === null) localStorage.removeItem(key);
        else localStorage.setItem(key, value);
      });
      writeSharedPreferences({
        theme: nextTheme,
        language: nextLanguage,
        currency: nextCurrency,
        dateFormat: nextDateFormat,
        density: nextDensity,
        privacyMode: nextPrivacyMode,
        weekStart: nextWeekStart,
        motionPreference: nextMotionPreference,
      });
    } catch {
      let rollbackSucceeded = true;
      storageValues.forEach((_, key) => {
        try {
          localStorage.removeItem(key);
        } catch {
          rollbackSucceeded = false;
        }
      });
      previousValues.forEach((value, key) => {
        if (value === null) return;
        try { localStorage.setItem(key, value); } catch { rollbackSucceeded = false; }
      });
      setBackupStatus(rollbackSucceeded
        ? 'Could not restore this backup because browser storage may be full. Your current data was kept.'
        : 'Could not restore this backup. Reload the app to check which data is currently saved.');
      return;
    }
    setCustomCategories(nextCustomCategories);
    setAccounts(nextAccounts);
    setAccountOpeningDrafts(Object.fromEntries(nextAccounts.map((account) => [account.id, String(account.openingBalance)])));
    setTransactions(data.transactions);
    setMonthlyBudgets(data.monthlyBudgets);
    setCategoryBudgets(data.categoryBudgets);
    setRecurringRules(data.recurringRules);
    setGoals(data.goals);
    setSelectedMonth(nextMonth);
    setForm({ title: '', amount: '', type: 'expense', category: 'Food', accountId: 'cash', fromAccountId: 'cash', toAccountId: 'bank', date: defaultDateForMonth(nextMonth) });
    setEditingId(null);
    setRepeatMonthly(false);
    setTheme(nextTheme);
    setLanguage(nextLanguage);
    setCurrency(nextCurrency);
    setDateFormat(nextDateFormat);
    setDensity(nextDensity);
    setPrivacyMode(nextPrivacyMode);
    setWeekStart(nextWeekStart);
    setMotionPreference(nextMotionPreference);
    setCategoryBudgetDrafts(data.categoryBudgets[nextMonth] ?? {});
    setGoalContributionDrafts({});
    setBackupPreview(null);
    setBackupStatus('Backup restored. The data in this browser was replaced.');
    trackActivity('backup_restored');
  }

  async function handleCsvFile(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setImportPreview(null);
    setImportStatus('');
    if (file.size > 2_000_000) {
      setImportStatus('Please choose a CSV smaller than 2 MB.');
      return;
    }
    try {
      const parsed = parseTransactionCsv(await file.text(), transactions, categories, accounts);
      setImportPreview({ ...parsed, fileName: file.name });
    } catch (error) {
      setImportStatus(error instanceof Error ? error.message : 'Could not read this CSV file.');
    }
  }

  function confirmCsvImport() {
    if (!importPreview?.transactions.length) return;
    const known = new Set(transactions.map(transactionFingerprint));
    const freshTransactions = importPreview.transactions.filter((transaction) => {
      const fingerprint = transactionFingerprint(transaction);
      if (known.has(fingerprint)) return false;
      known.add(fingerprint);
      return true;
    });
    if (!freshTransactions.length) {
      setImportStatus('Those transactions are already in your list.');
      setImportPreview(null);
      return;
    }
    const latestTransaction = freshTransactions.reduce((latest, transaction) => (
      transactionDateKey(transaction.date) > transactionDateKey(latest.date) ? transaction : latest
    ));
    save([...transactions, ...freshTransactions]);
    setSelectedMonth(transactionDateKey(latestTransaction.date).slice(0, 7));
    setFilter('all');
    setCategoryFilter('');
    setQuery('');
    setImportStatus(`Imported ${freshTransactions.length} transaction${freshTransactions.length === 1 ? '' : 's'}${importPreview.duplicates ? `; skipped ${importPreview.duplicates} duplicate${importPreview.duplicates === 1 ? '' : 's'}` : ''}${importPreview.invalid ? `; skipped ${importPreview.invalid} invalid row${importPreview.invalid === 1 ? '' : 's'}` : ''}.`);
    setImportPreview(null);
    trackActivity('csv_imported');
  }

  function toggleCategory(category) {
    setCategoryFilter((current) => current === category ? '' : category);
  }

  function addCustomCategory(event) {
    event.preventDefault();
    const category = newCategory.trim();
    if (!category || category.length > 24) {
      setCustomCategoryStatus('Category names must be between 1 and 24 characters.');
      return;
    }
    if (categories.some((item) => item.toLowerCase() === category.toLowerCase())) {
      setCustomCategoryStatus('That category already exists.');
      return;
    }
    if (customCategories.length >= 20) {
      setCustomCategoryStatus('You can add up to 20 custom categories.');
      return;
    }
    const nextCategories = [...customCategories, category];
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(nextCategories));
    setCustomCategories(nextCategories);
    setForm((current) => ({ ...current, category }));
    setNewCategory('');
    setCustomCategoryStatus(`${category} added and ready to use.`);
    trackActivity('category_created');
  }

  function removeCustomCategory(category) {
    const isUsed = transactions.some((item) => item.category === category)
      || recurringRules.some((rule) => rule.category === category)
      || Object.values(categoryBudgets).some((limits) => isRecord(limits) && Object.hasOwn(limits, category));
    if (isUsed) {
      setCustomCategoryStatus(`${category} is in use. Update its transactions, schedules and limits before removing it.`);
      return;
    }
    const nextCategories = customCategories.filter((item) => item !== category);
    localStorage.setItem(CUSTOM_CATEGORIES_KEY, JSON.stringify(nextCategories));
    setCustomCategories(nextCategories);
    setCategoryFilter((current) => current === category ? '' : current);
    setForm((current) => current.category === category ? { ...current, category: defaultCategories[0] } : current);
    setCategoryBudgetDrafts((current) => {
      const nextDrafts = { ...current };
      delete nextDrafts[category];
      return nextDrafts;
    });
    setCustomCategoryStatus(`${category} removed.`);
    trackActivity('category_deleted');
  }

  function clearTransactionFilters() {
    setQuery('');
    setFilter('all');
    setCategoryFilter('');
    setDateFrom('');
    setDateTo('');
    setMinimumAmount('');
    setMaximumAmount('');
    setSortOrder('newest');
  }

  return <>
    <header className="header">
      <div className="header-content">
        <a className="brand" href="#top" aria-label="ExpenseNest home">
          <span className="brand-mark"><BrandAsset /></span>
          <span>ExpenseNest</span>
        </a>
        <div className="header-actions">
          <div className="header-note"><ShieldCheck size={15} aria-hidden="true" /><span>Saved privately on this device</span></div>
          <a className="header-settings" href="#settings" onClick={() => setActiveSection('settings')} aria-label="Open settings" title="Settings">
            <Settings2 size={16} aria-hidden="true" />
            <span>Settings</span>
          </a>
          <button className="theme-toggle" type="button" onClick={() => setUserTheme((current) => current === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
            {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>
        </div>
      </div>
    </header>

    <nav className="section-nav" aria-label="Jump to a dashboard section">
      <div className="section-nav-inner">
        <div className="section-nav-caption">
          <span className="section-nav-current-icon"><ActiveSectionIcon size={15} aria-hidden="true" /></span>
          <span className="section-nav-current-copy"><small>YOU ARE IN</small><strong>{activeNavItem.label}</strong></span>
        </div>
        <div className="section-nav-links" ref={sectionNavRef}>
          {sectionNavigation.filter(({ id }) => id !== 'settings').map(({ id, label, icon: SectionIcon }) => <a
            href={`#${id}`}
            className={activeSection === id ? 'active' : ''}
            aria-current={activeSection === id ? 'location' : undefined}
            onClick={() => setActiveSection(id)}
            key={id}
          ><SectionIcon size={13} strokeWidth={2.1} aria-hidden="true" /><span>{label}</span>{id === 'feedback' && feedbackUnreadCount > 0 && <small className="section-nav-unread" aria-label={`${feedbackUnreadCount} unread replies`}>{feedbackUnreadCount > 99 ? '99+' : feedbackUnreadCount}</small>}</a>)}
        </div>
      </div>
      <div className="section-nav-progress" aria-hidden="true"><span ref={sectionProgressRef} /></div>
    </nav>

    <main className="container" id="top">
      <section className="welcome" id="overview">
        <div className="welcome-copy">
          <p className="eyebrow">PERSONAL FINANCE</p>
          <h1>Money, under control.</h1>
          <p>Track every rupee and make smarter everyday decisions.</p>
        </div>
        <label className="month-picker">
          <span className="month-label"><CalendarDays size={13} aria-hidden="true" /> VIEWING MONTH</span>
          <input type="month" value={selectedMonth} onChange={(event) => { if (event.target.value) setSelectedMonth(event.target.value); }} aria-label="Choose month to view" />
        </label>
      </section>

      <section className="summary" aria-label="Financial summary">
        <SummaryCard kind="balance" label="Net this month" value={formatCurrency(totals.balance)} caption={totals.balance >= 0 ? 'Looking healthy' : 'Expenses are above income'} />
        <SummaryCard kind="income" label="Income this month" value={formatCurrency(totals.income)} caption={`${monthTransactions.filter((item) => item.type === 'income').length} income entries`} />
        <SummaryCard kind="expense" label="Expenses this month" value={formatCurrency(totals.expense)} caption={`${monthTransactions.filter((item) => item.type === 'expense').length} expense entries`} />
      </section>

      <section className="panel accounts-panel" id="accounts" aria-labelledby="accounts-title">
        <div className="accounts-heading">
          <div>
            <p className="eyebrow"><WalletCards size={13} aria-hidden="true" /> YOUR WALLETS</p>
            <h2 id="accounts-title">Accounts &amp; balances</h2>
            <p>Set each starting balance before your earliest saved entry. Account balances include recorded activity through today.</p>
          </div>
          <div className="accounts-total"><span>Total across accounts</span><strong>{formatCurrency(totalAccountBalance)}</strong></div>
        </div>
        <div className="account-grid">
          {accountStats.map((account) => <article className={`account-card ${account.balance < 0 ? 'negative' : ''}`} key={account.id}>
            <div className="account-card-heading">
              <span className={`account-card-icon ${defaultAccounts.some((item) => item.id === account.id) ? account.id : 'custom'}`}>{account.id === 'cash' ? '₹' : account.name.slice(0, 1).toUpperCase()}</span>
              <div><strong data-gujarati-preserve>{account.name}</strong><small>{account.transactionCount} entries</small></div>
              {!defaultAccounts.some((item) => item.id === account.id) && <button className="account-delete" type="button" onClick={() => deleteAccount(account.id)} aria-label="Remove account" title="Remove account"><Trash2 size={13} aria-hidden="true" /></button>}
            </div>
            <div className="account-balance"><span>Balance now</span><strong>{formatCurrency(account.balance)}</strong></div>
            <div className="account-month-spend"><span>{selectedMonthLabel} spending</span><strong>{formatCurrency(account.monthExpenses)}</strong></div>
            <form className="account-opening-form" onSubmit={(event) => saveAccountOpeningBalance(event, account.id)}>
              <label htmlFor={`account-opening-${account.id}`}>Starting balance</label>
              <div><input id={`account-opening-${account.id}`} type="number" step="0.01" value={accountOpeningDrafts[account.id] ?? String(account.openingBalance)} onChange={(event) => setAccountOpeningDrafts((current) => ({ ...current, [account.id]: event.target.value }))} aria-label="Starting balance" /><button type="submit">Save</button></div>
            </form>
          </article>)}
          {unassignedTransactions.length > 0 && <article className={`account-card unassigned-account ${unassignedBalance < 0 ? 'negative' : ''}`}>
            <div className="account-card-heading"><span className="account-card-icon unassigned">?</span><div><strong>Unassigned entries</strong><small>{unassignedTransactions.length} older entries</small></div></div>
            <div className="account-balance"><span>Recorded net</span><strong>{formatCurrency(unassignedBalance)}</strong></div>
            <form className="account-legacy-form" onSubmit={assignUnassignedTransactions}>
              <label>Assign these entries to<select value={legacyAssignmentDraft} onChange={(event) => setLegacyAssignmentDraft(event.target.value)}>{accounts.map((account) => <option value={account.id} key={account.id} data-gujarati-preserve>{account.name}</option>)}</select></label>
              <button type="submit">Assign all older entries</button>
            </form>
          </article>}
          <article className="account-create-card">
            <div className="account-create-heading"><span><Plus size={16} aria-hidden="true" /></span><div><strong>Add another account</strong><small>For another bank, card or wallet</small></div></div>
            <form className="account-create-form" onSubmit={createAccount}>
              <label>Account name<input value={accountForm.name} onChange={(event) => setAccountForm((current) => ({ ...current, name: event.target.value }))} maxLength={24} placeholder="e.g. Savings account" required /></label>
              <label>Starting balance<input value={accountForm.openingBalance} onChange={(event) => setAccountForm((current) => ({ ...current, openingBalance: event.target.value }))} type="number" step="0.01" placeholder="0.00" /></label>
              <button type="submit"><Plus size={14} aria-hidden="true" /> Add account</button>
            </form>
          </article>
        </div>
        {accountStatus && <p className="account-status" role="status">{accountStatus}</p>}
        {unassignedTransactions.length > 0 && <p className="accounts-footnote">Older entries are kept separate until you assign them here or edit each transaction. Their recorded net is included in the total above.</p>}
      </section>

      <section id="budget" className={`budget-banner ${budget && budgetRemaining < 0 ? 'over-budget' : ''}`}>
        <div className="budget-copy">
          <span className="budget-icon"><PiggyBank size={21} aria-hidden="true" /></span>
          <div><p className="eyebrow">{selectedMonthLabel.toUpperCase()} BUDGET</p><h2>{budget ? formatCurrency(budgetRemaining) : 'Set your spending goal'} <small>{budget ? (budgetRemaining >= 0 ? 'remaining' : 'over budget') : ''}</small></h2></div>
        </div>
        <div className="budget-progress">
          <div><span>Spent {formatCurrency(totals.expense)}</span><strong>{budget ? `${budgetUsed}% used` : 'No budget set'}</strong></div>
          <div className="progress-track"><span style={{ width: `${budgetUsed}%` }} /></div>
        </div>
        <form className="budget-form" onSubmit={saveBudget}>
          <label>Monthly limit<input type="number" min="0" step="500" value={budgetDraft} onChange={(event) => setBudgetDraft(event.target.value)} placeholder="e.g. 25000" /></label>
          <button type="submit">Save budget</button>
        </form>
        {isForecastMonth && <div className={`budget-forecast ${forecastStatus}`}>
          <span className="budget-forecast-icon"><TrendingUp size={17} aria-hidden="true" /></span>
          <div className="budget-forecast-copy">
            <p className="eyebrow">MONTH-END SPENDING ESTIMATE</p>
            <strong>{hasForecastData ? formatCurrency(projectedMonthExpense) : 'Waiting for expenses'}</strong>
            <small>{hasForecastData
              ? `${formatCurrency(forecastExpenseToDate)} recorded over ${forecastDaysElapsed} days · estimated from your average daily spend`
              : 'Add expenses dated this month to see an estimate.'}</small>
          </div>
          <span className="budget-forecast-status">{!hasForecastData
            ? 'No data yet'
            : !budget
              ? 'Set a budget to compare'
              : projectedMonthExpense > budget
                ? `May exceed by ${formatCurrency(projectedMonthExpense - budget)}`
                : projectedMonthExpense >= budget * 0.8
                  ? 'Near your budget limit'
                  : 'On track with budget'}</span>
        </div>}
      </section>

      <section className="panel cashflow-panel" id="cash-flow" aria-labelledby="cashflow-title">
        <div className="cashflow-heading">
          <div>
            <p className="eyebrow"><TrendingUp size={13} aria-hidden="true" /> CASH-FLOW FORECAST</p>
            <h2 id="cashflow-title">Estimated account balance at month end</h2>
            <p>{isForecastMonth
              ? 'Recorded income and spending, planned entries, and active recurring schedules.'
              : 'Choose the current month to see its remaining cash-flow estimate.'}</p>
          </div>
          {hasCashflowData && <div className={`cashflow-result ${projectedAccountBalance >= 0 ? 'positive' : 'negative'}`}>
            <span>ESTIMATED TOTAL ACCOUNT BALANCE</span>
            <strong>{formatCurrency(projectedAccountBalance)}</strong>
            <small>{projectedAccountBalance >= 0 ? 'Estimated accounts stay above zero' : 'Estimated total may fall below zero'}</small>
          </div>}
        </div>
        {!isForecastMonth ? <div className="cashflow-empty">
          <CalendarDays size={18} aria-hidden="true" />
          <span>Use the month picker above to return to {new Date(`${todayKey.slice(0, 7)}-01T00:00:00`).toLocaleDateString(getAppLocale(), { month: 'long', year: 'numeric' })} for a live forecast.</span>
        </div> : !hasCashflowData ? <div className="cashflow-empty">
          <WalletCards size={18} aria-hidden="true" />
          <span>Add this month’s income or expenses, or set up a recurring schedule, to start your cash-flow forecast.</span>
        </div> : <>
          <div className="cashflow-metrics">
            <article className="cashflow-metric">
              <span>Recorded net so far</span>
              <strong>{formatCurrency(recordedCashflowNet)}</strong>
              <small>This month’s income minus spending through today</small>
            </article>
            <article className="cashflow-metric income">
              <span>Expected income</span>
              <strong>{formatCurrency(expectedIncome)}</strong>
              <small>Planned entries and unpaid recurring income</small>
            </article>
            <article className="cashflow-metric expense">
              <span>Estimated expenses remaining</span>
              <strong>{formatCurrency(expectedExpenses)}</strong>
              <small>Planned bills plus estimated daily spending</small>
            </article>
          </div>
          <div className="cashflow-schedule">
            <div className="cashflow-schedule-heading"><strong>Upcoming cash flow</strong><small>Scheduled and future-dated entries</small></div>
            {cashflowEvents.length ? <div className="cashflow-event-list">{cashflowEvents.map((event) => {
              const daysUntil = daysBetween(event.date, todayKey);
              const dateLabel = daysUntil < 0 ? `Overdue ${Math.abs(daysUntil)}d` : daysUntil === 0 ? 'Due today' : displayDate(event.date);
              return <div className={`cashflow-event ${event.type}`} key={event.id}>
                <span className="cashflow-event-icon">{event.type === 'income' ? <ArrowDownRight size={15} aria-hidden="true" /> : <ArrowUpRight size={15} aria-hidden="true" />}</span>
                <span className="cashflow-event-copy"><strong>{event.title}</strong><small>{event.recurring ? 'Recurring' : 'Planned'} · {dateLabel}</small></span>
                <strong className="cashflow-event-amount">{event.type === 'income' ? '+' : '−'}{formatCurrency(event.amount)}</strong>
              </div>;
            })}</div> : <p className="cashflow-no-events">No planned items are due. The estimate uses your recorded day-to-day spending pace.</p>}
          </div>
          <p className="cashflow-footnote">Uses saved starting balances, recorded activity and known scheduled items; day-to-day spending is estimated from this month’s average so far. ExpenseNest does not sync with your bank.</p>
        </>}
      </section>

      <MonthlyReport
        monthLabel={selectedMonthLabel}
        previousMonthLabel={previousMonthLabel}
        totals={totals}
        previousTotals={previousMonthTotals}
        savingsRate={totals.income ? ((totals.income - totals.expense) / totals.income) * 100 : null}
        previousSavingsRate={previousSavingsRate}
        topCategory={categoryTotals[0] ?? null}
        budget={budget}
        budgetRemaining={budgetRemaining}
      />

      <section className="panel goals-panel" id="savings-goals">
        <div className="goals-heading">
          <div><p className="eyebrow"><Target size={13} aria-hidden="true" /> SAVE TOWARD SOMETHING</p><h2>Savings goals</h2><p>Build progress one contribution at a time.</p></div>
          {goals.length > 0 && <div className="goal-total"><span>Total saved across goals</span><strong>{formatCurrency(goals.reduce((sum, goal) => sum + Number(goal.savedAmount), 0))}<small> / {formatCurrency(goals.reduce((sum, goal) => sum + Number(goal.targetAmount), 0))}</small></strong></div>}
          <button className="goal-create-toggle" type="button" onClick={() => setGoalFormOpen((open) => !open)}><Plus size={15} aria-hidden="true" /> {goalFormOpen ? 'Close' : 'Create goal'}</button>
        </div>
        {goalFormOpen && <form className="goal-form" onSubmit={createGoal}>
          <label>Goal name<input value={goalForm.title} onChange={(event) => setGoalForm((current) => ({ ...current, title: event.target.value }))} placeholder="e.g. Emergency fund" required /></label>
          <label>Target amount<input type="number" min="1" step="0.01" value={goalForm.targetAmount} onChange={(event) => setGoalForm((current) => ({ ...current, targetAmount: event.target.value }))} placeholder="50000" required /></label>
          <label>Already saved<input type="number" min="0" step="0.01" value={goalForm.savedAmount} onChange={(event) => setGoalForm((current) => ({ ...current, savedAmount: event.target.value }))} placeholder="0" /></label>
          <label>Target date<input type="date" min={todayKey} value={goalForm.deadline} onChange={(event) => setGoalForm((current) => ({ ...current, deadline: event.target.value }))} /></label>
          <div className="goal-form-actions"><button className="goal-save-button" type="submit"><Check size={15} aria-hidden="true" /> Create savings goal</button></div>
        </form>}
        {goals.length === 0 && !goalFormOpen ? <div className="goals-empty"><span><Target size={20} aria-hidden="true" /></span><div><strong>Give your savings a purpose</strong><small>Set a target for a trip, a new phone or your emergency fund.</small></div><button type="button" onClick={() => setGoalFormOpen(true)}>Create your first goal <ArrowRight size={14} aria-hidden="true" /></button></div> : <div className="goal-grid">
          {goals.map((goal) => {
            const targetAmount = Number(goal.targetAmount);
            const savedAmount = Number(goal.savedAmount);
            const remaining = Math.max(0, targetAmount - savedAmount);
            const progress = targetAmount ? Math.min(100, Math.round((savedAmount / targetAmount) * 100)) : 0;
            const completed = savedAmount >= targetAmount;
            const daysLeft = goal.deadline ? daysBetween(goal.deadline, todayKey) : null;
            const deadlineLabel = !goal.deadline ? 'No deadline' : completed ? 'Goal reached' : daysLeft < 0 ? `Past due by ${Math.abs(daysLeft)} days` : daysLeft === 0 ? 'Due today' : `Due in ${daysLeft} days`;
            return <article className={`goal-card ${completed ? 'completed' : ''}`} key={goal.id}>
              <div className="goal-card-top">
                <span className="goal-icon"><Target size={18} aria-hidden="true" /></span>
                <span className={`goal-deadline ${daysLeft !== null && daysLeft < 0 && !completed ? 'past-due' : ''}`}>{deadlineLabel}</span>
                <button className="goal-delete" type="button" onClick={() => deleteGoal(goal.id)} aria-label={`Delete ${goal.title}`}><Trash2 size={14} aria-hidden="true" /></button>
              </div>
              <h3 data-gujarati-preserve>{goal.title}</h3>
              <div className="goal-progress-layout">
                <div className="goal-amount-copy"><span>Saved so far</span><strong>{formatCurrency(savedAmount)}</strong><small>{remaining > 0 ? `${formatCurrency(remaining)} to go` : 'Target achieved'}</small></div>
                <div className="goal-ring" style={{ '--goal-progress': `${progress}%` }}><span>{progress}%</span></div>
              </div>
              <div className="goal-progress-track"><span style={{ width: `${progress}%` }} /></div>
              <div className="goal-target-line"><span>Target</span><strong>{formatCurrency(targetAmount)}</strong></div>
              <form className="goal-contribution-form" onSubmit={(event) => addGoalContribution(event, goal)}>
                <input type="number" min="0.01" max={remaining} step="0.01" value={goalContributionDrafts[goal.id] ?? ''} onChange={(event) => setGoalContributionDrafts((current) => ({ ...current, [goal.id]: event.target.value }))} placeholder={completed ? 'Goal completed' : 'Add contribution'} aria-label={`Contribution to ${goal.title}`} disabled={completed} />
                <button type="submit" disabled={completed || !goalContributionDrafts[goal.id]}><Plus size={14} aria-hidden="true" /> Add</button>
              </form>
            </article>;
          })}
        </div>}
        <p className="goal-note"><ShieldCheck size={13} aria-hidden="true" /> Goal contributions are tracked separately and do not count as expenses.</p>
      </section>

      <section className="panel category-budget-panel" id="category-budgets">
        <div className="category-budget-heading">
          <div><p className="eyebrow">{selectedMonthLabel.toUpperCase()} CATEGORY LIMITS</p><h2>Budget by category</h2><p>Set a cap for each type of spending.</p></div>
          <span className={`category-budget-count ${categoriesOverLimit.length ? 'has-overages' : ''}`}>{categoriesOverLimit.length ? `${categoriesOverLimit.length} over limit` : 'Monthly limits'}</span>
        </div>
        {categoriesOverLimit.length > 0 && <div className="category-budget-alert"><Bell size={15} aria-hidden="true" /><span>{categoriesOverLimit.join(', ')} {categoriesOverLimit.length === 1 ? 'is' : 'are'} over the set limit.</span></div>}
        <div className="category-budget-list">
          {categories.map((category) => {
            const CategoryIcon = categoryIcons[category];
            const spent = expenseByCategory[category];
            const hasLimit = Object.hasOwn(activeCategoryBudgets, category);
            const limit = Number(activeCategoryBudgets[category] ?? 0);
            const percent = hasLimit ? (limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : spent > 0 ? 100 : 0) : 0;
            const remaining = limit - spent;
            const overLimit = hasLimit && spent > limit;
            return <article className={`category-budget-row ${overLimit ? 'over-limit' : ''} ${hasLimit && percent >= 80 && !overLimit ? 'near-limit' : ''}`} key={category}>
              <div className="category-budget-summary">
                <span className="category-budget-icon" style={{ '--category-color': categoryColors[category] }}><CategoryIcon size={16} aria-hidden="true" /></span>
                <div className="category-budget-copy"><strong>{category}</strong><small>{formatCurrency(spent)} spent {hasLimit ? `/ ${formatCurrency(limit)}` : ''}</small></div>
                <span className="category-budget-remaining">{hasLimit ? overLimit ? `${formatCurrency(Math.abs(remaining))} over` : `${formatCurrency(remaining)} left` : 'No limit set'}</span>
              </div>
              <div className="category-budget-track"><span style={{ width: `${percent}%` }} /></div>
              <form className="category-limit-form" onSubmit={(event) => saveCategoryBudget(event, category)}>
                <label><span>Monthly cap</span><input type="number" min="0" step="500" value={categoryBudgetDrafts[category] ?? ''} onChange={(event) => setCategoryBudgetDrafts((current) => ({ ...current, [category]: event.target.value }))} placeholder="Set limit" aria-label={`${category} monthly budget`} /></label>
                <button type="submit">Save</button>
              </form>
            </article>;
          })}
        </div>
        {categoryBudgetNotice && <p className="category-budget-notice" role="status"><Check size={14} aria-hidden="true" /> {categoryBudgetNotice}</p>}
      </section>

      <section className="panel recurring-panel" id="recurring">
        <div className="recurring-heading">
          <div><p className="eyebrow"><Repeat size={13} aria-hidden="true" /> MONTHLY SCHEDULE</p><h2>Recurring transactions</h2><p>Mark items paid when they happen to add them to your totals.</p></div>
          <span className="recurring-count">{recurringRules.filter((rule) => rule.active).length} active</span>
        </div>
        {dueReminders.length > 0 && <div className={`reminder-banner ${dueReminders.some((item) => item.daysUntil < 0) ? 'is-overdue' : ''}`}>
          <span className="reminder-icon"><Bell size={17} aria-hidden="true" /></span>
          <div><strong>{dueReminders.some((item) => item.daysUntil < 0) ? 'Recurring payment needs attention' : 'Coming up this week'}</strong><p>{dueReminders.slice(0, 2).map(({ rule, daysUntil }) => `${rule.title}: ${daysUntil < 0 ? `overdue by ${Math.abs(daysUntil)} day${Math.abs(daysUntil) === 1 ? '' : 's'}` : daysUntil === 0 ? 'due today' : `due in ${daysUntil} day${daysUntil === 1 ? '' : 's'}`}`).join(' / ')}</p></div>
          <span className="reminder-total">{dueReminders.length}</span>
        </div>}
        {recurringItems.length === 0 ? (
          <div className="recurring-empty"><span className="recurring-empty-icon"><Repeat size={18} aria-hidden="true" /></span><div><strong>No recurring items for {selectedMonthLabel}</strong><small>Set up salary, rent or subscriptions from the transaction form.</small></div><button type="button" onClick={() => { setRepeatMonthly(true); document.querySelector('.add-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>Create one <ArrowRight size={14} aria-hidden="true" /></button></div>
        ) : (
          <div className="recurring-list">
            {recurringItems.map(({ rule, dueDate, daysUntil, isPaid }) => {
              const CategoryIcon = categoryIcons[rule.category] ?? Sparkles;
              const isCurrentMonth = selectedMonth === todayKey.slice(0, 7);
              const dueLabel = !rule.active ? 'Paused' : isPaid ? (rule.type === 'income' ? 'Received' : 'Paid') : selectedMonth > todayKey.slice(0, 7) ? 'Scheduled' : isCurrentMonth && daysUntil < 0 ? `Overdue by ${Math.abs(daysUntil)}d` : isCurrentMonth && daysUntil === 0 ? 'Due today' : isCurrentMonth && daysUntil <= 7 ? `Due in ${daysUntil}d` : `Due ${displayDate(dueDate)}`;
              const dueClass = !rule.active ? 'paused' : isPaid ? 'paid' : isCurrentMonth && daysUntil < 0 ? 'overdue' : isCurrentMonth && daysUntil <= 7 ? 'soon' : 'scheduled';
              return <article className={`recurring-item ${!rule.active ? 'paused' : ''}`} key={rule.id}>
                <div className="recurring-item-icon" style={{ '--category-color': categoryColors[rule.category] ?? '#7c88d9' }}><CategoryIcon size={17} aria-hidden="true" /></div>
                <div className="recurring-details"><strong data-gujarati-preserve>{rule.title}</strong><small>{rule.category} / <span data-gujarati-preserve>{accountName(rule.accountId ?? 'cash')}</span> / Due {displayDate(dueDate)}</small></div>
                <strong className={rule.type === 'income' ? 'income-text' : 'expense-text'}>{rule.type === 'income' ? '+' : '-'}{formatCurrency(rule.amount)}</strong>
                <span className={`recurring-status ${dueClass}`}>{isPaid && <Check size={12} aria-hidden="true" />}{dueLabel}</span>
                {rule.active && !isPaid && <button className="recurring-mark" type="button" onClick={() => markRecurringPaid(rule)}>{rule.type === 'income' ? 'Mark received' : 'Mark paid'}</button>}
                <div className="recurring-tools">
                  <button type="button" onClick={() => toggleRecurringRule(rule.id)} aria-label={`${rule.active ? 'Pause' : 'Resume'} ${rule.title}`}>{rule.active ? <Pause size={14} /> : <Play size={14} />}</button>
                  <button type="button" onClick={() => deleteRecurringRule(rule.id)} aria-label={`Delete recurring schedule ${rule.title}`}><Trash2 size={14} /></button>
                </div>
              </article>;
            })}
          </div>
        )}
      </section>

      <section className="dashboard-grid">
        <section className="panel add-panel" id="add-transaction">
          <div className="panel-heading">
            <div><p className="eyebrow">{editingId ? 'EDIT ENTRY' : 'NEW ENTRY'}</p><h2>{editingId ? 'Update transaction' : 'Add a transaction'}</h2></div>
            <span className="heading-icon">{editingId ? <Pencil size={17} aria-hidden="true" /> : <Plus size={19} aria-hidden="true" />}</span>
          </div>
          <form onSubmit={handleSubmit}>
            <label>Transaction name<input name="title" value={form.title} onChange={handleChange} placeholder={form.type === 'transfer' ? 'e.g. Bank to cash' : 'e.g. Groceries'} required /></label>
            <label>Amount<input name="amount" value={form.amount} onChange={handleChange} type="number" placeholder="0.00" min="0.01" step="0.01" required /></label>
            <label>Date<input name="date" value={form.date} onChange={handleChange} type="date" min={`${selectedMonth}-01`} max={`${selectedMonth}-${String(lastDayOfMonth(selectedMonth)).padStart(2, '0')}`} required /></label>
            <label>Type<select name="type" value={form.type} onChange={handleChange}><option value="expense">Expense</option><option value="income">Income</option><option value="transfer">Transfer between accounts</option></select></label>
            {form.type === 'transfer' ? <>
              <label>From account<select name="fromAccountId" value={form.fromAccountId} onChange={handleChange} required>{accounts.map((account) => <option value={account.id} key={account.id} disabled={account.id === form.toAccountId} data-gujarati-preserve>{account.name}</option>)}</select></label>
              <label>To account<select name="toAccountId" value={form.toAccountId} onChange={handleChange} required>{accounts.map((account) => <option value={account.id} key={account.id} disabled={account.id === form.fromAccountId} data-gujarati-preserve>{account.name}</option>)}</select></label>
            </> : <>
              <label>Category<select name="category" value={form.category} onChange={handleChange}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
              <label>Account<select name="accountId" value={form.accountId} onChange={handleChange} required><option value="">Choose an account</option>{accounts.map((account) => <option value={account.id} key={account.id} data-gujarati-preserve>{account.name}</option>)}</select></label>
            </>}
            {!editingId && form.type !== 'transfer' && <label className="repeat-control"><input type="checkbox" checked={repeatMonthly} onChange={(event) => setRepeatMonthly(event.target.checked)} /><span><Repeat size={16} aria-hidden="true" /><span><strong>Repeat monthly</strong><small>Schedule for day {Number(form.date.slice(-2))} of each month</small></span></span></label>}
            <button className="primary-button" type="submit">{editingId ? 'Save changes' : 'Add transaction'} <ArrowRight size={16} aria-hidden="true" /></button>
            {editingId && <button className="cancel-button" type="button" onClick={cancelEdit}>Cancel edit</button>}
          </form>
          {message && <p className="success-message"><Check size={15} aria-hidden="true" /> {message}</p>}
          <div className="category-manager">
            <button className="category-manager-toggle" type="button" onClick={() => setCategoryManagerOpen((open) => !open)} aria-expanded={categoryManagerOpen} aria-controls="category-manager-content">
              <span><Sparkles size={14} aria-hidden="true" /> Manage categories</span><small>{customCategories.length} custom</small>
            </button>
            {categoryManagerOpen && <div className="category-manager-content" id="category-manager-content">
              <form className="custom-category-form" onSubmit={addCustomCategory}>
                <label htmlFor="new-category-name">Add a category</label>
                <div><input id="new-category-name" value={newCategory} onChange={(event) => setNewCategory(event.target.value)} maxLength={24} placeholder="e.g. Rent or Health" /><button type="submit"><Plus size={14} aria-hidden="true" /> Add</button></div>
              </form>
              <div className="category-manage-list">
                {categories.map((category) => {
                  const CategoryIcon = categoryIcons[category] ?? Sparkles;
                  const isCustom = customCategories.includes(category);
                  return <span className="category-manage-chip" key={category}>
                    <span className="category-manage-icon" style={{ '--category-color': categoryColors[category] ?? '#8290e8' }}><CategoryIcon size={12} aria-hidden="true" /></span>
                    <span>{category}</span>
                    {isCustom ? <button type="button" onClick={() => removeCustomCategory(category)} aria-label={`Remove ${category} category`} title={`Remove ${category}`}><Trash2 size={12} aria-hidden="true" /></button> : <small>Default</small>}
                  </span>;
                })}
              </div>
              {customCategoryStatus && <p className="custom-category-status" role="status">{customCategoryStatus}</p>}
              <p className="category-manager-note">A custom category can be removed only when no transaction, schedule or budget uses it.</p>
            </div>}
          </div>
        </section>

        <aside className="panel insight-panel">
          <p className="eyebrow">{selectedMonthLabel.toUpperCase()} SAVINGS</p>
          <div className="savings-value"><h2>{savingsRate}%</h2><span><TrendingUp size={15} aria-hidden="true" /> saved</span></div>
          <p className="insight-text">of your income this month is left after expenses.</p>
          <div className="progress-track"><span style={{ width: `${savingsRate}%` }} /></div>
          <div className="insight-row"><span><ArrowUpRight size={14} aria-hidden="true" /> Income</span><strong>{formatCurrency(totals.income)}</strong></div>
          <div className="insight-row"><span><ArrowDownRight size={14} aria-hidden="true" /> Spent</span><strong>{formatCurrency(totals.expense)}</strong></div>
          {categoryTotals.length > 0 && <div className="category-breakdown">
            <h3>Top spending</h3>
            {categoryTotals.slice(0, 3).map(({ category, amount }) => {
              const CategoryIcon = categoryIcons[category];
              return <div className="category-row" key={category}><span><CategoryIcon size={14} aria-hidden="true" /> {category}</span><strong>{formatCurrency(amount)}</strong></div>;
            })}
          </div>}
        </aside>
      </section>

      <section className="panel analytics-panel" id="analytics">
        <div className="analytics-heading">
          <div><p className="eyebrow">{selectedMonthLabel.toUpperCase()} ANALYTICS</p><h2>Where your money goes</h2><p className="analytics-description">Tap a category to filter its transactions.</p></div>
          <div className="analytics-total"><span>Total spent</span><strong>{formatCurrency(totals.expense)}</strong></div>
        </div>
        {totals.expense === 0 ? (
          <div className="analytics-empty"><PieChart size={30} aria-hidden="true" /><p>Add expenses to reveal your category breakdown.</p></div>
        ) : (
          <DonutChart
            data={categoryTotals}
            total={totals.expense}
            monthLabel={selectedMonthLabel}
            selectedCategory={categoryFilter}
            hoveredCategory={hoveredCategory}
            onHover={setHoveredCategory}
            onSelect={toggleCategory}
          />
        )}
        {categoryTotals[0] && <p className="top-spend-note"><Sparkles size={15} aria-hidden="true" /> Your highest spending is on <strong>{categoryTotals[0].category}</strong> at {formatCurrency(categoryTotals[0].amount)}.</p>}
      </section>

      <section className="panel trend-panel" id="trends">
        <TrendChart data={monthlyTrend} selectedMonthLabel={selectedMonthLabel} currency={currency} />
      </section>

      <DailySpendingCalendar
        month={selectedMonth}
        monthLabel={selectedMonthLabel}
        currency={currency}
        weekStart={weekStart}
        transactions={monthTransactions}
        accountName={accountName}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onChangeMonth={(nextMonth) => { setSelectedMonth(nextMonth); setDateFrom(''); setDateTo(''); }}
        onShowCurrentMonth={() => { setSelectedMonth(currentMonthKey()); setDateFrom(''); setDateTo(''); }}
        onSelectDate={(date) => { setDateFrom(date); setDateTo(date); }}
        onClearDateRange={() => { setDateFrom(''); setDateTo(''); }}
      />

      <section className="panel history" id="transactions">
        <div className="history-top">
          <div><p className="eyebrow">{hasDateRange ? 'CUSTOM DATE RANGE' : `${selectedMonthLabel.toUpperCase()} ACTIVITY`}</p><h2>Transactions</h2></div>
          <div className="history-actions">
            <label className="search-box"><Search size={15} aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search transactions" aria-label="Search transactions" /></label>
            <div className="filters" aria-label="Filter transactions">{['all', 'income', 'expense', 'transfer'].map((type) => <button type="button" className={filter === type ? 'active' : ''} onClick={() => setFilter(type)} key={type}>{type}</button>)}</div>
            <label className="import-button"><Upload size={14} aria-hidden="true" /><span>Import CSV</span><input className="visually-hidden" type="file" accept=".csv,text/csv" onChange={handleCsvFile} /></label>
            <button className="export-button" type="button" onClick={exportCsv} disabled={visibleTransactions.length === 0} title={`Export ${visibleTransactions.length} filtered transaction${visibleTransactions.length === 1 ? '' : 's'}`}><Download size={14} aria-hidden="true" /> Export CSV</button>
          </div>
        </div>
        <div className="advanced-filters" aria-label="Advanced transaction filters">
          <label className="advanced-filter-field">From<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} aria-label="Filter from date" /></label>
          <label className="advanced-filter-field">To<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} aria-label="Filter to date" /></label>
          <label className="advanced-filter-field">Category<select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filter by category"><option value="">All categories</option>{categories.map((category) => <option value={category} key={category}>{category}</option>)}</select></label>
          <label className="advanced-filter-field">Min amount<input type="number" min="0" step="0.01" value={minimumAmount} onChange={(event) => setMinimumAmount(event.target.value)} placeholder="Any" aria-label="Minimum amount" /></label>
          <label className="advanced-filter-field">Max amount<input type="number" min="0" step="0.01" value={maximumAmount} onChange={(event) => setMaximumAmount(event.target.value)} placeholder="Any" aria-label="Maximum amount" /></label>
          <label className="advanced-filter-field sort-filter">Sort by<select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} aria-label="Sort transactions"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="amount-high">Highest amount</option><option value="amount-low">Lowest amount</option></select></label>
          <button className="clear-filters" type="button" onClick={clearTransactionFilters} disabled={!hasTransactionFilters}>Clear filters</button>
        </div>
        <div className="transaction-results-meta">
          <span>Showing <strong>{visibleTransactions.length}</strong> of <strong>{dateScopedTransactions.length}</strong> transactions</span>
          <small>{hasDateRange ? 'Date range searches across all months.' : `Showing ${selectedMonthLabel}; add a date range to search other months.`}</small>
        </div>
        {importStatus && <p className="csv-feedback" role="status">{importStatus}</p>}
        {importPreview && <div className="csv-review">
          <div className="csv-review-heading"><div><p className="eyebrow">READY TO IMPORT</p><strong>{importPreview.fileName}</strong></div><button className="csv-cancel" type="button" onClick={() => setImportPreview(null)} aria-label="Cancel CSV import">Cancel</button></div>
          <div className="csv-counts"><span><strong>{importPreview.transactions.length}</strong> new</span><span><strong>{importPreview.duplicates}</strong> duplicates</span><span><strong>{importPreview.invalid}</strong> invalid rows</span></div>
          {importPreview.transactions.length > 0 && <ul className="csv-preview-list">{importPreview.transactions.slice(0, 3).map((transaction) => <li key={transaction.id}><span>{transaction.date} / <span data-gujarati-preserve>{transaction.title}</span></span><strong>{formatCurrency(transaction.amount)}</strong></li>)}</ul>}
          <div className="csv-review-actions"><button className="import-confirm" type="button" onClick={confirmCsvImport} disabled={!importPreview.transactions.length}><Check size={15} aria-hidden="true" /> Import {importPreview.transactions.length} transaction{importPreview.transactions.length === 1 ? '' : 's'}</button><button className="csv-cancel" type="button" onClick={() => setImportPreview(null)}>Cancel</button></div>
        </div>}
        {visibleTransactions.length === 0 ? (
          <div className="empty-state"><PieChart size={28} aria-hidden="true" /><p>{dateRangeInvalid ? 'The start date must be before the end date.' : amountRangeInvalid ? 'The minimum amount must be less than or equal to the maximum.' : dateScopedTransactions.length === 0 ? (hasDateRange ? 'No transactions found within this date range.' : `No transactions in ${selectedMonthLabel} yet.`) : 'No transactions match these filters.'}</p></div>
        ) : (
          <div className="transaction-list">
            {visibleTransactions.map((transaction) => {
              const CategoryIcon = categoryIcons[transaction.category] ?? Sparkles;
              return <article className="transaction-item" key={transaction.id}>
                <div className={`transaction-icon ${transaction.type === 'transfer' ? 'transfer-icon' : ''}`} style={{ '--category-color': categoryColors[transaction.category] ?? '#7c88d9' }}>{transaction.type === 'transfer' ? <ArrowLeftRight size={17} aria-hidden="true" /> : <CategoryIcon size={17} aria-hidden="true" />}</div>
                <div className="transaction-details"><strong data-gujarati-preserve>{transaction.title}</strong><small>{transaction.type === 'transfer'
                  ? <>Transfer · {displayDate(transaction.date)} · <span data-gujarati-preserve>{accountName(transaction.fromAccountId)}</span> → <span data-gujarati-preserve>{accountName(transaction.toAccountId)}</span></>
                  : <>{transaction.category} · {displayDate(transaction.date)} · <span data-gujarati-preserve>{accountName(transaction.accountId)}</span></>}</small></div>
                <span className={transaction.type === 'transfer' ? 'transfer-text' : transaction.type === 'income' ? 'income-text' : 'expense-text'}>{transaction.type === 'transfer' ? '↔ ' : transaction.type === 'income' ? '+' : '−'}{formatCurrency(transaction.amount)}</span>
                <button className="edit-btn" type="button" onClick={() => editTransaction(transaction)} aria-label="Edit transaction"><Pencil size={14} aria-hidden="true" /><span>Edit</span></button>
                <button className="delete-btn" type="button" onClick={() => removeTransaction(transaction.id)} aria-label="Delete transaction"><Trash2 size={15} aria-hidden="true" /></button>
              </article>;
            })}
          </div>
        )}
      </section>

      <UserActivityPanel user={user} />

      <UserFeedbackCenter user={user} onUnreadCountChange={setFeedbackUnreadCount} />

      <section className="panel backup-panel" id="backup" aria-labelledby="backup-title">
        <div className="backup-heading">
          <div className="backup-icon"><ShieldCheck size={20} aria-hidden="true" /></div>
          <div className="backup-copy">
            <p className="eyebrow">YOUR DATA</p>
            <h2 id="backup-title">Backup &amp; restore</h2>
            <p>Save accounts, transactions, budgets, recurring schedules and savings goals in one file.</p>
          </div>
          <div className="backup-actions">
            <button className="backup-download" type="button" onClick={downloadFullBackup}><Download size={15} aria-hidden="true" /> Download backup</button>
            <button className="backup-pdf-button" type="button" onClick={printFullBackup}><Printer size={15} aria-hidden="true" /> Save full backup as PDF</button>
            <label className="backup-upload"><Upload size={15} aria-hidden="true" /><span>Choose backup</span><input className="visually-hidden" type="file" accept=".json,application/json" onChange={handleBackupFile} /></label>
          </div>
        </div>
        <p className="backup-footnote"><ShieldCheck size={14} aria-hidden="true" /> The PDF is a readable copy. In the print window choose “Save as PDF”; keep the JSON file to restore data in ExpenseNest.</p>
        {backupStatus && <p className="backup-status" role="status">{backupStatus}</p>}
        {backupPreview && <div className="backup-preview">
          <div className="backup-preview-heading">
            <div><p className="eyebrow">BACKUP READY</p><strong>{backupPreview.fileName}</strong></div>
            <button className="csv-cancel" type="button" onClick={() => setBackupPreview(null)}>Cancel</button>
          </div>
          <div className="backup-counts">
            <span><strong>{backupPreview.transactionCount}</strong> transactions</span>
            <span><strong>{backupPreview.accountCount}</strong> accounts</span>
            <span><strong>{backupPreview.scheduleCount}</strong> schedules</span>
            <span><strong>{backupPreview.goalCount}</strong> savings goals</span>
            <span><strong>{backupPreview.categoryCount}</strong> custom categories</span>
          </div>
          <p className="backup-warning">Restoring replaces the accounts, transactions, budgets, schedules, goals and shared application preferences currently saved in this browser.</p>
          <div className="backup-preview-actions">
            <button className="backup-restore-confirm" type="button" onClick={restoreFullBackup}><Upload size={14} aria-hidden="true" /> Restore this backup</button>
            <button className="csv-cancel" type="button" onClick={() => setBackupPreview(null)}>Keep current data</button>
          </div>
        </div>}
      </section>

      <section id="family-sharing" className="panel">
        <FamilySharing user={user} currency={currency} onActivity={trackActivity} />
      </section>

      <section id="settings" className="panel settings-panel" aria-labelledby="settings-title">
        <div className="settings-heading">
          <div className="settings-heading-icon"><Settings2 size={19} aria-hidden="true" /></div>
          <div>
            <p className="eyebrow">YOUR PREFERENCES</p>
            <h2 id="settings-title">Settings</h2>
            <p>Choose how ExpenseNest looks and displays your information.</p>
          </div>
        </div>

        <div className="settings-grid">
          <section className="settings-card" aria-labelledby="settings-appearance-title">
            <div className="settings-card-copy">
              <h3 id="settings-appearance-title">Appearance</h3>
              <p>Pick the theme that feels comfortable to use.</p>
            </div>
            <div className="settings-theme-options" role="group" aria-label="Appearance theme">
              <button type="button" className={theme === 'dark' ? 'selected' : ''} onClick={() => setUserTheme('dark')} aria-pressed={theme === 'dark'}><Moon size={16} aria-hidden="true" /> Dark</button>
              <button type="button" className={theme === 'light' ? 'selected' : ''} onClick={() => setUserTheme('light')} aria-pressed={theme === 'light'}><Sun size={16} aria-hidden="true" /> Light</button>
            </div>
          </section>

          <section className="settings-card settings-language-card" aria-labelledby="settings-language-title">
            <div className="settings-card-copy">
              <h3 id="settings-language-title">Language Settings</h3>
              <p>Choose your preferred language for the whole app.</p>
            </div>
            <LanguageControl
              language={language}
              onChange={(nextLanguage) => {
                if (nextLanguage === language) return;
                setPreferredLanguage(nextLanguage);
                setLanguage(nextLanguage);
                trackActivity('settings_updated');
              }}
            />
          </section>

          <section className="settings-card" aria-labelledby="settings-currency-title">
            <div className="settings-card-copy">
              <h3 id="settings-currency-title">Currency display</h3>
              <p>Choose the currency used to label amounts in the app.</p>
            </div>
            <label className="settings-currency-field" htmlFor="settings-currency">
              <span>Currency</span>
              <select id="settings-currency" value={currency} onChange={handleCurrencyChange}>
                {CURRENCIES.map(({ code, name }) => <option value={code} key={code}>{code} · {name}</option>)}
              </select>
            </label>
            <p className="settings-currency-note">This changes the currency label and number format only. It does not convert values using exchange rates.</p>
          </section>

          <section className="settings-card" aria-labelledby="settings-date-format-title">
            <div className="settings-card-copy">
              <h3 id="settings-date-format-title">Date format</h3>
              <p>Choose how dates appear across transactions, reports and family activity.</p>
            </div>
            <label className="settings-currency-field" htmlFor="settings-date-format">
              <span>Date format</span>
              <select id="settings-date-format" value={dateFormat} onChange={(event) => { setDateFormat(event.target.value); trackActivity('settings_updated'); }}>
                {DATE_FORMAT_OPTIONS.map((option) => <option value={option.value} key={option.value}>{option.label}</option>)}
              </select>
            </label>
          </section>

          <section className="settings-card" aria-labelledby="settings-density-title">
            <div className="settings-card-copy">
              <h3 id="settings-density-title">Layout density</h3>
              <p>Use more breathing room or fit more information on screen.</p>
            </div>
            <label className="settings-currency-field" htmlFor="settings-density">
              <span>Spacing</span>
              <select id="settings-density" value={density} onChange={(event) => { setDensity(event.target.value); trackActivity('settings_updated'); }}>
                <option value="comfortable">Comfortable</option>
                <option value="compact">Compact</option>
              </select>
            </label>
          </section>

          <section className="settings-card" aria-labelledby="settings-privacy-title">
            <div className="settings-card-copy">
              <h3 id="settings-privacy-title">Privacy mode</h3>
              <p>Hide money amounts while you use ExpenseNest. CSV and backup exports retain full values.</p>
            </div>
            <label className="settings-privacy-toggle">
              <input type="checkbox" checked={privacyMode} onChange={(event) => {
                const nextPrivacyMode = event.target.checked;
                writeSharedPreference('privacyMode', nextPrivacyMode);
                setPrivacyMode(nextPrivacyMode);
                trackActivity('settings_updated');
              }} />
              <span>{privacyMode ? 'Amounts hidden on screen' : 'Amounts visible'}</span>
            </label>
          </section>

          <section className="settings-card" aria-labelledby="settings-week-start-title">
            <div className="settings-card-copy">
              <h3 id="settings-week-start-title">Calendar week</h3>
              <p>Set the first day used by the spending calendar.</p>
            </div>
            <label className="settings-currency-field" htmlFor="settings-week-start">
              <span>Week starts on</span>
              <select id="settings-week-start" value={weekStart} onChange={(event) => { setWeekStart(event.target.value); trackActivity('settings_updated'); }}>
                <option value="sunday">Sunday</option>
                <option value="monday">Monday</option>
                <option value="saturday">Saturday</option>
              </select>
            </label>
          </section>

          <section className="settings-card" aria-labelledby="settings-motion-title">
            <div className="settings-card-copy">
              <h3 id="settings-motion-title">Motion and animation</h3>
              <p>Follow your device accessibility setting or reduce movement throughout the app.</p>
            </div>
            <label className="settings-currency-field" htmlFor="settings-motion">
              <span>Motion preference</span>
              <select id="settings-motion" value={motionPreference} onChange={(event) => { setMotionPreference(event.target.value); trackActivity('settings_updated'); }}>
                <option value="system">Follow device setting</option>
                <option value="reduced">Reduce animations</option>
              </select>
            </label>
          </section>

          <section className="settings-card" aria-labelledby="settings-notifications-title">
            <div className="settings-card-copy">
              <h3 id="settings-notifications-title">Recurring payment alerts</h3>
              <p>Get a browser notification for unpaid recurring items that are due within the next seven days.</p>
            </div>
            <div className="settings-notification-action">
              <span className={`settings-notification-state ${notificationPermission}`}>
                <span aria-hidden="true" />
                {notificationPermission === 'granted' ? 'Enabled' : notificationPermission === 'denied' ? 'Blocked' : notificationPermission === 'unsupported' ? 'Unavailable' : 'Off'}
              </span>
              <button
                className="settings-notification-button"
                type="button"
                onClick={enablePaymentNotifications}
                disabled={notificationPermission !== 'default'}
              >
                <Bell size={15} aria-hidden="true" />
                {notificationPermission === 'granted' ? 'Alerts enabled' : notificationPermission === 'denied' ? 'Blocked in browser' : notificationPermission === 'unsupported' ? 'Not supported' : 'Enable alerts'}
              </button>
            </div>
            <p className="settings-currency-note" role="status" aria-live="polite">
              {notificationStatus || (notificationPermission === 'granted'
                ? 'Alerts appear while ExpenseNest is open. The in-app reminder remains available.'
                : notificationPermission === 'denied'
                  ? 'Allow notifications for ExpenseNest in your browser site settings. In-app reminders still work.'
                  : notificationPermission === 'unsupported'
                    ? 'This browser cannot show desktop alerts. In-app reminders still work.'
                    : 'You can still see due and overdue reminders inside ExpenseNest.')}
            </p>
          </section>

          <section className="settings-card settings-account-card" aria-labelledby="settings-account-title">
            <div className="settings-account-icon"><ShieldCheck size={18} aria-hidden="true" /></div>
            <div className="settings-card-copy">
              <h3 id="settings-account-title">Account &amp; storage</h3>
              <p>{user?.email || 'Guest account'}</p>
              <small>{user ? 'Your data syncs with this signed-in account.' : 'Your data is saved in this browser. Download a backup before clearing browser data.'}</small>
            </div>
          </section>
        </div>
      </section>

      <FullBackupPrintView
        selectedMonth={selectedMonth}
        theme={theme}
        language={language}
        dateFormat={dateFormat}
        density={density}
        privacyMode={privacyMode}
        weekStart={weekStart}
        motionPreference={motionPreference}
        categories={categories}
        customCategories={customCategories}
        accounts={accountStats}
        unassignedBalance={unassignedBalance}
        unassignedCount={unassignedTransactions.length}
        totalAccountBalance={totalAccountBalance}
        transactions={transactions}
        monthlyBudgets={monthlyBudgets}
        categoryBudgets={categoryBudgets}
        recurringRules={recurringRules}
        goals={goals}
        currency={currency}
      />
    </main>

    <Footer />
  </>;
}
function FullBackupPrintView({ selectedMonth, theme, language, dateFormat, density, privacyMode, weekStart, motionPreference, currency, categories, customCategories, accounts, unassignedBalance, unassignedCount, totalAccountBalance, transactions, monthlyBudgets, categoryBudgets, recurringRules, goals }) {
  const monthLabel = new Date(`${selectedMonth}-01T00:00:00`).toLocaleDateString(getAppLocale(), { month: 'long', year: 'numeric' });
  const sortedTransactions = [...transactions].sort((first, second) => transactionDateKey(first.date).localeCompare(transactionDateKey(second.date)));
  const recurringNames = new Map(recurringRules.map((rule) => [rule.id, rule.title]));
  const accountNames = new Map(accounts.map((account) => [account.id, account.name]));
  const budgetRows = Object.entries(monthlyBudgets).sort(([first], [second]) => first.localeCompare(second));
  const formatCurrency = (amount, currencyCode = currency, notation) => formatCurrencyForExport(amount, currencyCode, notation);
  const categoryBudgetRows = Object.entries(categoryBudgets).flatMap(([month, limits]) => (
    limits && typeof limits === 'object' && !Array.isArray(limits)
      ? Object.entries(limits).map(([category, amount]) => ({ month, category, amount }))
      : []
  )).sort((first, second) => first.month.localeCompare(second.month) || first.category.localeCompare(second.category));

  return <article className="pdf-backup-sheet">
    <header className="pdf-backup-header">
      <span className="pdf-backup-brand">ExpenseNest</span>
      <h1>Complete data backup</h1>
      <p>Generated {new Date().toLocaleString(getAppLocale())} · Full account data snapshot</p>
    </header>
    <section className="pdf-backup-overview">
      <h2>Overview</h2>
      <div className="pdf-backup-meta">
        <p><span>Selected month</span><strong>{monthLabel}</strong></p>
        <p><span>Theme</span><strong>{theme === 'light' ? 'Light' : 'Dark'}</strong></p>
        <p><span>Currency</span><strong>{currency}</strong></p>
        <p><span>Date format</span><strong>{DATE_FORMAT_OPTIONS.find((option) => option.value === dateFormat)?.label || 'Regional'}</strong></p>
        <p><span>Layout density</span><strong>{density === 'compact' ? 'Compact' : 'Comfortable'}</strong></p>
        <p><span>On-screen privacy</span><strong>{privacyMode ? 'Amounts hidden' : 'Amounts visible'}</strong></p>
        <p><span>Calendar week starts</span><strong>{weekStart ? weekStart.charAt(0).toUpperCase() + weekStart.slice(1) : 'Sunday'}</strong></p>
        <p><span>Motion preference</span><strong>{motionPreference || 'System'}</strong></p>
        <p><span>Language</span><strong>{language === 'gu' ? 'Gujarati' : 'English'}</strong></p>
        <p><span>Categories</span><strong>{categories.length}</strong></p>
        <p><span>Accounts</span><strong>{accounts.length}</strong></p>
        <p><span>Total account balance</span><strong>{formatCurrency(totalAccountBalance)}</strong></p>
        <p><span>Transactions</span><strong>{transactions.length}</strong></p>
        <p><span>Monthly budgets</span><strong>{budgetRows.length}</strong></p>
        <p><span>Category limits</span><strong>{categoryBudgetRows.length}</strong></p>
        <p><span>Recurring schedules</span><strong>{recurringRules.length}</strong></p>
        <p><span>Savings goals</span><strong>{goals.length}</strong></p>
      </div>
    </section>

    <section className="pdf-backup-section">
      <h2>Accounts ({accounts.length})</h2>
      <table>
        <thead><tr><th>Account</th><th>Starting balance</th><th>Balance now</th><th>Spent this month</th></tr></thead>
        <tbody>{accounts.map((account) => <tr key={account.id}>
          <td data-gujarati-preserve>{account.name}</td><td>{formatCurrency(Number(account.openingBalance))}</td><td>{formatCurrency(account.balance)}</td><td>{formatCurrency(account.monthExpenses)}</td>
        </tr>)}
          {unassignedCount > 0 && <tr><td>Unassigned old entries ({unassignedCount})</td><td>—</td><td>{formatCurrency(unassignedBalance)}</td><td>—</td></tr>}
        </tbody>
      </table>
    </section>

    <section className="pdf-backup-section">
      <h2>Categories ({categories.length})</h2>
      <table>
        <thead><tr><th>Category</th><th>Type</th></tr></thead>
        <tbody>{categories.map((category) => <tr key={category}><td>{category}</td><td>{customCategories.includes(category) ? 'Custom' : 'Default'}</td></tr>)}</tbody>
      </table>
    </section>

    <section className="pdf-backup-section">
      <h2>Transactions ({transactions.length})</h2>
      {transactions.length === 0 ? <p className="pdf-empty">No transactions saved.</p> : <table>
        <thead><tr><th>Date</th><th>Description</th><th>Type</th><th>Category</th><th>Amount</th><th>Account</th><th>Schedule</th></tr></thead>
        <tbody>{sortedTransactions.map((transaction, index) => <tr key={transaction.id ?? `${transaction.date}-${index}`}>
          <td>{displayDate(transaction.date)}</td><td data-gujarati-preserve>{transaction.title}</td><td>{transaction.type}</td><td>{transaction.type === 'transfer' ? 'Transfer' : transaction.category}</td><td>{formatCurrency(Number(transaction.amount))}</td><td data-gujarati-preserve>{transaction.type === 'transfer' ? `${accountNames.get(transaction.fromAccountId) ?? 'Unknown'} → ${accountNames.get(transaction.toAccountId) ?? 'Unknown'}` : accountNames.get(transaction.accountId) ?? 'Unassigned'}</td><td>{transaction.recurringRuleId ? recurringNames.get(transaction.recurringRuleId) ?? 'Recurring' : '—'}</td>
        </tr>)}</tbody>
      </table>}
    </section>

    <section className="pdf-backup-section">
      <h2>Monthly budgets ({budgetRows.length})</h2>
      {budgetRows.length === 0 ? <p className="pdf-empty">No monthly budgets saved.</p> : <table>
        <thead><tr><th>Month</th><th>Budget limit</th></tr></thead>
        <tbody>{budgetRows.map(([month, amount]) => <tr key={month}>
          <td>{new Date(`${month}-01T00:00:00`).toLocaleDateString(getAppLocale(), { month: 'long', year: 'numeric' })}</td><td>{formatCurrency(Number(amount))}</td>
        </tr>)}</tbody>
      </table>}
    </section>

    <section className="pdf-backup-section">
      <h2>Category budgets ({categoryBudgetRows.length})</h2>
      {categoryBudgetRows.length === 0 ? <p className="pdf-empty">No category limits saved.</p> : <table>
        <thead><tr><th>Month</th><th>Category</th><th>Limit</th></tr></thead>
        <tbody>{categoryBudgetRows.map(({ month, category, amount }) => <tr key={`${month}-${category}`}>
          <td>{new Date(`${month}-01T00:00:00`).toLocaleDateString(getAppLocale(), { month: 'long', year: 'numeric' })}</td><td>{category}</td><td>{formatCurrency(Number(amount))}</td>
        </tr>)}</tbody>
      </table>}
    </section>

    <section className="pdf-backup-section">
      <h2>Recurring schedules ({recurringRules.length})</h2>
      {recurringRules.length === 0 ? <p className="pdf-empty">No recurring schedules saved.</p> : <table>
        <thead><tr><th>Name</th><th>Type</th><th>Category</th><th>Amount</th><th>Account</th><th>Day</th><th>Starts</th><th>Status</th></tr></thead>
        <tbody>{recurringRules.map((rule, index) => <tr key={rule.id ?? `${rule.title}-${index}`}>
          <td data-gujarati-preserve>{rule.title}</td><td>{rule.type}</td><td>{rule.category}</td><td>{formatCurrency(Number(rule.amount))}</td><td data-gujarati-preserve>{accountNames.get(rule.accountId) ?? 'Cash'}</td><td>{rule.dayOfMonth}</td><td>{rule.startMonth}</td><td>{rule.active ? 'Active' : 'Paused'}</td>
        </tr>)}</tbody>
      </table>}
    </section>

    <section className="pdf-backup-section">
      <h2>Savings goals ({goals.length})</h2>
      {goals.length === 0 ? <p className="pdf-empty">No savings goals saved.</p> : <table>
        <thead><tr><th>Goal</th><th>Saved</th><th>Target</th><th>Progress</th><th>Deadline</th><th>Created</th></tr></thead>
        <tbody>{goals.map((goal, index) => <tr key={goal.id ?? `${goal.title}-${index}`}>
          <td data-gujarati-preserve>{goal.title}</td><td>{formatCurrency(Number(goal.savedAmount))}</td><td>{formatCurrency(Number(goal.targetAmount))}</td><td>{Math.round((Number(goal.savedAmount) / Number(goal.targetAmount)) * 100)}%</td><td>{goal.deadline ? displayDate(goal.deadline) : 'Not set'}</td><td>{goal.createdAt ? displayDate(goal.createdAt) : '—'}</td>
        </tr>)}</tbody>
      </table>}
    </section>
    <footer className="pdf-backup-footer">This PDF is a readable archive. Use the ExpenseNest JSON backup file to restore data in the app.</footer>
  </article>;
}

function describeAmountChange(current, previous, lowerIsBetter = false) {
  if (!previous) {
    return { tone: 'neutral', label: current ? 'No activity last month' : 'No activity in either month' };
  }
  const difference = current - previous;
  if (!difference) return { tone: 'neutral', label: 'Same as last month' };
  const percent = Math.round((Math.abs(difference) / previous) * 100);
  const tone = (difference > 0) === lowerIsBetter ? 'negative' : 'positive';
  return { tone, label: `${percent}% ${difference > 0 ? 'higher' : 'lower'} than last month` };
}

function describeSavingsChange(currentRate, previousRate) {
  if (currentRate === null) {
    return { tone: 'neutral', label: 'No income recorded this month' };
  }
  if (previousRate === null) return { tone: 'neutral', label: 'No income recorded last month' };
  const difference = currentRate - previousRate;
  if (Math.abs(difference) < 0.05) return { tone: 'neutral', label: 'Same as last month' };
  const tone = difference > 0 ? 'positive' : 'negative';
  return { tone, label: `${Math.abs(difference).toFixed(1)} percentage points ${difference > 0 ? 'higher' : 'lower'}` };
}

function MonthlyReport({ monthLabel, previousMonthLabel, totals, previousTotals, savingsRate, previousSavingsRate, topCategory, budget, budgetRemaining }) {
  const incomeChange = describeAmountChange(totals.income, previousTotals.income);
  const expenseChange = describeAmountChange(totals.expense, previousTotals.expense, true);
  const savingsChange = describeSavingsChange(savingsRate, previousSavingsRate);
  const categoryShare = totals.expense && topCategory
    ? Math.round((topCategory.amount / totals.expense) * 100)
    : 0;
  const budgetMessage = budget
    ? `${budgetRemaining >= 0 ? formatCurrency(budgetRemaining) : formatCurrency(Math.abs(budgetRemaining))} ${budgetRemaining >= 0 ? 'left in' : 'over'} your monthly budget.`
    : 'Set a monthly budget to track spending against a limit.';

  return <section className="panel monthly-report" id="monthly-report" aria-labelledby="monthly-report-title">
    <div className="report-heading">
      <div>
        <p className="eyebrow"><Sparkles size={13} aria-hidden="true" /> MONTHLY INSIGHTS</p>
        <h2 id="monthly-report-title">{monthLabel} report</h2>
        <p>Compared with {previousMonthLabel}</p>
      </div>
      <button className="report-print" type="button" onClick={() => window.print()}><Printer size={15} aria-hidden="true" /> Print / Save PDF</button>
    </div>

    <div className="report-metrics">
      <article className="report-metric">
        <span className="report-metric-label">Income</span>
        <strong className="report-metric-value">{formatCurrency(totals.income)}</strong>
        <span className={`report-change ${incomeChange.tone}`}>{incomeChange.label}</span>
      </article>
      <article className="report-metric">
        <span className="report-metric-label">Expenses</span>
        <strong className="report-metric-value">{formatCurrency(totals.expense)}</strong>
        <span className={`report-change ${expenseChange.tone}`}>{expenseChange.label}</span>
      </article>
      <article className="report-metric">
        <span className="report-metric-label">Savings rate</span>
        <strong className="report-metric-value">{savingsRate === null ? '—' : `${savingsRate.toFixed(1)}%`}</strong>
        <span className={`report-change ${savingsChange.tone}`}>{savingsChange.label}</span>
      </article>
      <article className="report-metric">
        <span className="report-metric-label">Top spending category</span>
        <strong className="report-metric-value report-category-value">{topCategory?.category ?? 'No spending yet'}</strong>
        <span className="report-change neutral">{topCategory ? `${formatCurrency(topCategory.amount)} · ${categoryShare}% of expenses` : 'Add expenses to see your top category'}</span>
      </article>
    </div>

    <div className="report-footer">
      <div className="report-takeaway"><span><PiggyBank size={16} aria-hidden="true" /></span><p>{budgetMessage}</p></div>
      <small>Savings rate uses recorded income minus recorded expenses.</small>
    </div>
  </section>;
}

function DailySpendingCalendar({ month, monthLabel, transactions, accountName, currency, weekStart = 'sunday', dateFrom, dateTo, onChangeMonth, onShowCurrentMonth, onSelectDate, onClearDateRange }) {
  const daysInMonth = lastDayOfMonth(month);
  const [year, monthNumber] = month.split('-').map(Number);
  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekStartIndex = { sunday: 0, monday: 1, saturday: 6 }[weekStart] ?? 0;
  const firstWeekday = (new Date(year, monthNumber - 1, 1).getDay() - weekStartIndex + 7) % 7;
  const orderedWeekdays = Array.from({ length: 7 }, (_, index) => weekdayNames[(weekStartIndex + index) % 7]);
  const today = localDateKey();
  const dailyTotals = useMemo(() => {
    const totalsByDate = new Map();
    transactions.forEach((transaction) => {
      const date = transactionDateKey(transaction.date);
      const current = totalsByDate.get(date) ?? { expense: 0, income: 0, transfer: 0, count: 0 };
      current[transaction.type] += Number(transaction.amount);
      current.count += 1;
      totalsByDate.set(date, current);
    });
    return Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const date = `${month}-${String(day).padStart(2, '0')}`;
      return { day, date, ...(totalsByDate.get(date) ?? { expense: 0, income: 0, transfer: 0, count: 0 }) };
    });
  }, [transactions, month, daysInMonth]);
  const totalExpense = dailyTotals.reduce((sum, item) => sum + item.expense, 0);
  const activeDays = dailyTotals.filter((item) => item.count > 0).length;
  const highestSpendDay = dailyTotals.reduce((highest, item) => item.expense > (highest?.expense ?? 0) ? item : highest, null);
  const maxDailyExpense = Math.max(0, ...dailyTotals.map((item) => item.expense));
  const cells = [...Array(firstWeekday).fill(null), ...dailyTotals];
  while (cells.length % 7) cells.push(null);
  const hasDateSelection = Boolean(dateFrom || dateTo);
  const selectedDate = dateFrom && dateFrom === dateTo && dateFrom.startsWith(`${month}-`) ? dateFrom : '';
  const selectedDateTransactions = selectedDate
    ? transactions.filter((transaction) => transactionDateKey(transaction.date) === selectedDate)
    : [];
  const selectedDateTotals = selectedDateTransactions.reduce((totals, transaction) => {
    totals[transaction.type] += Number(transaction.amount);
    return totals;
  }, { income: 0, expense: 0, transfer: 0 });
  const compactCurrency = (value) => formatCurrency(value, currency, 'compact');
  const selectedRangeLabel = dateFrom && dateTo
    ? dateFrom === dateTo ? displayDate(dateFrom) : `${displayDate(dateFrom)} – ${displayDate(dateTo)}`
    : dateFrom ? `From ${displayDate(dateFrom)}` : dateTo ? `Until ${displayDate(dateTo)}` : '';

  return <section className="panel daily-calendar" id="daily-calendar" aria-labelledby="daily-calendar-title">
    <div className="calendar-heading">
      <div>
        <p className="eyebrow"><CalendarDays size={13} aria-hidden="true" /> DAILY ACTIVITY</p>
        <h2 id="daily-calendar-title">Spending calendar</h2>
        <div className="calendar-month-controls" aria-label="Choose calendar month">
          <button type="button" onClick={() => onChangeMonth(shiftMonth(month, -1))} aria-label="Show previous month"><ChevronLeft size={15} aria-hidden="true" /></button>
          <strong>{monthLabel}</strong>
          <button type="button" onClick={() => onChangeMonth(shiftMonth(month, 1))} aria-label="Show next month"><ChevronRight size={15} aria-hidden="true" /></button>
          <button className="calendar-today-button" type="button" onClick={onShowCurrentMonth}>This month</button>
        </div>
        <p>Tap any day to preview activity and filter transactions below.</p>
      </div>
      <div className="calendar-summary">
        <div className="calendar-stat-spent"><span className="calendar-stat-icon"><WalletCards size={14} aria-hidden="true" /></span><span className="calendar-stat-copy"><small>Total spent</small><strong>{formatCurrency(totalExpense)}</strong></span></div>
        <div className="calendar-stat-peak"><span className="calendar-stat-icon"><TrendingUp size={14} aria-hidden="true" /></span><span className="calendar-stat-copy"><small>Highest spend day</small><strong>{highestSpendDay?.expense ? `${highestSpendDay.day} · ${formatCurrency(highestSpendDay.expense)}` : '—'}</strong></span></div>
        <div className="calendar-stat-active"><span className="calendar-stat-icon"><CalendarDays size={14} aria-hidden="true" /></span><span className="calendar-stat-copy"><small>Active days</small><strong>{activeDays} / {daysInMonth}</strong></span></div>
      </div>
    </div>
    <div className="calendar-layout">
      <div className="calendar-main">
        <div className="calendar-weekdays" aria-hidden="true">{orderedWeekdays.map((day) => <span key={day}>{day}</span>)}</div>
        <div className="calendar-grid" role="group" aria-label={`${monthLabel} daily spending calendar`}>
          {cells.map((item, index) => {
            if (!item) return <span className="calendar-empty-cell" aria-hidden="true" key={`empty-${index}`} />;
            const intensity = item.expense > 0 && maxDailyExpense > 0 ? Math.max(1, Math.ceil((item.expense / maxDailyExpense) * 4)) : 0;
            const selected = hasDateSelection && (!dateFrom || item.date >= dateFrom) && (!dateTo || item.date <= dateTo) && (!dateFrom || !dateTo || dateFrom <= dateTo);
            const isToday = item.date === today;
            const isPeak = Boolean(highestSpendDay?.expense && highestSpendDay.date === item.date);
            const title = `${displayDate(item.date)} · ${formatCurrency(item.expense)} spent · ${formatCurrency(item.income)} income · ${formatCurrency(item.transfer)} transferred · ${item.count} transaction${item.count === 1 ? '' : 's'}`;
            return <button
              className={`calendar-day intensity-${intensity}${item.income > 0 ? ' has-income' : ''}${item.transfer > 0 ? ' has-transfer' : ''}${selected ? ' selected' : ''}${isToday ? ' is-today' : ''}${isPeak ? ' is-peak' : ''}`}
              type="button"
              key={item.date}
              onClick={() => onSelectDate(item.date)}
              aria-label={title}
              aria-pressed={selected}
              title={title}
            >
              <span className="calendar-day-number">{item.day}</span>
              {item.expense > 0 ? <span className="calendar-day-amount">{compactCurrency(item.expense)}</span> : item.income > 0 ? <span className="calendar-income-mark">Income</span> : item.transfer > 0 ? <span className="calendar-transfer-mark">Transfer</span> : <span className="calendar-no-activity">—</span>}
              {item.expense > 0 && <span className="calendar-day-track"><i style={{ width: `${Math.max(10, Math.round((item.expense / maxDailyExpense) * 100))}%` }} /></span>}
              {item.count > 0 && <span className="calendar-transaction-count">{item.count} txn</span>}
            </button>;
          })}
        </div>
        <div className="calendar-footer">
          <div className="calendar-legend"><span>Less</span><i className="intensity-0" /><i className="intensity-1" /><i className="intensity-2" /><i className="intensity-3" /><i className="intensity-4" /><span>More spending</span></div>
          {hasDateSelection && <div className="calendar-selected-range"><span>Transactions: {selectedRangeLabel}</span><button type="button" onClick={onClearDateRange}>Clear date</button></div>}
        </div>
      </div>
      <aside className={`calendar-day-details${selectedDate ? '' : ' is-empty'}`} aria-live="polite">
        {selectedDate ? <>
          <div className="calendar-day-details-heading">
            <span className="calendar-details-icon"><CalendarDays size={15} aria-hidden="true" /></span>
            <div><small>SELECTED DAY</small><strong>{displayDate(selectedDate)}</strong></div>
            <span className="calendar-day-entry-count">{selectedDateTransactions.length} txn</span>
          </div>
          <div className="calendar-day-metrics">
            <div><span>Spent</span><strong className="calendar-expense-total">{formatCurrency(selectedDateTotals.expense)}</strong></div>
            <div><span>Income</span><strong className="calendar-income-total">{formatCurrency(selectedDateTotals.income)}</strong></div>
            <div><span>Transferred</span><strong className="calendar-transfer-total">{formatCurrency(selectedDateTotals.transfer)}</strong></div>
            <div><span>Net</span><strong>{formatCurrency(selectedDateTotals.income - selectedDateTotals.expense)}</strong></div>
          </div>
          {selectedDateTransactions.length > 0 ? <ul className="calendar-day-transactions">
            {selectedDateTransactions.slice(0, 4).map((transaction, index) => <li key={transaction.id ?? `${transaction.title}-${index}`}>
              <span><strong data-gujarati-preserve>{transaction.title}</strong><small>{transaction.type === 'transfer' ? <>Transfer · <span data-gujarati-preserve>{accountName(transaction.fromAccountId)}</span> → <span data-gujarati-preserve>{accountName(transaction.toAccountId)}</span></> : transaction.category}</small></span>
              <strong className={transaction.type === 'transfer' ? 'calendar-transfer-total' : transaction.type === 'income' ? 'calendar-income-total' : 'calendar-expense-total'}>{transaction.type === 'transfer' ? '↔ ' : transaction.type === 'income' ? '+' : '−'}{formatCurrency(Number(transaction.amount))}</strong>
            </li>)}
          </ul> : <p className="calendar-no-transactions">No transactions recorded on this day.</p>}
          {selectedDateTransactions.length > 4 && <button className="calendar-view-all" type="button" onClick={() => document.getElementById('transactions')?.scrollIntoView({ behavior: shouldReduceMotion() ? 'auto' : 'smooth', block: 'start' })}>View all {selectedDateTransactions.length} transactions <ArrowRight size={13} aria-hidden="true" /></button>}
        </> : <>
          <div className="calendar-day-empty-icon"><CalendarDays size={22} aria-hidden="true" /></div>
          <p className="eyebrow">DAY DETAILS</p>
          <h3>Select a date</h3>
          <p className="calendar-empty-copy">Choose a day on the calendar to see its income, spending and transactions here.</p>
        </>}
      </aside>
    </div>
  </section>;
}

function TrendChart({ data, selectedMonthLabel, currency }) {
  const [activeIndex, setActiveIndex] = useState(data.length - 1);
  const width = 760;
  const left = 74;
  const right = 738;
  const top = 28;
  const bottom = 220;
  const plotHeight = bottom - top;
  const maxValue = Math.max(0, ...data.flatMap((item) => [item.income, item.expense]));
  const scaleMax = maxValue > 0 ? maxValue * 1.16 : 1;
  const active = data[activeIndex] ?? data[data.length - 1];
  const hasData = maxValue > 0;
  const pointsFor = (key) => data.map((item, index) => ({
    x: left + (index * (right - left)) / (data.length - 1),
    y: bottom - (item[key] / scaleMax) * plotHeight,
    value: item[key],
  }));
  const incomePoints = pointsFor('income');
  const expensePoints = pointsFor('expense');
  const smoothPath = (points) => points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = points[index - 1];
    const midpoint = (previous.x + point.x) / 2;
    return `${path} C ${midpoint} ${previous.y}, ${midpoint} ${point.y}, ${point.x} ${point.y}`;
  }, '');
  const incomePath = smoothPath(incomePoints);
  const expensePath = smoothPath(expensePoints);
  const incomeArea = `${incomePath} L ${right} ${bottom} L ${left} ${bottom} Z`;
  const expenseArea = `${expensePath} L ${right} ${bottom} L ${left} ${bottom} Z`;
  const compactCurrency = (value) => formatCurrency(value, currency, 'compact');

  function activatePoint(event, index) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setActiveIndex(index);
    }
  }

  return <>
    <div className="trend-heading">
      <div><p className="eyebrow"><TrendingUp size={13} aria-hidden="true" /> SIX-MONTH OVERVIEW</p><h2>Income &amp; spending trend</h2><p className="analytics-description">Monthly totals for the six months ending {selectedMonthLabel}.</p></div>
      <div className="trend-focus"><span>{active?.fullLabel}</span><div><strong className="trend-focus-income">Income {formatCurrency(active?.income ?? 0)}</strong><strong className="trend-focus-expense">Expenses {formatCurrency(active?.expense ?? 0)}</strong></div></div>
    </div>
    {!hasData ? <div className="trend-empty"><TrendingUp size={25} aria-hidden="true" /><span>Add transactions to see your six-month trend.</span></div> : <>
      <div className="trend-legend"><span><i className="income-dot" />Income</span><span><i className="expense-dot" />Expenses</span></div>
      <div className="trend-chart-scroll">
        <svg className="trend-svg" viewBox={`0 0 ${width} 270`} role="group" aria-label={`Income and expenses for the six months ending ${selectedMonthLabel}`}>
          <defs>
            <linearGradient id="income-area-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#35c69a" stopOpacity=".22" /><stop offset="100%" stopColor="#35c69a" stopOpacity="0" /></linearGradient>
            <linearGradient id="expense-area-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#ff806f" stopOpacity=".18" /><stop offset="100%" stopColor="#ff806f" stopOpacity="0" /></linearGradient>
          </defs>
          {[0, .25, .5, .75, 1].map((fraction) => {
            const y = bottom - fraction * plotHeight;
            return <g key={fraction}><line className="trend-grid-line" x1={left} y1={y} x2={right} y2={y} /><text className="trend-axis-text" x={left - 12} y={y + 4} textAnchor="end">{compactCurrency(scaleMax * fraction)}</text></g>;
          })}
          <path className="trend-area income-area" d={incomeArea} />
          <path className="trend-area expense-area" d={expenseArea} />
          <path className="trend-line income-line" d={incomePath} />
          <path className="trend-line expense-line" d={expensePath} />
          {data.map((item, index) => {
            const income = incomePoints[index];
            const expense = expensePoints[index];
            const x = income.x;
            return <g
              className={`trend-month ${activeIndex === index ? 'active' : ''}`}
              key={item.key}
              role="button"
              tabIndex="0"
              aria-label={`${item.fullLabel}: income ${formatCurrency(item.income)}, expenses ${formatCurrency(item.expense)}`}
              onMouseEnter={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onClick={() => setActiveIndex(index)}
              onKeyDown={(event) => activatePoint(event, index)}
            >
              {activeIndex === index && <line className="trend-active-line" x1={x} y1={top} x2={x} y2={bottom} />}
              <rect className="trend-hit-column" x={x - 22} y={top} width="44" height={bottom - top} />
              <circle className="trend-point income-point" cx={income.x} cy={income.y} r={activeIndex === index ? 5.5 : 4} />
              <circle className="trend-point expense-point" cx={expense.x} cy={expense.y} r={activeIndex === index ? 5.5 : 4} />
              <text className="trend-month-label" x={x} y="250" textAnchor="middle">{item.label}</text>
            </g>;
          })}
        </svg>
      </div>
    </>}
  </>;
}

function DonutChart({ data, total, monthLabel, selectedCategory, hoveredCategory, onHover, onSelect }) {
  const circumference = 2 * Math.PI * 82;
  let offset = 0;
  const slices = data.map((item) => {
    const length = (item.amount / total) * circumference;
    const gap = Math.min(5, length * 0.18);
    const visibleLength = Math.max(0.8, length - gap);
    const slice = { ...item, length, offset, visibleLength };
    offset += length;
    return slice;
  });
  const activeCategory = hoveredCategory || selectedCategory;
  const activeSlice = data.find((item) => item.category === activeCategory);

  function handleKeyDown(event, category) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect(category);
    }
  }

  return <div className="analytics-content">
    <div className="donut-wrap">
      <svg className="donut-svg" viewBox="0 0 240 240" role="group" aria-label={`Expense breakdown for ${monthLabel}`}>
        <circle className="donut-track" cx="120" cy="120" r="82" />
        {slices.map(({ category, amount, offset: start, visibleLength }, index) => {
          const percent = (amount / total) * 100;
          return <circle
            key={category}
            className={`donut-segment ${activeCategory && activeCategory !== category ? 'dimmed' : ''} ${activeCategory === category ? 'active' : ''}`}
            style={{ animationDelay: `${index * 65}ms` }}
            cx="120"
            cy="120"
            r="82"
            stroke={categoryColors[category]}
            strokeDasharray={`${visibleLength} ${circumference - visibleLength}`}
            strokeDashoffset={-start}
            strokeWidth="25"
            strokeLinecap="round"
            transform="rotate(-90 120 120)"
            role="button"
            tabIndex="0"
            aria-label={`${category}: ${formatCurrency(amount)}, ${percent.toFixed(1)} percent. Select to filter transactions.`}
            aria-pressed={selectedCategory === category}
            onMouseEnter={() => onHover(category)}
            onMouseLeave={() => onHover('')}
            onFocus={() => onHover(category)}
            onBlur={() => onHover('')}
            onKeyDown={(event) => handleKeyDown(event, category)}
            onClick={() => onSelect(category)}
          />;
        })}
      </svg>
      <div className="donut-center" aria-live="polite">
        <span>{activeSlice?.category ?? 'TOTAL SPENT'}</span>
        <strong>{formatCurrency(activeSlice?.amount ?? total)}</strong>
        <small>{activeSlice ? `${((activeSlice.amount / total) * 100).toFixed(1)}% of monthly spend` : `${data.length} spending categories`}</small>
      </div>
      <span className="donut-orbit orbit-one" />
      <span className="donut-orbit orbit-two" />
    </div>
    <div className="pie-legend">
      {data.map(({ category, amount }) => {
        const CategoryIcon = categoryIcons[category];
        const percent = (amount / total) * 100;
        return <button
          type="button"
          className={`category-legend-item ${selectedCategory === category ? 'selected' : ''} ${activeCategory && activeCategory !== category ? 'dimmed' : ''}`}
          key={category}
          style={{ '--category-color': categoryColors[category] }}
          onClick={() => onSelect(category)}
          onMouseEnter={() => onHover(category)}
          onMouseLeave={() => onHover('')}
          onFocus={() => onHover(category)}
          onBlur={() => onHover('')}
          aria-pressed={selectedCategory === category}
          title={`Filter transactions for ${category}`}
        >
          <span className="legend-icon"><CategoryIcon size={16} aria-hidden="true" /></span>
          <span className="legend-info"><strong>{category}</strong><small>{percent.toFixed(1)}% of spending</small></span>
          <strong className="legend-amount">{formatCurrency(amount)}</strong>
        </button>;
      })}
    </div>
  </div>;
}

function SummaryCard({ kind, label, value, caption }) {
  const summaryIcons = { balance: WalletCards, income: ArrowUpRight, expense: ArrowDownRight };
  const Icon = summaryIcons[kind];
  return <article className={`summary-card ${kind}`}>
    <div className="card-icon"><Icon size={20} strokeWidth={2} aria-hidden="true" /></div>
    <div><p>{label}</p><h2>{value}</h2><small>{caption}</small></div>
  </article>;
}
