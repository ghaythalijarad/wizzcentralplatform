#!/bin/bash

echo "🧪 Testing Live Chat After Permissions Fix"
echo "==========================================="

# Start monitoring agent in background and capture output
node -e "
const WebSocket = require('ws');
console.log('✅ Starting monitoring agent...');

const ws = new WebSocket('wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev');

ws.on('open', () => {
    console.log('✅ Agent WebSocket connected');
    ws.send(JSON.stringify({
        action: 'chat_init',
        userType: 'agent',
        agentId: 'permissions_test_agent',
        agentName: 'Permissions Test Agent',
        businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5'
    }));
    console.log('📡 Agent registered - monitoring for messages');
    console.log('');
    console.log('🚀 NOW SEND A MESSAGE FROM THE IPHONE APP!');
    console.log('');
});

ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log('📥 Agent received:', msg.action);
    
    if (msg.action === 'agent_connected') {
        console.log('✅ Agent registration confirmed');
    }
    
    if (msg.action === 'message_received') {
        console.log('');
        console.log('🎉 SUCCESS: MESSAGE FROM IPHONE RECEIVED!');
        console.log('========================================');
        console.log('📱 Session:', msg.sessionId);
        console.log('👤 Sender:', msg.senderName);
        console.log('💬 Message:', msg.message);
        console.log('🕐 Time:', msg.timestamp);
        console.log('');
        console.log('🎉 END-TO-END LIVE CHAT IS WORKING!');
        process.exit(0);
    }
});

ws.on('error', (err) => console.error('❌ Error:', err.message));

setTimeout(() => {
    console.log('⏰ Test timeout - try sending another message from iPhone');
    process.exit(1);
}, 60000);
" &

echo "📱 Monitoring agent started in background"
echo "🚀 Please send a message from the iPhone app now!"

# Wait for background process
wait
