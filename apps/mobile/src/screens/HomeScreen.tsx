import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { SummaryCard } from '@/components/organisms/SummaryCard';
import { JobStatusCard } from '@/components/molecules/JobStatusCard';
import { ShopTag } from '@/components/molecules/ShopTag';
import { Skeleton } from '@/components/atoms/Skeleton';
import { Avatar } from '@/components/atoms/Avatar';
import { useTheme } from '@/hooks/useTheme';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useAuthStore } from '@/stores/authStore';
import { useShopStore } from '@/stores/shopStore';
import { shopsApi } from '@/api/shops';
import { bulkApi } from '@/api/index';
import type { RootStackParamList } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const { setShops, shops, activeShopId } = useShopStore();

  const { isRefetching, refetch } = useQuery({
    queryKey: QUERY_KEYS.shops(),
    queryFn: async () => {
      const result = await shopsApi.list();
      setShops(result);
      return result;
    },
    staleTime: 60_000,
  });

  const { data: historyData } = useQuery({
    queryKey: QUERY_KEYS.bulkHistory(activeShopId ?? ''),
    queryFn: () => bulkApi.getHistory(activeShopId ?? undefined),
    enabled: !!activeShopId,
    staleTime: 15_000,
  });

  const recentJobs = (historyData ?? []).slice(0, 3);
  const activeShop = shops.find((s) => s.id === activeShopId);

  // Priority tile first: "Token Kedaluwarsa" is the most actionable metric
  // (a seller needs to reconnect that shop), so it gets the large bento tile
  // and auto-tints when its count > 0. The other two are informational and
  // stack as small tiles. See docs/UI_DESIGN.md "Bento Tiles (Dashboard Only)".
  const statItems = [
    {
      icon: 'alert-triangle' as const,
      label: 'Token Kedaluwarsa',
      value: shops.filter((s) => s.status === 'TOKEN_EXPIRED').length,
      color: colors.warning,
      tint: colors.warningLight,
    },
    {
      icon: 'shopping-bag' as const,
      label: 'Toko Aktif',
      value: shops.filter((s) => s.status === 'ACTIVE').length,
      color: colors.primary,
    },
    {
      icon: 'package' as const,
      label: 'Total Produk',
      value: shops.reduce((sum, s) => sum + (s.productCount ?? 0), 0),
    },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.heading }]}>Halo, {user?.name?.split(' ')[0] ?? 'Seller'}!</Text>
            <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>Selamat datang di LookUp</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Avatar name={user?.name} size="md" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.shopsBtn, { backgroundColor: colors.primaryLight }]}
              onPress={() => navigation.navigate('ConnectShop')}
            >
              <Feather name="plus" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Shop Chips */}
        {shops.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shopChips}>
            {shops.map((shop) => (
              <TouchableOpacity key={shop.id} onPress={() => {}}>
                <ShopTag shop={shop} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Summary */}
        <SummaryCard title="Ringkasan Toko" stats={statItems} />

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.heading }]}>Aksi Cepat</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
              onPress={() => navigation.navigate('BulkStockUpdate')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.primaryLight }]}>
                <Feather name="layers" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Update Stok Massal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
              onPress={() => navigation.navigate('BulkPriceUpdate')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.successLight }]}>
                <Feather name="tag" size={20} color={colors.success} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Update Harga Massal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
              onPress={() => navigation.navigate('ConnectShop')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.infoLight }]}>
                <Feather name="link" size={20} color={colors.info} />
              </View>
              <Text style={[styles.actionLabel, { color: colors.textPrimary }]}>Hubungkan Toko</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Jobs */}
        {recentJobs.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.heading }]}>Aktivitas Terakhir</Text>
            <View style={styles.jobs}>
              {recentJobs.map((job) => (
                <JobStatusCard key={job.jobId} job={job} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, gap: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  greeting: { fontSize: 22, fontWeight: '800' },
  subGreeting: { fontSize: 14, marginTop: 2 },
  shopsBtn: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  shopChips: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 12 },
  actionCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },
  jobs: { gap: 10 },
});
