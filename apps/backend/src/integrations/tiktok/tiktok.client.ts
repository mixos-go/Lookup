import axios, { type AxiosInstance } from 'axios';
import { decrypt } from '../../utils/crypto';
import type { ShopConnection } from '@prisma/client';

const BASE_URL = 'https://open-api.tiktokglobalshop.com';

export function createTikTokClient(shop: ShopConnection): AxiosInstance {
  const accessToken = decrypt(shop.accessTokenEnc);
  const shopId = shop.platformShopId;

  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      'x-tts-access-token': accessToken,
      'x-tts-shop-id': shopId,
      'Content-Type': 'application/json',
    },
  });

  return client;
}
