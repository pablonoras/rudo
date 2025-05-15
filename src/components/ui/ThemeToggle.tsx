/**
 * src/components/ui/ThemeToggle.tsx
 * 
 * Theme toggle component for switching between light and dark mode.
 * Updated to use a more modern design and smooth transitions.
 */

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../stores/theme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
} 