#!/usr/bin/env node

/**
 * Debug Flutter App JWT Authentication Flow
 * This script helps diagnose why driver messages aren't reaching Central Platform
 */

const WebSocket = require('ws');

// Configuration matching Flutter app environment
const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';
const BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';

console.log('🔍 Debugging Flutter App → Central Platform Message Flow');
console.log('=======================================================');
console.log('Date:', new Date().toISOString());
console.log('');

console.log('📋 Configuration:');
console.log(`  WebSocket URL: ${WEBSOCKET_URL}`);
console.log(`  Business ID: ${BUSINESS_ID}`);
console.log('');

// Test 1: Connect without JWT token (should fail with 401)
async function testUnauthenticatedConnection() {
    console.log('1️⃣ Testing unauthenticated connection (should fail with 401)...');
    
    return new Promise((resolve) => {
        const ws = new WebSocket(WEBSOCKET_URL);
        
        ws.on('open', () => {
            console.log('❌ UNEXPECTED: Connection opened without authentication!');
            ws.close();
            resolve(false);
        });
        
        ws.on('error', (error) => {
            if (error.message.includes('401')) {
                console.log('✅ Expected 401 error - authentication required');
                resolve(true);
            } else {
                console.log('❌ Unexpected error:', error.message);
                resolve(false);
            }
        });
        
        setTimeout(() => {
            console.log('⏰ Connection test timeout');
            ws.close();
            resolve(false);
        }, 5000);
    });
}

// Test 2: Connect with invalid JWT token (should fail with 401)
async function testInvalidJWTConnection() {
    console.log('2️⃣ Testing invalid JWT token (should fail with 401)...');
    
    return new Promise((resolve) => {
        const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';
        
        const wsUrl = `${WEBSOCKET_URL}?token=${invalidToken}`;
        const ws = new WebSocket(wsUrl, {
            headers: {
                'Authorization': `Bearer ${invalidToken}`
            }
        });
        
        ws.on('open', () => {
            console.log('❌ UNEXPECTED: Connection opened with invalid token!');
            ws.close();
            resolve(false);
        });
        
        ws.on('error', (error) => {
            if (error.message.includes('401')) {
                console.log('✅ Expected 401 error - invalid token rejected');
                resolve(true);
            } else {
                console.log('❌ Unexpected error:', error.message);
                resolve(false);
            }
        });
        
        setTimeout(() => {
            console.log('⏰ Invalid token test timeout');
            ws.close();
            resolve(false);
        }, 5000);
    });
}

// Test 3: Simulate Flutter app connection structure
async function testFlutterAppStructure() {
    console.log('3️⃣ Testing Flutter app connection structure...');
    console.log('   (This will show the exact error Flutter app gets)');
    
    return new Promise((resolve) => {
        // Simulate how Flutter app tries to connect
        const ws = new WebSocket(WEBSOCKET_URL, {
            headers: {
                'Authorization': 'Bearer mock_flutter_token'
            }
        });
        
        ws.on('open', () => {
            console.log('✅ Mock Flutter connection opened');
            
            // Send driver authentication message like Flutter app does
            const driverAuth = {
                type: 'driver_connect',
                sessionId: 'driver_support_test_123',
                businessId: BUSINESS_ID,
                driverId: 'test_driver_001',
                driverName: 'Test Driver',
                timestamp: new Date().toISOString(),
                platform: 'flutter',
                metadata: {
                    app_version: '1.0.0',
                    platform: 'flutter',
                    userType: 'driver'
                }
            };
            
            console.log('📤 Sending driver authentication:', JSON.stringify(driverAuth, null, 2));
            ws.send(JSON.stringify(driverAuth));
            
            setTimeout(() => {
                // Send test message like Flutter app does
                const testMessage = {
                    type: 'driver_message',
                    sessionId: 'driver_support_test_123',
                    content: '🧪 Test message from debug script (simulating Flutter app)',
                    senderId: 'test_driver_001',
                    senderType: 'driver',
                    senderName: 'Test Driver',
                    businessId: BUSINESS_ID,
                    timestamp: new Date().toISOString(),
                    metadata: {
                        driverId: 'test_driver_001',
                        driverName: 'Test Driver',
                        platform: 'debug_script'
                    }
                };
                
                console.log('📤 Sending test message:', JSON.stringify(testMessage, null, 2));
                ws.send(JSON.stringify(testMessage));
            }, 1000);
        });
        
        ws.on('message', (data) => {
            console.log('📥 Received response:', data.toString());
        });
        
        ws.on('error', (error) => {
            console.log('❌ Flutter simulation error:', error.message);
            console.log('   This is likely the same error Flutter app gets!');
        });
        
        ws.on('close', (code, reason) => {
            console.log(`🔌 Connection closed: ${code} - ${reason}`);
            resolve();
        });
        
        setTimeout(() => {
            console.log('⏰ Flutter test timeout');
            ws.close();
            resolve();
        }, 10000);
    });
}

// Main execution
async function main() {
    try {
        await testUnauthenticatedConnection();
        console.log('');
        
        await testInvalidJWTConnection();
        console.log('');
        
        await testFlutterAppStructure();
        console.log('');
        
        console.log('🎯 DIAGNOSIS:');
        console.log('=============');
        console.log('The issue is likely one of these:');
        console.log('');
        console.log('1. Flutter app is not getting a valid JWT token from Cognito');
        console.log('2. Flutter app is not passing the JWT token correctly to WebSocket');
        console.log('3. AWS API Gateway Lambda authorizer is rejecting the token');
        console.log('4. Driver user does not exist in Cognito or is not verified');
        console.log('');
        console.log('📱 TO FIX:');
        console.log('=========');
        console.log('1. Check if driver is logged in to Flutter app with valid Cognito account');
        console.log('2. Verify JWT token is being obtained from Amplify.Auth.fetchAuthSession()');
        console.log('3. Ensure JWT token is passed in Authorization header to WebSocket');
        console.log('4. Test with actual Flutter app and check console logs');
        console.log('');
        console.log('🔍 Next step: Test with real driver account in Flutter app');
        
    } catch (error) {
        console.error('❌ Debug script error:', error);
    }
}

main();
