/**
 * Africa Railways - Supabase Authentication
 * Production Google/Facebook/Apple OAuth via Supabase
 */

// Supabase configuration - uses same project as SmartphoneApp
const SUPABASE_CONFIG = {
    url: 'https://llvprbmrnjvamjzavmhg.supabase.co',
    anonKey: '' // Will be loaded from environment or config
};

// Initialize Supabase client
let supabaseClient = null;

async function initSupabase() {
    if (supabaseClient) return supabaseClient;
    
    // Try to get config from environment or global config
    const url = window.SUPABASE_URL || SUPABASE_CONFIG.url;
    const key = window.SUPABASE_ANON_KEY || SUPABASE_CONFIG.anonKey;
    
    if (!key) {
        console.warn('Supabase anon key not configured. OAuth will not work.');
        return null;
    }
    
    // Load Supabase client library if not already loaded
    if (typeof supabase === 'undefined') {
        await loadSupabaseScript();
    }
    
    supabaseClient = supabase.createClient(url, key);
    return supabaseClient;
}

function loadSupabaseScript() {
    return new Promise((resolve, reject) => {
        if (typeof supabase !== 'undefined') {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

/**
 * Sign in with Google OAuth
 * Redirects to Google for authentication
 */
async function signInWithGoogle() {
    const client = await initSupabase();
    if (!client) {
        throw new Error('Supabase not configured. Please set SUPABASE_ANON_KEY.');
    }
    
    const { data, error } = await client.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin + '/auth/callback'
        }
    });
    
    if (error) throw error;
    return data;
}

/**
 * Sign in with Facebook OAuth
 */
async function signInWithFacebook() {
    const client = await initSupabase();
    if (!client) {
        throw new Error('Supabase not configured. Please set SUPABASE_ANON_KEY.');
    }
    
    const { data, error } = await client.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
            redirectTo: window.location.origin + '/auth/callback'
        }
    });
    
    if (error) throw error;
    return data;
}

/**
 * Sign in with Apple OAuth
 */
async function signInWithApple() {
    const client = await initSupabase();
    if (!client) {
        throw new Error('Supabase not configured. Please set SUPABASE_ANON_KEY.');
    }
    
    const { data, error } = await client.auth.signInWithOAuth({
        provider: 'apple',
        options: {
            redirectTo: window.location.origin + '/auth/callback'
        }
    });
    
    if (error) throw error;
    return data;
}

/**
 * Get current session
 */
async function getSession() {
    const client = await initSupabase();
    if (!client) return null;
    
    const { data: { session } } = await client.auth.getSession();
    return session;
}

/**
 * Get current user
 */
async function getUser() {
    const session = await getSession();
    return session?.user || null;
}

/**
 * Sign out
 */
async function signOut() {
    const client = await initSupabase();
    if (!client) return;
    
    await client.auth.signOut();
    
    // Clear local storage
    localStorage.removeItem('africa_railways_wallet');
    sessionStorage.clear();
}

/**
 * Listen for auth state changes
 */
async function onAuthStateChange(callback) {
    const client = await initSupabase();
    if (!client) return null;
    
    const { data: { subscription } } = client.auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
    
    return subscription;
}

/**
 * Handle OAuth callback
 * Call this on the callback page to complete authentication
 */
async function handleAuthCallback() {
    const client = await initSupabase();
    if (!client) return null;
    
    // Supabase automatically handles the callback
    const { data: { session }, error } = await client.auth.getSession();
    
    if (error) {
        console.error('Auth callback error:', error);
        return null;
    }
    
    if (session) {
        // Create wallet from user info
        const wallet = {
            address: generateWalletAddress(session.user),
            provider: session.user.app_metadata?.provider || 'oauth',
            email: session.user.email,
            userId: session.user.id
        };
        
        localStorage.setItem('africa_railways_wallet', JSON.stringify(wallet));
        return { session, wallet };
    }
    
    return null;
}

/**
 * Generate deterministic wallet address from user ID
 */
function generateWalletAddress(user) {
    // Create deterministic address from user ID
    const input = `sui:${user.id}:africa-railways`;
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    
    // Generate hex address
    const hexChars = '0123456789abcdef';
    let address = '0x';
    const seed = Math.abs(hash);
    for (let i = 0; i < 64; i++) {
        address += hexChars[(seed * (i + 1) * 7) % 16];
    }
    
    return address;
}

// Export for use in other scripts
window.supabaseAuth = {
    init: initSupabase,
    signInWithGoogle,
    signInWithFacebook,
    signInWithApple,
    getSession,
    getUser,
    signOut,
    onAuthStateChange,
    handleAuthCallback
};
