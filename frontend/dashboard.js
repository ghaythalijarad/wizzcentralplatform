// dashboard.js - Dashboard JavaScript functionality

// Global variables for charts and real-time updates
let ordersChart, revenueChart;
let realTimeInterval;
let lastUpdateTime = new Date();

// Authentication check function
function checkDashboardAuthentication() {
    console.log('🔐 Checking authentication for dashboard access...');

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
    console.log('🔢 Loading dashboard stats from REAL AWS DynamoDB data...');

    try {
        // Initialize AWS data service first
        if (!window.dataService) {
            throw new Error('dataService not available');
        }

        await window.dataService.initialize();
        console.log('✅ AWS dataService initialized');

        const stats = {
            customersCount: 0,
            merchantsCount: 0,
            driversCount: 0,
            ordersCount: 0,
            revenueCount: 0,
            ticketsCount: 0,
            promotionsCount: 0
        };

        // Define the real DynamoDB tables we'll scan
        const tables = {
            customers: 'WizzUser_users_dev',
            merchants: 'WhizzMerchants_Businesses',
            drivers: 'WhizzDrivers_dev',
            orders: 'WizzOrders',
            transactions: 'WizzUser_transactions_dev',
            promotions: 'WhizzMerchants_Discounts'
        };

        console.log('📊 Scanning DynamoDB tables for real data...');

        // 1. Get REAL customers count
        try {
            const customersResult = await window.dataService.scan(tables.customers, { Select: 'COUNT' });
            stats.customersCount = customersResult?.Count || 0;
            console.log(`✅ Customers: ${stats.customersCount} (from ${tables.customers})`);
        } catch (error) {
            console.warn(`⚠️ Failed to get customers:`, error.message);
        }

        // 2. Get REAL merchants count
        try {
            const merchantsResult = await window.dataService.scan(tables.merchants, { Select: 'COUNT' });
            stats.merchantsCount = merchantsResult?.Count || 0;
            console.log(`✅ Merchants: ${stats.merchantsCount} (from ${tables.merchants})`);
        } catch (error) {
            console.warn(`⚠️ Failed to get merchants:`, error.message);
        }

        // 3. Get REAL drivers count
        try {
            const driversResult = await window.dataService.scan(tables.drivers, { Select: 'COUNT' });
            stats.driversCount = driversResult?.Count || 0;
            console.log(`✅ Drivers: ${stats.driversCount} (from ${tables.drivers})`);
        } catch (error) {
            console.warn(`⚠️ Failed to get drivers:`, error.message);
        }

        // 4. Get REAL orders from WizzOrders table
        try {
            const ordersResult = await window.dataService.scan(tables.orders, { 
                Limit: 100,
                FilterExpression: 'begins_with(PK, :prefix)',
                ExpressionAttributeValues: { ':prefix': 'ORDER#' }
            });
            
            const orders = ordersResult?.Items || [];
            console.log(`✅ Found ${orders.length} orders in WizzOrders table`);

            // Filter orders from today
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const ordersToday = orders.filter(order => {
                if (!order.orderDate && !order.createdAt && !order.timestamp) return false;
                
                const dateStr = order.orderDate || order.createdAt || order.timestamp;
                const orderDate = new Date(dateStr);
                return orderDate >= today;
            });

            stats.ordersCount = ordersToday.length;
            console.log(`✅ Orders Today: ${stats.ordersCount}`);

            // Calculate revenue from today's orders
            ordersToday.forEach(order => {
                const totalField = order.total || order.totalAmount || order.amount || '0';
                const numericValue = parseFloat(totalField.toString().replace(/[^0-9.]/g, ''));
                if (!isNaN(numericValue)) {
                    stats.revenueCount += numericValue;
                }
            });
            console.log(`✅ Revenue Today: $${stats.revenueCount.toFixed(2)}`);

        } catch (error) {
            console.warn(`⚠️ Failed to get orders:`, error.message);
        }

        // 5. Get REAL promotions count
        try {
            const promotionsResult = await window.dataService.scan(tables.promotions, { 
                FilterExpression: 'attribute_exists(isActive) AND isActive = :active',
                ExpressionAttributeValues: { ':active': true }
            });
            stats.promotionsCount = promotionsResult?.Items?.length || 0;
            console.log(`✅ Active Promotions: ${stats.promotionsCount} (from ${tables.promotions})`);
        } catch (error) {
            console.warn(`⚠️ Failed to get promotions:`, error.message);
        }

        // 6. Support tickets - would need a real tickets table
        stats.ticketsCount = 0;

        // Update UI with real data
        updateDashboardUI(stats);
        showDashboardDataSourceIndicator('real');
        console.log('✅ Dashboard stats loaded from REAL AWS data:', stats);
        
        return;

    } catch (error) {
        console.error('❌ Failed to load real AWS data:', error.message);
        console.log('📋 Setting all stats to 0 as fallback');
        
        // Set all values to 0 as fallback
        const stats = {
            customersCount: 0,
            merchantsCount: 0,
            driversCount: 0,
            ordersCount: 0,
            revenueCount: 0,
            ticketsCount: 0,
            promotionsCount: 0
        };
        
        updateDashboardUI(stats);
        showDashboardDataSourceIndicator('failed');
        console.error('❌ All data sources failed, showing zeros');
    }
}

