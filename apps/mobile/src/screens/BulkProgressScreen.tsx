// src/screens/BulkProgressScreen.tsx
// TODO: Implement per docs/UI_DESIGN.md — BulkProgressScreen
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants';

export function BulkProgressScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.center}>
        <Text style={styles.title}>BulkProgressScreen</Text>
        <Text style={styles.sub}>Implementasi sesuai roadmap. Lihat docs/UI_DESIGN.md</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 20, fontWeight: '700', color: Colors.heading, marginBottom: 8 },
  sub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});
