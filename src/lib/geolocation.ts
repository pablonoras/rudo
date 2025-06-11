interface LocationData {
  country: string;
  country_code: string;
  region?: string;
  city?: string;
}

// List of Spanish-speaking countries (ISO 3166-1 alpha-2 codes)
const SPANISH_SPEAKING_COUNTRIES = [
  'ES', // Spain
  'AR', // Argentina
  'MX', // Mexico
  'CO', // Colombia
  'PE', // Peru
  'VE', // Venezuela
  'CL', // Chile
  'EC', // Ecuador
  'BO', // Bolivia
  'PY', // Paraguay
  'UY', // Uruguay
  'CR', // Costa Rica
  'PA', // Panama
  'NI', // Nicaragua
  'HN', // Honduras
  'GT', // Guatemala
  'SV', // El Salvador
  'DO', // Dominican Republic
  'CU', // Cuba
  'PR', // Puerto Rico
  'GQ', // Equatorial Guinea
];

export const detectUserLocation = async (): Promise<LocationData | null> => {
  try {
    // Try multiple IP geolocation services as fallbacks
    const services = [
      'https://ipapi.co/json/',
      'https://api.ipify.org?format=json', // Fallback service
      'https://httpbin.org/ip' // Another fallback
    ];

    for (const service of services) {
      try {
        const response = await fetch(service, {
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) continue;
        
        const data = await response.json();
        
        // Handle different API response formats
        if (service.includes('ipapi.co')) {
          return {
            country: data.country_name || 'Unknown',
            country_code: data.country_code || 'US',
            region: data.region,
            city: data.city,
          };
        }
        // For other services, we'd need to make additional calls
        // For now, just handle ipapi.co as it provides country info directly
        
      } catch (serviceError) {
        console.warn(`Failed to fetch from ${service}:`, serviceError);
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error detecting user location:', error);
    return null;
  }
};

export const isSpanishSpeakingCountry = (countryCode: string): boolean => {
  return SPANISH_SPEAKING_COUNTRIES.includes(countryCode.toUpperCase());
};

export const getDefaultLanguage = async (): Promise<'en' | 'es'> => {
  try {
    // Check if we already have a cached result
    const cachedLanguage = sessionStorage.getItem('detected_language');
    if (cachedLanguage && ['en', 'es'].includes(cachedLanguage)) {
      return cachedLanguage as 'en' | 'es';
    }

    // Detect user location
    const location = await detectUserLocation();
    
    if (location && location.country_code) {
      const defaultLang = isSpanishSpeakingCountry(location.country_code) ? 'es' : 'en';
      
      // Cache the result for the session
      sessionStorage.setItem('detected_language', defaultLang);
      sessionStorage.setItem('detected_country', location.country_code);
      
      return defaultLang;
    }
    
    // Fallback to browser language detection
    const browserLang = navigator.language.toLowerCase();
    const fallbackLang = browserLang.startsWith('es') ? 'es' : 'en';
    
    sessionStorage.setItem('detected_language', fallbackLang);
    return fallbackLang;
    
  } catch (error) {
    console.error('Error getting default language:', error);
    // Final fallback to browser language
    const browserLang = navigator.language.toLowerCase();
    return browserLang.startsWith('es') ? 'es' : 'en';
  }
}; 