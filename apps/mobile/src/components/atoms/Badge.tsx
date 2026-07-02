import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'shopee' | 'tiktok';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  const { colors } = useTheme();

  const BG: Record<BadgeVariant, string> = {
    success: colors.successLight,
    warning: colors.warningLight,
    danger: colors.dangerLight,
    info: colors.infoLight,
    neutral: colors.inputBg,
    shopee: colors.shopeeLight,
    tiktok: colors.tiktokLight,
  };

  const TEXT_CLR: Record<BadgeVariant, string> = {
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    info: colors.info,
    neutral: colors.textSecondary,
    shopee: colors.shopee,
    tiktok: colors.tiktokPink,
  };

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
