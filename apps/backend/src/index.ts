import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import jwt from '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';
import { env } from './utils/env';
import { logger } from './utils/logger';
import { registerRoutes } from './modules';
import { prisma } from './database/client';
import { redis } from './cache/redis';

const app = Fastify({ logger: false });

async function bootstrap() {
  // Plugins
  await app.register(helmet);
  await app.register(cors, { origin: env.CORS_ORIGIN });
  await app.register(jwt, { secret: env.JWT_SECRET });
  await app.register(rateLimit, { max: 100, timeWindow: '1 minute' });

  // Routes
  await registerRoutes(app);

  // Health check
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: 'connected',
      redis: 'connected',
    },
  }));

  // Start
  await app.listen({ port: env.PORT, host: '0.0.0.0' });
  logger.info(`Server running on port ${env.PORT}`);
}

// Graceful shutdown
const shutdown = async () => {
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
