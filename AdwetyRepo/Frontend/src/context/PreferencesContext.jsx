import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getTranslation } from '../lib/i18n';

const THEME_KEY = 'adwety_theme';
const LANGUAGE_KEY = 'adwety_language';
const PreferencesContext = createContext(null);

function readStoredValue(key, fallback) {
  try {
    const value = window.localStorage.getItem(key) || fallback;
    if (key === THEME_KEY && !['light', 'dark'].includes(value)) return fallback;
    if (key === LANGUAGE_KEY && !['en', 'ar'].includes(value)) return fallback;
    return value;
  } catch (_error) {
    return fallback;
  }
}

export function PreferencesProvider({ children }) {
  const [theme, setThemeState] = useState(() => readStoredValue(THEME_KEY, 'light'));
  const [language, setLanguageState] = useState(() => readStoredValue(LANGUAGE_KEY, 'en'));

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    root.lang = language;
    root.dir = language === 'ar' ? 'rtl' : 'ltr';
    body.classList.remove('light', 'dark');
    body.classList.add(theme);
  }, [theme, language]);

  function setTheme(nextTheme) {
    setThemeState(nextTheme);
    window.localStorage.setItem(THEME_KEY, nextTheme);
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }

  function setLanguage(nextLanguage) {
    setLanguageState(nextLanguage);
    window.localStorage.setItem(LANGUAGE_KEY, nextLanguage);
  }

  const value = useMemo(() => ({
    theme,
    language,
    direction: language === 'ar' ? 'rtl' : 'ltr',
    isRtl: language === 'ar',
    setTheme,
    toggleTheme,
    setLanguage,
    t: (key, fallback) => getTranslation(language, key, fallback),
  }), [theme, language]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error('usePreferences must be used inside PreferencesProvider');
  return value;
}
