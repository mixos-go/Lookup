import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

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
  const { colors } = useTheme();
  const discount =
    originalPrice > 0 && salePrice < originalPrice
      ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
      : null;

  const hasWarning = salePrice > 0 && originalPrice > 0 && salePrice > originalPrice;

  return (
    <View style={styles.wrapper}>
      <View style={styles.field}>
        <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Harga Coret</Text>
        <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <Text style={[styles.prefix, { color: colors.textSecondary }]}>Rp</Text>
          <TextInput
            style={[styles.input, { color: colors.heading }]}
            value={originalPrice > 0 ? formatRp(originalPrice) : ''}
            onChangeText={(t) => onChangeOriginal(parseRp(t))}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.placeholder}
          />
        </View>
      </View>

      <View style={styles.field}>
        <View style={styles.saleLabelRow}>
          <Text style={[styles.fieldLabel, { color: colors.textPrimary }]}>Harga Jual</Text>
          {discount !== null && (
            <View style={[styles.discountBadge, { backgroundColor: colors.successLight }]}>
              <Text style={[styles.discountText, { color: colors.success }]}>Diskon {discount}%</Text>
            </View>
          )}
        </View>
        <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <Text style={[styles.prefix, { color: colors.textSecondary }]}>Rp</Text>
          <TextInput
            style={[styles.input, { color: colors.heading }]}
            value={salePrice > 0 ? formatRp(salePrice) : ''}
            onChangeText={(t) => onChangeSale(parseRp(t))}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={colors.placeholder}
          />
        </View>
      </View>

      {hasWarning && (
        <Text style={[styles.warning, { color: colors.danger }]}>Harga jual tidak boleh lebih dari harga coret.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8 },
  field: { gap: 4 },
  saleLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fieldLabel: { fontSize: 13, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
  },
  prefix: { fontSize: 14, marginRight: 6 },
  input: { flex: 1, fontSize: 15 },
  discountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  discountText: { fontSize: 11, fontWeight: '700' },
  warning: { fontSize: 12 },
});
