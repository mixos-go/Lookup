import type { Platform } from '@/types';

export function getPlatformLabel(platform: Platform): string {
  return platform === 'SHOPEE' ? 'Shopee' : 'TikTok Shop';
}

export function getPlatformColor(platform: Platform): string {
  return platform === 'SHOPEE' ? '#EE4D2D' : '#FE2C55';
}

export function getPlatformBg(platform: Platform): string {
  return platform === 'SHOPEE' ? '#FFF0EE' : '#FFF0F3';
}

export function isShopee(platform: Platform): boolean {
  return platform === 'SHOPEE';
}

export function isTikTok(platform: Platform): boolean {
  return platform === 'TIKTOK';
}
