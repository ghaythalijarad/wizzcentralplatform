#!/usr/bin/env node

/**
 * Real Cognito JWT Token Test
 * This test checks if we can get a real JWT token from AWS Cognito
 */

import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";
import WebSocket from 'ws';

const COGNITO_CONFIG = {
    region: 'us-east-1',
    userPoolId: 'us-east-1_90UtBLIfK',
    clientId: '7s3rvcnp34fr2jp54jmksbdd0s',
};

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';

async function testRealCognitoAuth() {
    console.log('🔐 Testing Real AWS Cognito JWT Authentication...\n');

    try {
        // Initialize Cognito client
        const cognitoClient = new CognitoIdentityProviderClient({
            region: COGNITO_CONFIG.region
        });

        console.log('📱 Step 1: Testing with mock credentials (will fail but test flow)');
        console.log(`🔗 User Pool: ${COGNITO_CONFIG.userPoolId}`);
        console.log(`🔑 Client ID: ${COGNITO_CONFIG.clientId}`);

        // This will fail with real creds, but shows the flow
        try {
            const authCommand = new InitiateAuthCommand({
                AuthFlow: 'USER_PASSWORD_AUTH',
                ClientId: COGNITO_CONFIG.clientId,
                AuthParameters: {
                    USERNAME: 'test@example.com',
                    PASSWORD: 'TestPassword123!'
                }
            });

            const authResult = await cognitoClient.send(authCommand);
            const accessToken = authResult.AuthenticationResult?.AccessToken;

            if (accessToken) {
                console.log('✅ Real Cognito token obtained!');
                console.log(`🎫 Token: ${accessToken.substring(0, 50)}...`);
                
                // Test WebSocket with real token
                await testWebSocketWithRealToken(accessToken);
            }
        } catch (error) {
            console.log('❌ Authentication failed (expected with test credentials)');
            console.log(`   Error: ${error.message}`);
            
            if (error.name === 'UserNotFoundException') {
                console.log('✅ Cognito connection working - user just doesn\'t exist');
            } else if (error.name === 'NotAuthorizedException') {
                console.log('✅ Cognito connection working - credentials invalid');
            }
        }

        console.log('\n📱 Step 2: Next Steps for Real Testing');
        console.log('====================================');
        console.log('1. Create a real test user in AWS Cognito console');
        console.log('2. Use real credentials in Flutter app');
        console.log('3. Flutter app will automatically use Cognito JWT for WebSocket');
        console.log('4. Messages should flow from Flutter app to Central Platform');

        console.log('\n🎯 Expected Flow:');
        console.log('   Flutter App → AWS Cognito (login) → Get JWT Token');
        console.log('   Flutter App → WebSocket (with JWT) → AWS API Gateway');
        console.log('   AWS API Gateway → Lambda Authorizer (validates JWT)');
        console.log('   Lambda Authorizer → Allow/Deny connection');
        console.log('   Messages → Central Platform Dashboard');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

async function testWebSocketWithRealToken(accessToken) {
    console.log('\n🔌 Testing WebSocket with real Cognito token...');
    
    return new Promise((resolve) => {
        const ws = new WebSocket(WEBSOCKET_URL, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const timeout = setTimeout(() => {
            console.log('⏰ Connection timeout');
            ws.close();
            resolve();
        }, 10000);

        ws.on('open', () => {
            clearTimeout(timeout);
            console.log('✅ WebSocket connected with real Cognito JWT!');
            
            // Send test message
            const testMessage = {
                type: 'driver_connect',
                sessionId: `test-${Date.now()}`,
                businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
                driverId: 'real-test-driver',
                driverName: 'Real Test Driver',
                timestamp: new Date().toISOString(),
                platform: 'test'
            };
            
            ws.send(JSON.stringify(testMessage));
            console.log('📤 Sent authentication message');
            
            setTimeout(() => {
                ws.close();
                resolve();
            }, 3000);
        });

        ws.on('message', (data) => {
            console.log('📥 Received:', data.toString());
        });

        ws.on('error', (error) => {
            clearTimeout(timeout);
            console.log('❌ WebSocket error:', error.message);
            resolve();
        });

        ws.on('close', (code, reason) => {
            clearTimeout(timeout);
            console.log(`🔚 WebSocket closed: ${code} - ${reason}`);
            resolve();
        });
    });
}

// Run the test
testRealCognitoAuth().catch(console.error);
