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

// Helper to check if we're in a browser environment with localStorage
function hasLocalStorage(): boolean {
  if (!isWeb) return false;
  try {
    return typeof window !== 'undefined' && !!window.localStorage;
  } catch {
    return false;
  }
}

export async function getItemAsync(key: string): Promise<string | null> {
  if (isWeb) {
    if (!hasLocalStorage()) return null;
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
    if (!hasLocalStorage()) return;
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
    if (!hasLocalStorage()) return;
    try {
      window.localStorage.removeItem(key);
    } catch {
      // ignore
    }
    return;
  }
  await SecureStore.deleteItemAsync(key);
}

// Additional helper to clear all storage (useful for logout)
export async function clearAllStorage(): Promise<void> {
  if (isWeb) {
    if (!hasLocalStorage()) return;
    try {
      window.localStorage.clear();
    } catch {
      // ignore
    }
    return;
  }
  // For native, we can't clear all SecureStore items, so we rely on individual deletion
  // This is a placeholder for future implementation if needed
}
