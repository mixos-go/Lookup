import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

export function StockIndicator({ stock }: { stock: number }) {
  const { colors } = useTheme();
  const isOut = stock === 0;
  const isLow = stock > 0 && stock <= 10;
  const bg = isOut ? colors.dangerLight : isLow ? colors.warningLight : colors.successLight;
  const color = isOut ? colors.danger : isLow ? colors.warning : colors.success;
  const label = isOut ? 'Habis' : String(stock);

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  text: { fontSize: 12, fontWeight: '600' },
});
