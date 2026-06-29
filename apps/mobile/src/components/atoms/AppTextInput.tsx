import React from 'react';
import {
  View, Text, TextInput, StyleSheet, TextInputProps,
} from 'react-native';
import { Colors } from '@/constants/colors';

interface AppTextInputProps extends TextInputProps {
  label?: string;
  helper?: string;
  error?: string;
  prefix?: string;
  suffix?: string;
}

export function AppTextInput({
  label, helper, error, prefix, suffix, style, ...rest
}: AppTextInputProps) {
  return (
    <View style={styles.wrapper}>
      {!!label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputRow, !!error && styles.inputRowError]}>
        {!!prefix && <Text style={styles.affix}>{prefix}</Text>}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={Colors.placeholder}
          {...rest}
        />
        {!!suffix && <Text style={styles.affix}>{suffix}</Text>}
      </View>
      {!!error && <Text style={styles.errorText}>{error}</Text>}
      {!error && !!helper && <Text style={styles.helperText}>{helper}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 4 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    height: 48,
  },
  inputRowError: { borderColor: Colors.danger },
  input: { flex: 1, fontSize: 15, color: Colors.heading },
  affix: { fontSize: 15, color: Colors.textSecondary, marginHorizontal: 4 },
  errorText: { fontSize: 12, color: Colors.danger },
  helperText: { fontSize: 12, color: Colors.textSecondary },
});
