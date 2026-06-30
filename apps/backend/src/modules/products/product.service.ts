import { prisma } from '../../database/client';
import { getCache, setCache, invalidateCache, CACHE_TTL } from '../../cache/redis';
import { shopeeProduct } from '../../integrations/shopee/shopee.product';
import { tiktokProduct } from '../../integrations/tiktok/tiktok.product';
import { logger } from '../../utils/logger';

export class ProductService {
  async listProducts(params: {
    userId: string;
    shopId: string;
    page: number;
    limit: number;
    search?: string;
    status?: string;
  }) {
    const { userId, shopId, page, limit, search, status } = params;

    const shop = await prisma.shopConnection.findFirst({
      where: { id: shopId, userId, disconnectedAt: null },
    });
    if (!shop) throw new Error('SHOP_NOT_FOUND');

    const cacheKey = `product_list:${shopId}:${page}:${limit}:${search ?? ''}:${status ?? 'ALL'}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    let result: { data: { products: unknown[] }; meta: { page: number; limit: number; total: number; hasMore: boolean } };

    if (shop.platform === 'SHOPEE') {
      // FIX: Shopee item_status only accepts NORMAL | BANNED | DELETED | UNLIST.
      // "SOLD_OUT" and "INACTIVE" are NOT valid Shopee values — they don't exist
      // in the platform API. Sold-out items are NORMAL items with stock=0.
      // "INACTIVE" maps to Shopee's UNLIST status (manually hidden by seller).
      const shopeeStatus = status === 'INACTIVE' ? 'UNLIST' : 'NORMAL';

      const rawList = await shopeeProduct.getItemList(shop, page, limit, search, shopeeStatus);

      let products = rawList.items.map((item: any) => ({
        id: String(item.item_id),
        platformProductId: String(item.item_id),
        name: item.item_name ?? '',
        coverImage: item.item_sku ?? '',
        status: item.item_status ?? 'NORMAL',
        totalStock: item.stock_info_v2?.seller_stock?.reduce((s: number, x: any) => s + (x.stock ?? 0), 0) ?? 0,
        priceRange: {
          min: (item.price_info?.[0]?.current_price ?? 0),
          max: (item.price_info?.[item.price_info?.length - 1]?.current_price ?? 0),
          currency: 'IDR',
        },
        variantCount: item.has_model ? (item.tier_variation?.length ?? 1) : 1,
        updatedAt: new Date(item.update_time * 1000).toISOString(),
      }));

      // FIX: "SOLD_OUT" is a derived state (stock === 0), not a platform status.
      // Filter client-side since Shopee has no item_status for this.
      if (status === 'SOLD_OUT') {
        products = products.filter((p) => p.totalStock === 0);
      }

      result = {
        data: { products },
        meta: {
          page,
          limit,
          // Note: total_count reflects Shopee's NORMAL count, not post-filter count
          // when status === 'SOLD_OUT'. This is a known limitation — Shopee has
          // no server-side sold-out filter.
          total: rawList.total_count,
          hasMore: rawList.has_next_page,
        },
      };
    } else {
      const rawList = await tiktokProduct.getProductList(shop, page, limit, search);

      // FIX: filter by status at API level — TikTok supports status filter in search
      const products = rawList.products
        .filter((p: any) => !status || status === 'ALL' || p.status === status)
        .map((p: any) => ({
          id: String(p.id),
          platformProductId: String(p.id),
          name: p.title ?? '',
          coverImage: p.main_images?.[0]?.thumb_urls?.[0] ?? '',
          status: p.status ?? 'ACTIVE',
          totalStock: p.skus?.reduce((s: number, sk: any) => s + (sk.stock_infos?.[0]?.available_stock ?? 0), 0) ?? 0,
          priceRange: {
            min: Number(p.skus?.[0]?.price?.sale_price ?? 0),
            max: Number(p.skus?.[p.skus.length - 1]?.price?.sale_price ?? 0),
            currency: 'IDR',
          },
          variantCount: p.skus?.length ?? 1,
          updatedAt: new Date((p.update_time ?? 0) * 1000).toISOString(),
        }));

      result = {
        data: { products },
        meta: { page, limit, total: rawList.total_count, hasMore: rawList.has_more },
      };
    }

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

    let raw: unknown;
    if (shop.platform === 'SHOPEE') {
      raw = await shopeeProduct.getItemDetail(shop, productId);
    } else {
      raw = await tiktokProduct.getProductDetail(shop, productId);
    }

    const product = shop.platform === 'SHOPEE'
      ? mapShopeeDetail(raw as any, shopId)
      : mapTikTokDetail(raw as any, shopId);

    await setCache(cacheKey, product, CACHE_TTL.PRODUCT_DETAIL);
    return product;
  }

  async syncProducts(userId: string, shopId: string): Promise<{ synced: number }> {
    const shop = await prisma.shopConnection.findFirst({
      where: { id: shopId, userId, disconnectedAt: null },
    });
    if (!shop) throw new Error('SHOP_NOT_FOUND');

    let page = 1;
    let hasMore = true;
    let synced = 0;

    while (hasMore) {
      const result = shop.platform === 'SHOPEE'
        ? await shopeeProduct.getItemList(shop, page, 50)
        : await tiktokProduct.getProductList(shop, page, 50);

      const items = 'items' in result ? result.items : (result as any).products;

      for (const item of items) {
        const platformProductId = String('item_id' in item ? item.item_id : item.id);
        const name = 'item_name' in item ? item.item_name : (item as any).title ?? '';
        const totalStock = shop.platform === 'SHOPEE'
          ? (item as any).stock_info_v2?.seller_stock?.reduce((s: number, x: any) => s + (x.stock ?? 0), 0) ?? 0
          : (item as any).skus?.reduce((s: number, sk: any) => s + (sk.stock_infos?.[0]?.available_stock ?? 0), 0) ?? 0;

        await prisma.productCache.upsert({
          where: { shopConnectionId_platformProductId: { shopConnectionId: shopId, platformProductId } },
          create: {
            shopConnectionId: shopId,
            platformProductId,
            name,
            totalStock,
            minPrice: 0,
            maxPrice: 0,
            rawData: item as any,
            cachedAt: new Date(),
          },
          update: {
            name,
            totalStock,
            rawData: item as any,
            cachedAt: new Date(),
          },
        });
        synced++;
      }

      hasMore = 'has_next_page' in result ? result.has_next_page : (result as any).has_more;
      if (!hasMore) break;
      page++;
    }

    await prisma.shopConnection.update({ where: { id: shopId }, data: { lastSyncAt: new Date() } });
    await invalidateCache(`product_list:${shopId}:*`);

    return { synced };
  }
}

function mapShopeeDetail(raw: any, shopId: string) {
  const item = raw?.response ?? raw ?? {};
  return {
    id: String(item.item_id ?? ''),
    platformProductId: String(item.item_id ?? ''),
    name: item.item_name ?? '',
    description: item.description ?? '',
    category: String(item.category_id ?? ''),
    status: item.item_status ?? 'NORMAL',
    coverImage: item.image?.image_url_list?.[0] ?? '',
    images: (item.image?.image_url_list ?? []).map((url: string, i: number) => ({
      imageId: String(i),
      url,
      order: i,
    })),
    variants: (item.model ?? []).map((m: any) => ({
      variantId: String(m.model_id),
      name: m.model_description ?? 'Default',
      sku: m.model_sku ?? '',
      stock: m.stock_info_v2?.seller_stock?.[0]?.stock ?? 0,
      price: m.price_info?.[0]?.current_price ?? 0,
      originalPrice: m.price_info?.[0]?.original_price ?? 0,
      currency: 'IDR',
      attributes: {},
    })),
    priceRange: {
      min: item.price_info?.[0]?.current_price ?? 0,
      max: item.price_info?.[item.price_info?.length - 1]?.current_price ?? 0,
      currency: 'IDR',
    },
    variantCount: item.model?.length ?? 1,
    totalStock: (item.model ?? []).reduce((s: number, m: any) =>
      s + (m.stock_info_v2?.seller_stock?.[0]?.stock ?? 0), 0),
    createdAt: new Date((item.create_time ?? 0) * 1000).toISOString(),
    updatedAt: new Date((item.update_time ?? 0) * 1000).toISOString(),
  };
}

function mapTikTokDetail(raw: any, shopId: string) {
  const item = raw ?? {};
  return {
    id: String(item.id ?? ''),
    platformProductId: String(item.id ?? ''),
    name: item.title ?? '',
    description: item.description ?? '',
    category: item.category_chains?.[0]?.id ?? '',
    status: item.status ?? 'ACTIVE',
    coverImage: item.main_images?.[0]?.thumb_urls?.[0] ?? '',
    images: (item.main_images ?? []).map((img: any, i: number) => ({
      imageId: img.uri ?? String(i),
      url: img.thumb_urls?.[0] ?? img.url_list?.[0] ?? '',
      order: i,
    })),
    variants: (item.skus ?? []).map((sku: any) => ({
      variantId: String(sku.id),
      name: sku.sales_attributes?.map((a: any) => a.value_name).join(' / ') ?? 'Default',
      sku: sku.seller_sku ?? '',
      stock: sku.stock_infos?.[0]?.available_stock ?? 0,
      price: Number(sku.price?.sale_price ?? 0),
      originalPrice: Number(sku.price?.original_price ?? 0),
      currency: sku.price?.currency ?? 'IDR',
      attributes: Object.fromEntries(
        (sku.sales_attributes ?? []).map((a: any) => [a.attribute_name, a.value_name])
      ),
    })),
    priceRange: {
      min: Number(item.skus?.[0]?.price?.sale_price ?? 0),
      max: Number(item.skus?.[item.skus?.length - 1]?.price?.sale_price ?? 0),
      currency: 'IDR',
    },
    variantCount: item.skus?.length ?? 1,
    totalStock: (item.skus ?? []).reduce((s: number, sk: any) =>
      s + (sk.stock_infos?.[0]?.available_stock ?? 0), 0),
    createdAt: new Date((item.create_time ?? 0) * 1000).toISOString(),
    updatedAt: new Date((item.update_time ?? 0) * 1000).toISOString(),
  };
}

export const productService = new ProductService();
