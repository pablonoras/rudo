import React, { createContext, useContext, useEffect, useState } from 'react';
import { getDefaultLanguage } from '../geolocation';
import { translations } from './translations';

type Language = 'en' | 'es';
type TranslationKey = keyof typeof translations.en;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
  isLoading: boolean;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const getInitialLanguage = async (): Promise<Language> => {
  // Check localStorage first (user's manual preference takes priority)
  const stored = localStorage.getItem('language') as Language;
  if (stored && ['en', 'es'].includes(stored)) {
    return stored;
  }

  // Use IP geolocation to detect default language
  try {
    const detectedLanguage = await getDefaultLanguage();
    return detectedLanguage;
  } catch (error) {
    console.error('Error detecting language:', error);
    // Final fallback to browser language
    const browserLang = navigator.language.toLowerCase();
    return browserLang.startsWith('es') ? 'es' : 'en';
  }
};

// Loading component
const LoadingScreen = () => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
      <p className="text-gray-600 dark:text-gray-400 text-sm">Detecting language...</p>
    </div>
  </div>
);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');
  const [isLoading, setIsLoading] = useState(true);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    document.documentElement.lang = lang === 'es' ? 'es-419' : 'en';
  };

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        const initialLang = await getInitialLanguage();
        setLanguageState(initialLang);
        document.documentElement.lang = initialLang === 'es' ? 'es-419' : 'en';
        
        // Only set in localStorage if not already set (preserve user preference)
        if (!localStorage.getItem('language')) {
          localStorage.setItem('language', initialLang);
        }
      } catch (error) {
        console.error('Error initializing language:', error);
        // Fallback to English
        setLanguageState('en');
        document.documentElement.lang = 'en';
      } finally {
        setIsLoading(false);
      }
    };

    initializeLanguage();
  }, []);

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  // Show loading screen while detecting language
  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, isLoading }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}; 