import { prisma } from '../../database/client';
import { shopeeAuth } from '../../integrations/shopee/shopee.auth';
import { tiktokAuth } from '../../integrations/tiktok/tiktok.auth';

export class ShopService {
  async listShops(userId: string) {
    return prisma.shopConnection.findMany({
      where: { userId, disconnectedAt: null },
      select: {
        id: true, platformShopId: true, shopName: true,
        platform: true, region: true, status: true, lastSyncAt: true, createdAt: true,
      },
    });
  }

  async getShopeeAuthUrl(userId: string) {
    return shopeeAuth.generateAuthUrl(userId);
  }

  async getTikTokAuthUrl(userId: string) {
    return tiktokAuth.generateAuthUrl(userId);
  }

  async disconnectShop(userId: string, shopId: string) {
    await prisma.shopConnection.update({
      where: { id: shopId, userId },
      data: { status: 'DISCONNECTED', disconnectedAt: new Date() },
    });
  }
}

export const shopService = new ShopService();
