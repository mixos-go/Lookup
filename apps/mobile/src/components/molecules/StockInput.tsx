import React, { useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';

interface StockInputProps {
  value: number;
  onChange: (v: number) => void;
  label?: string;
  min?: number;
  max?: number;
}

export function StockInput({ value, onChange, label, min = 0, max = 999999 }: StockInputProps) {
  const { colors } = useTheme();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  const startLongPress = (delta: number) => {
    timerRef.current = setInterval(() => {
      onChange(clamp(value + delta * 10));
    }, 150);
  };

  const stopLongPress = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  return (
    <View style={styles.wrapper}>
      {!!label && <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>}
      <View style={[styles.row, { borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primaryLight }]}
          onPress={() => onChange(clamp(value - 1))}
          onLongPress={() => startLongPress(-1)}
          onPressOut={stopLongPress}
        >
          <Feather name="minus" size={16} color={colors.primary} />
        </TouchableOpacity>

        <TextInput
          style={[styles.input, { color: colors.heading }]}
          value={String(value)}
          onChangeText={(t) => {
            const n = parseInt(t, 10);
            if (!isNaN(n)) onChange(clamp(n));
          }}
          keyboardType="numeric"
          textAlign="center"
        />

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: colors.primaryLight }]}
          onPress={() => onChange(clamp(value + 1))}
          onLongPress={() => startLongPress(1)}
          onPressOut={stopLongPress}
        >
          <Feather name="plus" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 4 },
  label: { fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  btn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    fontWeight: '700',
  },
});
