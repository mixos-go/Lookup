import type { FastifyInstance } from 'fastify';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, req, reply) => {
    if (error instanceof ZodError) {
      return reply.status(422).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
          details: error.flatten().fieldErrors,
        },
      });
    }

    const msg = error.message ?? '';

    const errorMap: Record<string, [number, string]> = {
      EMAIL_TAKEN: [409, 'Email already registered'],
      INVALID_CREDENTIALS: [401, 'Invalid email or password'],
      INVALID_REFRESH_TOKEN: [401, 'Refresh token is invalid or expired'],
      SHOP_NOT_FOUND: [404, 'Shop not found'],
      PRODUCT_NOT_FOUND: [404, 'Product not found'],
      JOB_NOT_FOUND: [404, 'Bulk job not found'],
      SHOP_NOT_CONNECTED: [400, 'Shop OAuth not completed'],
      TOKEN_EXPIRED: [401, 'Platform access token expired'],
      INVALID_STATE: [400, 'Invalid or expired OAuth state'],
    };

    if (errorMap[msg]) {
      const [status, message] = errorMap[msg];
      return reply.status(status).send({ success: false, error: { code: msg, message } });
    }

    logger.error({ err: error, path: req.url }, 'Unhandled error');
    return reply.status(500).send({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
    });
  });
}
