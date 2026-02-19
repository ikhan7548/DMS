import { create } from 'zustand';

interface ThemeState {
  mode: 'light' | 'dark';
  primaryColor: string;
  toggleMode: () => void;
  setPrimaryColor: (color: string) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: (localStorage.getItem('themeMode') as 'light' | 'dark') || 'light',
  primaryColor: localStorage.getItem('primaryColor') || '#1565C0',

  toggleMode: () =>
    set((state) => {
      const newMode = state.mode === 'light' ? 'dark' : 'light';
      localStorage.setItem('themeMode', newMode);
      return { mode: newMode };
    }),

  setPrimaryColor: (color: string) => {
    localStorage.setItem('primaryColor', color);
    set({ primaryColor: color });
  },
}));
