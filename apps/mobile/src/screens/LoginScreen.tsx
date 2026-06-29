// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button } from '@/components/atoms/Button';
import { Colors } from '@/constants';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import type { RootStackParamList } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email dan password wajib diisi.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await authApi.login({ email, password });
      await setAuth(result.user, result.accessToken, result.refreshToken);
    } catch (err: any) {
      setError('Email atau password salah.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          <View style={styles.logoArea}>
            <View style={styles.logoBox}>
              <Text style={styles.logoText}>SS</Text>
            </View>
            <Text style={styles.appName}>LookUp</Text>
            <Text style={styles.subtitle}>Kelola stok Shopee & TikTok dalam satu tempat.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="nama@email.com"
                placeholderTextColor={Colors.placeholder}
                editable={!loading}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Min. 8 karakter"
                  placeholderTextColor={Colors.placeholder}
                  editable={!loading}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Text style={styles.eyeText}>{showPassword ? 'Sembunyikan' : 'Lihat'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {!!error && <Text style={styles.errorText}>{error}</Text>}

            <Button label="Masuk" onPress={handleLogin} loading={loading} fullWidth />

            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.registerBtn}>
              <Text style={styles.registerText}>Belum punya akun? <Text style={styles.registerLink}>Daftar</Text></Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  flex: { flex: 1 },
  container: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  logoArea: { alignItems: 'center', marginBottom: 40 },
  logoBox: {
    width: 64, height: 64, borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: { fontSize: 24, fontWeight: '800', color: Colors.white },
  appName: { fontSize: 24, fontWeight: '800', color: Colors.heading, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center' },
  form: { gap: 16 },
  fieldGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  input: {
    height: 48, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: 14,
    fontSize: 15, color: Colors.heading,
    backgroundColor: Colors.background,
  },
  passwordWrapper: { position: 'relative' },
  passwordInput: { paddingRight: 80 },
  eyeBtn: { position: 'absolute', right: 14, top: 0, bottom: 0, justifyContent: 'center' },
  eyeText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  errorText: { fontSize: 13, color: Colors.danger, textAlign: 'center' },
  registerBtn: { alignItems: 'center', marginTop: 8 },
  registerText: { fontSize: 14, color: Colors.textSecondary },
  registerLink: { color: Colors.primary, fontWeight: '600' },
});
