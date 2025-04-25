/**
 * src/components/UserSettings.tsx
 * 
 * Component for displaying user settings and profile information.
 * Shows user avatar, name, email and provides dropdown menu for account actions.
 */

import {
    Bell,
    ChevronDown,
    HelpCircle,
    Loader2,
    LogOut,
    Settings,
    Shield,
    User,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '../contexts/ProfileContext';
import { signOut } from '../lib/supabase';

export function UserSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { profile, loading } = useProfile();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset image error state when profile changes
  useEffect(() => {
    if (profile) {
      setImgError(false);
    }
  }, [profile]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleImageError = () => {
    setImgError(true);
  };

  // Truncate email if too long for display
  const displayEmail = profile?.email && profile.email.length > 20
    ? `${profile.email.substring(0, 17)}...`
    : profile?.email;

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center mr-2">
        {loading ? (
          <span className="text-sm text-gray-500 dark:text-gray-400 mr-2">
            <Loader2 className="h-4 w-4 animate-spin" />
          </span>
        ) : profile?.email ? (
          <span className="text-sm text-gray-700 dark:text-gray-300 mr-2 hidden md:block">
            {displayEmail}
          </span>
        ) : null}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="User menu"
        >
          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
            {profile?.avatar_url && !imgError ? (
              <img 
                src={profile.avatar_url} 
                alt={profile.full_name || 'User'} 
                className="h-full w-full object-cover"
                onError={handleImageError}
              />
            ) : (
              <User className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            )}
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3 mb-2">
              <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                {profile?.avatar_url && !imgError ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name || 'User'} 
                    className="h-full w-full object-cover"
                    onError={handleImageError}
                  />
                ) : (
                  <User className="h-6 w-6 text-gray-500 dark:text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {profile?.full_name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {profile?.email || 'No email available'}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Role: {profile?.role || 'Unknown'}
            </p>
          </div>

          <div className="py-1">
            <button
              className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            >
              <Settings className="h-4 w-4 mr-3" />
              Settings
            </button>
            <button
              className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            >
              <Bell className="h-4 w-4 mr-3" />
              Notifications
            </button>
            <button
              className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            >
              <Shield className="h-4 w-4 mr-3" />
              Privacy
            </button>
            <button
              className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            >
              <HelpCircle className="h-4 w-4 mr-3" />
              Help Center
            </button>
          </div>

          <div className="py-1 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSignOut}
              className="w-full px-4 py-2 text-sm text-left text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
            >
              <LogOut className="h-4 w-4 mr-3" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}