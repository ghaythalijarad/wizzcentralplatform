// Centralized Authentication Utilities for WizzCentral Platform
console.log('Loading auth-utils.js...');

console.log('Legacy root auth-utils.js loaded (compat layer)');
if (!window.Auth || !window.Auth.getPostLoginRedirectUrl) {
    console.log('Activating legacy Auth only because modern Auth not present');
    window.Auth = {
        // Check if user is authenticated
        requireAuthentication() {
            // Check for multiple possible token storage patterns
            const isAuthenticated = sessionStorage.getItem('isAuthenticated');
            const userEmail = sessionStorage.getItem('userEmail');
            const userId = sessionStorage.getItem('userId');
            const idToken = sessionStorage.getItem('idToken');
            const accessToken = sessionStorage.getItem('accessToken');

            // Check if user is marked as authenticated with basic info
            if (isAuthenticated === 'true' && userEmail && userId) {
                console.log('Authentication check passed (basic auth)');
                return true;
            }

            // Check for full token-based authentication
            if (idToken && accessToken) {
                // Validate token expiration
                try {
                    const tokenPayload = JSON.parse(atob(idToken.split('.')[1]));
                    const currentTime = Math.floor(Date.now() / 1000);

                    if (tokenPayload.exp && tokenPayload.exp < currentTime) {
                        console.warn('Authentication token has expired. Redirecting to login.');
                        sessionStorage.clear();
                        window.location.href = window.location.origin + '/frontend/index.html';
                        return false;
                    }
                    console.log('Authentication check passed (token-based auth)');
                    return true;
                } catch (error) {
                    console.error('Invalid token format. Redirecting to login.');
                    sessionStorage.clear();
                    window.location.href = window.location.origin + '/frontend/index.html';
                    return false;
                }
            }

            console.warn('No valid authentication found, redirecting to login');
            window.location.href = window.location.origin + '/frontend/index.html';
            return false;
        },

        // Store authentication tokens
        setToken(key, value) {
            sessionStorage.setItem(key, value);
        },

        // Get authentication token
        getToken(key) {
            return sessionStorage.getItem(key);
        },

        // Clear all authentication tokens
        clearTokens() {
            sessionStorage.clear();
            localStorage.removeItem('rememberLogin');
            localStorage.removeItem('lastEmail');
        },

        // Global logout function
        logout: async () => {
            try {
                if (typeof AWS !== 'undefined' && AWS.config && AWS.config.credentials) {
                    AWS.config.credentials.clearCachedId();
                }
                Auth.clearTokens();
                window.location.href = window.location.origin + '/frontend/index.html';
            } catch (error) {
                console.error('Logout error:', error);
                window.location.href = window.location.origin + '/frontend/index.html';
            }
        }
    };

    // Set global logout function
    window.logout = Auth.logout;

    // Automatically check authentication on dashboard pages
    document.addEventListener('DOMContentLoaded', function () {
        // Only run authentication check on dashboard pages
        const isDashboardPage = document.body.dataset.page === 'dashboard' ||
            window.location.pathname.includes('dashboard') ||
            document.title.toLowerCase().includes('dashboard');

        if (isDashboardPage) {
            console.log('Dashboard page detected, checking authentication...');
            Auth.requireAuthentication();
        }
    });

    console.log('Auth utilities loaded successfully');
} else {
    console.log('Modern Auth utilities already present - skipping legacy Auth override');
}
