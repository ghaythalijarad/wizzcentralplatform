/**
 * Script to retrieve and display Ghayth's actual chat messages
 */

const WebSocket = require('ws');

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';
const BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';
const YOUR_SESSION_ID = 'session_04d8a438-1081-70fb-0692-58167201d24d_1757577849993';

async function retrieveYourMessages() {
    console.log('🔍 Retrieving Ghayth\'s chat messages...');
    console.log('📱 Session ID:', YOUR_SESSION_ID);
    
    return new Promise((resolve, reject) => {
        const agentParams = new URLSearchParams({
            businessId: BUSINESS_ID,
            userId: 'ghayth-message-retriever',
            userType: 'support',
            agentId: 'message-retriever-001',
            platform: 'web',
            appVersion: '1.0.0'
        });

        const wsUrl = `${WEBSOCKET_URL}?${agentParams.toString()}`;
        console.log('🔗 Connecting to:', wsUrl);
        
        const ws = new WebSocket(wsUrl);
        
        const timeout = setTimeout(() => {
            console.log('⏰ Connection timeout after 15 seconds');
            ws.close();
            reject(new Error('Connection timeout'));
        }, 15000);
        
        ws.on('open', () => {
            console.log('✅ Connected! Sending agent connect message...');
            
            // Send agent connect message
            ws.send(JSON.stringify({
                type: 'chat_agent_connect',
                agentId: 'message-retriever-001',
                agentName: 'Message Retriever'
            }));
            
            // Request specific session messages
            setTimeout(() => {
                console.log('📨 Requesting messages for your session...');
                ws.send(JSON.stringify({
                    type: 'get_session_messages',
                    sessionId: YOUR_SESSION_ID,
                    limit: 50 // Get last 50 messages
                }));
            }, 2000);
        });
        
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                console.log('\n📨 Received message:', JSON.stringify(message, null, 2));
                
                if (message.type === 'session_messages') {
                    console.log('\n🎯 YOUR CHAT MESSAGES:');
                    console.log('=' .repeat(50));
                    
                    if (message.messages && message.messages.length > 0) {
                        message.messages.forEach((msg, index) => {
                            const timestamp = new Date(msg.timestamp).toLocaleString();
                            const sender = msg.senderType === 'driver' ? '🚗 You' : '👨‍💼 Agent';
                            console.log(`${index + 1}. [${timestamp}] ${sender}: ${msg.messageText}`);
                        });
                    } else {
                        console.log('No messages found in session.');
                    }
                    
                    console.log('=' .repeat(50));
                    clearTimeout(timeout);
                    ws.close();
                    resolve(message.messages || []);
                }
                
                if (message.type === 'active_sessions') {
                    const yourSession = message.sessions.find(s => s.sessionId === YOUR_SESSION_ID);
                    if (yourSession) {
                        console.log('\n📊 Your Session Status:');
                        console.log(`   - Driver: ${yourSession.driverName}`);
                        console.log(`   - Created: ${new Date(yourSession.createdAt).toLocaleString()}`);
                        console.log(`   - Last Message: ${new Date(yourSession.lastMessageAt).toLocaleString()}`);
                        console.log(`   - Unread Messages: ${yourSession.unreadAgent}`);
                    }
                }
                
            } catch (e) {
                console.log('📨 Raw message:', data.toString());
            }
        });
        
        ws.on('error', (error) => {
            clearTimeout(timeout);
            console.error('❌ WebSocket error:', error);
            reject(error);
        });
        
        ws.on('close', (code, reason) => {
            clearTimeout(timeout);
            console.log('🔌 Connection closed:', code, reason);
            resolve([]);
        });
    });
}

// Run the script
retrieveYourMessages()
    .then(messages => {
        console.log(`\n✅ Retrieved ${messages.length} messages`);
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ Failed to retrieve messages:', error);
        process.exit(1);
    });
