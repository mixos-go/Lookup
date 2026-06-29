import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Linking, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants';
import { shopsApi } from '@/api/shops';

export function ConnectShopScreen() {
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
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.container}>
        <View style={styles.illustration}>
          <Feather name="link" size={56} color={Colors.primary} />
        </View>
        <Text style={styles.title}>Hubungkan Toko</Text>
        <Text style={styles.subtitle}>
          Sambungkan akun marketplace-mu untuk mulai mengelola stok dan harga dari satu tempat.
        </Text>

        <View style={styles.platforms}>
          <TouchableOpacity
            style={[styles.platformCard, styles.shopeeCard]}
            onPress={() => handleConnect('SHOPEE')}
            disabled={loading !== null}
          >
            <View style={[styles.platformIcon, { backgroundColor: Colors.shopeeLight }]}>
              <Feather name="shopping-bag" size={24} color={Colors.shopee} />
            </View>
            <View style={styles.platformInfo}>
              <Text style={[styles.platformName, { color: Colors.shopee }]}>Shopee</Text>
              <Text style={styles.platformDesc}>Sambungkan toko Shopee-mu</Text>
            </View>
            {loading === 'SHOPEE' ? (
              <Feather name="loader" size={18} color={Colors.shopee} />
            ) : (
              <Feather name="chevron-right" size={18} color={Colors.shopee} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.platformCard, styles.tiktokCard]}
            onPress={() => handleConnect('TIKTOK')}
            disabled={loading !== null}
          >
            <View style={[styles.platformIcon, { backgroundColor: Colors.tiktokLight }]}>
              <Feather name="video" size={24} color={Colors.tiktokPink} />
            </View>
            <View style={styles.platformInfo}>
              <Text style={[styles.platformName, { color: Colors.tiktokPink }]}>TikTok Shop</Text>
              <Text style={styles.platformDesc}>Sambungkan toko TikTok Shop-mu</Text>
            </View>
            {loading === 'TIKTOK' ? (
              <Feather name="loader" size={18} color={Colors.tiktokPink} />
            ) : (
              <Feather name="chevron-right" size={18} color={Colors.tiktokPink} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.note}>
          <Feather name="shield" size={14} color={Colors.textSecondary} />
          <Text style={styles.noteText}>
            LookUp menggunakan OAuth resmi. Kami tidak menyimpan kredensial loginmu.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: 24, justifyContent: 'center', gap: 20 },
  illustration: {
    width: 100, height: 100, borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center',
  },
  title: { fontSize: 24, fontWeight: '800', color: Colors.heading, textAlign: 'center' },
  subtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  platforms: { gap: 12 },
  platformCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 16, borderRadius: 16,
    borderWidth: 2,
  },
  shopeeCard: { borderColor: Colors.shopee, backgroundColor: Colors.shopeeLight },
  tiktokCard: { borderColor: Colors.tiktokPink, backgroundColor: Colors.tiktokLight },
  platformIcon: {
    width: 48, height: 48, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  platformInfo: { flex: 1 },
  platformName: { fontSize: 16, fontWeight: '700' },
  platformDesc: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8 },
  noteText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 18 },
});
