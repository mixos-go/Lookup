import type { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import { prisma } from '../../database/client';
import { redis } from '../../cache/redis';
import { invalidateCache } from '../../cache/redis';
import { logger } from '../../utils/logger';

function verifyShopeeSignature(body: string, authorization: string): boolean {
  const partnerKey = process.env.SHOPEE_PARTNER_KEY ?? '';
  const expected = crypto.createHmac('sha256', partnerKey).update(body).digest('hex');
  return expected === authorization;
}

function verifyTikTokSignature(payload: string, timestamp: string, appSecret: string, signature: string): boolean {
  const toSign = `${timestamp}${payload}`;
  const expected = crypto.createHmac('sha256', appSecret).update(toSign).digest('hex');
  return expected === signature;
}

export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  app.post('/webhooks/shopee', async (req, reply) => {
    const authorization = req.headers.authorization ?? '';
    const rawBody = JSON.stringify(req.body);

    if (!verifyShopeeSignature(rawBody, authorization)) {
      logger.warn('Shopee webhook signature mismatch');
    }

    const body = req.body as Record<string, unknown>;
    const eventType = String(body.code ?? body.event_type ?? 'unknown');
    const shopId = String(body.shopid ?? body.shop_id ?? '');

    try {
      await prisma.webhookEvent.create({
        data: {
          platform: 'SHOPEE',
          eventType,
          payload: body,
          signature: authorization,
        },
      });

      await invalidateCache(`product_list:*`);
      if (shopId) {
        await redis.publish(`lookup:sse:all`, JSON.stringify({
          type: 'shopee_webhook',
          eventType,
          shopId,
        }));
      }
    } catch (err) {
      logger.error({ err }, 'Failed to process Shopee webhook');
    }

    return reply.status(200).send('OK');
  });

  app.post('/webhooks/tiktok', async (req, reply) => {
    const appSecret = process.env.TIKTOK_APP_SECRET ?? '';
    const timestamp = req.headers['x-tts-timestamp'] as string ?? '';
    const signature = req.headers['x-tts-signature'] as string ?? '';
    const rawBody = JSON.stringify(req.body);

    if (!verifyTikTokSignature(rawBody, timestamp, appSecret, signature)) {
      logger.warn('TikTok webhook signature mismatch');
    }

    const body = req.body as Record<string, unknown>;
    const eventType = String(body.type ?? 'unknown');

    try {
      await prisma.webhookEvent.create({
        data: {
          platform: 'TIKTOK',
          eventType,
          payload: body,
          signature,
        },
      });

      await invalidateCache(`product_list:*`);
      await redis.publish('lookup:sse:all', JSON.stringify({
        type: 'tiktok_webhook',
        eventType,
        data: body.data,
      }));
    } catch (err) {
      logger.error({ err }, 'Failed to process TikTok webhook');
    }

    return reply.status(200).send('OK');
  });

  app.get('/api/events/stream', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const userId: string = req.user.sub;

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    reply.raw.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);

    const subscriber = redis.duplicate();
    await subscriber.subscribe(`lookup:sse:${userId}`, 'lookup:sse:all');

    subscriber.on('message', (_channel: string, message: string) => {
      try {
        const event = JSON.parse(message);
        const eventName = event.type ?? 'update';
        reply.raw.write(`event: ${eventName}\ndata: ${JSON.stringify(event)}\n\n`);
      } catch {
        // ignore parse errors
      }
    });

    const keepalive = setInterval(() => {
      if (!reply.raw.writableEnded) {
        reply.raw.write(': keepalive\n\n');
      }
    }, 15000);

    req.raw.on('close', async () => {
      clearInterval(keepalive);
      await subscriber.unsubscribe();
      subscriber.disconnect();
      reply.raw.end();
    });
  });
}
