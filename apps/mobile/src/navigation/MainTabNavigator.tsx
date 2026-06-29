// src/navigation/MainTabNavigator.tsx
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import { Colors } from '@/constants';
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

export function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.placeholder,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarIcon: ({ color, size }) => (
          <Feather name={TAB_ICONS[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: 'Beranda' }} />
      <Tab.Screen name="Products" component={ProductListScreen} options={{ tabBarLabel: 'Produk' }} />
      <Tab.Screen name="Shops" component={ShopListScreen} options={{ tabBarLabel: 'Toko' }} />
      <Tab.Screen name="Activity" component={ActivityScreen} options={{ tabBarLabel: 'Aktivitas' }} />
    </Tab.Navigator>
  );
}
