import AsyncStorage from '@react-native-async-storage/async-storage';
import { reloadAppAsync } from 'expo';
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { Appearance } from 'react-native';
import { darkColors, lightColors, motion, radii, sizes, spacing } from './tokens';
import { typography } from './typography';

export type ThemeMode = 'light' | 'dark';
export type MobileTheme = { dark: boolean; mode: ThemeMode; ready: boolean; setMode: (mode: ThemeMode) => Promise<void>; colors: typeof lightColors | typeof darkColors; spacing: typeof spacing; radii: typeof radii; sizes: typeof sizes; motion: typeof motion; typography: typeof typography };
const ThemeContext = createContext<MobileTheme | null>(null);
const THEME_KEY = 'mobile-theme-mode';

export function MobileThemeProvider({ children }: PropsWithChildren) {
  const [mode, setCurrentMode] = useState<ThemeMode>('dark');
  const [ready, setReady] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      const next: ThemeMode = stored === 'light' ? 'light' : 'dark';
      Appearance.setColorScheme(next);
      setCurrentMode(next);
      setReady(true);
    }).catch(() => { Appearance.setColorScheme('dark'); setReady(true); });
  }, []);
  const dark = mode === 'dark';
  const value = useMemo<MobileTheme>(() => ({ dark, mode, ready, setMode: async (next) => {
    if (next === mode) return;
    await AsyncStorage.setItem(THEME_KEY, next);
    Appearance.setColorScheme(next);
    await reloadAppAsync('Apply mobile theme');
  }, colors: dark ? darkColors : lightColors, spacing, radii, sizes, motion, typography }), [dark, mode, ready]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useMobileTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useMobileTheme must be used within MobileThemeProvider');
  return value;
}
