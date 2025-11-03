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

    // New: default page to land on after a successful login
    // Use a fully-qualified path under /frontend/pages
    DEFAULT_POST_LOGIN_PAGE: '/frontend/pages/dashboard.html',

    // AWS Cognito Configuration (WizzCentral User Pool)
    COGNITO_REGION: 'us-east-1',
    COGNITO_USER_POOL_ID: 'us-east-1_Cp9YnOQWi',
    COGNITO_CLIENT_ID: '5hun8p61grnakisu5gammcjelv', // NEW: Browser-specific client with no secret
    COGNITO_IDENTITY_POOL_ID: 'us-east-1:10dd68af-9c1e-448e-ae67-89eaeb3c8160', // NEW: WizzCentralPlatform Identity Pool

    // WebSocket Configuration for Live Chat
    WEBSOCKET: {
        // Live Chat Support WebSocket URL - Using working SAM deployed WebSocket endpoint
        LIVE_CHAT_URL: window.__LIVE_CHAT_WEBSOCKET_URL__ || 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev',
        PROTOCOLS: ['chat-protocol'],
        HEARTBEAT_INTERVAL: 30000,
        MESSAGE_TIMEOUT: 10000,
        MAX_RECONNECT_ATTEMPTS: 5,
        RECONNECT_DELAY: 1000
    },

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
