import { prisma } from '../../database/client';
import { getCache, setCache, invalidateCache, CACHE_TTL } from '../../cache/redis';
import { shopeeProduct } from '../../integrations/shopee/shopee.product';
import { tiktokProduct } from '../../integrations/tiktok/tiktok.product';
import { logger } from '../../utils/logger';

type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'SOLD_OUT' | 'ALL';

function normalizeShopeeStatus(status: string): 'ACTIVE' | 'INACTIVE' | 'SOLD_OUT' {
  if (status === 'NORMAL') return 'ACTIVE';
  if (status === 'SOLD_OUT') return 'SOLD_OUT';
  return 'INACTIVE';
}

function normalizeTikTokStatus(status: string): 'ACTIVE' | 'INACTIVE' | 'SOLD_OUT' {
  if (status === 'ACTIVATE') return 'ACTIVE';
  if (status === 'SOLD_OUT') return 'SOLD_OUT';
  return 'INACTIVE';
}

const MAX_SYNC_PAGES = 4;
const SYNC_PAGE_SIZE = 50;

export class ProductService {
  async listProducts(params: {
    userId: string;
    shopId: string;
    page: number;
    limit: number;
    search?: string;
    status?: ProductStatus;
  }): Promise<{
    data: { products: unknown[] };
    meta: { page: number; limit: number; total: number; hasMore: boolean };
  }> {
    const { userId, shopId, page, limit, search, status } = params;

    const shop = await prisma.shopConnection.findFirst({
      where: { id: shopId, userId, disconnectedAt: null },
    });
    if (!shop) throw new Error('SHOP_NOT_FOUND');

    const filtersHash = JSON.stringify({ search, status });
    const cacheKey = `product_list:${shopId}:${page}:${Buffer.from(filtersHash).toString('base64').slice(0, 16)}`;
    const cached = await getCache<{
      data: { products: unknown[] };
      meta: { page: number; limit: number; total: number; hasMore: boolean };
    }>(cacheKey);
    if (cached) return cached;

    let products: unknown[] = [];
    let total = 0;
    let hasMore = false;

    if (shop.platform === 'SHOPEE') {
      const result = await shopeeProduct.getItemList(shop, page, limit, search);
      if (result.items.length > 0) {
        const itemIds = result.items.map((i) => i.item_id);
        const details = await shopeeProduct.getItemBaseInfo(shop, itemIds);
        products = (details as any[]).map((item: any) => ({
          id: item.item_id?.toString() ?? '',
          platformProductId: item.item_id?.toString() ?? '',
          name: item.item_name ?? '',
          coverImage: item.image?.image_url_list?.[0] ?? '',
          status: normalizeShopeeStatus(item.item_status ?? ''),
          totalStock:
            (item.stock_info_v2?.summary_info?.total_reserved_stock ?? 0) +
            (item.stock_info_v2?.summary_info?.total_available_stock ?? 0),
          priceRange: {
            min: Number(item.price_info?.[0]?.current_price ?? 0),
            max: Number(item.price_info?.[item.price_info.length - 1]?.current_price ?? 0),
            currency: 'IDR',
          },
          variantCount: item.model?.length ?? 1,
          updatedAt: new Date((item.update_time ?? 0) * 1000).toISOString(),
        }));
      }
      total = result.total_count;
      hasMore = result.has_next_page;
    } else {
      const result = await tiktokProduct.getProductList(shop, page, limit, search);
      products = (result.products as any[]).map((item: any) => ({
        id: item.id ?? '',
        platformProductId: item.id ?? '',
        name: item.title ?? '',
        coverImage: item.main_images?.[0]?.urls?.[0] ?? '',
        status: normalizeTikTokStatus(item.status ?? ''),
        totalStock:
          item.skus?.reduce(
            (acc: number, s: any) => acc + (s.inventory?.[0]?.quantity ?? 0),
            0,
          ) ?? 0,
        priceRange: {
          min: Number(item.skus?.[0]?.price?.sale_price ?? 0),
          max: Number(item.skus?.[item.skus.length - 1]?.price?.sale_price ?? 0),
          currency: 'IDR',
        },
        variantCount: item.skus?.length ?? 1,
        updatedAt: item.update_time ?? new Date().toISOString(),
      }));
      total = result.total_count;
      hasMore = result.has_more;
    }

    if (status && status !== 'ALL') {
      products = products.filter((p: any) => p.status === status);
    }

    const result = { data: { products }, meta: { page, limit, total, hasMore } };
    await setCache(cacheKey, result, CACHE_TTL.PRODUCT_LIST);
    return result;
  }

