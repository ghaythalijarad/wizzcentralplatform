/**
 * Monitor Agent Connection - Real-time monitoring for when admin establishes agent connection
 */

async function monitorAgentConnections() {
    console.log('🔍 Monitoring Agent WebSocket Connections...');
    console.log('==========================================');
    console.log('');
    console.log('📋 Instructions:');
    console.log('1. Open the Central Platform: https://main.d2f5oacwil9cbi.amplifyapp.com');
    console.log('2. Navigate to Support → Live Chat tab');
    console.log('3. Wait for connection to establish');
    console.log('');
    console.log('⏰ Checking every 10 seconds...');
    console.log('');

    let previousConnectionCount = 0;
    let testMessageCounter = 1;

    const checkConnections = async () => {
        try {
            const testMessage = {
                participantToken: `monitoring-session-${Date.now()}`,
                message: `Monitor test #${testMessageCounter++} - ${new Date().toLocaleTimeString()}`,
                contentType: 'text/plain',
                metadata: {
                    senderId: 'connection-monitor',
                    senderType: 'driver',
                    senderName: 'Connection Monitor',
                    platform: 'Monitor-Script'
                }
            };

            const fetch = (await import('node-fetch')).default;
            const response = await fetch('https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/api/chat/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(testMessage)
            });

            if (response.ok) {
                const result = await response.json();
                const currentConnections = result.broadcastResults.total;
                
                console.log(`🕐 ${new Date().toLocaleTimeString()} - Agent connections: ${currentConnections}`);
                
                if (currentConnections > previousConnectionCount) {
                    console.log('');
                    console.log('🎉 NEW AGENT CONNECTION DETECTED!');
                    console.log(`✅ Agent connections increased from ${previousConnectionCount} to ${currentConnections}`);
                    console.log('');
                    console.log('🧪 Testing message delivery...');
                    
                    // Send a test message to the agent
                    const welcomeMessage = {
                        participantToken: 'admin-test-session',
                        message: '🎯 SUCCESS! Admin agent connection established. Flutter messages will now appear in your live chat interface!',
                        contentType: 'text/plain',
                        metadata: {
                            senderId: 'test-system',
                            senderType: 'driver',
                            senderName: 'Test System',
                            platform: 'Connection-Test'
                        }
                    };
                    
                    const testResponse = await fetch('https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev/api/chat/send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(welcomeMessage)
                    });
                    
                    if (testResponse.ok) {
                        const testResult = await testResponse.json();
                        console.log(`📤 Test message sent - Successful broadcasts: ${testResult.broadcastResults.successful}`);
                        console.log('');
                        console.log('✅ SOLUTION COMPLETE!');
                        console.log('   Flutter messages will now appear in the Central Platform live chat!');
                        console.log('   Check your live chat interface for the test message above.');
                        return true; // Stop monitoring
                    }
                }
                
                previousConnectionCount = currentConnections;
            }
        } catch (error) {
            console.error('❌ Monitoring error:', error.message);
        }
        
        return false; // Continue monitoring
    };

    // Check immediately
    let completed = await checkConnections();
    
    if (!completed) {
        // Then check every 10 seconds
        const interval = setInterval(async () => {
            completed = await checkConnections();
            if (completed) {
                clearInterval(interval);
                setTimeout(() => process.exit(0), 3000);
            }
        }, 10000);
        
        // Stop after 10 minutes if no connection
        setTimeout(() => {
            console.log('');
            console.log('⏰ Monitoring stopped after 10 minutes');
            console.log('💡 Make sure to navigate to Support → Live Chat tab in the Central Platform');
            clearInterval(interval);
            process.exit(0);
        }, 600000);
    }
}

monitorAgentConnections();
