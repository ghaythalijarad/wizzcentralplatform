/**
 * Quick test to send a Flutter message and check if it gets stored in DynamoDB
 * This will confirm the Flutter->Lambda->DynamoDB flow is working
 */

async function testMessageStorage() {
    console.log('🧪 Testing Flutter message storage in DynamoDB...');
    
    const testMessage = {
        participantToken: 'test-session-123',
        message: 'Hello from message storage test! Current time: ' + new Date().toISOString(),
        contentType: 'text/plain',
        metadata: {
            senderId: 'test-driver-456',
            senderType: 'driver', 
            senderName: 'Test Driver',
            platform: 'Flutter-Debug'
        }
    };
    
    try {
        const fetch = (await import('node-fetch')).default;
        const response = await fetch('https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/api/chat/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testMessage)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Message sent successfully via HTTP bridge');
            console.log('📊 Response:', JSON.stringify(result, null, 2));
            console.log('');
            console.log('🔍 Key findings:');
            console.log(`   📝 Message ID: ${result.messageId}`);
            console.log(`   📦 Session ID: ${result.sessionId}`);
            console.log(`   📡 WebSocket Connections Found: ${result.broadcastResults.total}`);
            console.log(`   ✅ Successful Broadcasts: ${result.broadcastResults.successful}`);
            console.log(`   ❌ Failed Broadcasts: ${result.broadcastResults.failed}`);
            console.log('');
            
            if (result.broadcastResults.total === 0) {
                console.log('🚨 ISSUE CONFIRMED: No WebSocket connections found for agents!');
                console.log('💡 Solution: A support agent needs to log into the Central Platform');
                console.log('   and navigate to the Support Center -> Live Chat tab');
            } else if (result.broadcastResults.successful === 0) {
                console.log('🚨 ISSUE: WebSocket connections exist but broadcasts failed');
                console.log('💡 Solution: Check WebSocket connection health and authentication');
            } else {
                console.log('✅ SUCCESS: Message should appear in agent live chat interface!');
            }
        } else {
            console.log('❌ HTTP bridge failed:', result);
        }
    } catch (error) {
        console.error('❌ Failed to send test message:', error);
    }
}

// Run the test
testMessageStorage();
