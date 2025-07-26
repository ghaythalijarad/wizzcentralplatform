// Dashboard JavaScript functionality

// Check if AWS SDK is loaded
if (typeof AWS === 'undefined') {
    console.error('AWS SDK not loaded. Please check the CDN script.');
}

// Expose logout() for the logout button - will be redefined by individual pages
window.logout = window.logout || function() {
    console.log('Logout function will be defined by individual pages');
    window.location.href = 'index.html';
};

// DOM Elements
const sidebar = document.getElementById('sidebar');
const mainContent = document.getElementById('mainContent');
const menuToggle = document.getElementById('menuToggle');
const sidebarToggle = document.getElementById('sidebarToggle');

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    updateTime();
    setInterval(updateTime, 60000); // Update every minute
});

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
    sidebar.classList.toggle('active');
    
    // Handle backdrop for mobile
    if (window.innerWidth <= 768) {
        toggleBackdrop();
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
    // Simulate live order updates
    setInterval(updateOrderCount, 30000); // Every 30 seconds
    
    // Simulate driver status updates
    setInterval(updateDriverStatus, 45000); // Every 45 seconds
    
    // Simulate revenue updates
    setInterval(updateRevenue, 60000); // Every minute
}

// Update order count with animation
function updateOrderCount() {
    const orderCountElement = document.querySelector('.stat-card .stat-info h3');
    if (orderCountElement) {
        const currentCount = parseInt(orderCountElement.textContent.replace(',', ''));
        const newCount = currentCount + Math.floor(Math.random() * 5) + 1;
        
        animateCounter(orderCountElement, currentCount, newCount);
    }
}

// Update driver status
function updateDriverStatus() {
    const onlineDrivers = document.querySelector('.stat-value.online');
    const deliveringDrivers = document.querySelector('.stat-value.delivering');
    
    if (onlineDrivers && deliveringDrivers) {
        const currentOnline = parseInt(onlineDrivers.textContent);
        const currentDelivering = parseInt(deliveringDrivers.textContent);
        
        // Simulate small changes
        const onlineChange = Math.floor(Math.random() * 6) - 3; // -3 to +3
        const deliveringChange = Math.floor(Math.random() * 4) - 2; // -2 to +2
        
        const newOnline = Math.max(80, Math.min(100, currentOnline + onlineChange));
        const newDelivering = Math.max(20, Math.min(40, currentDelivering + deliveringChange));
        
        animateCounter(onlineDrivers, currentOnline, newOnline);
        animateCounter(deliveringDrivers, currentDelivering, newDelivering);
    }
}

// Update revenue
function updateRevenue() {
    const revenueElement = document.querySelector('.stat-icon.revenue').nextElementSibling.querySelector('h3');
    if (revenueElement) {
        const currentRevenue = parseFloat(revenueElement.textContent.replace('$', '').replace(',', ''));
        const newRevenue = currentRevenue + (Math.random() * 100) + 50;
        
        animateCounter(revenueElement, currentRevenue, newRevenue, true);
    }
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

// Logout functionality
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        // Clear any stored authentication data
        localStorage.removeItem('userToken');
        sessionStorage.clear();
        
        // Redirect to login page
        window.location.href = 'index.html';
    }
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
