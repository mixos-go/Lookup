// src/components/atoms/Button.tsx
import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { Colors } from '@/constants';

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

const BG: Record<Variant, string> = {
  primary: Colors.primary,
  secondary: Colors.white,
  ghost: 'transparent',
  danger: Colors.danger,
  'platform-shopee': Colors.shopee,
  'platform-tiktok': Colors.tiktok,
};

const TEXT_COLOR: Record<Variant, string> = {
  primary: Colors.white,
  secondary: Colors.primary,
  ghost: Colors.primary,
  danger: Colors.white,
  'platform-shopee': Colors.white,
  'platform-tiktok': Colors.white,
};

const BORDER: Record<Variant, string | undefined> = {
  primary: undefined,
  secondary: Colors.primary,
  ghost: undefined,
  danger: undefined,
  'platform-shopee': undefined,
  'platform-tiktok': undefined,
};

export function Button({ label, onPress, variant = 'primary', size = 'md', loading, disabled, fullWidth }: ButtonProps) {
  const isDisabled = disabled || loading;

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
