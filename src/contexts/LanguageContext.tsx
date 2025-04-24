import React, { createContext, ReactNode, useContext, useState } from 'react';

// Define available languages
export type Language = 'en' | 'es';

// Language context type
type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
};

// Create the context with default values
const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: () => '',
});

// Translation dictionary
const translations = {
  // Landing page translations
  en: {
    // Navbar
    'signin': 'Sign In',
    'signin.athlete': 'Athlete',
    'signin.coach': 'Coach',
    
    // Hero section
    'hero.title': 'Your Box Deserves a First-Class Digital Experience',
    'hero.subtitle': 'Because we know that the true spirit of CrossFit is in the community, not in spreadsheets.',
    'hero.cta': 'Discover RUDO',
    
    // Pain points section
    'painpoints.title': 'We Understand Your Challenges',
    'painpoints.time.title': 'Tired of Wasting Time?',
    'painpoints.time.description': 'We know you spend hours programming in Excel, sending WhatsApps one by one, and trying to coordinate schedules.',
    'painpoints.tracking.title': 'Frustrated with Tracking?',
    'painpoints.tracking.description': 'Athletes lose their records, PRs are forgotten, and it\'s impossible to see real progress.',
    'painpoints.software.title': 'Outdated Software?',
    'painpoints.software.description': 'Current platforms are slow, complicated, and not designed for Latin America.',
    
    // Features section
    'features.title': 'Solutions Designed for Your Box',
    'features.programming.title': 'Intelligent Programming',
    'features.programming.description': 'Simplify your WOD programming and athlete tracking.',
    'features.membership.title': 'Membership Management',
    'features.membership.description': 'Complete control of your memberships and payments in an automated way.',
    'features.communication.title': 'Effective Communication',
    'features.communication.description': 'Keep your community connected with automatic notifications.',
    'features.community.title': 'Community & Competition',
    'features.community.description': 'Boost competitive spirit with rankings and challenges.',
    
    // Final CTA
    'cta.title': 'The Future of Your Box Starts Today',
    'cta.subtitle': 'Access your account and start transforming your box with RUDO',
    
    // Footer
    'footer.copyright': '© 2025 Rudo. Building the future of fitness.',
  },
  es: {
    // Navbar
    'signin': 'Iniciar Sesión',
    'signin.athlete': 'Atleta',
    'signin.coach': 'Coach',
    
    // Hero section
    'hero.title': 'Tu Box Merece una Experiencia Digital de Primer Nivel',
    'hero.subtitle': 'Porque sabemos que el verdadero espíritu del CrossFit está en la comunidad, no en las hojas de cálculo.',
    'hero.cta': 'Descubre RUDO',
    
    // Pain points section
    'painpoints.title': 'Entendemos Tus Desafíos',
    'painpoints.time.title': '¿Cansado de Perder Tiempo?',
    'painpoints.time.description': 'Sabemos que pasas horas programando en Excel, enviando WhatsApps uno por uno, y tratando de coordinar los horarios.',
    'painpoints.tracking.title': '¿Frustrado con el Seguimiento?',
    'painpoints.tracking.description': 'Los atletas pierden sus registros, los PRs se olvidan, y es imposible ver el progreso real.',
    'painpoints.software.title': '¿Software Obsoleto?',
    'painpoints.software.description': 'Las plataformas actuales son lentas, complicadas y no están pensadas para Latinoamérica.',
    
    // Features section
    'features.title': 'Soluciones Diseñadas para Tu Box',
    'features.programming.title': 'Programación Inteligente',
    'features.programming.description': 'Simplifica la programación de tus WODs y el seguimiento de tus atletas.',
    'features.membership.title': 'Gestión de Membresías',
    'features.membership.description': 'Control total de tus membresías y pagos de forma automatizada.',
    'features.communication.title': 'Comunicación Efectiva',
    'features.communication.description': 'Mantén a tu comunidad conectada con notificaciones automáticas.',
    'features.community.title': 'Comunidad & Competencia',
    'features.community.description': 'Impulsa el espíritu competitivo con rankings y desafíos.',
    
    // Final CTA
    'cta.title': 'El Futuro de tu Box Comienza Hoy',
    'cta.subtitle': 'Accede a tu cuenta y comienza a transformar tu box con RUDO',
    
    // Footer
    'footer.copyright': '© 2025 Rudo. Construyendo el futuro del fitness.',
  }
};

// Provider component
export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('en');

  // Translation function
  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook for using the language context
export const useLanguage = () => useContext(LanguageContext); 