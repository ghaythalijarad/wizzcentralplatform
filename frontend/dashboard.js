// dashboard.js - Dashboard JavaScript functionality

// Global variables for charts and real-time updates
let ordersChart, revenueChart;
let realTimeInterval;
let lastUpdateTime = new Date();

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
    
    // Initialize charts
    initializeCharts();
    
    // Start real-time updates
    startRealTimeUpdates();
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
                // Special handling for promotions count - get actual active promotions
                if (elementId === 'promotionsCount') {
                    const platformDiscounts = await window.dataService.getPlatformDiscounts();
                    const activePromotions = platformDiscounts.filter(promo => {
                        const isActive = promo.isActive === true || promo.isActive === 'true';
                        const now = new Date();
                        const startDate = promo.startDate ? new Date(promo.startDate) : null;
                        const endDate = promo.endDate ? new Date(promo.endDate) : null;
                        const withinDateRange = (!startDate || now >= startDate) && (!endDate || now <= endDate);
                        return isActive && withinDateRange;
                    }).length;
                    
                    counts[elementId.replace('Count','')] = activePromotions;
                    const el = document.getElementById(elementId);
                    if (el) el.textContent = activePromotions.toString();
                    console.log(`✅ ${elementId}: ${activePromotions} (active promotions)`);
                    continue;
                }
                
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

    // Initialize dashboard-specific functionality
    initializeDashboard();

    // Load dashboard data
    loadDashboardStats();
    
    // Initialize charts
    initializeCharts();
    
    // Start real-time updates
    startRealTimeUpdates();
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

    // Initialize charts
    initializeCharts();

    // Start real-time updates
    startRealTimeUpdates();
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

