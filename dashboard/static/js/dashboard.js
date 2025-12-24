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
    
    // Update system health
    updateSystemHealth(metrics.system_health);
    
    // Update alerts
    updateAlerts(metrics.alerts);
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
