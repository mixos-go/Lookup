// src/navigation/RootNavigator.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityIndicator, View } from 'react-native';
import { useAuthStore } from '@/stores/authStore';
import { Colors } from '@/constants';

// Auth screens
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
import type { RootStackParamList } from '@/types';

const Stack = createStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isInitialized, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen
              name="ProductDetail"
              component={ProductDetailScreen}
              options={{ headerShown: true, title: '', headerBackTitle: '' }}
            />
            <Stack.Screen name="EditStock" component={EditStockScreen} options={{ presentation: 'modal', headerShown: true, title: 'Edit Stok' }} />
            <Stack.Screen name="EditPrice" component={EditPriceScreen} options={{ presentation: 'modal', headerShown: true, title: 'Edit Harga' }} />
            <Stack.Screen name="EditImage" component={EditImageScreen} options={{ presentation: 'modal', headerShown: true, title: 'Edit Gambar' }} />
            <Stack.Screen name="ConnectShop" component={ConnectShopScreen} options={{ presentation: 'modal', headerShown: true, title: 'Hubungkan Toko' }} />
            <Stack.Screen name="BulkStockUpdate" component={BulkStockUpdateScreen} options={{ presentation: 'modal', headerShown: true, title: 'Update Stok Massal' }} />
            <Stack.Screen name="BulkPriceUpdate" component={BulkPriceUpdateScreen} options={{ presentation: 'modal', headerShown: true, title: 'Update Harga Massal' }} />
            <Stack.Screen name="BulkProgress" component={BulkProgressScreen} options={{ presentation: 'modal', headerShown: false, gestureEnabled: false }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
