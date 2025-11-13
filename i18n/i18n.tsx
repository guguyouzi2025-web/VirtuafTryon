import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';

// Define the shape of the translation object based on en.json structure
type Translations = { [key: string]: string | Translations };

interface I18nContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string, replacements?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState(() => localStorage.getItem('appLanguage') || 'zh');
  const [translations, setTranslations] = useState<Record<string, Translations>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    localStorage.setItem('appLanguage', language);
  }, [language]);

  useEffect(() => {
    const fetchTranslations = async () => {
      try {
        const enResponse = await fetch('./i18n/en.json');
        const zhResponse = await fetch('./i18n/zh.json');
        
        if (!enResponse.ok || !zhResponse.ok) {
            throw new Error('Failed to load translation files');
        }

        const enData = await enResponse.json();
        const zhData = await zhResponse.json();
        
        setTranslations({ en: enData, zh: zhData });
      } catch (error) {
        console.error("Could not load i18n files:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTranslations();
  }, []);


  const t = (key: string, replacements: Record<string, string> = {}): string => {
    if (loading || !translations[language]) {
        return key;
    }

    const keys = key.split('.');
    let result: any = translations[language];
    let fallbackResult: any = translations['en'];

    for (const k of keys) {
      result = result?.[k];
      fallbackResult = fallbackResult?.[k];
      if (result === undefined) {
        if (fallbackResult === undefined) {
            return key;
        }
        result = fallbackResult;
        break;
      }
    }
    
    if (typeof result !== 'string') return key;

    let finalResult = result;
    for (const placeholder in replacements) {
        finalResult = finalResult.replace(`{{${placeholder}}}`, replacements[placeholder]);
    }

    return finalResult;
  };

  if (loading) {
      return null;
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};
