import { Globe } from 'lucide-react';
import { useI18n } from '../../lib/i18n/context';

export function LanguageSwitcher() {
  const { language, setLanguage } = useI18n();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      title={`Switch to ${language === 'en' ? 'Spanish' : 'English'}`}
    >
      <Globe className="h-4 w-4 mr-2" />
      <span className="uppercase font-semibold">
        {language === 'en' ? 'ES' : 'EN'}
      </span>
    </button>
  );
} 