// tiktok.auth.ts — TikTok Shop OAuth + token management
//
// Uses the OFFICIAL TikTok Shop Node.js SDK (vendored under ./sdk) for token
// exchange/refresh and fetching authorized shops. Only the initial authorize
// URL is built manually, since the SDK does not provide that helper.
//
// Key insight: TikTok API v202309 requires 'shop_cipher' (not shop_id)
// in every API request. shop_cipher is obtained from the authorized shops
// list after OAuth and must be stored per-shop.

import crypto from 'crypto';
import { prisma } from '../../database/client';
import { encrypt } from '../../utils/crypto';
import { AccessTokenTool } from './sdk/client/token';
import { AuthorizationV202309Api } from './sdk/api/authorizationV202309Api';
import { createTikTokSdkClient, CONTENT_TYPE_JSON } from './tiktok.sdk-client';

const APP_KEY = process.env.TIKTOK_APP_KEY!;
const APP_SECRET = process.env.TIKTOK_APP_SECRET!;
const REDIRECT_URI = `${process.env.API_BASE_URL}/api/shops/tiktok/callback`;

interface TikTokShop {
  id: string;
  cipher: string;
  name: string;
  region: string;
  sellerType: string;
}

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
  }> {
    const { body } = await AccessTokenTool.getAccessToken(code, APP_KEY, APP_SECRET);

    if (body.code !== 0 || !body.data) {
      throw new Error(`TikTok OAuth error ${body.code}: ${body.message}`);
    }

    const d = body.data;
    return {
      accessToken: d.access_token,
      refreshToken: d.refresh_token,
      expiresAt: new Date(Date.now() + (d.access_token_expire_in ?? 0) * 1000),
    };
  },

  async refreshAccessToken(shop: import('@prisma/client').ShopConnection): Promise<{
    accessToken: string;
    refreshToken: string;
    expiresAt: Date;
  }> {
    const { decrypt } = await import('../../utils/crypto');
    const oldRefreshToken = decrypt(shop.refreshTokenEnc);

    const { body } = await AccessTokenTool.refreshToken(oldRefreshToken, APP_KEY, APP_SECRET);

    if (body.code !== 0 || !body.data) {
      throw new Error(`TikTok token refresh error ${body.code}: ${body.message}`);
    }

    const d = body.data;
    return {
      accessToken: d.access_token,
      refreshToken: d.refresh_token,
      expiresAt: new Date(Date.now() + (d.access_token_expire_in ?? 0) * 1000),
    };
  },

  async getShopList(accessToken: string): Promise<TikTokShop[]> {
    const sdk = createTikTokSdkClient();
    const authApi = sdk.api.AuthorizationV202309Api as AuthorizationV202309Api;
    const { body } = await authApi.ShopsGet(accessToken, CONTENT_TYPE_JSON);

    if (body.code !== 0) {
      throw new Error(`TikTok getShopList error ${body.code}: ${body.message}`);
    }

    return (body.data?.shops ?? []).map((s) => ({
      id: s.id ?? '',
      cipher: s.cipher ?? '',
      name: s.name ?? '',
      region: s.region ?? '',
      sellerType: s.sellerType ?? '',
    }));
  },

  async handleCallback(
    code: string,
    state: string,
  ): Promise<import('@prisma/client').ShopConnection> {
    const oauthState = await prisma.oAuthState.findUnique({ where: { state } });
    if (!oauthState || oauthState.expiresAt < new Date() || oauthState.usedAt) {
      throw new Error('INVALID_STATE');
    }

    await prisma.oAuthState.update({ where: { id: oauthState.id }, data: { usedAt: new Date() } });

    const userId = oauthState.userId;
    const { accessToken, refreshToken, expiresAt } = await tiktokAuth.exchangeCode(code);
    const shops = await tiktokAuth.getShopList(accessToken);

    if (shops.length === 0) {
      throw new Error('TIKTOK_NO_SHOPS: No authorized shops found after OAuth');
    }

    // Use first shop (most sellers have one; multi-shop support = Phase 7+)
    const shopInfo = shops[0];

    const shop = await prisma.shopConnection.upsert({
      where: {
        userId_platform_platformShopId: {
          userId,
          platform: 'TIKTOK',
          platformShopId: shopInfo.id,
        },
      },
      create: {
        userId,
        platform: 'TIKTOK',
        platformShopId: shopInfo.id,
        shopName: shopInfo.name,
        region: shopInfo.region,
        status: 'ACTIVE',
        accessTokenEnc: encrypt(accessToken),
        refreshTokenEnc: encrypt(refreshToken),
        tokenExpiresAt: expiresAt,
        shopCipherEnc: encrypt(shopInfo.cipher),
      },
      update: {
        shopName: shopInfo.name,
        region: shopInfo.region,
        status: 'ACTIVE',
        accessTokenEnc: encrypt(accessToken),
        refreshTokenEnc: encrypt(refreshToken),
        tokenExpiresAt: expiresAt,
        shopCipherEnc: encrypt(shopInfo.cipher),
        disconnectedAt: null,
      },
    });

    return shop;
  },
};
