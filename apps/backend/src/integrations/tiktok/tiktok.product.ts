import { createTikTokClient } from './tiktok.client';
import type { ShopConnection } from '@prisma/client';

export const tiktokProduct = {
  async updateInventory(shop: ShopConnection, productId: string, updates: Array<{variantId: string; stock: number}>) {
    const client = createTikTokClient(shop);

    const res = await client.put('/product/202309/inventories', {
      skus: updates.map(u => ({
        id: u.variantId,
        inventory: [{ warehouse_id: 'default', quantity: u.stock }],
      })),
    });

    return { updated: updates, platform: 'TIKTOK', updatedAt: new Date().toISOString() };
  },

  async updatePrice(shop: ShopConnection, productId: string, updates: Array<{variantId: string; price: number; originalPrice?: number}>) {
    const client = createTikTokClient(shop);

    const res = await client.put(`/product/202309/products/${productId}/prices`, {
      skus: updates.map(u => ({
        id: u.variantId,
        price: { amount: String(u.price), currency: 'IDR' },
      })),
    });

    return { updated: updates, updatedAt: new Date().toISOString() };
  },
};
