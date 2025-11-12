/**
 * Test Agent Reply to Merchant
 * This simulates an agent sending a message to a merchant session
 */

const WebSocket = require('ws');

const WS_URL = 'wss://bx4snzqxpd.execute-api.us-east-1.amazonaws.com/ghayth';
const SESSION_ID = 'test_session_testBiz123_1762959697517'; // Use actual session ID
const AGENT_ID = 'agent_' + Date.now();
const AGENT_NAME = 'Test Support Agent';

console.log('🎧 Agent Test: Connecting to:', WS_URL);
console.log('📋 Session ID:', SESSION_ID);

const ws = new WebSocket(WS_URL);

ws.on('open', () => {
    console.log('\n✅ Agent CONNECTED\n');
    
    // Step 1: Send agent connect
    console.log('📤 Step 1: Sending agent connect...');
    const connectMsg = {
        action: 'chat_agent_connect',
        type: 'chat_agent_connect',
        agentId: AGENT_ID,
        agentName: AGENT_NAME
    };
    ws.send(JSON.stringify(connectMsg));
    
    // Step 2: Wait a bit, then send a test message
    setTimeout(() => {
        console.log('\n📤 Step 2: Sending test message to merchant...');
        const chatMsg = {
            action: 'chat_message',
            type: 'chat_message',
            sessionId: SESSION_ID,
            message: 'Hello from agent! This is a test reply. 👋',
            senderType: 'agent',
            agentId: AGENT_ID,
            agentName: AGENT_NAME,
            timestamp: new Date().toISOString()
        };
        console.log('Message:', JSON.stringify(chatMsg, null, 2));
        ws.send(JSON.stringify(chatMsg));
        
        // Wait for response
        setTimeout(() => {
            console.log('\n✅ Test complete - check merchant terminal for message');
            ws.close();
            process.exit(0);
        }, 3000);
    }, 1000);
});

ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log('\n📥 Agent received:', JSON.stringify(msg, null, 2));
});

ws.on('error', (error) => {
    console.error('\n❌ Agent WebSocket error:', error);
});

ws.on('close', () => {
    console.log('\n🔌 Agent disconnected');
});

// Keep alive
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down...');
    ws.close();
    process.exit(0);
});
