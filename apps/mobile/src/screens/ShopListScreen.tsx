// src/screens/ShopListScreen.tsx — Redesigned shop management
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { Feather } from '@expo/vector-icons';
import { Skeleton } from '@/components/atoms/Skeleton';
import { EmptyState } from '@/components/molecules/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useShopStore } from '@/stores/shopStore';
import { shopsApi } from '@/api/shops';
import type { RootStackParamList, Shop } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const PLATFORM_CONFIG = {
  SHOPEE:  { label: 'Shopee',     color: '#EE4D2D', icon: 'shopping-bag'  as const },
  TIKTOK:  { label: 'TikTok Shop',color: '#FE2C55', icon: 'video'         as const },
};

function ShopCard({ shop, isActive, onSelect }: { shop: Shop; isActive: boolean; onSelect: () => void }) {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const platform = PLATFORM_CONFIG[shop.platform];
  const isExpired = shop.status === 'TOKEN_EXPIRED';
  const isActive_ = shop.status === 'ACTIVE';

  const deleteMutation = useMutation({
    mutationFn: () => shopsApi.delete(shop.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shops() });
    },
  });

  const refreshMutation = useMutation({
    mutationFn: () => shopsApi.refreshToken(shop.id, shop.platform),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.shops() }),
  });

  const handleDelete = () => {
    Alert.alert(
      'Hapus Toko',
      `Yakin ingin menghapus toko "${shop.shopName}"? Data produk lokal akan ikut terhapus.`,
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => deleteMutation.mutate() },
      ],
    );
  };

  const lastSync = shop.lastSyncAt
    ? new Date(shop.lastSyncAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    : 'Belum pernah';

  return (
    <TouchableOpacity
      style={[
        styles.shopCard,
        { backgroundColor: colors.cardBg, borderColor: isActive ? colors.primary : colors.border },
        isActive && styles.shopCardActive,
      ]}
      onPress={onSelect}
      activeOpacity={0.85}
    >
      {/* Platform icon */}
      <View style={[styles.shopPlatformIcon, { backgroundColor: `${platform.color}18` }]}>
        <Feather name={platform.icon} size={24} color={platform.color} />
      </View>

      {/* Info */}
      <View style={styles.shopInfo}>
        <View style={styles.shopInfoRow}>
          <Text style={[styles.shopName, { color: colors.heading }]} numberOfLines={1}>{shop.shopName}</Text>
          {isActive && (
            <View style={[styles.shopActiveIndicator, { backgroundColor: `${colors.primary}18` }]}>
              <View style={[styles.shopActiveDot, { backgroundColor: colors.primary }]} />
            </View>
          )}
        </View>
        <Text style={[styles.shopPlatform, { color: platform.color }]}>{platform.label}</Text>

        {/* Status */}
        {isExpired ? (
          <View style={[styles.shopStatusBadge, { backgroundColor: colors.dangerLight }]}>
            <Feather name="alert-triangle" size={12} color={colors.danger} />
            <Text style={[styles.shopStatusText, { color: colors.danger }]}>Token Kedaluwarsa</Text>
          </View>
        ) : (
          <View style={[styles.shopStatusBadge, { backgroundColor: `${colors.primary}14` }]}>
            <View style={[styles.shopStatusDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.shopStatusText, { color: colors.primary }]}>Aktif</Text>
          </View>
        )}

        {/* Meta */}
        <View style={styles.shopMeta}>
          <View style={styles.shopMetaItem}>
            <Feather name="package" size={12} color={colors.placeholder} />
            <Text style={[styles.shopMetaText, { color: colors.textSecondary }]}>
              {shop.productCount ?? 0} produk
            </Text>
          </View>
          <View style={styles.shopMetaItem}>
            <Feather name="clock" size={12} color={colors.placeholder} />
            <Text style={[styles.shopMetaText, { color: colors.textSecondary }]}>
              Sync: {lastSync}
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.shopActions}>
        {isExpired && (
          <TouchableOpacity
            style={[styles.shopActionBtn, { backgroundColor: `${colors.warning}14` }]}
            onPress={() => navigation.navigate('ConnectShop')}
          >
            <Feather name="refresh-cw" size={14} color={colors.warning} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.shopActionBtn, { backgroundColor: colors.dangerLight }]}
          onPress={handleDelete}
          disabled={deleteMutation.isPending}
        >
          <Feather name="trash-2" size={14} color={colors.danger} />
        </TouchableOpacity>
      </View>

      {/* Active border indicator */}
      {isActive && (
        <View style={[styles.shopActiveBar, { backgroundColor: colors.primary }]} />
      )}
    </TouchableOpacity>
  );
}

