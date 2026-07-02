import { apiClient } from './client';

export const priceApi = {
  async updatePrice(
    productId: string,
    input: {
      shopId: string;
      updates: Array<{ variantId: string; price: number; originalPrice?: number }>;
    },
  ): Promise<{ updated: typeof input.updates; updatedAt: string }> {
    // FIX: Changed from /api/products/${productId}/price to /api/price/${productId}
    const { data } = await apiClient.patch<{
      success: boolean;
      data: { updated: Array<{ variantId: string; price: number; originalPrice?: number }>; updatedAt: string };
    }>(`/api/price/${productId}`, input);
    return data.data;
  },
};
