/**
 * Test suite for wallet race condition bug fix
 * 
 * Bug Description:
 * Previously, the bookTicket() and simulateTicket() functions would deduct
 * the balance BEFORE confirming the transaction succeeded. If the network
 * request failed, users would lose money without getting a ticket.
 * 
 * Fix:
 * Balance is now deducted ONLY after receiving a successful response (200 OK).
 * Failed transactions no longer affect the wallet balance.
 */

describe('Wallet Race Condition Bug Fix', () => {
    let originalFetch;
    let mockBalance;
    
    beforeEach(() => {
        // Save original fetch
        originalFetch = global.fetch;
        
        // Reset mock balance
        mockBalance = 1250;
        
        // Mock wallet state
        global.walletState = {
            balance: mockBalance,
            transactions: []
        };
        
        global.currentBalance = mockBalance;
    });
    
    afterEach(() => {
        // Restore original fetch
        global.fetch = originalFetch;
    });
    
    test('should NOT deduct balance when booking fails with network error', async () => {
        // Mock fetch to simulate network failure
        global.fetch = jest.fn(() => 
            Promise.reject(new Error('Network error'))
        );
        
        const initialBalance = global.currentBalance;
        
        // Attempt to book ticket (should fail)
        try {
            await bookTicket();
        } catch (error) {
            // Expected to fail
        }
        
        // Balance should remain unchanged
        expect(global.currentBalance).toBe(initialBalance);
        expect(global.walletState.balance).toBe(initialBalance);
    });
    
    test('should NOT deduct balance when booking fails with HTTP error', async () => {
        // Mock fetch to simulate HTTP 500 error
        global.fetch = jest.fn(() => 
            Promise.resolve({
                ok: false,
                status: 500,
                statusText: 'Internal Server Error'
            })
        );
        
        const initialBalance = global.currentBalance;
        
        // Attempt to book ticket (should fail)
        try {
            await bookTicket();
        } catch (error) {
            // Expected to fail
        }
        
        // Balance should remain unchanged
        expect(global.currentBalance).toBe(initialBalance);
        expect(global.walletState.balance).toBe(initialBalance);
    });
    
    test('should deduct balance ONLY when booking succeeds', async () => {
        const TICKET_PRICE = 50;
        
        // Mock fetch to simulate successful response
        global.fetch = jest.fn(() => 
            Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ status: 'success' })
            })
        );
        
        const initialBalance = global.currentBalance;
        
        // Book ticket (should succeed)
        await bookTicket();
        
        // Balance should be deducted
        expect(global.currentBalance).toBe(initialBalance - TICKET_PRICE);
        expect(global.walletState.balance).toBe(initialBalance - TICKET_PRICE);
    });
    
    test('should handle multiple rapid clicks without double-charging', async () => {
        const TICKET_PRICE = 50;
        let requestCount = 0;
        
        // Mock fetch to simulate successful response with delay
        global.fetch = jest.fn(() => {
            requestCount++;
            return new Promise(resolve => {
                setTimeout(() => {
                    resolve({
                        ok: true,
                        status: 200,
                        json: () => Promise.resolve({ status: 'success' })
                    });
                }, 100);
            });
        });
        
        const initialBalance = global.currentBalance;
        
        // Simulate rapid clicks (button should be disabled after first click)
        const promise1 = bookTicket();
        const promise2 = bookTicket(); // Should be blocked by disabled button
        
        await Promise.all([promise1, promise2]);
        
        // Should only process one transaction
        expect(requestCount).toBe(1);
        expect(global.currentBalance).toBe(initialBalance - TICKET_PRICE);
    });
    
    test('should maintain balance consistency across localStorage', async () => {
        const TICKET_PRICE = 50;
        
        // Mock localStorage
        const localStorageMock = {
            store: {},
            getItem(key) {
                return this.store[key] || null;
            },
            setItem(key, value) {
                this.store[key] = value;
            }
        };
        global.localStorage = localStorageMock;
        
        // Mock successful fetch
        global.fetch = jest.fn(() => 
            Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ status: 'success' })
            })
        );
        
        const initialBalance = global.currentBalance;
        
        // Book ticket
        await bookTicket();
        
        // Check localStorage was updated correctly
        const stored = JSON.parse(localStorage.getItem('africa_railways_wallet'));
        expect(stored.balance).toBe(initialBalance - TICKET_PRICE);
    });
});

describe('Simulate Ticket Race Condition Fix', () => {
    let originalFetch;
    
    beforeEach(() => {
        originalFetch = global.fetch;
        global.walletState = { balance: 1250, transactions: [] };
        global.currentBalance = 1250;
    });
    
    afterEach(() => {
        global.fetch = originalFetch;
    });
    
    test('should NOT deduct balance when simulation fails', async () => {
        global.fetch = jest.fn(() => 
            Promise.reject(new Error('Network error'))
        );
        
        const initialBalance = global.currentBalance;
        
        try {
            await simulateTicket();
        } catch (error) {
            // Expected to fail
        }
        
        expect(global.currentBalance).toBe(initialBalance);
    });
    
    test('should deduct balance ONLY when simulation succeeds', async () => {
        const TICKET_PRICE = 50;
        
        global.fetch = jest.fn(() => 
            Promise.resolve({
                ok: true,
                status: 200,
                json: () => Promise.resolve({ status: 'success' })
            })
        );
        
        const initialBalance = global.currentBalance;
        
        await simulateTicket();
        
        expect(global.currentBalance).toBe(initialBalance - TICKET_PRICE);
    });
});
