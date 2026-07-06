// src/navigation/RootNavigator.tsx
import React, { useEffect, useRef } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme, type Theme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createNavigationContainerRef } from '@react-navigation/core';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/hooks/useTheme';

// Auth screens
import { LandingScreen } from '@/screens/LandingScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { RegisterScreen } from '@/screens/RegisterScreen';

// Main screens
import { MainTabNavigator } from './MainTabNavigator';
import { ProductDetailScreen } from '@/screens/ProductDetailScreen';
import { EditStockScreen } from '@/screens/EditStockScreen';
import { EditPriceScreen } from '@/screens/EditPriceScreen';
import { EditImageScreen } from '@/screens/EditImageScreen';
import { ConnectShopScreen } from '@/screens/ConnectShopScreen';
import { BulkStockUpdateScreen } from '@/screens/BulkStockUpdateScreen';
import { BulkPriceUpdateScreen } from '@/screens/BulkPriceUpdateScreen';
import { BulkProgressScreen } from '@/screens/BulkProgressScreen';
import { ProfileScreen } from '@/screens/ProfileScreen';
import type { RootStackParamList } from '@/types';

const Stack = createStackNavigator<RootStackParamList>();
const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isInitialized, initialize } = useAuthStore();
  const { colors, scheme } = useTheme();
  const prevAuthRef = useRef(isAuthenticated);

  useEffect(() => { initialize(); }, []);

  useEffect(() => {
    if (!isInitialized) return;
    const prevAuth = prevAuthRef.current;
    prevAuthRef.current = isAuthenticated;

    if (prevAuth && !isAuthenticated) {
      navigationRef.reset({ index: 0, routes: [{ name: 'Landing' }] });
    }
    if (!prevAuth && isAuthenticated) {
      navigationRef.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    }
  }, [isAuthenticated, isInitialized]);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const navTheme: Theme = {
    ...(scheme === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(scheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.cardBg,
      text: colors.textPrimary,
      border: colors.border,
    },
  };

  return (
    <NavigationContainer theme={navTheme} ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
              options={{
                headerShown: true, title: '',
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.textPrimary,
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="EditStock" component={EditStockScreen}
              options={{
                presentation: 'modal', headerShown: true, title: 'Edit Stok',
                headerStyle: { backgroundColor: colors.cardBg },
                headerTintColor: colors.textPrimary,
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="EditPrice" component={EditPriceScreen}
              options={{
                presentation: 'modal', headerShown: true, title: 'Edit Harga',
                headerStyle: { backgroundColor: colors.cardBg },
                headerTintColor: colors.textPrimary,
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="EditImage" component={EditImageScreen}
              options={{
                presentation: 'modal', headerShown: true, title: 'Edit Gambar',
                headerStyle: { backgroundColor: colors.cardBg },
                headerTintColor: colors.textPrimary,
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="ConnectShop" component={ConnectShopScreen}
              options={{
                presentation: 'modal', headerShown: true, title: 'Hubungkan Toko',
                headerStyle: { backgroundColor: colors.cardBg },
                headerTintColor: colors.textPrimary,
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="BulkStockUpdate" component={BulkStockUpdateScreen}
              options={{
                presentation: 'modal', headerShown: true, title: 'Update Stok Massal',
                headerStyle: { backgroundColor: colors.cardBg },
                headerTintColor: colors.textPrimary,
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="BulkPriceUpdate" component={BulkPriceUpdateScreen}
              options={{
                presentation: 'modal', headerShown: true, title: 'Update Harga Massal',
                headerStyle: { backgroundColor: colors.cardBg },
                headerTintColor: colors.textPrimary,
                headerShadowVisible: false,
              }}
            />
            <Stack.Screen
              name="BulkProgress" component={BulkProgressScreen}
              options={{ presentation: 'modal', headerShown: false, gestureEnabled: false }}
            />
            <Stack.Screen
              name="Profile" component={ProfileScreen}
              options={{
                headerShown: true, title: 'Profil',
                headerStyle: { backgroundColor: colors.background },
                headerTintColor: colors.textPrimary,
                headerShadowVisible: false,
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export { navigationRef };
