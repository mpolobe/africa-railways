// Dashboard update logic
function updateDashboard(metrics) {
    // Update timestamp
    const timestamp = new Date(metrics.timestamp);
    document.getElementById('last-update-time').textContent = timestamp.toLocaleTimeString();
    
    // Update blockchain metrics
    updateBlockchainMetrics(metrics.blockchain);
    
    // Update wallet metrics
    updateWalletMetrics(metrics.wallet);
    
    // Update IPFS metrics
    updateIPFSMetrics(metrics.ipfs);
    
    // Update USSD metrics
    updateUSSDMetrics(metrics.ussd);
    
    // Update ticket metrics
    updateTicketMetrics(metrics.tickets);
    
    // Update GCP metrics
    updateGCPMetrics(metrics.gcp_metrics);
    
    // Update system health
    updateSystemHealth(metrics.system_health);
    
    // Update alerts
    updateAlerts(metrics.alerts);
    
    // Process blockchain events for feed
    processBlockchainEvents(metrics);
}

function updateBlockchainMetrics(blockchain) {
    // Polygon status
    const polygonStatus = blockchain.polygon.connected ? '✅ Connected' : '❌ Disconnected';
    document.getElementById('polygon-status').textContent = polygonStatus;
    document.getElementById('latest-block').textContent = blockchain.polygon.latest_block.toLocaleString();
    document.getElementById('network-latency').textContent = `${blockchain.polygon.network_latency_ms}ms`;
    document.getElementById('total-minted').textContent = blockchain.polygon.total_tickets_minted.toLocaleString();
    
    // Sui status
    const suiStatus = blockchain.sui.connected ? '✅ Connected' : '❌ Disconnected';
    document.getElementById('sui-status').textContent = suiStatus;
    document.getElementById('sui-latency').textContent = `${blockchain.sui.network_latency_ms}ms`;
    
    // Sui detailed metrics
    document.getElementById('sui-epoch').textContent = blockchain.sui.current_epoch || '--';
    document.getElementById('sui-checkpoint').textContent = blockchain.sui.latest_checkpoint ? 
        parseInt(blockchain.sui.latest_checkpoint).toLocaleString() : '--';
    document.getElementById('sui-total-tx').textContent = blockchain.sui.total_transactions ? 
        parseInt(blockchain.sui.total_transactions).toLocaleString() : '--';
    document.getElementById('sui-gas-price').textContent = blockchain.sui.reference_gas_price || '--';
    
    // Update card status indicator
    const blockchainStatusIcon = document.getElementById('blockchain-status');
    if (blockchain.polygon.connected && blockchain.sui.connected) {
        blockchainStatusIcon.className = 'card-status';
    } else if (blockchain.polygon.connected || blockchain.sui.connected) {
        blockchainStatusIcon.className = 'card-status warning';
    } else {
        blockchainStatusIcon.className = 'card-status error';
    }
}

function updateWalletMetrics(wallet) {
    document.getElementById('wallet-balance').textContent = `${wallet.balance_pol.toFixed(4)} POL`;
    document.getElementById('wallet-balance-usd').textContent = `$${wallet.balance_usd.toFixed(2)} USD`;
    document.getElementById('gas-price').textContent = `${wallet.gas_price_current_gwei.toFixed(2)} Gwei`;
    document.getElementById('tx-capacity').textContent = `~${wallet.estimated_tx_remaining} mints`;
    document.getElementById('wallet-address').textContent = wallet.address;
    
    // Update card status based on balance
    const walletStatusIcon = document.getElementById('wallet-status');
    if (wallet.low_balance_alert) {
        walletStatusIcon.className = 'card-status error';
        document.getElementById('wallet-balance').style.color = 'var(--danger-color)';
    } else if (wallet.balance_pol < 0.05) {
        walletStatusIcon.className = 'card-status warning';
        document.getElementById('wallet-balance').style.color = 'var(--warning-color)';
    } else {
        walletStatusIcon.className = 'card-status';
        document.getElementById('wallet-balance').style.color = 'var(--success-color)';
    }
}

