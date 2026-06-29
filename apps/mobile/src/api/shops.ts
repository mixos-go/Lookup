// src/api/shops.ts
import { apiClient } from './client';
import type { Shop } from '@/types';

export const shopsApi = {
  list: async (): Promise<Shop[]> => {
    const { data } = await apiClient.get<{ success: boolean; data: { shops: Shop[] } }>('/api/shops');
    return data.data.shops;
  },

  getShopeeAuthUrl: async () => {
    const { data } = await apiClient.get<{ success: boolean; data: { url: string; state: string } }>('/api/shops/shopee/auth-url');
    return data.data;
  },

  getTikTokAuthUrl: async () => {
    const { data } = await apiClient.get<{ success: boolean; data: { url: string; state: string } }>('/api/shops/tiktok/auth-url');
    return data.data;
  },

  disconnect: async (shopId: string) => {
    await apiClient.delete(`/api/shops/${shopId}`);
  },

  sync: async (shopId: string) => {
    const { data } = await apiClient.post('/api/products/sync', { shopId });
    return data.data;
  },
};
