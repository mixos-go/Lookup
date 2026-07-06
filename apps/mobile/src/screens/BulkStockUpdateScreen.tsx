// src/screens/BulkStockUpdateScreen.tsx — Redesigned bulk stock update
import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { EmptyState } from '@/components/molecules/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { useBulkStore } from '@/stores/bulkStore';
import { useShopStore } from '@/stores/shopStore';
import { bulkApi } from '@/api/index';
import type { RootStackParamList, BulkStockItem } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function BulkStockUpdateScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { selectedProducts, clearSelection, setActiveJobId } = useBulkStore();
  const { activeShopId } = useShopStore();
  const [stockMap, setStockMap] = useState<Record<string, number>>({});

  const items: BulkStockItem[] = selectedProducts.flatMap((product) => [{
    productId: product.platformProductId,
    variantId: product.platformProductId,
    stock: stockMap[product.platformProductId] ?? product.totalStock,
    productName: product.name,
    variantName: 'Default',
  }]);

  const createJobMutation = useMutation({
    mutationFn: () => bulkApi.createStockJob(activeShopId!, items),
    onSuccess: (data) => {
      setActiveJobId(data.jobId);
      clearSelection();
      navigation.replace('BulkProgress', { jobId: data.jobId, type: 'STOCK' });
    },
    onError: () => Alert.alert('Gagal', 'Gagal membuat job update stok.'),
  });

  if (selectedProducts.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="layers"
          title="Tidak Ada Produk Dipilih"
          subtitle="Kembali ke daftar produk dan pilih produk yang ingin diupdate."
          actionLabel="Kembali"
          onAction={() => navigation.goBack()}
        />
      </SafeAreaView>
    );
  }

  const totalChanged = selectedProducts.filter(
    (p) => stockMap[p.platformProductId] !== undefined && stockMap[p.platformProductId] !== p.totalStock,
  ).length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>

      {/* Header summary */}
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
        <View style={[styles.headerIcon, { backgroundColor: `${colors.info}18` }]}>
          <Feather name="layers" size={22} color={colors.info} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.heading }]}>Update Stok Massal</Text>
          <Text style={[styles.headerSub, { color: colors.textSecondary }]}>
            {selectedProducts.length} produk dipilih{totalChanged > 0 ? ` · ${totalChanged} diubah` : ''}
          </Text>
        </View>
      </View>

      {/* Info banner */}
      <View style={[styles.infoBanner, { backgroundColor: `${colors.info}12`, borderColor: `${colors.info}30` }]}>
        <Feather name="info" size={14} color={colors.info} />
        <Text style={[styles.infoText, { color: colors.info }]}>
          Diproses bertahap di background. Maks. 200 produk per batch.
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {selectedProducts.map((product) => {
          const current = stockMap[product.platformProductId] ?? product.totalStock;
          const changed = current !== product.totalStock;
          return (
            <View
              key={product.platformProductId}
              style={[
                styles.productCard,
                { backgroundColor: colors.cardBg, borderColor: changed ? colors.primary : colors.border },
              ]}
            >
              {changed && <View style={[styles.changedBar, { backgroundColor: colors.primary }]} />}

              <View style={styles.productTop}>
                <Text style={[styles.productName, { color: colors.heading }]} numberOfLines={1}>
                  {product.name}
                </Text>
                {changed && (
                  <View style={[styles.changePill, { backgroundColor: `${colors.primary}18` }]}>
                    <Text style={[styles.changeText, { color: colors.primary }]}>
                      {product.totalStock} → {current}
                    </Text>
                  </View>
                )}
              </View>

              <Text style={[styles.currentLabel, { color: colors.textSecondary }]}>
                Stok saat ini: <Text style={{ color: colors.heading, fontWeight: '700' }}>{product.totalStock}</Text>
              </Text>

              {/* Stepper */}
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={[styles.stepBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}
                  onPress={() => setStockMap((prev) => ({
                    ...prev, [product.platformProductId]: Math.max(0, current - 1),
                  }))}
                >
                  <Feather name="minus" size={18} color={colors.textPrimary} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.stepInput, { color: colors.heading, backgroundColor: colors.inputBg, borderColor: colors.border }]}
                  value={String(current)}
                  keyboardType="numeric"
                  onChangeText={(t) => {
                    const n = parseInt(t, 10);
                    if (!isNaN(n) && n >= 0) {
                      setStockMap((prev) => ({ ...prev, [product.platformProductId]: n }));
                    }
                  }}
                />
                <TouchableOpacity
                  style={[styles.stepBtn, { backgroundColor: colors.primary }]}
                  onPress={() => setStockMap((prev) => ({
                    ...prev, [product.platformProductId]: current + 1,
                  }))}
                >
                  <Feather name="plus" size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.cardBg, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: colors.primary }]}
          onPress={() => createJobMutation.mutate()}
          disabled={createJobMutation.isPending}
          activeOpacity={0.85}
        >
          <Feather name="upload-cloud" size={18} color="#fff" />
          <Text style={styles.submitBtnText}>
            {createJobMutation.isPending ? 'Membuat Job...' : `Update ${selectedProducts.length} Produk`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderBottomWidth: 1 },
  headerIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '800' },
  headerSub: { fontSize: 13, marginTop: 2 },
  infoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, margin: 12, padding: 12, borderRadius: 12, borderWidth: 1 },
  infoText: { flex: 1, fontSize: 12, lineHeight: 18 },
  list: { padding: 12, gap: 10, paddingBottom: 20 },
  productCard: { borderRadius: 16, padding: 14, borderWidth: 1, gap: 10, overflow: 'hidden', position: 'relative' },
  changedBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  productTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  productName: { flex: 1, fontSize: 14, fontWeight: '600' },
  changePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  changeText: { fontSize: 12, fontWeight: '700' },
  currentLabel: { fontSize: 13 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepInput: {
    flex: 1, height: 44, borderRadius: 12, borderWidth: 1,
    textAlign: 'center', fontSize: 18, fontWeight: '700',
  },
  footer: { padding: 16, paddingBottom: 28, borderTopWidth: 1 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 14 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
