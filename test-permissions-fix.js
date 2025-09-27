/**
 * Test Live Chat After Permissions Fix
 * This script tests if the DynamoDB permissions fix resolved the message storage and broadcasting issues
 */

const WebSocket = require('ws');

console.log('🧪 Testing Live Chat After Permissions Fix');
console.log('===============================================');

const ws = new WebSocket('wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev');

ws.on('open', () => {
    console.log('✅ Monitoring agent WebSocket connected');
    
    // Register as agent to receive messages
    ws.send(JSON.stringify({
        action: 'chat_init',
        userType: 'agent',
        agentId: 'permissions_test_agent',
        agentName: 'Permissions Test Agent',
        businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5'
    }));
    
    console.log('📡 Agent registered - monitoring for messages from iPhone app...');
    console.log('');
    console.log('🚀 NOW SEND A MESSAGE FROM THE IPHONE APP TO TEST!');
    console.log('');
});

ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    console.log(`📥 Agent received: ${msg.action}`);
    
    if (msg.action === 'agent_connected') {
        console.log('✅ Agent registration confirmed');
    }
    
    if (msg.action === 'sessions_sync') {
        console.log(`📋 Sessions synced: ${msg.sessions?.length || 0} sessions`);
    }
    
    if (msg.action === 'message_received') {
        console.log('');
        console.log('🎉 SUCCESS: MESSAGE FROM IPHONE APP RECEIVED!');
        console.log('===============================================');
        console.log(`   📱 Session: ${msg.sessionId}`);
        console.log(`   👤 Sender: ${msg.senderName} (${msg.senderType})`);
        console.log(`   💬 Message: "${msg.message}"`);
        console.log(`   🕐 Time: ${msg.timestamp}`);
        console.log('');
        console.log('🎉 END-TO-END LIVE CHAT IS NOW WORKING!');
        console.log('===============================================');
        
        // Exit successfully
        setTimeout(() => process.exit(0), 2000);
    }
    
    if (msg.action === 'new_chat_session') {
        console.log('');
        console.log('🆕 NEW CHAT SESSION DETECTED:');
        console.log(`   📱 Session: ${msg.sessionId}`);
        console.log(`   👤 Driver: ${msg.driverName}`);
        console.log(`   🕐 Created: ${msg.createdAt}`);
        console.log('');
    }
});

ws.on('error', (err) => {
    console.error('❌ WebSocket error:', err.message);
});

ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
});

// Keep the connection alive for testing
console.log('⏰ Monitoring active for 60 seconds...');
setTimeout(() => {
    console.log('⏰ Test timeout - no messages received from iPhone app');
    console.log('💡 Try sending another message from the iPhone live chat');
    process.exit(1);
}, 60000);
