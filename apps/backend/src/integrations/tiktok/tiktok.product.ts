// tiktok.product.ts — Product operations using the OFFICIAL TikTok Shop SDK

import { createTikTokSdkClient, getShopCredentials, CONTENT_TYPE_JSON } from './tiktok.sdk-client';
import type { ProductV202309Api } from './sdk/api/productV202309Api';
import type { LogisticsV202309Api } from './sdk/api/logisticsV202309Api';
import { prisma } from '../../database/client';
import { getCache, setCache } from '../../cache/redis';
import type { ShopConnection } from '@prisma/client';

async function getPrimaryWarehouseId(shop: ShopConnection): Promise<string> {
  const cacheKey = `warehouse:${shop.id}`;
  const cached = await getCache<string>(cacheKey);
  if (cached) return cached;

  const { accessToken, shopCipher } = getShopCredentials(shop);
  const sdk = createTikTokSdkClient();
  const logisticsApi = sdk.api.LogisticsV202309Api as LogisticsV202309Api;

  try {
    const { body } = await logisticsApi.WarehousesGet(accessToken, CONTENT_TYPE_JSON, shopCipher);
    const warehouses = body.data?.warehouses ?? [];

    const main = warehouses.find((w: any) => w.warehouseType === 'MAIN') ?? warehouses[0];
    const warehouseId = main?.id ?? '';

    if (warehouseId) {
      await setCache(cacheKey, warehouseId, 60 * 60);
    }

    return warehouseId;
  } catch {
    return '';
  }
}

export const tiktokProduct = {
  async getProductList(shop: ShopConnection, page: number, limit: number, search?: string): Promise<{
    products: Array<{ id: string; status: string }>;
    total_count: number;
    has_more: boolean;
    next_page_token: string;
  }> {
    const { accessToken, shopCipher } = getShopCredentials(shop);
    const sdk = createTikTokSdkClient();
    const productApi = sdk.api.ProductV202309Api as ProductV202309Api;

    const searchBody: any = {
      sortField: 'CREATE_TIME',
      sortOrder: 'DESC',
    };
    if (search) searchBody.keyword = search;

    const { body } = await productApi.ProductsSearchPost(
      limit,
      accessToken,
      CONTENT_TYPE_JSON,
      undefined,
      undefined,
      shopCipher,
      searchBody,
    );

    const d = body.data ?? {};
    return {
      products: (d.products ?? []) as Array<{ id: string; status: string }>,
      total_count: d.totalCount ?? 0,
      has_more: !!d.nextPageToken,
      next_page_token: d.nextPageToken ?? '',
    };
  },

  async getProductDetail(shop: ShopConnection, productId: string): Promise<unknown> {
    const { accessToken, shopCipher } = getShopCredentials(shop);
    const sdk = createTikTokSdkClient();
    const productApi = sdk.api.ProductV202309Api as ProductV202309Api;

    const { body } = await productApi.ProductsProductIdGet(
      productId,
      accessToken,
      CONTENT_TYPE_JSON,
      undefined,
      undefined,
      undefined,
      shopCipher,
    );
    return body.data ?? null;
  },

  async updateInventory(
    shop: ShopConnection,
    productId: string,
    updates: Array<{ variantId: string; stock: number }>,
  ): Promise<{ updated: typeof updates; platform: string; updatedAt: string }> {
    const { accessToken, shopCipher } = getShopCredentials(shop);
    const sdk = createTikTokSdkClient();
    const productApi = sdk.api.ProductV202309Api as ProductV202309Api;
    const warehouseId = await getPrimaryWarehouseId(shop);

    const { body } = await productApi.ProductsProductIdInventoryUpdatePost(
      productId,
      accessToken,
      CONTENT_TYPE_JSON,
      shopCipher,
      {
        skus: updates.map((u) => ({
          id: u.variantId,
          inventory: warehouseId
            ? [{ warehouseId, quantity: u.stock }]
            : [{ quantity: u.stock }],
        })),
      } as any,
    );

    for (const u of updates) {
      await prisma.updateLog.create({
        data: {
          shopConnectionId: shop.id,
          platformProductId: productId,
          variantId: u.variantId,
          updateType: 'STOCK',
          status: body.code === 0 ? 'SUCCESS' : 'FAILED',
          newValue: { stock: u.stock },
          platformResponse: body as any,
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
    const { accessToken, shopCipher } = getShopCredentials(shop);
    const sdk = createTikTokSdkClient();
    const productApi = sdk.api.ProductV202309Api as ProductV202309Api;

    const { body } = await productApi.ProductsProductIdPricesUpdatePost(
      productId,
      accessToken,
      CONTENT_TYPE_JSON,
      shopCipher,
      {
        skus: updates.map((u) => ({
          id: u.variantId,
          price: { amount: String(u.price), currency: 'IDR' },
        })),
      } as any,
    );

    for (const u of updates) {
      await prisma.updateLog.create({
        data: {
          shopConnectionId: shop.id,
          platformProductId: productId,
          variantId: u.variantId,
          updateType: 'PRICE',
          status: body.code === 0 ? 'SUCCESS' : 'FAILED',
          newValue: { price: u.price, originalPrice: u.originalPrice },
          platformResponse: body as any,
        },
      });
    }

    return { updated: updates, updatedAt: new Date().toISOString() };
  },

  async uploadImage(
    shop: ShopConnection,
    imageBuffer: Buffer,
    mimeType: string,
  ): Promise<{ imageId: string; imageUrl: string; width: number; height: number }> {
    const { accessToken, shopCipher } = getShopCredentials(shop);
    const sdk = createTikTokSdkClient();
    const productApi = sdk.api.ProductV202309Api as ProductV202309Api;

    const { body } = await productApi.ImagesUploadPost(
      accessToken,
      CONTENT_TYPE_JSON,
      { value: imageBuffer, options: { filename: 'upload.jpg', contentType: mimeType } } as any,
      'MAIN_IMAGE',
    );

    const img: any = body.data ?? {};
    return {
      imageId: img.uri ?? '',
      imageUrl: img.url ?? '',
      width: img.width ?? 0,
      height: img.height ?? 0,
    };
  },

  async updateProductImages(
    shop: ShopConnection,
    productId: string,
    imageUris: string[],
  ): Promise<void> {
    const { accessToken, shopCipher } = getShopCredentials(shop);
    const sdk = createTikTokSdkClient();
    const productApi = sdk.api.ProductV202309Api as ProductV202309Api;

    await productApi.ProductsProductIdPartialEditPost(
      productId,
      accessToken,
      CONTENT_TYPE_JSON,
      shopCipher,
      { mainImages: imageUris.map((uri) => ({ uri })) } as any,
    );
  },
};