function updateIPFSMetrics(ipfs) {
    document.getElementById('total-uploads').textContent = ipfs.total_uploads.toLocaleString();
    document.getElementById('uploads-today').textContent = ipfs.uploads_today.toLocaleString();
    document.getElementById('upload-success-rate').textContent = `${ipfs.upload_success_rate.toFixed(1)}%`;
    document.getElementById('avg-upload-time').textContent = `${ipfs.average_upload_time_ms}ms`;
    
    // Update card status
    const ipfsStatusIcon = document.getElementById('ipfs-status');
    if (ipfs.pinata_connected && ipfs.upload_success_rate > 95) {
        ipfsStatusIcon.className = 'card-status';
    } else if (ipfs.pinata_connected) {
        ipfsStatusIcon.className = 'card-status warning';
    } else {
        ipfsStatusIcon.className = 'card-status error';
    }
}

function updateUSSDMetrics(ussd) {
    document.getElementById('ussd-active-sessions').textContent = ussd.active_sessions.toLocaleString();
    document.getElementById('ussd-sessions-today').textContent = ussd.total_sessions_today.toLocaleString();
    document.getElementById('ussd-success-rate').textContent = `${ussd.success_rate.toFixed(1)}%`;
    document.getElementById('ussd-response-time').textContent = `${ussd.average_response_time_ms}ms`;
    
    // Format last activity time
    if (ussd.last_session_time && ussd.last_session_time !== '0001-01-01T00:00:00Z') {
        const lastActivity = new Date(ussd.last_session_time);
        const now = new Date();
        const diffMinutes = Math.floor((now - lastActivity) / 60000);
        
        let timeAgo;
        if (diffMinutes < 1) {
            timeAgo = 'Just now';
        } else if (diffMinutes < 60) {
            timeAgo = `${diffMinutes}m ago`;
        } else {
            const hours = Math.floor(diffMinutes / 60);
            timeAgo = `${hours}h ago`;
        }
        
        document.getElementById('ussd-last-command').textContent = timeAgo;
    } else {
        document.getElementById('ussd-last-command').textContent = 'No activity';
    }
    
    document.getElementById('ussd-uptime').textContent = `${ussd.uptime_percent.toFixed(1)}%`;
    
    // Update card status
    const ussdStatusIcon = document.getElementById('ussd-status');
    if (ussd.connected && ussd.success_rate > 90) {
        ussdStatusIcon.className = 'card-status';
    } else if (ussd.connected) {
        ussdStatusIcon.className = 'card-status warning';
    } else {
        ussdStatusIcon.className = 'card-status error';
    }
    
    // Update revenue metrics
    if (ussd.revenue) {
        updateRevenueMetrics(ussd.revenue);
    }
}

