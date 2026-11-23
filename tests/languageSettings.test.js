import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import {
  DEFAULT_LANGUAGE,
  getAppLocale,
  getPreferredLanguage,
  normalizeLanguage,
  setPreferredLanguage,
  translateForCurrentLanguage,
} from '../src/gujaratiLocalization.js';
import {
  getSharedPreference,
  resetSharedPreferences,
  writeSharedPreference,
} from '../src/sharedPreferences.js';
import { formatAppDate } from '../src/dateFormatting.js';
import { formatCurrency } from '../src/currency.js';

const values = new Map();
globalThis.window = {
  localStorage: {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); },
    removeItem(key) { values.delete(key); },
  },
  dispatchEvent() {},
};
globalThis.localStorage = globalThis.window.localStorage;
globalThis.CustomEvent = class CustomEvent {
  constructor(type, options = {}) { this.type = type; this.detail = options.detail; }
};

after(() => {
  delete globalThis.window;
  delete globalThis.localStorage;
  delete globalThis.CustomEvent;
});

test('English is the default and unsupported language codes fall back to English', () => {
  values.clear();
  assert.equal(DEFAULT_LANGUAGE, 'en');
  assert.equal(getPreferredLanguage(), 'en');
  assert.equal(normalizeLanguage('fr'), 'en');
  assert.equal(normalizeLanguage('gu'), 'gu');
});

test('language selection persists and chooses the matching locale', () => {
  setPreferredLanguage('gu');
  writeSharedPreference('language', 'gu');
  assert.equal(getPreferredLanguage(), 'gu');
  assert.equal(getSharedPreference('language'), 'gu');
  assert.equal(getAppLocale(), 'gu-IN-u-nu-gujr');

  setPreferredLanguage('en');
  writeSharedPreference('language', 'en');
  assert.equal(getPreferredLanguage(), 'en');
  assert.equal(getSharedPreference('language'), 'en');
  assert.equal(getAppLocale(), 'en-IN');
});

test('notifications keep English text in English and translate in Gujarati', () => {
  setPreferredLanguage('en');
  assert.equal(translateForCurrentLanguage('Log in'), 'Log in');
  setPreferredLanguage('gu');
  assert.equal(translateForCurrentLanguage('Log in'), 'પ્રવેશ કરો');
});

test('language labels, date formats, and currency numerals follow the selected language', () => {
  writeSharedPreference('dateFormat', 'dmy');
  setPreferredLanguage('gu');
  assert.equal(translateForCurrentLanguage('Language Settings'), 'ભાષા સેટિંગ્સ');
  assert.equal(formatAppDate('2026-11-21'), '૨૧/૧૧/૨૦૨૬');
  assert.match(formatCurrency(12345.67), /૧૨,૩૪૫\.૬૭/);

  setPreferredLanguage('en');
  assert.equal(formatAppDate('2026-11-21'), '21/11/2026');
  assert.match(formatCurrency(12345.67), /12,345\.67/);
  writeSharedPreference('dateFormat', 'regional');
});

test('resetting shared preferences returns the language preference to English', () => {
  writeSharedPreference('language', 'gu');
  resetSharedPreferences();
  assert.equal(getSharedPreference('language'), 'en');
});
