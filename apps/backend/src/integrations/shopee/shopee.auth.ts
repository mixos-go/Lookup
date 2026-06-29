import crypto from 'crypto';
import axios from 'axios';
import { prisma } from '../../database/client';
import { encrypt } from '../../utils/crypto';
import { createShopeeSign } from './shopee.client';

const PARTNER_ID = process.env.SHOPEE_PARTNER_ID!;
const REDIRECT_URI = `${process.env.API_BASE_URL}/api/shops/shopee/callback`;

export const shopeeAuth = {
  async generateAuthUrl(userId: string) {
    const state = crypto.randomBytes(16).toString('hex');
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/shop/auth_partner';
    const sign = createShopeeSign(path, timestamp);

    await prisma.oAuthState.create({
      data: { state, userId, platform: 'SHOPEE', expiresAt: new Date(Date.now() + 10 * 60 * 1000) },
    });

    const url = `https://partner.shopeemobile.com${path}?partner_id=${PARTNER_ID}&timestamp=${timestamp}&sign=${sign}&redirect=${encodeURIComponent(REDIRECT_URI)}&state=${state}`;
    return { url, state };
  },

  async exchangeCode(code: string, shopId: string) {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = '/api/v2/auth/token/get';
    const sign = createShopeeSign(path, timestamp);

    const res = await axios.post(`https://partner.shopeemobile.com${path}`, {
      code, shop_id: Number(shopId), partner_id: Number(PARTNER_ID),
    }, { params: { partner_id: Number(PARTNER_ID), timestamp, sign } });

    return {
      accessToken: res.data.access_token,
      refreshToken: res.data.refresh_token,
      expiresAt: new Date(Date.now() + res.data.expire_in * 1000),
    };
  },
};
