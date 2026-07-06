// src/screens/EditStockScreen.tsx — Redesigned stock editor
import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert, TouchableOpacity, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { Skeleton } from '@/components/atoms/Skeleton';
import { ErrorState } from '@/components/molecules/ErrorState';
import { useTheme } from '@/hooks/useTheme';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { productsApi, inventoryApi } from '@/api/index';
import type { RootStackParamList, ProductDetail, ProductVariant } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'EditStock'>;
type StockState = Record<string, number>;

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
      product.variants.forEach((v: ProductVariant) => { initial[v.variantId] = v.stock; });
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
    onError: () => { Alert.alert('Gagal', 'Gagal memperbarui stok. Coba lagi.'); },
  });

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.skeletons}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={styles.skeletonItem}>
              <Skeleton width="45%" height={14} />
              <Skeleton width="100%" height={52} />
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
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Product header */}
        <View style={[styles.productHeader, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.productName, { color: colors.heading }]} numberOfLines={2}>{product.name}</Text>
          <Text style={[styles.productHint, { color: colors.textSecondary }]}>
            Ubah jumlah stok untuk setiap varian, lalu ketuk "Simpan".
          </Text>
        </View>

        {/* Variants */}
        <View style={styles.variantList}>
          {variants.map((v: ProductVariant) => {
            const current = stockState[v.variantId] ?? v.stock;
            const changed = current !== v.stock;
            return (
              <View key={v.variantId} style={[styles.variantCard, { backgroundColor: colors.cardBg, borderColor: changed ? colors.primary : colors.border }]}>
                {changed && <View style={[styles.changedBar, { backgroundColor: colors.primary }]} />}
                <View style={styles.variantTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.variantName, { color: colors.heading }]}>{v.name}</Text>
                    {v.sku ? <Text style={[styles.variantSku, { color: colors.placeholder }]}>SKU: {v.sku}</Text> : null}
                  </View>
                  {changed && (
                    <View style={[styles.changePill, { backgroundColor: `${colors.primary}18` }]}>
                      <Text style={[styles.changeText, { color: colors.primary }]}>
                        {v.stock} → {current}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Stepper */}
                <View style={styles.stepper}>
                  <TouchableOpacity
                    style={[styles.stepBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}
                    onPress={() => setStockState((prev) => ({ ...prev, [v.variantId]: Math.max(0, current - 1) }))}
                  >
                    <Feather name="minus" size={18} color={colors.textPrimary} />
                  </TouchableOpacity>
                  <TextInput
                    style={[styles.stepInput, { color: colors.heading, backgroundColor: colors.inputBg, borderColor: colors.border }]}
                    value={String(current)}
                    keyboardType="numeric"
                    onChangeText={(t) => {
                      const n = parseInt(t, 10);
                      if (!isNaN(n) && n >= 0) setStockState((prev) => ({ ...prev, [v.variantId]: n }));
                    }}
                  />
                  <TouchableOpacity
                    style={[styles.stepBtn, { backgroundColor: colors.primary }]}
                    onPress={() => setStockState((prev) => ({ ...prev, [v.variantId]: current + 1 }))}
                  >
                    <Feather name="plus" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { backgroundColor: colors.cardBg, borderTopColor: colors.border }]}>
        {hasChanges && (
          <Text style={[styles.footerHint, { color: colors.textSecondary }]}>
            {variants.filter((v: ProductVariant) => stockState[v.variantId] !== v.stock).length} varian diubah
          </Text>
        )}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            { backgroundColor: hasChanges ? colors.primary : colors.surface2 },
          ]}
          onPress={() => saveMutation.mutate()}
          disabled={!hasChanges || saveMutation.isPending}
        >
          <Feather name="save" size={18} color={hasChanges ? '#fff' : colors.placeholder} />
          <Text style={[styles.saveBtnText, { color: hasChanges ? '#fff' : colors.placeholder }]}>
            {saveMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 20 },
  skeletons: { padding: 16, gap: 16 },
  skeletonItem: { gap: 8 },

  productHeader: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 6 },
  productName: { fontSize: 16, fontWeight: '700' },
  productHint: { fontSize: 13, lineHeight: 20 },

  variantList: { gap: 12 },
  variantCard: { borderRadius: 16, padding: 14, borderWidth: 1, gap: 12, overflow: 'hidden', position: 'relative' },
  changedBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  variantTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  variantName: { fontSize: 14, fontWeight: '600' },
  variantSku: { fontSize: 11, marginTop: 2 },
  changePill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  changeText: { fontSize: 12, fontWeight: '700' },

  stepper: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepBtn: { width: 44, height: 44, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stepInput: {
    flex: 1, height: 44, borderRadius: 12, borderWidth: 1,
    textAlign: 'center', fontSize: 18, fontWeight: '700',
  },

  footer: { padding: 16, paddingBottom: 28, borderTopWidth: 1, gap: 8 },
  footerHint: { fontSize: 12, textAlign: 'center' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 14 },
  saveBtnText: { fontSize: 16, fontWeight: '700' },
});
