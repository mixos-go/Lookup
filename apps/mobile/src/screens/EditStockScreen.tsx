import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StockInput } from '@/components/molecules/StockInput';
import { Button } from '@/components/atoms/Button';
import { Skeleton } from '@/components/atoms/Skeleton';
import { ErrorState } from '@/components/molecules/ErrorState';
import { useTheme } from '@/hooks/useTheme';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { productsApi, inventoryApi } from '@/api/index';
import type { RootStackParamList, ProductDetail, ProductVariant } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'EditStock'>;

interface StockState {
  [variantId: string]: number;
}

export function EditStockScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const { productId, shopId } = route.params;
  const queryClient = useQueryClient();
  const [stockState, setStockState] = useState<StockState>({});

  const { data: product, isLoading, error, refetch } = useQuery<ProductDetail>({
    queryKey: QUERY_KEYS.productDetail(productId, shopId),
    queryFn: () => productsApi.detail(productId, shopId),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (product?.variants) {
      const initial: StockState = {};
      product.variants.forEach((v: ProductVariant) => {
        initial[v.variantId] = v.stock;
      });
      setStockState(initial);
    }
  }, [product]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(stockState).map(([variantId, stock]) => ({ variantId, stock }));
      return inventoryApi.updateStock(productId, shopId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productDetail(productId, shopId) });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      Alert.alert('Berhasil', 'Stok berhasil diperbarui.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: () => {
      Alert.alert('Gagal', 'Gagal memperbarui stok. Coba lagi.');
    },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.skeletonContainer}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={styles.skeletonItem}>
              <Skeleton width="50%" height={14} />
              <Skeleton width="100%" height={44} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ErrorState message="Gagal memuat data produk." onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const variants = product.variants ?? [];
  const hasChanges = variants.some((v: ProductVariant) => stockState[v.variantId] !== v.stock);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.productName, { color: colors.heading }]} numberOfLines={2}>{product.name}</Text>
        <Text style={[styles.hint, { color: colors.textSecondary }]}>Ubah jumlah stok untuk setiap varian.</Text>

        <View style={styles.variantList}>
          {variants.map((v: ProductVariant) => (
            <View key={v.variantId} style={[styles.variantItem, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <Text style={[styles.variantName, { color: colors.textPrimary }]}>{v.name}</Text>
              {v.sku ? <Text style={[styles.sku, { color: colors.placeholder }]}>SKU: {v.sku}</Text> : null}
              <StockInput
                value={stockState[v.variantId] ?? v.stock}
                onChange={(newStock) =>
                  setStockState((prev) => ({ ...prev, [v.variantId]: newStock }))
                }
              />
              {stockState[v.variantId] !== v.stock && (
                <Text style={[styles.changedHint, { color: colors.primary }]}>
                  {v.stock} → {stockState[v.variantId]}
                </Text>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.cardBg, borderTopColor: colors.border }]}>
        <Button
          label={saveMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          onPress={() => saveMutation.mutate()}
          variant={hasChanges ? 'primary' : 'secondary'}
          loading={saveMutation.isPending}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, gap: 16 },
  productName: { fontSize: 16, fontWeight: '700' },
  hint: { fontSize: 13 },
  variantList: { gap: 16 },
  variantItem: {
    borderRadius: 12, padding: 14,
    gap: 8, borderWidth: 1,
  },
  variantName: { fontSize: 14, fontWeight: '600' },
  sku: { fontSize: 12 },
  changedHint: { fontSize: 12, fontWeight: '600' },
  skeletonContainer: { padding: 16, gap: 16 },
  skeletonItem: { gap: 8 },
  footer: {
    padding: 16, paddingBottom: 28,
    borderTopWidth: 1,
  },
});
