import { apiClient } from './client';

export const priceApi = {
  async updatePrice(
    productId: string,
    input: {
      shopId: string;
      updates: Array<{ variantId: string; price: number; originalPrice?: number }>;
    },
  ): Promise<{ updated: typeof input.updates; updatedAt: string }> {
    const data = await apiClient.patch<{
      updated: Array<{ variantId: string; price: number; originalPrice?: number }>;
      updatedAt: string;
    }>(`/api/products/${productId}/price`, input);
    return data;
  },
};
