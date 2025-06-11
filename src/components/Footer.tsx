import { LogIn } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n/context';
import { Logo } from './Logo';

const Footer = () => {
  const { t } = useI18n();
  
  return (
    <footer className="bg-black/50 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Logo + Tagline */}
          <div>
            <Link to="/" className="inline-block mb-4">
              <Logo variant="light" size="lg" />
            </Link>
            <div className="text-gray-400 flex flex-col">
              <span>{t('new-slogan-line1')}</span>
              <span>{t('new-slogan-line2')}</span>
            </div>
          </div>

          {/* Empty column for spacing */}
          <div></div>

          {/* Contact + Sign In */}
          <div>
            <h3 className="text-sm font-semibold mb-4">{t('contact')}</h3>
            <a
              href="mailto:info@rudofit.com"
              className="text-gray-400 hover:text-white transition-colors block mb-4"
            >
              info@rudofit.com
            </a>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors group"
            >
              <LogIn className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              <span>{t('sign-in')}</span>
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10">
          <p className="text-center text-sm text-gray-400">
            {t('built-in')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 