import { Download, Monitor, Smartphone, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useI18n } from '../lib/i18n/context';

interface InstallBannerProps {
  className?: string;
}

export function InstallBanner({ className = '' }: InstallBannerProps) {
  const { t } = useI18n();
  const [showBanner, setShowBanner] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');

  useEffect(() => {
    // Check if already in PWA mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
    
    // Don't show if already running as PWA
    if (isStandalone || isInWebAppiOS || isMinimalUI) {
      return;
    }

    // Check if previously dismissed (within last 7 days)
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      if (dismissedDate > weekAgo) {
        return;
      }
    }

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    let detectedPlatform: typeof platform = 'unknown';
    
    if (/iphone|ipad|ipod/.test(userAgent)) {
      detectedPlatform = 'ios';
    } else if (/android/.test(userAgent)) {
      detectedPlatform = 'android';
    } else if (window.navigator.platform.includes('Win') || 
               window.navigator.platform.includes('Mac') || 
               window.navigator.platform.includes('Linux')) {
      detectedPlatform = 'desktop';
    }
    
    setPlatform(detectedPlatform);

    // Show banner after a short delay for mobile devices
    if (detectedPlatform === 'ios' || detectedPlatform === 'android') {
      const timer = setTimeout(() => {
        setShowBanner(true);
      }, 5000); // 5 seconds delay
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', new Date().toISOString());
  };

  if (!showBanner) {
    return null;
  }

  const getBannerContent = () => {
    switch (platform) {
      case 'ios':
        return {
          title: t('pwa-add-to-home'),
          description: t('pwa-ios-description'),
          icon: <Smartphone className="h-4 w-4" />
        };
      case 'android':
        return {
          title: t('pwa-install-app'),
          description: t('pwa-android-description'),
          icon: <Download className="h-4 w-4" />
        };
      case 'desktop':
        return {
          title: t('pwa-install-desktop'),
          description: t('pwa-desktop-description'),
          icon: <Monitor className="h-4 w-4" />
        };
      default:
        return {
          title: t('pwa-install-generic'),
          description: t('pwa-generic-description'),
          icon: <Download className="h-4 w-4" />
        };
    }
  };

  const { title, description, icon } = getBannerContent();

  return (
    <div className={`bg-gradient-to-r from-[#8A2BE2]/10 to-[#4169E1]/10 border border-[#8A2BE2]/20 rounded-lg p-3 mb-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 p-2 bg-[#8A2BE2]/20 rounded-lg">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {title}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            {description}
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
} 