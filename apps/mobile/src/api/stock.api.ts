import { apiClient } from './client';

export const stockApi = {
  async updateStock(
    productId: string,
    input: { shopId: string; updates: Array<{ variantId: string; stock: number }> },
  ): Promise<{ updated: Array<{ variantId: string; stock: number }>; updatedAt: string }> {
    const data = await apiClient.patch<{
      updated: Array<{ variantId: string; stock: number }>;
      updatedAt: string;
    }>(`/api/products/${productId}/stock`, input);
    return data;
  },
};
