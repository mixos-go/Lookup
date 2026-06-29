import type { FastifyInstance } from 'fastify';
import { shopService } from './shop.service';

export async function shopRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/shops', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const shops = await shopService.listShops(req.user.sub);
    return reply.send({ success: true, data: { shops } });
  });

  app.get('/api/shops/shopee/auth-url', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const result = await shopService.getShopeeAuthUrl(req.user.sub);
    return reply.send({ success: true, data: result });
  });

  app.get('/api/shops/shopee/callback', async (req: any, reply) => {
    const { code, shop_id, state } = req.query;
    if (!code || !shop_id || !state) {
      return reply.status(400).send({ success: false, error: { code: 'MISSING_PARAMS', message: 'Missing OAuth params' } });
    }
    const shop = await shopService.handleShopeeCallback(req.user?.sub ?? '', code, shop_id, state);
    return reply.send({
      success: true,
      data: {
        shop: {
          id: shop.id,
          platformShopId: shop.platformShopId,
          shopName: shop.shopName,
          platform: shop.platform,
          region: shop.region,
          connectedAt: shop.createdAt.toISOString(),
        },
      },
    });
  });

  app.post('/api/shops/shopee/refresh', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const { shopId } = req.body as { shopId: string };
    await shopService.refreshShopeeToken(req.user.sub, shopId);
    return reply.send({ success: true, data: { message: 'Token refreshed' } });
  });

  app.get('/api/shops/tiktok/auth-url', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const result = await shopService.getTikTokAuthUrl(req.user.sub);
    return reply.send({ success: true, data: result });
  });

  app.get('/api/shops/tiktok/callback', async (req: any, reply) => {
    const { code, state } = req.query;
    if (!code || !state) {
      return reply.status(400).send({ success: false, error: { code: 'MISSING_PARAMS', message: 'Missing OAuth params' } });
    }
    const shop = await shopService.handleTikTokCallback(req.user?.sub ?? '', code, state);
    return reply.send({
      success: true,
      data: {
        shop: {
          id: shop.id,
          platformShopId: shop.platformShopId,
          shopName: shop.shopName,
          platform: shop.platform,
          region: shop.region,
          connectedAt: shop.createdAt.toISOString(),
        },
      },
    });
  });

  app.post('/api/shops/tiktok/refresh', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const { shopId } = req.body as { shopId: string };
    await shopService.refreshTikTokToken(req.user.sub, shopId);
    return reply.send({ success: true, data: { message: 'Token refreshed' } });
  });

  app.delete('/api/shops/:shopId', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    await shopService.disconnectShop(req.user.sub, req.params.shopId);
    return reply.send({ success: true, data: { message: 'Shop disconnected' } });
  });
}
