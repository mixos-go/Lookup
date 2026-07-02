import { apiClient } from './client';

export const stockApi = {
  async updateStock(
    productId: string,
    input: { shopId: string; updates: Array<{ variantId: string; stock: number }> },
  ): Promise<{ updated: Array<{ variantId: string; stock: number }>; updatedAt: string }> {
    // FIX: Changed from /api/products/${productId}/stock to /api/inventory/${productId}
    const { data } = await apiClient.patch<{
      success: boolean;
      data: { updated: Array<{ variantId: string; stock: number }>; updatedAt: string };
    }>(`/api/inventory/${productId}`, input);
    return data.data;
  },
};
