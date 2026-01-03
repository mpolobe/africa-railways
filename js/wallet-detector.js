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
                    return {
                        success: true,
                        address: accounts[0],
                        wallet: 'Sui Wallet',
                        message: '✅ Connected via Sui Wallet'
                    };
                }
            }

            // Try Suiet Wallet
            if (window.suiet) {
                const result = await window.suiet.connect();
                if (result && result.address) {
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
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WalletDeviceDetector;
}

// Make available globally
window.WalletDeviceDetector = WalletDeviceDetector;
