import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface DividerProps {
  label?: string;
}

export function Divider({ label }: DividerProps) {
  const { colors } = useTheme();

  if (!label) {
    return <View style={[styles.line, { backgroundColor: colors.border }]} />;
  }

  return (
    <View style={styles.withLabel}>
      <View style={[styles.flex, { backgroundColor: colors.border }]} />
      <Text style={[styles.labelText, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[styles.flex, { backgroundColor: colors.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  line: { height: 1 },
  withLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1, height: 1 },
  labelText: { fontSize: 12 },
});
