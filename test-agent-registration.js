/**
 * Test Agent Registration with Fixed WebSocket Handler
 * This test validates that agents can now properly connect and register
 */

const WebSocket = require('ws');

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';

console.log('🧪 Testing Agent Registration with Fixed WebSocket Handler');
console.log('📡 Connecting to:', WEBSOCKET_URL);

const ws = new WebSocket(WEBSOCKET_URL);

ws.on('open', function open() {
    console.log('✅ WebSocket connected successfully');
    
    // Test agent registration with chat_init
    const agentRegistration = {
        action: 'chat_init',
        userType: 'agent',
        agentId: 'agent_test_001',
        agentName: 'Test Support Agent',
        businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5'
    };
    
    console.log('📤 Sending agent registration:', JSON.stringify(agentRegistration, null, 2));
    ws.send(JSON.stringify(agentRegistration));
    
    // Also test the direct agent_connect action
    setTimeout(() => {
        const directAgentConnect = {
            action: 'chat_agent_connect',
            agentId: 'agent_test_002',
            agentName: 'Direct Connect Agent',
            businessId: '7ccf646c-9594-48d4-8f63-c366d89257e5'
        };
        
        console.log('📤 Sending direct agent connect:', JSON.stringify(directAgentConnect, null, 2));
        ws.send(JSON.stringify(directAgentConnect));
    }, 2000);
    
    // Test ping
    setTimeout(() => {
        console.log('📤 Sending ping');
        ws.send(JSON.stringify({ action: 'ping' }));
    }, 4000);
});

ws.on('message', function message(data) {
    try {
        const parsedMessage = JSON.parse(data.toString());
        console.log('📥 Received message:', JSON.stringify(parsedMessage, null, 2));
        
        // Check for successful agent registration
        if (parsedMessage.action === 'agent_connected') {
            console.log('🎉 SUCCESS: Agent registration confirmed!');
            console.log('   - Agent ID:', parsedMessage.agentId);
            console.log('   - Agent Name:', parsedMessage.agentName);
            console.log('   - Status:', parsedMessage.status);
        }
        
        // Check for session sync
        if (parsedMessage.action === 'sessions_sync') {
            console.log('📋 Session sync received:');
            console.log('   - Sessions count:', parsedMessage.sessions?.length || 0);
            if (parsedMessage.sessions?.length > 0) {
                console.log('   - Active sessions found:', parsedMessage.sessions.map(s => ({
                    sessionId: s.sessionId,
                    driverName: s.driverName,
                    status: s.status,
                    createdAt: s.createdAt
                })));
            }
        }
        
        // Check for errors
        if (parsedMessage.action === 'error') {
            console.log('❌ ERROR:', parsedMessage.message);
        }
        
    } catch (error) {
        console.log('📥 Raw message:', data.toString());
    }
});

ws.on('error', function error(err) {
    console.error('❌ WebSocket error:', err);
});

ws.on('close', function close(code, reason) {
    console.log('🔌 WebSocket closed:', code, reason.toString());
});

// Close connection after 10 seconds
setTimeout(() => {
    console.log('⏰ Test completed, closing connection');
    ws.close();
}, 10000);