function updateGCPMetrics(gcp) {
    if (!gcp) return;
    
    // Update Sui Validator metrics
    if (gcp.sui_validator) {
        const suiCPU = gcp.sui_validator.cpu_utilization;
        const suiStatus = gcp.sui_validator.status;
        const suiStability = gcp.sui_validator.stability;
        const suiDataPoints = gcp.sui_validator.data_points_count;
        
        document.getElementById('sui-validator-cpu').textContent = 
            suiCPU > 0 ? `${suiCPU.toFixed(1)}% CPU` : 'No data';
        document.getElementById('sui-validator-zone').textContent = 
            gcp.sui_validator.zone || '--';
        
        // Update CPU progress bar
        updateCPUProgressBar('sui-validator-cpu-bar', suiCPU);
        
        // Update stability
        const stabilityElement = document.getElementById('sui-validator-stability');
        if (suiStability !== undefined) {
            stabilityElement.textContent = `${suiStability.toFixed(1)}%`;
            // Color code based on stability
            if (suiStability >= 99) {
                stabilityElement.style.color = 'var(--success-color)';
            } else if (suiStability >= 95) {
                stabilityElement.style.color = 'var(--warning-color)';
            } else {
                stabilityElement.style.color = 'var(--danger-color)';
            }
        } else {
            stabilityElement.textContent = '--';
        }
        
        document.getElementById('sui-validator-datapoints').textContent = 
            suiDataPoints ? `${suiDataPoints.toLocaleString()} / 1,440 points` : '--';
        
        // Update status badge
        const suiStatusBadge = document.getElementById('sui-validator-status');
        if (suiStatus === 'online') {
            suiStatusBadge.textContent = 'ONLINE';
            suiStatusBadge.className = 'status-badge status-online';
        } else {
            suiStatusBadge.textContent = 'OFFLINE';
            suiStatusBadge.className = 'status-badge status-offline';
        }
    }
    
    // Update Railway Core metrics
    if (gcp.railway_core) {
        const railwayCPU = gcp.railway_core.cpu_utilization;
        const railwayStatus = gcp.railway_core.status;
        const railwayStability = gcp.railway_core.stability;
        const railwayDataPoints = gcp.railway_core.data_points_count;
        
        document.getElementById('railway-core-cpu').textContent = 
            railwayCPU > 0 ? `${railwayCPU.toFixed(1)}% CPU` : 'No data';
        document.getElementById('railway-core-zone').textContent = 
            gcp.railway_core.zone || '--';
        
        // Update CPU progress bar
        updateCPUProgressBar('railway-core-cpu-bar', railwayCPU);
        
        // Update stability
        const stabilityElement = document.getElementById('railway-core-stability');
        if (railwayStability !== undefined) {
            stabilityElement.textContent = `${railwayStability.toFixed(1)}%`;
            // Color code based on stability
            if (railwayStability >= 99) {
                stabilityElement.style.color = 'var(--success-color)';
            } else if (railwayStability >= 95) {
                stabilityElement.style.color = 'var(--warning-color)';
            } else {
                stabilityElement.style.color = 'var(--danger-color)';
            }
        } else {
            stabilityElement.textContent = '--';
        }
        
        document.getElementById('railway-core-datapoints').textContent = 
            railwayDataPoints ? `${railwayDataPoints.toLocaleString()} / 1,440 points` : '--';
        
        // Update status badge
        const railwayStatusBadge = document.getElementById('railway-core-status');
        if (railwayStatus === 'online') {
            railwayStatusBadge.textContent = 'ONLINE';
            railwayStatusBadge.className = 'status-badge status-online';
        } else {
            railwayStatusBadge.textContent = 'OFFLINE';
            railwayStatusBadge.className = 'status-badge status-offline';
        }
    }
    
    // Update last updated time
    if (gcp.last_updated) {
        const lastUpdated = new Date(gcp.last_updated);
        document.getElementById('gcp-last-updated').textContent = 
            lastUpdated.toLocaleTimeString();
    }
    
    // Update refresh interval
    document.getElementById('gcp-refresh-interval').textContent = 
        `${gcp.update_interval_seconds || 60}s`;
    
    // Update card status
    const gcpStatusIcon = document.getElementById('gcp-status');
    const suiOK = gcp.sui_validator && gcp.sui_validator.status === 'online';
    const railwayOK = gcp.railway_core && gcp.railway_core.status === 'online';
    
    if (suiOK && railwayOK) {
        gcpStatusIcon.className = 'card-status';
    } else if (suiOK || railwayOK) {
        gcpStatusIcon.className = 'card-status warning';
    } else {
        gcpStatusIcon.className = 'card-status error';
    }
}

function updateCPUProgressBar(elementId, cpuValue) {
    const progressBar = document.getElementById(elementId);
    if (!progressBar) return;
    
    // Set width
    progressBar.style.width = `${cpuValue}%`;
    
    // Remove all threshold classes
    progressBar.classList.remove('healthy', 'warning', 'critical');
    
    // Apply color based on thresholds
    if (cpuValue >= 0 && cpuValue < 60) {
        // 0-60%: Blue/Green (Healthy)
        progressBar.classList.add('healthy');
    } else if (cpuValue >= 60 && cpuValue < 85) {
        // 60-85%: Yellow (Heavy Load)
        progressBar.classList.add('warning');
    } else if (cpuValue >= 85) {
        // 85-100%: Red (Critical)
        progressBar.classList.add('critical');
    }
}

