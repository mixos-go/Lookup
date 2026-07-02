import './src/global.css';
import React, { useEffect } from 'react';
import { Linking } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator, navigationRef } from '@/navigation/RootNavigator';
import { ThemeProvider } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/authStore';
import { setOnAuthFailureCallback } from '@/api/client';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  useEffect(() => {
    // Initialize auth failure callback for API client interceptors
    const authStoreState = useAuthStore.getState();
    setOnAuthFailureCallback(() => authStoreState.logout());

    // Handle deep link when app is already open (foreground)
    const sub = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    // Handle deep link when app is opened from background via the link
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <RootNavigator />
          </QueryClientProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function handleDeepLink(url: string): void {
  // Handle: lookup://oauth/callback?success=true&platform=SHOPEE&shopId=xxx
  if (!url.startsWith('lookup://oauth/callback')) return;

  const params = new URLSearchParams(url.split('?')[1] ?? '');
  const success = params.get('success') === 'true';
  const platform = params.get('platform');
  const shopId = params.get('shopId');
  const shopName = params.get('shopName');

  if (success && shopId) {
    // Invalidate shops query → ShopListScreen and HomeScreen auto-refresh
    queryClient.invalidateQueries({ queryKey: ['shops'] });
    
    // Navigate to MainTabs if we're authenticated
    if (navigationRef.isReady()) {
      navigationRef.navigate('MainTabs');
    }
  }
}
