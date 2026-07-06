// src/screens/ProductListScreen.tsx — Inventar-style dark product list
import React, { useState, useCallback, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  Platform, useWindowDimensions, ActivityIndicator,
  RefreshControl, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { Skeleton } from '@/components/atoms/Skeleton';
import { EmptyState } from '@/components/molecules/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useShopStore } from '@/stores/shopStore';
import { useBulkStore } from '@/stores/bulkStore';
import { productsApi } from '@/api/index';
import { shopsApi } from '@/api/shops';
import { formatCurrency } from '@/utils/format';
import { matchesStatusFilter, getProductStatusDisplay } from '@/utils/productStatus';
import type { RootStackParamList, ProductSummary, Shop } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_FILTERS = [
  { key: 'ALL',      label: 'Semua'  },
  { key: 'ACTIVE',   label: 'Aktif'  },
  { key: 'SOLD_OUT', label: 'Habis'  },
  { key: 'INACTIVE', label: 'Inaktif'},
] as const;

type StatusFilter = typeof STATUS_FILTERS[number]['key'];

const STOCK_COLOR = (stock: number, colors: any) => {
  if (stock === 0) return colors.danger;
  if (stock <= 5) return colors.warning;
  return colors.primary;
};

// ─── Product row (mobile card) ────────────────────────────────────────────────
function ProductCard({
  product, platform, isSelectMode, isSelected,
  onPress, onLongPress,
}: {
  product: ProductSummary;
  platform: 'SHOPEE' | 'TIKTOK';
  isSelectMode: boolean;
  isSelected: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { colors } = useTheme();
  const platformColor = platform === 'SHOPEE' ? '#EE4D2D' : colors.tiktokPink;
  const isSoldOut = product.totalStock === 0;
  const statusDisplay = getProductStatusDisplay(product.status, product.totalStock);

  return (
    <TouchableOpacity
      style={[
        styles.productCard,
        { backgroundColor: colors.cardBg, borderColor: isSelected ? colors.primary : colors.border },
        isSelected && { borderColor: colors.primary },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      {isSelectMode && (
        <View style={[
          styles.selectCircle,
          { borderColor: isSelected ? colors.primary : colors.border, backgroundColor: isSelected ? colors.primary : 'transparent' },
        ]}>
          {isSelected && <Feather name="check" size={12} color="#fff" />}
        </View>
      )}

      <Image
        source={{ uri: product.coverImage }}
        style={[styles.productImage, { backgroundColor: colors.surface2 }]}
        contentFit="cover"
      />

      <View style={styles.productInfo}>
        <View style={styles.productInfoTop}>
          <Text style={[styles.productName, { color: colors.heading }]} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={[styles.platformBadge, { backgroundColor: `${platformColor}18` }]}>
            <Text style={[styles.platformBadgeText, { color: platformColor }]}>
              {platform === 'SHOPEE' ? 'Shopee' : 'TikTok'}
            </Text>
          </View>
        </View>

        <View style={styles.productMeta}>
          <Text style={[styles.productPrice, { color: colors.primary }]}>
            {formatCurrency(product.priceRange.min, product.priceRange.currency)}
            {product.priceRange.min !== product.priceRange.max &&
              ` – ${formatCurrency(product.priceRange.max, product.priceRange.currency)}`}
          </Text>
          <View style={styles.productStats}>
            <View style={[styles.stockBadge, { backgroundColor: `${STOCK_COLOR(product.totalStock, colors)}18` }]}>
              <View style={[styles.stockDot, { backgroundColor: STOCK_COLOR(product.totalStock, colors) }]} />
              <Text style={[styles.stockText, { color: STOCK_COLOR(product.totalStock, colors) }]}>
                {statusDisplay.label === 'Habis' ? 'Habis' : `${product.totalStock} stok`}
              </Text>
            </View>
            {product.variantCount > 1 && (
              <Text style={[styles.variantCount, { color: colors.placeholder }]}>
                {product.variantCount} varian
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Web table row ────────────────────────────────────────────────────────────
function ProductTableRow({
  product, platform, isSelected, isSelectMode,
  onPress, onLongPress,
}: {
  product: ProductSummary;
  platform: 'SHOPEE' | 'TIKTOK';
  isSelected: boolean;
  isSelectMode: boolean;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const { colors } = useTheme();
  const platformColor = platform === 'SHOPEE' ? '#EE4D2D' : colors.tiktokPink;

  return (
    <TouchableOpacity
      style={[
        styles.tableRow,
        { backgroundColor: isSelected ? `${colors.primary}10` : colors.cardBg, borderBottomColor: colors.border },
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {isSelectMode && (
        <View style={[
          styles.tableCheck,
          { borderColor: isSelected ? colors.primary : colors.border, backgroundColor: isSelected ? colors.primary : 'transparent' },
        ]}>
          {isSelected && <Feather name="check" size={10} color="#fff" />}
        </View>
      )}
      <Image
        source={{ uri: product.coverImage }}
        style={[styles.tableImage, { backgroundColor: colors.surface2 }]}
        contentFit="cover"
      />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.tableName, { color: colors.heading }]} numberOfLines={1}>{product.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[styles.platformBadge, { backgroundColor: `${platformColor}18` }]}>
            <Text style={[styles.platformBadgeText, { color: platformColor }]}>
              {platform === 'SHOPEE' ? 'Shopee' : 'TikTok'}
            </Text>
          </View>
          {product.variantCount > 1 && (
            <Text style={[styles.variantCount, { color: colors.placeholder }]}>
              {product.variantCount} varian
            </Text>
          )}
        </View>
      </View>
      <Text style={[styles.tablePrice, { color: colors.primary }]}>
        {formatCurrency(product.priceRange.min, product.priceRange.currency)}
      </Text>
      <View style={[styles.stockBadge, { backgroundColor: `${STOCK_COLOR(product.totalStock, colors)}18` }]}>
        <View style={[styles.stockDot, { backgroundColor: STOCK_COLOR(product.totalStock, colors) }]} />
        <Text style={[styles.stockText, { color: STOCK_COLOR(product.totalStock, colors) }]}>
          {product.totalStock}
        </Text>
      </View>
      <Feather name="chevron-right" size={16} color={colors.placeholder} />
    </TouchableOpacity>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export function ProductListScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 900;

  const { shops, activeShopId, setActiveShopId, setShops } = useShopStore();
  const { isSelectMode, selectedProducts, toggleProduct, isSelected, enterSelectMode, exitSelectMode } = useBulkStore();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL');

  const activeShop = shops.find((s) => s.id === activeShopId);

  // Load shops if empty
  useQuery({
    queryKey: QUERY_KEYS.shops(),
    queryFn: async () => {
      const result = await shopsApi.list();
      setShops(result);
      return result;
    },
    staleTime: 60_000,
    enabled: shops.length === 0,
  });

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEYS.products(activeShopId ?? ''),
    queryFn: () => productsApi.list({ shopId: activeShopId! }),
    enabled: !!activeShopId,
    staleTime: 30_000,
  });

  const syncMutation = useMutation({
    mutationFn: (shopId: string) => productsApi.syncProducts(shopId),
    onSuccess: () => refetch(),
  });

  const products: ProductSummary[] = data?.data?.products ?? [];

  const filtered = useMemo(() => {
    let list = products;
    if (statusFilter !== 'ALL') list = list.filter((p) => matchesStatusFilter(p, statusFilter));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, statusFilter, search]);

  const handlePress = useCallback((product: ProductSummary) => {
    if (isSelectMode) { toggleProduct(product); return; }
    navigation.navigate('ProductDetail', {
      productId: product.id, shopId: activeShopId!, productName: product.name,
    });
  }, [isSelectMode, activeShopId, navigation, toggleProduct]);

  const handleLongPress = useCallback((product: ProductSummary) => {
    if (!isSelectMode) enterSelectMode();
    toggleProduct(product);
  }, [isSelectMode, enterSelectMode, toggleProduct]);

  const renderCard = useCallback(({ item }: { item: ProductSummary }) =>
    isDesktop
      ? <ProductTableRow
          product={item} platform={activeShop?.platform ?? 'SHOPEE'}
          isSelected={isSelected(item.id)} isSelectMode={isSelectMode}
          onPress={() => handlePress(item)} onLongPress={() => handleLongPress(item)}
        />
      : <ProductCard
          product={item} platform={activeShop?.platform ?? 'SHOPEE'}
          isSelectMode={isSelectMode} isSelected={isSelected(item.id)}
          onPress={() => handlePress(item)} onLongPress={() => handleLongPress(item)}
        />, [isDesktop, activeShop, isSelectMode, isSelected, handlePress, handleLongPress]);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>

      {/* ── Top bar ── */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <View style={styles.topBarLeft}>
          <Text style={[styles.topBarTitle, { color: colors.heading }]}>Produk</Text>
          {products.length > 0 && (
            <View style={[styles.totalBadge, { backgroundColor: colors.surface2 }]}>
              <Text style={[styles.totalBadgeText, { color: colors.textSecondary }]}>{products.length}</Text>
            </View>
          )}
        </View>
        <View style={styles.topBarActions}>
          {isSelectMode ? (
            <>
              <Text style={[styles.selectCount, { color: colors.primary }]}>
                {selectedProducts.length} dipilih
              </Text>
              <TouchableOpacity
                style={[styles.actionChip, { backgroundColor: colors.surface2, borderColor: colors.border }]}
                onPress={exitSelectMode}
              >
                <Text style={[styles.actionChipText, { color: colors.textPrimary }]}>Batal</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionChip, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('BulkStockUpdate')}
                disabled={selectedProducts.length === 0}
              >
                <Text style={[styles.actionChipText, { color: '#fff' }]}>Bulk Update</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.syncBtn, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}30` }]}
                onPress={() => activeShopId && syncMutation.mutate(activeShopId)}
                disabled={!activeShopId || syncMutation.isPending}
              >
                <Feather name="refresh-cw" size={15} color={colors.primary}
                  style={syncMutation.isPending ? styles.spinning : undefined}
                />
                <Text style={[styles.syncBtnText, { color: colors.primary }]}>
                  {syncMutation.isPending ? 'Sinkron...' : 'Sinkron'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* ── Shop selector ── */}
      {shops.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shopScroll} contentContainerStyle={styles.shopScrollContent}>
          {shops.map((s: Shop) => {
            const isActive = s.id === activeShopId;
            const pc = s.platform === 'SHOPEE' ? '#EE4D2D' : colors.tiktokPink;
            return (
              <TouchableOpacity
                key={s.id}
                style={[
                  styles.shopTab,
                  { backgroundColor: isActive ? `${pc}18` : 'transparent', borderColor: isActive ? pc : 'transparent' },
                ]}
                onPress={() => setActiveShopId(s.id)}
              >
                <View style={[styles.shopTabDot, { backgroundColor: pc }]} />
                <Text style={[styles.shopTabText, { color: isActive ? pc : colors.textSecondary }]}>{s.shopName}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* ── Search + filters ── */}
      <View style={[styles.filterBar, { borderBottomColor: colors.border }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.placeholder} />
          <TextInput
            style={[styles.searchInput, { color: colors.heading }]}
            value={search}
            onChangeText={setSearch}
            placeholder="Cari produk..."
            placeholderTextColor={colors.placeholder}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Feather name="x" size={16} color={colors.placeholder} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Status filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusScroll} contentContainerStyle={styles.statusContent}>
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.statusChip,
                {
                  backgroundColor: active ? colors.primary : colors.surface2,
                  borderColor: active ? colors.primary : 'transparent',
                },
              ]}
              onPress={() => setStatusFilter(f.key)}
            >
              <Text style={[styles.statusChipText, { color: active ? '#fff' : colors.textSecondary }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Table header (desktop only) ── */}
      {isDesktop && (
        <View style={[styles.tableHeader, { backgroundColor: colors.surface2, borderBottomColor: colors.border }]}>
          <Text style={[styles.tableHeaderCell, { color: colors.placeholder, flex: 1 }]}>PRODUK</Text>
          <Text style={[styles.tableHeaderCell, { color: colors.placeholder, width: 120 }]}>HARGA</Text>
          <Text style={[styles.tableHeaderCell, { color: colors.placeholder, width: 80 }]}>STOK</Text>
          <View style={{ width: 20 }} />
        </View>
      )}

      {/* ── List ── */}
      {!activeShopId ? (
        <EmptyState icon="shopping-bag" title="Pilih Toko" subtitle="Pilih toko dari tab Toko untuk melihat produk." />
      ) : isLoading ? (
        <View style={styles.skeletonList}>
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} width="100%" height={isDesktop ? 56 : 88} borderRadius={isDesktop ? 0 : 16} />
          ))}
        </View>
      ) : (
        <FlashList
          data={filtered}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          estimatedItemSize={isDesktop ? 56 : 96}
          contentContainerStyle={isDesktop ? styles.tableList : styles.cardList}
          ListEmptyComponent={
            <EmptyState
              icon="package"
              title="Tidak ada produk"
              subtitle={search ? `Tidak ditemukan hasil untuk "${search}"` : 'Sync dulu untuk memuat produk.'}
            />
          }
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
        />
      )}

      {/* ── Bulk action bar ── */}
      {isSelectMode && selectedProducts.length > 0 && (
        <View style={[styles.bulkBar, { backgroundColor: colors.cardBg, borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.bulkBtn, { backgroundColor: `${colors.primary}18`, borderColor: `${colors.primary}30` }]}
            onPress={() => navigation.navigate('BulkStockUpdate')}
          >
            <Feather name="layers" size={16} color={colors.primary} />
            <Text style={[styles.bulkBtnText, { color: colors.primary }]}>Stok</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.bulkBtn, { backgroundColor: `${colors.warning}18`, borderColor: `${colors.warning}30` }]}
            onPress={() => navigation.navigate('BulkPriceUpdate')}
          >
            <Feather name="tag" size={16} color={colors.warning} />
            <Text style={[styles.bulkBtnText, { color: colors.warning }]}>Harga</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },

  // Top bar
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  topBarLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  topBarTitle: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
  totalBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  totalBadgeText: { fontSize: 12, fontWeight: '600' },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  selectCount: { fontSize: 14, fontWeight: '700' },
  actionChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  actionChipText: { fontSize: 13, fontWeight: '600' },
  syncBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  syncBtnText: { fontSize: 13, fontWeight: '600' },
  spinning: {},

  // Shop tabs
  shopScroll: { maxHeight: 44 },
  shopScrollContent: { paddingHorizontal: 16, gap: 8, paddingVertical: 6 },
  shopTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100, borderWidth: 1 },
  shopTabDot: { width: 7, height: 7, borderRadius: 4 },
  shopTabText: { fontSize: 12, fontWeight: '600' },

  // Search & filter
  filterBar: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, height: 42, borderRadius: 12, borderWidth: 1 },
  searchInput: { flex: 1, fontSize: 14 },
  statusScroll: { maxHeight: 44 },
  statusContent: { paddingHorizontal: 16, gap: 8, paddingVertical: 7 },
  statusChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 100, borderWidth: 1 },
  statusChipText: { fontSize: 13, fontWeight: '600' },

  // Desktop table
  tableHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  tableHeaderCell: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  tableRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  tableCheck: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  tableImage: { width: 40, height: 40, borderRadius: 8 },
  tableName: { fontSize: 14, fontWeight: '600' },
  tablePrice: { fontSize: 13, fontWeight: '700', width: 120 },
  tableList: { paddingBottom: 20 },

  // Mobile cards
  productCard: {
    flexDirection: 'row', gap: 12, padding: 12, margin: 8,
    marginBottom: 0, borderRadius: 16, borderWidth: 1,
    alignItems: 'center',
  },
  selectCircle: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  productImage: { width: 64, height: 64, borderRadius: 12 },
  productInfo: { flex: 1, gap: 6 },
  productInfoTop: { gap: 4 },
  productName: { fontSize: 14, fontWeight: '600', lineHeight: 20 },
  platformBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  platformBadgeText: { fontSize: 11, fontWeight: '700' },
  productMeta: { gap: 4 },
  productPrice: { fontSize: 13, fontWeight: '700' },
  productStats: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stockBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  stockDot: { width: 5, height: 5, borderRadius: 3 },
  stockText: { fontSize: 11, fontWeight: '600' },
  variantCount: { fontSize: 11 },
  cardList: { padding: 8, paddingBottom: 100 },
  skeletonList: { padding: 16, gap: 10 },

  // Bulk bar
  bulkBar: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 28, borderTopWidth: 1 },
  bulkBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48, borderRadius: 14, borderWidth: 1 },
  bulkBtnText: { fontSize: 15, fontWeight: '700' },
});
