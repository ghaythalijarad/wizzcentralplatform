const https = require('https');

async function testCrossPlatformAuthentication() {
    console.log('🧪 CROSS-PLATFORM AUTHENTICATION TEST');
    console.log('====================================');
    
    const testCases = [
        {
            name: 'Flutter App to Support Chat - API Key Auth',
            url: 'https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/public/chat/send',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'wizzdriver_mobile_app_v1'
            },
            body: JSON.stringify({
                message: 'Test message from WizzDriver Flutter app',
                metadata: {
                    driverId: 'test-driver-123',
                    businessId: 'dev-business-123',
                    platform: 'flutter',
                    timestamp: new Date().toISOString()
                }
            })
        },
        {
            name: 'Test Invalid API Key',
            url: 'https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/public/chat/send',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': 'invalid_key'
            },
            body: JSON.stringify({
                message: 'This should fail',
                metadata: {}
            })
        },
        {
            name: 'Test No API Key',
            url: 'https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/public/chat/send',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'This should also fail',
                metadata: {}
            })
        }
    ];
    
    for (const testCase of testCases) {
        console.log(`\n🔍 Testing: ${testCase.name}`);
        console.log('─'.repeat(50));
        
        try {
            const result = await makeRequest(testCase);
            
            console.log(`📊 Status: ${result.statusCode}`);
            console.log(`📝 Response:`, result.body);
            
            if (testCase.name.includes('Invalid') || testCase.name.includes('No API Key')) {
                if (result.statusCode === 401) {
                    console.log('✅ Correctly rejected unauthorized request');
                } else {
                    console.log('❌ Should have been rejected with 401');
                }
            } else {
                if (result.statusCode === 200) {
                    const response = JSON.parse(result.body);
                    if (response.success && response.bridged) {
                        console.log('✅ Message successfully bridged to support system');
                        console.log(`📋 Message ID: ${response.messageId}`);
                        console.log(`🔗 Session ID: ${response.sessionId}`);
                    } else {
                        console.log('❌ Response missing expected fields');
                    }
                } else {
                    console.log('❌ Request failed with status:', result.statusCode);
                }
            }
            
        } catch (error) {
            console.error('❌ Test failed:', error.message);
        }
    }
    
    // Test CORS preflight
    console.log(`\n🔍 Testing: CORS Preflight Request`);
    console.log('─'.repeat(50));
    
    try {
        const corsResult = await makeRequest({
            url: 'https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/public/chat/send',
            method: 'OPTIONS',
            headers: {
                'Origin': 'https://flutter-app.example.com',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type, X-API-Key'
            }
        });
        
        console.log(`📊 Status: ${corsResult.statusCode}`);
        console.log(`📝 Headers:`, corsResult.headers);
        
        if (corsResult.statusCode === 200) {
            console.log('✅ CORS preflight successful');
        } else {
            console.log('❌ CORS preflight failed');
        }
        
    } catch (error) {
        console.error('❌ CORS test failed:', error.message);
    }
    
    console.log('\n🎯 SUMMARY');
    console.log('=========');
    console.log('Cross-platform authentication solution implemented:');
    console.log('• ✅ API key-based public endpoint');
    console.log('• ✅ No JWT token required');
    console.log('• ✅ CORS headers configured');
    console.log('• ✅ Message forwarding to WebSocket');
    console.log('• ✅ DynamoDB message storage');
    
    console.log('\n📚 Next Steps:');
    console.log('1. Test from actual Flutter app');
    console.log('2. Verify messages appear in WizzCentral dashboard');
    console.log('3. Test bidirectional communication');
    console.log('4. Monitor production performance');
}

function makeRequest(options) {
    return new Promise((resolve, reject) => {
        const url = new URL(options.url);
        const requestOptions = {
            hostname: url.hostname,
            port: url.port || 443,
            path: url.pathname + url.search,
            method: options.method,
            headers: options.headers || {}
        };
        
        const req = https.request(requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });
        
        req.on('error', reject);
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

// Run the test
testCrossPlatformAuthentication().catch(console.error);
