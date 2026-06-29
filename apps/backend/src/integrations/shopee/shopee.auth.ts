import crypto from 'crypto';
import axios from 'axios';
import { prisma } from '../../database/client';
import { encrypt } from '../../utils/crypto';
import { createShopeeSign } from './shopee.client';

const PARTNER_ID = process.env.SHOPEE_PARTNER_ID!;
const REDIRECT_URI = `${process.env.API_BASE_URL}/api/shops/shopee/callback`;

export const shopeeAuth = {
  async generateAuthUrl(userId: string): Promise<{ url: string; state: string }> {
    const state = crypto.randomBytes(16).toString('hex');
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/shop/auth_partner';
    const sign = createShopeeSign(path, timestamp);

    await prisma.oAuthState.create({
      data: {
        state,
        userId,
        platform: 'SHOPEE',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const url = `https://partner.shopeemobile.com${path}?partner_id=${PARTNER_ID}&timestamp=${timestamp}&sign=${sign}&redirect=${encodeURIComponent(REDIRECT_URI)}&state=${state}`;
    return { url, state };
  },

  async exchangeCode(
    code: string,
    shopId: string,
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/auth/token/get';
    const sign = createShopeeSign(path, timestamp);

    const res = await axios.post(
      `https://partner.shopeemobile.com${path}`,
      { code, shop_id: Number(shopId), partner_id: Number(PARTNER_ID) },
      { params: { partner_id: Number(PARTNER_ID), timestamp, sign } },
    );

    return {
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token,
      expiresAt: new Date(Date.now() + res.data.expire_in * 1000),
    };
  },

  async refreshAccessToken(
    shop: import('@prisma/client').ShopConnection,
  ): Promise<{ accessToken: string; refreshToken: string; expiresAt: Date }> {
    const { decrypt } = await import('../../utils/crypto');
    const oldRefreshToken = decrypt(shop.refreshTokenEnc);

    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/auth/access_token/get';
    const sign = createShopeeSign(path, timestamp);

    const res = await axios.post(
      `https://partner.shopeemobile.com${path}`,
      {
        refresh_token: oldRefreshToken,
        shop_id: Number(shop.platformShopId),
        partner_id: Number(PARTNER_ID),
      },
      { params: { partner_id: Number(PARTNER_ID), timestamp, sign } },
    );

    return {
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token,
      expiresAt: new Date(Date.now() + res.data.expire_in * 1000),
    };
  },

  async getShopInfo(accessToken: string, shopId: string): Promise<{ shopName: string; region: string }> {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/shop/get_shop_info';
    const sign = createShopeeSign(path, timestamp, accessToken, shopId);

    const res = await axios.get(`https://partner.shopeemobile.com${path}`, {
      params: {
        partner_id: Number(PARTNER_ID),
        timestamp,
        access_token: accessToken,
        shop_id: Number(shopId),
        sign,
      },
    });

    return {
      shopName: res.data.response?.shop_name ?? `Shop ${shopId}`,
      region: res.data.response?.region ?? 'ID',
    };
  },

  async handleCallback(
    userId: string,
    code: string,
    shopId: string,
    state: string,
  ): Promise<import('@prisma/client').ShopConnection> {
    const oauthState = await prisma.oAuthState.findUnique({ where: { state } });
    if (!oauthState || oauthState.userId !== userId || oauthState.expiresAt < new Date() || oauthState.usedAt) {
      throw new Error('INVALID_STATE');
    }

    await prisma.oAuthState.update({ where: { id: oauthState.id }, data: { usedAt: new Date() } });

    const { accessToken, refreshToken, expiresAt } = await shopeeAuth.exchangeCode(code, shopId);
    const shopInfo = await shopeeAuth.getShopInfo(accessToken, shopId);

    const shop = await prisma.shopConnection.upsert({
      where: {
        userId_platform_platformShopId: { userId, platform: 'SHOPEE', platformShopId: shopId },
      },
      create: {
        userId,
        platform: 'SHOPEE',
        platformShopId: shopId,
        shopName: shopInfo.shopName,
        region: shopInfo.region,
        status: 'ACTIVE',
        accessTokenEnc: encrypt(accessToken),
        refreshTokenEnc: encrypt(refreshToken),
        tokenExpiresAt: expiresAt,
      },
      update: {
        shopName: shopInfo.shopName,
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
