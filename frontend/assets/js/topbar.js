/**
 * Top Bar Management - WizzCentral Platform
 * Handles top bar functionality including user dropdown, notifications, and mobile menu
 */

class TopBarManager {
    constructor() {
        this.userDropdown = null;
        this.userProfileBtn = null;
        this.dropdownBackdrop = null;
        this.mobileMenuToggle = null;
        this.notificationBtn = null;
        this.themeToggle = null;
        this.searchBtn = null;
        
        this.init();
    }

    init() {
        // Wait for DOM to be fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Get elements
        this.userDropdown = document.getElementById('userDropdownMenu');
        this.userProfileBtn = document.getElementById('userProfileBtn');
        this.mobileMenuToggle = document.getElementById('mobileMenuToggle');
        this.notificationBtn = document.getElementById('notificationBtn');
        this.themeToggle = document.getElementById('themeToggle');
        this.searchBtn = document.getElementById('searchBtn');

        // Create backdrop
        this.createBackdrop();

        // Setup event listeners
        this.setupEventListeners();

        // Update user info
        this.updateUserInfo();

        // Update breadcrumb
        this.updateBreadcrumb();

        // Handle sidebar toggle state for top bar
        this.handleSidebarState();
    }

    createBackdrop() {
        this.dropdownBackdrop = document.createElement('div');
        this.dropdownBackdrop.className = 'dropdown-backdrop';
        this.dropdownBackdrop.addEventListener('click', () => this.closeDropdown());
        document.body.appendChild(this.dropdownBackdrop);
    }

