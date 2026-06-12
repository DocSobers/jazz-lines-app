import { DEFAULT_THEME, isThemeId, type ThemeId } from './themes';

const STORAGE_KEY = 'jazz-lines-theme';

export function loadTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isThemeId(stored)) return stored;
  } catch {
    /* ignore */
  }
  return DEFAULT_THEME;
}

export function saveTheme(theme: ThemeId): void {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function applyTheme(theme: ThemeId): void {
  document.documentElement.dataset.theme = theme;
}

export function initTheme(): ThemeId {
  const theme = loadTheme();
  applyTheme(theme);
  return theme;
}
