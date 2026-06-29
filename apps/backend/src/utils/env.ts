import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().length(64),
  CORS_ORIGIN: z.string().default('*'),
  API_BASE_URL: z.string().default('http://localhost:3000'),
  SHOPEE_PARTNER_ID: z.string().default(''),
  SHOPEE_PARTNER_KEY: z.string().default(''),
  TIKTOK_APP_KEY: z.string().default(''),
  TIKTOK_APP_SECRET: z.string().default(''),
});

export const env = EnvSchema.parse(process.env);
export type Env = z.infer<typeof EnvSchema>;
