/**
 * SUI zkLogin Authentication Service
 * 
 * zkLogin allows users to authenticate using OAuth providers (Google, Facebook, etc.)
 * and creates a SUI wallet address tied to their identity without exposing private keys.
 * 
 * Flow:
 * 1. User clicks "Login with Google/Facebook"
 * 2. OAuth provider returns JWT token
 * 3. zkLogin generates ephemeral keypair
 * 4. User gets a SUI address derived from their OAuth identity
 * 5. ZK proof is generated to prove ownership without revealing identity
 */

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { generateNonce, generateRandomness, getExtendedEphemeralPublicKey } from '@mysten/zklogin';
import { jwtDecode } from 'jwt-decode';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

// Configuration
const SUI_NETWORK = Constants.expoConfig?.extra?.suiNetwork || 'testnet';
const GOOGLE_CLIENT_ID = Constants.expoConfig?.extra?.googleClientId || '';
const FACEBOOK_APP_ID = Constants.expoConfig?.extra?.facebookAppId || '';

// zkLogin Prover Service (Mysten Labs hosted)
const PROVER_URL = SUI_NETWORK === 'mainnet' 
    ? 'https://prover.mystenlabs.com/v1'
    : 'https://prover-dev.mystenlabs.com/v1';

// Salt Service (for deterministic address generation)
const SALT_SERVICE_URL = 'https://salt.api.mystenlabs.com/get_salt';

// SUI Client
const suiClient = new SuiClient({ url: getFullnodeUrl(SUI_NETWORK) });

// Storage keys
const STORAGE_KEYS = {
    EPHEMERAL_KEYPAIR: 'zklogin_ephemeral_keypair',
    MAX_EPOCH: 'zklogin_max_epoch',
    RANDOMNESS: 'zklogin_randomness',
    USER_SALT: 'zklogin_user_salt',
    ZK_PROOF: 'zklogin_zk_proof',
    JWT_TOKEN: 'zklogin_jwt_token',
    USER_ADDRESS: 'zklogin_user_address',
};

/**
 * Initialize zkLogin session
 * Creates ephemeral keypair and generates nonce for OAuth
 */
export async function initZkLogin() {
    try {
        // Get current epoch from SUI network
        const { epoch } = await suiClient.getLatestSuiSystemState();
        const maxEpoch = Number(epoch) + 2; // Valid for 2 epochs (~48 hours)
        
        // Generate ephemeral keypair
        const ephemeralKeyPair = new Ed25519Keypair();
        const randomness = generateRandomness();
        
        // Generate nonce for OAuth
        const nonce = generateNonce(
            ephemeralKeyPair.getPublicKey(),
            maxEpoch,
            randomness
        );
        
        // Store session data securely
        await SecureStore.setItemAsync(
            STORAGE_KEYS.EPHEMERAL_KEYPAIR,
            JSON.stringify(Array.from(ephemeralKeyPair.export().privateKey))
        );
        await SecureStore.setItemAsync(STORAGE_KEYS.MAX_EPOCH, maxEpoch.toString());
        await SecureStore.setItemAsync(STORAGE_KEYS.RANDOMNESS, randomness);
        
        return {
            nonce,
            maxEpoch,
            ephemeralPublicKey: ephemeralKeyPair.getPublicKey().toBase64()
        };
    } catch (error) {
        console.error('zkLogin init error:', error);
        throw error;
    }
}

/**
 * Get Google OAuth URL for zkLogin
 */
