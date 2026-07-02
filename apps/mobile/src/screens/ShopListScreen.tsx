import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { Badge } from '@/components/atoms/Badge';
import { PlatformTag } from '@/components/atoms/PlatformTag';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Skeleton } from '@/components/atoms/Skeleton';
import { useTheme } from '@/hooks/useTheme';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useShopStore } from '@/stores/shopStore';
import { shopsApi } from '@/api/shops';
import type { RootStackParamList, Shop } from '@/types';
import { timeAgo } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger'> = {
  ACTIVE: 'success',
  TOKEN_EXPIRED: 'warning',
  DISCONNECTED: 'danger',
};

const STATUS_LABEL: Record<string, string> = {
  ACTIVE: 'Aktif',
  TOKEN_EXPIRED: 'Token Expired',
  DISCONNECTED: 'Terputus',
};

function ShopCard({ shop, onSync, onDisconnect, syncing }: {
  shop: Shop;
  onSync: () => void;
  onDisconnect: () => void;
  syncing: boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      <View style={styles.cardHeader}>
        <PlatformTag platform={shop.platform} />
        <Badge label={STATUS_LABEL[shop.status] ?? shop.status} variant={STATUS_VARIANT[shop.status] ?? 'neutral'} />
      </View>
      <Text style={[styles.shopName, { color: colors.heading }]}>{shop.shopName}</Text>
      <Text style={[styles.shopMeta, { color: colors.textSecondary }]}>
        {shop.productCount ?? 0} produk · Sinkron {shop.lastSyncAt ? timeAgo(shop.lastSyncAt) : 'belum pernah'}
      </Text>
      <View style={styles.cardActions}>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primaryLight }]} onPress={onSync} disabled={syncing}>
          <Feather name="refresh-cw" size={14} color={colors.primary} />
          <Text style={[styles.actionBtnLabel, { color: colors.primary }]}>{syncing ? 'Menyinkron...' : 'Sinkron'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.dangerLight }]} onPress={onDisconnect}>
          <Feather name="trash-2" size={14} color={colors.danger} />
          <Text style={[styles.actionBtnLabel, { color: colors.danger }]}>Putuskan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export function ShopListScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { setShops } = useShopStore();
  const queryClient = useQueryClient();

  const { data: shops = [], isLoading, refetch, isRefetching } = useQuery<Shop[]>({
    queryKey: QUERY_KEYS.shops(),
    queryFn: async () => {
      const result = await shopsApi.list();
      setShops(result);
      return result;
    },
    staleTime: 60_000,
  });

  const syncMutation = useMutation({
    mutationFn: (shopId: string) => shopsApi.sync(shopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shops() });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (shopId: string) => shopsApi.disconnect(shopId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shops() });
    },
  });

  const handleDisconnect = (shop: Shop) => {
    Alert.alert(
      'Putuskan Toko',
      `Yakin ingin memutuskan koneksi toko "${shop.shopName}"?`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Putuskan', style: 'destructive', onPress: () => disconnectMutation.mutate(shop.id) },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.heading }]}>Toko Saya</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('ConnectShop')}
        >
          <Feather name="plus" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.skeletonContainer}>
          {Array.from({ length: 3 }).map((_, i) => (
            <View key={i} style={[styles.skeletonCard, { backgroundColor: colors.cardBg }]}>
              <Skeleton width={80} height={22} borderRadius={9999} />
              <Skeleton width="60%" height={18} />
              <Skeleton width="80%" height={13} />
            </View>
          ))}
        </View>
      ) : shops.length === 0 ? (
        <EmptyState
          icon="shopping-bag"
          title="Belum Ada Toko"
          subtitle="Hubungkan toko Shopee atau TikTok Shop-mu untuk mulai mengelola produk."
          actionLabel="Hubungkan Toko"
          onAction={() => navigation.navigate('ConnectShop')}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
        >
          {shops.map((shop) => (
            <ShopCard
              key={shop.id}
              shop={shop}
              onSync={() => syncMutation.mutate(shop.id)}
              onDisconnect={() => handleDisconnect(shop)}
              syncing={syncMutation.isPending && syncMutation.variables === shop.id}
            />
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12,
  },
  title: { fontSize: 22, fontWeight: '800' },
  addBtn: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  list: { padding: 16, gap: 12 },
  card: {
    borderRadius: 14, padding: 16,
    gap: 8, borderWidth: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shopName: { fontSize: 16, fontWeight: '700' },
  shopMeta: { fontSize: 13 },
  cardActions: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 5, paddingVertical: 8, borderRadius: 8,
  },
  actionBtnLabel: { fontSize: 13, fontWeight: '600' },
  skeletonContainer: { padding: 16, gap: 12 },
  skeletonCard: { borderRadius: 14, padding: 16, gap: 10 },
});
