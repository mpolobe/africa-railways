/**
 * Africa Railways - Configuration
 * 
 * This file contains configuration for the web application.
 * For production, set these values via environment variables or update this file.
 */

// Supabase Configuration (Production OAuth)
// Project: llvprbmrnjvamjzavmhg (same as scroll-waitlist-exchange-1)
// Get these from: https://supabase.com/dashboard/project/llvprbmrnjvamjzavmhg/settings/api
window.SUPABASE_URL = 'https://llvprbmrnjvamjzavmhg.supabase.co';

// IMPORTANT: Set your Supabase anon key here for production
// This key is safe to expose in client-side code as it only allows authenticated operations
// Get it from: Supabase Dashboard > Project Settings > API > anon public
// Same project as scroll-waitlist-exchange-1 - use the same VITE_SUPABASE_ANON_KEY
// Required for: Google/Facebook OAuth, ticket retrieval, booking storage
// 
// TO FIX GOOGLE LOGIN:
// 1. Go to https://supabase.com/dashboard/project/llvprbmrnjvamjzavmhg/settings/api
// 2. Copy the "anon public" key  
// 3. Paste it below (replace empty string)
// 4. Ensure Google OAuth is configured in Authentication > Providers > Google
// 5. Add redirect URLs in Authentication > URL Configuration > Redirect URLs:
//    - https://africarailways.com/auth/callback
//    - https://www.africarailways.com/auth/callback
//    - http://localhost:3000/auth/callback (for development)
window.SUPABASE_ANON_KEY = '';

// OAuth Redirect URLs (configured in Supabase Dashboard)
// Add these to: Authentication > URL Configuration > Redirect URLs
// - https://africarailways.com/auth/callback
// - https://www.africarailways.com/auth/callback
// - http://localhost:3000/auth/callback (for development)
// - exp://YOUR_EXPO_URL/auth/callback (for Expo development)

// API Configuration
window.AFRICA_RAILWAYS_CONFIG = {
    // API endpoints
    apiUrl: 'https://africa-railways.vercel.app',
    
    // Blockchain
    suiNetwork: 'mainnet',
    suiRpcUrl: 'https://fullnode.mainnet.sui.io:443',
    
    // Feature flags
    enablePhoneAuth: true,
    enableGoogleAuth: true,
    enableFacebookAuth: true,
    enableAppleAuth: true
};
