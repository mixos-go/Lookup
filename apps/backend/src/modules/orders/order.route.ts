import type { FastifyInstance } from 'fastify';
import { orderService } from './order.service';

export async function orderRoutes(app: FastifyInstance) {
  app.get('/api/orders', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const { shopId, page = 1, limit = 20, status } = req.query as any;
    const result = await orderService.listOrders({
      userId: req.user.sub,
      shopId,
      page: Number(page),
      limit: Number(limit),
      status,
    });
    return reply.send({ success: true, ...result });
  });

  app.get('/api/orders/:orderId', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const { shopId } = req.query as any;
    const order = await orderService.getOrderDetail(req.user.sub, shopId, req.params.orderId);
    return reply.send({ success: true, data: { order } });
  });

  app.post('/api/orders/sync', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const { shopId } = req.body as any;
    const result = await orderService.syncOrders(req.user.sub, shopId);
    return reply.send({ success: true, data: result });
  });
}
