// src/screens/ConnectShopScreen.tsx — Redesigned connect screen
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Linking, Alert, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { shopsApi } from '@/api/shops';

const STEPS = [
  { icon: 'link' as const, text: 'Ketuk platform yang ingin dihubungkan' },
  { icon: 'globe' as const, text: 'Login di browser yang terbuka' },
  { icon: 'check-circle' as const, text: 'Kembali ke app — toko otomatis terhubung' },
];

export function ConnectShopScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState<'SHOPEE' | 'TIKTOK' | null>(null);

  const handleConnect = async (platform: 'SHOPEE' | 'TIKTOK') => {
    setLoading(platform);
    try {
      const result = platform === 'SHOPEE'
        ? await shopsApi.getShopeeAuthUrl()
        : await shopsApi.getTikTokAuthUrl();

      if (Platform.OS === 'web') {
        window.open(result.url, '_blank');
      } else {
        const supported = await Linking.canOpenURL(result.url);
        if (supported) await Linking.openURL(result.url);
        else Alert.alert('Error', 'Tidak dapat membuka browser.');
      }
    } catch {
      Alert.alert('Gagal', 'Tidak dapat mendapatkan URL otorisasi. Periksa koneksi dan coba lagi.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={styles.container}>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={[styles.heroIcon, { backgroundColor: `${colors.primary}18` }]}>
            <Feather name="link-2" size={36} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.heading }]}>Hubungkan Toko</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Sambungkan akun marketplace via OAuth resmi — aman tanpa menyimpan password kamu.
          </Text>
        </View>

        {/* Steps */}
        <View style={[styles.stepsCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.stepsLabel, { color: colors.placeholder }]}>CARA KERJA</Text>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.step}>
              <View style={[styles.stepNum, { backgroundColor: `${colors.primary}18` }]}>
                <Text style={[styles.stepNumText, { color: colors.primary }]}>{i + 1}</Text>
              </View>
              <Feather name={step.icon} size={15} color={colors.textSecondary} />
              <Text style={[styles.stepText, { color: colors.textPrimary }]}>{step.text}</Text>
            </View>
          ))}
        </View>

        {/* Platform cards */}
        <View style={styles.platforms}>
          {/* Shopee */}
          <TouchableOpacity
            style={[styles.platformCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            onPress={() => handleConnect('SHOPEE')}
            disabled={loading !== null}
            activeOpacity={0.8}
          >
            <View style={[styles.platformIcon, { backgroundColor: 'rgba(238,77,45,0.12)' }]}>
              <Feather name="shopping-bag" size={28} color="#EE4D2D" />
            </View>
            <View style={styles.platformInfo}>
              <Text style={[styles.platformName, { color: colors.heading }]}>Shopee</Text>
              <Text style={[styles.platformDesc, { color: colors.textSecondary }]}>
                Stok, harga & gambar produk
              </Text>
            </View>
            <View style={[styles.platformChevron, { backgroundColor: '#EE4D2D' }]}>
              {loading === 'SHOPEE'
                ? <Feather name="loader" size={16} color="#fff" />
                : <Feather name="arrow-right" size={16} color="#fff" />
              }
            </View>
          </TouchableOpacity>

          {/* TikTok Shop */}
          <TouchableOpacity
            style={[styles.platformCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            onPress={() => handleConnect('TIKTOK')}
            disabled={loading !== null}
            activeOpacity={0.8}
          >
            <View style={[styles.platformIcon, { backgroundColor: 'rgba(254,44,85,0.12)' }]}>
              <Feather name="video" size={28} color="#FE2C55" />
            </View>
            <View style={styles.platformInfo}>
              <Text style={[styles.platformName, { color: colors.heading }]}>TikTok Shop</Text>
              <Text style={[styles.platformDesc, { color: colors.textSecondary }]}>
                Sinkron produk & update massal
              </Text>
            </View>
            <View style={[styles.platformChevron, { backgroundColor: '#FE2C55' }]}>
              {loading === 'TIKTOK'
                ? <Feather name="loader" size={16} color="#fff" />
                : <Feather name="arrow-right" size={16} color="#fff" />
              }
            </View>
          </TouchableOpacity>
        </View>

        {/* Security note */}
        <View style={[styles.securityNote, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
          <Feather name="shield" size={15} color={colors.primary} />
          <Text style={[styles.securityText, { color: colors.textSecondary }]}>
            LookUp menggunakan OAuth resmi Shopee & TikTok. Kami tidak pernah menyimpan username atau password akun marketplace kamu.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 20 },

  hero: { alignItems: 'center', gap: 12 },
  heroIcon: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', letterSpacing: -0.3 },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, maxWidth: 300 },

  stepsCard: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 12 },
  stepsLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginBottom: 2 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepNum: { width: 24, height: 24, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 12, fontWeight: '800' },
  stepText: { flex: 1, fontSize: 13, lineHeight: 20 },

  platforms: { gap: 12 },
  platformCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 18, borderWidth: 1,
  },
  platformIcon: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  platformInfo: { flex: 1 },
  platformName: { fontSize: 17, fontWeight: '700' },
  platformDesc: { fontSize: 12, marginTop: 2 },
  platformChevron: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },

  securityNote: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    padding: 14, borderRadius: 12, borderWidth: 1,
  },
  securityText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
