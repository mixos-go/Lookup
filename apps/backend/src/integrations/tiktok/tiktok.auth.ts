import crypto from 'crypto';
import axios from 'axios';
import { prisma } from '../../database/client';
import { encrypt } from '../../utils/crypto';

const APP_KEY = process.env.TIKTOK_APP_KEY!;
const APP_SECRET = process.env.TIKTOK_APP_SECRET!;
const REDIRECT_URI = `${process.env.API_BASE_URL}/api/shops/tiktok/callback`;

export const tiktokAuth = {
  async generateAuthUrl(userId: string) {
    const state = crypto.randomBytes(16).toString('hex');

    await prisma.oAuthState.create({
      data: { state, userId, platform: 'TIKTOK', expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });

    const url = `https://services.tiktokshop.com/open/authorize?service_id=${APP_KEY}&state=${state}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    return { url, state };
  },

  async exchangeCode(code: string) {
    const res = await axios.post('https://open-api.tiktokglobalshop.com/api/v2/token/oauth/access_token', {
      app_key: APP_KEY, app_secret: APP_SECRET, code, grant_type: 'authorized_code',
    });
    return {
      accessToken: res.data.data.access_token,
      refreshToken: res.data.data.refresh_token,
      expiresAt: new Date(Date.now() + res.data.data.access_token_expire_in * 1000),
      shopId: res.data.data.open_id,
    };
  },
};
