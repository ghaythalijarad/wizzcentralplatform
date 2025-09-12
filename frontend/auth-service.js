// Direct AWS Cognito Authentication Service
// Bypasses backend API to avoid 502 errors and uses direct Cognito authentication

(function() {
    console.log('Loading auth-service.js...');

    // Configuration (read from global config when available to keep values consistent)
    const GLOBAL_CFG = (typeof window !== 'undefined' ? (window.WIZZCENTRAL_CONFIG || {}) : {});
    const COGNITO_CONFIG = {
        region: GLOBAL_CFG.COGNITO_REGION || 'us-east-1',
        userPoolId: GLOBAL_CFG.COGNITO_USER_POOL_ID || 'us-east-1_LDgfo1Pmc',
        clientId: GLOBAL_CFG.COGNITO_CLIENT_ID || '3ngjf86vuq8up86urecprvm08j',
        identityPoolId: GLOBAL_CFG.COGNITO_IDENTITY_POOL_ID || 'us-east-1:864073dc-423f-42ae-9b1a-67c1c913b38a'
    };

    let cognitoUserPool = null;
    let currentUser = null;
    let isInitialized = false;

    // Initialize Cognito User Pool
    function initialize() {
        if (isInitialized) return Promise.resolve();

        return new Promise((resolve, reject) => {
            try {
                if (typeof AmazonCognitoIdentity === 'undefined') {
                    reject(new Error('AWS Cognito Identity SDK not loaded'));
                    return;
                }

                cognitoUserPool = new AmazonCognitoIdentity.CognitoUserPool({
                    UserPoolId: COGNITO_CONFIG.userPoolId,
                    ClientId: COGNITO_CONFIG.clientId
                });

                isInitialized = true;
                console.log('Auth service initialized successfully');
                resolve();
            } catch (error) {
                console.error('Failed to initialize auth service:', error);
                reject(error);
            }
        });
    }

    // Login with email and password
    function login(email, password) {
        return new Promise(async (resolve, reject) => {
            try {
                await initialize();

                const userData = {
                    Username: email,
                    Pool: cognitoUserPool
                };

                currentUser = new AmazonCognitoIdentity.CognitoUser(userData);

                const authenticationDetails = new AmazonCognitoIdentity.AuthenticationDetails({
                    Username: email,
                    Password: password
                });

                currentUser.authenticateUser(authenticationDetails, {
                    onSuccess: function(result) {
                        console.log('Login successful');
                        
                        const tokens = {
                            accessToken: result.getAccessToken().getJwtToken(),
                            idToken: result.getIdToken().getJwtToken(),
                            refreshToken: result.getRefreshToken().getToken()
                        };

                        // Store tokens in session storage
                        sessionStorage.setItem('accessToken', tokens.accessToken);
                        sessionStorage.setItem('idToken', tokens.idToken);
                        sessionStorage.setItem('refreshToken', tokens.refreshToken);
                        sessionStorage.setItem('userEmail', email);
                        sessionStorage.setItem('isAuthenticated', 'true');

                        resolve({
                            success: true,
                            tokens: tokens,
                            message: 'Login successful'
                        });
                    },
                    onFailure: function(err) {
                        console.error('Login failed:', err);
                        let errorMessage = 'Login failed';
                        
                        if (err.code === 'NotAuthorizedException') {
                            errorMessage = 'Invalid email or password';
                        } else if (err.code === 'UserNotConfirmedException') {
                            errorMessage = 'Please verify your email address';
                        } else if (err.code === 'UserNotFoundException') {
                            errorMessage = 'User not found';
                        } else if (err.code === 'TooManyRequestsException') {
                            errorMessage = 'Too many login attempts. Please try again later.';
                        }

                        reject({
                            success: false,
                            code: err.code,
                            message: errorMessage,
                            error: err
                        });
                    },
                    newPasswordRequired: function(userAttributes, requiredAttributes) {
                        console.log('New password required');
                        reject({
                            success: false,
                            code: 'NewPasswordRequired',
                            message: 'New password required. Please contact support.',
                            userAttributes: userAttributes,
                            requiredAttributes: requiredAttributes
                        });
                    }
                });
            } catch (error) {
                console.error('Login error:', error);
                reject({
                    success: false,
                    message: 'Authentication service error',
                    error: error
                });
            }
        });
    }

    // Get current user
    function getCurrentUser() {
        return new Promise(async (resolve, reject) => {
            try {
                await initialize();
                
                currentUser = cognitoUserPool.getCurrentUser();
                
                if (currentUser != null) {
                    currentUser.getSession(function(err, session) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        
                        if (session.isValid()) {
                            currentUser.getUserAttributes(function(err, attributes) {
                                if (err) {
                                    reject(err);
                                    return;
                                }
                                
                                const userInfo = {};
                                attributes.forEach(attribute => {
                                    userInfo[attribute.getName()] = attribute.getValue();
                                });
                                
                                resolve({
                                    success: true,
                                    user: userInfo,
                                    session: session
                                });
                            });
                        } else {
                            reject(new Error('Session is not valid'));
                        }
                    });
                } else {
                    reject(new Error('No current user'));
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    // Logout
    function logout() {
        return new Promise((resolve) => {
            try {
                if (currentUser) {
                    currentUser.signOut();
                }
                
                // Clear session storage
                sessionStorage.removeItem('accessToken');
                sessionStorage.removeItem('idToken');
                sessionStorage.removeItem('refreshToken');
                sessionStorage.removeItem('userEmail');
                sessionStorage.removeItem('isAuthenticated');
                
                currentUser = null;
                
                resolve({
                    success: true,
                    message: 'Logged out successfully'
                });
            } catch (error) {
                console.error('Logout error:', error);
                resolve({
                    success: false,
                    message: 'Logout error',
                    error: error
                });
            }
        });
    }

    // Check if user is authenticated (also verify token not expired if possible)
    function isAuthenticated() {
        const idToken = sessionStorage.getItem('idToken');
        if (!idToken) return false;
        try {
            const payload = JSON.parse(atob(idToken.split('.')[1] || '')) || {};
            if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
                // Expired
                sessionStorage.removeItem('idToken');
                sessionStorage.removeItem('accessToken');
                sessionStorage.removeItem('refreshToken');
                sessionStorage.removeItem('isAuthenticated');
                return false;
            }
        } catch (_) {}
        return true;
    }

    // Get stored tokens
    function getTokens() {
        return {
            accessToken: sessionStorage.getItem('accessToken'),
            idToken: sessionStorage.getItem('idToken'),
            refreshToken: sessionStorage.getItem('refreshToken')
        };
    }

    // Export the service
    window.AuthService = {
        initialize,
        login,
        getCurrentUser,
        logout,
        isAuthenticated,
        getTokens,
        config: COGNITO_CONFIG
    };

    console.log('auth-service.js ready');
})();
