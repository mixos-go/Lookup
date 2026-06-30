// tiktok.client.ts — TikTok Shop API v202309 client with proper signature
//
// TikTok requires EVERY request to include in query params:
//   app_key, shop_cipher, timestamp, sign (HMAC-SHA256)
// Plus header: x-tts-access-token
//
// Reference: https://partner.tiktokshop.com/docv2/page/integrate-node-js-sdk
// Signature: HMAC-SHA256(app_secret, path + sorted_params_str + body_str)

import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import crypto from 'crypto';
import { decrypt } from '../../utils/crypto';
import type { ShopConnection } from '@prisma/client';

const BASE_URL = 'https://open-api.tiktokglobalshop.com';
const APP_KEY = process.env.TIKTOK_APP_KEY!;
const APP_SECRET = process.env.TIKTOK_APP_SECRET!;

/**
 * Generate TikTok Shop API signature.
 * Algorithm: HMAC-SHA256(app_secret, path + sorted_query_params + body)
 * Exclude 'sign' and 'access_token' from params before signing.
 */
export function generateTikTokSign(
  path: string,
  params: Record<string, string>,
  body: string = '',
): string {
  // Sort params alphabetically by key, exclude 'sign' and 'access_token'
  const sortedKeys = Object.keys(params)
    .filter((k) => k !== 'sign' && k !== 'access_token')
    .sort();

  const paramStr = sortedKeys.map((k) => `${k}${params[k]}`).join('');
  const baseString = `${path}${paramStr}${body}`;

  return crypto
    .createHmac('sha256', APP_SECRET)
    .update(baseString)
    .digest('hex');
}

/**
 * Create an Axios client pre-configured for TikTok Shop API v202309.
 * Automatically injects: x-tts-access-token header, app_key, shop_cipher,
 * timestamp, and sign for every request.
 */
export function createTikTokClient(shop: ShopConnection): AxiosInstance {
  const accessToken = decrypt(shop.accessTokenEnc);
  // shop_cipher is stored encrypted; decrypt it
  // If null (legacy record before cipher was stored), throw an error
  if (!shop.shopCipherEnc) {
    throw new Error(`TIKTOK_MISSING_CIPHER: Shop ${shop.id} has no shop_cipher. Re-connect the shop.`);
  }
  const shopCipher = decrypt(shop.shopCipherEnc);

  const client = axios.create({
    baseURL: BASE_URL,
    headers: {
      'x-tts-access-token': accessToken,
      'Content-Type': 'application/json',
    },
  });

  // Interceptor: inject required query params + signature on every request
  client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const path = config.url ?? '';

    // Collect all existing query params + required TikTok params
    const existingParams: Record<string, string> = {};
    if (config.params) {
      for (const [k, v] of Object.entries(config.params)) {
        if (v !== undefined && v !== null) {
          existingParams[k] = String(v);
        }
      }
    }

    const queryParams: Record<string, string> = {
      ...existingParams,
      app_key: APP_KEY,
      shop_cipher: shopCipher,
      timestamp,
    };

    // Get body as string for signing
    let bodyStr = '';
    if (config.data) {
      bodyStr = typeof config.data === 'string' ? config.data : JSON.stringify(config.data);
    }

    // Generate signature
    const sign = generateTikTokSign(path, queryParams, bodyStr);

    config.params = { ...queryParams, sign };
    return config;
  });

  return client;
}
