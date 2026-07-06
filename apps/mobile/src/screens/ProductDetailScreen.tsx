// src/screens/ProductDetailScreen.tsx — Redesigned product detail
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
import { getProductStatusDisplay } from '@/utils/productStatus';
import { useTheme } from '@/hooks/useTheme';
import { useShopStore } from '@/stores/shopStore';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { productsApi } from '@/api/index';
import type { RootStackParamList, ProductDetail } from '@/types';
import { formatCurrency } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'ProductDetail'>;

// Status display now uses shared productStatus util — handles Shopee (NORMAL/UNLIST/BANNED)
// and TikTok (ACTIVE/INACTIVE/SELLER_DEACTIVATED) values correctly.

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
    (_v: VariantItem) => navigation.navigate('EditStock', { productId, shopId }),
    [navigation, productId, shopId],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.loadingContent}>
          <Skeleton width="100%" height={260} borderRadius={0} />
          <View style={{ padding: 20, gap: 12 }}>
            <Skeleton width="80%" height={22} />
            <Skeleton width="50%" height={16} />
            <Skeleton width="100%" height={130} />
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

  const statusInfo = getProductStatusDisplay(product.status, product.totalStock ?? 0);
  const coverImage = product.images?.[0]?.url ?? product.coverImage;
  const variantItems: VariantItem[] = (product.variants ?? []).map((v) => ({
    variantId: v.variantId, variantName: v.name,
    stock: v.stock, price: v.price, originalPrice: v.originalPrice,
    currency: v.currency, sku: v.sku, attributes: v.attributes,
  }));

  const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0) ?? product.totalStock;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>

        {/* Cover image */}
        <Image
          source={{ uri: coverImage }}
          style={[styles.cover, { backgroundColor: colors.surface2 }]}
          contentFit="cover"
        />

        {/* Info block */}
        <View style={styles.infoBlock}>
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

          {/* Stock summary */}
          <View style={styles.stockRow}>
            <View style={[
              styles.stockPill,
              { backgroundColor: totalStock === 0 ? colors.dangerLight : `${colors.primary}14` },
            ]}>
              <View style={[styles.stockDot, { backgroundColor: totalStock === 0 ? colors.danger : colors.primary }]} />
              <Text style={[styles.stockText, { color: totalStock === 0 ? colors.danger : colors.primary }]}>
                {totalStock} stok tersedia
              </Text>
            </View>
            {product.variantCount > 1 && (
              <Text style={[styles.variantCount, { color: colors.textSecondary }]}>
                {product.variantCount} varian
              </Text>
            )}
          </View>
        </View>

        {/* Variants */}
        <View style={[styles.section, { borderTopColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.heading }]}>Detail Varian</Text>
          <VariantTable
            variants={variantItems}
            currency={product.priceRange.currency}
            onVariantPress={handleVariantPress}
          />
        </View>

        {/* Images */}
        {(product.images?.length ?? 0) > 0 && (
          <View style={[styles.section, { borderTopColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.heading }]}>
              Gambar Produk ({product.images.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
              {product.images.map((img) => (
                <Image
                  key={img.imageId}
                  source={{ uri: img.url }}
                  style={[styles.thumbImage, { backgroundColor: colors.surface2 }]}
                  contentFit="cover"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Bottom spacer for action bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action bar */}
      <View style={[styles.actionBar, { backgroundColor: colors.cardBg, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('EditStock', { productId, shopId })}
        >
          <Feather name="layers" size={16} color="#fff" />
          <Text style={styles.actionBtnPrimaryText}>Edit Stok</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtnSecondary, { backgroundColor: colors.surface2, borderColor: colors.border }]}
          onPress={() => navigation.navigate('EditPrice', { productId, shopId })}
        >
          <Feather name="tag" size={16} color={colors.primary} />
          <Text style={[styles.actionBtnSecondaryText, { color: colors.primary }]}>Harga</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtnSecondary, { backgroundColor: colors.surface2, borderColor: colors.border }]}
          onPress={() => navigation.navigate('EditImage', { productId, shopId })}
        >
          <Feather name="image" size={16} color={colors.primary} />
          <Text style={[styles.actionBtnSecondaryText, { color: colors.primary }]}>Gambar</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loadingContent: { paddingBottom: 40 },
  content: { paddingBottom: 20 },
  cover: { width: '100%', height: 260 },

  infoBlock: { padding: 20, gap: 10 },
  tagRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  productName: { fontSize: 20, fontWeight: '800', lineHeight: 28, letterSpacing: -0.2 },
  priceRange: { fontSize: 18, fontWeight: '800' },
  stockRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stockPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 },
  stockDot: { width: 6, height: 6, borderRadius: 3 },
  stockText: { fontSize: 12, fontWeight: '700' },
  variantCount: { fontSize: 13 },

  section: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8, gap: 12, borderTopWidth: 1 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  imageRow: { gap: 10 },
  thumbImage: { width: 80, height: 80, borderRadius: 12 },

  actionBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: 10,
    padding: 16, paddingBottom: 28, borderTopWidth: 1,
  },
  actionBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 14 },
  actionBtnPrimaryText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  actionBtnSecondary: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 48, borderRadius: 14, borderWidth: 1 },
  actionBtnSecondaryText: { fontSize: 13, fontWeight: '700' },
});
