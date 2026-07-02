// src/screens/ProfileScreen.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { Avatar } from '@/components/atoms/Avatar';
import { Button } from '@/components/atoms/Button';
import { Divider } from '@/components/atoms/Divider';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { useShopStore } from '@/stores/shopStore';
import { authApi } from '@/api/auth';
import { getStoredRefreshToken } from '@/api/client';

const THEME_OPTIONS: Array<{ value: 'light' | 'dark' | 'system'; label: string; icon: React.ComponentProps<typeof Feather>['name'] }> = [
  { value: 'light', label: 'Terang', icon: 'sun' },
  { value: 'dark', label: 'Gelap', icon: 'moon' },
  { value: 'system', label: 'Sistem', icon: 'smartphone' },
];

export function ProfileScreen() {
  const queryClient = useQueryClient();
  const { colors, mode, setMode } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const resetShops = useShopStore((s) => s.reset);

  const performLogout = async () => {
    // Best-effort server-side revoke — local logout must succeed either way,
    // since the refresh token is short-lived and the user explicitly asked to leave.
    try {
      const refreshToken = await getStoredRefreshToken();
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {
      // ignore — local session clear below is what actually matters
    }
    queryClient.clear();
    resetShops();
    await logout();
  };

  const handleLogoutPress = () => {
    Alert.alert(
      'Keluar',
      'Yakin ingin keluar dari akun ini?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: performLogout },
      ],
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Account summary */}
        <View style={styles.accountCard}>
          <Avatar name={user?.name} size="lg" />
          <Text style={[styles.name, { color: colors.heading }]}>{user?.name ?? '—'}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email ?? '—'}</Text>
        </View>

        {/* Account info rows */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Info Akun</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <InfoRow icon="user" label="Nama" value={user?.name ?? '—'} />
            <Divider />
            <InfoRow icon="mail" label="Email" value={user?.email ?? '—'} />
          </View>
        </View>

        {/* Appearance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Tampilan</Text>
          <View style={[styles.card, styles.themeRow, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            {THEME_OPTIONS.map((opt) => {
              const active = mode === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.themeOption,
                    active && { backgroundColor: colors.primaryLight },
                  ]}
                  onPress={() => setMode(opt.value)}
                >
                  <Feather name={opt.icon} size={18} color={active ? colors.primary : colors.textSecondary} />
                  <Text style={[styles.themeLabel, { color: active ? colors.primary : colors.textSecondary }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <Button label="Keluar" variant="danger" fullWidth onPress={handleLogoutPress} />
        </View>

        <Text style={[styles.version, { color: colors.placeholder }]}>LookUp v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.infoRow}>
      <View style={[styles.infoIcon, { backgroundColor: colors.inputBg }]}>
        <Feather name={icon} size={16} color={colors.textSecondary} />
      </View>
      <View style={styles.infoText}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, gap: 20 },
  accountCard: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 24,
  },
  name: { fontSize: 18, fontWeight: '700', marginTop: 8 },
  email: { fontSize: 14 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 },
  infoIcon: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  infoText: { flex: 1 },
  infoLabel: { fontSize: 12 },
  infoValue: { fontSize: 15, fontWeight: '500', marginTop: 2 },
  themeRow: { flexDirection: 'row', padding: 6, gap: 6 },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
  },
  themeLabel: { fontSize: 12, fontWeight: '600' },
  version: { textAlign: 'center', fontSize: 12, marginTop: 8 },
});
