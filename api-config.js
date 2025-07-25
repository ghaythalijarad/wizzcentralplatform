// API Configuration for WizzCentral Platform
const API_CONFIG = {
    BASE_URL: 'https://your-api-gateway-url.amazonaws.com/dev', // Replace with actual API Gateway URL
    ENDPOINTS: {
        BUSINESSES: '/businesses',
        UPDATE_BUSINESS_STATUS: '/businesses/{businessId}/status'
    },
    REGION: 'us-east-1'
};

// For development, we'll use a mock endpoint
// Replace this with your actual API Gateway URL when deployed
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    API_CONFIG.BASE_URL = 'http://localhost:3000/dev';
}

window.API_CONFIG = API_CONFIG;
