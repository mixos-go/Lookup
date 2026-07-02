// src/components/atoms/PlatformTag.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { PlatformIcon } from './PlatformIcon';
import type { Platform } from '@/types';

export function PlatformTag({ platform }: { platform: Platform }) {
  const { colors } = useTheme();
  const isShopee = platform === 'SHOPEE';
  
  return (
    <View style={[styles.container, { backgroundColor: isShopee ? colors.shopeeLight : colors.tiktokLight }]}>
      <PlatformIcon platform={platform} size="sm" />
      <Text style={[styles.text, { color: isShopee ? colors.shopee : colors.tiktokPink }]}>
        {isShopee ? 'Shopee' : 'TikTok'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  text: { 
    fontSize: 11, 
    fontWeight: '700' 
  },
});
