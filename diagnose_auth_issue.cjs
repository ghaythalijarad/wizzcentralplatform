#!/usr/bin/env node
/**
 * Enhanced Live Chat Authentication Fix
 * This script diagnoses and provides solutions for the JWT User Pool mismatch
 */

const WebSocket = require('ws');

// Configuration
const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';
const BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';

// User Pool configurations
const FLUTTER_USER_POOL = 'us-east-1_90UtBLIfK';
const CENTRAL_PLATFORM_USER_POOL = 'us-east-1_LDgfo1Pmc';

console.log('🎯 Live Chat Authentication Fix Analysis');
console.log('=======================================');
console.log(`📱 Flutter App User Pool: ${FLUTTER_USER_POOL}`);
console.log(`🏢 Central Platform User Pool: ${CENTRAL_PLATFORM_USER_POOL}`);
console.log(`🔗 WebSocket URL: ${WEBSOCKET_URL}`);
console.log('');

// Test different connection methods
async function testConnectionMethods() {
    console.log('🔍 Testing Connection Methods...');
    
    // Method 1: No authentication (should fail with 401)
    console.log('\n1️⃣ Testing without authentication:');
    await testConnection({
        url: `${WEBSOCKET_URL}?businessId=${BUSINESS_ID}&userType=driver&platform=flutter`,
        method: 'No Auth'
    });
    
    // Method 2: With business ID and user info (might bypass some auth)
    console.log('\n2️⃣ Testing with business parameters only:');
    await testConnection({
        url: `${WEBSOCKET_URL}?businessId=${BUSINESS_ID}&userType=driver&platform=flutter&userId=test-driver-123`,
        method: 'Business ID Only'
    });
    
    // Method 3: Mock JWT token structure
    console.log('\n3️⃣ Testing with mock JWT token:');
    const mockToken = createMockJWT(CENTRAL_PLATFORM_USER_POOL);
    await testConnection({
        url: `${WEBSOCKET_URL}?businessId=${BUSINESS_ID}&userType=driver&platform=flutter&token=${mockToken}`,
        method: 'Mock JWT Token'
    });
    
    // Method 4: Try with authorization header
    console.log('\n4️⃣ Testing with Authorization header:');
    await testConnection({
        url: `${WEBSOCKET_URL}?businessId=${BUSINESS_ID}&userType=driver&platform=flutter`,
        headers: { 'Authorization': `Bearer ${mockToken}` },
        method: 'Authorization Header'
    });
}

function createMockJWT(userPool) {
    // Create a properly structured JWT for the target user pool
    const header = {
        "alg": "RS256",
        "kid": "test-key-id"
    };
    
    const payload = {
        "sub": "test-driver-123",
        "aud": "3ngjf86vuq8up86urecprvm08j", // Central Platform Client ID
        "cognito:username": "livetest.driver",
        "given_name": "Test",
        "family_name": "Driver",
        "email": "livetest.driver@example.com",
        "iss": `https://cognito-idp.us-east-1.amazonaws.com/${userPool}`,
        "exp": Math.floor(Date.now() / 1000) + 3600,
        "iat": Math.floor(Date.now() / 1000),
        "token_use": "access"
    };
    
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    return `${encodedHeader}.${encodedPayload}.test-signature`;
}

