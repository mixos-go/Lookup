// src/components/atoms/Badge.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'shopee' | 'tiktok';

const BG: Record<BadgeVariant, string> = {
  success: Colors.successLight,
  warning: Colors.warningLight,
  danger: Colors.dangerLight,
  info: Colors.infoLight,
  neutral: Colors.cardBg,
  shopee: Colors.shopeeLight,
  tiktok: Colors.tiktokLight,
};
const TEXT: Record<BadgeVariant, string> = {
  success: Colors.success,
  warning: Colors.warning,
  danger: Colors.danger,
  info: Colors.info,
  neutral: Colors.textSecondary,
  shopee: Colors.shopee,
  tiktok: Colors.tiktok,
};

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
}

export function Badge({ label, variant = 'neutral' }: BadgeProps) {
  return (
    <View style={[styles.container, { backgroundColor: BG[variant] }]}>
      <Text style={[styles.text, { color: TEXT[variant] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 20, borderRadius: 9999, paddingHorizontal: 8, justifyContent: 'center', alignItems: 'center' },
  text: { fontSize: 11, fontWeight: '600' },
});


// src/components/atoms/StockIndicator.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants';

export function StockIndicator({ stock }: { stock: number }) {
  const variant = stock === 0 ? 'danger' : stock <= 10 ? 'warning' : 'success';
  const label = stock === 0 ? 'Habis' : String(stock);
  const bg = { danger: Colors.dangerLight, warning: Colors.warningLight, success: Colors.successLight }[variant];
  const color = { danger: Colors.danger, warning: Colors.warning, success: Colors.success }[variant];

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


// src/components/atoms/PlatformTag.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants';
import type { Platform } from '@/types';

export function PlatformTag({ platform }: { platform: Platform }) {
  const isShopee = platform === 'SHOPEE';
  return (
    <View style={[styles.container, { backgroundColor: isShopee ? Colors.shopeeLight : Colors.tiktokLight }]}>
      <Text style={[styles.text, { color: isShopee ? Colors.shopee : Colors.tiktokPink }]}>
        {isShopee ? 'Shopee' : 'TikTok'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  text: { fontSize: 11, fontWeight: '700' },
});


// src/components/atoms/Skeleton.tsx
import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { Colors } from '@/constants';

interface SkeletonProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}

export function Skeleton({ width, height, borderRadius = 6, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: Colors.border, opacity }, style]}
    />
  );
}
