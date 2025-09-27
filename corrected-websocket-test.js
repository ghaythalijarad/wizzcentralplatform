#!/usr/bin/env node

/**
 * FIXED WebSocket Diagnostic - Correct Agent Registration Format
 * Uses the proper AWS WebSocket handler message format
 */

const WebSocket = require('ws');

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';

async function testAgentRegistration() {
    return new Promise((resolve, reject) => {
        console.log('🔌 Testing Agent Registration with Correct Format...');
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
        }, 15000);
        
        ws.on('open', () => {
            connected = true;
            console.log('✅ WebSocket Connected!');
            
            // Send CORRECT agent registration message (using 'action' field)
            const agentMsg = {
                action: 'chat_agent_connect',  // <-- Changed from 'type' to 'action'
                agentId: 'corrected_agent_' + Date.now(),
                agentName: 'Corrected Support Agent',
                businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5'
            };
            
            console.log('📤 Sending CORRECTED agent registration...');
            console.log('   Message:', JSON.stringify(agentMsg, null, 2));
            ws.send(JSON.stringify(agentMsg));
            
            // Monitor for 12 seconds
            setTimeout(() => {
                clearTimeout(timeout);
                console.log(`\n📊 Test Complete`);
                console.log(`   Total Messages Received: ${messageCount}`);
                console.log(`   Connection Status: ${connected ? 'Connected' : 'Disconnected'}`);
                ws.close();
                resolve({ 
                    success: true, 
                    messagesReceived: messageCount,
                    agentRegistered: messageCount > 0
                });
            }, 12000);
        });
        
        ws.on('message', (data) => {
            messageCount++;
            const timestamp = new Date().toISOString();
            console.log(`\n📨 [${timestamp}] Message ${messageCount}:`);
            console.log(data.toString());
            
            try {
                const parsed = JSON.parse(data.toString());
                console.log('   Type/Action:', parsed.type || parsed.action || 'unknown');
                
                if (parsed.type === 'connection_confirmed' || parsed.action === 'connection_confirmed') {
                    console.log('🎯 AGENT REGISTRATION SUCCESSFUL!');
                }
                
                if (parsed.type === 'active_sessions' || parsed.action === 'active_sessions') {
                    console.log('🎯 ACTIVE SESSIONS RECEIVED!');
                    console.log('   Session Count:', parsed.sessions?.length || parsed.count || 0);
                }
                
                if (parsed.type === 'driver_message') {
                    console.log('🚗 DRIVER MESSAGE RECEIVED!');
                    console.log('   Session:', parsed.sessionId);
                    console.log('   Text:', parsed.messageText || parsed.message);
                    console.log('   From:', parsed.senderName);
                }
                
                if (parsed.type === 'error' || parsed.action === 'error') {
                    console.log('❌ ERROR RECEIVED!');
                    console.log('   Message:', parsed.message);
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
    console.log('🧪 CORRECTED WebSocket Agent Registration Test');
    console.log('=' .repeat(60));
    
    const result = await testAgentRegistration();
    
    console.log('\n📋 DIAGNOSTIC RESULTS:');
    console.log('=' .repeat(30));
    console.log('WebSocket Connection:', result.success ? '✅ SUCCESS' : '❌ FAILED');
    
    if (result.success) {
        console.log('Messages Received:', result.messagesReceived);
        console.log('Agent Registration:', result.agentRegistered ? '✅ SUCCESS' : '❌ FAILED');
        
        if (result.agentRegistered) {
            console.log('\n🎉 AGENT REGISTRATION WORKING!');
            console.log('Now test sending a message via curl to see if it appears here:');
            console.log('\ncurl -X POST \\');
            console.log('  "https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/api/chat/send" \\');
            console.log('  -H "Content-Type: application/json" \\');
            console.log('  -H "x-api-key: wizz-central-api-key-2024" \\');
            console.log('  -d \'{"participantToken":"test_session","message":"Hello from test!","metadata":{"senderType":"driver","senderName":"Test Driver"}}\'');
        } else {
            console.log('\n⚠️  AGENT REGISTRATION FAILED');
            console.log('Messages received but no confirmation or sessions sent');
        }
    } else {
        console.log('Error:', result.error);
    }
}

main().catch(console.error);
