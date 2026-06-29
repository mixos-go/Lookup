// src/api/auth.ts
import { apiClient } from './client';
import type { LoginInput, RegisterInput, User, AuthTokens } from '@/types';

export const authApi = {
  login: async (input: LoginInput) => {
    const { data } = await apiClient.post<{ success: boolean; data: { user: User } & AuthTokens }>('/api/auth/login', input);
    return data.data;
  },

  register: async (input: RegisterInput) => {
    const { data } = await apiClient.post<{ success: boolean; data: { user: User } & AuthTokens }>('/api/auth/register', input);
    return data.data;
  },

  logout: async (refreshToken: string) => {
    await apiClient.post('/api/auth/logout', { refreshToken });
  },
};
