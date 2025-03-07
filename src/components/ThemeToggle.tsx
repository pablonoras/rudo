import { Moon, Sun } from 'lucide-react';
import { useThemeStore } from '../stores/theme';
import { cn } from '../lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'rounded-lg p-2 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors',
        className
      )}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="h-5 w-5 text-gray-100" />
      ) : (
        <Moon className="h-5 w-5 text-gray-800" />
      )}
    </button>
  );
}