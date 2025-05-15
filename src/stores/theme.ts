/**
 * src/stores/theme.ts
 * 
 * Theme store for managing light and dark mode.
 * Uses localStorage to persist theme preference.
 */

import { create } from 'zustand';

type Theme = 'light' | 'dark';

interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

// Initialize theme from localStorage or system preference
const getInitialTheme = (): Theme => {
  // Check if theme is saved in localStorage
  const savedTheme = localStorage.getItem('theme') as Theme;
  if (savedTheme === 'light' || savedTheme === 'dark') {
    return savedTheme;
  }
  
  // Otherwise, check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  // Default to light
  return 'light';
};

// Apply theme to document
const applyTheme = (theme: Theme) => {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

export const useTheme = create<ThemeStore>((set) => {
  const initialTheme = getInitialTheme();
  
  // Apply initial theme
  applyTheme(initialTheme);
  
  return {
    theme: initialTheme,
    toggleTheme: () => {
      set((state) => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
        return { theme: newTheme };
      });
    },
    setTheme: (theme) => {
      localStorage.setItem('theme', theme);
      applyTheme(theme);
      set({ theme });
    },
  };
});