    setupEventListeners() {
        // User profile dropdown toggle
        if (this.userProfileBtn) {
            this.userProfileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleDropdown();
            });
        }

        // Mobile menu toggle
        if (this.mobileMenuToggle) {
            this.mobileMenuToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('topbarLogout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleLogout();
            });
        }

        // Notification button
        if (this.notificationBtn) {
            this.notificationBtn.addEventListener('click', () => {
                this.showNotifications();
            });
        }

        // Theme toggle
        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Search button
        if (this.searchBtn) {
            this.searchBtn.addEventListener('click', () => {
                this.openSearch();
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.userProfileBtn?.contains(e.target) && 
                !this.userDropdown?.contains(e.target)) {
                this.closeDropdown();
            }
        });

        // Listen for sidebar toggle to adjust top bar
        document.addEventListener('sidebarToggled', (e) => {
            this.adjustForSidebar(e.detail.collapsed);
        });
    }

    toggleDropdown() {
        const isActive = this.userDropdown?.classList.contains('active');
        
        if (isActive) {
            this.closeDropdown();
        } else {
            this.openDropdown();
        }
    }

    openDropdown() {
        this.userDropdown?.classList.add('active');
        this.userProfileBtn?.classList.add('active');
        this.dropdownBackdrop?.classList.add('active');
    }

    closeDropdown() {
        this.userDropdown?.classList.remove('active');
        this.userProfileBtn?.classList.remove('active');
        this.dropdownBackdrop?.classList.remove('active');
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.getElementById('mainContent');
        
        if (sidebar) {
            sidebar.classList.toggle('active');
            
            // Dispatch event for other components
            const event = new CustomEvent('sidebarToggled', {
                detail: { 
                    active: sidebar.classList.contains('active'),
                    collapsed: sidebar.classList.contains('collapsed')
                }
            });
            document.dispatchEvent(event);
        }
    }

    handleSidebarState() {
        // Check if sidebar is collapsed and adjust top bar
        const sidebar = document.getElementById('sidebar');
        const topbar = document.getElementById('topbar');
        
        if (sidebar && topbar) {
            const isCollapsed = sidebar.classList.contains('collapsed');
            if (isCollapsed) {
                topbar.classList.add('collapsed-sidebar');
            }
        }
    }

    adjustForSidebar(collapsed) {
        const topbar = document.getElementById('topbar');
        if (topbar) {
            if (collapsed) {
                topbar.classList.add('collapsed-sidebar');
            } else {
                topbar.classList.remove('collapsed-sidebar');
            }
        }
    }

    async updateUserInfo() {
        try {
            // Try to get user info from auth utils or local storage
            const userName = localStorage.getItem('userName') || 'Admin User';
            const userEmail = localStorage.getItem('userEmail') || 'admin@whizz.sa';
            
            // Update top bar user name
            const topbarUserName = document.getElementById('topbarUserName');
            if (topbarUserName) {
                topbarUserName.textContent = userName.split(' ')[0]; // First name only
            }

            // Update dropdown user info
            const dropdownUserName = document.getElementById('dropdownUserName');
            const dropdownUserEmail = document.getElementById('dropdownUserEmail');
            
            if (dropdownUserName) {
                dropdownUserName.textContent = userName;
            }
            
            if (dropdownUserEmail) {
                dropdownUserEmail.textContent = userEmail;
            }
        } catch (error) {
            console.error('Error updating user info:', error);
        }
    }

    updateBreadcrumb() {
        const breadcrumbPage = document.getElementById('breadcrumbPage');
        if (!breadcrumbPage) return;

        // Prefer body data-page for accurate naming
        const pageNameRaw = document.body.dataset.page || document.title.replace('WizzCentral Platform - ', '') || 'Dashboard';
        // Normalize some known cases
        const mappings = { 'orders': 'Orders', 'drivers': 'Drivers', 'regions': 'Regions', 'analytics': 'Analytics', 'conditions': 'Conditions', 'dashboard': 'Dashboard' };
        const formattedName = mappings[pageNameRaw.toLowerCase?.() || pageNameRaw] || (pageNameRaw.charAt(0).toUpperCase() + pageNameRaw.slice(1));
        breadcrumbPage.textContent = formattedName;
    }

    async handleLogout() {
        try {
            this.closeDropdown();
            
            // Show confirmation
            if (!confirm('Are you sure you want to logout?')) {
                return;
            }

            console.log('🔴 Logging out user...');

            // Clear local storage
            localStorage.clear();
            sessionStorage.clear();

            // Try to sign out from Cognito if available
            try {
                if (window.AuthService && typeof window.AuthService.signOut === 'function') {
                    await window.AuthService.signOut();
                    console.log('✅ AuthService signOut completed');
                } else if (window.Auth && typeof window.Auth.logout === 'function') {
                    await window.Auth.logout();
                    console.log('✅ Auth logout completed');
                }
            } catch (signOutError) {
                console.warn('⚠️ Sign out from service failed, continuing with redirect:', signOutError);
            }

            console.log('🔄 Redirecting to login page...');
            
            // Redirect to login/home page
            const currentPath = window.location.pathname || '';
            const loginUrl = currentPath.includes('/frontend/') ? '/frontend/index.html' : '/index.html';
            
            window.location.href = loginUrl;
        } catch (error) {
            console.error('❌ Error during logout:', error);
            // Force redirect even if there's an error
            const currentPath = window.location.pathname || '';
            const loginUrl = currentPath.includes('/frontend/') ? '/frontend/index.html' : '/index.html';
            window.location.href = loginUrl;
        }
    }

    showNotifications() {
        // Placeholder for notifications functionality
        console.log('Show notifications');
        alert('Notifications feature coming soon!');
    }

    toggleTheme() {
        // Placeholder for theme toggle functionality
        const body = document.body;
        const isDark = body.classList.toggle('dark-theme');
        
        // Update icon
        const icon = this.themeToggle?.querySelector('i');
        if (icon) {
            if (isDark) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
            }
        }

        // Save preference
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        
        console.log('Theme toggled:', isDark ? 'dark' : 'light');
    }

    openSearch() {
        // Placeholder for search functionality
        console.log('Open search');
        const searchQuery = prompt('Enter search query:');
        if (searchQuery) {
            console.log('Searching for:', searchQuery);
        }
    }

    // Public method to update notification badge
    updateNotificationCount(count) {
        const badge = document.getElementById('notificationBadge');
        if (badge) {
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }
    }

    // Public method to update breadcrumb dynamically
    setBreadcrumb(pageName) {
        const breadcrumbPage = document.getElementById('breadcrumbPage');
        if (breadcrumbPage) {
            breadcrumbPage.textContent = pageName;
        }
    }
}

// Initialize top bar when script loads
const topBarManager = new TopBarManager();

// Expose to window for external access
window.topBarManager = topBarManager;
