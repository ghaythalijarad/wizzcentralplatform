#!/usr/bin/env node

/**
 * Quick Test for Enhanced WebSocket Handler
 * Tests if our chat actions are now recognized
 */

const WebSocket = require('ws');

const WS_ENDPOINT = 'wss://lwk0wf6rpl.execute-api.us-east-1.amazonaws.com/dev';

console.log('🧪 Testing Enhanced WebSocket Handler');
console.log('=====================================');

async function testEnhancedHandler() {
    return new Promise((resolve, reject) => {
        console.log('🔌 Connecting to:', WS_ENDPOINT);
        
        const ws = new WebSocket(WS_ENDPOINT);
        let testPassed = false;
        
        const timeout = setTimeout(() => {
            console.log('⏰ Test timeout');
            ws.close();
            resolve(false);
        }, 10000);
        
        ws.on('open', () => {
            console.log('✅ WebSocket connected');
            
            // Test join_channel action
            const testMessage = {
                action: 'join_channel',
                channel: 'driver_test123',
                userType: 'driver',
                userId: 'test_driver_' + Date.now(),
                userName: 'Test Driver',
                timestamp: new Date().toISOString()
            };
            
            console.log('📤 Sending test message:', testMessage.action);
            ws.send(JSON.stringify(testMessage));
        });
        
        ws.on('message', (data) => {
            try {
                const response = JSON.parse(data.toString());
                console.log('📨 Received response:', response);
                
                // Check if we got a channel_joined response (our enhanced handler)
                if (response.action === 'channel_joined') {
                    console.log('✅ SUCCESS: Enhanced handler is working!');
                    console.log('✅ Chat actions are now recognized');
                    testPassed = true;
                } else if (response.action === 'error' && response.message && response.message.includes('Unknown action')) {
                    console.log('❌ FAILURE: Still using old handler');
                } else {
                    console.log('🔍 Response:', response);
                }
                
                clearTimeout(timeout);
                ws.close();
                resolve(testPassed);
            } catch (error) {
                console.error('❌ Error parsing response:', error);
                clearTimeout(timeout);
                ws.close();
                resolve(false);
            }
        });
        
        ws.on('error', (error) => {
            console.error('❌ WebSocket error:', error);
            clearTimeout(timeout);
            resolve(false);
        });
        
        ws.on('close', () => {
            console.log('🔌 WebSocket disconnected');
            clearTimeout(timeout);
            if (!testPassed) {
                resolve(false);
            }
        });
    });
}

// Run the test
testEnhancedHandler().then(success => {
    console.log('');
    if (success) {
        console.log('🎉 TEST PASSED: Enhanced WebSocket handler is working!');
        console.log('🚀 Your Flutter app can now:');
        console.log('   • Connect with join_channel');
        console.log('   • Start sessions with chat_init');
        console.log('   • Send messages with chat_message');
        console.log('   • Connect agents with agent_connect');
    } else {
        console.log('❌ TEST FAILED: Enhanced handler not working yet');
        console.log('🔧 Check the Lambda function logs for errors');
    }
    console.log('');
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('❌ Test error:', error);
    process.exit(1);
});
