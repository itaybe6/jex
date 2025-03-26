import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      storage: Platform.OS === 'web' 
        ? {
            getItem: (key) => {
              try {
                return localStorage.getItem(key);
              } catch (e) {
                return null;
              }
            },
            setItem: (key, value) => {
              try {
                localStorage.setItem(key, value);
              } catch (e) {
                console.error('Error setting localStorage:', e);
              }
            },
            removeItem: (key) => {
              try {
                localStorage.removeItem(key);
              } catch (e) {
                console.error('Error removing localStorage:', e);
              }
            },
          }
        : AsyncStorage,
      flowType: 'pkce',
    }
  }
);