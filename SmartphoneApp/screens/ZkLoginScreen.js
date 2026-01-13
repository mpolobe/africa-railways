/**
 * zkLogin Authentication Screen
 * 
 * Allows users to login with Google or Facebook using SUI zkLogin
 * Creates a SUI wallet tied to their OAuth identity
 */

import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Image,
    Alert,
    Linking,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { TrainFront, Mail, Shield, Wallet } from 'lucide-react-native';
import zkLogin from '../services/zkLogin';

// Complete auth session for web browser
WebBrowser.maybeCompleteAuthSession();

export default function ZkLoginScreen({ onLoginSuccess }) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState('');
    const [nonce, setNonce] = useState(null);

    // Check for existing session on mount
    useEffect(() => {
        checkExistingSession();
    }, []);

    const checkExistingSession = async () => {
        try {
            const session = await zkLogin.getZkLoginSession();
            if (session) {
                onLoginSuccess(session);
            }
        } catch (error) {
            console.log('No existing session');
        }
    };

    const initializeLogin = async () => {
        try {
            setLoading(true);
            setStatus('Initializing secure login...');
            
            const { nonce: newNonce } = await zkLogin.initZkLogin();
            setNonce(newNonce);
            setStatus('Ready to authenticate');
            
            return newNonce;
        } catch (error) {
            Alert.alert('Error', 'Failed to initialize login. Please try again.');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setLoading(true);
            setStatus('Connecting to Google...');
            
            // Initialize if not already done
            const loginNonce = nonce || await initializeLogin();
            if (!loginNonce) return;
            
            // Get redirect URI
            const redirectUri = AuthSession.makeRedirectUri({
                scheme: 'africarailways',
                path: 'auth/callback',
            });
            
            // Open Google OAuth
            const authUrl = zkLogin.getGoogleAuthUrl(loginNonce, redirectUri);
            
            const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
            
            if (result.type === 'success') {
                // Extract JWT from URL fragment
                const url = new URL(result.url);
                const fragment = new URLSearchParams(url.hash.substring(1));
                const idToken = fragment.get('id_token');
                
                if (idToken) {
                    setStatus('Generating ZK proof...');
                    const user = await zkLogin.completeZkLogin(idToken);
                    
                    setStatus('Login successful!');
                    onLoginSuccess(user);
                }
            } else if (result.type === 'cancel') {
                setStatus('Login cancelled');
            }
        } catch (error) {
            Alert.alert('Login Error', error.message);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleFacebookLogin = async () => {
        try {
            setLoading(true);
            setStatus('Connecting to Facebook...');
            
            const loginNonce = nonce || await initializeLogin();
            if (!loginNonce) return;
            
            const redirectUri = AuthSession.makeRedirectUri({
                scheme: 'africarailways',
                path: 'auth/callback',
            });
            
            const authUrl = zkLogin.getFacebookAuthUrl(loginNonce, redirectUri);
            
            const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);
            
            if (result.type === 'success') {
                // Handle Facebook token
                const url = new URL(result.url);
                const fragment = new URLSearchParams(url.hash.substring(1));
                const accessToken = fragment.get('access_token');
                
                if (accessToken) {
                    // For Facebook, we need to exchange access token for ID token
                    // or use the access token to get user info
                    setStatus('Processing authentication...');
                    // Implementation depends on Facebook app configuration
                    Alert.alert('Info', 'Facebook login coming soon. Please use Google for now.');
                }
            }
        } catch (error) {
            Alert.alert('Login Error', error.message);
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handlePhoneLogin = async () => {
        // Phone-based login uses deterministic wallet from phone number
        // This is the USSD flow - redirect to phone input
        Alert.alert(
            'Phone Login',
            'For phone-based login, dial *384*26621# or enter your phone number to access your wallet.',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Continue', onPress: () => {
                    // Navigate to phone login screen
                    // This would use the deterministic wallet generation
                }}
            ]
        );
    };

    return (
        <View style={styles.container}>
            {/* Logo */}
            <View style={styles.logoContainer}>
                <View style={styles.logo}>
                    <TrainFront color="#FACC15" size={60} />
                </View>
                <Text style={styles.title}>AFRICA RAILWAYS</Text>
                <Text style={styles.subtitle}>Secure Blockchain Login</Text>
            </View>

            {/* Status */}
            {status ? (
                <View style={styles.statusContainer}>
                    {loading && <ActivityIndicator color="#FACC15" style={{ marginRight: 10 }} />}
                    <Text style={styles.statusText}>{status}</Text>
                </View>
            ) : null}

            {/* Login Options */}
            <View style={styles.loginOptions}>
                {/* Google Login */}
                <TouchableOpacity
                    style={[styles.loginButton, styles.googleButton]}
                    onPress={handleGoogleLogin}
                    disabled={loading}
                >
                    <Image
                        source={{ uri: 'https://www.google.com/favicon.ico' }}
                        style={styles.providerIcon}
                    />
                    <Text style={styles.loginButtonText}>Continue with Google</Text>
                </TouchableOpacity>

                {/* Facebook Login */}
                <TouchableOpacity
                    style={[styles.loginButton, styles.facebookButton]}
                    onPress={handleFacebookLogin}
                    disabled={loading}
                >
                    <Text style={styles.fbIcon}>f</Text>
                    <Text style={[styles.loginButtonText, { color: '#FFF' }]}>
                        Continue with Facebook
                    </Text>
                </TouchableOpacity>

                {/* Divider */}
                <View style={styles.divider}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or</Text>
                    <View style={styles.dividerLine} />
                </View>

                {/* Phone Login */}
                <TouchableOpacity
                    style={[styles.loginButton, styles.phoneButton]}
                    onPress={handlePhoneLogin}
                    disabled={loading}
                >
                    <Mail color="#1E293B" size={20} />
                    <Text style={styles.loginButtonText}>Login with Phone Number</Text>
                </TouchableOpacity>
            </View>

            {/* Security Info */}
            <View style={styles.securityInfo}>
                <Shield color="#94A3B8" size={16} />
                <Text style={styles.securityText}>
                    Secured by SUI zkLogin - Your identity stays private
                </Text>
            </View>

            {/* Wallet Info */}
            <View style={styles.walletInfo}>
                <Wallet color="#FACC15" size={16} />
                <Text style={styles.walletText}>
                    A SUI wallet will be created for your account
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0F172A',
        padding: 30,
        justifyContent: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logo: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#1E293B',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        borderWidth: 3,
        borderColor: '#FACC15',
    },
    title: {
        fontSize: 28,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 2,
    },
    subtitle: {
        fontSize: 14,
        color: '#94A3B8',
        marginTop: 8,
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 20,
        padding: 12,
        backgroundColor: '#1E293B',
        borderRadius: 10,
    },
    statusText: {
        color: '#FACC15',
        fontSize: 14,
    },
    loginOptions: {
        marginBottom: 30,
    },
    loginButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    googleButton: {
        backgroundColor: '#FFFFFF',
    },
    facebookButton: {
        backgroundColor: '#1877F2',
    },
    phoneButton: {
        backgroundColor: '#FACC15',
    },
    providerIcon: {
        width: 20,
        height: 20,
        marginRight: 12,
    },
    fbIcon: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginRight: 12,
    },
    loginButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1E293B',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 20,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#334155',
    },
    dividerText: {
        color: '#64748B',
        paddingHorizontal: 16,
        fontSize: 14,
    },
    securityInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    securityText: {
        color: '#94A3B8',
        fontSize: 12,
        marginLeft: 8,
    },
    walletInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    walletText: {
        color: '#FACC15',
        fontSize: 12,
        marginLeft: 8,
    },
});
