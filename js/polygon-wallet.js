/**
 * Polygon Wallet Connection Utility
 * 
 * Handles EVM wallet connections for:
 * - SENT IDO participation (Polygon Mainnet)
 * - AFRC token operations (Polygon Mainnet)
 * - Investor portal features
 * 
 * Note: This does NOT create wallets for users.
 * Users must have MetaMask or compatible EVM wallet installed.
 */

class PolygonWalletManager {
    constructor() {
        this.chainId = '0x89'; // Polygon Mainnet (137 in decimal)
        this.chainConfig = {
            chainId: '0x89',
            chainName: 'Polygon Mainnet',
            nativeCurrency: {
                name: 'MATIC',
                symbol: 'MATIC',
                decimals: 18
            },
            rpcUrls: ['https://polygon-rpc.com/', 'https://rpc-mainnet.matic.network'],
            blockExplorerUrls: ['https://polygonscan.com/']
        };
        this.sessionKey = 'arail_polygon_session';
        this.connectedAddress = null;
        this.isConnected = false;
    }

    /**
     * Check if MetaMask or compatible wallet is installed
     */
    isWalletInstalled() {
        return typeof window.ethereum !== 'undefined';
    }

    /**
     * Get current chain ID
     */
    async getCurrentChainId() {
        if (!this.isWalletInstalled()) return null;
        try {
            return await window.ethereum.request({ method: 'eth_chainId' });
        } catch (error) {
            console.error('Failed to get chain ID:', error);
            return null;
        }
    }

    /**
     * Check if currently on Polygon network
     */
    async isOnPolygon() {
        const chainId = await this.getCurrentChainId();
        return chainId === this.chainId;
    }

