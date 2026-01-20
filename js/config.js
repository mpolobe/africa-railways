/**
 * Africa Railways - Configuration
 * 
 * This file contains configuration for the web application.
 * For production, set these values via environment variables or update this file.
 */

// Supabase Configuration (Production OAuth)
// Get these from: https://supabase.com/dashboard/project/YOUR_PROJECT/settings/api
window.SUPABASE_URL = 'https://llvprbmrnjvamjzavmhg.supabase.co';

// IMPORTANT: Set your Supabase anon key here for production
// This key is safe to expose in client-side code as it only allows authenticated operations
// Get it from: Supabase Dashboard > Project Settings > API > anon public
window.SUPABASE_ANON_KEY = '';

// OAuth Redirect URLs (configured in Supabase Dashboard)
// Add these to: Authentication > URL Configuration > Redirect URLs
// - https://africarailways.com/auth-callback.html
// - https://www.africarailways.com/auth-callback.html
// - http://localhost:3000/auth-callback.html (for development)

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
