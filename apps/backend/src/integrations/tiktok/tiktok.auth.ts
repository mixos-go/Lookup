import crypto from 'crypto';
import axios from 'axios';
import { prisma } from '../../database/client';
import { encrypt } from '../../utils/crypto';

const APP_KEY = process.env.TIKTOK_APP_KEY!;
const APP_SECRET = process.env.TIKTOK_APP_SECRET!;
const REDIRECT_URI = `${process.env.API_BASE_URL}/api/shops/tiktok/callback`;

export const tiktokAuth = {
  async generateAuthUrl(userId: string): Promise<{ url: string; state: string }> {
    const state = crypto.randomBytes(16).toString('hex');

    await prisma.oAuthState.create({
      data: {
        state,
        userId,
        platform: 'TIKTOK',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const url = `https://services.tiktokshop.com/open/authorize?service_id=${APP_KEY}&state=${state}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
    return { url, state };
  },

  async exchangeCode(code: string): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
    openId: string;
  }> {
    const res = await axios.post(
      'https://open-api.tiktokglobalshop.com/api/v2/token/oauth/access_token',
      { app_key: APP_KEY, app_secret: APP_SECRET, code, grant_type: 'authorized_code' },
    );

    const d = res.data.data;
    return {
      accessToken: d.access_token,
      refreshToken: d.refresh_token,
      expiresAt: new Date(Date.now() + d.access_token_expire_in * 1000),
      openId: d.open_id,
    };
  },

  async refreshAccessToken(shop: import('@prisma/client').ShopConnection): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  }> {
    const { decrypt } = await import('../../utils/crypto');
    const oldRefreshToken = decrypt(shop.refreshTokenEnc);

    const res = await axios.post(
      'https://open-api.tiktokglobalshop.com/api/v2/token/refresh_token',
      { app_key: APP_KEY, app_secret: APP_SECRET, refresh_token: oldRefreshToken, grant_type: 'refresh_token' },
    );

    const d = res.data.data;
    return {
      accessToken: d.access_token,
      refreshToken: d.refresh_token,
      expiresAt: new Date(Date.now() + d.access_token_expire_in * 1000),
    };
  },

  async getShopList(accessToken: string): Promise<Array<{ shop_id: string; shop_name: string; region: string }>> {
    const res = await axios.get('https://open-api.tiktokglobalshop.com/seller/202309/shops', {
      headers: { 'x-tts-access-token': accessToken },
    });
    return res.data.data?.shops ?? [];
  },

  async handleCallback(
    userId: string,
    code: string,
    state: string,
  ): Promise<import('@prisma/client').ShopConnection> {
    const oauthState = await prisma.oAuthState.findUnique({ where: { state } });
    if (!oauthState || oauthState.userId !== userId || oauthState.expiresAt < new Date() || oauthState.usedAt) {
      throw new Error('INVALID_STATE');
    }

    await prisma.oAuthState.update({ where: { id: oauthState.id }, data: { usedAt: new Date() } });

    const { accessToken, refreshToken, expiresAt } = await tiktokAuth.exchangeCode(code);
    const shops = await tiktokAuth.getShopList(accessToken);
    const shopInfo = shops[0] ?? { shop_id: 'unknown', shop_name: 'TikTok Shop', region: 'ID' };

    const shop = await prisma.shopConnection.upsert({
      where: {
        userId_platform_platformShopId: {
          userId,
          platform: 'TIKTOK',
          platformShopId: shopInfo.shop_id,
        },
      },
      create: {
        userId,
        platform: 'TIKTOK',
        platformShopId: shopInfo.shop_id,
        shopName: shopInfo.shop_name,
        region: shopInfo.region,
        status: 'ACTIVE',
        accessTokenEnc: encrypt(accessToken),
        refreshTokenEnc: encrypt(refreshToken),
        tokenExpiresAt: expiresAt,
      },
      update: {
        shopName: shopInfo.shop_name,
        region: shopInfo.region,
        status: 'ACTIVE',
        accessTokenEnc: encrypt(accessToken),
        refreshTokenEnc: encrypt(refreshToken),
        tokenExpiresAt: expiresAt,
        disconnectedAt: null,
      },
    });

    return shop;
  },
};
