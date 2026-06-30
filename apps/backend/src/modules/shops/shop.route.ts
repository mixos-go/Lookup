import type { FastifyInstance } from 'fastify';
import { shopService } from './shop.service';

const DEEP_LINK_SCHEME = 'lookup://oauth/callback';

export async function shopRoutes(app: FastifyInstance): Promise<void> {
  // Authenticated routes
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

  app.post('/api/shops/shopee/refresh', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const { shopId } = req.body as { shopId: string };
    await shopService.refreshShopeeToken(req.user.sub, shopId);
    return reply.send({ success: true, data: { message: 'Token refreshed' } });
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

  // ─── OAuth Callbacks (NO auth required — Shopee/TikTok redirects here) ───────
  // FIX: No longer reads req.user.sub — userId comes from state stored in DB

  app.get('/api/shops/shopee/callback', async (req: any, reply) => {
    const { code, shop_id, state } = req.query as Record<string, string>;

    if (!code || !shop_id || !state) {
      const errorLink = `${DEEP_LINK_SCHEME}?success=false&platform=SHOPEE&error=MISSING_PARAMS`;
      return reply.redirect(errorLink);
    }

    try {
      const shop = await shopService.handleShopeeCallback(code, shop_id, state);
      // Redirect to mobile app via deep link
      const deepLink = `${DEEP_LINK_SCHEME}?success=true&platform=SHOPEE&shopId=${shop.id}&shopName=${encodeURIComponent(shop.shopName)}`;
      return reply.redirect(deepLink);
    } catch (err: any) {
      const errorLink = `${DEEP_LINK_SCHEME}?success=false&platform=SHOPEE&error=${encodeURIComponent(err.message ?? 'UNKNOWN')}`;
      return reply.redirect(errorLink);
    }
  });

  app.get('/api/shops/tiktok/callback', async (req: any, reply) => {
    const { code, state } = req.query as Record<string, string>;

    if (!code || !state) {
      const errorLink = `${DEEP_LINK_SCHEME}?success=false&platform=TIKTOK&error=MISSING_PARAMS`;
      return reply.redirect(errorLink);
    }

    try {
      const shop = await shopService.handleTikTokCallback(code, state);
      const deepLink = `${DEEP_LINK_SCHEME}?success=true&platform=TIKTOK&shopId=${shop.id}&shopName=${encodeURIComponent(shop.shopName)}`;
      return reply.redirect(deepLink);
    } catch (err: any) {
      const errorLink = `${DEEP_LINK_SCHEME}?success=false&platform=TIKTOK&error=${encodeURIComponent(err.message ?? 'UNKNOWN')}`;
      return reply.redirect(errorLink);
    }
  });
}
