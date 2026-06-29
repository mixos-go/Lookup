import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StockIndicator } from '@/components/atoms/StockIndicator';
import { Colors } from '@/constants/colors';

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
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.row}>
      <Text style={styles.name} numberOfLines={1}>{name}</Text>
      <StockIndicator stock={stock} />
      <Text style={styles.price}>{formatPrice(price, currency)}</Text>
      <Feather name="edit-2" size={14} color={Colors.placeholder} />
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
    borderBottomColor: Colors.border,
    gap: 10,
  },
  name: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  price: { fontSize: 13, color: Colors.textSecondary },
});
