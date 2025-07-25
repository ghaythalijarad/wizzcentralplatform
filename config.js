// WizzCentral Platform Configuration
window.WIZZCENTRAL_CONFIG = {
    // API Configuration
    API_BASE_URL: process.env.NODE_ENV === 'production' 
        ? 'https://your-api-gateway-url.amazonaws.com/dev'  // This will be updated after backend deployment
        : 'http://localhost:3001',
    
    // Frontend Configuration
    APP_NAME: 'WizzCentral Platform',
    APP_VERSION: '1.0.0',
    
    // AWS Cognito Configuration (if using)
    COGNITO_REGION: 'us-east-1',
    COGNITO_USER_POOL_ID: 'us-east-1_aX8X9oQTV',
    COGNITO_CLIENT_ID: '3u9frkvcn18lidj5dpm1a94mf2',
    COGNITO_IDENTITY_POOL_ID: 'us-east-1:38954d71-6b61-431d-942b-406c6a200f7c',
    
    // Feature Flags
    FEATURES: {
        ANALYTICS: true,
        REAL_TIME_TRACKING: true,
        NOTIFICATIONS: true,
        PROMOTIONS: true
    },
    
    // UI Configuration
    THEME: {
        PRIMARY_COLOR: '#007bff',
        SECONDARY_COLOR: '#6c757d',
        SUCCESS_COLOR: '#28a745',
        WARNING_COLOR: '#ffc107',
        DANGER_COLOR: '#dc3545'
    }
};

// Environment Detection
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.WIZZCENTRAL_CONFIG;
}
