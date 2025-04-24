import {
  ArrowRight,
  ChevronDown,
  Dumbbell,
  MessageSquare,
  Trophy,
  User,
  UserCog,
  Users,
  X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageToggle from './LanguageToggle';

// Hero background images
const HERO_BG = {
  MOBILE: 'https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?auto=format&fit=crop&w=768&q=80',
  DESKTOP: 'https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?auto=format&fit=crop&w=2070&q=80',
};

// Base Components
const FeatureIcon = ({ icon: Icon, label }: { icon: React.ElementType, label: string }) => (
  <div className="relative group flex flex-col items-center gap-2">
    <div className="relative">
      <div className="absolute inset-0 bg-gradient-to-r from-[#8A2BE2] to-[#4169E1] rounded-lg blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
      <div className="relative bg-[#0A0A0A] border border-white/10 rounded-lg p-3">
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    <span className="text-[10px] font-medium uppercase tracking-wider text-gray-500 group-hover:text-gray-400 transition-colors">
      {label}
    </span>
  </div>
);

const LoginButton = ({ to, icon: Icon, label }: { 
  to: string; 
  icon: React.ElementType;
  label: string;
}) => {
  return (
    <Link
      to={to}
      className="group relative w-full sm:w-auto transition-all duration-300 group-hover:shadow-[0_0_2rem_-0.5rem_#8A2BE2]"
    >
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8A2BE2] to-[#4169E1] rounded-xl blur opacity-30 group-hover:opacity-60 transition duration-300"></div>
      <div className="relative flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0A0A0A] border border-[#8A2BE2]/20 rounded-xl group-hover:border-[#8A2BE2]/40 transition-all duration-300">
        <Icon className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
        <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors whitespace-nowrap">
          {label}
        </span>
      </div>
    </Link>
  );
};

const MobileNav = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { t } = useLanguage();
  
  return (
    <div 
      className={`fixed inset-0 z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="absolute inset-0 bg-[#0A0A0A] bg-opacity-95 backdrop-blur-lg">
        <div className="flex flex-col h-full p-6">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="text-2xl font-black tracking-tighter bg-gradient-to-r from-[#8A2BE2] to-[#4169E1] bg-clip-text text-transparent">
                RUDO
              </div>
              <div className="px-2 py-0.5 text-[10px] font-medium bg-white/5 border border-white/10 rounded-full tracking-wider">
                BETA
              </div>
            </div>
            <button onClick={onClose} className="p-2">
              <X className="w-6 h-6 text-white" />
            </button>
          </div>
          
          <div className="flex-1 flex flex-col gap-6">
            <LoginButton 
              to="/athlete-signin" 
              icon={User}
              label={t('signin.athlete')}
            />
            <LoginButton 
              to="/coach-signin" 
              icon={UserCog}
              label={t('signin.coach')}
            />
            <LanguageToggle />
          </div>
        </div>
      </div>
    </div>
  );
};

const BubbleHeader = ({ onOpenMobileNav }: { onOpenMobileNav: () => void }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
      isScrolled ? 'py-2' : 'py-4'
    }`}>
      <div className="max-w-xl mx-auto px-4">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-[#8A2BE2]/20 via-[#4169E1]/20 to-[#8A2BE2]/20 rounded-2xl blur-xl animate-pulse"></div>
          
          <div className={`relative bg-black/30 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 ${
            isScrolled ? 'shadow-lg shadow-black/20' : ''
          }`}>
            <div className="flex items-center justify-between p-4">
              <Link to="/" className="group flex items-center gap-3">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#8A2BE2] to-[#4169E1] rounded-lg blur opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                  <div className="relative text-xl font-black tracking-tighter bg-gradient-to-r from-[#8A2BE2] to-[#4169E1] bg-clip-text text-transparent transform group-hover:scale-105 transition-transform duration-300">
                    RUDO
                  </div>
                </div>
                <div className="px-2 py-0.5 text-[10px] font-medium bg-white/5 border border-white/10 rounded-full tracking-wider group-hover:border-white/20 transition-colors duration-300">
                  BETA
                </div>
              </Link>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2">
                  <LoginButton 
                    to="/athlete-signin" 
                    icon={User}
                    label={t('signin.athlete')}
                  />
                  <LoginButton 
                    to="/coach-signin" 
                    icon={UserCog}
                    label={t('signin.coach')}
                  />
                  <LanguageToggle />
                </div>
                
                <button 
                  className="sm:hidden relative w-10 h-10 flex items-center justify-center group"
                  onClick={onOpenMobileNav}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#8A2BE2]/10 to-[#4169E1]/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-[2px] bg-black/50 rounded-xl backdrop-blur-sm border border-white/10 group-hover:border-white/20 transition-colors duration-300"></div>
                  <ChevronDown className="relative w-4 h-4 text-white/70 group-hover:text-white transition-colors duration-300" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const LandingPage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white relative overflow-hidden">
      {/* Background effects */}
      <div 
        className="fixed inset-0 z-0 opacity-50"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          filter: 'contrast(150%) brightness(50%)'
        }}
      />

      <div className="fixed inset-0 z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#8A2BE2] rounded-full filter blur-[128px] opacity-20" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#4169E1] rounded-full filter blur-[128px] opacity-20" />
      </div>

      <MobileNav isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div className="relative z-10 min-h-screen flex flex-col">
        <BubbleHeader onOpenMobileNav={() => setIsMenuOpen(true)} />

        <main className="flex-1 pt-28 sm:pt-32">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-24">
              <div className="flex flex-col justify-center space-y-8 sm:space-y-12">
                <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1]">
                  <span className="bg-gradient-to-r from-[#8A2BE2] to-[#4169E1] bg-clip-text text-transparent">
                    ENTRENA.
                  </span>
                  <br />
                  <span className="text-white">
                    NO ADMINISTRES.
                  </span>
                </h1>

                <p className="text-base sm:text-xl text-gray-300 max-w-xl leading-relaxed">
                  {t('hero.subtitle')}
                </p>

                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-6 sm:gap-10">
                  <FeatureIcon icon={Dumbbell} label="PROGRAMACIÓN" />
                  <FeatureIcon icon={Users} label="GESTIÓN" />
                  <FeatureIcon icon={MessageSquare} label="COMUNICACIÓN" />
                  <FeatureIcon icon={Trophy} label="COMUNIDAD" />
                </div>

                <div className="space-y-4">
                  <Link 
                    to="/choose-role"
                    className="group relative w-full sm:w-auto inline-block"
                  >
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#8A2BE2] to-[#4169E1] rounded-full blur opacity-60 group-hover:opacity-100 transition duration-500"></div>
                    <span className="relative w-full sm:w-auto bg-[#0A0A0A]/90 text-white px-6 sm:px-8 py-4 rounded-full font-bold tracking-wide flex items-center justify-center gap-3 border border-white/10 hover:border-white/20 transition-all duration-500 group-hover:bg-[#0A0A0A]/70">
                      RESERVA TU ACCESO
                      <ArrowRight className="w-5 h-5 transition-transform duration-500 group-hover:translate-x-1" strokeWidth={2} />
                    </span>
                  </Link>
                  <p className="text-sm text-gray-500 font-medium text-center sm:text-left">
                    Acceso anticipado para los primeros en la lista
                  </p>
                </div>
              </div>

              <div className="hidden lg:flex items-center justify-center">
                <div className="relative w-[500px] h-[500px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#8A2BE2] to-[#4169E1] rounded-3xl blur-2xl opacity-20 animate-pulse"></div>
                  <div className="absolute inset-0 rounded-3xl overflow-hidden border border-white/10 backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#8A2BE2]/10 to-[#4169E1]/10"></div>
                    <img 
                      src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1000&q=80"
                      alt="RUDO Interface"
                      className="absolute inset-0 w-full h-full object-cover opacity-40 mix-blend-overlay"
                    />
                    <div className="absolute inset-0 bg-[#0A0A0A]/60 backdrop-blur-md"></div>
                    
                    <div className="relative h-full p-8 flex flex-col">
                      <div className="h-2 w-24 bg-white/10 rounded-full mb-4"></div>
                      <div className="h-8 w-48 bg-gradient-to-r from-[#8A2BE2]/20 to-[#4169E1]/20 rounded-lg mb-6"></div>
                      <div className="flex-1 grid grid-cols-3 gap-4">
                        {[...Array(9)].map((_, i) => (
                          <div key={i} className="bg-white/5 rounded-lg p-4 flex flex-col gap-2">
                            <div className="h-2 w-12 bg-white/10 rounded-full"></div>
                            <div className="h-2 w-16 bg-white/5 rounded-full"></div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        <footer className="py-6 px-4 sm:px-6 mt-12 sm:mt-24">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500">
            <div className="text-center sm:text-left">{t('footer.copyright')}</div>
            <div className="flex gap-6">
              <a href="#" className="hover:text-white transition-colors">Política de Privacidad</a>
              <a href="#" className="hover:text-white transition-colors">Términos de Uso</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;