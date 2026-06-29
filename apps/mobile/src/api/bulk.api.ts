import { apiClient } from './client';
import type { BulkJobStatus, BulkJobSummary } from '@/types';

export const bulkApi = {
  async createStockJob(input: {
    shopId: string;
    items: Array<{ productId: string; variantId: string; stock: number }>;
  }): Promise<{ jobId: string; status: string; total: number; estimatedSeconds: number }> {
    return apiClient.post('/api/bulk/stock', input);
  },

  async createPriceJob(input: {
    shopId: string;
    items: Array<{ productId: string; variantId: string; price: number; originalPrice?: number }>;
  }): Promise<{ jobId: string; status: string; total: number; estimatedSeconds: number }> {
    return apiClient.post('/api/bulk/price', input);
  },

  async getJobStatus(jobId: string): Promise<BulkJobStatus> {
    return apiClient.get(`/api/bulk/${jobId}/status`);
  },

  async getHistory(shopId?: string): Promise<{ jobs: BulkJobSummary[] }> {
    const q = shopId ? `?shopId=${shopId}` : '';
    return apiClient.get(`/api/bulk/history${q}`);
  },
};
