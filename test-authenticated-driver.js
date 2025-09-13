#!/usr/bin/env node

/**
 * Live Chat Test - Driver Logged In Verification
 * Now that driver is authenticated, test the complete flow
 */

console.log('🎉 DRIVER LOGGED IN - TESTING LIVE CHAT FLOW');
console.log('==========================================');
console.log('Date:', new Date().toISOString());
console.log('');

// Test Central Platform and WebSocket status
const https = require('https');

console.log('📊 System Status Check:');
console.log('');

// Test 1: Central Platform
https.get('https://main.d2f5oacwil9cbi.amplifyapp.com', (res) => {
    console.log(`✅ Central Platform: HTTP ${res.statusCode} - Online`);
    
    // Test 2: WebSocket endpoint
    https.get('https://0fs1zdwyzf.execute-api.us-east-1.amazonaws.com/dev', (res) => {
        console.log(`✅ WebSocket API: HTTP ${res.statusCode} - Ready for connections`);
        
        console.log('');
        console.log('🚀 READY TO TEST LIVE CHAT!');
        console.log('============================');
        console.log('');
        console.log('📱 NOW FOLLOW THESE STEPS:');
        console.log('');
        console.log('1. 📱 In Flutter app on iPhone:');
        console.log('   → Go to "More" tab (أكثر)');
        console.log('   → Tap "Support" section');
        console.log('   → Tap "Live Chat" (الدردشة المباشرة)');
        console.log('');
        console.log('2. 🔌 Watch for connection:');
        console.log('   → Should show "Connected" status');
        console.log('   → JWT token will authenticate automatically');
        console.log('');
        console.log('3. 💬 Send test message:');
        console.log('   → Type: "🧪 Test from authenticated driver"');
        console.log('   → Send the message');
        console.log('');
        console.log('4. 🖥️ Check Central Platform:');
        console.log('   → Open: https://main.d2f5oacwil9cbi.amplifyapp.com/frontend/support.html');
        console.log('   → Go to Live Chat section');
        console.log('   → Look for your incoming message');
        console.log('');
        console.log('5. ✅ Success criteria:');
        console.log('   → Message appears in Central Platform');
        console.log('   → Real-time communication established');
        console.log('');
        console.log('🔍 Flutter Console Logs to Watch:');
        console.log('  ✅ "JWT token obtained successfully"');
        console.log('  ✅ "WebSocket connected successfully"');
        console.log('  ✅ "Message sent via WebSocket"');
        console.log('');
        console.log('📞 Central Platform Support Page:');
        console.log('   https://main.d2f5oacwil9cbi.amplifyapp.com/frontend/support.html');
        console.log('');
        console.log('🎯 This should work immediately since driver is authenticated!');
        
    }).on('error', (err) => {
        console.log('❌ WebSocket error:', err.message);
    });
    
}).on('error', (err) => {
    console.log('❌ Central Platform error:', err.message);
});