  async getProductDetail(userId: string, productId: string, shopId: string): Promise<unknown> {
    const shop = await prisma.shopConnection.findFirst({
      where: { id: shopId, userId, disconnectedAt: null },
    });
    if (!shop) throw new Error('SHOP_NOT_FOUND');

    const cacheKey = `product:${shopId}:${productId}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    let detail: unknown = null;

    if (shop.platform === 'SHOPEE') {
      const items = await shopeeProduct.getItemBaseInfo(shop, [Number(productId)]);
      const item = (items as any[])[0];
      if (!item) throw new Error('PRODUCT_NOT_FOUND');

      detail = {
        id: item.item_id?.toString() ?? '',
        platformProductId: item.item_id?.toString() ?? '',
        name: item.item_name ?? '',
        description: item.description ?? '',
        images: (item.image?.image_url_list ?? []).map((url: string, i: number) => ({
          imageId: `img_${i}`,
          url,
          order: i,
        })),
        status: normalizeShopeeStatus(item.item_status ?? ''),
        category: item.category_id?.toString() ?? '',
        coverImage: item.image?.image_url_list?.[0] ?? '',
        totalStock:
          (item.stock_info_v2?.summary_info?.total_reserved_stock ?? 0) +
          (item.stock_info_v2?.summary_info?.total_available_stock ?? 0),
        priceRange: {
          min: Number(item.price_info?.[0]?.current_price ?? 0),
          max: Number(item.price_info?.[item.price_info.length - 1]?.current_price ?? 0),
          currency: 'IDR',
        },
        variantCount: item.model?.length ?? 1,
        variants: (item.model ?? []).map((m: any) => ({
          variantId: m.model_id?.toString() ?? '',
          name: m.model_name ?? '',
          sku: m.model_sku ?? '',
          stock: m.stock_info_v2?.summary_info?.total_available_stock ?? 0,
          price: Number(m.price_info?.[0]?.current_price ?? 0),
          originalPrice: Number(m.price_info?.[0]?.original_price ?? 0),
          currency: 'IDR',
          attributes: {},
        })),
        createdAt: new Date((item.create_time ?? 0) * 1000).toISOString(),
        updatedAt: new Date((item.update_time ?? 0) * 1000).toISOString(),
      };
    } else {
      const item = (await tiktokProduct.getProductDetail(shop, productId)) as any;
      if (!item) throw new Error('PRODUCT_NOT_FOUND');

      detail = {
        id: item.id ?? '',
        platformProductId: item.id ?? '',
        name: item.title ?? '',
        description: item.description ?? '',
        images: (item.main_images ?? []).map((img: any, i: number) => ({
          imageId: img.uri ?? `img_${i}`,
          url: img.urls?.[0] ?? '',
          order: i,
        })),
        status: normalizeTikTokStatus(item.status ?? ''),
        category: item.category_chains?.[0]?.id ?? '',
        coverImage: item.main_images?.[0]?.urls?.[0] ?? '',
        totalStock:
          item.skus?.reduce(
            (acc: number, s: any) => acc + (s.inventory?.[0]?.quantity ?? 0),
            0,
          ) ?? 0,
        priceRange: {
          min: Number(item.skus?.[0]?.price?.sale_price ?? 0),
          max: Number(item.skus?.[item.skus.length - 1]?.price?.sale_price ?? 0),
          currency: 'IDR',
        },
        variantCount: item.skus?.length ?? 1,
        variants: (item.skus ?? []).map((sku: any) => ({
          variantId: sku.id ?? '',
          name:
            sku.sales_attributes?.map((a: any) => a.value_name).join(' / ') ?? '',
          sku: sku.seller_sku ?? '',
          stock: sku.inventory?.[0]?.quantity ?? 0,
          price: Number(sku.price?.sale_price ?? 0),
          originalPrice: Number(
            sku.price?.tax_exclusive_price ?? sku.price?.sale_price ?? 0,
          ),
          currency: 'IDR',
          attributes: Object.fromEntries(
            (sku.sales_attributes ?? []).map((a: any) => [a.attribute_name, a.value_name]),
          ),
        })),
        createdAt: item.create_time ?? new Date().toISOString(),
        updatedAt: item.update_time ?? new Date().toISOString(),
      };
    }

    await setCache(cacheKey, detail, CACHE_TTL.PRODUCT_DETAIL);
    return detail;
  }

  async syncProducts(
    userId: string,
    shopId: string,
  ): Promise<{ synced: number; errors: number; message: string }> {
    const shop = await prisma.shopConnection.findFirst({
      where: { id: shopId, userId, disconnectedAt: null },
    });
    if (!shop) throw new Error('SHOP_NOT_FOUND');

    // Invalidate all cached pages for this shop
    await invalidateCache(`product_list:${shopId}:*`);
    await invalidateCache(`product:${shopId}:*`);

    let synced = 0;
    let errors = 0;

    if (shop.platform === 'SHOPEE') {
      let hasMore = true;
      let page = 1;

      while (hasMore && page <= MAX_SYNC_PAGES) {
        const result = await shopeeProduct.getItemList(shop, page, SYNC_PAGE_SIZE);
        if (result.items.length === 0) break;

        const details = await shopeeProduct.getItemBaseInfo(
          shop,
          result.items.map((i) => i.item_id),
        );

        for (const item of details as any[]) {
          try {
            const totalStock =
              (item.stock_info_v2?.summary_info?.total_reserved_stock ?? 0) +
              (item.stock_info_v2?.summary_info?.total_available_stock ?? 0);
            const priceInfo = item.price_info ?? [];
            const minPrice = priceInfo[0]?.current_price ?? 0;
            const maxPrice = priceInfo[priceInfo.length - 1]?.current_price ?? minPrice;

            await prisma.productCache.upsert({
              where: {
                shopConnectionId_platformProductId: {
                  shopConnectionId: shopId,
                  platformProductId: item.item_id?.toString() ?? '',
                },
              },
              create: {
                shopConnectionId: shopId,
                platformProductId: item.item_id?.toString() ?? '',
                name: item.item_name ?? '',
                coverImageUrl: item.image?.image_url_list?.[0],
                status: normalizeShopeeStatus(item.item_status ?? ''),
                totalStock,
                minPrice,
                maxPrice,
                variantCount: item.model?.length ?? 1,
                rawData: item,
                platformUpdatedAt: new Date((item.update_time ?? 0) * 1000),
              },
              update: {
                name: item.item_name ?? '',
                coverImageUrl: item.image?.image_url_list?.[0],
                status: normalizeShopeeStatus(item.item_status ?? ''),
                totalStock,
                minPrice,
                maxPrice,
                variantCount: item.model?.length ?? 1,
                rawData: item,
                platformUpdatedAt: new Date((item.update_time ?? 0) * 1000),
                cachedAt: new Date(),
              },
            });
            synced++;
          } catch (err) {
            logger.error({ err, itemId: item.item_id }, 'Failed to upsert product cache');
            errors++;
          }
        }

        hasMore = result.has_next_page;
        page++;
      }
    } else {
      // TikTok
      let hasMore = true;
      let page = 1;

      while (hasMore && page <= MAX_SYNC_PAGES) {
        const result = await tiktokProduct.getProductList(shop, page, SYNC_PAGE_SIZE);
        if (result.products.length === 0) break;

        for (const item of result.products as any[]) {
          try {
            const totalStock =
              item.skus?.reduce(
                (acc: number, s: any) => acc + (s.inventory?.[0]?.quantity ?? 0),
                0,
              ) ?? 0;
            const prices = (item.skus ?? []).map((s: any) =>
              Number(s.price?.sale_price ?? 0),
            );
            const minPrice = prices.length ? Math.min(...prices) : 0;
            const maxPrice = prices.length ? Math.max(...prices) : 0;

            await prisma.productCache.upsert({
              where: {
                shopConnectionId_platformProductId: {
                  shopConnectionId: shopId,
                  platformProductId: item.id ?? '',
                },
              },
              create: {
                shopConnectionId: shopId,
                platformProductId: item.id ?? '',
                name: item.title ?? '',
                coverImageUrl: item.main_images?.[0]?.urls?.[0],
                status: normalizeTikTokStatus(item.status ?? ''),
                totalStock,
                minPrice,
                maxPrice,
                variantCount: item.skus?.length ?? 1,
                rawData: item,
                platformUpdatedAt: item.update_time
                  ? new Date(item.update_time)
                  : null,
              },
              update: {
                name: item.title ?? '',
                coverImageUrl: item.main_images?.[0]?.urls?.[0],
                status: normalizeTikTokStatus(item.status ?? ''),
                totalStock,
                minPrice,
                maxPrice,
                variantCount: item.skus?.length ?? 1,
                rawData: item,
                platformUpdatedAt: item.update_time
                  ? new Date(item.update_time)
                  : null,
                cachedAt: new Date(),
              },
            });
            synced++;
          } catch (err) {
            logger.error({ err, itemId: item.id }, 'Failed to upsert TikTok product cache');
            errors++;
          }
        }

        hasMore = result.has_more;
        page++;
      }
    }

    await prisma.shopConnection.update({
      where: { id: shopId },
      data: { lastSyncAt: new Date() },
    });

    logger.info({ shopId, platform: shop.platform, synced, errors }, 'Product sync completed');
    return {
      synced,
      errors,
      message: errors > 0
        ? `Sinkronisasi selesai: ${synced} produk berhasil, ${errors} gagal`
        : `Sinkronisasi selesai: ${synced} produk diperbarui`,
    };
  }
}

export const productService = new ProductService();
