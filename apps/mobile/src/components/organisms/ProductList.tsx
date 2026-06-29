import React, { useCallback } from 'react';
import { View, StyleSheet, RefreshControl } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { ProductCard } from '@/components/molecules/ProductCard';
import { Skeleton } from '@/components/atoms/Skeleton';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Colors } from '@/constants';
import type { ProductSummary, Platform } from '@/types';

interface ProductListProps {
  products: ProductSummary[];
  platform?: Platform;
  isLoading: boolean;
  isRefreshing: boolean;
  onRefresh: () => void;
  onEndReached?: () => void;
  onProductPress: (product: ProductSummary) => void;
  onProductLongPress?: (product: ProductSummary) => void;
  isSelectMode?: boolean;
  isSelected?: (id: string) => boolean;
  ListHeaderComponent?: React.ReactElement;
}

function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <Skeleton width={64} height={64} borderRadius={10} />
      <View style={styles.skeletonLines}>
        <Skeleton width="70%" height={14} />
        <Skeleton width="40%" height={12} />
        <View style={styles.skeletonRow}>
          <Skeleton width={60} height={20} borderRadius={9999} />
          <Skeleton width={60} height={20} borderRadius={9999} />
        </View>
      </View>
    </View>
  );
}

export function ProductList({
  products,
  platform = 'SHOPEE',
  isLoading,
  isRefreshing,
  onRefresh,
  onEndReached,
  onProductPress,
  onProductLongPress,
  isSelectMode,
  isSelected,
  ListHeaderComponent,
}: ProductListProps) {
  const renderItem = useCallback(
    ({ item }: { item: ProductSummary }) => (
      <ProductCard
        product={item}
        platform={platform}
        isSelectMode={isSelectMode}
        isSelected={isSelected ? isSelected(item.id) : false}
        onPress={() => onProductPress(item)}
        onLongPress={onProductLongPress ? () => onProductLongPress(item) : undefined}
      />
    ),
    [onProductPress, onProductLongPress, isSelectMode, isSelected, platform],
  );

  const keyExtractor = useCallback((item: ProductSummary) => item.platformProductId, []);

  if (isLoading) {
    return (
      <View style={styles.skeletonContainer}>
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </View>
    );
  }

  return (
    <FlashList
      data={products}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      estimatedItemSize={88}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.3}
      contentContainerStyle={styles.list}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        <EmptyState
          icon="package"
          title="Belum Ada Produk"
          subtitle="Sambungkan toko dan sinkronkan produk untuk memulai."
        />
      }
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: 32 },
  skeletonContainer: { padding: 16, gap: 12 },
  skeletonCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
  },
  skeletonLines: { flex: 1, gap: 8, justifyContent: 'center' },
  skeletonRow: { flexDirection: 'row', gap: 8 },
});
