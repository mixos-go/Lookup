// src/screens/BulkProgressScreen.tsx — Redesigned bulk progress
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp, RouteProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { ProgressBar } from '@/components/molecules/ProgressBar';
import { useTheme } from '@/hooks/useTheme';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useBulkStore } from '@/stores/bulkStore';
import { bulkApi } from '@/api/index';
import type { RootStackParamList } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'BulkProgress'>;

const STATUS_CONFIG: Record<string, {
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  getColor: (c: any) => string;
}> = {
  QUEUED:     { label: 'Menunggu antrian...',  icon: 'clock',          getColor: (c) => c.placeholder },
  PROCESSING: { label: 'Sedang memproses...',  icon: 'loader',         getColor: (c) => c.info         },
  COMPLETED:  { label: 'Semua berhasil!',      icon: 'check-circle',   getColor: (c) => c.primary      },
  PARTIAL:    { label: 'Sebagian gagal',        icon: 'alert-triangle', getColor: (c) => c.warning      },
  FAILED:     { label: 'Gagal diproses',        icon: 'x-circle',       getColor: (c) => c.danger       },
};

const DONE = ['COMPLETED', 'PARTIAL', 'FAILED'];

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
    refetchInterval: (q) => {
      const s = q.state.data?.status as string | undefined;
      return s && DONE.includes(s) ? false : 2000;
    },
    staleTime: 0,
  });

  useEffect(() => {
    if (job?.status && DONE.includes(job.status as string) && !isDoneRef.current) {
      isDoneRef.current = true;
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['bulk-history'] });
      setActiveJobId(null);
    }
  }, [job?.status, queryClient, setActiveJobId]);

  const status = String(job?.status ?? 'QUEUED');
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.QUEUED;
  const color = cfg.getColor(colors);
  const isDone = DONE.includes(status);
  const progress = job?.progress ?? 0;
  const typeLabel = type === 'STOCK' ? 'Update Stok Massal' : 'Update Harga Massal';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.container}>

        {/* Status icon */}
        <View style={[styles.iconRing, { borderColor: `${color}40` }]}>
          <View style={[styles.iconCore, { backgroundColor: `${color}18` }]}>
            <Feather name={cfg.icon} size={44} color={color} />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.heading }]}>{typeLabel}</Text>
        <Text style={[styles.statusLabel, { color }]}>{cfg.label}</Text>

        {/* Progress */}
        <View style={styles.progressWrap}>
          <View style={styles.progressLabels}>
            <Text style={[styles.progressPct, { color: colors.heading }]}>{progress}%</Text>
            <Text style={[styles.progressCount, { color: colors.textSecondary }]}>
              {job?.successCount ?? 0} / {job?.total ?? '—'} produk
            </Text>
          </View>
          <ProgressBar progress={progress} failed={status === 'FAILED'} />
        </View>

        {/* Stats (done only) */}
        {isDone && (
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: `${colors.primary}14`, borderColor: `${colors.primary}30` }]}>
              <Feather name="check" size={16} color={colors.primary} />
              <Text style={[styles.statVal, { color: colors.primary }]}>{job?.successCount ?? 0}</Text>
              <Text style={[styles.statLab, { color: colors.textSecondary }]}>Berhasil</Text>
            </View>
            {(job?.failedCount ?? 0) > 0 && (
              <View style={[styles.statBox, { backgroundColor: colors.dangerLight, borderColor: `${colors.danger}30` }]}>
                <Feather name="x" size={16} color={colors.danger} />
                <Text style={[styles.statVal, { color: colors.danger }]}>{job?.failedCount}</Text>
                <Text style={[styles.statLab, { color: colors.textSecondary }]}>Gagal</Text>
              </View>
            )}
          </View>
        )}

        {/* Error note */}
        {(job?.failedCount ?? 0) > 0 && isDone && (
          <View style={[styles.errorNote, { backgroundColor: colors.dangerLight, borderColor: `${colors.danger}30` }]}>
            <Feather name="alert-circle" size={15} color={colors.danger} />
            <Text style={[styles.errorNoteText, { color: colors.danger }]}>
              {job?.failedCount} item gagal. Coba update ulang secara manual untuk item tersebut.
            </Text>
          </View>
        )}

        {/* Done actions */}
        {isDone ? (
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => navigation.navigate('MainTabs')}
            >
              <Feather name="home" size={18} color="#fff" />
              <Text style={styles.primaryBtnText}>Kembali ke Beranda</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}
              onPress={() => navigation.navigate('MainTabs')}
            >
              <Text style={[styles.secondaryBtnText, { color: colors.textPrimary }]}>Lihat Riwayat</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.waitNote, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
            <Feather name="info" size={15} color={colors.textSecondary} />
            <Text style={[styles.waitNoteText, { color: colors.textSecondary }]}>
              Jangan tutup aplikasi. Proses berjalan di background server.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 20 },

  iconRing: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  iconCore: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center' },

  title: { fontSize: 22, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 },
  statusLabel: { fontSize: 15, fontWeight: '600', textAlign: 'center' },

  progressWrap: { width: '100%', gap: 10 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressPct: { fontSize: 28, fontWeight: '800' },
  progressCount: { fontSize: 14 },

  statsRow: { flexDirection: 'row', gap: 12, width: '100%' },
  statBox: { flex: 1, alignItems: 'center', gap: 4, padding: 16, borderRadius: 14, borderWidth: 1 },
  statVal: { fontSize: 28, fontWeight: '800' },
  statLab: { fontSize: 12 },

  errorNote: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, width: '100%' },
  errorNoteText: { flex: 1, fontSize: 13, lineHeight: 20 },

  actions: { width: '100%', gap: 10 },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 52, borderRadius: 14 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryBtn: { height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  secondaryBtnText: { fontSize: 14, fontWeight: '600' },

  waitNote: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, width: '100%' },
  waitNoteText: { flex: 1, fontSize: 13, lineHeight: 20 },
});
