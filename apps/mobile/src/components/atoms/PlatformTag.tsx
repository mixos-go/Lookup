import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import type { Platform } from '@/types';

export function PlatformTag({ platform }: { platform: Platform }) {
  const isShopee = platform === 'SHOPEE';
  return (
    <View style={[styles.container, { backgroundColor: isShopee ? Colors.shopeeLight : Colors.tiktokLight }]}>
      <Text style={[styles.text, { color: isShopee ? Colors.shopee : Colors.tiktokPink }]}>
        {isShopee ? 'Shopee' : 'TikTok'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  text: { fontSize: 11, fontWeight: '700' },
});
