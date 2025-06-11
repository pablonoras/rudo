import { Download, Smartphone, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useI18n } from '../lib/i18n/context';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface InstallBannerProps {
  className?: string;
}

export function InstallBanner({ className = '' }: InstallBannerProps) {
  const { t } = useI18n();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
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

  // Check if already installed and setup event listeners
  useEffect(() => {
    // Check if running in standalone mode (already installed as PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    const isMinimalUI = window.matchMedia('(display-mode: minimal-ui)').matches;
    
    // If already installed as PWA, don't show the banner
    if (isStandalone || isInWebAppiOS || isMinimalUI) {
      setIsInstalled(true);
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

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS devices, show manual install instructions
    if (platform === 'ios' && !isInWebAppiOS) {
      setShowBanner(true);
    }

    // Show for Android devices without install prompt after 30 seconds of activity
    if (platform === 'android') {
      const timer = setTimeout(() => {
        if (!deferredPrompt && !isInstalled) {
          setShowBanner(true);
        }
      }, 30000);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [platform, deferredPrompt, isInstalled]);

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa-banner-dismissed', new Date().toISOString());
  };

  // Don't show banner if already installed or explicitly hidden
  if (isInstalled || !showBanner) {
    return null;
  }

  const getInstallText = () => {
    switch (platform) {
      case 'ios':
        return {
          title: '⚡ Add RUDO to your home screen',
          description: 'Get instant access to your workouts. Tap Share → "Add to Home Screen"',
          icon: <Smartphone className="h-5 w-5" />
        };
      case 'android':
        return {
          title: '🚀 Install RUDO App',
          description: 'Get the full app experience with faster loading and offline access.',
          icon: <Download className="h-5 w-5" />
        };
      case 'desktop':
        return {
          title: '💪 Install RUDO',
          description: 'Get desktop app with better performance and offline capability.',
          icon: <Download className="h-5 w-5" />
        };
      default:
        return {
          title: '⭐ Get the RUDO App',
          description: 'Enhanced experience with better performance and offline access.',
          icon: <Download className="h-5 w-5" />
        };
    }
  };

  const { title, description, icon } = getInstallText();

  return (
    <div className={`
      bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 
      text-white rounded-xl p-4 mb-6 shadow-xl border border-white/20
      transform transition-all duration-700 ease-out
      ${className}
    `}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 flex-1">
          <div className="flex-shrink-0 p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold mb-1 leading-tight">{title}</h3>
            <p className="text-sm opacity-95 leading-relaxed">{description}</p>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 ml-4 p-1.5 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
          aria-label="Dismiss install banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
} 