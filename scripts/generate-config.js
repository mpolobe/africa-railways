#!/usr/bin/env node
/**
 * Generate config.js from environment variables
 * Run this during Vercel build to inject secrets
 * 
 * Usage:
 *   npm run generate-config  (loads from .env)
 *   node scripts/generate-config.js (uses process.env only)
 */

const fs = require('fs');
const path = require('path');

// Try to load .env file for local development
try {
    try {
        require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
    } catch (e) {
        // dotenv not available or .env doesn't exist - use process.env only
        console.log('   ℹ️ dotenv not available, using process.env only');
    }
} catch (e) {
    // Ignore errors
}

const config = `/**
 * Africa Railways - Configuration
 * Auto-generated from environment variables
 * DO NOT EDIT MANUALLY - edit .env or Vercel environment variables instead
 */

// Supabase Configuration
window.SUPABASE_URL = '${process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://llvprbmrnjvamjzavmhg.supabase.co'}';
window.SUPABASE_ANON_KEY = '${process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''}';

// API Configuration
window.AFRICA_RAILWAYS_CONFIG = {
    apiUrl: '${process.env.API_URL || 'https://africa-railways.vercel.app'}',
    suiNetwork: '${process.env.SUI_NETWORK || 'mainnet'}',
    suiRpcUrl: '${process.env.SUI_RPC_URL || 'https://fullnode.mainnet.sui.io:443'}',
    enablePhoneAuth: true,
    enableGoogleAuth: true,
    enableFacebookAuth: true,
    enableAppleAuth: true
};

// Stripe Configuration
window.STRIPE_PUBLISHABLE_KEY = '${process.env.STRIPE_PUBLISHABLE_KEY || process.env.VITE_STRIPE_PUBLISHABLE_KEY || ''}';
`;

const outputDir = path.join(__dirname, '..', 'js');
const outputPath = path.join(outputDir, 'config.js');

try {
    // Ensure js directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, config);
    console.log('✅ Generated js/config.js with environment variables');
    
    // Log which variables were set (without exposing values)
    console.log('   SUPABASE_URL:', process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL ? 'SET' : 'using default');
    console.log('   SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
} catch (error) {
    console.error('⚠️ Failed to generate config.js:', error.message);
    process.exit(1);
}

