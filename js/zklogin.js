/**
 * Africa Railways Wallet Authentication
 * 
 * Hybrid authentication for African audience:
 * 
 * 1. zkLogin (Google/Facebook) - For users with social accounts
 *    - OAuth flow → JWT → ZK proof → SUI wallet
 *    - No seed phrases needed
 * 
 * 2. Phone-based Wallet - For USSD/SMS users (majority in Africa)
 *    - Phone number → OTP verification → Deterministic SUI wallet
 *    - Works with USSD: *384*26621#
 *    - Same wallet accessible via web, app, or USSD
 * 
 * The phone-based approach is critical for Africa where:
 * - Many users don't have Google/Facebook accounts
 * - Feature phones with USSD are common
 * - SMS is the primary communication method
 */

// Configuration
const ZKLOGIN_CONFIG = {
    // SUI Network
    network: 'mainnet', // 'mainnet', 'testnet', 'devnet'
    fullnodeUrl: 'https://fullnode.mainnet.sui.io:443',
    
    // Google OAuth (replace with your client ID)
    googleClientId: '575519204063-s8r4j2t0qr8m5q8q8q8q8q8q8q8q8q8q.apps.googleusercontent.com',
    
    // Facebook OAuth (replace with your app ID)
    facebookAppId: '1234567890123456',
    
    // Redirect URI (your domain)
    redirectUri: window.location.origin + '/auth/callback',
    
    // Mysten Labs services
    proverUrl: 'https://prover.mystenlabs.com/v1',
    saltServiceUrl: 'https://salt.api.mystenlabs.com/get_salt',
    
    // Storage keys
    storageKeys: {
        ephemeralKeyPair: 'zklogin_ephemeral_keypair',
        maxEpoch: 'zklogin_max_epoch',
        randomness: 'zklogin_randomness',
        userSalt: 'zklogin_user_salt',
        zkProof: 'zklogin_zk_proof',
        jwtToken: 'zklogin_jwt_token',
        userAddress: 'zklogin_user_address',
        userInfo: 'zklogin_user_info'
    }
};

