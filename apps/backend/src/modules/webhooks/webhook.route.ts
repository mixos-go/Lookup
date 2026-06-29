import type { FastifyInstance } from 'fastify';

export async function webhookRoutes(app: FastifyInstance) {
  // Public endpoints — no auth, but verify platform signatures
  app.post('/webhooks/shopee', async (req, reply) => {
    // TODO: verify Shopee signature, store event, process async
    return reply.status(200).send('OK');
  });

  app.post('/webhooks/tiktok', async (req, reply) => {
    // TODO: verify TikTok signature, store event, process async
    return reply.status(200).send('OK');
  });

  // SSE stream
  app.get('/api/events/stream', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    // TODO: Subscribe to redis pubsub channel for this userId
    // Push events as: `data: ${JSON.stringify(event)}\n\n`
    req.raw.on('close', () => reply.raw.end());
  });
}
