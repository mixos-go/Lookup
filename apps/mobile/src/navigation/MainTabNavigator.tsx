// src/navigation/MainTabNavigator.tsx — Redesigned sidebar (web) + bottom tabs (mobile)
import React from 'react';
import {
  createBottomTabNavigator,
  type BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import {
  Platform, Pressable, Text, View, useWindowDimensions,
  TouchableOpacity, Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { useShopStore } from '@/stores/shopStore';
import { useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/api/auth';
import { getStoredRefreshToken } from '@/api/client';
import { HomeScreen } from '@/screens/HomeScreen';
import { ProductListScreen } from '@/screens/ProductListScreen';
import { ShopListScreen } from '@/screens/ShopListScreen';
import { ActivityScreen } from '@/screens/ActivityScreen';
import type { MainTabParamList } from '@/types';

const Tab = createBottomTabNavigator<MainTabParamList>();
type FeatherName = React.ComponentProps<typeof Feather>['name'];

const TAB_CONFIG: { name: keyof MainTabParamList; icon: FeatherName; label: string }[] = [
  { name: 'Home',     icon: 'home',        label: 'Beranda'   },
  { name: 'Products', icon: 'package',     label: 'Produk'    },
  { name: 'Shops',    icon: 'shopping-bag',label: 'Toko'      },
  { name: 'Activity', icon: 'activity',    label: 'Aktivitas' },
];

const DESKTOP_BREAKPOINT = 900;
const SIDEBAR_W = 248;

// ─── Web sidebar ──────────────────────────────────────────────────────────────
function WebSidebar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const resetShops = useShopStore((s) => s.reset);
  const { activeShopId, shops } = useShopStore();
  const queryClient = useQueryClient();
  const activeShop = shops.find((s) => s.id === activeShopId);

  const handleLogout = () => {
    Alert.alert('Keluar', 'Yakin ingin keluar?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar', style: 'destructive', onPress: async () => {
          try {
            const rt = await getStoredRefreshToken();
            if (rt) await authApi.logout(rt);
          } catch {}
          queryClient.clear();
          resetShops();
          await logout();
        },
      },
    ]);
  };

  const initials = (user?.name ?? 'U')
    .split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  return (
    <View style={[
      styles.sidebar,
      {
        // @ts-expect-error — web-only CSS
        position: 'fixed',
        backgroundColor: colors.cardBg,
        borderRightColor: colors.border,
      },
    ]}>
      {/* Logo */}
      <View style={styles.sidebarLogo}>
        <View style={[styles.logoBox, { borderColor: colors.primary, backgroundColor: `${colors.primary}1A` }]}>
          <View style={[styles.logoCube, { borderColor: colors.primary }]} />
        </View>
        <Text style={[styles.logoText, { color: colors.heading }]}>LookUp</Text>
      </View>

      {/* Active shop chip */}
      {activeShop ? (
        <View style={[styles.shopChip, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
          <View style={[
            styles.shopPlatformDot,
            { backgroundColor: activeShop.platform === 'SHOPEE' ? '#EE4D2D' : colors.tiktokPink },
          ]} />
          <Text style={[styles.shopChipText, { color: colors.textPrimary }]} numberOfLines={1}>
            {activeShop.shopName}
          </Text>
          {activeShop.status === 'TOKEN_EXPIRED' && (
            <View style={[styles.shopExpiredDot, { backgroundColor: colors.danger }]} />
          )}
        </View>
      ) : (
        <View style={[styles.shopChip, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
          <Feather name="shopping-bag" size={14} color={colors.placeholder} />
          <Text style={[styles.shopChipText, { color: colors.placeholder }]}>Pilih toko</Text>
        </View>
      )}

      {/* Nav section label */}
      <Text style={[styles.sidebarSectionLabel, { color: colors.placeholder }]}>MENU</Text>

      {/* Nav items */}
      <View style={styles.sidebarNav}>
        {TAB_CONFIG.map((tab, index) => {
          const isFocused = state.index === index;
          return (
            <Pressable
              key={tab.name}
              onPress={() => {
                const event = navigation.emit({
                  type: 'tabPress', target: state.routes[index].key,
                  canPreventDefault: true,
                });
                if (!isFocused && !event.defaultPrevented) {
                  navigation.navigate(tab.name);
                }
              }}
              style={[
                styles.sidebarItem,
                isFocused && { backgroundColor: `${colors.primary}1A` },
              ]}
            >
              <View style={[
                styles.sidebarItemIcon,
                isFocused && { backgroundColor: `${colors.primary}22` },
              ]}>
                <Feather
                  name={tab.icon}
                  size={18}
                  color={isFocused ? colors.primary : colors.placeholder}
                />
              </View>
              <Text style={[
                styles.sidebarItemLabel,
                { color: isFocused ? colors.primary : colors.textPrimary },
                isFocused && { fontWeight: '700' },
              ]}>
                {tab.label}
              </Text>
              {isFocused && (
                <View style={[styles.sidebarActiveIndicator, { backgroundColor: colors.primary }]} />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* Bottom: version */}
      <Text style={[styles.sidebarVersion, { color: colors.placeholder }]}>v1.0.0</Text>

      {/* User row */}
      <View style={[styles.sidebarUser, { borderTopColor: colors.border }]}>
        <View style={[styles.sidebarAvatar, { backgroundColor: `${colors.primary}22` }]}>
          <Text style={[styles.sidebarAvatarText, { color: colors.primary }]}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sidebarUserName, { color: colors.heading }]} numberOfLines={1}>
            {user?.name ?? '—'}
          </Text>
          <Text style={[styles.sidebarUserEmail, { color: colors.placeholder }]} numberOfLines={1}>
            {user?.email ?? '—'}
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.sidebarLogout}>
          <Feather name="log-out" size={17} color={colors.placeholder} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Mobile custom tab bar ────────────────────────────────────────────────────
function MobileTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.mobileTabBar, { backgroundColor: colors.cardBg, borderTopColor: colors.border }]}>
      {TAB_CONFIG.map((tab, index) => {
        const isFocused = state.index === index;
        return (
          <Pressable
            key={tab.name}
            style={styles.mobileTabItem}
            onPress={() => {
              const event = navigation.emit({
                type: 'tabPress', target: state.routes[index].key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(tab.name);
              }
            }}
          >
            <View style={[
              styles.mobileTabIcon,
              isFocused && { backgroundColor: `${colors.primary}18` },
            ]}>
              <Feather
                name={tab.icon}
                size={20}
                color={isFocused ? colors.primary : colors.placeholder}
              />
            </View>
            <Text style={[
              styles.mobileTabLabel,
              { color: isFocused ? colors.primary : colors.placeholder },
              isFocused && { fontWeight: '700' },
            ]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Main navigator ───────────────────────────────────────────────────────────
export function MainTabNavigator() {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= DESKTOP_BREAKPOINT;

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      <Tab.Navigator
        tabBar={(props) => isDesktop ? <WebSidebar {...props} /> : <MobileTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        {TAB_CONFIG.map((tab) => (
          <Tab.Screen key={tab.name} name={tab.name} component={
            tab.name === 'Home' ? HomeScreen :
            tab.name === 'Products' ? ProductListScreen :
            tab.name === 'Shops' ? ShopListScreen :
            ActivityScreen
          } />
        ))}
      </Tab.Navigator>
    </View>
  );
}

const styles = {
  // Sidebar (web)
  sidebar: {
    left: 0, top: 0, bottom: 0,
    width: SIDEBAR_W,
    borderRightWidth: 1,
    paddingTop: 24,
    paddingBottom: 0,
    paddingHorizontal: 14,
    gap: 6,
    display: 'flex' as any,
    flexDirection: 'column' as any,
  },
  sidebarLogo: {
    flexDirection: 'row' as any, alignItems: 'center' as any,
    gap: 10, paddingHorizontal: 8, paddingBottom: 20,
  },
  logoBox: {
    width: 34, height: 34, borderRadius: 9,
    borderWidth: 2, alignItems: 'center' as any,
    justifyContent: 'center' as any,
  },
  logoCube: {
    width: 14, height: 14, borderWidth: 2,
    borderRadius: 3, transform: [{ rotate: '12deg' }] as any,
  },
  logoText: { fontSize: 19, fontWeight: '800' as any, letterSpacing: -0.3 },
  shopChip: {
    flexDirection: 'row' as any, alignItems: 'center' as any,
    gap: 8, borderRadius: 10, borderWidth: 1,
    paddingHorizontal: 12, paddingVertical: 9,
    marginBottom: 8,
  },
  shopPlatformDot: { width: 8, height: 8, borderRadius: 4 },
  shopChipText: { flex: 1, fontSize: 13, fontWeight: '600' as any },
  shopExpiredDot: { width: 7, height: 7, borderRadius: 4 },
  sidebarSectionLabel: {
    fontSize: 10, fontWeight: '700' as any,
    letterSpacing: 1.2, paddingHorizontal: 10,
    marginTop: 8, marginBottom: 4,
  },
  sidebarNav: { gap: 2 },
  sidebarItem: {
    flexDirection: 'row' as any, alignItems: 'center' as any,
    gap: 10, borderRadius: 11,
    paddingVertical: 10, paddingHorizontal: 10,
    position: 'relative' as any,
  },
  sidebarItemIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center' as any, justifyContent: 'center' as any },
  sidebarItemLabel: { fontSize: 14, fontWeight: '500' as any },
  sidebarActiveIndicator: {
    position: 'absolute' as any, right: 8, width: 4, height: 18,
    borderRadius: 2,
  },
  sidebarVersion: { fontSize: 11, paddingHorizontal: 10, paddingBottom: 8 },
  sidebarUser: {
    flexDirection: 'row' as any, alignItems: 'center' as any,
    gap: 10, borderTopWidth: 1,
    paddingTop: 14, paddingBottom: 20, paddingHorizontal: 4,
  },
  sidebarAvatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center' as any, justifyContent: 'center' as any,
  },
  sidebarAvatarText: { fontSize: 13, fontWeight: '700' as any },
  sidebarUserName: { fontSize: 13, fontWeight: '600' as any },
  sidebarUserEmail: { fontSize: 11 },
  sidebarLogout: { padding: 6 },

  // Mobile tab bar
  mobileTabBar: {
    flexDirection: 'row' as any,
    borderTopWidth: 1,
    paddingBottom: Platform.OS === 'ios' ? 20 : 6,
    paddingTop: 8,
    paddingHorizontal: 8,
  },
  mobileTabItem: {
    flex: 1, alignItems: 'center' as any,
    justifyContent: 'center' as any, gap: 4,
  },
  mobileTabIcon: {
    width: 44, height: 32, borderRadius: 10,
    alignItems: 'center' as any, justifyContent: 'center' as any,
  },
  mobileTabLabel: { fontSize: 11 },
};
