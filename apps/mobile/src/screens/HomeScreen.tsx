// src/screens/HomeScreen.tsx — Bento-grid dashboard redesign
import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Platform, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { JobStatusCard } from '@/components/molecules/JobStatusCard';
import { Skeleton } from '@/components/atoms/Skeleton';
import { useTheme } from '@/hooks/useTheme';
import { QUERY_KEYS } from '@/constants/queryKeys';
import { useAuthStore } from '@/stores/authStore';
import { useShopStore } from '@/stores/shopStore';
import { shopsApi } from '@/api/shops';
import { bulkApi } from '@/api/index';
import type { RootStackParamList, Shop } from '@/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const SIDEBAR_W = 248;
const DESKTOP_BP = 900;

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  icon, label, value, color, tint, large, onPress,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: number | string;
  color?: string;
  tint?: string;
  large?: boolean;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const bg = tint ?? colors.surface2;
  const ic = color ?? colors.textSecondary;

  return (
    <TouchableOpacity
      style={[
        styles.statCard,
        { backgroundColor: colors.cardBg, borderColor: colors.border },
        large && styles.statCardLarge,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Feather name={icon} size={large ? 22 : 18} color={ic} />
      </View>
      <Text style={[styles.statValue, { color: color ?? colors.heading }, large && styles.statValueLarge]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      {onPress && (
        <View style={styles.statArrow}>
          <Feather name="chevron-right" size={14} color={colors.placeholder} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Quick action button ──────────────────────────────────────────────────────
function QuickAction({
  icon, label, color, bg, onPress,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.quickAction, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: bg }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>{label}</Text>
      <Feather name="chevron-right" size={15} color={colors.placeholder} />
    </TouchableOpacity>
  );
}

// ─── Shop chip ────────────────────────────────────────────────────────────────
function ShopChip({ shop, active, onPress }: { shop: Shop; active: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const platformColor = shop.platform === 'SHOPEE' ? '#EE4D2D' : colors.tiktokPink;
  const isExpired = shop.status === 'TOKEN_EXPIRED';
  return (
    <TouchableOpacity
      style={[
        styles.shopChip,
        {
          backgroundColor: active ? `${colors.primary}18` : colors.surface2,
          borderColor: active ? colors.primary : colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.shopChipDot, { backgroundColor: isExpired ? colors.danger : platformColor }]} />
      <Text style={[styles.shopChipText, { color: active ? colors.primary : colors.textPrimary }]} numberOfLines={1}>
        {shop.shopName}
      </Text>
      {isExpired && <Feather name="alert-triangle" size={12} color={colors.danger} />}
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const { setShops, shops, activeShopId, setActiveShopId } = useShopStore();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= DESKTOP_BP;

  const { isRefetching, refetch, isLoading: shopsLoading } = useQuery({
    queryKey: QUERY_KEYS.shops(),
    queryFn: async () => {
      const result = await shopsApi.list();
      setShops(result);
      return result;
    },
    staleTime: 60_000,
  });

  const { data: historyData, isLoading: histLoading } = useQuery({
    queryKey: QUERY_KEYS.bulkHistory(activeShopId ?? ''),
    queryFn: () => bulkApi.getHistory(activeShopId ?? undefined),
    enabled: !!activeShopId,
    staleTime: 15_000,
  });

  const recentJobs = (historyData ?? []).slice(0, 3);
  const expiredShops = shops.filter((s) => s.status === 'TOKEN_EXPIRED');
  const activeShops = shops.filter((s) => s.status === 'ACTIVE');
  const totalProducts = shops.reduce((sum, s) => sum + (s.productCount ?? 0), 0);

  const firstName = user?.name?.split(' ')[0] ?? 'Seller';
  const initials = (user?.name ?? 'U').split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  const contentStyle = isDesktop
    ? [styles.content, { paddingLeft: SIDEBAR_W + 24 }]
    : styles.content;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={contentStyle}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: colors.heading }]}>
              Halo, {firstName} 👋
            </Text>
            <Text style={[styles.greetingDate, { color: colors.textSecondary }]}>
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('Profile')}
            style={[styles.avatarBtn, { backgroundColor: `${colors.primary}22` }]}
          >
            <Text style={[styles.avatarInitials, { color: colors.primary }]}>{initials}</Text>
          </TouchableOpacity>
        </View>

        {/* ── Expired token alert (highest priority) ── */}
        {expiredShops.length > 0 && (
          <TouchableOpacity
            style={[styles.alertCard, { backgroundColor: colors.dangerLight, borderColor: `${colors.danger}40` }]}
            onPress={() => navigation.navigate('ConnectShop')}
            activeOpacity={0.85}
          >
            <View style={[styles.alertIcon, { backgroundColor: `${colors.danger}20` }]}>
              <Feather name="alert-triangle" size={20} color={colors.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: colors.danger }]}>
                {expiredShops.length} Token Kedaluwarsa
              </Text>
              <Text style={[styles.alertSub, { color: colors.danger }]} numberOfLines={1}>
                {expiredShops.map((s) => s.shopName).join(', ')} · Ketuk untuk reconnect
              </Text>
            </View>
            <Feather name="chevron-right" size={18} color={colors.danger} />
          </TouchableOpacity>
        )}

        {/* ── Stat bento grid ── */}
        <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>RINGKASAN</Text>
        {shopsLoading ? (
          <View style={styles.bentoRow}>
            <Skeleton width="100%" height={96} borderRadius={16} />
          </View>
        ) : (
          <View style={styles.bentoGrid}>
            <StatCard
              icon="shopping-bag"
              label="Toko Aktif"
              value={activeShops.length}
              color={colors.primary}
              tint={`${colors.primary}18`}
              large
              onPress={() => {}}
            />
            <View style={styles.bentoCol}>
              <StatCard
                icon="package"
                label="Total Produk"
                value={totalProducts}
              />
              <StatCard
                icon="layers"
                label="Platform"
                value={new Set(shops.map((s) => s.platform)).size}
              />
            </View>
          </View>
        )}

        {/* ── Shop selector chips ── */}
        {shops.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>TOKO AKTIF</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shopChips}>
              {shops.map((s) => (
                <ShopChip
                  key={s.id}
                  shop={s}
                  active={s.id === activeShopId}
                  onPress={() => setActiveShopId(s.id)}
                />
              ))}
            </ScrollView>
          </>
        )}

        {/* ── Quick actions ── */}
        <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>AKSI CEPAT</Text>
        <View style={styles.quickActions}>
          <QuickAction
            icon="refresh-cw"
            label="Sinkron Produk"
            color={colors.primary}
            bg={`${colors.primary}18`}
            onPress={() => navigation.navigate('Products' as any)}
          />
          <QuickAction
            icon="layers"
            label="Update Stok Massal"
            color={colors.info}
            bg={`${colors.info}18`}
            onPress={() => navigation.navigate('BulkStockUpdate')}
          />
          <QuickAction
            icon="tag"
            label="Update Harga Massal"
            color={colors.warning}
            bg={`${colors.warning}18`}
            onPress={() => navigation.navigate('BulkPriceUpdate')}
          />
          <QuickAction
            icon="shopping-bag"
            label="Hubungkan Toko"
            color="#EE4D2D"
            bg="rgba(238,77,45,0.12)"
            onPress={() => navigation.navigate('ConnectShop')}
          />
        </View>

        {/* ── Recent jobs ── */}
        {activeShopId && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.placeholder }]}>AKTIVITAS TERBARU</Text>
            {histLoading ? (
              <View style={{ gap: 10 }}>
                <Skeleton width="100%" height={80} borderRadius={14} />
                <Skeleton width="100%" height={80} borderRadius={14} />
              </View>
            ) : recentJobs.length > 0 ? (
              <View style={{ gap: 10 }}>
                {recentJobs.map((job) => <JobStatusCard key={job.jobId} job={job} />)}
                <TouchableOpacity
                  onPress={() => navigation.navigate('Activity' as any)}
                  style={[styles.viewAllBtn, { borderColor: colors.border }]}
                >
                  <Text style={[styles.viewAllText, { color: colors.primary }]}>Lihat Semua Aktivitas</Text>
                  <Feather name="arrow-right" size={14} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.emptyJobs, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <Feather name="clock" size={28} color={colors.placeholder} />
                <Text style={[styles.emptyJobsText, { color: colors.textSecondary }]}>
                  Belum ada aktivitas
                </Text>
              </View>
            )}
          </>
        )}

        {/* ── No shops state ── */}
        {!shopsLoading && shops.length === 0 && (
          <TouchableOpacity
            style={[styles.connectCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
            onPress={() => navigation.navigate('ConnectShop')}
            activeOpacity={0.85}
          >
            <View style={[styles.connectIcon, { backgroundColor: `${colors.primary}18` }]}>
              <Feather name="plus-circle" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.connectTitle, { color: colors.heading }]}>Hubungkan Toko Pertama</Text>
            <Text style={[styles.connectSub, { color: colors.textSecondary }]}>
              Sambungkan akun Shopee atau TikTok Shop untuk mulai mengelola produk kamu.
            </Text>
            <View style={[styles.connectBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.connectBtnText}>Hubungkan Sekarang</Text>
              <Feather name="arrow-right" size={16} color="#fff" />
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 20, gap: 8, paddingBottom: 32 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, paddingBottom: 4 },
  greeting: { fontSize: 24, fontWeight: '800', letterSpacing: -0.3 },
  greetingDate: { fontSize: 13, marginTop: 2 },
  avatarBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 16, fontWeight: '800' },

  // Alert
  alertCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 4,
  },
  alertIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  alertTitle: { fontSize: 14, fontWeight: '700' },
  alertSub: { fontSize: 12, marginTop: 2 },

  // Section label
  sectionLabel: {
    fontSize: 10, fontWeight: '700', letterSpacing: 1.2, marginTop: 12, marginBottom: 10,
  },

  // Bento grid
  bentoGrid: { flexDirection: 'row', gap: 12 },
  bentoRow: { gap: 12 },
  bentoCol: { flex: 1, gap: 12 },
  statCard: {
    borderRadius: 18, borderWidth: 1, padding: 16,
    gap: 6, position: 'relative',
  },
  statCardLarge: { flex: 1.3 },
  statIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  statValueLarge: { fontSize: 36 },
  statLabel: { fontSize: 12, fontWeight: '500' },
  statArrow: { position: 'absolute', top: 14, right: 14 },

  // Shop chips
  shopChips: { gap: 8, paddingBottom: 4 },
  shopChip: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 100, borderWidth: 1,
  },
  shopChipDot: { width: 8, height: 8, borderRadius: 4 },
  shopChipText: { fontSize: 13, fontWeight: '600', maxWidth: 120 },

  // Quick actions
  quickActions: { gap: 8 },
  quickAction: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, borderRadius: 16, borderWidth: 1,
  },
  quickActionIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickActionLabel: { flex: 1, fontSize: 14, fontWeight: '600' },

  // View all
  viewAllBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  viewAllText: { fontSize: 14, fontWeight: '600' },

  // Empty jobs
  emptyJobs: {
    alignItems: 'center', justifyContent: 'center', gap: 8,
    padding: 32, borderRadius: 18, borderWidth: 1,
  },
  emptyJobsText: { fontSize: 14 },

  // Connect card
  connectCard: {
    borderRadius: 20, borderWidth: 1, padding: 24,
    alignItems: 'center', gap: 12,
  },
  connectIcon: { width: 60, height: 60, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  connectTitle: { fontSize: 20, fontWeight: '800', textAlign: 'center' },
  connectSub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  connectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 14, marginTop: 4,
  },
  connectBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
