import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Colors } from '@/constants/colors';

type AvatarSize = 'sm' | 'md' | 'lg';

const SIZE: Record<AvatarSize, number> = { sm: 32, md: 40, lg: 56 };

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize;
}

export function Avatar({ uri, name = '', size = 'md' }: AvatarProps) {
  const diameter = SIZE[size];
  const initials = name.trim().slice(0, 2).toUpperCase() || '?';
  const fontSize = diameter * 0.35;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: diameter, height: diameter, borderRadius: diameter / 2 }]}
        contentFit="cover"
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: diameter, height: diameter, borderRadius: diameter / 2 }]}>
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: Colors.border },
  fallback: { backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center' },
  initials: { color: Colors.white, fontWeight: '700' },
});
