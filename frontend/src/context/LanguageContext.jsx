import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { LANGUAGES, t as translate } from '../i18n/locales';
import { settingsApi } from '../lib/api';

const LanguageContext = createContext(null);
const STORAGE_KEY = 'crm_language';

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => localStorage.getItem(STORAGE_KEY) || 'en');

  useEffect(() => {
    settingsApi.get()
      .then((res) => {
        if (res?.data?.defaultLanguage) {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (!stored) setLanguageState(res.data.defaultLanguage);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  const setLanguage = useCallback((code) => {
    setLanguageState(code);
    localStorage.setItem(STORAGE_KEY, code);
  }, []);

  const t = useCallback((key) => translate(language, key), [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, languages: LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};

export default LanguageContext;
