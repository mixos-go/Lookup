import type { FastifyInstance } from 'fastify';
import { authRoutes } from './auth/auth.route';
import { shopRoutes } from './shops/shop.route';
import { productRoutes } from './products/product.route';
import { inventoryRoutes } from './inventory/inventory.route';
import { priceRoutes } from './price/price.route';
import { imageRoutes } from './images/image.route';
import { bulkRoutes } from './bulk/bulk.route';
import { webhookRoutes } from './webhooks/webhook.route';

export async function registerRoutes(app: FastifyInstance) {
  // Decorate authenticate
  app.decorate('authenticate', async (req: any, reply: any) => {
    try {
      await req.jwtVerify();
    } catch {
      reply.status(401).send({ success: false, error: { code: 'UNAUTHORIZED' } });
    }
  });

  await app.register(authRoutes);
  await app.register(shopRoutes);
  await app.register(productRoutes);
  await app.register(inventoryRoutes);
  await app.register(priceRoutes);
  await app.register(imageRoutes);
  await app.register(bulkRoutes);
  await app.register(webhookRoutes);
}
