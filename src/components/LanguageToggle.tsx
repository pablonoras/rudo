import { Globe } from 'lucide-react';
import { Language } from '../types';

interface LanguageToggleProps {
  language: Language;
  setLanguage: (lang: Language) => void;
}

export function LanguageToggle({ language, setLanguage }: LanguageToggleProps) {
  return (
    <button
      onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
      className="fixed top-4 right-4 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors"
      aria-label="Toggle Language"
    >
      <Globe className="w-5 h-5 text-gray-700" />
    </button>
  );
}