// Simple crypto utilities (browser-compatible)
const zkLoginUtils = {
    // Generate random bytes
    generateRandomBytes: (length) => {
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        return array;
    },
    
    // Convert bytes to hex
    bytesToHex: (bytes) => {
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    },
    
    // Convert bytes to base64
    bytesToBase64: (bytes) => {
        return btoa(String.fromCharCode(...bytes));
    },
    
    // Base64 URL encode
    base64UrlEncode: (str) => {
        return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    },
    
    // Decode JWT
    decodeJwt: (token) => {
        const parts = token.split('.');
        if (parts.length !== 3) throw new Error('Invalid JWT');
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        return payload;
    },
    
    // Generate simple nonce (simplified for demo)
    generateNonce: (publicKey, maxEpoch, randomness) => {
        // In production, use @mysten/zklogin generateNonce
        const input = `${publicKey}:${maxEpoch}:${randomness}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        return zkLoginUtils.base64UrlEncode(zkLoginUtils.bytesToHex(data).slice(0, 32));
    }
};

// zkLogin Class
class ZkLogin {
    constructor(config = ZKLOGIN_CONFIG) {
        this.config = config;
        this.ephemeralKeyPair = null;
        this.maxEpoch = null;
        this.randomness = null;
        this.userSalt = null;
        this.userAddress = null;
        this.userInfo = null;
    }
    
    /**
     * Initialize zkLogin session
     * Creates ephemeral keypair and prepares for OAuth
     */
    async init() {
        try {
            // Get current epoch from SUI network
            const response = await fetch(this.config.fullnodeUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'suix_getLatestSuiSystemState',
                    params: []
                })
            });
            const data = await response.json();
            const currentEpoch = parseInt(data.result.epoch);
            
            // Set max epoch (valid for 2 epochs ~48 hours)
            this.maxEpoch = currentEpoch + 2;
            
            // Generate ephemeral keypair (simplified - in production use Ed25519Keypair)
            const privateKey = zkLoginUtils.generateRandomBytes(32);
            const publicKey = zkLoginUtils.bytesToHex(privateKey.slice(0, 32)); // Simplified
            this.ephemeralKeyPair = { privateKey, publicKey };
            
            // Generate randomness
            this.randomness = zkLoginUtils.bytesToHex(zkLoginUtils.generateRandomBytes(16));
            
            // Generate nonce
            const nonce = zkLoginUtils.generateNonce(publicKey, this.maxEpoch, this.randomness);
            
            // Store session data
            sessionStorage.setItem(this.config.storageKeys.ephemeralKeyPair, JSON.stringify({
                privateKey: zkLoginUtils.bytesToHex(privateKey),
                publicKey
            }));
            sessionStorage.setItem(this.config.storageKeys.maxEpoch, this.maxEpoch.toString());
            sessionStorage.setItem(this.config.storageKeys.randomness, this.randomness);
            
            return { nonce, maxEpoch: this.maxEpoch };
        } catch (error) {
            console.error('zkLogin init error:', error);
            // Fallback for demo
            this.maxEpoch = Math.floor(Date.now() / 1000) + 172800; // 48 hours
            const privateKey = zkLoginUtils.generateRandomBytes(32);
            const publicKey = zkLoginUtils.bytesToHex(privateKey.slice(0, 32));
            this.ephemeralKeyPair = { privateKey, publicKey };
            this.randomness = zkLoginUtils.bytesToHex(zkLoginUtils.generateRandomBytes(16));
            const nonce = zkLoginUtils.generateNonce(publicKey, this.maxEpoch, this.randomness);
            return { nonce, maxEpoch: this.maxEpoch };
        }
    }
    
    /**
     * Get Google OAuth URL
     */
    getGoogleAuthUrl(nonce) {
        const params = new URLSearchParams({
            client_id: this.config.googleClientId,
            redirect_uri: this.config.redirectUri,
            response_type: 'id_token',
            scope: 'openid email profile',
            nonce: nonce
        });
        return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    }
    
    /**
     * Get Facebook OAuth URL
     */
    getFacebookAuthUrl(nonce) {
        const params = new URLSearchParams({
            client_id: this.config.facebookAppId,
            redirect_uri: this.config.redirectUri,
            response_type: 'id_token',
            scope: 'openid email public_profile',
            nonce: nonce
        });
        return `https://www.facebook.com/v17.0/dialog/oauth?${params.toString()}`;
    }
    
    /**
     * Handle OAuth callback
     * Extract JWT from URL and complete login
     */
    async handleCallback() {
        // Check for JWT in URL hash
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const idToken = params.get('id_token');
        
        if (!idToken) {
            // Check query params (some providers use this)
            const queryParams = new URLSearchParams(window.location.search);
            const queryToken = queryParams.get('id_token');
            if (!queryToken) {
                throw new Error('No JWT token found in callback URL');
            }
            return this.completeLogin(queryToken);
        }
        
        return this.completeLogin(idToken);
    }
    
    /**
     * Complete login with JWT
     */
    async completeLogin(jwt) {
        try {
            // Decode JWT
            const decoded = zkLoginUtils.decodeJwt(jwt);
            
            // Store JWT
            sessionStorage.setItem(this.config.storageKeys.jwtToken, jwt);
            
            // Get user salt (simplified - in production call salt service)
            this.userSalt = await this.getUserSalt(jwt, decoded);
            sessionStorage.setItem(this.config.storageKeys.userSalt, this.userSalt);
            
            // Compute zkLogin address
            this.userAddress = this.computeAddress(decoded, this.userSalt);
            sessionStorage.setItem(this.config.storageKeys.userAddress, this.userAddress);
            
            // Store user info
            this.userInfo = {
                email: decoded.email,
                name: decoded.name,
                picture: decoded.picture,
                provider: decoded.iss.includes('google') ? 'google' : 
                         decoded.iss.includes('facebook') ? 'facebook' : 'unknown',
                sub: decoded.sub
            };
            localStorage.setItem(this.config.storageKeys.userInfo, JSON.stringify(this.userInfo));
            
            // Get ZK proof (in production)
            // const zkProof = await this.getZkProof(jwt);
            
            return {
                address: this.userAddress,
                user: this.userInfo,
                network: this.config.network
            };
        } catch (error) {
            console.error('Complete login error:', error);
            throw error;
        }
    }
    
    /**
     * Get user salt
     * In production, call Mysten Labs salt service or your own
     */
    async getUserSalt(jwt, decoded) {
        try {
            // Try Mysten Labs salt service
            const response = await fetch(this.config.saltServiceUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: jwt })
            });
            
            if (response.ok) {
                const data = await response.json();
                return data.salt;
            }
        } catch (e) {
            console.log('Salt service unavailable, using local derivation');
        }
        
        // Fallback: derive salt locally (deterministic)
        const saltInput = `${decoded.iss}:${decoded.sub}:africa-railways-salt`;
        const encoder = new TextEncoder();
        const data = encoder.encode(saltInput);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return BigInt('0x' + hashHex.slice(0, 32)).toString();
    }
    
    /**
     * Compute zkLogin address
     * Simplified version - in production use @mysten/zklogin jwtToAddress
     */
    computeAddress(decoded, salt) {
        // Simplified address derivation for demo
        // In production, use proper BCS serialization and Poseidon hash
        const input = `zklogin:${decoded.iss}:${decoded.sub}:${decoded.aud}:${salt}`;
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        
        // Create deterministic address
        const hashArray = new Uint8Array(32);
        for (let i = 0; i < data.length && i < 32; i++) {
            hashArray[i] = data[i];
        }
        
        // Add zkLogin flag (0x05)
        return '0x' + '05' + zkLoginUtils.bytesToHex(hashArray).slice(0, 62);
    }
    
    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        const address = sessionStorage.getItem(this.config.storageKeys.userAddress);
        const userInfo = localStorage.getItem(this.config.storageKeys.userInfo);
        return !!(address && userInfo);
    }
    
    /**
     * Get current session
     */
    getSession() {
        if (!this.isLoggedIn()) return null;
        
        return {
            address: sessionStorage.getItem(this.config.storageKeys.userAddress),
            user: JSON.parse(localStorage.getItem(this.config.storageKeys.userInfo)),
            network: this.config.network
        };
    }
    
    /**
     * Logout
     */
    logout() {
        Object.values(this.config.storageKeys).forEach(key => {
            sessionStorage.removeItem(key);
            localStorage.removeItem(key);
        });
        this.userAddress = null;
        this.userInfo = null;
    }
    
    /**
     * Get wallet balance
     */
    async getBalance(address) {
        try {
            const response = await fetch(this.config.fullnodeUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: 1,
                    method: 'suix_getBalance',
                    params: [address || this.userAddress]
                })
            });
            const data = await response.json();
            return {
                sui: data.result?.totalBalance || '0',
                afc: '0' // Would query AFC token balance
            };
        } catch (error) {
            console.error('Get balance error:', error);
            return { sui: '0', afc: '0' };
        }
    }
}

