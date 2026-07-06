// src/screens/LandingScreen.tsx
// Mobile: full-screen bold hero. Web: bento-grid landing page.
import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
  useWindowDimensions, Animated, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import type { RootStackParamList } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const FEATURES = [
  { icon: 'refresh-cw' as const, title: 'Sinkron Otomatis', desc: 'Satu klik, produk Shopee & TikTok langsung ter-update.' },
  { icon: 'layers' as const, title: 'Bulk Update', desc: 'Update stok & harga ratusan produk dalam hitungan detik.' },
  { icon: 'image' as const, title: 'Kelola Gambar', desc: 'Upload & atur gambar produk langsung ke marketplace.' },
  { icon: 'activity' as const, title: 'Live Progress', desc: 'Pantau proses update secara real-time dengan SSE.' },
];

const STATS = [
  { value: '2', label: 'Platform' },
  { value: '100+', label: 'Produk sekaligus' },
  { value: '1', label: 'Aplikasi' },
];

// ─── Logo SVG-like component ──────────────────────────────────────────────────
function LogoCube({ size = 36, color = '#22C55E' }: { size?: number; color?: string }) {
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: size * 0.7, height: size * 0.7,
        borderWidth: 2.5, borderColor: color,
        borderRadius: size * 0.12,
        transform: [{ rotate: '12deg' }],
        backgroundColor: `${color}1A`,
      }} />
    </View>
  );
}

// ─── Platform pill ────────────────────────────────────────────────────────────
function PlatformPill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <Text style={[styles.pillText, { color }]}>{label}</Text>
    </View>
  );
}