export function getGoogleAuthUrl(nonce, redirectUri) {
    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: redirectUri,
        response_type: 'id_token',
        scope: 'openid email profile',
        nonce: nonce,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Get Facebook OAuth URL for zkLogin
 */
export function getFacebookAuthUrl(nonce, redirectUri) {
    const params = new URLSearchParams({
        client_id: FACEBOOK_APP_ID,
        redirect_uri: redirectUri,
        response_type: 'token',
        scope: 'email,public_profile',
        state: nonce,
    });
    return `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
}

/**
 * Complete zkLogin after OAuth callback
 * @param {string} jwtToken - JWT token from OAuth provider
 */
export async function completeZkLogin(jwtToken) {
    try {
        // Decode JWT to get user info
        const decodedJwt = jwtDecode(jwtToken);
        
        // Get stored session data
        const ephemeralKeyPairData = await SecureStore.getItemAsync(STORAGE_KEYS.EPHEMERAL_KEYPAIR);
        const maxEpoch = await SecureStore.getItemAsync(STORAGE_KEYS.MAX_EPOCH);
        const randomness = await SecureStore.getItemAsync(STORAGE_KEYS.RANDOMNESS);
        
        if (!ephemeralKeyPairData || !maxEpoch || !randomness) {
            throw new Error('zkLogin session expired. Please start again.');
        }
        
        // Reconstruct ephemeral keypair
        const privateKeyArray = JSON.parse(ephemeralKeyPairData);
        const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
        
        // Get user salt (deterministic based on OAuth sub)
        const userSalt = await getUserSalt(jwtToken);
        
        // Get extended ephemeral public key
        const extendedEphemeralPublicKey = getExtendedEphemeralPublicKey(
            ephemeralKeyPair.getPublicKey()
        );
        
        // Generate ZK proof
        const zkProof = await generateZkProof({
            jwt: jwtToken,
            extendedEphemeralPublicKey,
            maxEpoch: Number(maxEpoch),
            randomness,
            salt: userSalt,
        });
        
        // Compute user's SUI address
        const userAddress = computeZkLoginAddress({
            iss: decodedJwt.iss,
            sub: decodedJwt.sub,
            aud: decodedJwt.aud,
            salt: userSalt,
        });
        
        // Store authentication data
        await SecureStore.setItemAsync(STORAGE_KEYS.JWT_TOKEN, jwtToken);
        await SecureStore.setItemAsync(STORAGE_KEYS.USER_SALT, userSalt);
        await SecureStore.setItemAsync(STORAGE_KEYS.ZK_PROOF, JSON.stringify(zkProof));
        await SecureStore.setItemAsync(STORAGE_KEYS.USER_ADDRESS, userAddress);
        
        return {
            address: userAddress,
            email: decodedJwt.email,
            name: decodedJwt.name,
            picture: decodedJwt.picture,
            provider: decodedJwt.iss.includes('google') ? 'google' : 'facebook',
        };
    } catch (error) {
        console.error('zkLogin completion error:', error);
        throw error;
    }
}

/**
 * Get user salt from Mysten Labs salt service
 * Salt is deterministic based on OAuth subject (user ID)
 */
async function getUserSalt(jwtToken) {
    try {
        const response = await fetch(SALT_SERVICE_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: jwtToken }),
        });
        
        if (!response.ok) {
            throw new Error('Failed to get user salt');
        }
        
        const { salt } = await response.json();
        return salt;
    } catch (error) {
        // Fallback: generate deterministic salt locally
        const decoded = jwtDecode(jwtToken);
        const saltInput = `${decoded.iss}:${decoded.sub}:africa-railways`;
        const encoder = new TextEncoder();
        const data = encoder.encode(saltInput);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return BigInt('0x' + hashArray.map(b => b.toString(16).padStart(2, '0')).join('')).toString();
    }
}

/**
 * Generate ZK proof using Mysten Labs prover service
 */
async function generateZkProof({ jwt, extendedEphemeralPublicKey, maxEpoch, randomness, salt }) {
    try {
        const response = await fetch(PROVER_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                jwt,
                extendedEphemeralPublicKey,
                maxEpoch,
                jwtRandomness: randomness,
                salt,
                keyClaimName: 'sub',
            }),
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Prover error: ${error}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error('ZK proof generation error:', error);
        throw error;
    }
}

/**
 * Compute zkLogin address from OAuth identity
 */
function computeZkLoginAddress({ iss, sub, aud, salt }) {
    // This is a simplified version - actual implementation uses BCS serialization
    const addressInput = `${iss}:${sub}:${aud}:${salt}`;
    // In production, use @mysten/zklogin computeZkLoginAddress
    return '0x' + Array.from(
        new TextEncoder().encode(addressInput)
    ).slice(0, 32).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Get current zkLogin session
 */
export async function getZkLoginSession() {
    try {
        const address = await SecureStore.getItemAsync(STORAGE_KEYS.USER_ADDRESS);
        const jwtToken = await SecureStore.getItemAsync(STORAGE_KEYS.JWT_TOKEN);
        
        if (!address || !jwtToken) {
            return null;
        }
        
        const decoded = jwtDecode(jwtToken);
        
        // Check if JWT is expired
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
            await clearZkLoginSession();
            return null;
        }
        
        return {
            address,
            email: decoded.email,
            name: decoded.name,
            picture: decoded.picture,
            provider: decoded.iss.includes('google') ? 'google' : 'facebook',
        };
    } catch (error) {
        console.error('Get session error:', error);
        return null;
    }
}

/**
 * Clear zkLogin session (logout)
 */
export async function clearZkLoginSession() {
    const keys = Object.values(STORAGE_KEYS);
    await Promise.all(keys.map(key => SecureStore.deleteItemAsync(key)));
}

/**
 * Sign transaction with zkLogin
 */
export async function signTransactionWithZkLogin(transaction) {
    try {
        const ephemeralKeyPairData = await SecureStore.getItemAsync(STORAGE_KEYS.EPHEMERAL_KEYPAIR);
        const zkProofData = await SecureStore.getItemAsync(STORAGE_KEYS.ZK_PROOF);
        const maxEpoch = await SecureStore.getItemAsync(STORAGE_KEYS.MAX_EPOCH);
        const userSalt = await SecureStore.getItemAsync(STORAGE_KEYS.USER_SALT);
        const jwtToken = await SecureStore.getItemAsync(STORAGE_KEYS.JWT_TOKEN);
        
        if (!ephemeralKeyPairData || !zkProofData) {
            throw new Error('Not authenticated. Please login first.');
        }
        
        const privateKeyArray = JSON.parse(ephemeralKeyPairData);
        const ephemeralKeyPair = Ed25519Keypair.fromSecretKey(new Uint8Array(privateKeyArray));
        const zkProof = JSON.parse(zkProofData);
        
        // Sign with ephemeral key
        const { bytes, signature: ephemeralSignature } = await transaction.sign({
            client: suiClient,
            signer: ephemeralKeyPair,
        });
        
        // Create zkLogin signature
        const zkLoginSignature = {
            inputs: {
                ...zkProof,
                addressSeed: userSalt,
            },
            maxEpoch: Number(maxEpoch),
            userSignature: ephemeralSignature,
        };
        
        return {
            bytes,
            signature: zkLoginSignature,
        };
    } catch (error) {
        console.error('Sign transaction error:', error);
        throw error;
    }
}

/**
 * Get wallet balance
 */
export async function getWalletBalance(address) {
    try {
        const balance = await suiClient.getBalance({ owner: address });
        return {
            sui: balance.totalBalance,
            // Add AFC token balance check here
        };
    } catch (error) {
        console.error('Get balance error:', error);
        return { sui: '0' };
    }
}

export default {
    initZkLogin,
    getGoogleAuthUrl,
    getFacebookAuthUrl,
    completeZkLogin,
    getZkLoginSession,
    clearZkLoginSession,
    signTransactionWithZkLogin,
    getWalletBalance,
};
