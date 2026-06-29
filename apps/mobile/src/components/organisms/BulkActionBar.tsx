// src/components/organisms/BulkActionBar.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants';
import { useBulkStore } from '@/stores/bulkStore';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function BulkActionBar() {
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
    <Animated.View style={[styles.container, { bottom: insets.bottom + 72, transform: [{ translateY }] }]}>
      <Text style={styles.count}>{count} dipilih</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('BulkStockUpdate')}>
          <Feather name="layers" size={16} color={Colors.primary} />
          <Text style={styles.actionLabel}>Stok</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('BulkPriceUpdate')}>
          <Feather name="tag" size={16} color={Colors.primary} />
          <Text style={styles.actionLabel}>Harga</Text>
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity style={styles.actionBtn} onPress={exitSelectMode}>
          <Feather name="x" size={16} color={Colors.textSecondary} />
          <Text style={[styles.actionLabel, { color: Colors.textSecondary }]}>Batal</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16, right: 16,
    backgroundColor: Colors.white,
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
  count: { fontSize: 15, fontWeight: '700', color: Colors.heading },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 6 },
  actionLabel: { fontSize: 14, fontWeight: '600', color: Colors.primary },
  divider: { width: 1, height: 20, backgroundColor: Colors.border },
});
