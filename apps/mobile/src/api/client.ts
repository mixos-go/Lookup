// src/api/client.ts — Base Axios instance with JWT auth + auto-refresh

import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from '@/utils/secureStorage';
import { API_URL } from '@/constants';

const REFRESH_TOKEN_KEY = 'lookup_refresh_token';
const ACCESS_TOKEN_KEY = 'lookup_access_token';

// In-memory access token (never stored to disk)
let inMemoryAccessToken: string | null = null;

export function setAccessToken(token: string) {
  inMemoryAccessToken = token;
}

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export async function storeRefreshToken(token: string) {
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
}

export async function getStoredRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function clearTokens() {
  inMemoryAccessToken = null;
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}

// ─── Base Client ─────────────────────────────────────────────────────────────

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach access token on every request
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-refresh on 401
let isRefreshing = false;
let pendingRequests: Array<(token: string) => void> = [];

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve) => {
        pendingRequests.push((token: string) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          resolve(apiClient(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await getStoredRefreshToken();
      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await axios.post(`${API_URL}/api/auth/refresh`, { refreshToken });
      const { accessToken, refreshToken: newRefreshToken } = data.data;

      setAccessToken(accessToken);
      await storeRefreshToken(newRefreshToken);

      pendingRequests.forEach((cb) => cb(accessToken));
      pendingRequests = [];

      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return apiClient(originalRequest);
    } catch {
      pendingRequests = [];
      await clearTokens();
      // Trigger logout via event or store reset
      return Promise.reject(error);
    } finally {
      isRefreshing = false;
    }
  }
);
