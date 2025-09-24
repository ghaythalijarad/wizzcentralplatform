// Unified Navigation System for WizzCentral Platform
// Handles sidebar loading, active states, navigation, and interactions

class NavigationManager {
    constructor() {
        this.currentPage = null;
        this.sidebar = null;
        this.mainContent = null;
        this.menuToggle = null;
        this.sidebarToggle = null;
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) {
            console.log('🧭 NavigationManager: Already initialized, skipping...');
            return;
        }

        console.log('🧭 NavigationManager: Initializing...');
        console.log('🔧 Current URL:', window.location.href);
        console.log('🔧 Current pathname:', window.location.pathname);

        try {
            // Load sidebar HTML first
            await this.loadSidebar();

            // Setup DOM references
            this.setupDOMReferences();

            // Auto-correct duplicated /pages/ segments in current URL if present
            this.fixDuplicatedPagesInPath();

            // Normalize/repair nav links for current hosting base path
            this.rewriteNavLinks();

            // Initialize navigation features
            this.initializeNavigation();

            // Set active page
            this.setActivePage();

            // Setup event listeners
            this.setupEventListeners();

            this.isInitialized = true;
            console.log('✅ NavigationManager: Initialized successfully');

            // Dispatch event for other scripts
            document.dispatchEvent(new CustomEvent('navigation:ready', {
                detail: { manager: this }
            }));

        } catch (error) {
            console.error('❌ NavigationManager: Initialization failed:', error);
        }
    }

    // Collapse any repeated /pages/ segments in the current path and redirect once
    fixDuplicatedPagesInPath() {
        try {
            const { pathname, search, hash } = window.location;
            if (/(\/pages\/){2,}/.test(pathname)) {
                const cleaned = pathname.replace(/(?:\/pages\/)+/g, '/pages/');
                if (cleaned !== pathname) {
                    const basePrefix = this._getBasePrefix();
                    // Ensure we keep the frontend prefix if needed
                    let finalPath = cleaned;
                    if (basePrefix === '/frontend' && !cleaned.startsWith('/frontend/')) {
                        finalPath = '/frontend' + cleaned;
                    }
                    const target = finalPath + (search || '') + (hash || '');
                    console.warn('🧼 Fixing duplicated /pages/ in URL ->', target);
                    window.location.replace(target);
                }
            }
        } catch (e) {
            console.warn('fixDuplicatedPagesInPath failed', e);
        }
    }

    async loadSidebar() {
        const container = document.getElementById('sidebar-placeholder');
        if (!container) {
            throw new Error('sidebar-placeholder element not found');
        }

        console.log('🔄 NavigationManager: Loading sidebar...');

        const candidates = [
            '../includes/sidebar.html',
            '/frontend/includes/sidebar.html',
            '/includes/sidebar.html',
            'includes/sidebar.html'
        ];

        let lastError = null;
        for (const url of candidates) {
            try {
                console.log(`📋 Trying to load sidebar from: ${url}`);
                const response = await fetch(url, { cache: 'no-cache' });
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const html = await response.text();
                container.innerHTML = html;
                console.log('✅ NavigationManager: Sidebar HTML loaded from', url);
                // Ensure links are valid for current base after injection
                this.rewriteNavLinks(container);
                // Initialize user profile after sidebar is loaded
                setTimeout(() => this.initializeUserProfile(), 100);
                return;
            } catch (err) {
                lastError = err;
                console.warn('❌ Sidebar fetch failed from', url, err);
            }
        }

        console.error('❌ NavigationManager: Failed to load sidebar from all candidates, using fallback:', lastError);
        // Fallback sidebar HTML
        container.innerHTML = this.getFallbackSidebar();
        // Normalize links in fallback sidebar as well
        this.rewriteNavLinks(container);
    }

    setupDOMReferences() {
        this.sidebar = document.getElementById('sidebar');
        this.mainContent = document.getElementById('mainContent');
        this.menuToggle = document.getElementById('menuToggle');
        this.sidebarToggle = document.getElementById('sidebarToggle');

        // Get current page from body data attribute
        this.currentPage = document.body.dataset.page;

        console.log('🔗 NavigationManager: DOM references setup', {
            sidebar: !!this.sidebar,
            mainContent: !!this.mainContent,
            menuToggle: !!this.menuToggle,
            sidebarToggle: !!this.sidebarToggle,
            currentPage: this.currentPage
        });
    }

    initializeNavigation() {
        // Add navigation click handlers
        if (this.sidebar) {
            const navLinks = this.sidebar.querySelectorAll('.md-navigation-item');
            navLinks.forEach(link => {
                link.addEventListener('click', (e) => this.handleNavigation(e));
            });
            
            // Ensure sidebar is visible on desktop by default
            if (!this.isMobile()) {
                this.sidebar.classList.add('md-navigation-drawer--open');
                this.sidebar.style.transform = 'translateX(0)';
            }
        }

        // Setup responsive behavior
        this.handleResize();

        // Initialize user profile if available
        this.initializeUserProfile();
    }

    setActivePage() {
        if (!this.currentPage || !this.sidebar) return;

        // Remove all active states
        const navItems = this.sidebar.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));

        // Set active state for current page
        const activeItem = this.sidebar.querySelector(`.nav-item[data-page="${this.currentPage}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
            console.log(`🎯 NavigationManager: Set active page: ${this.currentPage}`);
        } else {
            console.warn(`⚠️ NavigationManager: No nav item found for page: ${this.currentPage}`);
        }
    }

    setupEventListeners() {
        // Mobile menu toggle
        if (this.menuToggle) {
            this.menuToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Sidebar toggle button
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        }

        // Handle window resize
        window.addEventListener('resize', () => this.handleResize());

        // Handle escape key to close mobile sidebar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isMobileSidebarOpen()) {
                this.closeMobileSidebar();
            }
        });

        // Global in-app link normalization (captures clicks anywhere on the page)
        document.addEventListener('click', (e) => {
            // Respect modifier keys and middle clicks
            if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
            const a = e.target.closest && e.target.closest('a');
            if (!a) return;
            const href = a.getAttribute('href') || '';
            // Normalize and navigate if possible (includes links missing .html)
            const normalized = this.normalizeHref(href);
            if (normalized) {
                e.preventDefault();
                console.log('🧭 NavigationManager: Global normalized navigation', { from: href, to: normalized });
                window.location.href = normalized;
            }
        }, true);
    }

    handleNavigation(event) {
        const link = event.currentTarget;
        const rawHref = link.getAttribute('href');

        try {
            const newHref = this.normalizeHref(rawHref);
            if (newHref) {
                event.preventDefault();
                console.log('🧭 NavigationManager: Normalized navigation', { from: rawHref, to: newHref });
                window.location.href = newHref;
                return;
            }
        } catch (e) {
            console.warn('NavigationManager: handleNavigation normalization failed, falling back', e);
        }

        console.log(`🧭 NavigationManager: Navigating to ${rawHref}`);
    }

    // Helper to detect current base prefix consistently with auth-utils
    _getBasePrefix() {
        try {
            const path = window.location.pathname || '';
            // When served from Amplify with frontend as root, no prefix needed
            if (path.startsWith('/pages/')) return '';
            // When served from repo with /frontend/ in path, use /frontend prefix
            if (path.startsWith('/frontend/')) return '/frontend';
            // When path contains /pages/ somewhere, extract prefix
            const idx = path.indexOf('/pages/');
            if (idx > -1) return path.slice(0, idx);
            // For root pages like / or /index.html, no prefix
            if (path === '/' || path === '/index.html' || path === '/login.html') return '';
        } catch (_) { }
        return '';
    }

    // Compute normalized absolute href for in-app html pages; returns null if cannot normalize
    normalizeHref(rawHref) {
        if (!rawHref) return null;
        // Ignore absolute external links
        if (/^https?:\/\//i.test(rawHref)) return null;
        // Ignore anchors and javascript links
        if (rawHref.startsWith('#') || rawHref.startsWith('javascript:')) return null;

        // Build a URL to parse search/hash reliably without inheriting deep nested paths
        let url;
        try {
            url = new URL(rawHref, window.location.origin + '/');
        } catch (e) {
            return null;
        }

        let path = url.pathname || '';

        // Do not normalize explicit login/index destinations
        if (/\/index\.html$/i.test(path) || /\/login\.html$/i.test(path)) {
            return null;
        }

        const basePrefix = this._getBasePrefix();

        // Helper to ensure filename has .html
        const ensureHtml = (name) => /\.[a-z0-9]+$/i.test(name) ? name : (name + '.html');

        // 1) If path already contains /pages/, collapse to the final filename under a single /pages/
        let match = path.match(/\/pages\/(?:.*\/)?([^\/?#]+)$/i);
        if (match && match[1]) {
            const file = ensureHtml(match[1]);
            const tail = '/pages/' + file;
            return (basePrefix || '') + tail + (url.search || '') + (url.hash || '');
        }

        // 2) If path starts with /frontend/pages but regex above failed (edge cases)
        match = path.match(/\/frontend\/pages\/(?:.*\/)?([^\/?#]+)$/i);
        if (match && match[1]) {
            const file = ensureHtml(match[1]);
            const tail = '/pages/' + file;
            return (basePrefix || '') + tail + (url.search || '') + (url.hash || '');
        }

        // 3) If a plain html file name or relative like merchants or merchants.html
        const fileOnly = path.replace(/^\/+/, '');
        if (/^[A-Za-z0-9_-]+(\.[a-z0-9]+)?$/i.test(fileOnly)) {
            const file = ensureHtml(fileOnly);
            const tail = '/pages/' + file;
            return (basePrefix || '') + tail + (url.search || '') + (url.hash || '');
        }

        // 4) Unknown pattern -> do not intercept
        return null;
    }

    // Detect current base prefix ('' or '/frontend') and rewrite sidebar links accordingly
    rewriteNavLinks(containerEl) {
        try {
            const container = containerEl || this.sidebar || document;
            const links = container.querySelectorAll?.('a.nav-link');
            if (!links || !links.length) return;

            links.forEach(a => {
                const rawHref = a.getAttribute('href') || '';
                const newHref = this.normalizeHref(rawHref);
                if (newHref && newHref !== rawHref) {
                    a.setAttribute('href', newHref);
                    if (Math.random() < 0.05) console.log('🔧 Rewrote nav link', { from: rawHref, to: newHref });
                }
            });
        } catch (e) {
            console.warn('NavigationManager: rewriteNavLinks failed', e);
        }
    }

    toggleSidebar() {
        if (!this.sidebar) return;

        if (this.isMobile()) {
            // Mobile: Toggle overlay sidebar
            this.toggleMobileSidebar();
        } else {
            // Desktop: Toggle collapsed state
            this.toggleDesktopSidebar();
        }
    }

    toggleMobileSidebar() {
        if (!this.sidebar) return;

        const isOpen = this.sidebar.classList.toggle('active');

        if (isOpen) {
            this.createBackdrop();
            document.body.style.overflow = 'hidden';
        } else {
            this.removeBackdrop();
            document.body.style.overflow = '';
        }
    }

    toggleDesktopSidebar() {
        if (!this.sidebar || !this.mainContent) return;

        this.sidebar.classList.toggle('collapsed');
        this.mainContent.classList.toggle('collapsed-sidebar');

        // Store preference
        const isCollapsed = this.sidebar.classList.contains('collapsed');
        localStorage.setItem('sidebar-collapsed', isCollapsed);
    }

    closeMobileSidebar() {
        if (!this.sidebar) return;

        this.sidebar.classList.remove('active');
        this.removeBackdrop();
        document.body.style.overflow = '';
    }

    isMobileSidebarOpen() {
        return this.sidebar && this.sidebar.classList.contains('active') && this.isMobile();
    }

    createBackdrop() {
        this.removeBackdrop(); // Remove existing backdrop first

        const backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 999;
            backdrop-filter: blur(2px);
        `;

        backdrop.addEventListener('click', () => this.closeMobileSidebar());
        document.body.appendChild(backdrop);
    }

    removeBackdrop() {
        const backdrop = document.querySelector('.sidebar-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
    }

    handleResize() {
        if (!this.sidebar) return;

        if (this.isMobile()) {
            // Mobile: Remove desktop classes, close sidebar
            this.sidebar.classList.remove('collapsed');
            this.sidebar.classList.remove('md-navigation-drawer--open');
            if (this.mainContent) {
                this.mainContent.classList.remove('collapsed-sidebar');
            }
            this.closeMobileSidebar();
        } else {
            // Desktop: Remove mobile classes, restore collapsed state
            this.sidebar.classList.remove('active');
            this.sidebar.classList.add('md-navigation-drawer--open');
            this.sidebar.style.transform = 'translateX(0)';
            this.removeBackdrop();
            document.body.style.overflow = '';

            // Restore desktop collapsed state from localStorage
            const isCollapsed = localStorage.getItem('sidebar-collapsed') === 'true';
            if (isCollapsed) {
                this.sidebar.classList.add('collapsed');
                if (this.mainContent) {
                    this.mainContent.classList.add('collapsed-sidebar');
                }
            }
        }
    }

    initializeUserProfile() {
        // Wait for sidebar to be loaded, then try multiple times
        const maxRetries = 5;
        let retryCount = 0;
        
        const updateUserProfile = () => {
            const userNameEl = this.sidebar?.querySelector('.user-name') || document.querySelector('.user-name');
            const userRoleEl = this.sidebar?.querySelector('.user-role') || document.querySelector('.user-role');
            const userAvatarEl = this.sidebar?.querySelector('.user-avatar') || document.querySelector('.user-avatar');

            if (userNameEl || userRoleEl) {
                console.log('🔍 Updating user profile in sidebar...');
                
                // Try to get user info from multiple sources
                let userName = 'Admin User';
                let userRole = 'Administrator';
                let userEmail = '';
                
                try {
                    // First try: Get from sessionStorage directly
                    userEmail = sessionStorage.getItem('userEmail') || '';
                    const isAuthenticated = sessionStorage.getItem('isAuthenticated') === 'true';
                    
                    if (userEmail) {
                        userName = userEmail.split('@')[0]; // Use part before @
                        console.log(`✅ Found user email in session: ${userEmail}`);
                    }
                    
                    // Second try: Decode JWT token if available
                    const token = sessionStorage.getItem('idToken');
                    if (token) {
                        try {
                            const payload = JSON.parse(atob(token.split('.')[1]));
                            
                            if (payload.email) {
                                userEmail = payload.email;
                                userName = payload.name || payload.given_name || payload.email.split('@')[0];
                            }
                            
                            if (payload['custom:role']) {
                                userRole = payload['custom:role'];
                            } else if (payload.username) {
                                userName = payload.username;
                            }
                            
                            console.log(`✅ Decoded user from token:`, { userName, userEmail, userRole });
                        } catch (tokenError) {
                            console.log('⚠️ Could not decode JWT token:', tokenError.message);
                        }
                    }
                    
                    // Update the UI elements
                    if (userNameEl) {
                        userNameEl.textContent = userName;
                        console.log(`✅ Updated user name: ${userName}`);
                    }
                    if (userRoleEl) {
                        userRoleEl.textContent = userRole;
                        console.log(`✅ Updated user role: ${userRole}`);
                    }
                    
                    // Update avatar with user initials
                    if (userAvatarEl && userName !== 'Admin User') {
                        const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase();
                        userAvatarEl.innerHTML = `<span style="font-weight: bold; color: white;">${initials}</span>`;
                    }
                    
                } catch (error) {
                    console.log('⚠️ Could not get user info:', error.message);
                    // Keep default values
                }
            } else if (retryCount < maxRetries) {
                // Retry if elements not found yet
                retryCount++;
                console.log(`🔄 User profile elements not found, retrying... (${retryCount}/${maxRetries})`);
                setTimeout(updateUserProfile, 500);
            }
        };
        
        // Start the update process
        updateUserProfile();
    }

    isMobile() {
        return window.innerWidth <= 768;
    }

    getFallbackSidebar() {
        return `
            <div class="sidebar" id="sidebar">
                <div class="sidebar-header">
                    <div class="logo">
                        <i class="fas fa-rocket"></i>
                        <span>WizzCentral</span>
                    </div>
                    <button class="sidebar-toggle" id="sidebarToggle">
                        <i class="fas fa-bars"></i>
                    </button>
                </div>
                <nav class="sidebar-nav">
                    <ul>
                        <li class="nav-item" data-page="dashboard">
                            <a href="/frontend/pages/dashboard.html" class="nav-link">
                                <i class="fas fa-tachometer-alt"></i>
                                <span>Dashboard</span>
                            </a>
                        </li>
                        <li class="nav-item" data-page="drivers">
                            <a href="/frontend/pages/drivers.html" class="nav-link">
                                <i class="fas fa-motorcycle"></i>
                                <span>Drivers</span>
                            </a>
                        </li>
                        <li class="nav-item" data-page="customers">
                            <a href="/frontend/pages/customers.html" class="nav-link">
                                <i class="fas fa-users"></i>
                                <span>Customers</span>
                            </a>
                        </li>
                        <li class="nav-item" data-page="merchants">
                            <a href="/frontend/pages/merchants.html" class="nav-link">
                                <i class="fas fa-store"></i>
                                <span>Merchants</span>
                            </a>
                        </li>
                        <li class="nav-item" data-page="orders">
                            <a href="/frontend/pages/orders.html" class="nav-link">
                                <i class="fas fa-shopping-bag"></i>
                                <span>Orders</span>
                            </a>
                        </li>
                        <li class="nav-item" data-page="promotions">
                            <a href="/frontend/pages/promotions.html" class="nav-link">
                                <i class="fas fa-tags"></i>
                                <span>Promotions</span>
                            </a>
                        </li>
                        <li class="nav-item" data-page="support">
                            <a href="/frontend/pages/support.html" class="nav-link">
                                <i class="fas fa-headset"></i>
                                <span>Support</span>
                            </a>
                        </li>
                    </ul>
                </nav>
                <div class="sidebar-footer">
                    <div class="user-profile">
                        <div class="user-avatar">
                            <i class="fas fa-user"></i>
                        </div>
                        <div class="user-info">
                            <span class="user-name">Admin User</span>
                            <span class="user-role">Administrator</span>
                        </div>
                    </div>
                    <button class="logout-btn" onclick="logout()">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        `;
    }

    // Public API
    refresh() {
        this.setActivePage();
    }

    isReady() {
        return this.isInitialized;
    }
}

