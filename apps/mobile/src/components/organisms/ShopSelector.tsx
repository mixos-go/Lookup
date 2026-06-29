// src/components/organisms/ShopSelector.tsx
import React from 'react';
import { ScrollView, TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants';
import { useShopStore } from '@/stores/shopStore';
import type { Shop } from '@/types';

function ShopChip({ shop, isActive, onPress }: { shop: Shop; isActive: boolean; onPress: () => void }) {
  const isShopee = shop.platform === 'SHOPEE';
  const platformColor = isShopee ? Colors.shopee : Colors.tiktokPink;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.chip, isActive && styles.chipActive]}
    >
      <View style={[styles.dot, { backgroundColor: isActive ? Colors.white : platformColor }]} />
      <Text
        style={[styles.chipLabel, isActive && styles.chipLabelActive]}
        numberOfLines={1}
      >
        {shop.shopName}
      </Text>
    </TouchableOpacity>
  );
}

export function ShopSelector() {
  const { shops, activeShopId, setActiveShop } = useShopStore();

  if (shops.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {shops.map((shop) => (
        <ShopChip
          key={shop.id}
          shop={shop}
          isActive={shop.id === activeShopId}
          onPress={() => setActiveShop(shop.id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9999,
    backgroundColor: Colors.cardBg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dot: { width: 8, height: 8, borderRadius: 4 },
  chipLabel: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, maxWidth: 120 },
  chipLabelActive: { color: Colors.white },
});
