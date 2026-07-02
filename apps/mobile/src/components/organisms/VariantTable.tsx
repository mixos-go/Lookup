import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VariantRow } from '@/components/molecules/VariantRow';
import { useTheme } from '@/hooks/useTheme';

export interface VariantItem {
  variantId: string;
  variantName: string;
  stock: number;
  price: number;
  originalPrice?: number;
  currency?: string;
  sku?: string;
  attributes?: Record<string, string>;
}

interface VariantTableProps {
  variants: VariantItem[];
  currency?: string;
  onVariantPress?: (variant: VariantItem) => void;
}

export function VariantTable({ variants, currency, onVariantPress }: VariantTableProps) {
  const { colors } = useTheme();
  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.heading }]}>Varian ({variants.length})</Text>
        <Text style={[styles.totalStock, { color: colors.textSecondary }]}>Total Stok: {totalStock}</Text>
      </View>

      {variants.map((v) => (
        <VariantRow
          key={v.variantId}
          name={v.variantName}
          stock={v.stock}
          price={v.price}
          currency={currency ?? v.currency}
          onPress={onVariantPress ? () => onVariantPress(v) : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 14, fontWeight: '700' },
  totalStock: { fontSize: 13 },
});
