import axios, { type AxiosInstance } from 'axios';
import crypto from 'crypto';
import { decrypt } from '../../utils/crypto';
import type { ShopConnection } from '@prisma/client';

const BASE_URL = 'https://partner.shopeemobile.com';
const PARTNER_ID = process.env.SHOPEE_PARTNER_ID!;
const PARTNER_KEY = process.env.SHOPEE_PARTNER_KEY!;

export function createShopeeSign(path: string, timestamp: number, accessToken = '', shopId = ''): string {
  const base = `${PARTNER_ID}${path}${timestamp}${accessToken}${shopId}`;
  return crypto.createHmac('sha256', PARTNER_KEY).update(base).digest('hex');
}

export function createShopeeClient(shop: ShopConnection): AxiosInstance {
  const accessToken = decrypt(shop.accessTokenEnc);
  const shopId = shop.platformShopId;

  const client = axios.create({ baseURL: BASE_URL });

  client.interceptors.request.use((config) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const path = config.url ?? '';
    const sign = createShopeeSign(path, timestamp, accessToken, shopId);

    config.params = {
      ...config.params,
      partner_id: Number(PARTNER_ID),
      timestamp,
      access_token: accessToken,
      shop_id: Number(shopId),
      sign,
    };
    return config;
  });

  return client;
}
