#!/usr/bin/env node

/**
 * Simple WebSocket Test for Flutter App Authentication Issue
 */

const WebSocket = require('ws');
const WEBSOCKET_URL = 'wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev';

console.log('🔍 Simple WebSocket Authentication Test');
console.log('=====================================');

// Test 1: Connection without auth (should get 401)
console.log('Testing connection without authentication...');

const ws = new WebSocket(WEBSOCKET_URL);

ws.on('open', () => {
    console.log('❌ UNEXPECTED: Connection opened without auth!');
    ws.close();
    process.exit(1);
});

ws.on('error', (error) => {
    console.log('✅ Expected authentication error:', error.message);
    if (error.message.includes('401')) {
        console.log('✅ WebSocket correctly requires authentication');
        console.log('');
        console.log('🎯 SOLUTION:');
        console.log('The Flutter app needs to:');
        console.log('1. Login with valid Cognito credentials');
        console.log('2. Get JWT token from Amplify.Auth.fetchAuthSession()');
        console.log('3. Pass token in Authorization header to WebSocket');
        console.log('');
        console.log('Check Flutter app authentication status!');
    }
    process.exit(0);
});

ws.on('close', (code, reason) => {
    console.log(`Connection closed: ${code} - ${reason}`);
    process.exit(0);
});

// Safety timeout
setTimeout(() => {
    console.log('Test timeout - closing connection');
    ws.close();
    process.exit(0);
}, 5000);