/**
 * Phone-based Wallet Authentication
 * For African users without social accounts
 * Works with USSD (*384*26621#) and SMS
 */
class PhoneWallet {
    constructor() {
        this.phoneNumber = null;
        this.walletAddress = null;
        this.isVerified = false;
        this.storageKeys = {
            phone: 'phone_wallet_number',
            address: 'phone_wallet_address',
            verified: 'phone_wallet_verified',
            userInfo: 'phone_wallet_user_info'
        };
    }
    
    /**
     * Generate deterministic wallet from phone number
     * Same algorithm used by USSD service for consistency
     */
    async generateWallet(phoneNumber) {
        // Normalize phone number (remove spaces, dashes, keep country code)
        const normalized = phoneNumber.replace(/[\s\-\(\)]/g, '');
        const digits = normalized.replace(/\D/g, '').slice(-10).padStart(10, '0');
        
        // Create deterministic seed from phone + salt
        const salt = 'africa-railways-phone-wallet-v1';
        const input = digits + salt;
        
        // Generate address using SHA-256
        const encoder = new TextEncoder();
        const data = encoder.encode(input);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = new Uint8Array(hashBuffer);
        
        // Create SUI-compatible address (0x + 64 hex chars)
        const address = '0x' + Array.from(hashArray)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        
        return {
            address,
            phoneNumber: normalized,
            normalizedDigits: digits
        };
    }
    
