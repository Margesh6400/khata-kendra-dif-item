import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, TranslationKey } from '../utils/translations';
import { supabase } from '../utils/supabase';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'gu' || saved === 'en') ? saved : 'gu';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'app_language')
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) return;
        if (data.value === 'gu' || data.value === 'en') {
          setLanguageState(data.value);
          localStorage.setItem('language', data.value);
        }
      });
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    supabase
      .from('app_settings')
      .upsert({ key: 'app_language', value: lang, updated_at: new Date().toISOString() })
      .then(({ error }) => {
        if (error) console.error('Failed to sync app_language:', error);
      });
  };

  const t = (key: TranslationKey): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
