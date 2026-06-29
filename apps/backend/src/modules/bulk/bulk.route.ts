import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { bulkService } from './bulk.service';

const BulkStockSchema = z.object({
  shopId: z.string(),
  items: z.array(z.object({ productId: z.string(), variantId: z.string(), stock: z.number().min(0) })).max(200),
});

export async function bulkRoutes(app: FastifyInstance) {
  app.post('/api/bulk/stock', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const input = BulkStockSchema.parse(req.body);
    const job = await bulkService.createStockJob(req.user.sub, input);
    return reply.status(202).send({ success: true, data: job });
  });

  app.get('/api/bulk/:jobId/status', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const job = await bulkService.getJobStatus(req.user.sub, req.params.jobId);
    return reply.send({ success: true, data: job });
  });

  app.get('/api/bulk/history', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const jobs = await bulkService.getHistory(req.user.sub);
    return reply.send({ success: true, data: { jobs } });
  });
}
