// src/store/useTheme.ts
import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggleTheme: () => void;
}

/** 读取本地主题偏好，移到 create 回调内避免模块级副作用 */
const getInitialTheme = (): boolean => {
  try {
    const stored = localStorage.getItem('beike_theme');
    if (stored === 'dark') {
      document.documentElement.classList.add('dark');
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

export const useTheme = create<ThemeState>((set) => ({
  isDark: getInitialTheme(),

  toggleTheme: () =>
    set((state) => {
      const newIsDark = !state.isDark;
      try {
        localStorage.setItem('beike_theme', newIsDark ? 'dark' : 'light');
      } catch { /* 静默忽略 localStorage 不可用的情况 */ }
      document.documentElement.classList.toggle('dark', newIsDark);
      return { isDark: newIsDark };
    }),
}));
