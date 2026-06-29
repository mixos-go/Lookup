// src/components/molecules/ProductCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { StockIndicator } from '@/components/atoms/StockIndicator';
import { PlatformTag } from '@/components/atoms/PlatformTag';
import { Colors } from '@/constants';
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
  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
      style={[styles.container, isSelected && styles.selectedContainer]}
    >
      {isSelected && <View style={styles.selectedBorder} />}

      <Image
        source={{ uri: product.coverImage }}
        style={styles.image}
        contentFit="cover"
        transition={200}
      />

      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <View style={styles.row}>
          <PlatformTag platform={platform} />
          <View style={{ width: 6 }} />
          <StockIndicator stock={product.totalStock} />
          {product.variantCount > 1 && (
            <Text style={styles.variantCount}>{product.variantCount} varian</Text>
          )}
        </View>
        <Text style={styles.price}>
          {formatPrice(product.priceRange.min, product.priceRange.max, product.priceRange.currency)}
        </Text>
      </View>

      <View style={styles.right}>
        {isSelectMode ? (
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && <Feather name="check" size={14} color={Colors.white} />}
          </View>
        ) : (
          <Feather name="chevron-right" size={18} color={Colors.placeholder} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  selectedContainer: { backgroundColor: Colors.primaryLight },
  selectedBorder: {
    position: 'absolute',
    left: 0, top: 0, bottom: 0,
    width: 4,
    backgroundColor: Colors.primary,
  },
  image: {
    width: 60, height: 60,
    borderRadius: 8,
    backgroundColor: Colors.border,
  },
  content: { flex: 1, marginHorizontal: 12, gap: 4 },
  name: { fontSize: 15, fontWeight: '600', color: Colors.heading, lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  variantCount: { fontSize: 12, color: Colors.textSecondary },
  price: { fontSize: 13, color: Colors.textSecondary },
  right: { paddingLeft: 4 },
  checkbox: {
    width: 22, height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
});
