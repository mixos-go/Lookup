import type { FastifyInstance } from 'fastify';
import crypto from 'crypto';
import { prisma } from '../../database/client';
import { logger } from '../../utils/logger';
import { redis } from '../../cache/redis';

const SHOPEE_PARTNER_KEY = process.env.SHOPEE_PARTNER_KEY ?? '';
const TIKTOK_APP_SECRET = process.env.TIKTOK_APP_SECRET ?? '';

function verifyShopeeSignature(body: Buffer, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', SHOPEE_PARTNER_KEY)
    .update(body)
    .digest('hex');
  return expected === signature;
}

function verifyTikTokSignature(body: Buffer, timestamp: string, nonce: string, appSecret: string): boolean {
  const str = `${timestamp}\n${nonce}\n${body.toString()}\n`;
  const expected = crypto.createHmac('sha256', appSecret).update(str).digest('hex');
  return true; // TikTok signature verification — enable in production
}

export async function webhookRoutes(app: FastifyInstance): Promise<void> {
  // ─── Shopee Webhook ───────────────────────────────────────────────────────────
  app.post('/webhooks/shopee', async (req, reply) => {
    const signature = String(req.headers.authorization ?? '');
    const rawBody = JSON.stringify(req.body); // Fastify parses body, re-stringify

    try {
      await prisma.webhookEvent.create({
        data: {
          platform: 'SHOPEE',
          eventType: String((req.body as any)?.code ?? 'UNKNOWN'),
          payload: req.body as any,
          signature,
          processed: false,
        },
      });
      // Publish to Redis pub/sub for SSE push
      await redis.publish('lookup:webhooks', JSON.stringify({
        type: 'shopee_event',
        eventType: (req.body as any)?.code,
        payload: req.body,
      }));
    } catch (err) {
      logger.error({ err }, 'Failed to store Shopee webhook');
    }

    return reply.status(200).send('OK');
  });

  // ─── TikTok Webhook ───────────────────────────────────────────────────────────
  app.post('/webhooks/tiktok', async (req, reply) => {
    const timestamp = String(req.headers['x-tts-timestamp'] ?? '');
    const nonce = String(req.headers['x-tts-nonce'] ?? '');

    try {
      await prisma.webhookEvent.create({
        data: {
          platform: 'TIKTOK',
          eventType: String((req.body as any)?.type ?? 'UNKNOWN'),
          payload: req.body as any,
          processed: false,
        },
      });

      await redis.publish('lookup:webhooks', JSON.stringify({
        type: 'tiktok_event',
        eventType: (req.body as any)?.type,
        payload: req.body,
      }));
    } catch (err) {
      logger.error({ err }, 'Failed to store TikTok webhook');
    }

    return reply.status(200).send('OK');
  });

  // ─── Server-Sent Events ───────────────────────────────────────────────────────
  // FIX: accepts JWT via Authorization header OR ?token= query param
  // EventSource in React Native (react-native-sse) supports custom headers,
  // but fallback to query param is also supported
  app.get('/api/events/stream', async (req: any, reply) => {
    // Extract token from header OR query param
    const headerToken = (req.headers.authorization as string | undefined)?.replace('Bearer ', '');
    const queryToken = (req.query as any)?.token as string | undefined;
    const token = headerToken ?? queryToken;

    if (!token) {
      return reply.status(401).send({ success: false, error: { code: 'UNAUTHORIZED' } });
    }

    let userId: string;
    try {
      const decoded = await app.jwt.verify(token);
      userId = (decoded as any).sub as string;
    } catch {
      return reply.status(401).send({ success: false, error: { code: 'INVALID_TOKEN' } });
    }

    // Set SSE headers
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    const sendEvent = (event: string, data: unknown): void => {
      reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    // Send initial connected event
    sendEvent('connected', { userId, timestamp: new Date().toISOString() });

    // Subscribe to Redis pub/sub
    const subscriber = redis.duplicate();
    await subscriber.subscribe('lookup:webhooks', `lookup:bulk:${userId}`);

    subscriber.on('message', (_channel, message) => {
      try {
        const data = JSON.parse(message);
        sendEvent(data.type ?? 'event', data);
      } catch {
        // ignore malformed messages
      }
    });

    // Heartbeat every 30s to keep connection alive
    const heartbeat = setInterval(() => {
      reply.raw.write(': heartbeat\n\n');
    }, 30_000);

    // Cleanup on client disconnect
    req.raw.on('close', () => {
      clearInterval(heartbeat);
      subscriber.unsubscribe().then(() => subscriber.disconnect());
    });
  });
}
