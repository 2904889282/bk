// src/store/useTheme.ts
import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

export const useTheme = create<ThemeState>((set) => ({
  isDark: localStorage.getItem('beike_theme') === 'dark',

  toggleTheme: () =>
    set((state) => {
      const newIsDark = !state.isDark;
      localStorage.setItem('beike_theme', newIsDark ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', newIsDark);
      return { isDark: newIsDark };
    }),
}));

// 初始化时同步一次 body class
if (localStorage.getItem('beike_theme') === 'dark') {
  document.documentElement.classList.add('dark');
}