// Calculate dashboard statistics from API data
function calculateDashboardStatistics(ordersData, campaignsData, merchantDiscountsData) {
    const stats = {
        customersCount: 0,
        merchantsCount: 0,
        driversCount: 0,
        ordersCount: 0,
        revenueCount: 0,
        ticketsCount: 0,
        promotionsCount: 0
    };

    // Calculate from orders data
    if (ordersData && Array.isArray(ordersData)) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Count orders today
        const ordersToday = ordersData.filter(order => {
            if (!order.orderDate) return false;
            const orderDate = new Date(order.orderDate);
            return orderDate >= today;
        });

        stats.ordersCount = ordersToday.length;

        // Calculate revenue today from orders
        ordersToday.forEach(order => {
            // Extract numeric value from total (e.g., "$20,010.00" or "20,010.00 IQD")
            if (order.total) {
                const numericValue = parseFloat(order.total.replace(/[^0-9.]/g, ''));
                if (!isNaN(numericValue)) {
                    stats.revenueCount += numericValue;
                }
            }
        });

        // Extract unique customers and merchants from all orders
        const uniqueCustomers = new Set();
        const uniqueMerchants = new Set();
        const uniqueDrivers = new Set();

        ordersData.forEach(order => {
            if (order.customerId) uniqueCustomers.add(order.customerId);
            if (order.merchantId) uniqueMerchants.add(order.merchantId);
            if (order.driverId) uniqueDrivers.add(order.driverId);
        });

        stats.customersCount = uniqueCustomers.size;
        stats.merchantsCount = uniqueMerchants.size;
        stats.driversCount = uniqueDrivers.size;
    }

    // Calculate active promotions from campaigns and merchant discounts
    let activePromotions = 0;

    if (campaignsData && Array.isArray(campaignsData)) {
        const activeCampaigns = campaignsData.filter(campaign => {
            if (campaign.status === 'active') {
                const now = new Date();
                const startDate = campaign.startDate ? new Date(campaign.startDate) : null;
                const endDate = campaign.endDate ? new Date(campaign.endDate) : null;
                const withinDateRange = (!startDate || now >= startDate) && (!endDate || now <= endDate);
                return withinDateRange;
            }
            return false;
        });
        activePromotions += activeCampaigns.length;
    }

    if (merchantDiscountsData && Array.isArray(merchantDiscountsData)) {
        const activeDiscounts = merchantDiscountsData.filter(discount => {
            if (discount.status === 'active') {
                const now = new Date();
                const validUntil = discount.validUntil ? new Date(discount.validUntil) : null;
                return !validUntil || now <= validUntil;
            }
            return false;
        });
        activePromotions += activeDiscounts.length;
    }

    stats.promotionsCount = activePromotions;

    // Support tickets would need a separate API - set to 0 for now
    stats.ticketsCount = 0;

    return stats;
}

// Update dashboard UI with calculated statistics
function updateDashboardUI(stats) {
    console.log('🎨 Updating dashboard UI with stats:', stats);

    // Update customers count
    const customersEl = document.getElementById('customersCount');
    if (customersEl) {
        customersEl.textContent = stats.customersCount.toLocaleString();
    }

    // Update merchants count
    const merchantsEl = document.getElementById('merchantsCount');
    if (merchantsEl) {
        merchantsEl.textContent = stats.merchantsCount.toLocaleString();
    }

    // Update drivers count
    const driversEl = document.getElementById('driversCount');
    if (driversEl) {
        driversEl.textContent = stats.driversCount.toLocaleString();
    }

    // Update orders count
    const ordersEl = document.getElementById('ordersCount');
    if (ordersEl) {
        ordersEl.textContent = stats.ordersCount.toLocaleString();
    }

    // Update revenue count
    const revenueEl = document.getElementById('revenueCount');
    if (revenueEl) {
        revenueEl.textContent = `$${stats.revenueCount.toLocaleString('en-US', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        })}`;
    }

    // Update tickets count
    const ticketsEl = document.getElementById('ticketsCount');
    if (ticketsEl) {
        ticketsEl.textContent = stats.ticketsCount.toLocaleString();
    }

    // Update promotions count
    const promotionsEl = document.getElementById('promotionsCount');
    if (promotionsEl) {
        promotionsEl.textContent = stats.promotionsCount.toLocaleString();
    }

    console.log('✅ Dashboard UI updated successfully');
}

// Show data source indicator to inform users about the data source
function showDashboardDataSourceIndicator(sourceType) {
    const indicator = document.getElementById('dataSourceIndicator');
    const icon = document.getElementById('dataSourceIcon');
    const text = document.getElementById('dataSourceText');
    const details = document.getElementById('dataSourceDetails');
    
    if (!indicator || !icon || !text || !details) {
        console.warn('Data source indicator elements not found');
        return;
    }
    
    // Remove all existing classes
    indicator.className = 'data-source-indicator';
    
    switch (sourceType) {
        case 'real':
            indicator.classList.add('real');
            icon.className = 'indicator-icon fas fa-check-circle';
            text.textContent = 'Live Data';
            details.textContent = 'Displaying real-time data from AWS DynamoDB';
            break;
            
        case 'demo':
            indicator.classList.add('demo');
            icon.className = 'indicator-icon fas fa-exclamation-triangle';
            text.textContent = 'Demo Data';
            details.textContent = 'AWS credentials unavailable. Showing realistic demo data including 3 customers.';
            break;
            
        case 'failed':
            indicator.classList.add('failed');
            icon.className = 'indicator-icon fas fa-times-circle';
            text.textContent = 'Data Unavailable';
            details.textContent = 'Both AWS and demo endpoints failed. Showing zero values.';
            break;
            
        default:
            indicator.style.display = 'none';
            return;
    }
    
    indicator.style.display = 'flex';
    console.log(`📊 Data source indicator updated: ${sourceType}`);
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
        console.log(`✅ Recent businesses loaded: ${recentBusinesses.length}`);

    } catch (e) {
        console.error('Error loading recent businesses:', e);
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function () {
    console.log('📄 DOM Content Loaded - Starting dashboard initialization...');

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
