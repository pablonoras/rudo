import { Link, useLocation } from 'react-router-dom';
import { Dumbbell } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const isCoach = location.pathname.startsWith('/coach');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center">
                <Dumbbell className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                <span className="ml-2 text-xl font-bold text-gray-900 dark:text-gray-100">
                  CrossFit Coach
                </span>
              </Link>
              {isCoach && (
                <div className="ml-8 flex space-x-4">
                  <Link
                    to="/coach"
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/coach/calendar"
                    className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Calendar
                  </Link>
                </div>
              )}
            </div>
            <div className="flex items-center">
              <ThemeToggle />
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