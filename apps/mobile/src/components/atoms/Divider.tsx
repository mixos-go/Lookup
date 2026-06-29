import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

interface DividerProps {
  label?: string;
}

export function Divider({ label }: DividerProps) {
  if (!label) {
    return <View style={styles.line} />;
  }

  return (
    <View style={styles.withLabel}>
      <View style={styles.flex} />
      <Text style={styles.labelText}>{label}</Text>
      <View style={styles.flex} />
    </View>
  );
}

const styles = StyleSheet.create({
  line: { height: 1, backgroundColor: Colors.border },
  withLabel: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  flex: { flex: 1, height: 1, backgroundColor: Colors.border },
  labelText: { fontSize: 12, color: Colors.textSecondary },
});
