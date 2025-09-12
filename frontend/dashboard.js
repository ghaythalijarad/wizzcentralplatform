// dashboard.js - Dashboard JavaScript functionality

// Authentication check function
function checkDashboardAuthentication() {
    console.log('🔐 Checking authentication for dashboard access...');

    // Check if this is a test/debug mode (bypass auth for testing)
    const isTestMode = window.location.search.includes('test=true') ||
        window.location.search.includes('bypass=true') ||
        window.location.search.includes('debug=true') ||
        sessionStorage.getItem('debugMode') === 'true';

    if (isTestMode) {
        console.log('🧪 Test mode detected, bypassing authentication');
        sessionStorage.setItem('debugMode', 'true');
        initializeDashboard();
        return;
    }

    if (window.Auth && window.Auth.requireAuthentication) {
        // Check authentication before initializing dashboard
        try {
            const authResult = window.Auth.requireAuthentication();
            console.log('🔍 Authentication result:', authResult);

            if (!authResult) {
                console.warn('❌ Authentication check failed, redirecting to login');
                // The Auth.requireAuthentication() function will handle the redirect
                // No need to do anything else here
                return;
            } else {
                console.log('✅ Authentication check passed, initializing dashboard');
                initializeDashboard();
            }
        } catch (error) {
            console.error('❌ Authentication check error:', error);
            console.log('🔄 Attempting to continue with limited functionality...');
            initializeDashboard();
        }
    } else {
        console.warn('⚠️ Auth utilities not loaded, continuing with limited security');
        initializeDashboard();
    }
}

// Wait for auth utilities to load, then check authentication
if (window.Auth) {
    checkDashboardAuthentication();
} else {
    // Wait a bit for auth-utils.js to load
    setTimeout(checkDashboardAuthentication, 200);
}

// DOM Elements (will be populated after navigation is ready)
let sidebar, mainContent, menuToggle, sidebarToggle;

// Wait for navigation to be ready
document.addEventListener('navigation:ready', (event) => {
    console.log('🧭 Dashboard: Navigation ready, initializing dashboard features...');
    initializeDashboardFeatures();
});

// Fallback initialization if navigation event doesn't fire
setTimeout(() => {
    if (!window.navigationManager?.isReady()) {
        console.log('⏰ Dashboard: Navigation timeout, initializing anyway...');
        initializeDashboardFeatures();
    }
}, 1000);

function initializeDashboardFeatures() {
    // Get DOM references
    sidebar = document.getElementById('sidebar');
    mainContent = document.getElementById('mainContent');
    menuToggle = document.getElementById('menuToggle');
    sidebarToggle = document.getElementById('sidebarToggle');

    // Initialize dashboard-specific functionality
    initializeDashboard();

    // Load dashboard data
    loadDashboardStats();
}

async function loadDashboardStats() {
    console.log('🔢 Loading dashboard stats from all tables...');

    try {
        // Prefer data-service for safe fallbacks (avoids per-table AccessDenied showing "Error")
        if (!window.dataService) throw new Error('dataService is not available');

        // Ensure AWS/data layer is initialized
        await window.dataService.initialize();

        const tables = {
            customersCount: 'WizzUser_users_dev',
            merchantsCount: 'WhizzMerchants_Businesses',
            driversCount: 'WhizzDrivers_dev',
            ordersCount: 'WizzUser_transactions_dev',
            promotionsCount: 'WhizzMerchants_Discounts',
            ticketsCount: 'WizzUser_users_dev' // Using users table as fallback since no support tickets table exists
        };

        const counts = {};

        // Update each stat card via data-service.scan with Select: COUNT (safe default 0 on error)
        for (const [elementId, tableName] of Object.entries(tables)) {
            try {
                const res = await window.dataService.scan(tableName, { Select: 'COUNT' });
                const count = res && typeof res.Count === 'number' ? res.Count : 0;
                counts[
                    elementId.replace('Count','') // keep raw too
                ] = count;
                const el = document.getElementById(elementId);
                if (el) el.textContent = count.toLocaleString();
                console.log(`✅ ${elementId}: ${count}`);
            } catch (error) {
                console.warn(`Count fallback for ${elementId}:`, error?.message || error);
                const el = document.getElementById(elementId);
                if (el) el.textContent = '0';
            }
        }

        // Also load recent businesses list via dataService helper
        try {
            const recent = await window.dataService.getRecentBusinesses(5);
            counts.recentMerchants = Array.isArray(recent) ? recent.length : 0;
        } catch (_) { }

        updateDashboardDebugPanel({
            customers: counts.customers, // fixed from counts.customersCount
            merchants: counts.merchants, // fixed from counts.merchantsCount
            drivers: counts.drivers,     // fixed from counts.driversCount
            orders: counts.orders,       // fixed from counts.ordersCount
            promotions: counts.promotions, // fixed from counts.promotionsCount
            tickets: counts.tickets,       // fixed from counts.ticketsCount
            recentMerchants: counts.recentMerchants
        });

        console.log('✅ Dashboard stats loaded (data-service)');

    } catch (error) {
        console.error('❌ Error loading dashboard stats:', error);
        // Set fallback values in case of error
        const statElements = ['customersCount', 'merchantsCount', 'driversCount', 'ordersCount', 'promotionsCount', 'ticketsCount'];
        statElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = '0';
        });
    }
}

