import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StockIndicator } from '@/components/atoms/StockIndicator';
import { useTheme } from '@/hooks/useTheme';

interface VariantRowProps {
  name: string;
  stock: number;
  price: number;
  currency?: string;
  onPress?: () => void;
}

function formatPrice(price: number, currency = 'IDR'): string {
  const prefix = currency === 'IDR' ? 'Rp' : currency;
  return `${prefix} ${new Intl.NumberFormat('id-ID').format(price)}`;
}

export function VariantRow({ name, stock, price, currency, onPress }: VariantRowProps) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={[styles.row, { borderBottomColor: colors.border }]}>
      <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={1}>{name}</Text>
      <StockIndicator stock={stock} />
      <Text style={[styles.price, { color: colors.textSecondary }]}>{formatPrice(price, currency)}</Text>
      <Feather name="edit-2" size={14} color={colors.placeholder} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  name: { flex: 1, fontSize: 14 },
  price: { fontSize: 13 },
});
