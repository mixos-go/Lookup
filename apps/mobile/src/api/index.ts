// src/api/products.ts
import { apiClient } from './client';
import type { ProductSummary, ProductDetail } from '@/types';

interface ListProductsParams {
  shopId: string;
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export const productsApi = {
  list: async (params: ListProductsParams) => {
    const { data } = await apiClient.get('/api/products', { params });
    return data;
  },

  detail: async (productId: string, shopId: string): Promise<ProductDetail> => {
    const { data } = await apiClient.get(`/api/products/${productId}`, { params: { shopId } });
    return data.data.product;
  },
};

// src/api/inventory.ts
import { apiClient } from './client';

interface StockUpdate { variantId: string; stock: number }

export const inventoryApi = {
  updateStock: async (productId: string, shopId: string, updates: StockUpdate[]) => {
    const { data } = await apiClient.patch(`/api/inventory/${productId}`, { shopId, updates });
    return data.data;
  },
};

// src/api/price.ts
import { apiClient } from './client';

interface PriceUpdate { variantId: string; price: number; originalPrice?: number }

export const priceApi = {
  updatePrice: async (productId: string, shopId: string, updates: PriceUpdate[]) => {
    const { data } = await apiClient.patch(`/api/price/${productId}`, { shopId, updates });
    return data.data;
  },
};

// src/api/bulk.ts
import { apiClient } from './client';
import type { BulkStockItem, BulkPriceItem } from '@/types';

export const bulkApi = {
  createStockJob: async (shopId: string, items: BulkStockItem[]) => {
    const { data } = await apiClient.post('/api/bulk/stock', { shopId, items });
    return data.data;
  },

  createPriceJob: async (shopId: string, items: BulkPriceItem[]) => {
    const { data } = await apiClient.post('/api/bulk/price', { shopId, items });
    return data.data;
  },

  getStatus: async (jobId: string) => {
    const { data } = await apiClient.get(`/api/bulk/${jobId}/status`);
    return data.data;
  },

  getHistory: async (shopId?: string) => {
    const { data } = await apiClient.get('/api/bulk/history', { params: { shopId } });
    return data.data.jobs;
  },
};
