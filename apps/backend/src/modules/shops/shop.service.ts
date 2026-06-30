import { prisma } from '../../database/client';
import { encrypt } from '../../utils/crypto';
import { shopeeAuth } from '../../integrations/shopee/shopee.auth';
import { tiktokAuth } from '../../integrations/tiktok/tiktok.auth';
import type { ShopConnection } from '@prisma/client';

export class ShopService {
  async listShops(userId: string) {
    const shops = await prisma.shopConnection.findMany({
      where: { userId, disconnectedAt: null },
      orderBy: { createdAt: 'asc' },
    });

    const counts = await prisma.productCache.groupBy({
      by: ['shopConnectionId'],
      where: { shopConnectionId: { in: shops.map((s) => s.id) } },
      _count: { id: true },
    });
    const countMap = new Map(counts.map((c) => [c.shopConnectionId, c._count.id]));

    return shops.map((s) => ({
      id: s.id,
      platformShopId: s.platformShopId,
      shopName: s.shopName,
      platform: s.platform,
      region: s.region,
      status: s.status,
      productCount: countMap.get(s.id) ?? 0,
      connectedAt: s.createdAt.toISOString(),
      lastSyncAt: s.lastSyncAt?.toISOString() ?? null,
    }));
  }

  async getShopeeAuthUrl(userId: string) {
    return shopeeAuth.generateAuthUrl(userId);
  }

  async getTikTokAuthUrl(userId: string) {
    return tiktokAuth.generateAuthUrl(userId);
  }

  // FIX: no userId param — extracted from state in handleCallback
  async handleShopeeCallback(code: string, shopId: string, state: string): Promise<ShopConnection> {
    return shopeeAuth.handleCallback(code, shopId, state);
  }

  async handleTikTokCallback(code: string, state: string): Promise<ShopConnection> {
    return tiktokAuth.handleCallback(code, state);
  }

  async refreshShopeeToken(userId: string, shopId: string): Promise<void> {
    const shop = await prisma.shopConnection.findFirst({ where: { id: shopId, userId } });
    if (!shop) throw new Error('SHOP_NOT_FOUND');
    const { accessToken, refreshToken, expiresAt } = await shopeeAuth.refreshAccessToken(shop);
    await prisma.shopConnection.update({
      where: { id: shopId },
      data: { accessTokenEnc: encrypt(accessToken), refreshTokenEnc: encrypt(refreshToken), tokenExpiresAt: expiresAt, status: 'ACTIVE' },
    });
  }

  async refreshTikTokToken(userId: string, shopId: string): Promise<void> {
    const shop = await prisma.shopConnection.findFirst({ where: { id: shopId, userId } });
    if (!shop) throw new Error('SHOP_NOT_FOUND');
    const { accessToken, refreshToken, expiresAt } = await tiktokAuth.refreshAccessToken(shop);
    await prisma.shopConnection.update({
      where: { id: shopId },
      data: { accessTokenEnc: encrypt(accessToken), refreshTokenEnc: encrypt(refreshToken), tokenExpiresAt: expiresAt, status: 'ACTIVE' },
    });
  }

  async disconnectShop(userId: string, shopId: string): Promise<void> {
    await prisma.shopConnection.update({
      where: { id: shopId, userId },
      data: { status: 'DISCONNECTED', disconnectedAt: new Date() },
    });
  }
}

export const shopService = new ShopService();
