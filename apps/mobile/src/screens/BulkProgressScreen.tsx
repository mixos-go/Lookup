import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { ProgressBar } from '@/components/molecules/ProgressBar';
import { Badge } from '@/components/atoms/Badge';
import { useTheme } from '@/hooks/useTheme';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useBulkStore } from '@/stores/bulkStore';
import { bulkApi } from '@/api/index';
import type { RootStackParamList } from '@/types';
import { formatPercent } from '@/utils/format';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'BulkProgress'>;

const STATUS_LABEL: Record<string, string> = {
  QUEUED: 'Menunggu...',
  PROCESSING: 'Memproses...',
  COMPLETED: 'Selesai',
  PARTIAL: 'Sebagian Gagal',
  FAILED: 'Gagal',
};

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  QUEUED: 'neutral',
  PROCESSING: 'info',
  COMPLETED: 'success',
  PARTIAL: 'warning',
  FAILED: 'danger',
};

const DONE_STATUSES = ['COMPLETED', 'PARTIAL', 'FAILED'];

export function BulkProgressScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const { jobId, type } = route.params;
  const queryClient = useQueryClient();
  const setActiveJobId = useBulkStore((s) => s.setActiveJobId);

  const isDoneRef = React.useRef(false);

  const { data: job } = useQuery({
    queryKey: QUERY_KEYS.bulkJobStatus(jobId),
    queryFn: () => bulkApi.getStatus(jobId),
    refetchInterval: (query) => {
      const status = query.state.data?.status as string | undefined;
      if (status && DONE_STATUSES.includes(status)) return false;
      return 2000;
    },
    staleTime: 0,
  });

  useEffect(() => {
    if (job?.status && DONE_STATUSES.includes(job.status as string) && !isDoneRef.current) {
      isDoneRef.current = true;
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['bulk-history'] });
      setActiveJobId(null);
    }
  }, [job?.status, queryClient, setActiveJobId]);

  const status = String(job?.status ?? 'QUEUED');
  const progress = job ? formatPercent(job.progress ?? 0, 100) : 0;
  const isDone = DONE_STATUSES.includes(status);
  const typeLabel = type === 'STOCK' ? 'Update Stok' : 'Update Harga';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>
        {/* Icon */}
        <View style={[styles.iconBox, { backgroundColor: isDone && status === 'COMPLETED' ? colors.success : colors.primary }]}>
          <Feather
            name={
              status === 'COMPLETED' ? 'check' :
              status === 'FAILED' ? 'x' :
              status === 'PARTIAL' ? 'alert-triangle' :
              'loader'
            }
            size={40}
            color={colors.white}
          />
        </View>

        <Text style={[styles.title, { color: colors.heading }]}>{typeLabel}</Text>
        <Badge label={STATUS_LABEL[status] ?? status} variant={STATUS_VARIANT[status] ?? 'neutral'} />

        {/* Progress */}
        <View style={styles.progressSection}>
          <ProgressBar progress={job?.progress ?? 0} failed={status === 'FAILED'} />
          <View style={styles.progressStats}>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>{job?.progress ?? 0}% selesai</Text>
            <Text style={[styles.progressText, { color: colors.textSecondary }]}>
              {job?.successCount ?? 0}/{job?.total ?? 0} berhasil
            </Text>
          </View>
        </View>

        {/* Error Summary */}
        {(job?.failedCount ?? 0) > 0 && (
          <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
            <Feather name="alert-circle" size={16} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{job?.failedCount} item gagal diupdate</Text>
          </View>
        )}

        {/* Done Actions */}
        {isDone && (
          <View style={styles.doneActions}>
            <TouchableOpacity
              style={[styles.doneBtn, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('MainTabs')}
            >
              <Text style={[styles.doneBtnLabel, { color: colors.white }]}>Kembali ke Beranda</Text>
            </TouchableOpacity>
          </View>
        )}

        {!isDone && (
          <Text style={[styles.waitHint, { color: colors.textSecondary }]}>
            Jangan tutup aplikasi. Proses berjalan di background.
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 20,
  },
  iconBox: {
    width: 100, height: 100, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  title: { fontSize: 22, fontWeight: '800' },
  progressSection: { width: '100%', gap: 8 },
  progressStats: { flexDirection: 'row', justifyContent: 'space-between' },
  progressText: { fontSize: 13 },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 10, padding: 12, width: '100%',
  },
  errorText: { fontSize: 13 },
  doneActions: { width: '100%' },
  doneBtn: {
    borderRadius: 12, height: 50,
    alignItems: 'center', justifyContent: 'center',
  },
  doneBtnLabel: { fontSize: 15, fontWeight: '700' },
  waitHint: { fontSize: 13, textAlign: 'center' },
});
