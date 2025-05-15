import { LogIn } from 'lucide-react';
import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n/context';

const Footer = () => {
  const { t } = useI18n();
  
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Account for header height
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <footer className="bg-black/50 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Logo + Tagline */}
          <div>
            <Link to="/" className="inline-block mb-4">
              <span className="text-2xl font-black tracking-tighter text-white">RUDO</span>
            </Link>
            <p className="text-gray-400">Train athletes. Not spreadsheets.</p>
          </div>

          {/* Main Links */}
          <div className="grid grid-cols-2 gap-8 md:gap-4">
            <div>
              <h3 className="text-sm font-semibold mb-4">{t('product')}</h3>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#why-coaches"
                    onClick={(e) => handleNavClick(e, 'why-coaches')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {t('features')}
                  </a>
                </li>
                <li>
                  <a
                    href="#how-it-works"
                    onClick={(e) => handleNavClick(e, 'how-it-works')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {t('how-it-works')}
                  </a>
                </li>
                <li>
                  <a
                    href="#faq"
                    onClick={(e) => handleNavClick(e, 'faq')}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    {t('faq')}
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-4">{t('legal')}</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/privacy" className="text-gray-400 hover:text-white transition-colors">
                    {t('privacy-policy')}
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="text-gray-400 hover:text-white transition-colors">
                    {t('terms-of-service')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Contact */}
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