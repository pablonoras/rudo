import { Smartphone, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useI18n } from '../lib/i18n/context';

interface InstallBannerProps {
  className?: string;
}

export function InstallBanner({ className = '' }: InstallBannerProps) {
  const { t } = useI18n();
  const [showBanner, setShowBanner] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');

  // Detect platform
  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else if (window.navigator.platform.includes('Win') || window.navigator.platform.includes('Mac') || window.navigator.platform.includes('Linux')) {
      setPlatform('desktop');
    }
  }, []);

  // Check if should show banner
  useEffect(() => {
    // Don't show if already running as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
    
    if (isStandalone || isInWebAppiOS || isMinimalUI) {
      return;
    }

    // Don't show in athlete dashboard (only show on landing page)
    if (window.location.pathname.includes('/athlete') || window.location.pathname.includes('/coach')) {
      return;
    }

    // Check if previously dismissed
    const dismissed = localStorage.getItem('pwa-banner-dismissed');
    const dismissedDate = dismissed ? new Date(dismissed) : null;
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    // Show again after a week
    if (dismissedDate && dismissedDate > weekAgo) {
      return;
    }

    // Show banner for mobile devices
    if (platform === 'ios' || platform === 'android') {
      setShowBanner(true);
    }
  }, [platform]);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', new Date().toISOString());
  };

  // Don't show banner if conditions not met
  if (!showBanner) {
    return null;
  }

  const getBannerContent = () => {
    switch (platform) {
      case 'ios':
        return {
          icon: <Smartphone className="h-4 w-4" />,
          text: t('pwa-ios-description')
        };
      case 'android':
        return {
          icon: <Zap className="h-4 w-4" />,
          text: t('pwa-android-description')
        };
      default:
        return {
          icon: <Zap className="h-4 w-4" />,
          text: t('pwa-generic-description')
        };
    }
  };

  const content = getBannerContent();

  return (
    <div className={`bg-gradient-to-r from-purple-600 to-blue-600 text-white p-3 rounded-lg shadow-lg border border-white/20 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          {content.icon}
          <span className="text-sm font-medium">{content.text}</span>
        </div>
        <button
          onClick={handleDismiss}
          className="text-white/80 hover:text-white transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
} 