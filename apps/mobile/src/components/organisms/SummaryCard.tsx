import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface StatItem {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string | number;
  color?: string;
}

interface SummaryCardProps {
  title: string;
  stats: StatItem[];
}

export function SummaryCard({ title, stats }: SummaryCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.grid}>
        {stats.map((stat) => (
          <View key={stat.label} style={styles.statItem}>
            <View style={[styles.iconBox, { backgroundColor: stat.color ? `${stat.color}22` : Colors.primaryLight }]}>
              <Feather name={stat.icon} size={16} color={stat.color ?? Colors.primary} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBg,
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  title: { fontSize: 15, fontWeight: '700', color: Colors.heading },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statItem: { flex: 1, minWidth: 80, alignItems: 'center', gap: 6 },
  iconBox: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  statValue: { fontSize: 18, fontWeight: '800', color: Colors.heading },
  statLabel: { fontSize: 11, color: Colors.textSecondary, textAlign: 'center' },
});
