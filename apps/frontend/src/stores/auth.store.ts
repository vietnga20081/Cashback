import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../services/api';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  avatar?: string;
  roleId: number;
  referralCode?: string;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  setToken: (token: string) => void;
  logout: () => void;
  updateUser: (data: Partial<AuthUser>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, accessToken) => {
        set({ user, accessToken, isAuthenticated: true });
        api.defaults.headers.Authorization = `Bearer ${accessToken}`;
      },

      setToken: (accessToken) => {
        set({ accessToken });
        api.defaults.headers.Authorization = `Bearer ${accessToken}`;
      },

      logout: () => {
        set({ user: null, accessToken: null, isAuthenticated: false });
        delete api.defaults.headers.Authorization;
      },

      updateUser: (data) => {
        const current = get().user;
        if (current) set({ user: { ...current, ...data } });
      },
    }),
    {
      name: 'greencash-auth',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken) {
          api.defaults.headers.Authorization = `Bearer ${state.accessToken}`;
        }
      },
    }
  )
);
