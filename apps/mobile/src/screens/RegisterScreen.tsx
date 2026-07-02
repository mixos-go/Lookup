import React, { useState } from 'react';
import {
  View, Text, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@/components/atoms/Button';
import { AppTextInput } from '@/components/atoms/AppTextInput';
import { useTheme } from '@/hooks/useTheme';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import type { RootStackParamList } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { setAuth } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Nama wajib diisi';
    if (!email.trim()) newErrors.email = 'Email wajib diisi';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email tidak valid';
    if (!password) newErrors.password = 'Password wajib diisi';
    else if (password.length < 8) newErrors.password = 'Minimal 8 karakter';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Password tidak cocok';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setApiError('');
    setLoading(true);
    try {
      const result = await authApi.register({ name, email, password });
      await setAuth(result.user, result.accessToken, result.refreshToken);
    } catch {
      setApiError('Registrasi gagal. Email mungkin sudah digunakan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.heading }]}>Buat Akun</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Mulai kelola toko Shopee & TikTok-mu</Text>
          </View>

          <View style={styles.form}>
            <AppTextInput
              label="Nama Lengkap"
              placeholder="Budi Santoso"
              value={name}
              onChangeText={setName}
              error={errors.name}
              autoCapitalize="words"
            />
            <AppTextInput
              label="Email"
              placeholder="nama@email.com"
              value={email}
              onChangeText={setEmail}
              error={errors.email}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <AppTextInput
              label="Password"
              placeholder="Min. 8 karakter"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              secureTextEntry
            />
            <AppTextInput
              label="Konfirmasi Password"
              placeholder="Ulangi password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              error={errors.confirmPassword}
              secureTextEntry
            />

            {!!apiError && <Text style={[styles.apiError, { color: colors.danger }]}>{apiError}</Text>}

            <Button label="Daftar" onPress={handleRegister} loading={loading} fullWidth />

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.loginLink}>
              <Text style={[styles.loginText, { color: colors.textSecondary }]}>
                Sudah punya akun? <Text style={[styles.loginHighlight, { color: colors.primary }]}>Masuk</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 24, gap: 32 },
  header: { marginTop: 24, gap: 8 },
  title: { fontSize: 28, fontWeight: '800' },
  subtitle: { fontSize: 14 },
  form: { gap: 14 },
  apiError: { fontSize: 13, textAlign: 'center' },
  loginLink: { alignItems: 'center', marginTop: 8 },
  loginText: { fontSize: 14 },
  loginHighlight: { fontWeight: '600' },
});
