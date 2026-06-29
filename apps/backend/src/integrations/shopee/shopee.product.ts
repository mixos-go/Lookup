import { createShopeeClient } from './shopee.client';
import { prisma } from '../../database/client';
import type { ShopConnection } from '@prisma/client';

export const shopeeProduct = {
  async getItemList(shop: ShopConnection, page: number, limit: number, search?: string): Promise<{
    items: Array<{ item_id: number; item_status: string }>;
    total_count: number;
    has_next_page: boolean;
    next_offset: number;
  }> {
    const client = createShopeeClient(shop);
    const offset = (page - 1) * limit;

    const res = await client.get('/api/v2/product/get_item_list', {
      params: {
        offset,
        page_size: limit,
        item_status: 'NORMAL',
      },
    });

    const raw = res.data.response ?? {};
    return {
      items: raw.item ?? [],
      total_count: raw.total_count ?? 0,
      has_next_page: raw.has_next_page ?? false,
      next_offset: raw.next_offset ?? 0,
    };
  },

  async getItemBaseInfo(shop: ShopConnection, itemIds: number[]): Promise<unknown[]> {
    const client = createShopeeClient(shop);
    const res = await client.get('/api/v2/product/get_item_base_info', {
      params: { item_id_list: itemIds.join(','), need_tax_info: false, need_complaint_policy: false },
    });
    return res.data.response?.item_list ?? [];
  },

  async updateStock(
    shop: ShopConnection,
    itemId: string,
    updates: Array<{ variantId: string; stock: number }>,
  ): Promise<{ updated: typeof updates; platform: string; updatedAt: string }> {
    const client = createShopeeClient(shop);

    const stockList = updates.map((u) => ({
      model_id: Number(u.variantId),
      seller_stock: [{ stock: u.stock }],
    }));

    const res = await client.post('/api/v2/product/update_stock', {
      item_id: Number(itemId),
      stock_list: stockList,
    });

    for (const u of updates) {
      await prisma.updateLog.create({
        data: {
          shopConnectionId: shop.id,
          platformProductId: itemId,
          variantId: u.variantId,
          updateType: 'STOCK',
          status: res.data.error ? 'FAILED' : 'SUCCESS',
          newValue: { stock: u.stock },
          platformResponse: res.data,
        },
      });
    }

    return { updated: updates, platform: 'SHOPEE', updatedAt: new Date().toISOString() };
  },

  async updatePrice(
    shop: ShopConnection,
    itemId: string,
    updates: Array<{ variantId: string; price: number; originalPrice?: number }>,
  ): Promise<{ updated: typeof updates; updatedAt: string }> {
    const client = createShopeeClient(shop);

    const priceList = updates.map((u) => ({
      model_id: Number(u.variantId),
      original_price: u.originalPrice ?? u.price,
      current_price: u.price,
    }));

    const res = await client.post('/api/v2/product/update_price_info', {
      item_id: Number(itemId),
      price_list: priceList,
    });

    for (const u of updates) {
      await prisma.updateLog.create({
        data: {
          shopConnectionId: shop.id,
          platformProductId: itemId,
          variantId: u.variantId,
          updateType: 'PRICE',
          status: res.data.error ? 'FAILED' : 'SUCCESS',
          newValue: { price: u.price, originalPrice: u.originalPrice },
          platformResponse: res.data,
        },
      });
    }

    return { updated: updates, updatedAt: new Date().toISOString() };
  },

  async uploadImage(shop: ShopConnection, imageBuffer: Buffer, mimeType: string): Promise<{ imageId: string; imageUrl: string; width: number; height: number }> {
    const client = createShopeeClient(shop);
    const FormData = (await import('form-data')).default;
    const form = new FormData();
    form.append('image', imageBuffer, { filename: 'upload.jpg', contentType: mimeType });

    const res = await client.post('/api/v2/media_space/upload_image', form, {
      headers: form.getHeaders(),
    });

    const img = res.data.response?.image_info;
    return {
      imageId: img?.image_id ?? '',
      imageUrl: img?.image_url ?? '',
      width: img?.image_width ?? 0,
      height: img?.image_height ?? 0,
    };
  },
};
