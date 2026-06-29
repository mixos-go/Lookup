import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

function formatRp(value: number): string {
  return new Intl.NumberFormat('id-ID').format(value);
}

function parseRp(text: string): number {
  const cleaned = text.replace(/\D/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
}

interface PriceInputProps {
  salePrice: number;
  originalPrice: number;
  onChangeSale: (v: number) => void;
  onChangeOriginal: (v: number) => void;
}

export function PriceInput({ salePrice, originalPrice, onChangeSale, onChangeOriginal }: PriceInputProps) {
  const discount =
    originalPrice > 0 && salePrice < originalPrice
      ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
      : null;

  const hasWarning = salePrice > 0 && originalPrice > 0 && salePrice > originalPrice;

  return (
    <View style={styles.wrapper}>
      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Harga Coret</Text>
        <View style={styles.inputRow}>
          <Text style={styles.prefix}>Rp</Text>
          <TextInput
            style={styles.input}
            value={originalPrice > 0 ? formatRp(originalPrice) : ''}
            onChangeText={(t) => onChangeOriginal(parseRp(t))}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={Colors.placeholder}
          />
        </View>
      </View>

      <View style={styles.field}>
        <View style={styles.saleLabelRow}>
          <Text style={styles.fieldLabel}>Harga Jual</Text>
          {discount !== null && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>Diskon {discount}%</Text>
            </View>
          )}
        </View>
        <View style={styles.inputRow}>
          <Text style={styles.prefix}>Rp</Text>
          <TextInput
            style={styles.input}
            value={salePrice > 0 ? formatRp(salePrice) : ''}
            onChangeText={(t) => onChangeSale(parseRp(t))}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={Colors.placeholder}
          />
        </View>
      </View>

      {hasWarning && (
        <Text style={styles.warning}>Harga jual tidak boleh lebih dari harga coret.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  field: { gap: 4 },
  saleLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    backgroundColor: Colors.background,
  },
  prefix: { fontSize: 14, color: Colors.textSecondary, marginRight: 6 },
  input: { flex: 1, fontSize: 15, color: Colors.heading },
  discountBadge: {
    backgroundColor: Colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  discountText: { fontSize: 11, fontWeight: '700', color: Colors.success },
  warning: { fontSize: 12, color: Colors.danger },
});
