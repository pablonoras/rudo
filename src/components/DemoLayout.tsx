/**
 * src/components/DemoLayout.tsx
 * 
 * A layout wrapper for the demo section of the application.
 * It provides visual indicators to show users they are in demo mode.
 */

import { ArrowLeft } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { DemoUserSettings } from './DemoUserSettings';
import { GlobalSearch } from './GlobalSearch';
import { ThemeToggle } from './ui/ThemeToggle';

export function DemoLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Demo banner */}
      <div className="bg-amber-500 dark:bg-amber-600 text-amber-950 dark:text-amber-50 p-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-sm">
          <div className="flex items-center mb-2 sm:mb-0">
            <span className="font-medium">
              Demo Mode - Sample data for testing purposes
            </span>
          </div>
          <Link 
            to="/coach" 
            className="flex items-center text-amber-900 dark:text-amber-50 hover:underline"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to your dashboard
          </Link>
        </div>
      </div>
      
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/demo" className="flex items-center">
                <span className="text-2xl font-black tracking-wider text-gray-900 dark:text-gray-100">
                  RUDO
                </span>
                <span className="ml-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                  DEMO
                </span>
              </Link>
              <div className="ml-8 flex space-x-4">
                <Link
                  to="/demo"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/demo'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  to="/demo/programs"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname.includes('/demo/program')
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  Programs
                </Link>
                <Link
                  to="/demo/athletes"
                  className={`px-3 py-2 rounded-md text-sm font-medium ${
                    location.pathname === '/demo/athletes'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                  }`}
                >
                  Athletes
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <GlobalSearch />
              <ThemeToggle />
              <DemoUserSettings />
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
} 