    /**
     * Request OTP verification
     * Sends SMS via Africa's Talking
     */
    async requestOTP(phoneNumber) {
        try {
            const wallet = await this.generateWallet(phoneNumber);
            this.phoneNumber = wallet.phoneNumber;
            this.walletAddress = wallet.address;
            
            // Generate 6-digit OTP
            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            
            // Store OTP temporarily (in production, store server-side)
            sessionStorage.setItem('pending_otp', otp);
            sessionStorage.setItem('pending_phone', phoneNumber);
            sessionStorage.setItem('otp_expires', (Date.now() + 300000).toString()); // 5 min expiry
            
            // Send SMS via API
            try {
                await fetch('/api/sms/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        to: phoneNumber,
                        message: `Your Africa Railways verification code is: ${otp}\n\nThis code expires in 5 minutes.\n\nOr dial *384*26621# for USSD access.`
                    })
                });
            } catch (smsError) {
                console.log('SMS API unavailable, OTP:', otp);
            }
            
            return {
                success: true,
                message: `OTP sent to ${phoneNumber}`,
                // For demo/testing, include OTP (remove in production)
                demoOtp: otp
            };
        } catch (error) {
            console.error('Request OTP error:', error);
            throw error;
        }
    }
    
    /**
     * Verify OTP and complete login
     */
    async verifyOTP(otp) {
        const storedOtp = sessionStorage.getItem('pending_otp');
        const storedPhone = sessionStorage.getItem('pending_phone');
        const expiry = parseInt(sessionStorage.getItem('otp_expires') || '0');
        
        if (!storedOtp || !storedPhone) {
            throw new Error('No pending verification. Please request OTP first.');
        }
        
        if (Date.now() > expiry) {
            sessionStorage.removeItem('pending_otp');
            sessionStorage.removeItem('pending_phone');
            sessionStorage.removeItem('otp_expires');
            throw new Error('OTP expired. Please request a new one.');
        }
        
        if (otp !== storedOtp) {
            throw new Error('Invalid OTP. Please try again.');
        }
        
        // OTP verified - complete login
        const wallet = await this.generateWallet(storedPhone);
        
        this.phoneNumber = wallet.phoneNumber;
        this.walletAddress = wallet.address;
        this.isVerified = true;
        
        // Store session
        localStorage.setItem(this.storageKeys.phone, wallet.phoneNumber);
        localStorage.setItem(this.storageKeys.address, wallet.address);
        localStorage.setItem(this.storageKeys.verified, 'true');
        localStorage.setItem(this.storageKeys.userInfo, JSON.stringify({
            phone: wallet.phoneNumber,
            provider: 'phone',
            verifiedAt: new Date().toISOString()
        }));
        
        // Clear OTP data
        sessionStorage.removeItem('pending_otp');
        sessionStorage.removeItem('pending_phone');
        sessionStorage.removeItem('otp_expires');
        
        return {
            address: wallet.address,
            phone: wallet.phoneNumber,
            provider: 'phone',
            network: 'mainnet'
        };
    }
    
    /**
     * Quick login without OTP (for returning users)
     * Useful for USSD where OTP isn't practical
     */
    async quickLogin(phoneNumber) {
        const wallet = await this.generateWallet(phoneNumber);
        
        this.phoneNumber = wallet.phoneNumber;
        this.walletAddress = wallet.address;
        
        // Store session (not verified, limited functionality)
        localStorage.setItem(this.storageKeys.phone, wallet.phoneNumber);
        localStorage.setItem(this.storageKeys.address, wallet.address);
        localStorage.setItem(this.storageKeys.userInfo, JSON.stringify({
            phone: wallet.phoneNumber,
            provider: 'phone-quick',
            loginAt: new Date().toISOString()
        }));
        
        return {
            address: wallet.address,
            phone: wallet.phoneNumber,
            provider: 'phone-quick',
            network: 'mainnet',
            verified: false
        };
    }
    
    /**
     * Check if user is logged in
     */
    isLoggedIn() {
        return !!localStorage.getItem(this.storageKeys.address);
    }
    
    /**
     * Get current session
     */
    getSession() {
        if (!this.isLoggedIn()) return null;
        
        const userInfo = JSON.parse(localStorage.getItem(this.storageKeys.userInfo) || '{}');
        return {
            address: localStorage.getItem(this.storageKeys.address),
            phone: localStorage.getItem(this.storageKeys.phone),
            verified: localStorage.getItem(this.storageKeys.verified) === 'true',
            user: userInfo,
            network: 'mainnet'
        };
    }
    
    /**
     * Logout
     */
    logout() {
        Object.values(this.storageKeys).forEach(key => {
            localStorage.removeItem(key);
        });
        this.phoneNumber = null;
        this.walletAddress = null;
        this.isVerified = false;
    }
}

