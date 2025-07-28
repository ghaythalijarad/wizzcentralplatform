// Authentication utilities for WizzCentral Platform
const Auth = (function() {
    function getToken(name) {
        return sessionStorage.getItem(name);
    }
    function setToken(name, value) {
        if (value) {
            sessionStorage.setItem(name, value);
        }
    }
    function clearTokens() {
        ['accessToken', 'idToken', 'refreshToken', 'userEmail'].forEach(key => sessionStorage.removeItem(key));
    }
    function parseJwt(token) {
        try {
            const payload = token.split('.')[1];
            return JSON.parse(atob(payload));
        } catch (e) {
            return null;
        }
    }
    function isTokenValid(token) {
        const data = parseJwt(token);
        if (!data || !data.exp) return false;
        return data.exp * 1000 > Date.now();
    }
    function isAuthenticated() {
        const idToken = getToken('idToken');
        return idToken && isTokenValid(idToken);
    }
    function requireAuthentication() {
        if (!isAuthenticated()) {
            clearTokens();
            window.location.href = 'index.html';
        }
    }
    function attachAuthHeader(headers = {}) {
        const token = getToken('accessToken') || getToken('idToken');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        return headers;
    }
    return {
        getToken,
        setToken,
        clearTokens,
        isAuthenticated,
        requireAuthentication,
        attachAuthHeader
    };
})();
// Expose to global scope
window.Auth = Auth;
