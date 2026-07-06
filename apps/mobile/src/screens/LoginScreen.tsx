// src/screens/LoginScreen.tsx — Redesigned dark-first login
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ScrollView, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/stores/authStore';
import type { RootStackParamList } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function LogoCube({ size = 40, color = '#22C55E' }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: size * 0.72, height: size * 0.72,
        borderWidth: 2.5, borderColor: color,
        borderRadius: size * 0.14,
        transform: [{ rotate: '12deg' }],
        backgroundColor: `${color}1A`,
      }} />
    </View>
  );
}

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { setAuth } = useAuthStore();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web' && width >= 640;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Email dan password wajib diisi.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await authApi.login({ email: email.trim(), password });
      await setAuth(result.user, result.accessToken, result.refreshToken);
    } catch {
      setError('Email atau password salah. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const formCard = (
    <View style={[
      styles.formCard,
      { backgroundColor: isWeb ? colors.cardBg : 'transparent', borderColor: colors.border },
      isWeb && styles.formCardWeb,
    ]}>
      {/* Logo + brand */}
      <View style={styles.brandRow}>
        <LogoCube size={42} color={colors.primary} />
        <Text style={[styles.brandName, { color: colors.heading }]}>LookUp</Text>
      </View>

      <View style={styles.headingBlock}>
        <Text style={[styles.title, { color: colors.heading }]}>Selamat Datang</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Masuk untuk mengelola toko Shopee & TikTok kamu
        </Text>
      </View>

      {/* Error */}
      {!!error && (
        <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
          <Feather name="alert-circle" size={15} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        </View>
      )}

      {/* Fields */}
      <View style={styles.fields}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Feather name="mail" size={16} color={colors.placeholder} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.heading }]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="nama@email.com"
              placeholderTextColor={colors.placeholder}
              editable={!loading}
            />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
          <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Feather name="lock" size={16} color={colors.placeholder} style={styles.inputIcon} />
            <TextInput
              style={[styles.input, { color: colors.heading, flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              placeholder="Min. 8 karakter"
              placeholderTextColor={colors.placeholder}
              editable={!loading}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.placeholder} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, { backgroundColor: loading ? colors.primaryDark : colors.primary }]}
        onPress={handleLogin}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <Text style={styles.submitBtnText}>Masuk...</Text>
          : <>
              <Text style={styles.submitBtnText}>Masuk</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </>
        }
      </TouchableOpacity>

      {/* Divider + platform indicators */}
      <View style={styles.platformRow}>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.placeholder }]}>untuk Shopee & TikTok Shop</Text>
        <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
      </View>

      <View style={styles.platformBadges}>
        <View style={[styles.platformBadge, { backgroundColor: colors.shopeeLight }]}>
          <View style={[styles.platformDot, { backgroundColor: '#EE4D2D' }]} />
          <Text style={[styles.platformBadgeText, { color: '#EE4D2D' }]}>Shopee</Text>
        </View>
        <View style={[styles.platformBadge, { backgroundColor: colors.tiktokLight }]}>
          <View style={[styles.platformDot, { backgroundColor: colors.tiktokPink }]} />
          <Text style={[styles.platformBadgeText, { color: colors.tiktokPink }]}>TikTok Shop</Text>
        </View>
      </View>

      {/* Register link */}
      <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.switchLink}>
        <Text style={[styles.switchText, { color: colors.textSecondary }]}>
          Belum punya akun?{' '}
          <Text style={[styles.switchAction, { color: colors.primary }]}>Daftar sekarang</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (isWeb) {
    return (
      <View style={[styles.webRoot, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.webScroll}>
          <View style={styles.webCenter}>
            {formCard}
          </View>
        </ScrollView>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Back to landing */}
          <TouchableOpacity onPress={() => navigation.navigate('Landing')} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          {formCard}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  webRoot: { flex: 1, minHeight: '100%' as any },
  webScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  webCenter: { width: '100%', maxWidth: 480 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  formCard: { gap: 20 },
  formCardWeb: { borderWidth: 1, borderRadius: 24, padding: 40 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  brandName: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  headingBlock: { gap: 6 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10 },
  errorText: { fontSize: 13, fontWeight: '500', flex: 1 },
  fields: { gap: 16 },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, height: 50,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, height: '100%' as any },
  eyeBtn: { padding: 4 },
  submitBtn: {
    height: 52, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, marginTop: 4,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  platformRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 11, fontWeight: '500' },
  platformBadges: { flexDirection: 'row', justifyContent: 'center', gap: 10 },
  platformBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 100 },
  platformDot: { width: 7, height: 7, borderRadius: 4 },
  platformBadgeText: { fontSize: 13, fontWeight: '600' },
  switchLink: { alignItems: 'center', paddingTop: 4 },
  switchText: { fontSize: 14, textAlign: 'center' },
  switchAction: { fontWeight: '700' },
});
