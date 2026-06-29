import { createShopeeClient } from './shopee.client';
import { prisma } from '../../database/client';
import type { ShopConnection } from '@prisma/client';

export const shopeeProduct = {
  async updateStock(shop: ShopConnection, itemId: string, updates: Array<{variantId: string; stock: number}>) {
    const client = createShopeeClient(shop);
    const stockList = updates.map(u => ({
      model_id: Number(u.variantId),
      seller_stock: [{ stock: u.stock }],
    }));

    const res = await client.post('/api/v2/product/update_stock', {
      item_id: Number(itemId),
      stock_list: stockList,
    });

    // Log update
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

  async updatePrice(shop: ShopConnection, itemId: string, updates: Array<{variantId: string; price: number; originalPrice?: number}>) {
    const client = createShopeeClient(shop);
    const priceList = updates.map(u => ({
      model_id: Number(u.variantId),
      original_price: u.originalPrice ?? u.price,
      current_price: u.price,
    }));

    const res = await client.post('/api/v2/product/update_price_info', {
      item_id: Number(itemId),
      price_list: priceList,
    });

    return { updated: updates, updatedAt: new Date().toISOString() };
  },
};
