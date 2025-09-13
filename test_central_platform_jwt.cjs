/**
 * Generate valid JWT tokens from Central Platform Cognito User Pool for live chat testing
 * This solves the User Pool mismatch issue by creating tokens the WebSocket will accept
 */

const AWS = require('aws-sdk');

// Central Platform Cognito Configuration
const CENTRAL_PLATFORM_CONFIG = {
    region: 'us-east-1',
    userPoolId: 'us-east-1_LDgfo1Pmc',
    clientId: '3ngjf86vuq8up86urecprvm08j',
    identityPoolId: 'us-east-1:864073dc-423f-42ae-9b1a-67c1c913b38a'
};

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';
const BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';

// Configure AWS SDK
AWS.config.update({
    region: CENTRAL_PLATFORM_CONFIG.region,
    // Note: AWS credentials should be configured via AWS CLI or environment variables
});

const cognitoIdentity = new AWS.CognitoIdentityServiceProvider();

/**
 * Create a test user in the Central Platform's Cognito User Pool
 */
async function createTestUser() {
    console.log('👤 Creating test user in Central Platform User Pool...');
    
    const timestamp = Date.now();
    const testUser = {
        email: `livechat.test.${timestamp}@example.com`,
        password: 'TestPassword123!',
        username: `livechat_test_${timestamp}`
    };
    
    try {
        // Create user
        const signUpParams = {
            ClientId: CENTRAL_PLATFORM_CONFIG.clientId,
            Username: testUser.username,
            Password: testUser.password,
            UserAttributes: [
                {
                    Name: 'email',
                    Value: testUser.email
                },
                {
                    Name: 'name',
                    Value: 'Live Chat Test Driver'
                }
            ]
        };
        
        const signUpResult = await cognitoIdentity.signUp(signUpParams).promise();
        console.log('✅ User created:', signUpResult.UserSub);
        
        // Auto-confirm user (admin action for testing)
        const confirmParams = {
            UserPoolId: CENTRAL_PLATFORM_CONFIG.userPoolId,
            Username: testUser.username
        };
        
        await cognitoIdentity.adminConfirmSignUp(confirmParams).promise();
        console.log('✅ User confirmed');
        
        return testUser;
    } catch (error) {
        if (error.code === 'UsernameExistsException') {
            console.log('⚠️ User already exists, will try to authenticate');
            return testUser;
        }
        throw error;
    }
}

/**
 * Authenticate user and get valid JWT tokens
 */
async function authenticateUser(username, password) {
    console.log('🔐 Authenticating user to get JWT tokens...');
    
    try {
        const authParams = {
            ClientId: CENTRAL_PLATFORM_CONFIG.clientId,
            AuthFlow: 'USER_PASSWORD_AUTH',
            AuthParameters: {
                USERNAME: username,
                PASSWORD: password
            }
        };
        
        const authResult = await cognitoIdentity.initiateAuth(authParams).promise();
        
        if (authResult.AuthenticationResult) {
            console.log('✅ Authentication successful!');
            return {
                accessToken: authResult.AuthenticationResult.AccessToken,
                idToken: authResult.AuthenticationResult.IdToken,
                refreshToken: authResult.AuthenticationResult.RefreshToken
            };
        } else {
            throw new Error('Authentication failed - no tokens returned');
        }
    } catch (error) {
        console.error('❌ Authentication failed:', error.message);
        throw error;
    }
}

/**
 * Test WebSocket connection with valid JWT token
 */
