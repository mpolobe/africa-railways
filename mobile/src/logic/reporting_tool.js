/**
 * Africoin Sentinel Reporting Tool
 * Integrates Sui Move (Safety) and Digits AI (Finance)
 * 
 * Uses centralized API configuration
 */

import API_CONFIG, { buildUrl, getApiHeaders, apiRequest } from '../../src/config/api';

// Get app information
const APP_NAME = API_CONFIG.isRailways ? 'Railways' : 'Africoin';

// Log which backend we're connecting to
console.log(`🔌 ${APP_NAME} app connecting to: ${API_CONFIG.baseUrl}`);
console.log(`🔑 API Key configured: ${!!API_CONFIG.apiKey}`);

/**
 * Send a report to the backend
 * @param {Object} report - Report data
 * @returns {Promise<Object>} Response data
 */
export const sendReport = async (report) => {
    const url = buildUrl('/api/report');
    
    console.log(`📡 ${APP_NAME} sending report to: ${url}`);
    
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                "X-App-Name": APP_NAME
            },
            body: JSON.stringify({
                ...report,
                appName: APP_NAME,
                timestamp: new Date().toISOString()
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Report sent successfully`);
        return data;
    } catch (error) {
        console.error(`❌ Failed to send report:`, error);
        throw error;
    }
};

/**
 * Get reports from the backend
 * @returns {Promise<Array>} Array of reports
 */
export const getReports = async () => {
    const url = buildUrl('/api/reports');
    
    console.log(`📊 ${APP_NAME} fetching reports from: ${url}`);
    
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "X-App-Name": APP_NAME
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Fetched ${data.length} reports`);
        return data;
    } catch (error) {
        console.error(`❌ Failed to fetch reports:`, error);
        throw error;
    }
};

/**
 * Check backend health
 * @returns {Promise<Object>} Health status
 */
export const checkHealth = async () => {
    const url = buildUrl('/api/health');
    
    try {
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "X-App-Name": APP_NAME
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`💚 ${APP_NAME} backend health: ${data.status}`);
        return data;
    } catch (error) {
        console.error(`❌ Health check failed:`, error);
        throw error;
    }
};

/**
 * Connect to WebSocket for real-time updates
 * @param {Function} onMessage - Callback for incoming messages
 * @returns {WebSocket} WebSocket connection
 */
export const connectWebSocket = (onMessage) => {
    const wsUrl = `${WS_URL}/ws`;
    
    console.log(`🔌 ${APP_NAME} connecting to WebSocket: ${wsUrl}`);
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log(`✅ WebSocket connected to ${APP_NAME} Sovereign Engine`);
        ws.send(JSON.stringify({
            type: 'auth',
            appName: APP_NAME,
            slug: Constants.expoConfig?.slug
        }));
    };
    
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            onMessage(data);
        } catch (error) {
            console.error('❌ Failed to parse WebSocket message:', error);
        }
    };
    
    ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
    };
    
    ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
    };
    
    return ws;
};

/**
 * Get current backend configuration
 * @returns {Object} Backend configuration
 */
export const getCurrentBackend = () => {
    return {
        appName: APP_NAME,
        isRailways: IS_RAILWAYS,
        slug: Constants.expoConfig?.slug,
        apiUrl: API_URL,
        wsUrl: WS_URL
    };
};

// Export configuration for use in other modules
export { IS_RAILWAYS, APP_NAME, API_URL, WS_URL };
