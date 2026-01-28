import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

// Supabase configuration - same project as scroll-waitlist-exchange-1
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 
  process.env.SUPABASE_URL || 
  'https://llvprbmrnjvamjzavmhg.supabase.co';

const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY;

if (!supabaseAnonKey) {
  console.warn('Supabase anon key not configured. OAuth will not work.');
}

// Get the redirect URL for OAuth
// For Expo, use the app's deep link scheme
export const getRedirectUrl = () => {
  // For web builds
  if (typeof window !== 'undefined' && window.location) {
    return `${window.location.origin}/auth/callback`;
  }
  // For native builds, use Expo's linking
  return Linking.createURL('auth/callback');
};

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true, // Enable for OAuth callback handling
    },
  }
);

export default supabase;
