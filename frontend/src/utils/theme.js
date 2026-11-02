// Light / dark theme. Stored per browser; falls back to the OS preference, then dark.
const KEY = 'theme';

export function getTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    // storage blocked: use the OS preference
  }
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
}

export function setTheme(theme) {
  applyTheme(theme);
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // not persisted, still applied for this visit
  }
  window.dispatchEvent(new Event('themeChanged'));
}
