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
import { Colors } from '@/constants';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useAuthStore } from '@/stores/authStore';
import { useShopStore } from '@/stores/shopStore';
import { shopsApi } from '@/api/shops';
import { bulkApi } from '@/api/index';
import type { RootStackParamList } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
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

  const statItems = [
    { icon: 'shopping-bag' as const, label: 'Toko Aktif', value: shops.filter((s) => s.status === 'ACTIVE').length, color: Colors.primary },
    { icon: 'package' as const, label: 'Total Produk', value: shops.reduce((sum, s) => sum + (s.productCount ?? 0), 0) },
    { icon: 'alert-triangle' as const, label: 'Token Expired', value: shops.filter((s) => s.status === 'TOKEN_EXPIRED').length, color: Colors.warning },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Halo, {user?.name?.split(' ')[0] ?? 'Seller'}!</Text>
            <Text style={styles.subGreeting}>Selamat datang di LookUp</Text>
          </View>
          <TouchableOpacity
            style={styles.shopsBtn}
            onPress={() => navigation.navigate('ConnectShop')}
          >
            <Feather name="plus" size={18} color={Colors.primary} />
          </TouchableOpacity>
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
          <Text style={styles.sectionTitle}>Aksi Cepat</Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('BulkStockUpdate')}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.primaryLight }]}>
                <Feather name="layers" size={20} color={Colors.primary} />
              </View>
              <Text style={styles.actionLabel}>Update Stok Massal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('BulkPriceUpdate')}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.successLight }]}>
                <Feather name="tag" size={20} color={Colors.success} />
              </View>
              <Text style={styles.actionLabel}>Update Harga Massal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('ConnectShop')}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.infoLight }]}>
                <Feather name="link" size={20} color={Colors.info} />
              </View>
              <Text style={styles.actionLabel}>Hubungkan Toko</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Jobs */}
        {recentJobs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Aktivitas Terakhir</Text>
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
  safe: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 16, gap: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 22, fontWeight: '800', color: Colors.heading },
  subGreeting: { fontSize: 14, color: Colors.textSecondary, marginTop: 2 },
  shopsBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  shopChips: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.heading },
  actions: { flexDirection: 'row', gap: 12 },
  actionCard: {
    flex: 1,
    backgroundColor: Colors.cardBg,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '600', color: Colors.textPrimary, textAlign: 'center' },
  jobs: { gap: 10 },
});
