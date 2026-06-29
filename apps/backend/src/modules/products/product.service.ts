import { prisma } from '../../database/client';
import { getCache, setCache, CACHE_TTL } from '../../cache/redis';

export class ProductService {
  async listProducts({ userId, shopId, page, limit, search, status }: {
    userId: string; shopId: string; page: number; limit: number;
    search?: string; status?: string;
  }) {
    const shop = await prisma.shopConnection.findFirst({ where: { id: shopId, userId } });
    if (!shop) throw new Error('SHOP_NOT_FOUND');

    // TODO: Fetch from platform integration, cache results
    // See docs/API.md and integrations/shopee or integrations/tiktok
    return { data: { products: [] }, meta: { page, limit, total: 0, hasMore: false } };
  }

  async getProductDetail(userId: string, productId: string, shopId: string) {
    const cacheKey = `product:${shopId}:${productId}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    // TODO: Fetch from platform
    return null;
  }

  async syncProducts(userId: string, shopId: string) {
    // TODO: Pull all products from platform and upsert into product_cache
    return { synced: 0, message: 'Sync not yet implemented' };
  }
}

export const productService = new ProductService();
