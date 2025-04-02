import {
  ArrowRight,
  ClipboardCheck,
  Clock,
  Computer,
  Dumbbell,
  Menu,
  MessageSquare,
  Trophy,
  Users,
  X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import OptimizedImage from './OptimizedImage';

// Hero background images
const HERO_BG = {
  MOBILE: 'https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?auto=format&fit=crop&w=768&q=80',
  DESKTOP: 'https://images.unsplash.com/photo-1534367610401-9f5ed68180aa?auto=format&fit=crop&w=2070&q=80',
};

// Base Components
const PainPoint = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="p-6 sm:p-8 rounded-2xl transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1 backdrop-blur-xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:shadow-[0_12px_32px_-1px_rgba(0,0,0,0.2),0_0_1px_0_rgba(0,0,0,0.1)] shadow-[0_4px_24px_-1px_rgba(0,0,0,0.1),0_0_1px_0_rgba(0,0,0,0.05)]">
    <div className="text-purple-400 mb-4 sm:mb-6">{icon}</div>
    <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">{title}</h3>
    <p className="text-gray-400 text-sm sm:text-base leading-relaxed">{description}</p>
  </div>
);

const Feature = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="p-6 sm:p-8 rounded-2xl transition-all duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] hover:-translate-y-1 backdrop-blur-xl bg-white/5 border border-white/10 hover:border-purple-500/50 hover:shadow-[0_12px_32px_-1px_rgba(0,0,0,0.2),0_0_1px_0_rgba(0,0,0,0.1)] shadow-[0_4px_24px_-1px_rgba(0,0,0,0.1),0_0_1px_0_rgba(0,0,0,0.05)]">
    <div className="text-purple-400 mb-4 sm:mb-6">{icon}</div>
    <h3 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">{title}</h3>
    <p className="text-gray-400 text-sm sm:text-base leading-relaxed">{description}</p>
  </div>
);

const LandingPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Background with responsive images */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 md:hidden">
          <OptimizedImage
            src={HERO_BG.MOBILE}
            alt="Hero background mobile"
            width={768}
            height={1024}
            priority
            className="w-full h-full object-cover"
          />
        </div>
        <div className="absolute inset-0 hidden md:block">
          <OptimizedImage
            src={HERO_BG.DESKTOP}
            alt="Hero background desktop"
            width={2070}
            height={1380}
            priority
            className="w-full h-full object-cover"
          />
        </div>
        <div 
          className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/80 to-black"
          style={{
            background: `
              radial-gradient(circle at top right, 
                rgba(139, 92, 246, 0.15),
                rgba(0, 0, 0, 0) 50%),
              radial-gradient(circle at bottom left, 
                rgba(59, 130, 246, 0.15),
                rgba(0, 0, 0, 0) 50%),
              linear-gradient(to bottom, 
                rgba(0, 0, 0, 0.7),
                rgba(0, 0, 0, 0.9) 50%,
                rgba(0, 0, 0, 1)
              )
            `
          }}
        />
      </div>
      
      {/* Navbar */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-black/80 backdrop-blur-md py-4' : 'bg-transparent py-6'
      }`}>
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="flex items-center justify-between">
            <div className="text-2xl sm:text-3xl font-black tracking-tighter">RUDO</div>
            
            {/* Mobile menu button */}
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>

            {/* Desktop CTA */}
            <Link 
              to="/choose-role"
              className="hidden lg:block bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-full font-medium transition-all duration-300 border border-white/20"
            >
              Sign In
            </Link>
          </div>

          {/* Mobile menu */}
          <div className={`lg:hidden ${isMenuOpen ? 'block' : 'hidden'} pt-4`}>
            <Link 
              to="/choose-role"
              className="block w-full text-center bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-2 rounded-full font-medium transition-all duration-300 border border-white/20"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-grow relative z-10">
        {/* Hero */}
        <header className="min-h-screen flex items-center">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl pt-32">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 sm:mb-8 bg-gradient-to-r from-white via-purple-300 to-blue-300 inline-block text-transparent bg-clip-text leading-tight">
                Tu Box Merece una Experiencia Digital de Primer Nivel
              </h1>
              <p className="text-lg sm:text-xl lg:text-2xl mb-8 sm:mb-12 text-gray-300 max-w-3xl mx-auto leading-relaxed">
                Porque sabemos que el verdadero espíritu del CrossFit está en la comunidad,
                no en las hojas de cálculo.
              </p>
              <Link 
                to="/choose-role"
                className="group inline-flex items-center bg-white text-black px-8 sm:px-10 py-4 sm:py-5 rounded-full font-bold text-lg sm:text-xl hover:bg-purple-600 hover:text-white transition-all duration-300"
              >
                Descubre RUDO
                <ArrowRight className="ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </header>

        {/* Pain Points */}
        <section className="py-20 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-12 sm:mb-16">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 inline-block text-transparent bg-clip-text">
                Entendemos Tus Desafíos
              </span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
              <PainPoint 
                icon={<Clock className="w-8 h-8 sm:w-10 sm:h-10" />}
                title="¿Cansado de Perder Tiempo?"
                description="Sabemos que pasas horas programando en Excel, enviando WhatsApps uno por uno, y tratando de coordinar los horarios."
              />
              <PainPoint 
                icon={<ClipboardCheck className="w-8 h-8 sm:w-10 sm:h-10" />}
                title="¿Frustrado con el Seguimiento?"
                description="Los atletas pierden sus registros, los PRs se olvidan, y es imposible ver el progreso real."
              />
              <PainPoint 
                icon={<Computer className="w-8 h-8 sm:w-10 sm:h-10" />}
                title="¿Software Obsoleto?"
                description="Las plataformas actuales son lentas, complicadas y no están pensadas para Latinoamérica."
              />
            </div>
          </div>
        </section>

        {/* Core Features */}
        <section className="py-20 sm:py-32 bg-black/50">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-12 sm:mb-16">
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 inline-block text-transparent bg-clip-text">
                Soluciones Diseñadas para Tu Box
              </span>
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-10">
              <Feature
                icon={<Dumbbell className="w-8 h-8 sm:w-10 sm:h-10" />}
                title="Programación Inteligente"
                description="Simplifica la programación de tus WODs y el seguimiento de tus atletas."
              />
              <Feature
                icon={<Users className="w-8 h-8 sm:w-10 sm:h-10" />}
                title="Gestión de Membresías"
                description="Control total de tus membresías y pagos de forma automatizada."
              />
              <Feature
                icon={<MessageSquare className="w-8 h-8 sm:w-10 sm:h-10" />}
                title="Comunicación Efectiva"
                description="Mantén a tu comunidad conectada con notificaciones automáticas."
              />
              <Feature
                icon={<Trophy className="w-8 h-8 sm:w-10 sm:h-10" />}
                title="Comunidad & Competencia"
                description="Impulsa el espíritu competitivo con rankings y desafíos."
              />
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20 sm:py-32">
          <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white/5 border border-white/10 rounded-2xl sm:rounded-3xl p-8 sm:p-12 text-center backdrop-blur-sm">
                <h2 className="text-3xl sm:text-4xl font-bold mb-4 sm:mb-6">
                  El Futuro de tu Box Comienza Hoy
                </h2>
                <p className="text-lg sm:text-xl text-gray-400 mb-6 sm:mb-8 leading-relaxed">
                  Accede a tu cuenta y comienza a transformar tu box con RUDO
                </p>
                <Link 
                  to="/choose-role"
                  className="inline-block bg-white hover:bg-purple-600 text-black hover:text-white font-bold px-8 sm:px-10 py-4 sm:py-5 rounded-full transition-all duration-300 text-lg"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 sm:py-12 border-t border-white/10 mt-auto">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-xl sm:text-2xl font-black tracking-tighter">RUDO</div>
            <div className="text-sm sm:text-base text-gray-400">
              © 2025 Rudo. Construyendo el futuro del fitness.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;