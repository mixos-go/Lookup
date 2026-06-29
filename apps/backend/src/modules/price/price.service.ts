import { prisma } from '../../database/client';
import { shopeeProduct } from '../../integrations/shopee/shopee.product';
import { tiktokProduct } from '../../integrations/tiktok/tiktok.product';

export class PriceService {
  async updatePrice(userId: string, productId: string, input: any) {
    const shop = await prisma.shopConnection.findFirst({ where: { id: input.shopId, userId } });
    if (!shop) throw new Error('SHOP_NOT_FOUND');

    if (shop.platform === 'SHOPEE') {
      return shopeeProduct.updatePrice(shop, productId, input.updates);
    } else {
      return tiktokProduct.updatePrice(shop, productId, input.updates);
    }
  }
}
export const priceService = new PriceService();
