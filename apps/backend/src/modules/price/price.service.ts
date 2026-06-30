import { prisma } from '../../database/client';
import { shopeeProduct } from '../../integrations/shopee/shopee.product';
import { tiktokProduct } from '../../integrations/tiktok/tiktok.product';

interface PriceUpdate {
  variantId: string;
  price: number;
  originalPrice?: number;
}

interface UpdatePriceInput {
  shopId: string;
  updates: PriceUpdate[];
}

export class PriceService {
  async updatePrice(
    userId: string,
    productId: string,
    input: UpdatePriceInput,
  ): Promise<{ updated: PriceUpdate[]; updatedAt: string }> {
    const shop = await prisma.shopConnection.findFirst({
      where: { id: input.shopId, userId, disconnectedAt: null },
    });
    if (!shop) throw new Error('SHOP_NOT_FOUND');

    if (shop.platform === 'SHOPEE') {
      return shopeeProduct.updatePrice(shop, productId, input.updates);
    } else {
      return tiktokProduct.updatePrice(shop, productId, input.updates);
    }
  }
}

export const priceService = new PriceService();
