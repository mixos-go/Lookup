import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Badge } from '@/components/atoms/Badge';
import { ProgressBar } from '@/components/molecules/ProgressBar';
import { Colors } from '@/constants/colors';
import type { BulkJobSummary } from '@/types';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Baru saja';
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return `${Math.floor(hours / 24)} hari lalu`;
}

const STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  COMPLETED: 'success',
  PARTIAL: 'warning',
  FAILED: 'danger',
  PROCESSING: 'info',
  QUEUED: 'neutral',
};

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: 'Selesai',
  PARTIAL: 'Sebagian Gagal',
  FAILED: 'Gagal',
  PROCESSING: 'Memproses',
  QUEUED: 'Menunggu',
};

interface JobStatusCardProps {
  job: BulkJobSummary;
}

export function JobStatusCard({ job }: JobStatusCardProps) {
  const progress = job.total > 0 ? Math.round((job.successCount / job.total) * 100) : 0;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.typeRow}>
          <Feather
            name={job.type === 'STOCK' ? 'layers' : 'tag'}
            size={14}
            color={Colors.primary}
          />
          <Text style={styles.typeLabel}>
            {job.type === 'STOCK' ? 'Update Stok' : 'Update Harga'}
          </Text>
        </View>
        <Badge label={STATUS_LABEL[job.status] ?? job.status} variant={STATUS_VARIANT[job.status] ?? 'neutral'} />
      </View>

      <ProgressBar progress={progress} failed={job.status === 'FAILED'} />

      <View style={styles.stats}>
        <Text style={styles.statLabel}>
          <Text style={styles.statNum}>{job.successCount}</Text> berhasil
        </Text>
        {job.failedCount > 0 && (
          <Text style={[styles.statLabel, { color: Colors.danger }]}>
            <Text style={styles.statNum}>{job.failedCount}</Text> gagal
          </Text>
        )}
        <Text style={styles.time}>{timeAgo(job.createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  typeLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  stats: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statLabel: { fontSize: 13, color: Colors.textSecondary },
  statNum: { fontWeight: '700', color: Colors.textPrimary },
  time: { marginLeft: 'auto', fontSize: 12, color: Colors.placeholder },
});
