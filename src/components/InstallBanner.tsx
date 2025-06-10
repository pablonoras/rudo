import { Download, Smartphone, X, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

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
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');
  const [showAnimation, setShowAnimation] = useState(false);

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
    // Check if running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInWebAppiOS = (window.navigator as any).standalone === true;
    
    if (isStandalone || isInWebAppiOS) {
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
      
      // Trigger animation after a short delay
      setTimeout(() => setShowAnimation(true), 500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS devices, show manual install instructions
    if (platform === 'ios' && !isInWebAppiOS) {
      setShowBanner(true);
      setTimeout(() => setShowAnimation(true), 500);
    }

    // Show for Android devices without install prompt after 30 seconds of activity
    if (platform === 'android') {
      const timer = setTimeout(() => {
        if (!deferredPrompt && !isInstalled) {
          setShowBanner(true);
          setTimeout(() => setShowAnimation(true), 500);
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

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setShowBanner(false);
        setDeferredPrompt(null);
        // Track successful install
        console.log('PWA installed successfully');
      }
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowAnimation(false);
    localStorage.setItem('pwa-banner-dismissed', new Date().toISOString());
    // Track dismissal
    console.log('PWA banner dismissed');
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
          buttonText: 'Show me how',
          icon: <Smartphone className="h-5 w-5" />,
          benefits: ['Faster loading', 'Offline access', 'Native app feel']
        };
      case 'android':
        return {
          title: '🚀 Install RUDO App',
          description: 'Get the full app experience with faster loading and offline access.',
          buttonText: 'Install now',
          icon: <Download className="h-5 w-5" />,
          benefits: ['Instant loading', 'Works offline', 'Home screen access']
        };
      case 'desktop':
        return {
          title: '💪 Install RUDO',
          description: 'Get desktop app with better performance and offline capability.',
          buttonText: 'Install app',
          icon: <Download className="h-5 w-5" />,
          benefits: ['Desktop notifications', 'Faster access', 'Works offline']
        };
      default:
        return {
          title: '⭐ Get the RUDO App',
          description: 'Enhanced experience with better performance and offline access.',
          buttonText: 'Install',
          icon: <Download className="h-5 w-5" />,
          benefits: ['Better performance', 'Offline access', 'Quick launch']
        };
    }
  };

  const { title, description, buttonText, icon, benefits } = getInstallText();

  return (
    <div className={`
      bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 
      text-white rounded-xl p-4 mb-6 shadow-xl border border-white/20
      transform transition-all duration-700 ease-out
      ${showAnimation ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-4 opacity-80 scale-95'}
      ${className}
    `}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-1 p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold mb-1 leading-tight">{title}</h3>
            <p className="text-sm opacity-95 leading-relaxed mb-3">{description}</p>
            
            {/* Benefits list */}
            <div className="flex flex-wrap gap-2 mb-4">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="flex items-center text-xs bg-white/20 rounded-full px-2 py-1 backdrop-blur-sm"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              {platform === 'ios' ? (
                <button
                  onClick={() => {
                    // Enhanced iOS install instructions
                    const instructions = `To install RUDO on your iPhone/iPad:

1. Tap the Share button (□↗) at the bottom of Safari
2. Scroll down and tap "Add to Home Screen"
3. Tap "Add" to confirm
4. The RUDO app will appear on your home screen!

Benefits:
✓ Faster loading times
✓ Works offline
✓ Native app experience`;
                    
                    alert(instructions);
                  }}
                  className="inline-flex items-center justify-center px-4 py-2.5 bg-white/25 hover:bg-white/35 rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 backdrop-blur-sm"
                >
                  {icon}
                  <span className="ml-2">{buttonText}</span>
                </button>
              ) : (
                <button
                  onClick={handleInstallClick}
                  disabled={!deferredPrompt && platform !== 'android'}
                  className="inline-flex items-center justify-center px-4 py-2.5 bg-white/25 hover:bg-white/35 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95 backdrop-blur-sm"
                >
                  {icon}
                  <span className="ml-2">{buttonText}</span>
                </button>
              )}
              
              <button
                onClick={handleDismiss}
                className="inline-flex items-center justify-center px-4 py-2.5 text-sm font-medium text-white/90 hover:text-white transition-colors"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 ml-2 p-1.5 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm"
          aria-label="Dismiss install banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
} 