// ─── Web landing (wide layout) ────────────────────────────────────────────────
function WebLanding() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const maxW = Math.min(width - 48, 1140);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} showsVerticalScrollIndicator={false}>
      {/* Nav */}
      <View style={[styles.webNav, { borderBottomColor: colors.border }]}>
        <View style={[styles.webNavInner, { maxWidth: maxW }]}>
          <View style={styles.webNavBrand}>
            <LogoCube size={32} color={colors.primary} />
            <Text style={[styles.webNavLogo, { color: colors.heading }]}>LookUp</Text>
          </View>
          <View style={styles.webNavActions}>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={[styles.webNavLink, { borderColor: colors.border }]}>
              <Text style={[styles.webNavLinkText, { color: colors.textPrimary }]}>Masuk</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} style={[styles.webSignupBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.webSignupBtnText}>Daftar Gratis</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={{ alignItems: 'center', paddingHorizontal: 24 }}>
        {/* Hero */}
        <View style={[styles.webHero, { maxWidth: maxW }]}>
          <View style={styles.webHeroLeft}>
            <View style={styles.webHeroBadge}>
              <View style={[styles.webHeroBadgeDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.webHeroBadgeText, { color: colors.textSecondary }]}>Third-party inventory manager</Text>
            </View>
            <Text style={[styles.webHeadline, { color: colors.heading }]}>
              {'Stop update\nmanual,\nmulai\nautomasi.'}
            </Text>
            <Text style={[styles.webSubtitle, { color: colors.textSecondary }]}>
              Kelola stok, harga, dan gambar produk Shopee & TikTok Shop dari satu dashboard. Update massal, sinkron realtime.
            </Text>
            <View style={styles.webPlatforms}>
              <PlatformPill label="Shopee" color="#EE4D2D" bg={colors.shopeeLight} />
              <PlatformPill label="TikTok Shop" color={colors.tiktokPink} bg={colors.tiktokLight} />
            </View>
            <View style={styles.webHeroCtas}>
              <TouchableOpacity
                style={[styles.webCtaPrimary, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.webCtaPrimaryText}>Mulai Gratis</Text>
                <Feather name="arrow-right" size={18} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.webCtaSecondary, { borderColor: colors.border }]}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={[styles.webCtaSecondaryText, { color: colors.textPrimary }]}>Sudah punya akun</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Hero bento cards */}
          <View style={styles.webHeroRight}>
            <View style={[styles.webBentoCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <View style={[styles.webBentoAlert, { backgroundColor: colors.primary + '18' }]}>
                <Feather name="check-circle" size={20} color={colors.primary} />
                <Text style={[styles.webBentoAlertText, { color: colors.primary }]}>Semua toko aktif</Text>
              </View>
              <Text style={[styles.webBentoTitle, { color: colors.heading }]}>Dashboard</Text>
              <View style={styles.webBentoStats}>
                {STATS.map((s, i) => (
                  <View key={i} style={styles.webBentoStat}>
                    <Text style={[styles.webBentoStatVal, { color: colors.primary }]}>{s.value}</Text>
                    <Text style={[styles.webBentoStatLabel, { color: colors.textSecondary }]}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.webBentoRow}>
              <View style={[styles.webBentoSmall, { backgroundColor: colors.shopeeLight, borderColor: colors.border, flex: 1 }]}>
                <View style={[styles.webBentoIcon, { backgroundColor: '#EE4D2D' }]}>
                  <Feather name="shopping-bag" size={16} color="#fff" />
                </View>
                <Text style={[styles.webBentoSmallTitle, { color: '#EE4D2D' }]}>Shopee</Text>
                <Text style={[styles.webBentoSmallSub, { color: colors.textSecondary }]}>Terhubung</Text>
              </View>
              <View style={[styles.webBentoSmall, { backgroundColor: colors.tiktokLight, borderColor: colors.border, flex: 1 }]}>
                <View style={[styles.webBentoIcon, { backgroundColor: colors.tiktokPink }]}>
                  <Feather name="video" size={16} color="#fff" />
                </View>
                <Text style={[styles.webBentoSmallTitle, { color: colors.tiktokPink }]}>TikTok</Text>
                <Text style={[styles.webBentoSmallSub, { color: colors.textSecondary }]}>Terhubung</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Features grid */}
        <View style={[styles.webFeatures, { maxWidth: maxW }]}>
          <Text style={[styles.webSectionTitle, { color: colors.heading }]}>Semua fitur yang kamu butuhkan</Text>
          <View style={styles.webFeatureGrid}>
            {FEATURES.map((f, i) => (
              <View key={i} style={[styles.webFeatureCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <View style={[styles.webFeatureIcon, { backgroundColor: colors.primary + '18' }]}>
                  <Feather name={f.icon} size={22} color={colors.primary} />
                </View>
                <Text style={[styles.webFeatureTitle, { color: colors.heading }]}>{f.title}</Text>
                <Text style={[styles.webFeatureDesc, { color: colors.textSecondary }]}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA bottom */}
        <View style={[styles.webCTABottom, { maxWidth: maxW, backgroundColor: colors.cardBg, borderColor: colors.border }]}>
          <Text style={[styles.webCTABottomTitle, { color: colors.heading }]}>Siap automasi toko kamu?</Text>
          <Text style={[styles.webCTABottomSub, { color: colors.textSecondary }]}>Gratis. Tidak perlu kartu kredit.</Text>
          <TouchableOpacity
            style={[styles.webCtaPrimary, { backgroundColor: colors.primary, marginTop: 24, alignSelf: 'center' }]}
            onPress={() => navigation.navigate('Register')}
          >
            <Text style={styles.webCtaPrimaryText}>Mulai Sekarang</Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={{ paddingVertical: 32 }}>
          <Text style={[styles.webFooter, { color: colors.placeholder }]}>© 2025 LookUp · Open source · Self-hostable</Text>
        </View>
      </View>
    </ScrollView>
  );
}

// ─── Mobile landing (full-screen bold hero) ───────────────────────────────────
export function LandingScreen() {
  const { width } = useWindowDimensions();
  if (Platform.OS === 'web' && width >= 768) return <WebLanding />;

  return <MobileLanding />;
}

function MobileLanding() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(32)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 60, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={[styles.mobileSafe, { backgroundColor: colors.background }]}>
      {/* Background grid dots */}
      <View style={styles.mobileDotsOverlay} pointerEvents="none" />

      <Animated.View style={[styles.mobileContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

        {/* Logo */}
        <View style={styles.mobileLogo}>
          <LogoCube size={52} color={colors.primary} />
          <Text style={[styles.mobileLogoText, { color: colors.heading }]}>LookUp</Text>
        </View>

        {/* Headline */}
        <Text style={[styles.mobileHeadline, { color: colors.heading }]}>
          {'Kelola Shopee &\nTikTok Shop\ndalam Satu\nGenggaman.'}
        </Text>
        <Text style={[styles.mobileSubtitle, { color: colors.textSecondary }]}>
          Update stok, harga, dan gambar produk ke dua platform sekaligus. Otomatis, cepat, akurat.
        </Text>

        {/* Platform pills */}
        <View style={styles.mobilePlatforms}>
          <PlatformPill label="Shopee" color="#EE4D2D" bg={colors.shopeeLight} />
          <PlatformPill label="TikTok Shop" color={colors.tiktokPink} bg={colors.tiktokLight} />
        </View>
      </Animated.View>

      {/* CTA buttons */}
      <View style={styles.mobileCtas}>
        <TouchableOpacity
          style={[styles.mobilePrimaryBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.85}
        >
          <Text style={styles.mobilePrimaryBtnText}>Mulai Gratis</Text>
          <Feather name="arrow-right" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mobileSecondaryBtn, { borderColor: colors.border, backgroundColor: colors.cardBg }]}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.8}
        >
          <Text style={[styles.mobileSecondaryBtnText, { color: colors.textPrimary }]}>Sudah punya akun? Masuk</Text>
        </TouchableOpacity>

        <Text style={[styles.mobileDisclaimer, { color: colors.placeholder }]}>
          Gratis · Open source · Self-hostable
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Mobile
  mobileSafe: { flex: 1, justifyContent: 'space-between' },
  mobileDotsOverlay: { ...StyleSheet.absoluteFillObject },
  mobileContent: { flex: 1, justifyContent: 'center', paddingHorizontal: 28, gap: 20 },
  mobileLogo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mobileLogoText: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  mobileHeadline: { fontSize: 36, fontWeight: '800', lineHeight: 44, letterSpacing: -0.5, marginTop: 8 },
  mobileSubtitle: { fontSize: 16, lineHeight: 26 },
  mobilePlatforms: { flexDirection: 'row', gap: 10, marginTop: 4 },
  mobileCtas: { paddingHorizontal: 24, paddingBottom: 36, gap: 12 },
  mobilePrimaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, height: 56, borderRadius: 16,
  },
  mobilePrimaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  mobileSecondaryBtn: {
    height: 52, borderRadius: 14, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  mobileSecondaryBtnText: { fontSize: 15, fontWeight: '600' },
  mobileDisclaimer: { textAlign: 'center', fontSize: 12, marginTop: 4 },

  // Shared
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  pillDot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontSize: 13, fontWeight: '600' },

  // Web Nav
  webNav: {
    paddingVertical: 16, paddingHorizontal: 24,
    borderBottomWidth: 1, alignItems: 'center',
  },
  webNavInner: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  webNavBrand: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  webNavLogo: { fontSize: 20, fontWeight: '800' },
  webNavActions: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  webNavLink: { paddingHorizontal: 18, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  webNavLinkText: { fontSize: 14, fontWeight: '600' },
  webSignupBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10 },
  webSignupBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Web Hero
  webHero: { width: '100%', flexDirection: 'row', gap: 48, paddingVertical: 72, alignItems: 'flex-start' },
  webHeroLeft: { flex: 1, gap: 20 },
  webHeroBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start' },
  webHeroBadgeDot: { width: 8, height: 8, borderRadius: 4 },
  webHeroBadgeText: { fontSize: 13, fontWeight: '500' },
  webHeadline: { fontSize: 56, fontWeight: '800', lineHeight: 64, letterSpacing: -1.5 },
  webSubtitle: { fontSize: 18, lineHeight: 30, maxWidth: 460 },
  webPlatforms: { flexDirection: 'row', gap: 10 },
  webHeroCtas: { flexDirection: 'row', gap: 12, marginTop: 8 },
  webCtaPrimary: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 28, paddingVertical: 15, borderRadius: 14 },
  webCtaPrimaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  webCtaSecondary: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  webCtaSecondaryText: { fontSize: 15, fontWeight: '600' },
  webHeroRight: { width: 340, gap: 12 },
  webBentoCard: { borderRadius: 20, padding: 24, borderWidth: 1, gap: 16 },
  webBentoAlert: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, alignSelf: 'flex-start' },
  webBentoAlertText: { fontSize: 13, fontWeight: '600' },
  webBentoTitle: { fontSize: 22, fontWeight: '800' },
  webBentoStats: { flexDirection: 'row', gap: 24 },
  webBentoStat: { gap: 2 },
  webBentoStatVal: { fontSize: 28, fontWeight: '800' },
  webBentoStatLabel: { fontSize: 12 },
  webBentoRow: { flexDirection: 'row', gap: 12 },
  webBentoSmall: { borderRadius: 16, padding: 18, borderWidth: 1, gap: 8 },
  webBentoIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  webBentoSmallTitle: { fontSize: 15, fontWeight: '700' },
  webBentoSmallSub: { fontSize: 12 },

  // Web Features
  webFeatures: { width: '100%', paddingVertical: 60, gap: 40 },
  webSectionTitle: { fontSize: 36, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  webFeatureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  webFeatureCard: { width: '48%', borderRadius: 16, padding: 24, borderWidth: 1, gap: 14 },
  webFeatureIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  webFeatureTitle: { fontSize: 17, fontWeight: '700' },
  webFeatureDesc: { fontSize: 14, lineHeight: 22 },

  // Web CTA bottom
  webCTABottom: { width: '100%', borderRadius: 24, padding: 60, borderWidth: 1, alignItems: 'center', marginBottom: 40 },
  webCTABottomTitle: { fontSize: 36, fontWeight: '800', textAlign: 'center', letterSpacing: -0.5 },
  webCTABottomSub: { fontSize: 18, marginTop: 8 },
  webFooter: { fontSize: 13 },
});
