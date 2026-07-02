import React, { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { ProductCard } from '@/components/molecules/ProductCard';
import { ShopSelector } from '@/components/organisms/ShopSelector';
import { BulkActionBar } from '@/components/organisms/BulkActionBar';
import { Skeleton } from '@/components/atoms/Skeleton';
import { useTheme } from '@/hooks/useTheme';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useShopStore } from '@/stores/shopStore';
import { useBulkStore } from '@/stores/bulkStore';
import { productsApi } from '@/api/index';
import { useSyncProducts } from '@/hooks/useProducts';
import type { RootStackParamList, ProductSummary } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type StatusFilter = 'ALL' | 'ACTIVE' | 'SOLD_OUT';

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: 'ALL', label: 'Semua' },
  { key: 'ACTIVE', label: 'Aktif' },
  { key: 'SOLD_OUT', label: 'Habis' },
];

function ProductListSkeleton() {
  const { colors } = useTheme();
  return (
    <View>
      {Array.from({ length: 6 }).map((_, i) => (
        <View key={i} style={[skeletonStyles.row, { borderBottomColor: colors.border }]}>
          <Skeleton width={60} height={60} borderRadius={8} />
          <View style={skeletonStyles.content}>
            <Skeleton width="90%" height={16} />
            <Skeleton width="50%" height={12} />
            <Skeleton width="40%" height={12} />
          </View>
        </View>
      ))}
    </View>
  );
}

const skeletonStyles = StyleSheet.create({
  row: { flexDirection: 'row', padding: 16, gap: 12, borderBottomWidth: 1 },
  content: { flex: 1, gap: 8, justifyContent: 'center' },
});

export function ProductListScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { activeShopId, getActiveShop } = useShopStore();
  const { isSelectMode, selectedProducts, enterSelectMode, toggleProduct, selectAll, isSelected } =
    useBulkStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const activeShop = getActiveShop();
  const syncMutation = useSyncProducts();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEYS.products(activeShopId ?? '', { search, status: statusFilter }),
    queryFn: () =>
      productsApi.list({ shopId: activeShopId!, search, status: statusFilter }),
    enabled: !!activeShopId,
  });

  const products: ProductSummary[] = data?.data?.products ?? [];

  const handleSync = useCallback(async () => {
    if (!activeShopId || syncMutation.isPending) return;
    await syncMutation.mutateAsync(activeShopId);
    refetch();
  }, [activeShopId, syncMutation, refetch]);

  const handlePress = useCallback(
    (product: ProductSummary) => {
      if (isSelectMode) {
        toggleProduct(product);
      } else {
        navigation.navigate('ProductDetail', {
          productId: product.id,
          shopId: activeShopId!,
          productName: product.name,
        });
      }
    },
    [isSelectMode, activeShopId, navigation, toggleProduct],
  );

  const handleLongPress = useCallback(
    (product: ProductSummary) => {
      if (!isSelectMode) enterSelectMode();
      toggleProduct(product);
    },
    [isSelectMode, enterSelectMode, toggleProduct],
  );

  const renderItem = useCallback(
    ({ item }: { item: ProductSummary }) => (
      <ProductCard
        product={item}
        platform={activeShop?.platform ?? 'SHOPEE'}
        isSelectMode={isSelectMode}
        isSelected={isSelected(item.id)}
        onPress={() => handlePress(item)}
        onLongPress={() => handleLongPress(item)}
      />
    ),
    [activeShop, isSelectMode, isSelected, handlePress, handleLongPress],
  );

  const isSyncing = syncMutation.isPending;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Shop Selector + Sync Button */}
      <View style={styles.topBar}>
        <View style={styles.shopSelectorWrap}>
          <ShopSelector />
        </View>
        <TouchableOpacity
          style={[styles.syncBtn, { backgroundColor: colors.primaryLight }, isSyncing && styles.syncBtnDisabled]}
          onPress={handleSync}
          disabled={isSyncing || !activeShopId}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Feather name="refresh-cw" size={18} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={[styles.searchBar, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.placeholder} />
          <TextInput
            style={[styles.searchInput, { color: colors.heading }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Cari produk atau SKU..."
            placeholderTextColor={colors.placeholder}
            returnKeyType="search"
          />
          {!!search && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={16} color={colors.placeholder} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter / Select banner */}
      {isSelectMode ? (
        <View style={[styles.selectBanner, { backgroundColor: colors.primaryLight }]}>
          <Text style={[styles.selectCount, { color: colors.primary }]}>{selectedProducts.length} produk dipilih</Text>
          <TouchableOpacity onPress={() => selectAll(products)}>
            <Text style={[styles.selectAll, { color: colors.primary }]}>Pilih Semua</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.filterRow}>
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                onPress={() => setStatusFilter(f.key)}
                style={[
                  styles.filterChip,
                  { backgroundColor: colors.cardBg, borderColor: colors.border },
                  active && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Text
                  style={[styles.filterLabel, { color: colors.textSecondary }, active && { color: colors.white }]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Sync in-progress banner */}
      {isSyncing && (
        <View style={[styles.syncBanner, { backgroundColor: colors.infoLight }]}>
          <ActivityIndicator size="small" color={colors.info} />
          <Text style={[styles.syncBannerText, { color: colors.info }]}>Menyinkronkan produk dari marketplace...</Text>
        </View>
      )}

      {isLoading ? (
        <ProductListSkeleton />
      ) : (
        <FlashList
          data={products}
          renderItem={renderItem}
          estimatedItemSize={85}
          onRefresh={refetch}
          refreshing={isRefetching}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="package" size={40} color={colors.placeholder} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Tidak ada produk ditemukan</Text>
              {!!activeShopId && (
                <TouchableOpacity style={[styles.emptySync, { backgroundColor: colors.primaryLight }]} onPress={handleSync}>
                  <Feather name="refresh-cw" size={14} color={colors.primary} />
                  <Text style={[styles.emptySyncLabel, { color: colors.primary }]}>Sinkronkan dari marketplace</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}

      <BulkActionBar />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
  },
  shopSelectorWrap: { flex: 1 },
  syncBtn: {
    width: 36, height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  syncBtnDisabled: { opacity: 0.5 },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  syncBannerText: { fontSize: 13, flex: 1 },
  searchRow: { paddingHorizontal: 16, paddingBottom: 8 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12, height: 40,
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 9999, borderWidth: 1,
  },
  filterLabel: { fontSize: 13, fontWeight: '600' },
  selectBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 10,
  },
  selectCount: { fontSize: 14, fontWeight: '700' },
  selectAll: { fontSize: 14, fontWeight: '600' },
  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15 },
  emptySync: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 4,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 8,
  },
  emptySyncLabel: { fontSize: 14, fontWeight: '600' },
});
