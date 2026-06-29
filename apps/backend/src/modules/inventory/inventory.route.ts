import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { inventoryService } from './inventory.service';

const UpdateStockSchema = z.object({
  shopId: z.string(),
  updates: z.array(z.object({ variantId: z.string(), stock: z.number().min(0).max(999999) })),
});

export async function inventoryRoutes(app: FastifyInstance) {
  app.patch('/api/inventory/:productId', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const input = UpdateStockSchema.parse(req.body);
    const result = await inventoryService.updateStock(req.user.sub, req.params.productId, input);
    return reply.send({ success: true, data: result });
  });
}
