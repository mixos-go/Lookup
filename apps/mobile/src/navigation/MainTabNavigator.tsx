// src/navigation/MainTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator, type BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { Platform, Pressable, Text, View, useWindowDimensions } from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { HomeScreen } from '@/screens/HomeScreen';
import { ProductListScreen } from '@/screens/ProductListScreen';
import { ShopListScreen } from '@/screens/ShopListScreen';
import { ActivityScreen } from '@/screens/ActivityScreen';
import type { MainTabParamList } from '@/types';

const Tab = createBottomTabNavigator<MainTabParamList>();

type FeatherIconName = React.ComponentProps<typeof Feather>['name'];

const TAB_ICONS: Record<keyof MainTabParamList, FeatherIconName> = {
  Home: 'home',
  Products: 'package',
  Shops: 'shopping-bag',
  Activity: 'activity',
};

const TAB_LABELS: Record<keyof MainTabParamList, string> = {
  Home: 'Beranda',
  Products: 'Produk',
  Shops: 'Toko',
  Activity: 'Aktivitas',
};

// Di bawah lebar ini, tab bar tetap di bawah layar seperti mobile biasa.
// Di atasnya (desktop web / tablet landscape lebar), tab bar dialihkan
// jadi sidebar kiri, dan konten memanfaatkan sisa lebar layar secara penuh.
const DESKTOP_BREAKPOINT = 900;
const SIDEBAR_WIDTH = 232;

function SidebarTabBar({ state, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        // @ts-expect-error 'fixed' adalah nilai CSS position khusus web (react-native-web)
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: SIDEBAR_WIDTH,
        backgroundColor: colors.cardBg,
        borderRightWidth: 1,
        borderRightColor: colors.border,
        paddingTop: 28,
        paddingHorizontal: 12,
      }}
    >
      <Text
        style={{
          fontSize: 20,
          fontWeight: '700',
          color: colors.textPrimary,
          marginBottom: 28,
          paddingHorizontal: 10,
        }}
      >
        LookUp
      </Text>

      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const iconName = TAB_ICONS[route.name as keyof MainTabParamList];
        const label = TAB_LABELS[route.name as keyof MainTabParamList];

        return (
          <Pressable
            key={route.key}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              paddingVertical: 11,
              paddingHorizontal: 12,
              borderRadius: 10,
              marginBottom: 4,
              backgroundColor: isFocused ? `${colors.primary}1A` : 'transparent',
            }}
          >
            <Feather name={iconName} size={19} color={isFocused ? colors.primary : colors.placeholder} />
            <Text
              style={{
                fontSize: 14.5,
                color: isFocused ? colors.primary : colors.textPrimary,
                fontWeight: isFocused ? '600' : '400',
              }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function MainTabNavigator() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= DESKTOP_BREAKPOINT;

  return (
    // paddingLeft menggeser seluruh area konten ke kanan supaya tidak
    // tertutup sidebar yang position: fixed. Di mobile/narrow web, ini 0
    // sehingga tidak ada efek apa pun.
    <View style={{ flex: 1, paddingLeft: isDesktopWeb ? SIDEBAR_WIDTH : 0 }}>
      <Tab.Navigator
        tabBar={isDesktopWeb ? (props) => <SidebarTabBar {...props} /> : undefined}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.placeholder,
          tabBarStyle: {
            backgroundColor: colors.cardBg,
            borderTopColor: colors.border,
            borderTopWidth: 1,
          },
          tabBarIcon: ({ color, size }) => (
            <Feather name={TAB_ICONS[route.name]} size={size} color={color} />
          ),
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: TAB_LABELS.Home }} />
        <Tab.Screen name="Products" component={ProductListScreen} options={{ tabBarLabel: TAB_LABELS.Products }} />
        <Tab.Screen name="Shops" component={ShopListScreen} options={{ tabBarLabel: TAB_LABELS.Shops }} />
        <Tab.Screen name="Activity" component={ActivityScreen} options={{ tabBarLabel: TAB_LABELS.Activity }} />
      </Tab.Navigator>
    </View>
  );
}
