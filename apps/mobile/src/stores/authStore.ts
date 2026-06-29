// src/stores/authStore.ts
import { create } from 'zustand';
import type { User } from '@/types';
import { setAccessToken, storeRefreshToken, clearTokens, getStoredRefreshToken } from '@/api/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,

  setAuth: async (user, accessToken, refreshToken) => {
    setAccessToken(accessToken);
    await storeRefreshToken(refreshToken);
    set({ user, isAuthenticated: true });
  },

  logout: async () => {
    await clearTokens();
    set({ user: null, isAuthenticated: false });
  },

  initialize: async () => {
    // Check if refresh token exists in SecureStore
    // If yes, the API client will auto-refresh on first 401
    const refreshToken = await getStoredRefreshToken();
    set({ isAuthenticated: !!refreshToken, isInitialized: true });
  },
}));
