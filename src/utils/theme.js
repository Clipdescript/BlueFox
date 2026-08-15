import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const THEME_STORAGE_KEY = 'bluefox_theme';
const VALID_MODES = new Set(['light', 'dark', 'system']);

const getStoredMode = () => {
  try {
    const storedMode = localStorage.getItem(THEME_STORAGE_KEY);
    return VALID_MODES.has(storedMode) ? storedMode : 'system';
  } catch {
    return 'system';
  }
};

const getSystemTheme = () => (
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light'
);

const ThemeContext = createContext(null);

export const ThemeProvider = ({ children }) => {
  const [mode, setModeState] = useState(getStoredMode);
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);
  const resolvedTheme = mode === 'system' ? systemTheme : mode;

  useEffect(() => {
    const mediaQuery = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mediaQuery) return undefined;

    const updateSystemTheme = (event) => setSystemTheme(event.matches ? 'dark' : 'light');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    mediaQuery.addEventListener?.('change', updateSystemTheme);
    return () => mediaQuery.removeEventListener?.('change', updateSystemTheme);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
    window.electron?.setTheme?.(resolvedTheme);
  }, [resolvedTheme]);

  const setMode = (nextMode) => {
    if (!VALID_MODES.has(nextMode)) return;
    setModeState(nextMode);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextMode);
    } catch {
      // Theme still works for the current session if storage is unavailable.
    }
  };

  const toggleTheme = () => setMode(resolvedTheme === 'dark' ? 'light' : 'dark');

  const value = useMemo(() => ({ mode, resolvedTheme, setMode, toggleTheme }), [mode, resolvedTheme]);

  return React.createElement(ThemeContext.Provider, { value }, children);
};

export const useTheme = () => {
  const theme = useContext(ThemeContext);
  if (!theme) throw new Error('useTheme must be used inside ThemeProvider');
  return theme;
};
