import type { FastifyInstance } from 'fastify';
import { shopService } from './shop.service';

// TODO: Full implementation — see docs/API.md #Module:Shops
export async function shopRoutes(app: FastifyInstance) {
  app.get('/api/shops', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const shops = await shopService.listShops(req.user.sub);
    return reply.send({ success: true, data: { shops } });
  });

  app.get('/api/shops/shopee/auth-url', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const result = await shopService.getShopeeAuthUrl(req.user.sub);
    return reply.send({ success: true, data: result });
  });

  app.get('/api/shops/tiktok/auth-url', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const result = await shopService.getTikTokAuthUrl(req.user.sub);
    return reply.send({ success: true, data: result });
  });

  app.delete('/api/shops/:shopId', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    await shopService.disconnectShop(req.user.sub, req.params.shopId);
    return reply.send({ success: true, data: { message: 'Shop disconnected' } });
  });
}
