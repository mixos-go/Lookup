import { createTikTokClient } from './tiktok.client';
import { prisma } from '../../database/client';
import type { ShopConnection } from '@prisma/client';

export const tiktokProduct = {
  async getProductList(shop: ShopConnection, page: number, limit: number, search?: string): Promise<{
    products: Array<{ id: string; status: string }>;
    total_count: number;
    has_more: boolean;
    next_page_token: string;
  }> {
    const client = createTikTokClient(shop);
    const body: Record<string, unknown> = {
      page_size: limit,
      sort_field: 'CREATE_TIME',
      sort_order: 'DESC',
    };
    if (search) body.keyword = search;

    const res = await client.post('/product/202309/products/search', body, {
      params: { page_size: limit },
    });

    const d = res.data.data ?? {};
    return {
      products: d.products ?? [],
      total_count: d.total_count ?? 0,
      has_more: d.next_page_token != null && d.next_page_token !== '',
      next_page_token: d.next_page_token ?? '',
    };
  },

  async getProductDetail(shop: ShopConnection, productId: string): Promise<unknown> {
    const client = createTikTokClient(shop);
    const res = await client.get(`/product/202309/products/${productId}`);
    return res.data.data ?? null;
  },

  async updateInventory(
    shop: ShopConnection,
    productId: string,
    updates: Array<{ variantId: string; stock: number }>,
  ): Promise<{ updated: typeof updates; platform: string; updatedAt: string }> {
    const client = createTikTokClient(shop);

    const res = await client.put('/product/202309/inventories', {
      skus: updates.map((u) => ({
        id: u.variantId,
        inventory: [{ warehouse_id: 'default', quantity: u.stock }],
      })),
    });

    for (const u of updates) {
      await prisma.updateLog.create({
        data: {
          shopConnectionId: shop.id,
          platformProductId: productId,
          variantId: u.variantId,
          updateType: 'STOCK',
          status: res.data.code === 0 ? 'SUCCESS' : 'FAILED',
          newValue: { stock: u.stock },
          platformResponse: res.data,
        },
      });
    }

    return { updated: updates, platform: 'TIKTOK', updatedAt: new Date().toISOString() };
  },

  async updatePrice(
    shop: ShopConnection,
    productId: string,
    updates: Array<{ variantId: string; price: number; originalPrice?: number }>,
  ): Promise<{ updated: typeof updates; updatedAt: string }> {
    const client = createTikTokClient(shop);

    const res = await client.put(`/product/202309/products/${productId}/prices`, {
      skus: updates.map((u) => ({
        id: u.variantId,
        price: { amount: String(u.price), currency: 'IDR' },
      })),
    });

    for (const u of updates) {
      await prisma.updateLog.create({
        data: {
          shopConnectionId: shop.id,
          platformProductId: productId,
          variantId: u.variantId,
          updateType: 'PRICE',
          status: res.data.code === 0 ? 'SUCCESS' : 'FAILED',
          newValue: { price: u.price, originalPrice: u.originalPrice },
          platformResponse: res.data,
        },
      });
    }

    return { updated: updates, updatedAt: new Date().toISOString() };
  },

  async uploadImage(shop: ShopConnection, imageBuffer: Buffer, mimeType: string): Promise<{ imageId: string; imageUrl: string; width: number; height: number }> {
    const client = createTikTokClient(shop);
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('data', imageBuffer, { filename: 'upload.jpg', contentType: mimeType });
    form.append('use_case', 'MAIN_IMAGE');

    const res = await client.post('/product/202309/images/upload', form, {
      headers: form.getHeaders(),
    });

    const img = res.data.data;
    return {
      imageId: img?.uri ?? '',
      imageUrl: img?.url ?? '',
      width: img?.width ?? 0,
      height: img?.height ?? 0,
    };
  },
};
