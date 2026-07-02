// src/utils/secureStorage.ts — Cross-platform key/value storage.
// expo-secure-store hanya berjalan di native (iOS/Android). Di web, ia akan
// throw error karena tidak ada implementasi Keychain/Keystore. Wrapper ini
// otomatis fallback ke localStorage saat berjalan di web.
//
// Catatan keamanan: localStorage TIDAK seaman SecureStore (tidak dienkripsi
// di OS level). Untuk kebutuhan production web yang menyimpan refresh token,
// pertimbangkan httpOnly cookie dari backend sebagai alternatif jangka panjang.

import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

const isWeb = Platform.OS === 'web';

export async function getItemAsync(key: string): Promise<string | null> {
  if (isWeb) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return SecureStore.getItemAsync(key);
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  if (isWeb) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // ignore (e.g. private browsing quota errors)
    }
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

export async function deleteItemAsync(key: string): Promise<void> {
  if (isWeb) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}
