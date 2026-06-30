// tiktok.auth.ts — TikTok Shop OAuth + token management
//
// Key insight: TikTok API v202309 requires 'shop_cipher' (not shop_id)
// in every API request. shop_cipher is obtained from GET /seller/202309/shops
// after OAuth and must be stored per-shop.

import crypto from 'crypto';
import axios from 'axios';
import { prisma } from '../../database/client';
import { encrypt } from '../../utils/crypto';

const APP_KEY = process.env.TIKTOK_APP_KEY!;
const APP_SECRET = process.env.TIKTOK_APP_SECRET!;
const REDIRECT_URI = `${process.env.API_BASE_URL}/api/shops/tiktok/callback`;

// TikTok's actual shop object structure from GET /seller/202309/shops
interface TikTokShop {
  id: string;       // shop_id
  cipher: string;   // shop_cipher — required for all subsequent API calls
  name: string;     // shop display name
  region: string;   // "ID", "MY", etc.
  seller_type: string;
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
    const res = await axios.post(
      'https://open-api.tiktokglobalshop.com/api/v2/token/oauth/access_token',
      {
        app_key: APP_KEY,
        app_secret: APP_SECRET,
        code,
        grant_type: 'authorized_code',
      },
    );

    if (res.data.code !== 0) {
      throw new Error(`TikTok OAuth error ${res.data.code}: ${res.data.message}`);
    }

    const d = res.data.data;
    return {
      accessToken: d.access_token,
      refreshToken: d.refresh_token,
      expiresAt: new Date(Date.now() + d.access_token_expire_in * 1000),
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
      {
        app_key: APP_KEY,
        app_secret: APP_SECRET,
        refresh_token: oldRefreshToken,
        grant_type: 'refresh_token',
      },
    );

    if (res.data.code !== 0) {
      throw new Error(`TikTok token refresh error ${res.data.code}: ${res.data.message}`);
    }

    const d = res.data.data;
    return {
      accessToken: d.access_token,
      refreshToken: d.refresh_token,
      expiresAt: new Date(Date.now() + d.access_token_expire_in * 1000),
    };
  },

  // FIX: return actual TikTok fields (id, cipher, name) not shop_id/shop_name
  async getShopList(accessToken: string): Promise<TikTokShop[]> {
    const res = await axios.get(
      'https://open-api.tiktokglobalshop.com/seller/202309/shops',
      {
        headers: { 'x-tts-access-token': accessToken },
        // GET /seller/202309/shops does NOT require shop_cipher (no shop context yet)
        params: {
          app_key: APP_KEY,
          timestamp: Math.floor(Date.now() / 1000),
        },
      },
    );

    if (res.data.code !== 0) {
      throw new Error(`TikTok getShopList error ${res.data.code}: ${res.data.message}`);
    }

    return res.data.data?.shops ?? [];
  },

  // FIX: extract userId from oauthState, save shop_cipher
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
          platformShopId: shopInfo.id,    // FIX: was shopInfo.shop_id
        },
      },
      create: {
        userId,
        platform: 'TIKTOK',
        platformShopId: shopInfo.id,      // FIX: was shopInfo.shop_id
        shopName: shopInfo.name,           // FIX: was shopInfo.shop_name
        region: shopInfo.region,
        status: 'ACTIVE',
        accessTokenEnc: encrypt(accessToken),
        refreshTokenEnc: encrypt(refreshToken),
        tokenExpiresAt: expiresAt,
        shopCipherEnc: encrypt(shopInfo.cipher), // FIX: save cipher (new field)
      },
      update: {
        shopName: shopInfo.name,           // FIX: was shopInfo.shop_name
        region: shopInfo.region,
        status: 'ACTIVE',
        accessTokenEnc: encrypt(accessToken),
        refreshTokenEnc: encrypt(refreshToken),
        tokenExpiresAt: expiresAt,
        shopCipherEnc: encrypt(shopInfo.cipher), // FIX: update cipher too
        disconnectedAt: null,
      },
    });

    return shop;
  },
};
