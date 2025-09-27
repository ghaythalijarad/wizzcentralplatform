#!/usr/bin/env node

// Test script to send a chat message through the local chat bridge
const axios = require('axios');

const CHAT_BRIDGE_URL = 'http://localhost:8087';

async function sendTestMessage() {
    try {
        console.log('🧪 Testing chat message through local bridge...');
        
        const testMessage = {
            driverName: 'Test Driver (End-to-End)',
            driverPhone: '+964-test-driver',
            messageText: 'Hello, this is a test message from the WhizzDriver app!',
            timestamp: new Date().toISOString(),
            sessionId: `test_session_${Date.now()}`,
            source: 'wizzdriver_app',
            userType: 'driver'
        };

        const response = await axios.post(`${CHAT_BRIDGE_URL}/chat/send`, testMessage, {
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('✅ Test message sent successfully!');
        console.log('📤 Response:', response.data);
        
        // Check status
        const statusResponse = await axios.get(`${CHAT_BRIDGE_URL}/chat/status`);
        console.log('📊 Chat Bridge Status:', statusResponse.data);

    } catch (error) {
        console.error('❌ Error sending test message:', error.message);
        if (error.response) {
            console.error('📝 Response data:', error.response.data);
        }
    }
}

// Run the test
sendTestMessage();
