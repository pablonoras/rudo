import { Dumbbell } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useI18n } from '../lib/i18n/context';
import { GlobalSearch } from './GlobalSearch';
import { LanguageSwitcher } from './ui/LanguageSwitcher';
import { ThemeToggle } from './ui/ThemeToggle';
import { UserSettings } from './UserSettings';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isCoach = location.pathname.startsWith('/coach');
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-white dark:from-[#161616] dark:to-[#1A1A1A] text-gray-900 dark:text-white transition-colors">
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1A1A1A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center">
                <span className="text-2xl font-black tracking-wider text-gray-900 dark:text-gray-100">
                  RUDO
                </span>
                <span className="ml-2 px-2 py-1 text-xs font-semibold text-white bg-blue-600 rounded">BETA</span>
              </div>
              {isCoach && (
                <div className="ml-8 flex space-x-4">
                  <Link
                    to="/coach"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/coach'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    {t('dashboard')}
                  </Link>
                  <Link
                    to="/coach/programs"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname.includes('/coach/program')
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    {t('programs')}
                  </Link>
                  <Link
                    to="/coach/workouts"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/coach/workouts'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      <Dumbbell className="h-4 w-4 mr-1" />
                      {t('workouts')}
                    </div>
                  </Link>
                  <Link
                    to="/coach/athletes"
                    className={`px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/coach/athletes'
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                    }`}
                  >
                    {t('athletes')}
                  </Link>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-4">
              {isCoach && <GlobalSearch />}
              <LanguageSwitcher />
              <ThemeToggle />
              <UserSettings />
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