// Centralized AWS Utilities for WizzCentral Platform
console.log('Loading aws-utils.js...');

window.AWSUtils = {
    dynamodbClient: null,
    isInitialized: false,

    // Initialize AWS SDK and DynamoDB client
    async initialize() {
        if (this.isInitialized && this.dynamodbClient) {
            return this.dynamodbClient;
        }

        try {
            const idToken = sessionStorage.getItem('idToken');
            const accessToken = sessionStorage.getItem('accessToken');
            
            if (!idToken || !accessToken) {
                console.log('No authentication tokens found. Redirecting to login.');
                window.location.href = 'index.html';
                return null;
            }

            if (typeof AWS === 'undefined') {
                throw new Error('AWS SDK not loaded.');
            }

            // Fetch configuration
            const response = await fetch('../amplify_outputs.json');
            if (!response.ok) {
                throw new Error(`Failed to fetch amplify_outputs.json: ${response.status}`);
            }
            const outputs = await response.json();
            
            const region = outputs.data?.aws_region || 'us-east-1';
            const userPoolId = outputs.auth.user_pool_id;
            const identityPoolId = outputs.auth.identity_pool_id;
            const cognitoProvider = `cognito-idp.${region}.amazonaws.com/${userPoolId}`;

            // Configure AWS
            AWS.config.region = region;
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: identityPoolId,
                Logins: {
                    [cognitoProvider]: idToken
                }
            });

            await AWS.config.credentials.refreshPromise();
            console.log("Successfully fetched AWS credentials.");

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
            window.location.href = 'index.html';
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
