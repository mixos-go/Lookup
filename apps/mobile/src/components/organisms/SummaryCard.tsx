import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface StatItem {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string | number;
  color?: string;
  tint?: string; // matching *Light background (e.g. colors.warningLight) — used for auto-tint when value > 0
}

interface SummaryCardProps {
  title: string;
  stats: StatItem[];
}

// Bento layout, not a row of equal cards: stats[0] is the most actionable
// metric and gets the large tile — that's where the eye should land first.
// See docs/UI_DESIGN.md "Bento Tiles (Dashboard Only)".
export function SummaryCard({ title, stats }: SummaryCardProps) {
  const { colors } = useTheme();
  const [priority, ...rest] = stats;

  const isActive = typeof priority?.value === 'number' && priority.value > 0 && !!priority.tint;

  return (
    <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.heading }]}>{title}</Text>
      <View style={styles.grid}>
        {priority && (
          <View
            style={[
              styles.priorityTile,
              { backgroundColor: isActive ? priority.tint : colors.background, borderColor: colors.border },
            ]}
          >
            <View style={[styles.iconBox, { backgroundColor: priority.color ? `${priority.color}22` : colors.primaryLight }]}>
              <Feather name={priority.icon} size={18} color={priority.color ?? colors.primary} />
            </View>
            <Text style={[styles.priorityValue, { color: colors.heading }]}>{priority.value}</Text>
            <Text style={[styles.priorityLabel, { color: colors.textSecondary }]}>{priority.label}</Text>
          </View>
        )}

        <View style={styles.smallColumn}>
          {rest.map((stat) => (
            <View key={stat.label} style={[styles.smallTile, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Feather name={stat.icon} size={14} color={stat.color ?? colors.primary} />
              <Text style={[styles.smallValue, { color: colors.heading }]}>{stat.value}</Text>
              <Text style={[styles.smallLabel, { color: colors.textSecondary }]} numberOfLines={1}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    gap: 14,
    borderWidth: 1,
  },
  title: { fontSize: 15, fontWeight: '700' },
  grid: { flexDirection: 'row', gap: 12 },
  priorityTile: {
    flex: 1.4,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 6,
    justifyContent: 'center',
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  priorityValue: { fontSize: 24, fontWeight: '800' },
  priorityLabel: { fontSize: 12, fontWeight: '600' },
  smallColumn: { flex: 1, gap: 8 },
  smallTile: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    padding: 10,
    gap: 3,
    justifyContent: 'center',
  },
  smallValue: { fontSize: 16, fontWeight: '700' },
  smallLabel: { fontSize: 10, fontWeight: '600' },
});
