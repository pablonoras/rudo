/**
 * src/components/PWAInstallPrompt.tsx
 * 
 * PWA Install Prompt component that shows a banner encouraging users to install the app.
 * Handles the browser's beforeinstallprompt event and provides install functionality.
 */

import { Download, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check if app is already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    if (isStandalone || isIOSStandalone) {
      return; // Already installed, don't show prompt
    }

    // Check if user has previously dismissed the prompt
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissedDate = dismissed ? new Date(dismissed) : null;
    const daysSinceDismissed = dismissedDate ? 
      (Date.now() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24) : null;
    
    // Don't show if dismissed within last 7 days
    if (daysSinceDismissed && daysSinceDismissed < 7) {
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a short delay (better UX)
      setTimeout(() => {
        setShowPrompt(true);
      }, 2000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    
    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      
      // Wait for the user's response
      const choiceResult = await deferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        localStorage.setItem('pwa-installed', 'true');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      // Clean up
      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('Error during installation:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal date
    localStorage.setItem('pwa-install-dismissed', new Date().toISOString());
  };

  // Check if we should show the prompt (mobile only)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (!showPrompt || !deferredPrompt || !isMobile) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4 mx-2 md:mx-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-blue-100 dark:bg-blue-900/50">
              <Download className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100">
              Install RUDO App
            </h3>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Get quick access to your workouts and track progress offline
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleInstall}
            disabled={isInstalling}
            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isInstalling ? (
              <>
                <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent mr-1" />
                Installing...
              </>
            ) : (
              <>
                <Download className="h-3 w-3 mr-1" />
                Install
              </>
            )}
          </button>
          <button
            onClick={handleDismiss}
            className="inline-flex items-center p-1 rounded-md text-blue-400 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
} 