function updateRevenueMetrics(revenue) {
    // Format currency
    const formatCurrency = (amount) => {
        return `R ${amount.toFixed(2)}`;
    };
    
    // Update confirmed revenue
    document.getElementById('revenue-confirmed').textContent = formatCurrency(revenue.confirmed_total || 0);
    
    // Update pending revenue
    document.getElementById('revenue-pending').textContent = formatCurrency(revenue.pending_total || 0);
    
    // Update today's revenue
    document.getElementById('revenue-today').textContent = formatCurrency(revenue.revenue_today || 0);
    document.getElementById('tickets-sold-today').textContent = `${revenue.tickets_today || 0} tickets sold`;
    
    // Update average ticket price
    const avgPrice = revenue.average_ticket_price || 0;
    document.getElementById('avg-ticket-price').textContent = formatCurrency(avgPrice);
    
    // Update conversion rate
    const conversionRate = revenue.conversion_rate || 0;
    document.getElementById('conversion-rate').textContent = `${conversionRate.toFixed(1)}% conversion`;
    
    // Update chart
    const totalRevenue = (revenue.confirmed_total || 0) + (revenue.pending_total || 0);
    if (totalRevenue > 0) {
        const confirmedPercent = ((revenue.confirmed_total || 0) / totalRevenue) * 100;
        const pendingPercent = ((revenue.pending_total || 0) / totalRevenue) * 100;
        
        document.getElementById('chart-confirmed').style.width = `${confirmedPercent}%`;
        document.getElementById('chart-pending').style.width = `${pendingPercent}%`;
        
        document.getElementById('chart-confirmed-value').textContent = formatCurrency(revenue.confirmed_total || 0);
        document.getElementById('chart-pending-value').textContent = formatCurrency(revenue.pending_total || 0);
    } else {
        document.getElementById('chart-confirmed').style.width = '0%';
        document.getElementById('chart-pending').style.width = '0%';
        document.getElementById('chart-confirmed-value').textContent = 'R 0.00';
        document.getElementById('chart-pending-value').textContent = 'R 0.00';
    }
}

function updateTicketMetrics(tickets) {
    document.getElementById('tickets-minted').textContent = tickets.total_minted.toLocaleString();
    document.getElementById('tickets-pending').textContent = tickets.pending.toLocaleString();
    document.getElementById('tickets-active').textContent = tickets.active.toLocaleString();
    document.getElementById('tickets-used').textContent = tickets.used.toLocaleString();
    document.getElementById('tickets-expired').textContent = tickets.expired.toLocaleString();
}

function updateSystemHealth(health) {
    updateServiceStatus('health-relayer', health.relayer_service);
    updateServiceStatus('health-ipfs', health.ipfs_uploader);
    updateServiceStatus('health-monitor', health.api_server);
    updateServiceStatus('health-ussd-gateway', health.ussd_gateway);
    updateServiceStatus('health-api', health.api_server);
    updateServiceStatus('health-sui-node', health.sui_node);
    updateServiceStatus('health-alchemy', health.alchemy_api);
    updateServiceStatus('health-pinata', health.pinata_api);
    updateServiceStatus('health-aws-s3', health.aws_s3);
}

function updateServiceStatus(elementId, service) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const dot = element.querySelector('.health-dot');
    const text = element.querySelector('.health-text');
    
    // Update status text
    text.textContent = `${service.status} (${service.uptime_percent.toFixed(1)}% uptime)`;
    
    // Update status color
    dot.classList.remove('operational', 'degraded', 'down');
    if (service.status === 'operational') {
        dot.classList.add('operational');
    } else if (service.status === 'degraded') {
        dot.classList.add('degraded');
    } else {
        dot.classList.add('down');
    }
}

function updateAlerts(alerts) {
    const alertsList = document.getElementById('alerts-list');
    const alertCount = document.getElementById('alert-count');
    const alertBanner = document.getElementById('alert-banner');
    const alertMessage = document.getElementById('alert-message');
    
    // Update alert count
    alertCount.textContent = alerts.length;
    
    if (alerts.length === 0) {
        alertsList.innerHTML = '<div class="no-alerts">✅ No active alerts - all systems operational</div>';
        alertBanner.style.display = 'none';
        return;
    }
    
    // Show banner for critical alerts
    const criticalAlerts = alerts.filter(a => a.level === 'critical');
    if (criticalAlerts.length > 0) {
        alertMessage.textContent = criticalAlerts[0].message;
        alertBanner.style.display = 'block';
    }
    
    // Render alerts list
    alertsList.innerHTML = alerts.map(alert => {
        const timestamp = new Date(alert.timestamp);
        const levelClass = alert.level === 'critical' ? '' : alert.level;
        
        return `
            <div class="alert-item ${levelClass}">
                <div class="alert-header">
                    <span class="alert-level">${alert.level}</span>
                    <span class="alert-time">${timestamp.toLocaleTimeString()}</span>
                </div>
                <div class="alert-text">${alert.message}</div>
            </div>
        `;
    }).join('');
}

