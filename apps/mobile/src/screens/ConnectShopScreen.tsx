import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { shopsApi } from '@/api/shops';

export function ConnectShopScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [loading, setLoading] = useState<'SHOPEE' | 'TIKTOK' | null>(null);

  const handleConnect = async (platform: 'SHOPEE' | 'TIKTOK') => {
    setLoading(platform);
    try {
      const result = platform === 'SHOPEE'
        ? await shopsApi.getShopeeAuthUrl()
        : await shopsApi.getTikTokAuthUrl();

      const supported = await Linking.canOpenURL(result.url);
      if (supported) {
        await Linking.openURL(result.url);
      } else {
        Alert.alert('Error', 'Tidak dapat membuka browser. Pastikan browser terpasang.');
      }
    } catch {
      Alert.alert('Error', 'Gagal mendapatkan URL otorisasi. Coba lagi.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['bottom']}>
      <View style={styles.container}>
        <View style={[styles.illustration, { backgroundColor: colors.primaryLight }]}>
          <Feather name="link" size={56} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.heading }]}>Hubungkan Toko</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sambungkan akun marketplace-mu untuk mulai mengelola stok dan harga dari satu tempat.
        </Text>

        <View style={styles.platforms}>
          <TouchableOpacity
            style={[styles.platformCard, { borderColor: colors.shopee, backgroundColor: colors.shopeeLight }]}
            onPress={() => handleConnect('SHOPEE')}
            disabled={loading !== null}
          >
            <View style={[styles.platformIcon, { backgroundColor: colors.shopeeLight }]}>
              <Feather name="shopping-bag" size={24} color={colors.shopee} />
            </View>
            <View style={styles.platformInfo}>
              <Text style={[styles.platformName, { color: colors.shopee }]}>Shopee</Text>
              <Text style={[styles.platformDesc, { color: colors.textSecondary }]}>Sambungkan toko Shopee-mu</Text>
            </View>
            {loading === 'SHOPEE' ? (
              <Feather name="loader" size={18} color={colors.shopee} />
            ) : (
              <Feather name="chevron-right" size={18} color={colors.shopee} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.platformCard, { borderColor: colors.tiktokPink, backgroundColor: colors.tiktokLight }]}
            onPress={() => handleConnect('TIKTOK')}
            disabled={loading !== null}
          >
            <View style={[styles.platformIcon, { backgroundColor: colors.tiktokLight }]}>
              <Feather name="video" size={24} color={colors.tiktokPink} />
            </View>
            <View style={styles.platformInfo}>
              <Text style={[styles.platformName, { color: colors.tiktokPink }]}>TikTok Shop</Text>
              <Text style={[styles.platformDesc, { color: colors.textSecondary }]}>Sambungkan toko TikTok Shop-mu</Text>
            </View>
            {loading === 'TIKTOK' ? (
              <Feather name="loader" size={18} color={colors.tiktokPink} />
            ) : (
              <Feather name="chevron-right" size={18} color={colors.tiktokPink} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.note}>
          <Feather name="shield" size={14} color={colors.textSecondary} />
          <Text style={[styles.noteText, { color: colors.textSecondary }]}>
            LookUp menggunakan OAuth resmi. Kami tidak menyimpan kredensial loginmu.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 20 },
  illustration: {
    width: 100, height: 100, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  subtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  platforms: { gap: 12 },
  platformCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 16,
    borderWidth: 2,
  },
  platformIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  platformInfo: { flex: 1 },
  platformName: { fontSize: 16, fontWeight: '700' },
  platformDesc: { fontSize: 13, marginTop: 2 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8 },
  noteText: { flex: 1, fontSize: 12, lineHeight: 18 },
});
