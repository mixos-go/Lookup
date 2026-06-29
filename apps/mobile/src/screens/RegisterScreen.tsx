// src/screens/RegisterScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants';

export function RegisterScreen() {
  // TODO: Phase 1 — implement full register form per UI_DESIGN.md
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Daftar</Text>
        <Text style={styles.sub}>Implementasi Phase 1 — lihat docs/UI_DESIGN.md</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.heading, marginBottom: 8 },
  sub: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
});
