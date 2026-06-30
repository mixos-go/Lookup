// shopee.product.ts — Shopee Open API v2 product operations
//
// Key notes on item_status:
//   Valid values: NORMAL, BANNED, DELETED, UNLIST
//   "SOLD_OUT" is NOT a valid status in Shopee API.
//   Sold-out items have status NORMAL with stock=0.
//   To filter sold-out: fetch NORMAL items, filter by totalStock===0 in service layer.
//
// Reference: https://open.shopee.com/documents/v2/v2.product.get_item_list

import { createShopeeClient } from './shopee.client';
import { prisma } from '../../database/client';
import type { ShopConnection } from '@prisma/client';
import FormData from 'form-data';

// Valid item_status values for Shopee get_item_list
export type ShopeeItemStatus = 'NORMAL' | 'BANNED' | 'DELETED' | 'UNLIST';

export const shopeeProduct = {
  async getItemList(
    shop: ShopConnection,
    page: number,
    limit: number,
    search?: string,
    // FIX: only accept valid Shopee item_status values
    // SOLD_OUT is NOT valid — it's handled by stock=0 filter in service layer
    itemStatus: ShopeeItemStatus = 'NORMAL',
  ): Promise<{ items: unknown[]; total_count: number; has_next_page: boolean }> {
    const client = createShopeeClient(shop);
    const offset = (page - 1) * limit;

    const params: Record<string, unknown> = {
      offset,
      page_size: limit,
      item_status: itemStatus,
    };
    if (search) params.keyword = search;

    const res = await client.get('/api/v2/product/get_item_list', { params });

    if (res.data.error) {
      throw new Error(`Shopee API error: ${res.data.message} (${res.data.error})`);
    }

    const response = res.data.response ?? {};
    return {
      items: response.item ?? [],
      total_count: response.total_count ?? 0,
      has_next_page: response.has_next_page ?? false,
    };
  },

  async getItemDetail(shop: ShopConnection, itemId: string): Promise<unknown> {
    const client = createShopeeClient(shop);
    const res = await client.get('/api/v2/product/get_item_base_info', {
      params: {
        item_id_list: itemId,
        need_tax_info: true,
        need_complaint_policy: false,
      },
    });

    if (res.data.error) {
      throw new Error(`Shopee getItemDetail error: ${res.data.message}`);
    }

    return res.data.response?.item_list?.[0] ?? null;
  },

  async updateStock(
    shop: ShopConnection,
    itemId: string,
    updates: Array<{ variantId: string; stock: number }>,
  ): Promise<{ updated: typeof updates; platform: string; updatedAt: string }> {
    const client = createShopeeClient(shop);

    // model_id = 0 for single-SKU items (no variants)
    // For multi-variant, model_id = the variant's model_id from Shopee
    const stockList = updates.map((u) => ({
      model_id: Number(u.variantId) || 0,
      seller_stock: [{ stock: u.stock }],
      // Note: if seller has multiple warehouse locations, add:
      // seller_stock: [{ location_id: "...", stock: u.stock }]
      // Location IDs can be fetched via /api/v2/product/get_dts_limit
    }));

    const res = await client.post('/api/v2/product/update_stock', {
      item_id: Number(itemId),
      stock_list: stockList,
    });

    const success = !res.data.error;

    for (const u of updates) {
      await prisma.updateLog.create({
        data: {
          shopConnectionId: shop.id,
          platformProductId: itemId,
          variantId: u.variantId,
          updateType: 'STOCK',
          status: success ? 'SUCCESS' : 'FAILED',
          newValue: { stock: u.stock },
          platformResponse: res.data,
          errorMessage: success ? null : (res.data.message ?? 'Unknown error'),
        },
      });
    }

    if (!success) {
      throw new Error(`Shopee updateStock error: ${res.data.message} (${res.data.error})`);
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
      model_id: Number(u.variantId) || 0,
      original_price: u.originalPrice ?? u.price,
      current_price: u.price,
    }));

    const res = await client.post('/api/v2/product/update_price_info', {
      item_id: Number(itemId),
      price_list: priceList,
    });

    const success = !res.data.error;

    for (const u of updates) {
      await prisma.updateLog.create({
        data: {
          shopConnectionId: shop.id,
          platformProductId: itemId,
          variantId: u.variantId,
          updateType: 'PRICE',
          status: success ? 'SUCCESS' : 'FAILED',
          newValue: { price: u.price, originalPrice: u.originalPrice },
          platformResponse: res.data,
          errorMessage: success ? null : (res.data.message ?? 'Unknown error'),
        },
      });
    }

    if (!success) {
      throw new Error(`Shopee updatePrice error: ${res.data.message} (${res.data.error})`);
    }

    return { updated: updates, updatedAt: new Date().toISOString() };
  },

  async uploadImage(
    shop: ShopConnection,
    imageBuffer: Buffer,
    mimeType: string,
  ): Promise<{ imageId: string; imageUrl: string; width: number; height: number }> {
    const client = createShopeeClient(shop);
    const form = new FormData();
    form.append('file', imageBuffer, { filename: 'upload.jpg', contentType: mimeType });

    const res = await client.post('/api/v2/media_space/upload_image', form, {
      headers: form.getHeaders(),
    });

    if (res.data.error) {
      throw new Error(`Shopee uploadImage error: ${res.data.message}`);
    }

    const img = res.data.response?.image_info;
    return {
      imageId: img?.image_id ?? '',
      imageUrl: img?.image_url ?? '',
      width: img?.image_width ?? 0,
      height: img?.image_height ?? 0,
    };
  },

  async updateProductImages(
    shop: ShopConnection,
    itemId: string,
    imageIds: string[],
  ): Promise<void> {
    const client = createShopeeClient(shop);
    const res = await client.post('/api/v2/product/update_item', {
      item_id: Number(itemId),
      image: { image_id_list: imageIds },
    });

    if (res.data.error) {
      throw new Error(`Shopee updateProductImages error: ${res.data.message}`);
    }
  },
};
