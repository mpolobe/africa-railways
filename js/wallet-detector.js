/**
 * Wallet Connection Device Detector
 * Routes users to appropriate wallet interface based on device type
 * - Desktop: Chrome extension wallets (Sui Wallet, Suiet, etc.)
 * - Mobile/Tablet: Slush Wallet web app (my.slush.app)
 */

class WalletDeviceDetector {
    constructor() {
        this.isMobile = this.detectMobile();
        this.isTablet = this.detectTablet();
        this.isIOS = this.detectIOS();
        this.isAndroid = this.detectAndroid();
        this.slushAppUrl = 'https://my.slush.app';
        this.walletSessionKey = 'arail_wallet_session';
    }

    /**
     * Detect if device is mobile phone
     */
    detectMobile() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    }

    /**
     * Detect if device is tablet (iPad, Android tablet)
     */
    detectTablet() {
        const userAgent = navigator.userAgent || navigator.vendor || window.opera;
        return /ipad|android(?!.*mobile)/i.test(userAgent.toLowerCase());
    }

    /**
     * Detect if device is iOS
     */
    detectIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }

    /**
     * Detect if device is Android
     */
    detectAndroid() {
        return /android/i.test(navigator.userAgent);
    }

    /**
     * Check if device supports Chrome extensions
     */
    supportsExtensions() {
        return !this.isMobile && !this.isTablet;
    }

    /**
     * Get recommended wallet connection method
     */
    getRecommendedMethod() {
        if (this.isMobile || this.isTablet) {
            return {
                type: 'webapp',
                name: 'Slush Wallet',
                url: this.slushAppUrl,
                instruction: 'Use Slush web wallet (works on mobile & tablet)'
            };
        } else {
            return {
                type: 'extension',
                name: 'Sui Wallet / Suiet / Martian',
                url: 'https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil',
                instruction: 'Install Chrome extension for desktop'
            };
        }
    }

    /**
     * Connect to appropriate wallet based on device
     */
    async connectWallet() {
        const method = this.getRecommendedMethod();

        if (method.type === 'webapp') {
            // Mobile/Tablet: Redirect to Slush web app
            return this.connectSlushWallet();
        } else {
            // Desktop: Try extension wallets
            return this.connectExtensionWallet();
        }
    }

    /**
     * Connect via Slush Wallet (mobile/tablet)
     */
    async connectSlushWallet() {
        try {
            // Check if already logged into Slush
            if (window.slush && window.slush.isConnected) {
                const account = await window.slush.getAccount();
                this.saveWalletSession({
                    address: account.address,
                    wallet: 'Slush',
                    timestamp: Date.now()
                });
                return {
                    success: true,
                    address: account.address,
                    wallet: 'Slush',
                    message: '✅ Connected via Slush Wallet'
                };
            }

            // Redirect to Slush app with return URL
            const returnUrl = encodeURIComponent(window.location.href);
            const slushConnectUrl = `${this.slushAppUrl}/connect?return=${returnUrl}&app=arail`;
            
            // Show confirmation before redirect
            if (confirm('You will be redirected to Slush Wallet. Continue?')) {
                window.location.href = slushConnectUrl;
                return {
                    success: false,
                    message: 'Redirecting to Slush Wallet...'
                };
            } else {
                return {
                    success: false,
                    message: 'Connection cancelled'
                };
            }
        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: '❌ Failed to connect to Slush Wallet'
            };
        }
    }

    /**
     * Connect via Chrome extension wallet (desktop)
     */
    async connectExtensionWallet() {
        try {
            // Try Sui Wallet
            if (typeof window.suiWallet !== 'undefined') {
                const accounts = await window.suiWallet.requestPermissions();
                if (accounts && accounts.length > 0) {
                    const address = accounts[0];
                    this.saveWalletSession({
                        address: address,
                        wallet: 'Sui Wallet',
                        timestamp: Date.now()
                    });
                    return {
                        success: true,
                        address: address,
                        wallet: 'Sui Wallet',
                        message: '✅ Connected via Sui Wallet'
                    };
                }
            }

            // Try Suiet Wallet
            if (window.suiet) {
                const result = await window.suiet.connect();
                if (result && result.address) {
                    this.saveWalletSession({
                        address: result.address,
                        wallet: 'Suiet',
                        timestamp: Date.now()
                    });
                    return {
                        success: true,
                        address: result.address,
                        wallet: 'Suiet',
                        message: '✅ Connected via Suiet'
                    };
                }
            }

            // Try Martian Wallet
            if (window.martian) {
                const result = await window.martian.connect();
                if (result && result.address) {
                    this.saveWalletSession({
                        address: result.address,
                        wallet: 'Martian',
                        timestamp: Date.now()
                    });
                    return {
                        success: true,
                        address: result.address,
                        wallet: 'Martian',
                        message: '✅ Connected via Martian'
                    };
                }
            }

            // No wallet detected - prompt installation
            return this.promptExtensionInstall();

        } catch (error) {
            return {
                success: false,
                error: error.message,
                message: '❌ Failed to connect wallet'
            };
        }
    }

    /**
     * Prompt user to install Chrome extension
     */
    promptExtensionInstall() {
        const message = '⚠️ No Sui wallet detected. Please install Sui Wallet, Suiet, or Martian wallet extension.';
        
        if (confirm(message + '\n\nWould you like to install one now?')) {
            window.open('https://chrome.google.com/webstore/detail/sui-wallet/opcgpfmipidbgpenhmajoajpbobppdil', '_blank');
        }

        return {
            success: false,
            message: message
        };
    }

    /**
     * Show device-appropriate connection instructions
     */
    showConnectionInstructions() {
        const method = this.getRecommendedMethod();
        const deviceType = this.isMobile ? 'Mobile Phone' : this.isTablet ? 'Tablet' : 'Desktop';

        return `
            <div class="wallet-instructions">
                <h3>Connect Your Wallet</h3>
                <p><strong>Device:</strong> ${deviceType}</p>
                <p><strong>Recommended:</strong> ${method.name}</p>
                <p>${method.instruction}</p>
            </div>
        `;
    }

    /**
     * Check for wallet address in URL parameters (return from Slush)
     */
    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const address = urlParams.get('address');
        const wallet = urlParams.get('wallet');
        const connected = urlParams.get('connected');
        
        if (address && connected === 'true') {
            // Store wallet session
            this.saveWalletSession({
                address: address,
                wallet: wallet || 'Slush',
                timestamp: Date.now()
            });
            
            // Clean up URL parameters for better UX
            const cleanUrl = window.location.origin + window.location.pathname;
            window.history.replaceState({}, document.title, cleanUrl);
            
            return {
                success: true,
                address: address,
                wallet: wallet || 'Slush',
                message: '✅ Connected via Slush Wallet'
            };
        }
        
        return null;
    }

    /**
     * Save wallet session to localStorage
     */
    saveWalletSession(session) {
        try {
            localStorage.setItem(this.walletSessionKey, JSON.stringify(session));
        } catch (error) {
            console.warn('Failed to save wallet session:', error);
        }
    }

    /**
     * Get saved wallet session from localStorage
     */
    getSavedSession() {
        try {
            const sessionData = localStorage.getItem(this.walletSessionKey);
            if (sessionData) {
                const session = JSON.parse(sessionData);
                // Check if session is less than 24 hours old
                const isValid = (Date.now() - session.timestamp) < (24 * 60 * 60 * 1000);
                if (isValid) {
                    return session;
                } else {
                    // Clear expired session
                    this.clearWalletSession();
                }
            }
        } catch (error) {
            console.warn('Failed to retrieve wallet session:', error);
        }
        return null;
    }

    /**
     * Clear wallet session from localStorage
     */
    clearWalletSession() {
        try {
            localStorage.removeItem(this.walletSessionKey);
        } catch (error) {
            console.warn('Failed to clear wallet session:', error);
        }
    }

    /**
     * Auto-connect wallet if session exists or URL params present
     */
    async autoConnect() {
        // First check URL parameters (return from Slush)
        const urlResult = this.checkUrlParams();
        if (urlResult) {
            return urlResult;
        }

        // Then check saved session
        const savedSession = this.getSavedSession();
        if (savedSession) {
            // Verify the wallet is still connected
            try {
                if (this.isMobile || this.isTablet) {
                    // For mobile/tablet, check if Slush is still connected
                    if (window.slush && window.slush.isConnected) {
                        const account = await window.slush.getAccount();
                        if (account && account.address === savedSession.address) {
                            return {
                                success: true,
                                address: savedSession.address,
                                wallet: savedSession.wallet,
                                message: '✅ Reconnected to saved session'
                            };
                        }
                    }
                } else {
                    // For desktop, try to reconnect to extension wallet
                    // This would require checking the specific wallet provider
                    return {
                        success: true,
                        address: savedSession.address,
                        wallet: savedSession.wallet,
                        message: '✅ Reconnected to saved session'
                    };
                }
            } catch (error) {
                console.warn('Failed to auto-reconnect:', error);
                // Clear invalid session
                this.clearWalletSession();
            }
        }

        return null;
    }

    /**
     * Disconnect wallet and clear session
     */
    disconnect() {
        this.clearWalletSession();
        return {
            success: true,
            message: 'Wallet disconnected'
        };
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WalletDeviceDetector;
}

// Make available globally
window.WalletDeviceDetector = WalletDeviceDetector;
