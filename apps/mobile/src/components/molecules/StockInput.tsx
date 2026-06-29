import React, { useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

interface StockInputProps {
  value: number;
  onChange: (v: number) => void;
  label?: string;
  min?: number;
  max?: number;
}

export function StockInput({ value, onChange, label, min = 0, max = 999999 }: StockInputProps) {
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
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => onChange(clamp(value - 1))}
          onLongPress={() => startLongPress(-1)}
          onPressOut={stopLongPress}
        >
          <Feather name="minus" size={16} color={Colors.primary} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={String(value)}
          onChangeText={(t) => {
            const n = parseInt(t, 10);
            if (!isNaN(n)) onChange(clamp(n));
          }}
          keyboardType="numeric"
          textAlign="center"
        />

        <TouchableOpacity
          style={styles.btn}
          onPress={() => onChange(clamp(value + 1))}
          onLongPress={() => startLongPress(1)}
          onPressOut={stopLongPress}
        >
          <Feather name="plus" size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 4 },
  label: { fontSize: 13, color: Colors.textSecondary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    overflow: 'hidden',
  },
  btn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
  },
  input: {
    flex: 1,
    height: 40,
    fontSize: 16,
    fontWeight: '700',
    color: Colors.heading,
  },
});
