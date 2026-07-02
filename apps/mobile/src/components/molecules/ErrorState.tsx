import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Button } from '@/components/atoms/Button';
import { useTheme } from '@/hooks/useTheme';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message = 'Terjadi kesalahan. Coba lagi.', onRetry }: ErrorStateProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.dangerLight }]}>
      <View style={styles.iconBox}>
        <Feather name="alert-circle" size={32} color={colors.danger} />
      </View>
      <Text style={[styles.message, { color: colors.danger }]}>{message}</Text>
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
    borderRadius: 12,
    margin: 16,
  },
  iconBox: {},
  message: { fontSize: 14, textAlign: 'center' },
});
