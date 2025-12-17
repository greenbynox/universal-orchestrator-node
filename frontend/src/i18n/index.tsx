/**
 * ============================================================
 * Frontend i18n Context & Provider
 * ============================================================
 * Système de traduction global pour React
 */

import { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { TRANSLATIONS } from './translations';

export type Language = 'fr' | 'en';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'orchestrator-language';

/**
 * Provider global d'i18n
 */
export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Charger la langue depuis localStorage
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
    if (saved && (saved === 'fr' || saved === 'en')) {
      setLanguageState(saved);
      document.documentElement.lang = saved;
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  };

  const t = (key: string, variables?: Record<string, string | number>): string => {
    // Prefer current language, then fall back to French, then return key.
    let text = TRANSLATIONS[language]?.[key] ?? TRANSLATIONS.fr?.[key] ?? key;
    
    if (variables) {
      Object.entries(variables).forEach(([varKey, value]) => {
        text = text.replace(`{${varKey}}`, String(value));
      });
    }
    
    return text;
  };

  // ⚠️ CRITICAL: Don't render children until hydrated
  if (!mounted) {
    return <div style={{ backgroundColor: '#0a0a0f', height: '100vh' }} />;
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

/**
 * Hook pour utiliser i18n dans les composants
 */
export function useLanguage(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useLanguage doit être utilisé dans <I18nProvider>');
  }
  return context;
}
