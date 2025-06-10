interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'light' | 'dark' | 'gradient' | 'text-only';
  showBeta?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'text-lg',
  md: 'text-xl',
  lg: 'text-2xl', 
  xl: 'text-3xl'
};

const iconSizes = {
  sm: 'w-5 h-5',
  md: 'w-6 h-6', 
  lg: 'w-7 h-7',
  xl: 'w-8 h-8'
};

export function Logo({ 
  size = 'lg', 
  variant = 'gradient', 
  showBeta = false, 
  className = '' 
}: LogoProps) {
  const getTextClasses = () => {
    switch (variant) {
      case 'light':
        return 'text-white';
      case 'dark':
        return 'text-gray-900 dark:text-gray-100';
      case 'text-only':
        return 'bg-gradient-to-r from-[#8A2BE2] to-[#4169E1] bg-clip-text text-transparent';
      case 'gradient':
      default:
        return 'bg-gradient-to-r from-[#4A148C] via-[#6A1B9A] to-[#8A2BE2] bg-clip-text text-transparent';
    }
  };

  const getIconClasses = () => {
    switch (variant) {
      case 'light':
        return 'text-white';
      case 'dark':
        return 'text-gray-900 dark:text-gray-100';
      case 'gradient':
      default:
        return 'text-[#6A1B9A]';
    }
  };

  return (
    <div className={`flex items-center gap-2 group cursor-pointer ${className}`}>
      {/* Custom RUDO Icon - Stylized dumbbell/strength symbol */}
      {variant !== 'text-only' && (
        <div className={`${iconSizes[size]} ${getIconClasses()} relative transition-all duration-300 group-hover:scale-110 group-hover:drop-shadow-lg`}>
          <svg
            viewBox="0 0 32 32"
            fill="none"
            className="w-full h-full filter group-hover:drop-shadow-md"
          >
            {/* Outer weights */}
            <rect x="2" y="10" width="6" height="12" rx="2" fill="currentColor" className="transition-all duration-300" />
            <rect x="24" y="10" width="6" height="12" rx="2" fill="currentColor" className="transition-all duration-300" />
            
            {/* Inner weights */}
            <rect x="7" y="12" width="4" height="8" rx="1" fill="currentColor" className="transition-all duration-300" />
            <rect x="21" y="12" width="4" height="8" rx="1" fill="currentColor" className="transition-all duration-300" />
            
            {/* Bar with gradient effect */}
            <rect x="10" y="15" width="12" height="2" rx="1" fill="currentColor" className="transition-all duration-300" />
            
            {/* Central grip */}
            <rect x="13" y="14" width="6" height="4" rx="2" fill="currentColor" fillOpacity="0.8" className="transition-all duration-300 group-hover:fill-opacity-100" />
            
            {/* Decorative accents */}
            <circle cx="5" cy="13" r="1" fill="currentColor" fillOpacity="0.6" className="transition-all duration-300 group-hover:fill-opacity-80" />
            <circle cx="5" cy="19" r="1" fill="currentColor" fillOpacity="0.6" className="transition-all duration-300 group-hover:fill-opacity-80" />
            <circle cx="27" cy="13" r="1" fill="currentColor" fillOpacity="0.6" className="transition-all duration-300 group-hover:fill-opacity-80" />
            <circle cx="27" cy="19" r="1" fill="currentColor" fillOpacity="0.6" className="transition-all duration-300 group-hover:fill-opacity-80" />
          </svg>
        </div>
      )}
      
      {/* RUDO Text with enhanced styling */}
      <span className={`font-black tracking-tighter ${sizeClasses[size]} ${getTextClasses()} transition-all duration-300 group-hover:tracking-wide ${variant === 'gradient' ? 'group-hover:drop-shadow-sm' : ''}`}>
        RUDO
      </span>
      
      {/* Beta Badge */}
      {showBeta && (
        <span className="ml-2 px-2 py-1 text-xs font-semibold text-white bg-gradient-to-r from-[#8A2BE2] to-[#4169E1] rounded shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:scale-105">
          BETA
        </span>
      )}
    </div>
  );
}