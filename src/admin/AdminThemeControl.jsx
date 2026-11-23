import { Moon, Sun } from 'lucide-react';

export default function AdminThemeControl({ theme, onChange, variant = 'icon' }) {
  if (variant === 'segmented' || variant === 'topbar') {
    return (
      <div className={`admin-theme-options${variant === 'topbar' ? ' admin-theme-options-topbar' : ''}`} role="group" aria-label="Select admin theme">
        <button type="button" className={theme === 'dark' ? 'selected' : ''} onClick={() => onChange('dark')} aria-pressed={theme === 'dark'} aria-label="Dark Theme" title="Dark Theme">
          <Moon size={15} aria-hidden="true" /> Dark Theme
        </button>
        <button type="button" className={theme === 'light' ? 'selected' : ''} onClick={() => onChange('light')} aria-pressed={theme === 'light'} aria-label="Light Theme" title="Light Theme">
          <Sun size={15} aria-hidden="true" /> Light Theme
        </button>
      </div>
    );
  }

  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  const Icon = nextTheme === 'light' ? Sun : Moon;

  return (
    <button
      type="button"
      className={`admin-theme-toggle${variant === 'portal' ? ' admin-portal-theme-toggle' : variant === 'login' ? ' admin-login-theme-toggle' : ''}`}
      onClick={() => onChange(nextTheme)}
      aria-label={`Switch to ${nextTheme} mode`}
      title={`Switch to ${nextTheme} mode`}
    >
      <Icon size={16} aria-hidden="true" />
      <span>{nextTheme === 'light' ? 'Light mode' : 'Dark mode'}</span>
    </button>
  );
}
