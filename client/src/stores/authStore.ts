import { create } from 'zustand';
import api from '../lib/api';

interface User {
  id: number;
  username: string;
  displayName: string;
  role: string;
  staffId: number | null;
  language: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  login: async (username: string, pin: string) => {
    try {
      set({ error: null, isLoading: true });
      const { data } = await api.post('/auth/login', { username, pin });
      if (data.success) {
        set({
          user: {
            id: data.user.id,
            username: data.user.username,
            displayName: data.user.display_name,
            role: data.user.role,
            staffId: data.user.staff_id,
            language: data.user.language,
          },
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      } else {
        set({ error: data.error || 'Login failed', isLoading: false });
        return false;
      }
    } catch (err: any) {
      set({ error: err.response?.data?.error || 'Login failed', isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    set({ user: null, isAuthenticated: false, isLoading: false });
  },

  checkSession: async () => {
    try {
      set({ isLoading: true });
      const { data } = await api.get('/auth/session');
      if (data.authenticated) {
        set({
          user: {
            id: data.user.id,
            username: data.user.username,
            displayName: data.user.display_name,
            role: data.user.role,
            staffId: data.user.staff_id,
            language: data.user.language,
          },
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ user: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
