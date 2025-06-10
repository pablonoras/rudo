import { motion } from 'framer-motion';
import { LogIn, Menu, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n/context';
import LanguageToggle from './LanguageToggle';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useI18n();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNavClick = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-black/95 backdrop-blur-md shadow-xl border-b border-white/10' 
          : 'bg-black/80 backdrop-blur-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-black tracking-tighter text-white">RUDO</span>
            <span className="ml-2 px-2 py-1 text-xs font-semibold text-white bg-blue-600 rounded">BETA</span>
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <nav className="flex items-center gap-8">
              <button
                onClick={(e) => handleNavClick(e, 'why-coaches')}
                className="text-sm text-gray-200 hover:text-white transition-colors font-medium"
              >
                {t('how-it-works')}
              </button>
              <button
                onClick={(e) => handleNavClick(e, 'faq')}
                className="text-sm text-gray-200 hover:text-white transition-colors font-medium"
              >
                {t('faq')}
              </button>
              <LanguageToggle />
            </nav>
          </div>

          {/* Sign In Button - Far Right */}
          <div className="hidden md:flex items-center">
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-all duration-200 border border-white/20 hover:border-white/30"
            >
              <LogIn className="w-4 h-4" />
              {t('sign-in')}
            </Link>
          </div>

          {/* Mobile Menu Button & Language Toggle */}
          <div className="flex items-center gap-3 md:hidden">
            <LanguageToggle />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-black/95 backdrop-blur-md rounded-b-xl border-t border-white/10 shadow-xl"
          >
            <nav className="px-4 py-6 space-y-4">
              <button
                onClick={(e) => handleNavClick(e, 'why-coaches')}
                className="block w-full text-left py-3 px-4 text-white hover:bg-white/10 rounded-lg text-base font-medium transition-colors"
              >
                {t('how-it-works')}
              </button>
              <button
                onClick={(e) => handleNavClick(e, 'faq')}
                className="block w-full text-left py-3 px-4 text-white hover:bg-white/10 rounded-lg text-base font-medium transition-colors"
              >
                {t('faq')}
              </button>
              
              {/* Mobile Sign In Button */}
              <Link
                to="/auth"
                className="flex items-center justify-center gap-3 py-4 px-6 bg-white/15 hover:bg-white/25 text-white rounded-lg text-base font-semibold transition-all duration-200 border border-white/20"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <LogIn className="w-5 h-5" />
                {t('sign-in')}
              </Link>
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
};

export default Header; 