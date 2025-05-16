import { motion } from 'framer-motion';
import { LogIn, Menu } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../lib/i18n/context';
import LanguageToggle from './LanguageToggle';
import Modal from './Modal';
import WaitlistForm from './WaitlistForm';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    <>
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled ? 'bg-black/90 backdrop-blur-sm shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-black tracking-tighter text-white">RUDO</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <button
                onClick={(e) => handleNavClick(e, 'why-coaches')}
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                {t('how-it-works')}
              </button>
              <button
                onClick={(e) => handleNavClick(e, 'faq')}
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                {t('faq')}
              </button>
              <LanguageToggle />
              <Link
                to="/auth"
                className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1"
              >
                <LogIn className="w-4 h-4" />
                {t('sign-in')}
              </Link>
            </nav>

            {/* Mobile Menu Button */}
            <div className="flex items-center gap-4 md:hidden">
              <LanguageToggle />
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-300 hover:text-white transition-colors"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            {/* CTA Button */}
            <button 
              onClick={() => setIsModalOpen(true)}
              className="hidden md:block bg-gradient-to-r from-[#8A2BE2] to-[#4169E1] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {t('join-beta')}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-white/10">
              <nav className="flex flex-col gap-4">
                <button
                  onClick={(e) => handleNavClick(e, 'why-coaches')}
                  className="text-sm text-gray-300 hover:text-white transition-colors text-left"
                >
                  {t('how-it-works')}
                </button>
                <button
                  onClick={(e) => handleNavClick(e, 'faq')}
                  className="text-sm text-gray-300 hover:text-white transition-colors text-left"
                >
                  {t('faq')}
                </button>
                <Link
                  to="/auth"
                  className="text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-1"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <LogIn className="w-4 h-4" />
                  {t('sign-in')}
                </Link>
                <button 
                  onClick={() => {
                    setIsModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="bg-gradient-to-r from-[#8A2BE2] to-[#4169E1] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity text-center"
                >
                  {t('join-beta')}
                </button>
              </nav>
            </div>
          )}
        </div>
      </motion.header>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">{t('join-beta-title')}</h2>
          <p className="text-gray-400">{t('join-beta-subtitle')}</p>
        </div>
        <WaitlistForm />
      </Modal>
    </>
  );
};

export default Header; 