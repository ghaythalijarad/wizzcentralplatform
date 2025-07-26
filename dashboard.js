// Dashboard JavaScript functionality

// Authentication check and logout function
window.logout = async () => {
    try {
        if (AWS && AWS.config && AWS.config.credentials) {
            AWS.config.credentials.clearCachedId();
        }
        sessionStorage.clear();
        localStorage.clear(); // Clear both just to be safe
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Logout error:', error);
        window.location.href = 'index.html';
    }
};

// Check authentication on dashboard load
function checkAuthentication() {
    const idToken = sessionStorage.getItem('idToken');
    const accessToken = sessionStorage.getItem('accessToken');
    
    if (!idToken || !accessToken) {
        console.warn('No authentication tokens found, redirecting to login');
        window.location.href = 'index.html';
        return false;
    }
    
    console.log('Authentication tokens found, proceeding with dashboard');
    return true;
}

// DOM Elements (will be populated after DOM is ready)
let sidebar, mainContent, menuToggle, sidebarToggle;

// AWS DynamoDB initialization for stats
var dynamoDB;
async function initializeAWSForDashboard() {
    if (typeof AWS === 'undefined') throw new Error('AWS SDK not loaded');
    const resp = await fetch('../amplify_outputs.json');
    if (!resp.ok) throw new Error(`Failed loading config: ${resp.status}`);
    const cfg = await resp.json();
    const region = cfg.data.aws_region || 'us-east-1';
    const userPoolId = cfg.auth.user_pool_id;
    const identityPoolId = cfg.auth.identity_pool_id;
    const provider = `cognito-idp.${region}.amazonaws.com/${userPoolId}`;
    AWS.config.update({ region });
    const idToken = sessionStorage.getItem('idToken');
    const credParams = { IdentityPoolId: identityPoolId };
    if (idToken) credParams.Logins = { [provider]: idToken };
    AWS.config.credentials = new AWS.CognitoIdentityCredentials(credParams);
    await AWS.config.credentials.refreshPromise();
    dynamoDB = new AWS.DynamoDB.DocumentClient();
}

async function fetchTableCount(tableName) {
    const res = await dynamoDB.scan({ TableName: tableName, Select: 'COUNT' }).promise();
    return res.Count || 0;
}

async function loadDashboardStats() {
    try {
        const stats = await window.dataService.getAllStats();
        
        const customersCountEl = document.getElementById('customersCount');
        const merchantsCountEl = document.getElementById('merchantsCount');
        
        const usersCount = stats.users || 0;
        const businessesCount = stats.businesses || 0;
        
        if (customersCountEl) {
            customersCountEl.textContent = usersCount;
        }
        if (merchantsCountEl) {
            merchantsCountEl.textContent = businessesCount;
        }
        
    } catch (e) {
        console.error('Error loading dashboard stats:', e);
        // Set fallback values in case of error
        const customersCountEl = document.getElementById('customersCount');
        const merchantsCountEl = document.getElementById('merchantsCount');
        if (customersCountEl) customersCountEl.textContent = '0';
        if (merchantsCountEl) merchantsCountEl.textContent = '0';
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
        
    } catch (e) {
        console.error('Error loading recent businesses:', e);
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication first - TEMPORARILY DISABLED FOR DEBUGGING
    // if (!checkAuthentication()) {
    //     return;
    // }
    
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
    // Mobile menu toggle
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleSidebar);
    }
    
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
    }
    
    // Handle window resize
    window.addEventListener('resize', handleResize);
    
    // Initialize tooltips and other interactive elements
    initializeInteractiveElements();
    
    // Simulate real-time data updates
    startDataUpdates();
}

// Toggle sidebar visibility
function toggleSidebar() {
    // On mobile, toggle full overlay sidebar
    if (window.innerWidth <= 768) {
        sidebar.classList.toggle('active');
        toggleBackdrop();
    } else {
        // On desktop, collapse sidebar to icons only
        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('collapsed-sidebar');
    }
}

// Handle backdrop for mobile sidebar
function toggleBackdrop() {
    let backdrop = document.querySelector('.sidebar-backdrop');
    
    if (sidebar.classList.contains('active')) {
        if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'sidebar-backdrop';
            backdrop.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                z-index: 999;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(backdrop);
            
            // Trigger reflow and add opacity
            backdrop.offsetHeight;
            backdrop.style.opacity = '1';
            
            backdrop.addEventListener('click', toggleSidebar);
        }
    } else {
        if (backdrop) {
            backdrop.style.opacity = '0';
            setTimeout(() => {
                if (backdrop.parentNode) {
                    backdrop.parentNode.removeChild(backdrop);
                }
            }, 300);
        }
    }
}

// Handle window resize
function handleResize() {
    if (window.innerWidth > 768) {
        sidebar.classList.remove('active');
        const backdrop = document.querySelector('.sidebar-backdrop');
        if (backdrop && backdrop.parentNode) {
            backdrop.parentNode.removeChild(backdrop);
        }
    }
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
        card.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
        });
        
        card.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
        });
    });
    
    // Add click handlers for navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
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
    logout,
    toggleSidebar
};
