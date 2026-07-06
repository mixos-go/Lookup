// src/screens/ProfileScreen.tsx — Redesigned profile & settings
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView,
  Platform, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { useShopStore } from '@/stores/shopStore';
import { authApi } from '@/api/auth';
import { getStoredRefreshToken } from '@/api/client';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';

const THEME_OPTIONS: Array<{ value: 'light' | 'dark' | 'system'; label: string; icon: React.ComponentProps<typeof Feather>['name'] }> = [
  { value: 'dark',   label: 'Gelap',  icon: 'moon'       },
  { value: 'light',  label: 'Terang', icon: 'sun'        },
  { value: 'system', label: 'Sistem', icon: 'smartphone' },
];

type Nav = NativeStackNavigationProp<RootStackParamList>;

function SectionTitle({ label }: { label: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[profileStyles.sectionTitle, { color: colors.placeholder }]}>{label}</Text>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={[profileStyles.infoRow, { borderBottomColor: colors.border }]}>
      <View style={[profileStyles.infoIcon, { backgroundColor: colors.surface2 }]}>
        <Feather name={icon} size={16} color={colors.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[profileStyles.infoLabel, { color: colors.placeholder }]}>{label}</Text>
        <Text style={[profileStyles.infoValue, { color: colors.heading }]}>{value}</Text>
      </View>
    </View>
  );
}

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const { colors, mode, setMode } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const resetShops = useShopStore((s) => s.reset);
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 900;
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const initials = (user?.name ?? 'U').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      try {
        const rt = await getStoredRefreshToken();
        if (rt) await authApi.logout(rt);
      } catch {}
      queryClient.clear();
      resetShops();
      await logout();
      navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
      if (Platform.OS === 'web') {
        setTimeout(() => { window.location.href = '/'; }, 400);
      }
    } catch {
      navigation.reset({ index: 0, routes: [{ name: 'Landing' }] });
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Keluar', 'Yakin ingin keluar dari akun ini?', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Keluar', style: 'destructive', onPress: performLogout },
    ]);
  };

  return (
    <SafeAreaView style={[profileStyles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView contentContainerStyle={profileStyles.content} showsVerticalScrollIndicator={false}>

        {/* Avatar card */}
        <View style={[profileStyles.avatarCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={[profileStyles.avatar, { backgroundColor: `${colors.primary}22` }]}>
            <Text style={[profileStyles.avatarText, { color: colors.primary }]}>{initials}</Text>
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={[profileStyles.userName, { color: colors.heading }]}>{user?.name ?? '—'}</Text>
            <Text style={[profileStyles.userEmail, { color: colors.textSecondary }]}>{user?.email ?? '—'}</Text>
            <View style={[profileStyles.roleBadge, { backgroundColor: `${colors.primary}14` }]}>
              <Text style={[profileStyles.roleText, { color: colors.primary }]}>Seller</Text>
            </View>
          </View>
        </View>

        {/* Account info */}
        <SectionTitle label="INFO AKUN" />
        <View style={[profileStyles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <InfoRow icon="user" label="Nama" value={user?.name ?? '—'} />
          <InfoRow icon="mail" label="Email" value={user?.email ?? '—'} />
        </View>

        {/* Appearance */}
        <SectionTitle label="TAMPILAN" />
        <View style={[profileStyles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <View style={profileStyles.themeRow}>
            {THEME_OPTIONS.map((opt) => {
              const active = mode === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    profileStyles.themeOpt,
                    {
                      backgroundColor: active ? `${colors.primary}18` : colors.surface2,
                      borderColor: active ? colors.primary : 'transparent',
                    },
                  ]}
                  onPress={() => setMode(opt.value)}
                >
                  <Feather name={opt.icon} size={18} color={active ? colors.primary : colors.textSecondary} />
                  <Text style={[profileStyles.themeOptLabel, { color: active ? colors.primary : colors.textSecondary }]}>
                    {opt.label}
                  </Text>
                  {active && (
                    <View style={[profileStyles.themeCheck, { backgroundColor: colors.primary }]}>
                      <Feather name="check" size={10} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Platform connections quick link */}
        <SectionTitle label="TOKO & PLATFORM" />
        <TouchableOpacity
          style={[profileStyles.menuItem, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
          onPress={() => navigation.navigate('ConnectShop')}
        >
          <View style={[profileStyles.menuIcon, { backgroundColor: `${colors.primary}14` }]}>
            <Feather name="link-2" size={18} color={colors.primary} />
          </View>
          <Text style={[profileStyles.menuLabel, { color: colors.textPrimary }]}>Hubungkan Toko Baru</Text>
          <Feather name="chevron-right" size={16} color={colors.placeholder} />
        </TouchableOpacity>

        {/* Logout */}
        <SectionTitle label="AKUN" />
        <TouchableOpacity
          style={[profileStyles.logoutBtn, { backgroundColor: colors.dangerLight, borderColor: `${colors.danger}30` }]}
          onPress={handleLogout}
          disabled={isLoggingOut}
        >
          <Feather name="log-out" size={18} color={colors.danger} />
          <Text style={[profileStyles.logoutText, { color: colors.danger }]}>
            {isLoggingOut ? 'Keluar...' : 'Keluar dari Akun'}
          </Text>
        </TouchableOpacity>

        <Text style={[profileStyles.version, { color: colors.placeholder }]}>LookUp v1.0.0 · Open source</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const profileStyles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, gap: 10, paddingBottom: 40 },
  sectionTitle: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginTop: 10 },

  avatarCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 18, borderWidth: 1 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800' },
  userName: { fontSize: 16, fontWeight: '700' },
  userEmail: { fontSize: 13 },
  roleBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100, marginTop: 2 },
  roleText: { fontSize: 11, fontWeight: '700' },

  card: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1 },
  infoIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  infoLabel: { fontSize: 11, marginBottom: 2 },
  infoValue: { fontSize: 14, fontWeight: '500' },

  themeRow: { flexDirection: 'row', gap: 8, padding: 10 },
  themeOpt: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, position: 'relative' },
  themeOptLabel: { fontSize: 12, fontWeight: '600' },
  themeCheck: { position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  menuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, borderWidth: 1 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '500' },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 50, borderRadius: 14, borderWidth: 1 },
  logoutText: { fontSize: 15, fontWeight: '700' },
  version: { textAlign: 'center', fontSize: 12, marginTop: 8 },
});
