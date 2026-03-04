import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Database } from '@/types/supabase';

export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[Setup Required] .env file is missing or incomplete.\n' +
    'Create C:\\Users\\kazuk\\diary_art\\.env with:\n' +
    'EXPO_PUBLIC_SUPABASE_URL=https://...\n' +
    'EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...'
  );
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
