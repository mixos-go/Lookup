import React from 'react';
import {
  View, Text, TextInput, StyleSheet, TextInputProps,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';

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
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      {!!label && <Text style={[styles.label, { color: colors.textPrimary }]}>{label}</Text>}
      <View style={[
        styles.inputRow,
        { borderColor: colors.border, backgroundColor: colors.background },
        !!error && { borderColor: colors.danger },
      ]}>
        {!!prefix && <Text style={[styles.affix, { color: colors.textSecondary }]}>{prefix}</Text>}
        <TextInput
          style={[styles.input, { color: colors.heading }, style]}
          placeholderTextColor={colors.placeholder}
          {...rest}
        />
        {!!suffix && <Text style={[styles.affix, { color: colors.textSecondary }]}>{suffix}</Text>}
      </View>
      {!!error && <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>}
      {!error && !!helper && <Text style={[styles.helperText, { color: colors.textSecondary }]}>{helper}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 4 },
  label: { fontSize: 14, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 48,
  },
  input: { flex: 1, fontSize: 15 },
  affix: { fontSize: 15, marginHorizontal: 4 },
  errorText: { fontSize: 12 },
  helperText: { fontSize: 12 },
});
