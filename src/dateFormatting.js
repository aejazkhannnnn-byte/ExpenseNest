import { getSharedPreference } from './sharedPreferences';

export const DATE_FORMAT_OPTIONS = [
  { value: 'regional', label: 'Regional - 21 Nov 2026' },
  { value: 'dmy', label: 'DD/MM/YYYY - 21/11/2026' },
  { value: 'mdy', label: 'MM/DD/YYYY - 11/21/2026' },
  { value: 'ymd', label: 'YYYY-MM-DD - 2026-11-21' },
];

function parseDate(value) {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (value === null || value === undefined || value === '') return null;

  const dateOnly = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatNumericDate(date, format) {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  if (format === 'ymd') return `${year}-${month}-${day}`;
  if (format === 'mdy') return `${month}/${day}/${year}`;
  return `${day}/${month}/${year}`;
}

export function formatAppDate(value, options = { day: 'numeric', month: 'short', year: 'numeric' }) {
  const date = parseDate(value);
  if (!date) return 'Date not available';

  const dateFormat = getSharedPreference('dateFormat') || 'regional';
  if (dateFormat !== 'regional' && options.day && options.month && options.year) {
    return formatNumericDate(date, dateFormat);
  }
  return date.toLocaleDateString('en-IN', options);
}

export function formatAppDateTime(value, options = { day: 'numeric', month: 'long', year: 'numeric' }) {
  const date = parseDate(value);
  if (!date) return 'Date not available';
  const dateLabel = formatAppDate(date, options);
  const timeLabel = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  return `${dateLabel}, ${timeLabel}`;
}
