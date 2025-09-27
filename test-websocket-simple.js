#!/usr/bin/env node

const WebSocket = require('ws');

console.log('🧪 Testing Live Chat WebSocket Connection');
console.log('==========================================');

try {
    const ws = new WebSocket('wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev');
    
    ws.on('open', () => {
        console.log('✅ WebSocket connected successfully');
        
        // Register as agent
        const agentMessage = {
            action: 'chat_init',
            userType: 'agent',
            agentId: 'test_agent_' + Date.now(),
            agentName: 'Test Agent',
            businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5'
        };
        
        console.log('📡 Registering agent...');
        ws.send(JSON.stringify(agentMessage));
        
        // Set timeout to close connection after 15 seconds
        setTimeout(() => {
            console.log('⏰ Test timeout - closing connection');
            ws.close();
            process.exit(0);
        }, 15000);
    });
    
    ws.on('message', (data) => {
        try {
            const msg = JSON.parse(data.toString());
            console.log(`📥 Received: ${msg.action}`, msg);
            
            if (msg.action === 'agent_connected') {
                console.log('✅ Agent registration confirmed!');
            }
            
            if (msg.action === 'sessions_sync') {
                console.log(`📋 Sessions synced: ${msg.sessions?.length || 0} active sessions`);
            }
            
            if (msg.action === 'message_received') {
                console.log('🎉 SUCCESS: New message received from mobile app!');
                console.log(`   Session: ${msg.sessionId}`);
                console.log(`   Message: "${msg.message}"`);
                console.log(`   Sender: ${msg.senderName}`);
            }
            
        } catch (error) {
            console.log('📥 Received (raw):', data.toString());
        }
    });
    
    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error.message);
        process.exit(1);
    });
    
    ws.on('close', (code, reason) => {
        console.log(`🔌 WebSocket closed: ${code} ${reason}`);
        process.exit(0);
    });
    
} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
