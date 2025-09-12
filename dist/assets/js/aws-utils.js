// Centralized AWS Utilities for WizzCentral Platform
console.log('Loading aws-utils.js...');

window.AWSUtils = {
    dynamodbClient: null,
    isInitialized: false,
    _redirectedThisLoad: false,

    // Helper: promisify credentials refresh/get for SDK v2
    async _ensureCredentials(creds) {
        if (!creds) throw new Error('No AWS credentials object');
        // Prefer refresh if available, else get
        const fn = typeof creds.refresh === 'function' ? 'refresh' : (typeof creds.get === 'function' ? 'get' : null);
        if (!fn) return; // Nothing to do
        await new Promise((resolve, reject) => {
            try { creds[fn]((err) => err ? reject(err) : resolve()); }
            catch (e) { reject(e); }
        });
    },

    // Initialize AWS SDK and DynamoDB client
    async initialize() {
        if (this.isInitialized && this.dynamodbClient) {
            return this.dynamodbClient;
        }

        try {
            const debugMode = sessionStorage.getItem('debugMode') === 'true';
            const idToken = sessionStorage.getItem('idToken');
            const accessToken = sessionStorage.getItem('accessToken');
            const basicAuth = sessionStorage.getItem('isAuthenticated') === 'true' && !!sessionStorage.getItem('userEmail');
            // Allow forcing unauth credentials in debug via sessionStorage or query param
            const debugForceUnauth = debugMode && (
                sessionStorage.getItem('debugForceUnauth') === 'true' ||
                (new URLSearchParams(window.location.search).get('debugForceUnauth') === '1')
            );

            if (typeof AWS === 'undefined') {
                throw new Error('AWS SDK not loaded.');
            }

            // Fetch configuration with robust path resolution (root first, then /frontend fallback)
            let outputs = null;
            try {
                const rootResp = await fetch('/amplify_outputs.json');
                if (!rootResp.ok) throw new Error(`root status ${rootResp.status}`);
                outputs = await rootResp.json();
                console.log('Loaded amplify_outputs.json from /amplify_outputs.json');
            } catch (e1) {
                console.warn('Root amplify_outputs.json not found or failed, trying /frontend/amplify_outputs.json', e1);
                const feResp = await fetch('/frontend/amplify_outputs.json');
                if (!feResp.ok) {
                    throw new Error(`Failed to fetch amplify_outputs.json: ${feResp.status}`);
                }
                outputs = await feResp.json();
                console.log('Loaded amplify_outputs.json from /frontend/amplify_outputs.json');
            }

            const region = outputs?.auth?.aws_region || outputs?.data?.aws_region || outputs?.aws_region || 'us-east-1';
            const userPoolId = outputs?.auth?.user_pool_id;
            const identityPoolId = outputs?.auth?.identity_pool_id;
            if (!userPoolId || !identityPoolId) {
                console.error('amplify_outputs.json missing auth IDs', { userPoolId, identityPoolId });
                throw new Error('Invalid amplify_outputs.json (missing Cognito IDs)');
            }
            const cognitoProvider = `cognito-idp.${region}.amazonaws.com/${userPoolId}`;

            AWS.config.region = region;

            // Debug Mode: Allow unauthenticated Cognito identity (optionally force even if idToken exists)
            if (debugMode && (debugForceUnauth || !idToken)) {
                console.warn('AWSUtils: Debug mode ' + (debugForceUnauth ? 'FORCING UNAUTH' : 'no idToken') + '. Using unauthenticated Cognito Identity.');
                AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                    IdentityPoolId: identityPoolId
                });
                await this._ensureCredentials(AWS.config.credentials);
                console.log('AWS (debug unauth) credentials fetched.');

                this.dynamodbClient = new AWS.DynamoDB.DocumentClient({
                    convertEmptyValues: true,
                    removeUndefinedValues: true
                });
                this.isInitialized = true;
                console.log('AWS initialized (debug unauth).');
                return this.dynamodbClient;
            }

            // If no idToken and not in debug mode, follow original behavior
            if (!idToken) { // changed: only idToken strictly required
                console.log('AWSUtils: missing idToken (accessToken optional)');
                // If app believes user is authenticated (basic flags), do not redirect; let callers handle fallback
                if (basicAuth) {
                    console.log('AWSUtils: basic auth present without idToken; skipping redirect and returning null');
                    return null;
                }
                // Avoid redirects if on login page or loop protection active
                const onLogin = window.location.pathname.endsWith('/index.html');
                const loopBroken = sessionStorage.getItem('redirectLoop:broken') === 'true';
                if (!this._redirectedThisLoad && !onLogin && !loopBroken) {
                    this._redirectedThisLoad = true;
                    try {
                        sessionStorage.setItem('lastRedirectFrom', window.location.pathname + window.location.search);
                        sessionStorage.setItem('lastRedirectReason', 'aws-utils:missing-idToken');
                        sessionStorage.setItem('lastRedirectTime', new Date().toISOString());
                    } catch (e) { }
                    if (window.Auth && window.Auth.redirectToLogin) {
                        window.Auth.redirectToLogin('AWSUtils initialize: missing idToken');
                    }
                } else {
                    console.log('AWSUtils: not redirecting (onLogin=' + onLogin + ', loopBroken=' + loopBroken + ')');
                }
                return null;
            }

            // Validate idToken issuer matches expected provider (skip in debugMode)
            if (!debugMode) {
                try {
                    const payload = JSON.parse(atob(idToken.split('.')[1] || '')) || {};
                    const iss = payload.iss || '';
                    const expectedIssuer = `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`;
                    if (!iss || (iss !== expectedIssuer && !iss.endsWith(`/${userPoolId}`))) {
                        console.error('AWSUtils: idToken issuer mismatch', { iss, expectedIssuer });
                        sessionStorage.setItem('lastRedirectReason', 'aws-utils:issuer-mismatch');
                        sessionStorage.setItem('lastRedirectTime', new Date().toISOString());
                        const onLogin = window.location.pathname.endsWith('/index.html');
                        const loopBroken = sessionStorage.getItem('redirectLoop:broken') === 'true';
                        if (!this._redirectedThisLoad && !onLogin && !loopBroken) {
                            this._redirectedThisLoad = true;
                            if (window.Auth) {
                                try { Auth.clearTokens(); } catch (_) { }
                                Auth.redirectToLogin('AWSUtils: idToken issuer mismatch');
                            }
                        }
                        return null;
                    }
                } catch (e) {
                    console.warn('AWSUtils: failed to parse idToken for issuer check', e);
                }
            } else {
                console.warn('AWSUtils: Debug mode active. Skipping idToken issuer validation.');
            }

            // Configure AWS
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: identityPoolId,
                Logins: {
                    [cognitoProvider]: idToken
                }
            });

            await this._ensureCredentials(AWS.config.credentials);
            console.log('Successfully fetched AWS credentials.');

            this.dynamodbClient = new AWS.DynamoDB.DocumentClient({
                convertEmptyValues: true,
                removeUndefinedValues: true
            });

            this.isInitialized = true;
            console.log('AWS initialized successfully.');
            return this.dynamodbClient;

        } catch (error) {
            console.error('Failed to initialize AWS:', error);
            this.isInitialized = false;
            try {
                sessionStorage.setItem('lastRedirectFrom', window.location.pathname + window.location.search);
                sessionStorage.setItem('lastRedirectReason', `aws-utils:error:${error?.message || 'unknown'}`);
                sessionStorage.setItem('lastRedirectTime', new Date().toISOString());
            } catch (e) { }
            const onLogin = window.location.pathname.endsWith('/index.html');
            const loopBroken = sessionStorage.getItem('redirectLoop:broken') === 'true';
            const basicAuth = sessionStorage.getItem('isAuthenticated') === 'true' && !!sessionStorage.getItem('userEmail');
            if (!this._redirectedThisLoad && !onLogin && !loopBroken && !basicAuth) {
                this._redirectedThisLoad = true;
                if (window.Auth && window.Auth.redirectToLogin) {
                    window.Auth.redirectToLogin('AWSUtils initialize error');
                }
            } else {
                console.log('AWSUtils: not redirecting on error (onLogin=' + onLogin + ', loopBroken=' + loopBroken + ', basicAuth=' + basicAuth + ')');
            }
            throw error;
        }
    },

    // Get DynamoDB client (initializes if needed)
    async getDynamoDBClient() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        return this.dynamodbClient;
    },

    // Reset initialization state (useful for re-authentication)
    reset() {
        this.dynamodbClient = null;
        this.isInitialized = false;
    }
};

console.log('AWS utilities loaded successfully');
