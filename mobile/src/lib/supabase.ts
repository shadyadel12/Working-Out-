import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const directUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const url = process.env.EXPO_PUBLIC_API_GATEWAY_URL || directUrl;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
if (!directUrl || !key) throw new Error('Copy mobile/.env.example to mobile/.env and add the Supabase values.');

const secureStorage = {
  getItem: (name: string) => SecureStore.getItemAsync(name),
  setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value, {
    keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
  }),
  removeItem: (name: string) => SecureStore.deleteItemAsync(name),
};

export const supabase = createClient(url, key, {
  auth: {
    storage: Platform.OS === 'web' ? AsyncStorage : secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

if (Platform.OS !== 'web') AppState.addEventListener('change', (state) => state === 'active' ? supabase.auth.startAutoRefresh() : supabase.auth.stopAutoRefresh());
