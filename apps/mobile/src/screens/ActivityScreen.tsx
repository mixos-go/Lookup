import React from 'react';
import {
  View, Text, StyleSheet, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useQuery } from '@tanstack/react-query';
import { JobStatusCard } from '@/components/molecules/JobStatusCard';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Skeleton } from '@/components/atoms/Skeleton';
import { Colors } from '@/constants';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useShopStore } from '@/stores/shopStore';
import { bulkApi } from '@/api/index';
import type { BulkJobSummary } from '@/types';

function SkeletonJobCard() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonRow}>
        <Skeleton width={100} height={16} />
        <Skeleton width={70} height={22} borderRadius={9999} />
      </View>
      <Skeleton width="100%" height={6} borderRadius={3} />
      <View style={styles.skeletonRow}>
        <Skeleton width={80} height={14} />
        <Skeleton width={80} height={12} />
      </View>
    </View>
  );
}

export function ActivityScreen() {
  const { activeShopId } = useShopStore();

  const { data, isLoading, refetch, isRefetching } = useQuery<BulkJobSummary[]>({
    queryKey: QUERY_KEYS.bulkHistory(activeShopId ?? undefined),
    queryFn: () => bulkApi.getHistory(activeShopId ?? undefined),
    staleTime: 15_000,
  });

  const jobs = data ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Riwayat Aktivitas</Text>
      </View>

      {isLoading ? (
        <View style={styles.skeletonContainer}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonJobCard key={i} />
          ))}
        </View>
      ) : (
        <FlashList
          data={jobs}
          renderItem={({ item }) => <JobStatusCard job={item} />}
          keyExtractor={(item) => item.jobId}
          estimatedItemSize={110}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="clock"
              title="Belum Ada Aktivitas"
              subtitle="Riwayat update stok dan harga massal akan muncul di sini."
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 16, paddingVertical: 14 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.heading },
  list: { padding: 16, paddingTop: 0 },
  skeletonContainer: { padding: 16, gap: 10 },
  skeletonCard: {
    backgroundColor: Colors.cardBg, borderRadius: 12,
    padding: 14, gap: 10, borderWidth: 1, borderColor: Colors.border,
  },
  skeletonRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
