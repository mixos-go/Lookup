import Redis from 'ioredis';
import { logger } from '../utils/logger';

export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: null,
});

redis.on('connect', () => logger.info('Redis connected'));
redis.on('error', (err) => logger.error({ err }, 'Redis error'));

export const CACHE_TTL = {
  PRODUCT_DETAIL: 60 * 5,       // 5 minutes
  PRODUCT_LIST: 60 * 2,         // 2 minutes
  ORDER_LIST: 60 * 1,           // 1 minute — orders change more often than products
  TOKEN_CHECK: 30,              // 30 seconds
} as const;

export async function getCache<T>(key: string): Promise<T | null> {
  const val = await redis.get(key);
  return val ? JSON.parse(val) : null;
}

export async function setCache<T>(key: string, value: T, ttl: number): Promise<void> {
  await redis.set(`lookup:${key}`, JSON.stringify(value), 'EX', ttl);
}

export async function invalidateCache(pattern: string): Promise<void> {
  const keys = await redis.keys(`lookup:${pattern}`);
  if (keys.length) await redis.del(...keys);
}
