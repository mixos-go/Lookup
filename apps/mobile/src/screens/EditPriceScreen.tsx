import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PriceInput } from '@/components/molecules/PriceInput';
import { Button } from '@/components/atoms/Button';
import { Skeleton } from '@/components/atoms/Skeleton';
import { ErrorState } from '@/components/molecules/ErrorState';
import { Colors } from '@/constants';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { productsApi, priceApi } from '@/api/index';
import type { RootStackParamList, ProductDetail, ProductVariant } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'EditPrice'>;

interface PriceState {
  [variantId: string]: { salePrice: number; originalPrice: number };
}

export function EditPriceScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { productId, shopId } = route.params;
  const queryClient = useQueryClient();
  const [priceState, setPriceState] = useState<PriceState>({});

  const { data: product, isLoading, error, refetch } = useQuery<ProductDetail>({
    queryKey: QUERY_KEYS.productDetail(productId, shopId),
    queryFn: () => productsApi.detail(productId, shopId),
    staleTime: 20_000,
  });

  useEffect(() => {
    if (product?.variants) {
      const initial: PriceState = {};
      product.variants.forEach((v: ProductVariant) => {
        initial[v.variantId] = { salePrice: v.price, originalPrice: v.originalPrice ?? v.price };
      });
      setPriceState(initial);
    }
  }, [product]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const updates = Object.entries(priceState).map(([variantId, p]) => ({
        variantId,
        price: p.salePrice,
        originalPrice: p.originalPrice > p.salePrice ? p.originalPrice : undefined,
      }));
      return priceApi.updatePrice(productId, shopId, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.productDetail(productId, shopId) });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      Alert.alert('Berhasil', 'Harga berhasil diperbarui.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    },
    onError: () => {
      Alert.alert('Gagal', 'Gagal memperbarui harga. Coba lagi.');
    },
  });

  const hasInvalid = Object.values(priceState).some((p) => p.salePrice <= 0);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.skeletonContainer}>
          {Array.from({ length: 2 }).map((_, i) => (
            <View key={i} style={styles.skeletonItem}>
              <Skeleton width="50%" height={14} />
              <Skeleton width="100%" height={80} />
            </View>
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={styles.safe}>
        <ErrorState message="Gagal memuat data produk." onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const variants = product.variants ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.hint}>Ubah harga jual dan harga coret untuk setiap varian.</Text>

        {variants.map((v: ProductVariant) => (
          <View key={v.variantId} style={styles.variantCard}>
            <Text style={styles.variantName}>{v.name}</Text>
            <PriceInput
              salePrice={priceState[v.variantId]?.salePrice ?? v.price}
              originalPrice={priceState[v.variantId]?.originalPrice ?? v.originalPrice ?? v.price}
              onChangeSale={(val) =>
                setPriceState((prev) => ({
                  ...prev,
                  [v.variantId]: { ...prev[v.variantId], salePrice: val },
                }))
              }
              onChangeOriginal={(val) =>
                setPriceState((prev) => ({
                  ...prev,
                  [v.variantId]: { ...prev[v.variantId], originalPrice: val },
                }))
              }
            />
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          label={saveMutation.isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          onPress={() => saveMutation.mutate()}
          variant={hasInvalid ? 'secondary' : 'primary'}
          loading={saveMutation.isPending}
          fullWidth
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 16 },
  productName: { fontSize: 16, fontWeight: '700', color: Colors.heading },
  hint: { fontSize: 13, color: Colors.textSecondary },
  variantCard: {
    backgroundColor: Colors.cardBg, borderRadius: 12, padding: 14,
    gap: 12, borderWidth: 1, borderColor: Colors.border,
  },
  variantName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  skeletonContainer: { padding: 16, gap: 16 },
  skeletonItem: { gap: 8 },
  footer: {
    padding: 16, paddingBottom: 28,
    backgroundColor: Colors.white,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
});
