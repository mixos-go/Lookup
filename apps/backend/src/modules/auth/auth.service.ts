import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../database/client';
import type { RegisterInput, LoginInput } from './auth.schema';

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing) throw new Error('EMAIL_TAKEN');

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: { email: input.email, name: input.name, passwordHash },
      select: { id: true, email: true, name: true },
    });
    return user;
  }

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new Error('INVALID_CREDENTIALS');

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new Error('INVALID_CREDENTIALS');

    return { id: user.id, email: user.email, name: user.name };
  }

  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true },
    });
    if (!user) throw new Error('USER_NOT_FOUND');
    return user;
  }

  async createRefreshToken(userId: string): Promise<string> {
    const token = crypto.randomBytes(40).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await prisma.refreshToken.create({ data: { token, userId, expiresAt } });
    return token;
  }

  async verifyRefreshToken(token: string) {
    const record = await prisma.refreshToken.findUnique({ where: { token } });
    if (!record || record.revokedAt || record.expiresAt < new Date()) {
      throw new Error('INVALID_REFRESH_TOKEN');
    }
    return record;
  }

  async revokeRefreshToken(token: string) {
    await prisma.refreshToken.update({
      where: { token },
      data: { revokedAt: new Date() },
    });
  }
}

export const authService = new AuthService();
