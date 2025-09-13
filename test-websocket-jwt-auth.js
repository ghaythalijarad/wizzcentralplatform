#!/usr/bin/env node

/**
 * Test WebSocket JWT Authentication Fix
 * Tests the updated WebSocket connection using proper JWT authentication via Authorization header
 */

import WebSocket from 'ws';

async function testWebSocketJWTAuth() {
    console.log('🔐 Testing WebSocket JWT Authentication...\n');

    // For testing purposes, we'll use a mock JWT token
    // In real implementation, this would come from Cognito
    const mockJwtToken = generateMockJWT();
    
    console.log('📱 Test 1: WebSocket connection with JWT Authorization header');
    console.log(`🔗 URL: wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev`);
    console.log(`🔑 Auth: Bearer ${mockJwtToken.substring(0, 50)}...`);
    
    try {
        const ws = new WebSocket('wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev', {
            headers: {
                'Authorization': `Bearer ${mockJwtToken}`,
            }
        });
        
        const connectTimeout = setTimeout(() => {
            console.log('❌ Connection timeout');
            ws.close();
        }, 10000);

        ws.on('open', () => {
            clearTimeout(connectTimeout);
            console.log('✅ WebSocket connected with JWT authentication!');
            
            // Send driver authentication
            const authMessage = {
                type: 'driver_connect',
                sessionId: `test-session-${Date.now()}`,
                businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
                driverId: 'test-driver-001',
                driverName: 'Test Driver',
                timestamp: new Date().toISOString(),
                platform: 'flutter',
                metadata: {
                    app_version: '1.0.0',
                    platform: 'flutter',
                    userType: 'driver'
                }
            };
            
            ws.send(JSON.stringify(authMessage));
            console.log('📤 Sent driver authentication message');
            
            // Test sending a chat message
            setTimeout(() => {
                const chatMessage = {
                    type: 'driver_message',
                    sessionId: authMessage.sessionId,
                    content: 'Hello support team! This is a test message with JWT authentication.',
                    senderId: 'test-driver-001',
                    senderType: 'driver',
                    senderName: 'Test Driver',
                    businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5',
                    timestamp: new Date().toISOString(),
                    metadata: {
                        driverId: 'test-driver-001',
                        driverName: 'Test Driver',
                        platform: 'WizzDriver'
                    }
                };
                
                ws.send(JSON.stringify(chatMessage));
                console.log('💬 Sent test chat message');
            }, 2000);
            
            // Close connection after 5 seconds
            setTimeout(() => {
                ws.close();
                console.log('🔌 Connection closed\n');
                showResults();
            }, 5000);
        });

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('📥 Received:', message.type || message.action, message);
            } catch (e) {
                console.log('📥 Received (raw):', data.toString());
            }
        });

        ws.on('error', (error) => {
            clearTimeout(connectTimeout);
            console.log('❌ WebSocket error:', error.message);
            console.log('   This might indicate JWT authentication issues\n');
            showResults();
        });

        ws.on('close', (code, reason) => {
            clearTimeout(connectTimeout);
            console.log(`🔌 WebSocket closed: ${code} - ${reason}\n`);
        });
        
    } catch (error) {
        console.log('❌ Failed to create WebSocket:', error.message);
        showResults();
    }
}

function generateMockJWT() {
    // Generate a mock JWT token for testing
    // This simulates what would come from Cognito
    const header = {
        "alg": "RS256",
        "kid": "test-key-id",
        "typ": "JWT"
    };
    
    const payload = {
        "sub": "test-driver-001",
        "aud": "7s3rvcnp34fr2jp54jmksbdd0s",
        "cognito:groups": ["drivers"],
        "email_verified": true,
        "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_90UtBLIfK",
        "cognito:username": "test-driver-001",
        "aud": "7s3rvcnp34fr2jp54jmksbdd0s",
        "event_id": "test-event-id",
        "token_use": "access",
        "auth_time": Math.floor(Date.now() / 1000),
        "exp": Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        "iat": Math.floor(Date.now() / 1000),
        "jti": "test-jti-id",
        "username": "test-driver-001"
    };
    
    // Base64 encode the header and payload
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    // For testing, we'll use a mock signature
    const mockSignature = Buffer.from('mock-signature-for-testing').toString('base64url');
    
    return `${encodedHeader}.${encodedPayload}.${mockSignature}`;
}

function showResults() {
    console.log('📊 Test Results Summary:');
    console.log('================================');
    console.log('✅ If connection succeeded: JWT authentication is working');
    console.log('❌ If connection failed with 401: JWT token validation failed');
    console.log('❌ If connection failed with 403: JWT token is valid but lacks permissions');
    console.log('');
    console.log('🔧 Next Steps:');
    console.log('1. If successful: JWT authentication is properly implemented');
    console.log('2. If failed: Check Lambda authorizer JWT validation logic');
    console.log('3. Test with real Cognito JWT tokens from authenticated users');
    console.log('');
    console.log('📱 Flutter App Configuration:');
    console.log('   WebSocket URL: wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev');
    console.log('   Authentication: JWT token in Authorization header');
    console.log('   Token Source: AWS Cognito User Pool access tokens');
    console.log('');
    console.log('🎯 Expected Result: Flutter app sends JWT in Authorization header for WebSocket auth');
}

// Run the test
console.log('🧪 WebSocket JWT Authentication Test');
console.log('=====================================\n');
testWebSocketJWTAuth().catch(console.error);
