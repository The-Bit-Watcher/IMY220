import { useEffect, useState } from 'react';
import { getTheme, setTheme } from '../../utils/theme';

// Switches between the light (day) and dark (night) theme
function ThemeToggle({ className = '' }) {
  const [theme, setLocalTheme] = useState(getTheme);

  // Keep every toggle on the page in sync (desktop + mobile header)
  useEffect(() => {
    const sync = () => setLocalTheme(getTheme());
    window.addEventListener('themeChanged', sync);
    return () => window.removeEventListener('themeChanged', sync);
  }, []);

  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button type="button" onClick={() => setTheme(isDark ? 'light' : 'dark')} aria-label={label} title={label}
      className={`w-9 h-9 inline-flex items-center justify-center rounded-xl border border-slate-700 text-slate-300 hover:text-slate-50 hover:bg-slate-800 transition-colors ${className}`}>
      {isDark ? (
        // Sun
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32 1.41-1.41" />
        </svg>
      ) : (
        // Moon
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <path strokeLinejoin="round" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
      )}
    </button>
  );
}

export default ThemeToggle;
