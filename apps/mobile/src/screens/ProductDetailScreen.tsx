import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { VariantTable } from '@/components/organisms/VariantTable';
import type { VariantItem } from '@/components/organisms/VariantTable';
import { PlatformTag } from '@/components/atoms/PlatformTag';
import { Badge } from '@/components/atoms/Badge';
import { Skeleton } from '@/components/atoms/Skeleton';
import { ErrorState } from '@/components/molecules/ErrorState';
import { useTheme } from '@/hooks/useTheme';
import { useShopStore } from '@/stores/shopStore';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { productsApi } from '@/api/index';
import type { RootStackParamList, ProductDetail } from '@/types';
import { formatCurrency } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ProductDetail'>;

const STATUS_MAP: Record<string, { label: string; variant: 'success' | 'danger' | 'neutral' }> = {
  ACTIVE: { label: 'Aktif', variant: 'success' },
  SOLD_OUT: { label: 'Habis', variant: 'danger' },
  INACTIVE: { label: 'Non-aktif', variant: 'neutral' },
};

export function ProductDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const { productId, shopId } = route.params;
  const { getActiveShop } = useShopStore();
  const activeShop = getActiveShop();

  const { data: product, isLoading, error, refetch } = useQuery<ProductDetail>({
    queryKey: QUERY_KEYS.productDetail(productId, shopId),
    queryFn: () => productsApi.detail(productId, shopId),
    staleTime: 20_000,
  });

  const handleVariantPress = useCallback(
    (_variant: VariantItem) => {
      navigation.navigate('EditStock', { productId, shopId });
    },
    [navigation, productId, shopId],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.content}>
          <Skeleton width="100%" height={240} borderRadius={0} />
          <View style={{ padding: 16, gap: 12 }}>
            <Skeleton width="80%" height={20} />
            <Skeleton width="50%" height={14} />
            <Skeleton width="100%" height={120} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ErrorState message="Gagal memuat detail produk." onRetry={refetch} />
      </SafeAreaView>
    );
  }

  const statusInfo = STATUS_MAP[product.status] ?? { label: product.status, variant: 'neutral' as const };
  const coverImage = product.images?.[0]?.url ?? product.coverImage;

  const variantItems: VariantItem[] = (product.variants ?? []).map((v) => ({
    variantId: v.variantId,
    variantName: v.name,
    stock: v.stock,
    price: v.price,
    originalPrice: v.originalPrice,
    currency: v.currency,
    sku: v.sku,
    attributes: v.attributes,
  }));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Image source={{ uri: coverImage }} style={[styles.cover, { backgroundColor: colors.border }]} contentFit="cover" />

        <View style={styles.infoSection}>
          <View style={styles.tagRow}>
            <PlatformTag platform={activeShop?.platform ?? 'SHOPEE'} />
            <Badge label={statusInfo.label} variant={statusInfo.variant} />
          </View>
          <Text style={[styles.productName, { color: colors.heading }]}>{product.name}</Text>
          <Text style={[styles.priceRange, { color: colors.primary }]}>
            {formatCurrency(product.priceRange.min, product.priceRange.currency)}
            {product.priceRange.min !== product.priceRange.max &&
              ` – ${formatCurrency(product.priceRange.max, product.priceRange.currency)}`}
          </Text>
        </View>

        <View style={styles.section}>
          <VariantTable
            variants={variantItems}
            currency={product.priceRange.currency}
            onVariantPress={handleVariantPress}
          />
        </View>

        {(product.images?.length ?? 0) > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.heading }]}>Gambar Produk ({product.images.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
              {product.images.map((img) => (
                <Image
                  key={img.imageId}
                  source={{ uri: img.url }}
                  style={styles.thumbImage}
                  contentFit="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>

      <View style={[styles.actionBar, { backgroundColor: colors.cardBg, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('EditStock', { productId, shopId })}
        >
          <Feather name="layers" size={16} color={colors.white} />
          <Text style={[styles.actionBtnPrimaryLabel, { color: colors.white }]}>Edit Stok</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary }]}
          onPress={() => navigation.navigate('EditPrice', { productId, shopId })}
        >
          <Feather name="tag" size={16} color={colors.primary} />
          <Text style={[styles.actionBtnSecondaryLabel, { color: colors.primary }]}>Edit Harga</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary }]}
          onPress={() => navigation.navigate('EditImage', { productId, shopId })}
        >
          <Feather name="image" size={16} color={colors.primary} />
          <Text style={[styles.actionBtnSecondaryLabel, { color: colors.primary }]}>Edit Gambar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { paddingBottom: 100 },
  cover: { width: '100%', height: 240 },
  infoSection: { padding: 16, gap: 8 },
  tagRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  productName: { fontSize: 18, fontWeight: '700', lineHeight: 26 },
  priceRange: { fontSize: 16, fontWeight: '700' },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  imageRow: { flexDirection: 'row', gap: 8 },
  thumbImage: { width: 72, height: 72, borderRadius: 8 },
  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 10,
    padding: 16, paddingBottom: 28,
    borderTopWidth: 1,
  },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 44, borderRadius: 10 },
  actionBtnPrimaryLabel: { fontSize: 14, fontWeight: '700' },
  actionBtnSecondaryLabel: { fontSize: 14, fontWeight: '600' },
});