export function ShopListScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { setShops, shops, activeShopId, setActiveShopId } = useShopStore();

  const { isLoading, refetch, isRefetching } = useQuery({
    queryKey: QUERY_KEYS.shops(),
    queryFn: async () => {
      const result = await shopsApi.list();
      setShops(result);
      return result;
    },
    staleTime: 60_000,
  });

  const shopeeCount = shops.filter((s) => s.platform === 'SHOPEE').length;
  const tiktokCount = shops.filter((s) => s.platform === 'TIKTOK').length;
  const expiredCount = shops.filter((s) => s.status === 'TOKEN_EXPIRED').length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>

      {/* Top bar */}
      <View style={[styles.topBar, { borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.heading }]}>Toko</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {shops.length} toko terhubung
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('ConnectShop')}
        >
          <Feather name="plus" size={18} color="#fff" />
          <Text style={styles.addBtnText}>Tambah</Text>
        </TouchableOpacity>
      </View>

      {/* Stats strip */}
      {shops.length > 0 && (
        <View style={[styles.statsStrip, { backgroundColor: colors.surface2, borderBottomColor: colors.border }]}>
          <View style={styles.stripStat}>
            <View style={[styles.stripDot, { backgroundColor: '#EE4D2D' }]} />
            <Text style={[styles.stripText, { color: colors.textSecondary }]}>Shopee: <Text style={{ color: colors.heading, fontWeight: '700' }}>{shopeeCount}</Text></Text>
          </View>
          <View style={[styles.stripDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stripStat}>
            <View style={[styles.stripDot, { backgroundColor: '#FE2C55' }]} />
            <Text style={[styles.stripText, { color: colors.textSecondary }]}>TikTok: <Text style={{ color: colors.heading, fontWeight: '700' }}>{tiktokCount}</Text></Text>
          </View>
          {expiredCount > 0 && (
            <>
              <View style={[styles.stripDivider, { backgroundColor: colors.border }]} />
              <View style={styles.stripStat}>
                <Feather name="alert-triangle" size={12} color={colors.danger} />
                <Text style={[styles.stripText, { color: colors.danger }]}>Expired: {expiredCount}</Text>
              </View>
            </>
          )}
        </View>
      )}

      {/* Expired alert banner */}
      {expiredCount > 0 && (
        <TouchableOpacity
          style={[styles.expiredBanner, { backgroundColor: colors.dangerLight, borderColor: `${colors.danger}30` }]}
          onPress={() => navigation.navigate('ConnectShop')}
        >
          <Feather name="alert-triangle" size={16} color={colors.danger} />
          <Text style={[styles.expiredBannerText, { color: colors.danger }]}>
            {expiredCount} toko perlu reconnect. Ketuk untuk hubungkan ulang.
          </Text>
          <Feather name="chevron-right" size={14} color={colors.danger} />
        </TouchableOpacity>
      )}

      {/* List */}
      {isLoading ? (
        <View style={styles.skeletonList}>
          {[0, 1].map((i) => <Skeleton key={i} width="100%" height={140} borderRadius={18} />)}
        </View>
      ) : (
        <FlashList
          data={shops}
          renderItem={({ item }) => (
            <ShopCard
              shop={item}
              isActive={item.id === activeShopId}
              onSelect={() => setActiveShopId(item.id)}
            />
          )}
          keyExtractor={(item) => item.id}
          estimatedItemSize={150}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <EmptyState
                icon="shopping-bag"
                title="Belum Ada Toko"
                subtitle="Hubungkan akun Shopee atau TikTok Shop kamu untuk mulai."
              />
              <TouchableOpacity
                style={[styles.emptyConnectBtn, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('ConnectShop')}
              >
                <Feather name="plus" size={18} color="#fff" />
                <Text style={styles.emptyConnectBtnText}>Hubungkan Toko</Text>
              </TouchableOpacity>
            </View>
          }
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 2 },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  statsStrip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12, borderBottomWidth: 1 },
  stripStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stripDot: { width: 7, height: 7, borderRadius: 4 },
  stripText: { fontSize: 13 },
  stripDivider: { width: 1, height: 14 },

  expiredBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 12, padding: 12,
    borderRadius: 12, borderWidth: 1,
  },
  expiredBannerText: { flex: 1, fontSize: 13, fontWeight: '500' },

  skeletonList: { padding: 16, gap: 12 },
  list: { padding: 16, paddingBottom: 32 },

  shopCard: {
    flexDirection: 'row', gap: 14, padding: 16,
    borderRadius: 18, borderWidth: 1, marginBottom: 12,
    alignItems: 'flex-start', overflow: 'hidden', position: 'relative',
  },
  shopCardActive: {},
  shopPlatformIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  shopInfo: { flex: 1, gap: 5 },
  shopInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  shopName: { fontSize: 16, fontWeight: '700', flex: 1 },
  shopActiveIndicator: { width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  shopActiveDot: { width: 8, height: 8, borderRadius: 4 },
  shopPlatform: { fontSize: 13, fontWeight: '600' },
  shopStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100 },
  shopStatusDot: { width: 5, height: 5, borderRadius: 3 },
  shopStatusText: { fontSize: 11, fontWeight: '700' },
  shopMeta: { flexDirection: 'row', gap: 12, marginTop: 4 },
  shopMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  shopMetaText: { fontSize: 11 },
  shopActions: { gap: 8 },
  shopActionBtn: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  shopActiveBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },

  emptyWrap: { padding: 24, alignItems: 'center', gap: 16 },
  emptyConnectBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14 },
  emptyConnectBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
