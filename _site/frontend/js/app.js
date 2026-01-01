/**
 * Africa Railways - Frontend Application Logic
 * Handles ticket booking, WebSocket connections, and UI interactions
 * Optimized for iPad touch interface with immediate visual feedback
 */

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    BACKEND_URL: 'https://api.africarailways.com',
    WEBSOCKET_URL: 'wss://api.africarailways.com/ws',
    RECONNECT_INTERVAL: 3000,
    BUTTON_RESET_DELAY: 2000
};

// ============================================================================
// WEBSOCKET CONNECTION
// ============================================================================

let ws = null;
let reconnectTimer = null;

/**
 * Initialize WebSocket connection for real-time event updates
 */
function initWebSocket() {
    try {
        ws = new WebSocket(CONFIG.WEBSOCKET_URL);
        
        ws.onopen = () => {
            console.log('✅ WebSocket connected');
            updateConnectionStatus(true);
            clearTimeout(reconnectTimer);
        };
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            } catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            updateConnectionStatus(false);
        };
        
        ws.onclose = () => {
            console.log('❌ WebSocket disconnected');
            updateConnectionStatus(false);
            scheduleReconnect();
        };
    } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
        updateConnectionStatus(false);
        scheduleReconnect();
    }
}

/**
 * Schedule WebSocket reconnection attempt
 */
function scheduleReconnect() {
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(() => {
        console.log('🔄 Attempting to reconnect WebSocket...');
        initWebSocket();
    }, CONFIG.RECONNECT_INTERVAL);
}

/**
 * Update connection status indicator in UI
 */
function updateConnectionStatus(connected) {
    const statusElement = document.getElementById('ws-status');
    if (statusElement) {
        if (connected) {
            statusElement.innerHTML = '<span class="pulse-green">●</span> Connected';
            statusElement.style.color = '#10b981';
        } else {
            statusElement.innerHTML = '<span class="pulse-red">●</span> Disconnected';
            statusElement.style.color = '#ef4444';
        }
    }
}

/**
 * Handle incoming WebSocket messages
 */
function handleWebSocketMessage(data) {
    console.log('📨 Received event:', data);
    
    // Add to live feed if element exists
    const liveFeed = document.getElementById('live-feed');
    if (liveFeed) {
        addEventToFeed(data);
    }
    
    // Update wallet balance if ticket was purchased
    if (data.message && data.message.includes('Ticket Booked')) {
        updateWalletBalance(-50); // Deduct ticket cost
    }
}

/**
 * Add event to live feed display
 */
