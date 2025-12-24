// WebSocket connection for real-time updates
let ws = null;
let reconnectInterval = null;
let isConnected = false;

function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    console.log('Connecting to WebSocket:', wsUrl);
    
    ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
        console.log('✅ WebSocket connected');
        isConnected = true;
        updateConnectionStatus(true);
        
        // Clear reconnect interval if it exists
        if (reconnectInterval) {
            clearInterval(reconnectInterval);
            reconnectInterval = null;
        }
    };
    
    ws.onmessage = (event) => {
        try {
            const metrics = JSON.parse(event.data);
            updateDashboard(metrics);
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    };
    
    ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        updateConnectionStatus(false);
    };
    
    ws.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        isConnected = false;
        updateConnectionStatus(false);
        
        // Attempt to reconnect every 5 seconds
        if (!reconnectInterval) {
            reconnectInterval = setInterval(() => {
                console.log('🔄 Attempting to reconnect...');
                connectWebSocket();
            }, 5000);
        }
    };
}

function updateConnectionStatus(connected) {
    const statusIndicator = document.getElementById('connection-status');
    const statusDot = statusIndicator.querySelector('.status-dot');
    const statusText = statusIndicator.querySelector('.status-text');
    
    if (connected) {
        statusDot.classList.remove('disconnected');
        statusText.textContent = 'Connected';
    } else {
        statusDot.classList.add('disconnected');
        statusText.textContent = 'Disconnected';
    }
}

// Initialize WebSocket connection when page loads
document.addEventListener('DOMContentLoaded', () => {
    connectWebSocket();
    
    // Fallback: Poll API every 10 seconds if WebSocket fails
    setInterval(() => {
        if (!isConnected) {
            fetchMetrics();
        }
    }, 10000);
});

// Fetch metrics via REST API (fallback)
async function fetchMetrics() {
    try {
        const response = await fetch('/api/metrics');
        if (response.ok) {
            const metrics = await response.json();
            updateDashboard(metrics);
        }
    } catch (error) {
        console.error('Error fetching metrics:', error);
    }
}
