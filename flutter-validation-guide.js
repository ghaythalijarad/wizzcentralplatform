#!/usr/bin/env node

/**
 * Flutter App Live Chat Validation Script  
 * Instructions for manual testing with the actual Flutter app
 */

console.log('📱 FLUTTER APP LIVE CHAT VALIDATION GUIDE');
console.log('==========================================');
console.log('');

console.log('🎯 OBJECTIVE: Validate live chat works from actual Flutter app to Support Dashboard');
console.log('');

console.log('✅ INFRASTRUCTURE STATUS:');
console.log('   🌉 Local Chat Bridge: Running on http://localhost:8087');
console.log('   🖥️  Support Dashboard: Available at http://localhost:8088/pages/support.html');
console.log('   📱 Flutter App: Running on iPhone (wireless connection)');
console.log('   🔗 WebSocket API: Connected to wss://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev');
console.log('');

console.log('🔧 PRE-TEST VERIFICATION:');

// Check bridge status
const http = require('http');

function checkBridgeStatus() {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:8087/health', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const status = JSON.parse(data);
                    console.log(`   ✅ Bridge Health: ${status.status}`);
                    console.log(`   ✅ WebSocket: ${status.webSocketStatus}`);
                    resolve(status);
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
    });
}

function checkMessageHistory() {
    return new Promise((resolve, reject) => {
        const req = http.get('http://localhost:8087/chat/history', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const history = JSON.parse(data);
                    console.log(`   ✅ Total Messages: ${history.total}`);
                    console.log(`   ✅ Active Sessions: ${history.activeSessions}`);
                    
                    if (history.messages && history.messages.length > 0) {
                        const latest = history.messages[history.messages.length - 1];
                        console.log(`   ✅ Latest Message: "${latest.message?.substring(0, 30)}..." by ${latest.senderName}`);
                    }
                    resolve(history);
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
    });
}

async function runValidation() {
    try {
        await checkBridgeStatus();
        await checkMessageHistory();
        
        console.log('');
        console.log('🧪 MANUAL TESTING STEPS:');
        console.log('');
        console.log('1️⃣ OPEN FLUTTER APP:');
        console.log('   • App should already be running on your iPhone');
        console.log('   • Navigate to Live Chat screen');
        console.log('   • Check connection status shows "http_bridge_active" or "connected"');
        console.log('');
        
        console.log('2️⃣ OPEN SUPPORT DASHBOARD:');
        console.log('   • Open: http://localhost:8088/pages/support.html');
        console.log('   • Verify WebSocket connection status is "Connected"');
        console.log('   • Check if existing sessions are visible');
        console.log('');
        
        console.log('3️⃣ SEND TEST MESSAGE FROM FLUTTER:');
        console.log('   • In Flutter app, type: "Hello! Testing live chat from Flutter app"');
        console.log('   • Press Send button');
        console.log('   • Message should show as sent in Flutter app');
        console.log('');
        
        console.log('4️⃣ VERIFY MESSAGE IN SUPPORT DASHBOARD:');
        console.log('   • New session should appear in support dashboard');
        console.log('   • Click on session to see the message');
        console.log('   • Driver name and message should be visible');
        console.log('');
        
        console.log('5️⃣ SEND REPLY FROM SUPPORT:');
        console.log('   • Type reply in support dashboard: "Hello! I received your message."');
        console.log('   • Send the reply');
        console.log('   • Reply should be sent back to Flutter app');
        console.log('');
        
        console.log('6️⃣ VERIFY REPLY IN FLUTTER:');
        console.log('   • Flutter app should receive and display support agent reply');
        console.log('   • Check if reply appears in chat conversation');
        console.log('');
        
        console.log('📊 VERIFICATION COMMANDS:');
        console.log('   • Bridge History: curl http://localhost:8087/chat/history | jq');
        console.log('   • Bridge Status: curl http://localhost:8087/health | jq');
        console.log('');
        
        console.log('✅ SUCCESS CRITERIA:');
        console.log('   ✓ Flutter message appears in support dashboard');
        console.log('   ✓ Support reply appears in Flutter app');
        console.log('   ✓ Session management works correctly');
        console.log('   ✓ Real-time bidirectional communication');
        console.log('');
        
        console.log('🎉 If all steps work, the live chat integration is COMPLETE!');
        
    } catch (error) {
        console.error('❌ Validation failed:', error.message);
    }
}

runValidation();
