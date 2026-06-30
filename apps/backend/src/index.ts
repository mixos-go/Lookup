import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import multipart from '@fastify/multipart';
import { env } from './utils/env';
import { logger } from './utils/logger';
import { registerRoutes } from './modules';
import { registerErrorHandler } from './middleware/errorHandler';
import { prisma } from './database/client';
import { redis } from './cache/redis';

// Start BullMQ worker — import triggers registration (SSE-enabled version)
import './workers/bulk.worker';

const app = Fastify({ logger: false });

async function bootstrap(): Promise<void> {
  await app.register(helmet);
  await app.register(cors, { origin: env.CORS_ORIGIN });
  await app.register(jwt, { secret: env.JWT_SECRET });
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });
  await app.register(multipart, { limits: { fileSize: 5 * 1024 * 1024 } });

  registerErrorHandler(app);
  await registerRoutes(app);

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: { database: 'connected', redis: 'connected' },
  }));

  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  logger.info(`Server running on port ${env.PORT}`);
}

const shutdown = async (): Promise<void> => {
  logger.info('Shutting down...');
  await app.close();
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

bootstrap().catch((err) => {
  logger.error(err);
  process.exit(1);
});