async function loadRecentBusinesses() {
    try {
        const recentBusinesses = await window.dataService.getRecentBusinesses(5);

        const container = document.getElementById('recentBusinessesList');
        if (!container) return;

        container.innerHTML = '';
        recentBusinesses.forEach(business => {
            const joinDate = business.joinDate ? new Date(business.joinDate).toLocaleDateString() : 'Unknown';
            const div = document.createElement('div');
            div.className = 'merchant-item';
            div.innerHTML = `
                <div class="merchant-avatar"><i class="fas fa-store"></i></div>
                <div class="merchant-info">
                    <span class="merchant-name">${business.name}</span>
                    <span class="merchant-orders">Joined: ${joinDate}</span>
                </div>
            `;
            container.appendChild(div);
        });

        // Diagnostics
        updateDashboardDebugPanel({ recentMerchants: recentBusinesses.length }); // fixed key name

    } catch (e) {
        console.error('Error loading recent businesses:', e);
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    console.log('📄 DOM Content Loaded - Starting dashboard initialization...');
    // Removed secondary Auth.requireAuthentication() call to prevent race/duplicate redirects

    // Show diagnostics if enabled
    showDashboardDebugPanel();

    // Get DOM elements
    sidebar = document.getElementById('sidebar');
    mainContent = document.getElementById('mainContent');
    menuToggle = document.getElementById('menuToggle');
    sidebarToggle = document.getElementById('sidebarToggle');

    // Verify essential elements exist
    if (!sidebar || !mainContent) {
        console.error('Essential dashboard elements not found:', {
            sidebar: !!sidebar,
            mainContent: !!mainContent
        });
        return;
    }

    initializeDashboard();
    updateTime();
    setInterval(updateTime, 60000); // Update every minute

    // Show success message
    showWelcomeMessage();

    // Load statistics using data service
    if (window.dataService) {
        // Initialize data service first
        window.dataService.initialize()
            .then(() => {
                return loadDashboardStats();
            })
            .then(() => loadRecentBusinesses())
            .catch(error => {
                console.error('Data service initialization failed:', error);
                // Show fallback data
                showFallbackStats();
            });
    } else {
        console.warn('Data service not available, loading fallback stats');
        showFallbackStats();
    }

    // Ensure debug panel reflects base info
    updateDashboardDebugPanel({});
});

// Show welcome message
function showWelcomeMessage() {
    const userEmail = sessionStorage.getItem('userEmail');
}

// Show fallback statistics when data service is unavailable
function showFallbackStats() {
    const customersCountEl = document.getElementById('customersCount');
    const merchantsCountEl = document.getElementById('merchantsCount');

    // Show zero values when unable to connect
    if (customersCountEl) customersCountEl.textContent = '0';
    if (merchantsCountEl) merchantsCountEl.textContent = '0';
}

// Initialize dashboard functionality
function initializeDashboard() {
    // Handle window resize
    window.addEventListener('resize', handleResize);

    // Initialize tooltips and other interactive elements
    initializeInteractiveElements();

    // Simulate real-time data updates
    startDataUpdates();
}

// Handle window resize for dashboard-specific responsive behavior
function handleResize() {
    // Dashboard-specific resize handling
    updateChartsOnResize();
}

// Update charts on resize (placeholder for future chart implementations)
function updateChartsOnResize() {
    // This function can be expanded when dashboard charts are added
    console.log('Dashboard: Window resized, updating layout...');
}

// Update time display
function updateTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
        hour12: true,
        hour: 'numeric',
        minute: '2-digit'
    });

    // Update any time displays if they exist
    const timeElements = document.querySelectorAll('.current-time');
    timeElements.forEach(element => {
        element.textContent = timeString;
    });
}

// Initialize interactive elements
function initializeInteractiveElements() {
    // Add hover effects to cards
    const cards = document.querySelectorAll('.stat-card, .dashboard-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-2px)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add click handlers for navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            // Remove active class from all nav items
            document.querySelectorAll('.nav-item').forEach(item => {
                item.classList.remove('active');
            });

            // Add active class to clicked item
            this.parentElement.classList.add('active');
        });
    });
}

// Start real-time data updates simulation
function startDataUpdates() {
    // Keep basic functionality for any remaining dynamic elements
    console.log('Dashboard initialized with basic update functionality');
}



// Animate counter with smooth transition
function animateCounter(element, start, end, isCurrency = false) {
    const duration = 1000; // 1 second
    const startTime = performance.now();

    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function for smooth animation
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        const current = start + (end - start) * easeProgress;

        if (isCurrency) {
            element.textContent = '$' + Math.floor(current).toLocaleString();
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }

        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }

    requestAnimationFrame(updateCounter);
}

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Trigger animation
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);

    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Export functions for use in other scripts
window.dashboardFunctions = {
    showNotification,
    logout: window.logout
};