// Initialize charts
function initializeCharts() {
    console.log('📊 Initializing dashboard charts...');
    
    // Orders Chart
    const ordersCtx = document.getElementById('ordersChart');
    if (ordersCtx) {
        ordersChart = new Chart(ordersCtx, {
            type: 'line',
            data: {
                labels: generateTimeLabels(24), // Last 24 hours
                datasets: [{
                    label: 'Orders',
                    data: generateMockOrderData(24),
                    borderColor: '#667eea',
                    backgroundColor: 'rgba(102, 126, 234, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Completed',
                    data: generateMockCompletedData(24),
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f1f5f9'
                        }
                    },
                    x: {
                        grid: {
                            color: '#f1f5f9'
                        }
                    }
                }
            }
        });
    }
    
    // Revenue Chart
    const revenueCtx = document.getElementById('revenueChart');
    if (revenueCtx) {
        revenueChart = new Chart(revenueCtx, {
            type: 'bar',
            data: {
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [{
                    label: 'Revenue ($)',
                    data: [1250, 1890, 2340, 1650, 2100, 2800, 2150],
                    backgroundColor: [
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(249, 115, 22, 0.8)',
                        'rgba(16, 185, 129, 0.8)',
                        'rgba(245, 158, 11, 0.8)',
                        'rgba(239, 68, 68, 0.8)',
                        'rgba(139, 92, 246, 0.8)',
                        'rgba(6, 182, 212, 0.8)'
                    ],
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: '#f1f5f9'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }
}

// Generate time labels for charts
function generateTimeLabels(hours) {
    const labels = [];
    const now = new Date();
    
    for (let i = hours - 1; i >= 0; i--) {
        const time = new Date(now.getTime() - (i * 60 * 60 * 1000));
        labels.push(time.getHours() + ':00');
    }
    
    return labels;
}

// Generate mock order data
function generateMockOrderData(points) {
    const data = [];
    const baseValue = 20;
    
    for (let i = 0; i < points; i++) {
        const variance = Math.random() * 20 - 10; // ±10
        const timeBoost = (i > points - 8) ? Math.random() * 15 : 0; // Recent hours boost
        data.push(Math.max(0, Math.round(baseValue + variance + timeBoost)));
    }
    
    return data;
}

// Generate mock completed order data
function generateMockCompletedData(points) {
    const data = [];
    const baseValue = 18;
    
    for (let i = 0; i < points; i++) {
        const variance = Math.random() * 15 - 7; // ±7
        const timeBoost = (i > points - 8) ? Math.random() * 12 : 0; // Recent hours boost
        data.push(Math.max(0, Math.round(baseValue + variance + timeBoost)));
    }
    
    return data;
}

// Start real-time updates
function startRealTimeUpdates() {
    console.log('🔄 Starting real-time dashboard updates...');
    
    // Update every 30 seconds
    realTimeInterval = setInterval(() => {
        updateRealTimeData();
        lastUpdateTime = new Date();
    }, 30000);
    
    // Initial update
    updateRealTimeData();
}

// Update real-time data
function updateRealTimeData() {
    console.log('🔄 Updating real-time data...');
    
    // Simulate real-time data updates
    updatePerformanceMetrics();
    updateActivityFeed();
    
    // Optionally refresh charts with new data
    if (Math.random() > 0.7) { // 30% chance to update charts
        updateChartsData();
    }
}

// Update performance metrics
function updatePerformanceMetrics() {
    const metrics = {
        avgOrderValue: (25 + Math.random() * 10).toFixed(2),
        orderCompletionRate: (88 + Math.random() * 10).toFixed(1),
        avgDeliveryTime: Math.round(25 + Math.random() * 10),
        activeDriversNow: Math.round(15 + Math.random() * 20)
    };
    
    // Update UI elements
    document.getElementById('avgOrderValue').textContent = '$' + metrics.avgOrderValue;
    document.getElementById('orderCompletionRate').textContent = metrics.orderCompletionRate + '%';
    document.getElementById('avgDeliveryTime').textContent = metrics.avgDeliveryTime + 'min';
    document.getElementById('activeDriversNow').textContent = metrics.activeDriversNow;
}

// Update activity feed with new activity
function updateActivityFeed() {
    const activities = [
        {
            icon: 'fas fa-shopping-bag',
            iconClass: 'order',
            title: 'New order #' + Math.round(1000 + Math.random() * 9000),
            description: 'Customer: ' + getRandomName() + ' • $' + (15 + Math.random() * 30).toFixed(2),
            time: 'Just now'
        },
        {
            icon: 'fas fa-user-plus',
            iconClass: 'customer',
            title: 'New customer registered',
            description: getRandomName() + ' joined the platform',
            time: Math.round(Math.random() * 5) + ' minutes ago'
        },
        {
            icon: 'fas fa-store',
            iconClass: 'merchant',
            title: 'Merchant verification',
            description: getRandomRestaurant() + ' verified successfully',
            time: Math.round(Math.random() * 15) + ' minutes ago'
        }
    ];
    
    const randomActivity = activities[Math.floor(Math.random() * activities.length)];
    const activityList = document.getElementById('recentActivityList');
    
    if (activityList && Math.random() > 0.8) { // 20% chance to add new activity
        const newActivity = document.createElement('div');
        newActivity.className = 'activity-item';
        newActivity.style.opacity = '0';
        newActivity.innerHTML = `
            <div class="activity-icon ${randomActivity.iconClass}">
                <i class="${randomActivity.icon}"></i>
            </div>
            <div class="flex-1">
                <h4 class="font-semibold text-gray-900">${randomActivity.title}</h4>
                <p class="text-sm text-gray-600">${randomActivity.description}</p>
                <p class="text-xs text-gray-500">${randomActivity.time}</p>
            </div>
        `;
        
        activityList.insertBefore(newActivity, activityList.firstChild);
        
        // Animate in
        setTimeout(() => {
            newActivity.style.transition = 'opacity 0.5s ease';
            newActivity.style.opacity = '1';
        }, 100);
        
        // Remove oldest if more than 6 items
        if (activityList.children.length > 6) {
            activityList.removeChild(activityList.lastChild);
        }
    }
}

// Update charts with new data
function updateChartsData() {
    if (ordersChart) {
        // Add new data point and remove oldest
        const newOrderValue = Math.round(15 + Math.random() * 25);
        const newCompletedValue = Math.round(12 + Math.random() * 20);
        
        ordersChart.data.datasets[0].data.push(newOrderValue);
        ordersChart.data.datasets[1].data.push(newCompletedValue);
        
        ordersChart.data.datasets[0].data.shift();
        ordersChart.data.datasets[1].data.shift();
        
        // Update labels
        const now = new Date();
        ordersChart.data.labels.push(now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0'));
        ordersChart.data.labels.shift();
        
        ordersChart.update('none'); // No animation for real-time updates
    }
}

// Helper functions for random data
function getRandomName() {
    const names = ['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'David Brown', 'Emily Davis', 'Chris Miller', 'Lisa Garcia'];
    return names[Math.floor(Math.random() * names.length)];
}

function getRandomRestaurant() {
    const restaurants = ['Pizza Palace', 'Burger Junction', 'Sushi Garden', 'Taco Express', 'Pasta Corner', 'BBQ House', 'Coffee Central', 'Ice Cream Dreams'];
    return restaurants[Math.floor(Math.random() * restaurants.length)];
}

// Refresh analytics function
function refreshAnalytics() {
    console.log('🔄 Refreshing analytics...');
    
    if (ordersChart) {
        ordersChart.data.datasets[0].data = generateMockOrderData(24);
        ordersChart.data.datasets[1].data = generateMockCompletedData(24);
        ordersChart.update();
    }
    
    if (revenueChart) {
        const newData = Array.from({length: 7}, () => Math.round(1000 + Math.random() * 2000));
        revenueChart.data.datasets[0].data = newData;
        revenueChart.update();
    }
    
    updatePerformanceMetrics();
}

// Generate report function
function generateReport() {
    console.log('📊 Generating dashboard report...');
    
    // Create a simple report (in a real app, this would be more sophisticated)
    const reportData = {
        generatedAt: new Date().toISOString(),
        totalCustomers: document.getElementById('customersCount').textContent,
        totalMerchants: document.getElementById('merchantsCount').textContent,
        totalDrivers: document.getElementById('driversCount').textContent,
        totalOrders: document.getElementById('ordersCount').textContent,
        totalRevenue: document.getElementById('revenueCount').textContent,
        supportTickets: document.getElementById('ticketsCount').textContent
    };
    
    // Download as JSON (in a real app, this would be a PDF or Excel file)
    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `dashboard-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Show success message
    showNotification('Report generated successfully!', 'success');
}

// Cleanup function for when leaving the dashboard
function cleanup() {
    if (realTimeInterval) {
        clearInterval(realTimeInterval);
        realTimeInterval = null;
        console.log('🧹 Cleaned up real-time updates');
    }
    
    if (ordersChart) {
        ordersChart.destroy();
        ordersChart = null;
    }
    
    if (revenueChart) {
        revenueChart.destroy();
        revenueChart = null;
    }
}

// Clean up when page is unloaded
window.addEventListener('beforeunload', cleanup);
window.addEventListener('pagehide', cleanup);

// Show notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg transition-all duration-300 transform translate-x-full`;
    
    const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
    notification.classList.add(bgColor, 'text-white');
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
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