function addEventToFeed(event) {
    const liveFeed = document.getElementById('live-feed');
    if (!liveFeed) return;
    
    // Remove "waiting for events" message if present
    const placeholder = liveFeed.querySelector('p[style*="color: #666"]');
    if (placeholder) {
        placeholder.remove();
    }
    
    const eventElement = document.createElement('div');
    eventElement.className = 'event-item';
    eventElement.style.cssText = `
        padding: 12px;
        margin-bottom: 8px;
        background: rgba(0, 212, 255, 0.1);
        border-left: 3px solid var(--accent);
        border-radius: 4px;
        animation: slideIn 0.3s ease-out;
    `;
    
    const timestamp = new Date(event.timestamp || Date.now()).toLocaleTimeString();
    eventElement.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: start;">
            <span style="flex: 1;">${event.message || 'Unknown event'}</span>
            <small style="color: #888; margin-left: 10px;">${timestamp}</small>
        </div>
    `;
    
    // Add to top of feed
    liveFeed.insertBefore(eventElement, liveFeed.firstChild);
    
    // Limit feed to 50 items
    while (liveFeed.children.length > 50) {
        liveFeed.removeChild(liveFeed.lastChild);
    }
}

// ============================================================================
// TICKET BOOKING
// ============================================================================

/**
 * Book a ticket - sends request to backend and provides visual feedback
 * Optimized for iPad touch interface with wallet integration
 */
async function bookTicket() {
    const routeSelect = document.getElementById('route');
    const routeName = routeSelect ? routeSelect.options[routeSelect.selectedIndex].text : 'Selected Route';
    const balanceDisplay = document.getElementById('wallet-balance');
    const bookingBtn = document.querySelector('button[onclick="bookTicket()"]');

    // 1. Check if user can afford it
    if (currentBalance < TICKET_PRICE) {
        alert("Insufficient AFRC! Please top up your Sovereign Wallet.");
        bookingBtn.style.borderColor = "#ef4444";
        bookingBtn.style.color = "#ef4444";
        bookingBtn.innerText = "❌ Insufficient Balance";
        
        setTimeout(() => {
            bookingBtn.style.borderColor = "";
            bookingBtn.style.color = "";
            bookingBtn.innerText = "Confirm Booking";
        }, CONFIG.BUTTON_RESET_DELAY);
        return;
    }

    // Provide immediate visual feedback
    bookingBtn.disabled = true;
    bookingBtn.innerText = "Authorizing AFRC...";

    const payload = {
        message: `🎟️ Ticket Confirmed: ${routeName} - 50 AFRC Deducted`
    };

    try {
        // Send the request to Go Engine
        const response = await fetch(`${CONFIG.BACKEND_URL}/add-event`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            // 2. Deduct the 50 AFRC from the local state
            currentBalance -= TICKET_PRICE;
            walletState.balance = currentBalance; // Keep in sync
            
            // 3. Update the UI
            if (balanceDisplay) {
                balanceDisplay.innerText = currentBalance;
                
                // Add animation
                balanceDisplay.style.transition = 'transform 0.2s ease';
                balanceDisplay.style.transform = 'scale(1.1)';
                setTimeout(() => {
                    balanceDisplay.style.transform = 'scale(1)';
                }, 200);
            }
            
            // Add transaction to UI display
            addTransactionUI('debit', TICKET_PRICE);
            
            // Also add to persistent storage
            addTransaction('debit', TICKET_PRICE, `Ticket: ${routeName}`);
            
            // Success feedback
            bookingBtn.style.borderColor = "#10b981";
            bookingBtn.style.color = "#10b981";
            bookingBtn.innerText = "✅ Paid 50 AFRC";
            
            showNotification(
                `Ticket booked! Balance: ${currentBalance} AFRC`,
                'success'
            );
            
            setTimeout(() => {
                bookingBtn.disabled = false;
                bookingBtn.style.borderColor = "";
                bookingBtn.style.color = "";
                bookingBtn.innerText = "Confirm Booking";
            }, CONFIG.BUTTON_RESET_DELAY);
        } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error("Booking failed:", error);
        bookingBtn.style.borderColor = "#ef4444";
        bookingBtn.style.color = "#ef4444";
        bookingBtn.innerText = "❌ Transaction Failed";
        
        showNotification('Booking failed. Please try again.', 'error');
        
        setTimeout(() => {
            bookingBtn.disabled = false;
            bookingBtn.style.borderColor = "";
            bookingBtn.style.color = "";
            bookingBtn.innerText = "Confirm Booking";
        }, CONFIG.BUTTON_RESET_DELAY);
    }
}

// ============================================================================
// TICKET SIMULATION (for testing)
// ============================================================================

/**
 * Simulate a ticket purchase - useful for testing the full flow
 */
async function simulateTicket() {
    // Check wallet balance
    if (walletState.balance < TICKET_PRICE) {
        showNotification(
            `Insufficient balance! Need ${TICKET_PRICE} AFRC, have ${walletState.balance} AFRC`,
            'error'
        );
        return;
    }

    const payload = {
        message: `🎟️ Test Ticket Purchase - Lusaka → Johannesburg (${TICKET_PRICE} AFRC)`
    };

    try {
        const response = await fetch(`${CONFIG.BACKEND_URL}/add-event`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            // Deduct from wallet
            currentBalance -= TICKET_PRICE;
            walletState.balance = currentBalance;
            
            // Update balance display
            const balanceDisplay = document.getElementById('wallet-balance');
            if (balanceDisplay) {
                balanceDisplay.innerText = currentBalance;
            }
            
            // Add transaction to UI
            addTransactionUI('debit', TICKET_PRICE);
            
            // Add to persistent storage
            addTransaction('debit', TICKET_PRICE, 'Test Ticket - Lusaka → Johannesburg');
            
            console.log('✅ Ticket simulation successful');
            showNotification(
                `Test ticket purchased! Balance: ${currentBalance} AFRC`,
                'success'
            );
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        console.error('Simulation failed:', error);
        showNotification('Simulation failed', 'error');
    }
}

// ============================================================================
// WALLET MANAGEMENT
// ============================================================================

const WALLET_STORAGE_KEY = 'africa_railways_wallet';
const TICKET_PRICE = 50; // AFRC per ticket (Africoin standard rate)
const INITIAL_BALANCE = 1250;

// Simple global balance for immediate access
let currentBalance = INITIAL_BALANCE;

// Transaction log for UI display (last 5 transactions)
let transactions = [];

// Wallet state with localStorage persistence
let walletState = {
    balance: INITIAL_BALANCE,
    transactions: [],
    lastSync: null
};

/**
 * Initialize wallet from localStorage or defaults
 */
function initWallet() {
    const stored = localStorage.getItem(WALLET_STORAGE_KEY);
    if (stored) {
        try {
            walletState = JSON.parse(stored);
            currentBalance = walletState.balance; // Sync global variable
            console.log('💰 Wallet loaded from storage:', currentBalance, 'AFRC');
        } catch (error) {
            console.error('Failed to parse wallet data, using defaults');
            saveWallet();
        }
    } else {
        saveWallet();
    }
    updateWalletDisplay();
    updateTransactionHistoryDisplay();
}

/**
 * Save wallet state to localStorage
 */
function saveWallet() {
    walletState.lastSync = new Date().toISOString();
    localStorage.setItem(WALLET_STORAGE_KEY, JSON.stringify(walletState));
}

/**
 * Add transaction to wallet history
 */
function addTransaction(type, amount, description) {
    const transaction = {
        id: Date.now(),
        type, // 'debit' or 'credit'
        amount,
        description,
        timestamp: new Date().toISOString(),
        balanceAfter: walletState.balance
    };
    
    walletState.transactions.unshift(transaction);
    
    // Keep only last 100 transactions
    if (walletState.transactions.length > 100) {
        walletState.transactions = walletState.transactions.slice(0, 100);
    }
    
    saveWallet();
    
    // Update the transaction history display
    updateTransactionHistoryDisplay();
    
    return transaction;
}

/**
 * Add transaction to UI display
 * Simpler implementation that keeps last 5 transactions
 */
function addTransactionUI(type, amount) {
    const historyList = document.getElementById('transaction-history');
    if (!historyList) return;
    
    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Create transaction object
    const tx = {
        type: type, // 'credit' or 'debit'
        amount: amount,
        time: timestamp
    };
    
    transactions.unshift(tx); // Add to start of array
    if (transactions.length > 5) transactions.pop(); // Keep only last 5

    // Render the list
    historyList.innerHTML = transactions.map(t => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.9rem;">
            <div>
                <span style="display: block; font-weight: 500;">${t.type === 'credit' ? 'Wallet Top-Up' : 'Railway Ticket'}</span>
                <span style="font-size: 0.7rem; opacity: 0.5;">${t.time}</span>
            </div>
            <span style="color: ${t.type === 'credit' ? '#10b981' : '#f87171'}; font-weight: bold;">
                ${t.type === 'credit' ? '+' : '-'}${t.amount} AFRC
            </span>
        </div>
    `).join('');
}

