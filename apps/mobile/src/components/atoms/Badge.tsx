import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'shopee' | 'tiktok';

const BG: Record<BadgeVariant, string> = {
  success: Colors.successLight,
  warning: Colors.warningLight,
  danger: Colors.dangerLight,
  info: Colors.infoLight,
  neutral: Colors.inputBg,
  shopee: Colors.shopeeLight,
  tiktok: Colors.tiktokLight,
};

const TEXT_CLR: Record<BadgeVariant, string> = {
  success: Colors.success,
  warning: Colors.warning,
  danger: Colors.danger,
  info: Colors.info,
  neutral: Colors.textSecondary,
  shopee: Colors.shopee,
  tiktok: Colors.tiktokPink,
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  return (
    <View style={[styles.container, { backgroundColor: BG[variant] }]}>
      <Text style={[styles.text, { color: TEXT_CLR[variant] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 20,
    borderRadius: 9999,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { fontSize: 11, fontWeight: '600' },
});
