// src/hooks/useTheme.tsx
import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import * as SecureStore from '@/utils/secureStorage';
import { Colors, DarkColors, type ThemeColors } from '@/constants/colors';

type ThemeMode = 'light' | 'dark' | 'system';
const THEME_MODE_KEY = 'lookup_theme_mode';

interface ThemeContextValue {
  colors: ThemeColors;
  scheme: 'light' | 'dark';
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(THEME_MODE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setModeState(stored);
      }
      setLoaded(true);
    });
  }, []);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    SecureStore.setItemAsync(THEME_MODE_KEY, next).catch(() => {
      // Non-fatal — falls back to 'system' next launch if persist fails.
    });
  }, []);

  // Avoid a light->dark flash on first frame while the stored preference loads.
  if (!loaded) return null;

  const scheme: 'light' | 'dark' = mode === 'system' ? (systemScheme ?? 'light') : mode;
  const colors = scheme === 'dark' ? DarkColors : Colors;

  return (
    <ThemeContext.Provider value={{ colors, scheme, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme() must be used inside <ThemeProvider>');
  }
  return ctx;
}