    /**
     * Switch to Polygon network
     * Prompts user to switch or add Polygon if not present
     */
    async switchToPolygon() {
        if (!this.isWalletInstalled()) {
            return {
                success: false,
                error: 'NO_WALLET',
                message: 'Please install MetaMask or a compatible EVM wallet to participate.'
            };
        }

        try {
            // Try to switch to Polygon
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: this.chainId }]
            });

            return {
                success: true,
                message: 'Switched to Polygon network'
            };
        } catch (error) {
            // Chain not added to wallet - add it
            if (error.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [this.chainConfig]
                    });
                    return {
                        success: true,
                        message: 'Polygon network added and switched'
                    };
                } catch (addError) {
                    return {
                        success: false,
                        error: 'ADD_CHAIN_FAILED',
                        message: 'Failed to add Polygon network. Please add it manually in your wallet.'
                    };
                }
            }

            // User rejected the switch
            if (error.code === 4001) {
                return {
                    success: false,
                    error: 'USER_REJECTED',
                    message: 'Please switch to Polygon network to continue.'
                };
            }

            return {
                success: false,
                error: 'SWITCH_FAILED',
                message: error.message || 'Failed to switch network'
            };
        }
    }

    /**
     * Connect wallet and ensure on Polygon network
     */
    async connect() {
        if (!this.isWalletInstalled()) {
            return {
                success: false,
                error: 'NO_WALLET',
                message: 'Please install MetaMask or a compatible EVM wallet.',
                installUrl: 'https://metamask.io/download/'
            };
        }

        try {
            // Request account access
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });

            if (!accounts || accounts.length === 0) {
                return {
                    success: false,
                    error: 'NO_ACCOUNTS',
                    message: 'No accounts found. Please unlock your wallet.'
                };
            }

            // Switch to Polygon if not already
            const switchResult = await this.switchToPolygon();
            if (!switchResult.success) {
                return switchResult;
            }

            this.connectedAddress = accounts[0];
            this.isConnected = true;

            // Save session
            this.saveSession({
                address: accounts[0],
                timestamp: Date.now()
            });

            // Set up event listeners
            this.setupEventListeners();

            return {
                success: true,
                address: accounts[0],
                network: 'Polygon',
                message: '✅ Connected to Polygon wallet'
            };
        } catch (error) {
            if (error.code === 4001) {
                return {
                    success: false,
                    error: 'USER_REJECTED',
                    message: 'Connection request was rejected.'
                };
            }

            return {
                success: false,
                error: 'CONNECTION_FAILED',
                message: error.message || 'Failed to connect wallet'
            };
        }
    }

    /**
     * Set up wallet event listeners
     */
    setupEventListeners() {
        if (!this.isWalletInstalled()) return;

        // Account changed
        window.ethereum.on('accountsChanged', (accounts) => {
            if (accounts.length === 0) {
                this.disconnect();
                this.dispatchEvent('walletDisconnected');
            } else {
                this.connectedAddress = accounts[0];
                this.saveSession({ address: accounts[0], timestamp: Date.now() });
                this.dispatchEvent('accountChanged', { address: accounts[0] });
            }
        });

        // Chain changed
        window.ethereum.on('chainChanged', (chainId) => {
            if (chainId !== this.chainId) {
                this.dispatchEvent('networkChanged', { 
                    chainId, 
                    isPolygon: false,
                    message: 'Please switch back to Polygon network'
                });
            } else {
                this.dispatchEvent('networkChanged', { 
                    chainId, 
                    isPolygon: true 
                });
            }
        });
    }

    /**
     * Dispatch custom events for UI updates
     */
    dispatchEvent(eventName, detail = {}) {
        window.dispatchEvent(new CustomEvent(`polygon:${eventName}`, { detail }));
    }

    /**
     * Disconnect wallet
     */
    disconnect() {
        this.connectedAddress = null;
        this.isConnected = false;
        this.clearSession();
        return { success: true, message: 'Wallet disconnected' };
    }

    /**
     * Get connected address
     */
    getAddress() {
        return this.connectedAddress;
    }

    /**
     * Get shortened address for display
     */
    getShortAddress() {
        if (!this.connectedAddress) return null;
        return `${this.connectedAddress.slice(0, 6)}...${this.connectedAddress.slice(-4)}`;
    }

    /**
     * Save session to localStorage
     */
    saveSession(session) {
        try {
            localStorage.setItem(this.sessionKey, JSON.stringify(session));
        } catch (error) {
            console.warn('Failed to save Polygon session:', error);
        }
    }

    /**
     * Get saved session
     */
    getSavedSession() {
        try {
            const data = localStorage.getItem(this.sessionKey);
            if (data) {
                const session = JSON.parse(data);
                // Session valid for 24 hours
                if (Date.now() - session.timestamp < 24 * 60 * 60 * 1000) {
                    return session;
                }
                this.clearSession();
            }
        } catch (error) {
            console.warn('Failed to get Polygon session:', error);
        }
        return null;
    }

    /**
     * Clear session
     */
    clearSession() {
        try {
            localStorage.removeItem(this.sessionKey);
        } catch (error) {
            console.warn('Failed to clear Polygon session:', error);
        }
    }

    /**
     * Auto-connect if session exists
     */
    async autoConnect() {
        const session = this.getSavedSession();
        if (!session) return null;

        if (!this.isWalletInstalled()) {
            this.clearSession();
            return null;
        }

        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0 && accounts[0].toLowerCase() === session.address.toLowerCase()) {
                this.connectedAddress = accounts[0];
                this.isConnected = true;
                this.setupEventListeners();

                // Check if on Polygon
                const onPolygon = await this.isOnPolygon();

                return {
                    success: true,
                    address: accounts[0],
                    network: onPolygon ? 'Polygon' : 'Other',
                    needsNetworkSwitch: !onPolygon,
                    message: onPolygon ? '✅ Reconnected to Polygon' : '⚠️ Please switch to Polygon network'
                };
            }
        } catch (error) {
            console.warn('Auto-connect failed:', error);
        }

        this.clearSession();
        return null;
    }

    /**
     * Get MATIC balance
     */
    async getMaticBalance() {
        if (!this.connectedAddress) return null;

        try {
            const balance = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [this.connectedAddress, 'latest']
            });
            // Convert from wei to MATIC
            return parseInt(balance, 16) / 1e18;
        } catch (error) {
            console.error('Failed to get MATIC balance:', error);
            return null;
        }
    }

    /**
     * Get ERC-20 token balance (for SENT, AFRC, etc.)
     */
    async getTokenBalance(tokenAddress) {
        if (!this.connectedAddress) return null;

        try {
            // ERC-20 balanceOf function signature
            const data = '0x70a08231' + this.connectedAddress.slice(2).padStart(64, '0');

            const result = await window.ethereum.request({
                method: 'eth_call',
                params: [{
                    to: tokenAddress,
                    data: data
                }, 'latest']
            });

            return parseInt(result, 16);
        } catch (error) {
            console.error('Failed to get token balance:', error);
            return null;
        }
    }

    /**
     * Generate network status HTML for UI
     */
    getNetworkStatusHTML() {
        const isInstalled = this.isWalletInstalled();
        
        if (!isInstalled) {
            return `
                <div class="network-status network-status--warning">
                    <span class="network-status__icon">⚠️</span>
                    <span class="network-status__text">No EVM wallet detected</span>
                    <a href="https://metamask.io/download/" target="_blank" class="network-status__link">Install MetaMask</a>
                </div>
            `;
        }

        if (!this.isConnected) {
            return `
                <div class="network-status network-status--disconnected">
                    <span class="network-status__icon">🔌</span>
                    <span class="network-status__text">Wallet not connected</span>
                </div>
            `;
        }

        return `
            <div class="network-status network-status--connected">
                <span class="network-status__icon">🟣</span>
                <span class="network-status__text">Polygon: ${this.getShortAddress()}</span>
            </div>
        `;
    }
}

// Create global instance
window.PolygonWallet = new PolygonWalletManager();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PolygonWalletManager;
}
