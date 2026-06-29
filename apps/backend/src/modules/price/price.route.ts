import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { priceService } from './price.service';

const UpdatePriceSchema = z.object({
  shopId: z.string(),
  updates: z.array(z.object({
    variantId: z.string(),
    price: z.number().min(1),
    originalPrice: z.number().optional(),
  })),
});

export async function priceRoutes(app: FastifyInstance) {
  app.patch('/api/price/:productId', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const input = UpdatePriceSchema.parse(req.body);
    const result = await priceService.updatePrice(req.user.sub, req.params.productId, input);
    return reply.send({ success: true, data: result });
  });
}
