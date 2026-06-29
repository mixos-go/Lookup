import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VariantRow } from '@/components/molecules/VariantRow';
import { Colors } from '@/constants';

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
  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Varian ({variants.length})</Text>
        <Text style={styles.totalStock}>Total Stok: {totalStock}</Text>
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
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: 14, fontWeight: '700', color: Colors.heading },
  totalStock: { fontSize: 13, color: Colors.textSecondary },
});
