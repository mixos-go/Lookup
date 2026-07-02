// src/components/molecules/ShopTag.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';
import { PlatformIcon } from '@/components/atoms/PlatformIcon';
import type { Shop } from '@/types';

export function ShopTag({ shop }: { shop: Shop }) {
  const isShopee = shop.platform === 'SHOPEE';
  const color = isShopee ? Colors.shopee : Colors.tiktokPink;
  const bg = isShopee ? Colors.shopeeLight : Colors.tiktokLight;
  const truncated = shop.shopName.length > 14 ? `${shop.shopName.slice(0, 14)}	` : shop.shopName;

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <PlatformIcon platform={shop.platform} size="sm" color={color} />
      <Text style={[styles.label, { color }]}>{truncated}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  label: { fontSize: 11, fontWeight: '600' },
});
