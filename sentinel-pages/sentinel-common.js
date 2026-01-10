// Sentinel Dashboard Common Components and Functions

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('sentinel_session');
        window.location.href = '../index.html';
    }
}

// Profile function
function openProfile() {
    window.location.href = 'settings.html';
}

// Generate consistent header HTML
function generateHeader(currentPage = '') {
    const isMainDashboard = currentPage === 'dashboard';
    const pathPrefix = isMainDashboard ? 'sentinel-pages/' : '';
    const backPath = isMainDashboard ? '' : '../';
    
    return `
    <div class="header">
        <div class="header-left">
            <div class="logo">
                🛡️ Sentinel Dashboard
            </div>
            <input type="text" class="search-bar" placeholder="Search activities, users...">
        </div>
        <div class="header-right">
            <div class="live-indicator">
                <div class="live-dot"></div>
                LIVE
            </div>
            <button class="icon-btn" title="Notifications">
                🔔
                <span class="badge" id="notification-count">5</span>
            </button>
            <button class="icon-btn" onclick="window.location.href='${pathPrefix}settings.html'" title="Settings">
                ⚙️
            </button>
            <button class="icon-btn" onclick="${isMainDashboard ? 'window.location.href=\'sentinel-pages/settings.html\'' : 'openProfile()'}" title="Profile">
                👤
            </button>
            <button class="icon-btn" onclick="logout()" title="Logout" style="background: var(--danger);">
                🚪
            </button>
        </div>
    </div>
    `;
}

// Generate consistent sidebar menu HTML
function generateSidebar(activePage = 'dashboard') {
    const isMainDashboard = activePage === 'dashboard';
    const pathPrefix = isMainDashboard ? 'sentinel-pages/' : '';
    const dashboardPath = isMainDashboard ? 'sentinel-dashboard.html' : '../sentinel-dashboard.html';
    
    const menuItems = [
        { id: 'dashboard', icon: '📊', label: 'Dashboard', path: dashboardPath },
        { id: 'bookings', icon: '🎫', label: 'Bookings', path: `${pathPrefix}bookings.html` },
        { id: 'payments', icon: '💰', label: 'Payments', path: `${pathPrefix}payments.html` },
        { id: 'users', icon: '👥', label: 'Users', path: `${pathPrefix}users.html` },
        { id: 'routes', icon: '🚂', label: 'Routes', path: `${pathPrefix}routes.html` },
        { id: 'rolling-stock', icon: '🚃', label: 'Rolling Stock', path: `${pathPrefix}rolling-stock.html` },
        { id: 'maintenance', icon: '🔧', label: 'Maintenance', path: `${pathPrefix}maintenance.html` },
        { id: 'analytics', icon: '📈', label: 'Analytics', path: `${pathPrefix}analytics.html` },
        { id: 'alerts', icon: '⚠️', label: 'Alerts', path: `${pathPrefix}alerts.html` },
        { id: 'notifications', icon: '🔔', label: 'Notifications', path: `${pathPrefix}notifications.html`, badge: 5 },
        { id: 'settings', icon: '⚙️', label: 'Settings', path: `${pathPrefix}settings.html` }
    ];
    
    let html = '<div class="sidebar-left">';
    
    menuItems.forEach(item => {
        const activeClass = item.id === activePage ? ' active' : '';
        const badge = item.badge ? `<span class="notification-badge">${item.badge}</span>` : '';
        
        html += `
            <a href="${item.path}" class="menu-item${activeClass}">
                <div class="menu-icon">${item.icon}</div>
                <span>${item.label}</span>
                ${badge}
            </a>
        `;
    });
    
    html += '</div>';
    return html;
}

// Common CSS styles for all sentinel pages
const commonStyles = `
    .header-right {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .icon-btn {
        background: var(--hover);
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        color: var(--text-primary);
        font-size: 20px;
        position: relative;
    }

    .icon-btn:hover {
        background: var(--border);
    }

    .badge {
        position: absolute;
        top: -2px;
        right: -2px;
        background: var(--danger);
        color: white;
        border-radius: 10px;
        padding: 2px 6px;
        font-size: 11px;
        font-weight: bold;
    }

    .live-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: rgba(0, 208, 132, 0.1);
        border-radius: 20px;
        font-size: 13px;
        font-weight: 600;
        color: var(--success);
    }

    .live-dot {
        width: 8px;
        height: 8px;
        background: var(--success);
        border-radius: 50%;
        animation: pulse-live 1.5s infinite;
    }

    @keyframes pulse-live {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.5; transform: scale(1.3); }
    }

    .notification-badge {
        margin-left: auto;
        background: var(--danger);
        color: white;
        font-size: 11px;
        font-weight: bold;
        padding: 2px 6px;
        border-radius: 10px;
        min-width: 18px;
        text-align: center;
    }
`;
