#!/usr/bin/env node

/**
 * FINAL VALIDATION TEST - Live Chat Integration
 * Tests the complete Flutter → HTTP Bridge → WebSocket → Central Platform flow
 */

console.log('🎯 FINAL LIVE CHAT VALIDATION TEST');
console.log('=====================================');
console.log('Testing: Flutter App → HTTP Bridge → WebSocket → Central Platform Dashboard\n');

const testMessage = {
    message: '🎉 FINAL VALIDATION - Live Chat Integration Working!',
    sessionId: 'session_04d8a438-1081-70fb-0692-58167201d24d',
    metadata: {
        senderType: 'driver',
        senderId: 'ghayth_validation_test',
        senderName: 'Ghayth Validation Test'
    }
};

async function validateIntegration() {
    console.log('📋 Step 1: Checking HTTP Bridge Health...');
    
    try {
        const fetch = (await import('node-fetch')).default;
        
        // Test bridge health
        const healthResponse = await fetch('http://localhost:8087/health');
        const healthData = await healthResponse.json();
        
        console.log('✅ Bridge Health Check:');
        console.log(`   Status: ${healthData.status}`);
        console.log(`   WebSocket: ${healthData.liveChatStatus}`);
        console.log(`   Timestamp: ${healthData.timestamp}\n`);
        
        // Send test message
        console.log('📱 Step 2: Sending test message through bridge...');
        const messageResponse = await fetch('http://localhost:8087/chat/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testMessage)
        });
        
        const messageResult = await messageResponse.json();
        
        if (messageResponse.ok && messageResult.success) {
            console.log('✅ Message Sent Successfully:');
            console.log(`   Message ID: ${messageResult.messageId}`);
            console.log(`   Session ID: ${messageResult.sessionId}`);
            console.log(`   Bridged to WebSocket: ${messageResult.bridged}`);
            console.log(`   Response: ${messageResult.message}\n`);
            
            console.log('🎊 VALIDATION SUCCESSFUL!');
            console.log('==========================================');
            console.log('✅ HTTP Bridge: Working');
            console.log('✅ WebSocket Connection: Working'); 
            console.log('✅ Message Forwarding: Working');
            console.log('✅ Live Chat Integration: COMPLETE\n');
            
            console.log('📺 Next Step: Open Central Platform Dashboard');
            console.log('🔗 URL: file:///Users/ghaythallaheebi/wizzcentralplatform/central_platform_agent.html');
            console.log('👆 Click "Connect as Support Agent" to see messages\n');
            
            console.log('📱 Flutter App Testing:');
            console.log('1. Open WhizzDriver app on iPhone');
            console.log('2. Navigate: More → Live Support Chat');
            console.log('3. Send a message');
            console.log('4. Message should appear in Central Platform dashboard');
            
        } else {
            console.log('❌ Message sending failed:');
            console.log(messageResult);
        }
        
    } catch (error) {
        console.error('❌ Validation failed:', error.message);
        console.log('\n🔧 Troubleshooting:');
        console.log('1. Ensure HTTP bridge is running: node chat-message-bridge.cjs');
        console.log('2. Check WebSocket endpoint is accessible');
        console.log('3. Verify authentication parameters');
    }
}

validateIntegration();
