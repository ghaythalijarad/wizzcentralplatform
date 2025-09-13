/**
 * Test WebSocket connection with real JWT authentication
 * Tests whether JWT tokens from AWS Cognito work for WebSocket authentication
 */

const WebSocket = require('ws');

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';
const BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';

// Test with a sample JWT-like token structure
function generateTestJWTToken() {
    // This is a sample JWT-like structure for testing
    // In real usage, this would come from AWS Cognito
    const header = {
        "alg": "RS256",
        "kid": "sample-key-id"
    };
    
    const payload = {
        "sub": "test-driver-id",
        "aud": "7ak005suept85gp6l2vlg4jkbu", // Cognito App Client ID
        "cognito:username": "testdriver",
        "given_name": "Test",
        "family_name": "Driver",
        "email": "testdriver@example.com",
        "phone_number": "+9647701234567",
        "iss": "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_usoTs2VtS",
        "exp": Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
        "iat": Math.floor(Date.now() / 1000),
        "token_use": "access"
    };
    
    // Base64 encode header and payload (simplified - real JWT would be signed)
    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = 'test-signature'; // Real JWT would have cryptographic signature
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Test with different authentication methods
async function testAuthenticationMethods() {
    console.log('🔐 Testing WebSocket Authentication Methods');
    console.log('========================================');
    
    const testToken = generateTestJWTToken();
    
    // Method 1: Query parameter authentication
    console.log('\n📍 Method 1: Token in query parameter');
    await testConnection({
        url: `${WEBSOCKET_URL}?businessId=${BUSINESS_ID}&token=${testToken}&userType=driver&platform=flutter`
    });
    
    // Method 2: Authorization header authentication  
    console.log('\n📍 Method 2: JWT in Authorization header');
    await testConnection({
        url: `${WEBSOCKET_URL}?businessId=${BUSINESS_ID}&userType=driver&platform=flutter`,
        headers: {
            'Authorization': `Bearer ${testToken}`
        }
    });
    
    // Method 3: Simple business ID only (to test basic connection)
    console.log('\n📍 Method 3: Business ID only (should fail with 401)');
    await testConnection({
        url: `${WEBSOCKET_URL}?businessId=${BUSINESS_ID}&userType=driver&platform=flutter`
    });
}

function testConnection({ url, headers = {} }) {
    return new Promise((resolve) => {
        console.log(`🔌 Testing connection: ${url}`);
        if (Object.keys(headers).length > 0) {
            console.log(`📋 Headers:`, headers);
        }
        
        const ws = new WebSocket(url, { headers });
        let connected = false;
        
        const timeout = setTimeout(() => {
            if (!connected) {
                console.log('⏰ Connection timeout (10s)');
                ws.close();
                resolve();
            }
        }, 10000);
        
        ws.on('open', () => {
            connected = true;
            clearTimeout(timeout);
            console.log('✅ WebSocket connected successfully!');
            
            // Send a test message
            const testMessage = {
                type: 'chat_driver_connect',
                driverId: 'test-driver-123',
                driverName: 'Test Driver',
                businessId: BUSINESS_ID,
                timestamp: new Date().toISOString()
            };
            
            ws.send(JSON.stringify(testMessage));
            console.log('📤 Sent driver connect message');
            
            // Keep connection open for a moment to receive any responses
            setTimeout(() => {
                ws.close();
                resolve();
            }, 2000);
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('📨 Received:', JSON.stringify(message, null, 2));
            } catch (e) {
                console.log('📨 Raw message:', data.toString());
            }
        });
        
        ws.on('error', (error) => {
            clearTimeout(timeout);
            console.log('❌ WebSocket error:', error.message);
            if (error.message.includes('401')) {
                console.log('🔒 Authentication failed - invalid or missing token');
            }
            resolve();
        });
        
        ws.on('close', (code, reason) => {
            clearTimeout(timeout);
            console.log(`🔌 Connection closed: ${code} - ${reason || 'No reason'}`);
            resolve();
        });
    });
}

// Run the test
async function main() {
    try {
        await testAuthenticationMethods();
        console.log('\n🎯 Authentication test completed');
        process.exit(0);
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

main();
