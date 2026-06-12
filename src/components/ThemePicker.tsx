import { useState } from 'react';
import { applyTheme, loadTheme, saveTheme } from '../lib/theme-prefs';
import { THEME_OPTIONS, type ThemeId } from '../lib/themes';

interface ThemePickerProps {
  className?: string;
}

export default function ThemePicker({ className = '' }: ThemePickerProps) {
  const [theme, setTheme] = useState<ThemeId>(loadTheme);

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value as ThemeId;
    setTheme(next);
    saveTheme(next);
    applyTheme(next);
  };

  return (
    <label className={`theme-picker ${className}`.trim()}>
      <span className="theme-picker__label">Theme</span>
      <select
        className="theme-picker__select"
        value={theme}
        onChange={handleChange}
        aria-label="Color theme"
      >
        {THEME_OPTIONS.map((option) => (
          <option key={option.id} value={option.id} title={option.description}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
