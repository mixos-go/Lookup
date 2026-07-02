// src/stores/authStore.ts
import { create } from 'zustand';
import type { User } from '@/types';
import { setAccessToken, storeRefreshToken, clearTokens, getStoredRefreshToken } from '@/api/client';
import { authApi } from '@/api/auth';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isInitialized: false,

  setAuth: async (user, accessToken, refreshToken) => {
    setAccessToken(accessToken);
    await storeRefreshToken(refreshToken);
    set({ user, isAuthenticated: true, isInitialized: true });
  },

  logout: async () => {
    // Clear all tokens from storage
    await clearTokens();
    
    // Reset state
    set({ 
      user: null, 
      isAuthenticated: false,
      isInitialized: true  // Keep initialized as true so we don't show loading screen
    });
  },

  refreshAuth: async () => {
    try {
      const refreshToken = await getStoredRefreshToken();
      if (!refreshToken) {
        await get().logout();
        return;
      }

      const result = await authApi.refresh(refreshToken);
      
      setAccessToken(result.accessToken);
      await storeRefreshToken(result.refreshToken);
      
      set({ 
        user: result.user,
        isAuthenticated: true,
        isInitialized: true
      });
    } catch (error) {
      console.error('Failed to refresh auth:', error);
      await get().logout();
    }
  },

  initialize: async () => {
    try {
      const refreshToken = await getStoredRefreshToken();
      
      if (!refreshToken) {
        // No refresh token, user is not authenticated
        set({ isAuthenticated: false, isInitialized: true });
        return;
      }

      // Try to refresh the token and get user data
      try {
        const result = await authApi.refresh(refreshToken);
        
        setAccessToken(result.accessToken);
        await storeRefreshToken(result.refreshToken);
        
        set({ 
          user: result.user,
          isAuthenticated: true,
          isInitialized: true
        });
      } catch (refreshError) {
        console.error('Failed to refresh token on init:', refreshError);
        // Token refresh failed, clear everything
        await clearTokens();
        set({ 
          user: null,
          isAuthenticated: false,
          isInitialized: true
        });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      // If anything fails, ensure we're not authenticated
      await clearTokens();
      set({ 
        user: null,
        isAuthenticated: false,
        isInitialized: true
      });
    }
  },
}));
