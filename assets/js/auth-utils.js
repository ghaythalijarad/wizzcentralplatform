// Centralized Authentication Utilities for WizzCentral Platform
console.log('Loading auth-utils.js...');

window.Auth = {
    // Check if user is authenticated
    requireAuthentication() {
        const idToken = sessionStorage.getItem('idToken');
        const accessToken = sessionStorage.getItem('accessToken');
        
        if (!idToken || !accessToken) {
            console.warn('No authentication tokens found, redirecting to login');
            window.location.href = 'index.html';
            return false;
        }
        
        // Validate token expiration
        if (idToken) {
            try {
                const tokenPayload = JSON.parse(atob(idToken.split('.')[1]));
                const currentTime = Math.floor(Date.now() / 1000);
                
                if (tokenPayload.exp && tokenPayload.exp < currentTime) {
                    console.warn('Authentication token has expired. Redirecting to login.');
                    sessionStorage.clear();
                    window.location.href = 'index.html';
                    return false;
                }
            } catch (error) {
                console.error('Invalid token format. Redirecting to login.');
                sessionStorage.clear();
                window.location.href = 'index.html';
                return false;
            }
        }
        
        console.log('Authentication check passed');
        return true;
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
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Logout error:', error);
            window.location.href = 'index.html';
        }
    }
};

// Set global logout function
window.logout = Auth.logout;

console.log('Auth utilities loaded successfully');
