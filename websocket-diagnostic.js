#!/usr/bin/env node

/**
 * WebSocket Connection Diagnostic
 * Tests WebSocket connection and monitors for message delivery
 */

const WebSocket = require('ws');

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';

async function testWebSocketConnection() {
    return new Promise((resolve, reject) => {
        console.log('🔌 Testing WebSocket Connection...');
        console.log('📡 URL:', WEBSOCKET_URL);
        
        const ws = new WebSocket(WEBSOCKET_URL);
        let messageCount = 0;
        let connected = false;
        
        const timeout = setTimeout(() => {
            if (!connected) {
                console.log('❌ Connection timeout');
                ws.close();
                resolve({ success: false, error: 'timeout' });
            }
        }, 10000);
        
        ws.on('open', () => {
            connected = true;
            clearTimeout(timeout);
            console.log('✅ WebSocket Connected!');
            
            // Send agent registration message
            const agentMsg = {
                type: 'chat_agent_connect',
                agentId: 'diagnostic_agent_' + Date.now(),
                agentName: 'Diagnostic Support Agent',
                businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5'
            };
            
            console.log('📤 Registering as support agent...');
            console.log('   Message:', JSON.stringify(agentMsg, null, 2));
            ws.send(JSON.stringify(agentMsg));
            
            // Monitor for 15 seconds
            setTimeout(() => {
                console.log(`\n📊 Test Complete`);
                console.log(`   Total Messages Received: ${messageCount}`);
                console.log(`   Connection Status: ${connected ? 'Connected' : 'Disconnected'}`);
                ws.close();
                resolve({ 
                    success: true, 
                    messagesReceived: messageCount,
                    connectionWorking: connected
                });
            }, 15000);
        });
        
        ws.on('message', (data) => {
            messageCount++;
            const timestamp = new Date().toISOString();
            console.log(`\n📨 [${timestamp}] Message ${messageCount}:`);
            console.log(data.toString());
            
            try {
                const parsed = JSON.parse(data.toString());
                console.log('   Type:', parsed.type || parsed.action || 'unknown');
                
                if (parsed.type === 'driver_message') {
                    console.log('🎯 DRIVER MESSAGE DETECTED!');
                    console.log('   Session:', parsed.sessionId);
                    console.log('   Text:', parsed.messageText || parsed.message);
                    console.log('   From:', parsed.senderName);
                }
            } catch (e) {
                console.log('   Format: Raw text');
            }
        });
        
        ws.on('error', (error) => {
            console.log('❌ WebSocket Error:', error.message);
            clearTimeout(timeout);
            resolve({ success: false, error: error.message });
        });
        
        ws.on('close', (code, reason) => {
            console.log(`🔌 WebSocket Closed: ${code} - ${reason || 'No reason'}`);
            clearTimeout(timeout);
        });
    });
}

async function main() {
    console.log('🧪 WebSocket Diagnostic Test');
    console.log('=' .repeat(50));
    
    const result = await testWebSocketConnection();
    
    console.log('\n📋 DIAGNOSTIC RESULTS:');
    console.log('=' .repeat(30));
    console.log('WebSocket Connection:', result.success ? '✅ SUCCESS' : '❌ FAILED');
    
    if (result.success) {
        console.log('Messages Received:', result.messagesReceived);
        console.log('Connection Stability:', result.connectionWorking ? 'Good' : 'Poor');
        
        if (result.messagesReceived === 0) {
            console.log('\n⚠️  NO MESSAGES RECEIVED');
            console.log('This suggests either:');
            console.log('1. AWS WebSocket is not broadcasting messages to this connection');
            console.log('2. No test messages were sent during the monitoring period');
            console.log('3. Message routing is broken in the AWS Lambda handler');
        }
    } else {
        console.log('Error:', result.error);
        console.log('\n🔍 TROUBLESHOOTING:');
        console.log('1. Check WebSocket URL is correct');
        console.log('2. Verify AWS API Gateway WebSocket is deployed');
        console.log('3. Check Lambda function permissions');
    }
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. While this diagnostic is running, send a test message via:');
    console.log('   curl -X POST https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/api/chat/send \\');
    console.log('   -H "Content-Type: application/json" \\');
    console.log('   -H "x-api-key: wizz-central-api-key-2024" \\');
    console.log('   -d \'{"participantToken":"test","message":"Hello from curl","metadata":{"senderType":"driver"}}\'');
    console.log('2. Check if the message appears in this diagnostic output');
    console.log('3. If not, the WebSocket broadcasting is broken in AWS');
}

main().catch(console.error);