/**
 * Update the transaction history display (legacy support)
 */
function updateTransactionHistoryDisplay() {
    const historyContainer = document.getElementById('transaction-history');
    if (!historyContainer) return;
    
    // If we have the simple transactions array, use it
    if (transactions.length > 0) {
        historyContainer.innerHTML = transactions.map(t => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 0.9rem;">
                <div>
                    <span style="display: block; font-weight: 500;">${t.type === 'credit' ? 'Wallet Top-Up' : 'Railway Ticket'}</span>
                    <span style="font-size: 0.7rem; opacity: 0.5;">${t.time}</span>
                </div>
                <span style="color: ${t.type === 'credit' ? '#10b981' : '#f87171'}; font-weight: bold;">
                    ${t.type === 'credit' ? '+' : '-'}${t.amount} AFRC
                </span>
            </div>
        `).join('');
        return;
    }
    
    // Fallback to walletState transactions
    const recentTransactions = walletState.transactions.slice(0, 5);
    
    if (recentTransactions.length === 0) {
        historyContainer.innerHTML = '<div style="text-align: center; color: #666; padding: 20px;">No transactions yet</div>';
        return;
    }
    
    historyContainer.innerHTML = recentTransactions.map(t => {
        const date = new Date(t.timestamp);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const isDebit = t.type === 'debit';
        const icon = isDebit ? '−' : '+';
        const color = isDebit ? '#ef4444' : '#10b981';
        
        return `
            <div style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid rgba(255,255,255,0.05);
            ">
                <div style="flex: 1;">
                    <div style="font-size: 0.9rem; margin-bottom: 2px;">
                        ${t.description}
                    </div>
                    <div style="font-size: 0.75rem; color: #888;">
                        ${timeStr}
                    </div>
                </div>
                <div style="
                    font-weight: bold;
                    color: ${color};
                    font-size: 1rem;
                    margin-left: 10px;
                ">
                    ${icon}${t.amount}
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Deduct amount from wallet (for ticket purchases)
 */
function deductFromWallet(amount, description) {
    if (walletState.balance < amount) {
        showNotification('Insufficient balance! Please top up.', 'error');
        return false;
    }
    
    walletState.balance -= amount;
    addTransaction('debit', amount, description);
    updateWalletDisplay();
    saveWallet();
    
    console.log(`💸 Deducted ${amount} AFRC. New balance: ${walletState.balance}`);
    return true;
}

/**
 * Add amount to wallet (for top-ups)
 */
function addToWallet(amount, description) {
    walletState.balance += amount;
    addTransaction('credit', amount, description);
    updateWalletDisplay();
    saveWallet();
    
    console.log(`💰 Added ${amount} AFRC. New balance: ${walletState.balance}`);
    showNotification(`+${amount} AFRC added to wallet`, 'success');
}

/**
 * Update wallet balance display in UI
 */
function updateWalletDisplay() {
    // Update main balance display with ID
    const balanceSpan = document.getElementById('wallet-balance');
    if (balanceSpan) {
        balanceSpan.textContent = walletState.balance.toLocaleString();
        
        // Add animation
        balanceSpan.style.transition = 'transform 0.2s ease';
        balanceSpan.style.transform = 'scale(1.1)';
        setTimeout(() => {
            balanceSpan.style.transform = 'scale(1)';
        }, 200);
    }
    
    // Fallback: Update balance in h1 if using old structure
    const balanceElement = document.querySelector('.balance h1');
    if (balanceElement && !balanceSpan) {
        balanceElement.innerHTML = `${walletState.balance.toLocaleString()} <span style="color:var(--accent)">AFRC</span>`;
        
        balanceElement.style.transition = 'transform 0.2s ease';
        balanceElement.style.transform = 'scale(1.1)';
        setTimeout(() => {
            balanceElement.style.transform = 'scale(1)';
        }, 200);
    }
    
    // Update balance in other locations if they exist
    document.querySelectorAll('[data-wallet-balance]').forEach(el => {
        el.textContent = `${walletState.balance.toLocaleString()} AFRC`;
    });
}

/**
 * Check wallet status and display transaction history
 */
function checkStatus() {
    console.log('💰 Wallet Status:', {
        balance: walletState.balance,
        transactions: walletState.transactions.length,
        lastSync: walletState.lastSync
    });
    
    showTransactionHistory();
}

/**
 * Display transaction history in a modal
 */
function showTransactionHistory() {
    // Remove existing modal if present
    const existingModal = document.getElementById('transaction-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'transaction-modal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        animation: fadeIn 0.3s ease;
    `;
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = `
        background: var(--card-bg);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 12px;
        padding: 30px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    `;
    
    const transactions = walletState.transactions.slice(0, 20);
    
    modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: var(--accent); margin: 0;">💳 Transaction History</h2>
            <button onclick="document.getElementById('transaction-modal').remove()" 
                    style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer;">
                ✕
            </button>
        </div>
        
        <div style="background: rgba(96,165,250,0.1); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <div style="font-size: 0.9rem; color: #888;">Current Balance</div>
            <div style="font-size: 2rem; color: var(--accent); font-weight: bold;">
                ${walletState.balance.toLocaleString()} AFRC
            </div>
        </div>
        
        ${transactions.length === 0 ? `
            <p style="text-align: center; color: #888; padding: 40px 0;">
                No transactions yet
            </p>
        ` : `
            <div style="display: flex; flex-direction: column; gap: 10px;">
                ${transactions.map(t => {
                    const date = new Date(t.timestamp);
                    const isDebit = t.type === 'debit';
                    return `
                        <div style="
                            background: ${isDebit ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)'};
                            border-left: 3px solid ${isDebit ? '#ef4444' : '#10b981'};
                            padding: 12px;
                            border-radius: 4px;
                        ">
                            <div style="display: flex; justify-content: space-between; align-items: start;">
                                <div style="flex: 1;">
                                    <div style="font-weight: 500; margin-bottom: 4px;">
                                        ${t.description}
                                    </div>
                                    <div style="font-size: 0.85rem; color: #888;">
                                        ${date.toLocaleDateString()} ${date.toLocaleTimeString()}
                                    </div>
                                </div>
                                <div style="text-align: right;">
                                    <div style="
                                        font-size: 1.2rem;
                                        font-weight: bold;
                                        color: ${isDebit ? '#ef4444' : '#10b981'};
                                    ">
                                        ${isDebit ? '−' : '+'} ${t.amount} AFRC
                                    </div>
                                    <div style="font-size: 0.85rem; color: #888;">
                                        Balance: ${t.balanceAfter}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        `}
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.1);">
            <button onclick="resetWallet()" class="btn" style="width: 100%; background: rgba(239,68,68,0.2); color: #ef4444; border: 1px solid #ef4444;">
                🔄 Reset Wallet (Testing)
            </button>
        </div>
    `;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);
    
    // Close on background click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

/**
 * Top up wallet - Self-service for simulation/testing phase
 * Allows user to instantly add AFRC to continue testing
 * 
 * In production, this would integrate with payment gateways,
 * but for now it's a direct mint for testing purposes.
 */
async function topUp() {
    const balanceDisplay = document.getElementById('wallet-balance');
    const TOP_UP_AMOUNT = 500;

    // 1. Update the local wallet balance
    currentBalance += TOP_UP_AMOUNT;
    walletState.balance = currentBalance;
    
    if (balanceDisplay) {
        balanceDisplay.innerText = currentBalance;
        
        // Add animation
        balanceDisplay.style.transition = 'transform 0.2s ease';
        balanceDisplay.style.transform = 'scale(1.1)';
        setTimeout(() => {
            balanceDisplay.style.transform = 'scale(1)';
        }, 200);
    }
    
    // Add transaction to UI display
    addTransactionUI('credit', TOP_UP_AMOUNT);
    
    // Record transaction in persistent storage
    addTransaction('credit', TOP_UP_AMOUNT, 'Self-Service Top-Up (Testing)');

    // 2. Notify the Sentinel Engine (Blockchain Simulation)
    try {
        await fetch('http://' + window.location.hostname + ':8080/add-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `💎 Wallet Top-Up: +500 AFRC Minted (Balance: ${currentBalance})`
            })
        });
        
        console.log("✅ Wallet synchronized with Sovereign Engine.");
        showNotification(`+${TOP_UP_AMOUNT} AFRC added to wallet`, 'success');
    } catch (error) {
        console.error("❌ Failed to notify engine of top-up:", error);
        // Still show success since local balance was updated
        showNotification(`+${TOP_UP_AMOUNT} AFRC added (offline mode)`, 'success');
    }
}

/**
 * Flexible top-up function for different amounts
 * Used by buttons with specific amounts (100, 500, 1000)
 */
async function topUpWallet(amount = 500) {
    const balanceDisplay = document.getElementById('wallet-balance');

    if (amount <= 0) {
        showNotification('Invalid top-up amount', 'error');
        return;
    }

    // Update the local wallet balance
    currentBalance += amount;
    walletState.balance = currentBalance;
    
    if (balanceDisplay) {
        balanceDisplay.innerText = currentBalance;
        
        // Animation
        balanceDisplay.style.transition = 'transform 0.2s ease';
        balanceDisplay.style.transform = 'scale(1.1)';
        setTimeout(() => {
            balanceDisplay.style.transform = 'scale(1)';
        }, 200);
    }
    
    // Add transaction to UI display
    addTransactionUI('credit', amount);
    
    // Record transaction in persistent storage
    addTransaction('credit', amount, `Self-Service Top-Up +${amount} AFRC`);

    // Notify the Sentinel Engine
    try {
        await fetch('http://' + window.location.hostname + ':8080/add-event', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: `💎 Wallet Top-Up: +${amount} AFRC Minted (Balance: ${currentBalance})`
            })
        });
        
        console.log(`✅ Wallet synchronized: +${amount} AFRC`);
        showNotification(`+${amount} AFRC added to wallet`, 'success');
    } catch (error) {
        console.error("Failed to notify engine:", error);
        showNotification(`+${amount} AFRC added (offline mode)`, 'success');
    }
}

/**
 * Get wallet transaction history
 */
function getTransactionHistory(limit = 10) {
    return walletState.transactions.slice(0, limit);
}

/**
 * Reset wallet to initial state (for testing)
 */
function resetWallet() {
    if (confirm('Reset wallet to initial state? This cannot be undone.')) {
        walletState = {
            balance: INITIAL_BALANCE,
            transactions: [],
            lastSync: new Date().toISOString()
        };
        saveWallet();
        updateWalletDisplay();
        showNotification('Wallet reset to 1,250 AFRC', 'info');
    }
}

// ============================================================================
// UI UTILITIES
// ============================================================================

/**
 * Show temporary notification to user
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 16px 24px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: slideInRight 0.3s ease-out;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// ============================================================================
// INITIALIZATION
// ============================================================================

/**
 * Initialize application when DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Africa Railways App Initialized');
    
    // Initialize wallet
    initWallet();
    
    // Initialize WebSocket connection
    initWebSocket();
    
    // Add CSS animations if not already present
    if (!document.getElementById('app-animations')) {
        const style = document.createElement('style');
        style.id = 'app-animations';
        style.textContent = `
            @keyframes slideIn {
                from {
                    opacity: 0;
                    transform: translateX(-20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes slideInRight {
                from {
                    opacity: 0;
                    transform: translateX(100px);
                }
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }
            
            @keyframes slideOutRight {
                from {
                    opacity: 1;
                    transform: translateX(0);
                }
                to {
                    opacity: 0;
                    transform: translateX(100px);
                }
            }
            
            .pulse-green {
                animation: pulse-green 2s infinite;
            }
            
            .pulse-red {
                animation: pulse-red 2s infinite;
            }
            
            @keyframes pulse-green {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.5; }
            }
            
            @keyframes pulse-red {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            .scroll-container {
                max-height: 400px;
                overflow-y: auto;
                scrollbar-width: thin;
                scrollbar-color: var(--accent) rgba(255,255,255,0.1);
            }
            
            .scroll-container::-webkit-scrollbar {
                width: 8px;
            }
            
            .scroll-container::-webkit-scrollbar-track {
                background: rgba(255,255,255,0.1);
                border-radius: 4px;
            }
            
            .scroll-container::-webkit-scrollbar-thumb {
                background: var(--accent);
                border-radius: 4px;
            }
        `;
        document.head.appendChild(style);
    }
});

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Clean up connections when page unloads
 */
window.addEventListener('beforeunload', () => {
    if (ws) {
        ws.close();
    }
    clearTimeout(reconnectTimer);
});

// ============================================================================
// EXPORT FUNCTIONS (for inline onclick handlers)
// ============================================================================

window.bookTicket = bookTicket;
window.simulateTicket = simulateTicket;
window.checkStatus = checkStatus;
window.topUp = topUp;
window.topUpWallet = topUpWallet;
window.resetWallet = resetWallet;
window.showTransactionHistory = showTransactionHistory;
window.updateTransactionHistoryDisplay = updateTransactionHistoryDisplay;
window.addTransactionUI = addTransactionUI;