function closeAlert() {
    document.getElementById('alert-banner').style.display = 'none';
}

// Service control functions
async function controlService(service, action) {
    const button = event.target;
    button.disabled = true;
    button.textContent = action === 'start' ? '⏳ Starting...' : '⏳ Stopping...';
    
    try {
        const response = await fetch(`/api/control/${service}/${action}`, {
            method: 'POST'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showNotification(`${service} ${action}ed successfully`, 'success');
        } else {
            showNotification(`Failed to ${action} ${service}: ${result.message}`, 'error');
        }
    } catch (error) {
        showNotification(`Error: ${error.message}`, 'error');
    } finally {
        button.disabled = false;
        button.textContent = action === 'start' ? '▶ Start' : '■ Stop';
    }
}

function showNotification(message, type) {
    // Simple notification (could be enhanced with a toast library)
    const alertBanner = document.getElementById('alert-banner');
    const alertMessage = document.getElementById('alert-message');
    
    alertMessage.textContent = message;
    alertBanner.style.display = 'block';
    alertBanner.style.background = type === 'success' ? 'var(--success-color)' : 'var(--danger-color)';
    
    setTimeout(() => {
        alertBanner.style.display = 'none';
        alertBanner.style.background = 'var(--danger-color)';
    }, 5000);
}

// Format numbers with commas
function formatNumber(num) {
    return num.toLocaleString();
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

// Format timestamp
function formatTimestamp(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString();
}

// Blockchain Feed Management
let feedFilters = {
    polygon: true,
    sui: true
};
let autoScroll = true;
let feedLineCount = 0;
const MAX_FEED_LINES = 100;

function addFeedLine(source, message, type = 'event', data = null) {
    // Check if source is filtered
    if (source === 'POLYGON' && !feedFilters.polygon) return;
    if (source === 'SUI' && !feedFilters.sui) return;
    
    const feed = document.getElementById('blockchain-feed');
    const timestamp = new Date().toLocaleTimeString();
    
    const line = document.createElement('div');
    line.className = `feed-line feed-${type}`;
    
    const sourceClass = source.toLowerCase();
    line.innerHTML = `
        <span class="feed-timestamp">[${timestamp}]</span>
        <span class="feed-source ${sourceClass}">[${source}]</span>
        <span class="feed-message">${message}</span>
    `;
    
    if (data) {
        const dataLine = document.createElement('div');
        dataLine.className = 'feed-data';
        dataLine.textContent = JSON.stringify(data, null, 2);
        line.appendChild(dataLine);
    }
    
    feed.appendChild(line);
    feedLineCount++;
    
    // Limit feed lines
    if (feedLineCount > MAX_FEED_LINES) {
        feed.removeChild(feed.firstChild);
        feedLineCount--;
    }
    
    // Auto-scroll to bottom
    if (autoScroll) {
        feed.scrollTop = feed.scrollHeight;
    }
}

function toggleFeed(source) {
    feedFilters[source] = !feedFilters[source];
    const btn = document.getElementById(`btn-${source}`);
    
    if (feedFilters[source]) {
        btn.classList.add('active');
        addFeedLine('SYSTEM', `${source.toUpperCase()} feed enabled`, 'system');
    } else {
        btn.classList.remove('active');
        addFeedLine('SYSTEM', `${source.toUpperCase()} feed disabled`, 'system');
    }
}

function clearFeed() {
    const feed = document.getElementById('blockchain-feed');
    feed.innerHTML = '';
    feedLineCount = 0;
    addFeedLine('SYSTEM', 'Feed cleared. Listening for events...', 'system');
}

function toggleAutoScroll() {
    autoScroll = !autoScroll;
    const btn = document.getElementById('btn-autoscroll');
    btn.textContent = `Auto-scroll: ${autoScroll ? 'ON' : 'OFF'}`;
    
    if (autoScroll) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }
}

// Force Resync Functionality
let isResyncing = false;

async function forceResync() {
    if (isResyncing) {
        return; // Already resyncing
    }
    
    isResyncing = true;
    const btn = document.getElementById('btn-resync');
    const status = document.getElementById('resync-status');
    const text = document.getElementById('resync-text');
    const count = document.getElementById('resync-count');
    const fill = document.getElementById('resync-fill');
    
    // Disable button and show syncing state
    btn.disabled = true;
    btn.classList.add('syncing');
    btn.textContent = '🔄 Syncing...';
    status.style.display = 'block';
    
    // Add system message
    addFeedLine('SYSTEM', 'Force resync initiated - scanning last 100 blocks', 'warning');
    
    try {
        // Call resync API
        const response = await fetch('/api/blockchain/resync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                blocks: 100,
                source: 'sui' // or 'polygon'
            })
        });
        
        if (!response.ok) {
            throw new Error(`Resync failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Simulate progress (in production, use WebSocket or polling for real progress)
        for (let i = 0; i <= 100; i++) {
            await new Promise(resolve => setTimeout(resolve, 50));
            count.textContent = `${i}/100`;
            fill.style.width = `${i}%`;
            text.textContent = `Rescanning block ${result.start_block + i}...`;
        }
        
        // Show results
        addFeedLine('SYSTEM', `Resync complete: Found ${result.events_found} events, ${result.tickets_processed} tickets processed`, 'event');
        
        if (result.missed_tickets > 0) {
            addFeedLine('SYSTEM', `⚠️ ${result.missed_tickets} missed tickets recovered and processed`, 'warning');
        }
        
        // Refresh dashboard data
        fetchBlockchainEvents();
        
    } catch (error) {
        console.error('Resync error:', error);
        addFeedLine('SYSTEM', `Resync failed: ${error.message}`, 'error');
    } finally {
        // Reset UI
        setTimeout(() => {
            status.style.display = 'none';
            btn.disabled = false;
            btn.classList.remove('syncing');
            btn.textContent = '🔄 Force Resync';
            isResyncing = false;
        }, 2000);
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Ctrl+L - Clear feed
    if (e.ctrlKey && e.key === 'l') {
        e.preventDefault();
        clearFeed();
    }
    
    // Ctrl+P - Toggle Polygon
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        toggleFeed('polygon');
    }
    
    // Ctrl+S - Toggle Sui
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        toggleFeed('sui');
    }
    
    // Ctrl+A - Toggle auto-scroll
    if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        toggleAutoScroll();
    }
    
    // Ctrl+R - Force resync
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        forceResync();
    }
});

// Simulate blockchain events (replace with real event listener)
function simulateBlockchainEvents() {
    // This would be replaced with actual WebSocket or polling from relayer
    
    // Example Polygon event
    setTimeout(() => {
        addFeedLine('POLYGON', 'New block mined: #12345678', 'event');
    }, 5000);
    
    setTimeout(() => {
        addFeedLine('POLYGON', 'Ticket minted: TokenID #42', 'event', {
            from: '0x4C97260183BaD57AbF37f0119695f0607f2c3921',
            to: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
            tokenId: 42,
            route: 'JHB-CPT',
            class: 'Economy'
        });
    }, 10000);
    
    setTimeout(() => {
        addFeedLine('SUI', 'Purchase event detected', 'event', {
            user: '0x1234...5678',
            amount: '150 POL',
            route: 'JHB-CPT'
        });
    }, 15000);
}

// Fetch blockchain events from relayer
async function fetchBlockchainEvents() {
    try {
        const response = await fetch('/api/blockchain/feed');
        if (response.ok) {
            const events = await response.json();
            
            // Process new events
            if (!window.processedEventIds) window.processedEventIds = new Set();
            
            events.forEach(event => {
                const eventId = `${event.timestamp}-${event.message}`;
                if (!window.processedEventIds.has(eventId)) {
                    window.processedEventIds.add(eventId);
                    
                    const source = event.source.toUpperCase();
                    const type = event.type === 'error' ? 'error' : 
                                event.type === 'warning' ? 'warning' : 'event';
                    
                    addFeedLine(source, event.message, type, event.data);
                }
            });
        }
    } catch (error) {
        console.error('Failed to fetch blockchain events:', error);
    }
}

// KPI Management
let previousKPIs = {};

async function fetchKPIs() {
    try {
        const response = await fetch('/api/blockchain/kpis');
        if (response.ok) {
            const kpis = await response.json();
            updateKPIs(kpis);
        }
    } catch (error) {
        console.error('Failed to fetch KPIs:', error);
    }
}

function updateKPIs(kpis) {
    // Update refresh time
    const now = new Date();
    document.getElementById('kpi-refresh').textContent = `Updated: ${now.toLocaleTimeString()}`;
    
    // Sui Events
    updateKPIValue('kpi-sui-events', kpis.sui_events_detected, 'kpi-sui');
    document.getElementById('kpi-events-rate').textContent = `${kpis.events_per_minute.toFixed(1)}/min`;
    
    // Polygon Mints
    updateKPIValue('kpi-polygon-mints', kpis.polygon_tickets_minted, 'kpi-polygon');
    document.getElementById('kpi-mints-rate').textContent = `${kpis.mints_per_minute.toFixed(1)}/min`;
    
    // Success Rate
    const successRate = kpis.success_rate || 100;
    document.getElementById('kpi-success-rate').textContent = `${successRate.toFixed(1)}%`;
    document.getElementById('kpi-success-count').textContent = 
        `${kpis.polygon_tx_success} success / ${kpis.polygon_tx_failed} failed`;
    
    // Update success box styling based on rate
    const successBox = document.querySelector('.kpi-box.kpi-success');
    if (successRate < 90) {
        successBox.classList.add('degraded');
    } else {
        successBox.classList.remove('degraded');
    }
    
    // Bridge Latency
    const latency = kpis.bridge_latency_ms || 0;
    document.getElementById('kpi-latency').textContent = `${latency}ms`;
    
    // Update latency box styling
    const latencyBox = document.querySelector('.kpi-box.kpi-latency');
    if (latency > 5000) {
        latencyBox.classList.add('slow');
    } else {
        latencyBox.classList.remove('slow');
    }
    
    // Failed Attempts (Missed Tickets)
    const failedAttempts = kpis.polygon_tx_failed || 0;
    updateKPIValue('kpi-missed', failedAttempts, 'kpi-missed');
    document.getElementById('kpi-recovered').textContent = `${kpis.recovered_tickets} recovered`;
    
    // Update failed attempts badge styling
    const failedBadge = document.getElementById('failed-attempts-badge');
    if (failedAttempts === 0) {
        failedBadge.className = 'failed-attempts-counter success';
    } else {
        failedBadge.className = 'failed-attempts-counter danger';
    }
    
    // Update missed box styling
    const missedBox = document.querySelector('.kpi-box.kpi-missed');
    if (failedAttempts > 0) {
        missedBox.classList.add('warning');
    } else {
        missedBox.classList.remove('warning');
    }
    
    // Uptime
    const uptime = formatUptime(kpis.uptime_seconds);
    document.getElementById('kpi-uptime').textContent = uptime;
    
    const startTime = new Date(kpis.session_start_time);
    document.getElementById('kpi-start-time').textContent = 
        `Started: ${startTime.toLocaleTimeString()}`;
    
    // Add syncing animation if values are changing
    if (kpis.sui_events_detected > (previousKPIs.sui_events_detected || 0)) {
        document.querySelector('.kpi-box.kpi-sui').classList.add('syncing');
        setTimeout(() => {
            document.querySelector('.kpi-box.kpi-sui').classList.remove('syncing');
        }, 2000);
    }
    
    if (kpis.polygon_tickets_minted > (previousKPIs.polygon_tickets_minted || 0)) {
        document.querySelector('.kpi-box.kpi-polygon').classList.add('syncing');
        setTimeout(() => {
            document.querySelector('.kpi-box.kpi-polygon').classList.remove('syncing');
        }, 2000);
    }
    
    // Store previous values
    previousKPIs = kpis;
}

function updateKPIValue(elementId, newValue, boxClass) {
    const element = document.getElementById(elementId);
    const oldValue = parseInt(element.textContent) || 0;
    
    if (newValue !== oldValue) {
        // Flash animation on update
        element.classList.add('updating');
        setTimeout(() => {
            element.classList.remove('updating');
        }, 500);
    }
    
    element.textContent = newValue.toLocaleString();
}

function formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

// Initialize feed
document.addEventListener('DOMContentLoaded', () => {
    // Set initial button states
    document.getElementById('btn-polygon').classList.add('active');
    document.getElementById('btn-sui').classList.add('active');
    document.getElementById('btn-autoscroll').classList.add('active');
    
    // Fetch blockchain events every 10 seconds
    setInterval(fetchBlockchainEvents, 10000);
    fetchBlockchainEvents(); // Initial fetch
    
    // Fetch KPIs every 5 seconds
    setInterval(fetchKPIs, 5000);
    fetchKPIs(); // Initial fetch
    
    // Fetch sparkline data every 30 seconds
    setInterval(fetchSparklineData, 30000);
    fetchSparklineData(); // Initial fetch
});

// Fetch sparkline data from relayer
async function fetchSparklineData() {
    try {
        const response = await fetch('/api/blockchain/sparkline');
        if (!response.ok) {
            console.warn('Failed to fetch sparkline data');
            return;
        }
        
        const data = await response.json();
        
        // Render sparklines
        renderSparkline('sparkline-events', data.tickets_per_minute, '#06b6d4'); // Cyan for Sui
        renderSparkline('sparkline-mints', data.tickets_per_minute, '#a855f7'); // Purple for Polygon
        renderSparkline('sparkline-failed', data.failed_attempts, '#ef4444'); // Red for failures
        
    } catch (error) {
        console.error('Error fetching sparkline data:', error);
    }
}

// Render sparkline chart on canvas
function renderSparkline(canvasId, dataPoints, color) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width = canvas.offsetWidth;
    const height = canvas.height = canvas.offsetHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    if (!dataPoints || dataPoints.length === 0) {
        return;
    }
    
    // Extract values
    const values = dataPoints.map(dp => dp.value);
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);
    const range = maxValue - minValue || 1;
    
    // Calculate points
    const points = values.map((value, index) => {
        const x = (index / (values.length - 1 || 1)) * width;
        const y = height - ((value - minValue) / range) * height;
        return { x, y };
    });
    
    // Draw line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    ctx.beginPath();
    points.forEach((point, index) => {
        if (index === 0) {
            ctx.moveTo(point.x, point.y);
        } else {
            ctx.lineTo(point.x, point.y);
        }
    });
    ctx.stroke();
    
    // Draw fill gradient
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, color + '40'); // 25% opacity
    gradient.addColorStop(1, color + '00'); // 0% opacity
    ctx.fillStyle = gradient;
    ctx.fill();
}

// Process blockchain events from metrics
function processBlockchainEvents(metrics) {
    // Check for new Polygon blocks
    if (metrics.blockchain && metrics.blockchain.polygon) {
        const polygon = metrics.blockchain.polygon;
        if (polygon.last_tx_hash && polygon.last_tx_hash !== window.lastPolygonTx) {
            window.lastPolygonTx = polygon.last_tx_hash;
            addFeedLine('POLYGON', `Transaction: ${polygon.last_tx_hash.substring(0, 10)}...`, 'event');
        }
    }
    
    // Check for Sui events
    if (metrics.blockchain && metrics.blockchain.sui) {
        const sui = metrics.blockchain.sui;
        if (sui.event_count > (window.lastSuiEventCount || 0)) {
            window.lastSuiEventCount = sui.event_count;
            addFeedLine('SUI', `Event count: ${sui.event_count}`, 'event');
        }
    }
    
    // Check for new tickets
    if (metrics.tickets && metrics.tickets.total_minted > (window.lastTicketCount || 0)) {
        const newTickets = metrics.tickets.total_minted - (window.lastTicketCount || 0);
        window.lastTicketCount = metrics.tickets.total_minted;
        addFeedLine('POLYGON', `${newTickets} new ticket(s) minted`, 'event');
    }
    
    // Check for USSD purchases
    if (metrics.ussd && metrics.ussd.revenue) {
        const revenue = metrics.ussd.revenue;
        if (revenue.tickets_today > (window.lastTicketsToday || 0)) {
            const newTickets = revenue.tickets_today - (window.lastTicketsToday || 0);
            window.lastTicketsToday = revenue.tickets_today;
            addFeedLine('SUI', `${newTickets} ticket(s) purchased via USSD`, 'event', {
                revenue_today: `R ${revenue.revenue_today.toFixed(2)}`
            });
        }
    }
    
    // Check for alerts
    if (metrics.alerts && metrics.alerts.length > 0) {
        metrics.alerts.forEach(alert => {
            if (!window.shownAlerts) window.shownAlerts = new Set();
            const alertKey = `${alert.timestamp}-${alert.message}`;
            if (!window.shownAlerts.has(alertKey)) {
                window.shownAlerts.add(alertKey);
                const type = alert.level === 'critical' ? 'error' : 'warning';
                addFeedLine('SYSTEM', alert.message, type);
            }
        });
    }
}
