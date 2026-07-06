// src/screens/RegisterScreen.tsx — Redesigned dark-first register
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

export function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { setAuth } = useAuthStore();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web' && width >= 640;

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password) {
      setError('Semua field wajib diisi.');
      return;
    }
    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }
    if (password !== confirm) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await authApi.register({ name: name.trim(), email: email.trim(), password });
      await setAuth(result.user, result.accessToken, result.refreshToken);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      setError(msg ?? 'Gagal membuat akun. Coba lagi.');
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
      <View style={styles.brandRow}>
        <LogoCube size={42} color={colors.primary} />
        <Text style={[styles.brandName, { color: colors.heading }]}>LookUp</Text>
      </View>

      <View style={styles.headingBlock}>
        <Text style={[styles.title, { color: colors.heading }]}>Buat Akun</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Kelola Shopee & TikTok Shop dalam satu dashboard
        </Text>
      </View>

      {!!error && (
        <View style={[styles.errorBox, { backgroundColor: colors.dangerLight }]}>
          <Feather name="alert-circle" size={15} color={colors.danger} />
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
        </View>
      )}

      <View style={styles.fields}>
        <InputField
          icon="user" label="Nama Lengkap" value={name}
          onChange={setName} placeholder="John Doe"
          colors={colors} disabled={loading}
        />
        <InputField
          icon="mail" label="Email" value={email}
          onChange={setEmail} placeholder="nama@email.com"
          keyboardType="email-address" autoCapitalize="none"
          colors={colors} disabled={loading}
        />
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
        <InputField
          icon="check" label="Konfirmasi Password" value={confirm}
          onChange={setConfirm} placeholder="Ulangi password"
          secureTextEntry colors={colors} disabled={loading}
        />
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, { backgroundColor: loading ? colors.primaryDark : colors.primary }]}
        onPress={handleRegister}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <Text style={styles.submitBtnText}>Membuat akun...</Text>
          : <>
              <Text style={styles.submitBtnText}>Buat Akun</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </>
        }
      </TouchableOpacity>

      <Text style={[styles.terms, { color: colors.placeholder }]}>
        Dengan mendaftar kamu menyetujui syarat & ketentuan LookUp.
      </Text>

      <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.switchLink}>
        <Text style={[styles.switchText, { color: colors.textSecondary }]}>
          Sudah punya akun?{' '}
          <Text style={[styles.switchAction, { color: colors.primary }]}>Masuk</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (isWeb) {
    return (
      <View style={[styles.webRoot, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.webScroll}>
          <View style={styles.webCenter}>{formCard}</View>
        </ScrollView>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          {formCard}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InputField({
  icon, label, value, onChange, placeholder, keyboardType, autoCapitalize,
  secureTextEntry, colors, disabled,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string; value: string;
  onChange: (t: string) => void;
  placeholder?: string;
  keyboardType?: any;
  autoCapitalize?: any;
  secureTextEntry?: boolean;
  colors: any;
  disabled?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
      <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <Feather name={icon} size={16} color={colors.placeholder} style={styles.inputIcon} />
        <TextInput
          style={[styles.input, { color: colors.heading, flex: 1 }]}
          value={value}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={colors.placeholder}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? 'words'}
          secureTextEntry={secureTextEntry}
          editable={!disabled}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  webRoot: { flex: 1, minHeight: '100%' as any },
  webScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 24, paddingVertical: 48 },
  webCenter: { width: '100%', maxWidth: 480 },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  formCard: { gap: 20 },
  formCardWeb: { borderWidth: 1, borderRadius: 24, padding: 40 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandName: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  headingBlock: { gap: 6 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.3 },
  subtitle: { fontSize: 15, lineHeight: 22 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10 },
  errorText: { fontSize: 13, fontWeight: '500', flex: 1 },
  fields: { gap: 14 },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', letterSpacing: 0.2 },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 12, borderWidth: 1, height: 50,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 10 },
  input: { fontSize: 15, height: '100%' as any },
  eyeBtn: { padding: 4 },
  submitBtn: {
    height: 52, borderRadius: 14,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, marginTop: 4,
  },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  terms: { fontSize: 12, textAlign: 'center', lineHeight: 18 },
  switchLink: { alignItems: 'center' },
  switchText: { fontSize: 14, textAlign: 'center' },
  switchAction: { fontWeight: '700' },
});
