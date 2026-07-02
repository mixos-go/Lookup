import type { FastifyInstance } from 'fastify';
import { authService } from './auth.service';
import { RegisterSchema, LoginSchema, RefreshSchema } from './auth.schema';

export async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/register', async (req, reply) => {
    const input = RegisterSchema.parse(req.body);
    const user = await authService.register(input);
    const accessToken = app.jwt.sign({ sub: user.id }, { expiresIn: '15m' });
    const refreshToken = await authService.createRefreshToken(user.id);
    return reply.status(201).send({ success: true, data: { user, accessToken, refreshToken } });
  });

  app.post('/api/auth/login', async (req, reply) => {
    const input = LoginSchema.parse(req.body);
    const user = await authService.login(input);
    const accessToken = app.jwt.sign({ sub: user.id }, { expiresIn: '15m' });
    const refreshToken = await authService.createRefreshToken(user.id);
    return reply.send({ success: true, data: { user, accessToken, refreshToken } });
  });

  app.post('/api/auth/refresh', async (req, reply) => {
    const { refreshToken } = RefreshSchema.parse(req.body);
    const record = await authService.verifyRefreshToken(refreshToken);
    await authService.revokeRefreshToken(refreshToken);
    const newAccessToken = app.jwt.sign({ sub: record.userId }, { expiresIn: '15m' });
    const newRefreshToken = await authService.createRefreshToken(record.userId);
    
    // Get user data to return along with tokens
    const user = await authService.getUserById(record.userId);
    
    return reply.send({ 
      success: true, 
      data: { 
        accessToken: newAccessToken, 
        refreshToken: newRefreshToken,
        user 
      } 
    });
  });

  app.post('/api/auth/logout', { onRequest: [app.authenticate] }, async (req, reply) => {
    const { refreshToken } = RefreshSchema.parse(req.body);
    await authService.revokeRefreshToken(refreshToken);
    return reply.send({ success: true, data: { message: 'Logged out' } });
  });

  // Add a me endpoint to get current user info
  app.get('/api/auth/me', { onRequest: [app.authenticate] }, async (req: any, reply) => {
    const user = await authService.getUserById(req.user.sub);
    return reply.send({ success: true, data: { user } });
  });
}