function testConnection({ url, headers = {}, method }) {
    return new Promise((resolve) => {
        console.log(`   🔌 Method: ${method}`);
        console.log(`   📍 URL: ${url.replace(/token=[^&]+/, 'token=HIDDEN')}`);
        
        const ws = new WebSocket(url, { headers });
        let connected = false;
        let errorReceived = false;
        
        const timeout = setTimeout(() => {
            if (!connected && !errorReceived) {
                console.log('   ⏰ Timeout (no response)');
                ws.close();
                resolve();
            }
        }, 5000);
        
        ws.on('open', () => {
            connected = true;
            clearTimeout(timeout);
            console.log('   ✅ Connection successful!');
            
            // Send test message
            const testMessage = {
                type: 'chat_message',
                sessionId: `test-session-${Date.now()}`,
                message: 'Test message from Flutter driver',
                metadata: {
                    senderId: 'test-driver-123',
                    senderType: 'driver',
                    businessId: BUSINESS_ID,
                    timestamp: new Date().toISOString()
                }
            };
            
            ws.send(JSON.stringify(testMessage));
            console.log('   📤 Sent test message');
            
            setTimeout(() => {
                ws.close();
                resolve();
            }, 2000);
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('   📨 Response:', JSON.stringify(message, null, 4));
            } catch (e) {
                console.log('   📨 Raw response:', data.toString());
            }
        });
        
        ws.on('error', (error) => {
            errorReceived = true;
            clearTimeout(timeout);
            
            console.log(`   ❌ Error: ${error.message}`);
            
            if (error.message.includes('401')) {
                console.log('   🔒 401 Unauthorized - JWT token rejected');
            } else if (error.message.includes('403')) {
                console.log('   🚫 403 Forbidden - Access denied');
            } else if (error.message.includes('400')) {
                console.log('   ⚠️ 400 Bad Request - Invalid parameters');
            }
            
            resolve();
        });
        
        ws.on('close', (code, reason) => {
            clearTimeout(timeout);
            console.log(`   🔌 Closed: ${code} - ${reason || 'No reason'}`);
            resolve();
        });
    });
}

async function provideSolutions() {
    console.log('\n');
    console.log('💡 SOLUTIONS FOR USER POOL MISMATCH');
    console.log('===================================');
    
    console.log('\n🎯 Option 1: Update WebSocket Authorizer (Recommended)');
    console.log('   Configure the WebSocket API Gateway authorizer to accept both User Pools:');
    console.log(`   - Primary: ${CENTRAL_PLATFORM_USER_POOL} (Central Platform)`);
    console.log(`   - Secondary: ${FLUTTER_USER_POOL} (Flutter App)`);
    console.log('   This allows both systems to use their existing authentication.');
    
    console.log('\n🎯 Option 2: Create Shared Authentication Service');
    console.log('   Build a service that can generate tokens for the Central Platform:');
    console.log('   - Flutter app gets token from Central Platform on-demand');
    console.log('   - Store Central Platform credentials securely');
    console.log('   - Use token exchange pattern');
    
    console.log('\n🎯 Option 3: Use API Key Authentication');
    console.log('   Configure WebSocket to accept API key for live chat:');
    console.log('   - Less secure but simpler to implement');
    console.log('   - Use for testing and development only');
    
    console.log('\n🎯 Option 4: HTTP Bridge Fallback');
    console.log('   Use HTTP API instead of direct WebSocket:');
    console.log('   - Flutter sends messages via HTTP POST');
    console.log('   - Central Platform polls or uses webhooks');
    console.log('   - More reliable for cross-platform messaging');
    
    console.log('\n');
    console.log('🚀 IMMEDIATE NEXT STEPS');
    console.log('======================');
    console.log('1. Test Option 4 (HTTP Bridge) for immediate functionality');
    console.log('2. Configure WebSocket authorizer for both User Pools (Option 1)');
    console.log('3. Update Flutter app to use HTTP fallback when WebSocket fails');
    console.log('4. Add authentication retry logic with exponential backoff');
    
    console.log('\n');
    console.log('📋 HTTP Bridge Test Command:');
    console.log('curl -X POST https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/api/chat/send \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"message": "Test from Flutter", "sessionId": "test", "businessId": "' + BUSINESS_ID + '"}\'');
}

async function main() {
    try {
        await testConnectionMethods();
        await provideSolutions();
        
        console.log('\n✅ Authentication analysis complete!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Analysis failed:', error);
        process.exit(1);
    }
}

main();
