// src/components/atoms/PlatformIcon.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import type { Platform } from '@/types';

interface PlatformIconProps {
  platform: Platform;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const SIZES = {
  sm: 16,
  md: 20,
  lg: 24,
};

// Shopee Logo SVG (simplified version of the official logo)
function ShopeeIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Shopee logo - orange gradient background */}
      <Rect width="24" height="24" rx="4" fill={color} />
      {/* White "S" shape */}
      <Path
        d="M15.5 8.5C15.5 9.3 15.1 10 14.4 10.4C13.7 10.8 13.2 11 12.8 11C12.4 11 12.1 10.8 11.9 10.5C11.7 10.2 11.6 9.8 11.6 9.3C11.6 8.8 11.8 8.4 12.1 8.1C12.4 7.8 12.8 7.6 13.3 7.6C13.8 7.6 14.2 7.8 14.5 8.1C14.8 8.4 15 8.8 15 9.3C15 9.8 14.9 10.2 14.7 10.5C14.5 10.8 14.2 11 13.8 11"
        fill="white"
      />
      <Path
        d="M12.1 13.5C12.1 14.3 11.7 15 11 15.4C10.3 15.8 9.8 16 9.4 16C9 16 8.7 15.8 8.5 15.5C8.3 15.2 8.2 14.8 8.2 14.3C8.2 13.8 8.4 13.4 8.7 13.1C9 12.8 9.4 12.6 9.9 12.6C10.4 12.6 10.8 12.8 11.1 13.1C11.4 13.4 11.6 13.8 11.6 14.3C11.6 14.8 11.4 15.2 11.1 15.5C10.8 15.8 10.4 16 10 16"
        fill="white"
      />
    </Svg>
  );
}

// TikTok Logo SVG (simplified version of the official logo)
function TikTokIcon({ size, color }: { size: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* TikTok logo - musical note shape */}
      <Path
        d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8z"
        fill={color}
      />
      <Path
        d="M8 12c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4z"
        fill="white"
      />
      <Path
        d="M12 8v8M16 12H8"
        stroke="white"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function PlatformIcon({ platform, size = 'md', color }: PlatformIconProps) {
  const iconSize = SIZES[size];
  
  // Use platform-specific colors if color not provided
  const iconColor = color || (platform === 'SHOPEE' ? '#EE4D2D' : '#FE2C55');

  return (
    <View style={styles.container}>
      {platform === 'SHOPEE' ? (
        <ShopeeIcon size={iconSize} color={iconColor} />
      ) : (
        <TikTokIcon size={iconSize} color={iconColor} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
