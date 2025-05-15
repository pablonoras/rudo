import { useI18n } from '../lib/i18n/context';

const LanguageToggle = () => {
  const { language, setLanguage } = useI18n();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
      className="px-2 py-1 text-sm text-gray-400 hover:text-white transition-colors"
    >
      {language === 'en' ? 'ES' : 'EN'}
    </button>
  );
};

export default LanguageToggle; 