// WizzCentral Platform Configuration
window.WIZZCENTRAL_CONFIG = {
    // API Configuration
    // API Gateway URL (can be overridden via Amplify Console env var 'API_BASE_URL')
    API_BASE_URL: window.__API_BASE_URL__ || 'https://9lqviiloy8.execute-api.us-east-1.amazonaws.com/dev',  // Updated with deployed AWS API endpoint
    
    // Frontend Configuration
    APP_NAME: 'WizzCentral Platform',
    APP_VERSION: '1.0.0',
    // Deployment stage for API paths
    STAGE: 'dev',
    
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
        PRIMARY_COLOR: '#009de0',
        SECONDARY_COLOR: '#6c757d',
        SUCCESS_COLOR: '#28a745',
        WARNING_COLOR: '#ffc107',
        DANGER_COLOR: '#dc3545'
    }
};

// Local development override for serverless-offline or file protocol
if (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.WIZZCENTRAL_CONFIG.API_BASE_URL = `http://${window.location.hostname || 'localhost'}:3000/${window.WIZZCENTRAL_CONFIG.STAGE}`;
}

// Note: For local development use, use the built-in override or set window.__API_BASE_URL__ before loading scripts

// Environment Detection
if (typeof module !== 'undefined' && module.exports) {
    module.exports = window.WIZZCENTRAL_CONFIG;
}
