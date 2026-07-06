// tiktok.sdk-client.ts — factory for the OFFICIAL TikTok Shop Node.js SDK client
//
// Replaces the previous custom axios + manual HMAC signing implementation.
// The SDK (vendored under ./sdk) auto-injects app_key, timestamp and sign
// on every request via its internal interceptor.

import { TikTokShopNodeApiClient, ClientConfiguration } from './sdk';
import { decrypt } from '../../utils/crypto';
import type { ShopConnection } from '@prisma/client';

const APP_KEY = process.env.TIKTOK_APP_KEY!;
const APP_SECRET = process.env.TIKTOK_APP_SECRET!;

ClientConfiguration.globalConfig.app_key = APP_KEY;
ClientConfiguration.globalConfig.app_secret = APP_SECRET;

export function createTikTokSdkClient(): TikTokShopNodeApiClient {
  return new TikTokShopNodeApiClient({ config: {} as ClientConfiguration });
}

export function getShopCredentials(shop: ShopConnection): {
  accessToken: string;
  shopCipher: string;
} {
  const accessToken = decrypt(shop.accessTokenEnc);
  if (!shop.shopCipherEnc) {
    throw new Error(`TIKTOK_MISSING_CIPHER: Shop ${shop.id} has no shop_cipher. Re-connect the shop.`);
  }
  const shopCipher = decrypt(shop.shopCipherEnc);
  return { accessToken, shopCipher };
}

export const CONTENT_TYPE_JSON = 'application/json';
