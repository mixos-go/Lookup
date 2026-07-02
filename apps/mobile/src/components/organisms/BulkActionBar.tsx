// src/components/organisms/BulkActionBar.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useBulkStore } from '@/stores/bulkStore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Deliberately not a FAB (or stack of FABs) — bulk actions live inline in
// this bar so they read as part of the navigation surface rather than
// floating disconnected buttons that can cover list content. See
// docs/UI_DESIGN.md "BulkActionBar".
export function BulkActionBar() {
  const { colors } = useTheme();
  const { selectedProducts, exitSelectMode } = useBulkStore();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const translateY = useRef(new Animated.Value(100)).current;
  const count = selectedProducts.length;

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: count > 0 ? 0 : 100,
      useNativeDriver: true,
      tension: 60,
      friction: 10,
    }).start();
  }, [count]);

  if (count === 0) return null;

  return (
    <Animated.View style={[
      styles.container,
      { bottom: insets.bottom + 72, transform: [{ translateY }], backgroundColor: colors.cardBg },
    ]}>
      <Text style={[styles.count, { color: colors.heading }]}>{count} dipilih</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('BulkStockUpdate')}>
          <Feather name="layers" size={16} color={colors.primary} />
          <Text style={[styles.actionLabel, { color: colors.primary }]}>Stok</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('BulkPriceUpdate')}>
          <Feather name="tag" size={16} color={colors.primary} />
          <Text style={[styles.actionLabel, { color: colors.primary }]}>Harga</Text>
        </TouchableOpacity>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <TouchableOpacity style={styles.actionBtn} onPress={exitSelectMode}>
          <Feather name="x" size={16} color={colors.textSecondary} />
          <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Batal</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16, right: 16,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  count: { fontSize: 15, fontWeight: '700' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6 },
  actionLabel: { fontSize: 14, fontWeight: '600' },
  divider: { width: 1, height: 20 },
});
