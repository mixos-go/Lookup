import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/atoms/Button';
import { Colors } from '@/constants/colors';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Terjadi kesalahan. Coba lagi.', onRetry }: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Feather name="alert-circle" size={32} color={Colors.danger} />
      </View>
      <Text style={styles.message}>{message}</Text>
      {!!onRetry && <Button label="Coba Lagi" onPress={onRetry} variant="secondary" />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 12,
    backgroundColor: Colors.dangerLight,
    borderRadius: 12,
    margin: 16,
  },
  iconBox: {},
  message: { fontSize: 14, color: Colors.danger, textAlign: 'center' },
});
