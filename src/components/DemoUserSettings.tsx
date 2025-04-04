/**
 * src/components/DemoUserSettings.tsx
 * 
 * A mock version of UserSettings component that displays sample user data in demo mode.
 * This ensures no real user data is displayed in the demo view.
 */

import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Settings,
  LogOut,
  ChevronDown,
  Bell,
  Shield,
  HelpCircle,
} from 'lucide-react';

export function DemoUserSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Sample demo data
  const demoProfile = {
    id: 'demo-coach-id',
    full_name: 'Alex Rodriguez',
    email: 'alex.coach@example.com',
    role: 'coach',
    avatar_url: 'https://randomuser.me/api/portraits/men/32.jpg'
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = () => {
    navigate('/');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center mr-2">
        <span className="text-sm text-gray-700 dark:text-gray-300 mr-2 hidden md:block">
          {demoProfile.email}
        </span>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="User menu"
        >
          <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
            <img 
              src={demoProfile.avatar_url} 
              alt={demoProfile.full_name} 
              className="h-full w-full object-cover"
            />
          </div>
          <ChevronDown className="h-4 w-4 text-gray-500 dark:text-gray-400" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {demoProfile.full_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {demoProfile.email}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Role: {demoProfile.role}
            </p>
            <div className="mt-2 px-2 py-1 bg-amber-100 dark:bg-amber-900/30 rounded text-xs text-amber-800 dark:text-amber-200">
              Demo Account
            </div>
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
              Exit Demo
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 