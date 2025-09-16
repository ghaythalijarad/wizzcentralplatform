/**
 * Test Enhanced WebSocket Handler
 * This script tests the proper message flow expected by the enhanced handler
 */

const WebSocket = require('ws');

const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';

async function testEnhancedHandler() {
    console.log('🔌 Testing Enhanced WebSocket Handler...');
    console.log('📍 Connecting to:', WEBSOCKET_URL);
    
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(WEBSOCKET_URL);
        
        let connectionTimeout = setTimeout(() => {
            console.log('❌ Connection timeout');
            ws.terminate();
            reject(new Error('Connection timeout'));
        }, 15000);
        
        ws.on('open', function open() {
            console.log('✅ WebSocket connection established!');
            console.log('📍 Connection ID will be assigned by server');
            clearTimeout(connectionTimeout);
            
            // Step 1: Send join_channel message as expected by enhanced handler
            const joinMessage = {
                action: 'join_channel',
                userType: 'driver',
                userId: 'test-driver-123',
                userName: 'Test Driver',
                userPhone: '+9647901234567',
                channel: 'support',
                timestamp: new Date().toISOString()
            };
            
            console.log('📤 Step 1 - Sending join_channel:', JSON.stringify(joinMessage, null, 2));
            console.log('⏳ Waiting for server response...');
            ws.send(JSON.stringify(joinMessage));
        });
        
        ws.on('message', function message(data) {
            console.log('📥 Received message:', data.toString());
            try {
                const parsed = JSON.parse(data.toString());
                console.log('📋 Parsed:', JSON.stringify(parsed, null, 2));
                
                // Check for successful channel join
                if (parsed.action === 'channel_joined' || parsed.status === 'success') {
                    console.log('✅ Channel joined! Testing chat initialization...');
                    
                    // Step 2: Initialize chat session
                    const chatInitMessage = {
                        action: 'chat_init',
                        userType: 'driver',
                        driverId: 'test-driver-123',
                        timestamp: new Date().toISOString()
                    };
                    
                    console.log('📤 Step 2 - Sending chat_init:', JSON.stringify(chatInitMessage, null, 2));
                    ws.send(JSON.stringify(chatInitMessage));
                    
                } else if (parsed.action === 'chat_session_created' || parsed.sessionId) {
                    console.log('✅ Chat session created! Sending test message...');
                    
                    // Step 3: Send a chat message
                    const testMessage = {
                        action: 'chat_message',
                        sessionId: parsed.sessionId || 'test-session',
                        message: 'Hello from Flutter app! This is a test message.',
                        timestamp: new Date().toISOString()
                    };
                    
                    console.log('📤 Step 3 - Sending chat_message:', JSON.stringify(testMessage, null, 2));
                    ws.send(JSON.stringify(testMessage));
                    
                    // Close after brief delay
                    setTimeout(() => {
                        console.log('✅ Test sequence completed!');
                        ws.close();
                        resolve();
                    }, 3000);
                    
                } else if (parsed.action === 'error') {
                    console.error('❌ Server error:', parsed.message);
                    ws.close();
                    reject(new Error(parsed.message));
                }
                
            } catch (error) {
                console.warn('⚠️ Failed to parse message:', error);
            }
        });
        
        ws.on('error', function error(err) {
            console.error('❌ WebSocket error:', err);
            clearTimeout(connectionTimeout);
            reject(err);
        });
        
        ws.on('close', function close(code, reason) {
            console.log(`🔌 WebSocket closed - Code: ${code}, Reason: ${reason || 'none'}`);
            clearTimeout(connectionTimeout);
            if (code === 1000) {
                resolve();
            } else {
                reject(new Error(`WebSocket closed with code: ${code}`));
            }
        });
    });
}

async function main() {
    try {
        await testEnhancedHandler();
        console.log('🎉 Enhanced WebSocket handler test completed successfully!');
    } catch (error) {
        console.error('💥 Enhanced WebSocket handler test failed:', error.message);
        process.exit(1);
    }
}

main();