async function testWebSocketWithValidJWT(accessToken) {
    console.log('🔌 Testing WebSocket with valid JWT token...');
    
    const WebSocket = require('ws');
    
    return new Promise((resolve, reject) => {
        // Test with token in query parameter
        const wsUrl = `${WEBSOCKET_URL}?businessId=${BUSINESS_ID}&token=${accessToken}&userType=driver&platform=flutter&userId=test-driver-123`;
        
        console.log('📍 Connecting to:', wsUrl.replace(accessToken, 'TOKEN_HIDDEN'));
        
        const ws = new WebSocket(wsUrl);
        let connected = false;
        
        const timeout = setTimeout(() => {
            if (!connected) {
                console.log('⏰ Connection timeout (15s)');
                ws.close();
                reject(new Error('Connection timeout'));
            }
        }, 15000);
        
        ws.on('open', () => {
            connected = true;
            clearTimeout(timeout);
            console.log('✅ WebSocket connected successfully with valid JWT!');
            
            // Send live chat message
            const chatMessage = {
                type: 'chat_message',
                sessionId: `test-session-${Date.now()}`,
                message: 'Hello from Flutter Driver App - JWT Auth Test',
                senderName: 'Test Driver',
                senderId: 'test-driver-123',
                senderType: 'driver',
                businessId: BUSINESS_ID,
                timestamp: new Date().toISOString()
            };
            
            ws.send(JSON.stringify(chatMessage));
            console.log('📤 Sent live chat message:', chatMessage.message);
            
            // Keep connection open for responses
            setTimeout(() => {
                console.log('🔌 Closing connection');
                ws.close();
                resolve('SUCCESS');
            }, 5000);
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('📨 Received response:', JSON.stringify(message, null, 2));
            } catch (e) {
                console.log('📨 Raw response:', data.toString());
            }
        });
        
        ws.on('error', (error) => {
            clearTimeout(timeout);
            console.error('❌ WebSocket error:', error.message);
            
            if (error.message.includes('401')) {
                console.log('🔒 Still getting 401 - JWT authorizer may need configuration');
            }
            
            reject(error);
        });
        
        ws.on('close', (code, reason) => {
            clearTimeout(timeout);
            console.log(`🔌 Connection closed: ${code} - ${reason || 'No reason'}`);
            
            if (!connected) {
                reject(new Error(`Connection closed with code ${code}`));
            }
        });
    });
}

/**
 * Main test function
 */
async function main() {
    console.log('🎯 Central Platform JWT Authentication Test');
    console.log('==========================================');
    console.log('📍 WebSocket URL:', WEBSOCKET_URL);
    console.log('🏢 User Pool ID:', CENTRAL_PLATFORM_CONFIG.userPoolId);
    console.log('📱 Client ID:', CENTRAL_PLATFORM_CONFIG.clientId);
    console.log('');
    
    try {
        // Step 1: Create test user in Central Platform's User Pool
        const testUser = await createTestUser();
        
        // Step 2: Authenticate and get valid JWT tokens
        const tokens = await authenticateUser(testUser.username, testUser.password);
        
        console.log('🎯 JWT Token Details:');
        console.log('   Access Token Length:', tokens.accessToken.length);
        console.log('   ID Token Length:', tokens.idToken.length);
        console.log('   Token Preview:', tokens.accessToken.substring(0, 50) + '...');
        console.log('');
        
        // Step 3: Test WebSocket connection with valid JWT
        await testWebSocketWithValidJWT(tokens.accessToken);
        
        console.log('');
        console.log('🎉 Test completed successfully!');
        console.log('✅ Valid JWT tokens can be generated from Central Platform User Pool');
        console.log('✅ WebSocket authentication working with proper tokens');
        
    } catch (error) {
        console.error('');
        console.error('❌ Test failed:', error.message);
        console.error('');
        
        if (error.code === 'NotAuthorizedException') {
            console.error('💡 Solution: Check AWS credentials and User Pool configuration');
        } else if (error.message.includes('401')) {
            console.error('💡 Solution: WebSocket JWT authorizer needs to be configured for Central Platform User Pool');
        } else {
            console.error('💡 Check error details above for specific solution');
        }
        
        process.exit(1);
    }
}

// Export for use in other scripts
module.exports = {
    createTestUser,
    authenticateUser,
    testWebSocketWithValidJWT,
    CENTRAL_PLATFORM_CONFIG
};

// Run if called directly
if (require.main === module) {
    main();
}
