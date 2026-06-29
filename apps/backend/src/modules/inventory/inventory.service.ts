import { prisma } from '../../database/client';
import { shopeeProduct } from '../../integrations/shopee/shopee.product';
import { tiktokProduct } from '../../integrations/tiktok/tiktok.product';

export class InventoryService {
  async updateStock(userId: string, productId: string, input: { shopId: string; updates: Array<{variantId: string; stock: number}> }) {
    const shop = await prisma.shopConnection.findFirst({ where: { id: input.shopId, userId } });
    if (!shop) throw new Error('SHOP_NOT_FOUND');

    if (shop.platform === 'SHOPEE') {
      return shopeeProduct.updateStock(shop, productId, input.updates);
    } else {
      return tiktokProduct.updateInventory(shop, productId, input.updates);
    }
  }
}

export const inventoryService = new InventoryService();
