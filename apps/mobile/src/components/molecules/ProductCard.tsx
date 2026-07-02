// src/components/molecules/ProductCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { StockIndicator } from '@/components/atoms/StockIndicator';
import { PlatformTag } from '@/components/atoms/PlatformTag';
import { useTheme } from '@/hooks/useTheme';
import type { ProductSummary, Platform } from '@/types';

interface ProductCardProps {
  product: ProductSummary;
  platform: Platform;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

function formatPrice(min: number, max: number, currency: string): string {
  const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n);
  const prefix = currency === 'IDR' ? 'Rp' : currency;
  if (min === max) return `${prefix} ${fmt(min)}`;
  return `${prefix} ${fmt(min)} – ${fmt(max)}`;
}

export function ProductCard({ product, platform, isSelectMode, isSelected, onPress, onLongPress }: ProductCardProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        { backgroundColor: colors.cardBg, borderBottomColor: colors.border },
        isSelected && { backgroundColor: colors.primaryLight },
      ]}
    >
      {isSelected && <View style={[styles.selectedBorder, { backgroundColor: colors.primary }]} />}

      <Image
        source={{ uri: product.coverImage }}
        style={[styles.image, { backgroundColor: colors.border }]}
        contentFit="cover"
        transition={200}
      />

      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.heading }]} numberOfLines={2}>{product.name}</Text>
        <View style={styles.row}>
          <PlatformTag platform={platform} />
          <View style={{ width: 6 }} />
          <StockIndicator stock={product.totalStock} />
          {product.variantCount > 1 && (
            <Text style={[styles.variantCount, { color: colors.textSecondary }]}>{product.variantCount} varian</Text>
          )}
        </View>
        <Text style={[styles.price, { color: colors.textSecondary }]}>
          {formatPrice(product.priceRange.min, product.priceRange.max, product.priceRange.currency)}
        </Text>
      </View>

      <View style={styles.right}>
        {isSelectMode ? (
          <View style={[
            styles.checkbox,
            { borderColor: colors.border },
            isSelected && { backgroundColor: colors.primary, borderColor: colors.primary },
          ]}>
            {isSelected && <Feather name="check" size={14} color={colors.white} />}
          </View>
        ) : (
          <Feather name="chevron-right" size={18} color={colors.placeholder} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  selectedBorder: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 4,
  },
  image: {
    width: 60, height: 60,
    borderRadius: 8,
  },
  content: { flex: 1, marginHorizontal: 12, gap: 4 },
  name: { fontSize: 15, fontWeight: '600', lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  variantCount: { fontSize: 12 },
  price: { fontSize: 13 },
  right: { paddingLeft: 4 },
  checkbox: {
    width: 22, height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