/**
 * Unified Wallet Manager
 * Handles both zkLogin and Phone-based authentication
 */
class AfricaRailwaysWallet {
    constructor() {
        this.zkLogin = new ZkLogin();
        this.phoneWallet = new PhoneWallet();
        this.currentProvider = null;
    }
    
    /**
     * Check if user is logged in (any method)
     */
    isLoggedIn() {
        return this.zkLogin.isLoggedIn() || this.phoneWallet.isLoggedIn();
    }
    
    /**
     * Get current session (from any provider)
     */
    getSession() {
        const zkSession = this.zkLogin.getSession();
        if (zkSession) {
            this.currentProvider = 'zklogin';
            return { ...zkSession, provider: zkSession.user?.provider || 'zklogin' };
        }
        
        const phoneSession = this.phoneWallet.getSession();
        if (phoneSession) {
            this.currentProvider = 'phone';
            return phoneSession;
        }
        
        return null;
    }
    
    /**
     * Login with Google (zkLogin)
     */
    async loginWithGoogle() {
        const { nonce } = await this.zkLogin.init();
        const authUrl = this.zkLogin.getGoogleAuthUrl(nonce);
        window.location.href = authUrl;
    }
    
    /**
     * Login with Facebook (zkLogin)
     */
    async loginWithFacebook() {
        const { nonce } = await this.zkLogin.init();
        const authUrl = this.zkLogin.getFacebookAuthUrl(nonce);
        window.location.href = authUrl;
    }
    
    /**
     * Login with phone number
     */
    async loginWithPhone(phoneNumber, skipOtp = false) {
        if (skipOtp) {
            return this.phoneWallet.quickLogin(phoneNumber);
        }
        return this.phoneWallet.requestOTP(phoneNumber);
    }
    
    /**
     * Verify phone OTP
     */
    async verifyPhoneOTP(otp) {
        return this.phoneWallet.verifyOTP(otp);
    }
    
    /**
     * Handle OAuth callback
     */
    async handleCallback() {
        return this.zkLogin.handleCallback();
    }
    
    /**
     * Logout from all providers
     */
    logout() {
        this.zkLogin.logout();
        this.phoneWallet.logout();
        this.currentProvider = null;
    }
    
    /**
     * Get wallet balance
     */
    async getBalance() {
        const session = this.getSession();
        if (!session) return { sui: '0', afc: '0' };
        return this.zkLogin.getBalance(session.address);
    }
}

// Global instances
window.zkLogin = new ZkLogin();
window.phoneWallet = new PhoneWallet();
window.wallet = new AfricaRailwaysWallet();

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ZkLogin, PhoneWallet, AfricaRailwaysWallet, zkLoginUtils, ZKLOGIN_CONFIG };
}
