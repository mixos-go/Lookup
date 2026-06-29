import type { FastifyInstance } from 'fastify';
import { productService } from './product.service';

export async function productRoutes(app: FastifyInstance) {
  app.get('/api/products', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const { shopId, page = 1, limit = 20, search, status } = req.query as any;
    const result = await productService.listProducts({ userId: req.user.sub, shopId, page: Number(page), limit: Number(limit), search, status });
    return reply.send({ success: true, ...result });
  });

  app.get('/api/products/:productId', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const product = await productService.getProductDetail(req.user.sub, req.params.productId, req.query.shopId);
    return reply.send({ success: true, data: { product } });
  });

  app.post('/api/products/sync', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const { shopId } = req.body as any;
    const result = await productService.syncProducts(req.user.sub, shopId);
    return reply.send({ success: true, data: result });
  });
}
