// src/components/atoms/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'platform-shopee' | 'platform-tiktok';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const HEIGHT: Record<Size, number> = { sm: 32, md: 44, lg: 52 };
const FONT_SIZE: Record<Size, number> = { sm: 13, md: 15, lg: 17 };

export function Button({ label, onPress, variant = 'primary', size = 'md', loading, disabled, fullWidth }: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  // Semantic/platform colors (primary, danger, shopee, tiktok) are identical
  // in both themes — only `secondary`'s surface needs to track cardBg so it
  // doesn't render as a stray white box on a dark background.
  const BG: Record<Variant, string> = {
    primary: colors.primary,
    secondary: colors.cardBg,
    ghost: 'transparent',
    danger: colors.danger,
    'platform-shopee': colors.shopee,
    'platform-tiktok': colors.tiktok,
  };

  const TEXT_COLOR: Record<Variant, string> = {
    primary: colors.white,
    secondary: colors.primary,
    ghost: colors.primary,
    danger: colors.white,
    'platform-shopee': colors.white,
    'platform-tiktok': colors.white,
  };

  const BORDER: Record<Variant, string | undefined> = {
    primary: undefined,
    secondary: colors.primary,
    ghost: undefined,
    danger: undefined,
    'platform-shopee': undefined,
    'platform-tiktok': undefined,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        { height: HEIGHT[size], backgroundColor: BG[variant] },
        BORDER[variant] && { borderWidth: 1.5, borderColor: BORDER[variant] },
        fullWidth && { width: '100%' },
        isDisabled && { opacity: 0.5 },
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={TEXT_COLOR[variant]} />
      ) : (
        <Text style={[styles.label, { color: TEXT_COLOR[variant], fontSize: FONT_SIZE[size] }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontWeight: '600' },
});
