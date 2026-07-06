import { prisma } from '../../database/client';
import { getCache, setCache, invalidateCache, CACHE_TTL } from '../../cache/redis';
import { tiktokOrder } from '../../integrations/tiktok/tiktok.order';
import { logger } from '../../utils/logger';

export class OrderService {
  async listOrders(params: {
    userId: string;
    shopId: string;
    page: number;
    limit: number;
    status?: string;
  }) {
    const { userId, shopId, page, limit, status } = params;

    const shop = await prisma.shopConnection.findFirst({
      where: { id: shopId, userId, disconnectedAt: null },
    });
    if (!shop) throw new Error('SHOP_NOT_FOUND');

    if (shop.platform !== 'TIKTOK') {
      throw new Error('ORDER_SYNC_NOT_SUPPORTED_FOR_PLATFORM');
    }

    const cacheKey = `order_list:${shopId}:${page}:${limit}:${status ?? 'ALL'}`;
    const cached = await getCache(cacheKey);
    if (cached) return cached;

    const where = {
      shopConnectionId: shopId,
      ...(status && status !== 'ALL' ? { status } : {}),
    };

    const [orders, total] = await Promise.all([
      prisma.orderCache.findMany({
        where,
        orderBy: { platformCreatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.orderCache.count({ where }),
    ]);

    const result = {
      data: {
        orders: orders.map((o) => ({
          id: o.id,
          platformOrderId: o.platformOrderId,
          status: o.status,
          buyerName: o.buyerName,
          totalAmount: Number(o.totalAmount),
          currency: o.currency,
          itemCount: o.itemCount,
          paidAt: o.paidAt,
          createdAt: o.platformCreatedAt,
          updatedAt: o.platformUpdatedAt,
        })),
      },
      meta: { page, limit, total, hasMore: page * limit < total },
    };

    await setCache(cacheKey, result, CACHE_TTL.ORDER_LIST);
    return result;
  }

  async getOrderDetail(userId: string, shopId: string, orderId: string) {
    const shop = await prisma.shopConnection.findFirst({
      where: { id: shopId, userId, disconnectedAt: null },
    });
    if (!shop) throw new Error('SHOP_NOT_FOUND');

    const cached = await prisma.orderCache.findFirst({
      where: { shopConnectionId: shopId, platformOrderId: orderId },
    });
    if (cached) {
      return {
        id: cached.id,
        platformOrderId: cached.platformOrderId,
        status: cached.status,
        buyerName: cached.buyerName,
        totalAmount: Number(cached.totalAmount),
        currency: cached.currency,
        itemCount: cached.itemCount,
        paidAt: cached.paidAt,
        raw: cached.rawData,
      };
    }

    const [detail] = await tiktokOrder.getOrderDetail(shop, [orderId]);
    if (!detail) throw new Error('ORDER_NOT_FOUND');
    return detail;
  }

  async syncOrders(userId: string, shopId: string): Promise<{ synced: number }> {
    const shop = await prisma.shopConnection.findFirst({
      where: { id: shopId, userId, disconnectedAt: null },
    });
    if (!shop) throw new Error('SHOP_NOT_FOUND');

    if (shop.platform !== 'TIKTOK') {
      throw new Error('ORDER_SYNC_NOT_SUPPORTED_FOR_PLATFORM');
    }

    let pageToken: string | undefined;
    let hasMore = true;
    let synced = 0;

    // Cap pagination to avoid runaway loops if TikTok always returns hasMore=true
    let safetyCounter = 0;

    while (hasMore && safetyCounter < 50) {
      safetyCounter++;
      const result = await tiktokOrder.getOrderList(shop, 50, pageToken);

      for (const o of result.orders) {
        await prisma.orderCache.upsert({
          where: {
            shopConnectionId_platformOrderId: {
              shopConnectionId: shopId,
              platformOrderId: o.id,
            },
          },
          create: {
            shopConnectionId: shopId,
            platformOrderId: o.id,
            status: o.status,
            buyerName: o.buyerName,
            totalAmount: o.totalAmount,
            currency: o.currency,
            itemCount: o.itemCount,
            paidAt: o.paidTime ? new Date(o.paidTime * 1000) : null,
            rawData: o.raw as any,
            platformCreatedAt: o.createTime ? new Date(o.createTime * 1000) : null,
            platformUpdatedAt: o.updateTime ? new Date(o.updateTime * 1000) : null,
          },
          update: {
            status: o.status,
            buyerName: o.buyerName,
            totalAmount: o.totalAmount,
            currency: o.currency,
            itemCount: o.itemCount,
            paidAt: o.paidTime ? new Date(o.paidTime * 1000) : null,
            rawData: o.raw as any,
            platformUpdatedAt: o.updateTime ? new Date(o.updateTime * 1000) : null,
          },
        });
        synced++;
      }

      hasMore = result.hasMore;
      pageToken = result.nextPageToken;
    }

    await prisma.shopConnection.update({ where: { id: shopId }, data: { lastSyncAt: new Date() } });
    await invalidateCache(`order_list:${shopId}:*`);

    logger.info({ shopId, synced }, 'TikTok order sync completed');
    return { synced };
  }
}

export const orderService = new OrderService();
