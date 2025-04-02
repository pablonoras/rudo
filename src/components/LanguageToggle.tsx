import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center justify-center px-2 py-1 rounded-md bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white text-sm transition-all duration-300 border border-white/20"
      aria-label={`Switch to ${language === 'en' ? 'Spanish' : 'English'}`}
    >
      <span className={`mr-1 ${language === 'en' ? 'font-bold' : 'opacity-60'}`}>EN</span>
      <span>/</span>
      <span className={`ml-1 ${language === 'es' ? 'font-bold' : 'opacity-60'}`}>ES</span>
    </button>
  );
};

export default LanguageToggle; 