// Initialize the navigation manager
const navigationManager = new NavigationManager();

// Export for global access
window.NavigationManager = NavigationManager;
window.navigationManager = navigationManager;

// Global logout function for sidebar
if (!window.logout) {
    window.logout = function() {
        console.log('🚪 Logout initiated from sidebar...');
        
        try {
            // Clear all authentication data
            sessionStorage.clear();
            localStorage.clear();
            
            // Try to use Auth.logout if available
            if (window.Auth && typeof window.Auth.logout === 'function') {
                console.log('🔐 Using Auth.logout...');
                window.Auth.logout();
                return;
            }
            
            // Fallback: Direct redirect to login
            console.log('🔄 Fallback logout - redirecting to login...');
            const currentPath = window.location.pathname;
            const isInFrontendFolder = currentPath.includes('/frontend/');
            
            let loginUrl;
            if (isInFrontendFolder) {
                loginUrl = window.location.origin + '/frontend/index.html';
            } else {
                loginUrl = window.location.origin + '/index.html';
            }
            
            window.location.href = loginUrl;
            
        } catch (error) {
            console.error('❌ Logout error:', error);
            // Emergency fallback
            window.location.href = window.location.origin + '/index.html';
        }
    };
}

// Global function to refresh user profile (useful for testing and manual updates)
window.refreshUserProfile = function() {
    console.log('🔄 Manually refreshing user profile...');
    if (window.navigationManager && typeof window.navigationManager.initializeUserProfile === 'function') {
        window.navigationManager.initializeUserProfile();
        console.log('✅ User profile refresh triggered');
    } else {
        console.error('❌ NavigationManager not available for profile refresh');
    }
};

console.log('🧭 Navigation system loaded');
