// src/screens/ProfileScreen.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator, Platform } from 'react-native';
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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/types';

const THEME_OPTIONS: Array<{ value: 'light' | 'dark' | 'system'; label: string; icon: React.ComponentProps<typeof Feather>['name'] }> = [
  { value: 'light', label: 'Terang', icon: 'sun' },
  { value: 'dark', label: 'Gelap', icon: 'moon' },
  { value: 'system', label: 'Sistem', icon: 'smartphone' },
];

type Nav = NativeStackNavigationProp<RootStackParamList>;

export function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const { colors, mode, setMode } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const resetShops = useShopStore((s) => s.reset);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const performLogout = async () => {
    setIsLoggingOut(true);
    try {
      // Best-effort server-side revoke — local logout must succeed either way,
      // since the refresh token is short-lived and the user explicitly asked to leave.
      try {
        const refreshToken = await getStoredRefreshToken();
        if (refreshToken) await authApi.logout(refreshToken);
      } catch {
        // ignore — local session clear below is what actually matters
      }
      
      // Clear all caches and state
      queryClient.clear();
      resetShops();
      await logout();
      
      // Reset navigation to Login screen
      // This ensures the navigation stack is properly reset on both mobile and web
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      
      // For web: sometimes the navigation reset doesn't work properly due to React Navigation web limitations
      // So we add a fallback to reload the page on web after a short delay
      if (Platform.OS === 'web') {
        setTimeout(() => {
          // Check if we're still on the Profile screen (navigation didn't work)
          // If so, force a full page reload
          if (window.location.pathname.includes('profile') || window.location.pathname === '/') {
            window.location.href = '/login';
          }
        }, 500);
      }
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, we should still try to navigate to login
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
      
      // For web, force reload if navigation fails
      if (Platform.OS === 'web') {
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
      }
    } finally {
      setIsLoggingOut(false);
    }
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
          <Text style={[styles.name, { color: colors.heading }]}>{user?.name ?? '\u2014'}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email ?? '\u2014'}</Text>
        </View>

        {/* Account info rows */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Info Akun</Text>
          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <InfoRow icon="user" label="Nama" value={user?.name ?? '\u2014'} />
            <Divider />
            <InfoRow icon="mail" label="Email" value={user?.email ?? '\u2014'} />
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
          <Button 
            label="Keluar" 
            variant="danger" 
            fullWidth 
            onPress={handleLogoutPress} 
            loading={isLoggingOut}
          />
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
