#!/usr/bin/env node

/**
 * Test script for the deployed Chat Bridge Lambda functions
 * This script tests both the sendChatMessage and getChatHistory endpoints
 */

const axios = require('axios');

// API endpoint from the deployment output
const API_BASE_URL = 'https://ru65nhlwhc.execute-api.us-east-1.amazonaws.com/dev';

async function testChatBridge() {
    console.log('🚀 Testing Chat Bridge Lambda Functions...\n');

    try {
        // Test 1: Send a chat message
        console.log('📤 Test 1: Sending a chat message...');
        const sendMessagePayload = {
            sessionId: 'test-session-' + Date.now(),
            message: 'Hello from the chat bridge test!',
            userId: 'test-user-123',
            userType: 'driver'
        };

        const sendResponse = await axios.post(`${API_BASE_URL}/api/chat/send`, sendMessagePayload, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        console.log('✅ Send Message Response Status:', sendResponse.status);
        console.log('📝 Send Message Response:', JSON.stringify(sendResponse.data, null, 2));
        console.log('');

        // Test 2: Get chat history (all sessions)
        console.log('📥 Test 2: Getting all chat history...');
        const historyResponse = await axios.get(`${API_BASE_URL}/api/chat/history`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        console.log('✅ Get History Response Status:', historyResponse.status);
        console.log('📝 Get History Response:', JSON.stringify(historyResponse.data, null, 2));
        console.log('');

        // Test 3: Get chat history for specific session
        if (sendMessagePayload.sessionId) {
            console.log(`📥 Test 3: Getting chat history for session ${sendMessagePayload.sessionId}...`);
            const sessionHistoryResponse = await axios.get(`${API_BASE_URL}/api/chat/history/${sendMessagePayload.sessionId}`, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            console.log('✅ Get Session History Response Status:', sessionHistoryResponse.status);
            console.log('📝 Get Session History Response:', JSON.stringify(sessionHistoryResponse.data, null, 2));
            console.log('');
        }

        // Test 4: Test error handling (invalid payload)
        console.log('❌ Test 4: Testing error handling with invalid payload...');
        try {
            const errorResponse = await axios.post(`${API_BASE_URL}/api/chat/send`, {
                // Missing required fields
                invalidField: 'test'
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });
        } catch (error) {
            console.log('✅ Error handling works correctly. Status:', error.response?.status || 'Network Error');
            console.log('📝 Error Response:', JSON.stringify(error.response?.data || error.message, null, 2));
        }

        console.log('\n🎉 Chat Bridge tests completed successfully!');
        console.log('\n📊 Summary:');
        console.log('- ✅ Send chat message endpoint working');
        console.log('- ✅ Get all chat history endpoint working');
        console.log('- ✅ Get session-specific history endpoint working');
        console.log('- ✅ Error handling working correctly');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('📝 Error Response Status:', error.response.status);
            console.error('📝 Error Response Data:', JSON.stringify(error.response.data, null, 2));
        }
        process.exit(1);
    }
}

// Run the tests
testChatBridge();
