import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
// Solo importa AsyncStorage en móvil
const getStorage = () => {
  if (Platform.OS === 'web') return undefined; // web usa localStorage automáticamente
  const { default: AsyncStorage } = require('@react-native-async-storage/async-storage');
  return AsyncStorage;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web', // necesario en web para OAuth
  },
});
console.log('URL:', process.env.EXPO_PUBLIC_SUPABASE_URL);
console.log('KEY:', process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY);