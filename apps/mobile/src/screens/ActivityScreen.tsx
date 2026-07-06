// src/screens/ActivityScreen.tsx — Redesigned activity timeline
import React from 'react';
import {
  View, Text, StyleSheet, RefreshControl, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { Feather } from '@expo/vector-icons';
import { Skeleton } from '@/components/atoms/Skeleton';
import { EmptyState } from '@/components/molecules/EmptyState';
import { useTheme } from '@/hooks/useTheme';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useShopStore } from '@/stores/shopStore';
import { bulkApi } from '@/api/index';
import type { BulkJobSummary } from '@/types';

const JOB_STATUS_CONFIG: Record<string, { label: string; color: (c: any) => string; icon: React.ComponentProps<typeof Feather>['name'] }> = {
  COMPLETED: { label: 'Selesai',    color: (c) => c.primary, icon: 'check-circle' },
  PARTIAL:   { label: 'Sebagian',   color: (c) => c.warning, icon: 'alert-circle' },
  FAILED:    { label: 'Gagal',      color: (c) => c.danger,  icon: 'x-circle'     },
  PROCESSING:{ label: 'Diproses',   color: (c) => c.info,    icon: 'loader'        },
  QUEUED:    { label: 'Menunggu',   color: (c) => c.placeholder, icon: 'clock'    },
};

const JOB_TYPE_LABEL: Record<string, string> = {
  STOCK: 'Update Stok',
  PRICE: 'Update Harga',
};

function JobCard({ job }: { job: BulkJobSummary }) {
  const { colors } = useTheme();
  const cfg = JOB_STATUS_CONFIG[job.status] ?? JOB_STATUS_CONFIG.QUEUED;
  const color = cfg.color(colors);
  const typeLabel = JOB_TYPE_LABEL[job.type] ?? job.type;
  const successRate = job.total > 0 ? Math.round((job.successCount / job.total) * 100) : 0;
  const createdAt = new Date(job.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });

  return (
    <View style={[styles.jobCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      {/* Left accent */}
      <View style={[styles.jobAccent, { backgroundColor: color }]} />

      <View style={[styles.jobIconWrap, { backgroundColor: `${color}18` }]}>
        <Feather name={cfg.icon} size={20} color={color} />
      </View>

      <View style={styles.jobContent}>
        <View style={styles.jobHeader}>
          <Text style={[styles.jobType, { color: colors.heading }]}>{typeLabel}</Text>
          <View style={[styles.jobStatusBadge, { backgroundColor: `${color}18` }]}>
            <Text style={[styles.jobStatusText, { color }]}>{cfg.label}</Text>
          </View>
        </View>

        <View style={styles.jobMeta}>
          <Text style={[styles.jobMetaText, { color: colors.textSecondary }]}>
            <Text style={{ color: colors.primary, fontWeight: '700' }}>{job.successCount}</Text>
            /{job.total} produk berhasil
          </Text>
          {job.failedCount > 0 && (
            <Text style={[styles.jobFailText, { color: colors.danger }]}>
              {job.failedCount} gagal
            </Text>
          )}
        </View>

        {/* Progress bar */}
        <View style={[styles.progressTrack, { backgroundColor: colors.surface2 }]}>
          <View style={[
            styles.progressFill,
            { backgroundColor: color, width: `${successRate}%` as any },
          ]} />
        </View>

        <Text style={[styles.jobTime, { color: colors.placeholder }]}>{createdAt}</Text>
      </View>
    </View>
  );
}

function SkeletonCard() {
  const { colors } = useTheme();
  return (
    <View style={[styles.jobCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      <View style={[styles.jobAccent, { backgroundColor: colors.border }]} />
      <Skeleton width={44} height={44} borderRadius={12} />
      <View style={{ flex: 1, gap: 8 }}>
        <Skeleton width="60%" height={14} />
        <Skeleton width="80%" height={10} />
        <Skeleton width="100%" height={4} />
      </View>
    </View>
  );
}

export function ActivityScreen() {
  const { colors } = useTheme();
  const { activeShopId } = useShopStore();

  const { data, isLoading, refetch, isRefetching } = useQuery<BulkJobSummary[]>({
    queryKey: QUERY_KEYS.bulkHistory(activeShopId ?? undefined),
    queryFn: () => bulkApi.getHistory(activeShopId ?? undefined),
    staleTime: 15_000,
  });

  const jobs = data ?? [];
  const completedCount = jobs.filter((j) => j.status === 'COMPLETED').length;
  const failedCount = jobs.filter((j) => j.status === 'FAILED' || j.status === 'PARTIAL').length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.heading }]}>Aktivitas</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Riwayat bulk update stok & harga
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}
          onPress={() => refetch()}
        >
          <Feather name="refresh-cw" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Stats strip */}
      {!isLoading && jobs.length > 0 && (
        <View style={[styles.statsStrip, { backgroundColor: colors.surface2, borderBottomColor: colors.border }]}>
          <View style={styles.stripStat}>
            <View style={[styles.stripDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.stripText, { color: colors.textSecondary }]}>
              Selesai: <Text style={{ color: colors.heading, fontWeight: '700' }}>{completedCount}</Text>
            </Text>
          </View>
          <View style={[styles.stripDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stripStat}>
            <View style={[styles.stripDot, { backgroundColor: colors.danger }]} />
            <Text style={[styles.stripText, { color: colors.textSecondary }]}>
              Gagal/Sebagian: <Text style={{ color: colors.heading, fontWeight: '700' }}>{failedCount}</Text>
            </Text>
          </View>
          <View style={[styles.stripDivider, { backgroundColor: colors.border }]} />
          <View style={styles.stripStat}>
            <Text style={[styles.stripText, { color: colors.textSecondary }]}>
              Total: <Text style={{ color: colors.heading, fontWeight: '700' }}>{jobs.length}</Text>
            </Text>
          </View>
        </View>
      )}

      {/* List */}
      {isLoading ? (
        <View style={styles.skeletonList}>
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      ) : (
        <FlashList
          data={jobs}
          renderItem={({ item }) => <JobCard job={item} />}
          keyExtractor={(item) => item.jobId}
          estimatedItemSize={120}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="clock"
              title="Belum Ada Aktivitas"
              subtitle="Riwayat update stok dan harga massal akan muncul di sini setelah kamu melakukan bulk update."
            />
          }
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 13, marginTop: 2 },
  refreshBtn: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },

  statsStrip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, gap: 12, borderBottomWidth: 1 },
  stripStat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stripDot: { width: 7, height: 7, borderRadius: 4 },
  stripText: { fontSize: 12 },
  stripDivider: { width: 1, height: 14 },

  list: { padding: 16, paddingBottom: 32 },
  skeletonList: { padding: 16, gap: 12 },

  jobCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    padding: 14, borderRadius: 16, borderWidth: 1,
    marginBottom: 10, overflow: 'hidden',
  },
  jobAccent: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  jobIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  jobContent: { flex: 1, gap: 6 },
  jobHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  jobType: { fontSize: 15, fontWeight: '700' },
  jobStatusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
  jobStatusText: { fontSize: 11, fontWeight: '700' },
  jobMeta: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  jobMetaText: { fontSize: 13 },
  jobFailText: { fontSize: 12, fontWeight: '600' },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  jobTime: { fontSize: 11 },
});
