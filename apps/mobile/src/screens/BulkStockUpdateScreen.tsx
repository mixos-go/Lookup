import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { StockInput } from '@/components/molecules/StockInput';
import { Button } from '@/components/atoms/Button';
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

  const items: BulkStockItem[] = selectedProducts.flatMap((product) => {
    const hasVariants = Array.isArray((product as unknown as { variants?: unknown[] }).variants)
      && (product as unknown as { variants?: unknown[] }).variants!.length > 0;
    if (!hasVariants) {
      return [{
        productId: product.platformProductId,
        variantId: product.platformProductId,
        stock: stockMap[`${product.platformProductId}`] ?? 0,
        productName: product.name,
        variantName: 'Default',
      }];
    }
    return [];
  });

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

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.heading }]}>Update Stok Massal</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{selectedProducts.length} produk dipilih</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {selectedProducts.map((product) => (
          <View key={product.platformProductId} style={[styles.productCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.productInfo}>
              <Text style={[styles.productName, { color: colors.heading }]} numberOfLines={1}>{product.name}</Text>
              <Text style={[styles.currentStock, { color: colors.textSecondary }]}>Stok saat ini: {product.totalStock}</Text>
            </View>
            <StockInput
              value={stockMap[product.platformProductId] ?? product.totalStock}
              onChange={(v) =>
                setStockMap((prev) => ({ ...prev, [product.platformProductId]: v }))
              }
              label="Stok Baru"
            />
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.cardBg, borderTopColor: colors.border }]}>
        <View style={styles.footerInfo}>
          <Feather name="info" size={14} color={colors.info} />
          <Text style={[styles.footerHint, { color: colors.info }]}>
            Diproses secara bertahap. Maks. 200 produk per batch.
          </Text>
        </View>
        <Button
          label={createJobMutation.isPending ? 'Membuat Job...' : `Update ${selectedProducts.length} Produk`}
          onPress={() => createJobMutation.mutate()}
          variant="primary"
          loading={createJobMutation.isPending}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { padding: 16, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 13, marginTop: 2 },
  content: { padding: 16, gap: 12 },
  productCard: {
    borderRadius: 12, padding: 14,
    gap: 12, borderWidth: 1,
  },
  productInfo: { gap: 2 },
  productName: { fontSize: 14, fontWeight: '600' },
  currentStock: { fontSize: 12 },
  footer: {
    padding: 16, paddingBottom: 28,
    borderTopWidth: 1, gap: 10,
  },
  footerInfo: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerHint: { flex: 1, fontSize: 12 },
});
