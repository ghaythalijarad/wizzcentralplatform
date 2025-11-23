#!/usr/bin/env node

/**
 * Direct Backend Test for Merchant Push Notifications
 * Tests the notification sending without needing frontend
 */

const http = require('http');

console.log('📱 Direct Backend Push Notification Test');
console.log('=========================================\n');

// Test notification payload
const notificationData = {
    notificationType: 'info',
    notificationTitle: 'Direct Backend Test',
    notificationBody: 'This is a test notification sent directly from the backend test script. If you receive this on your iPhone, the system is working!',
    targetAudience: 'all',
    priority: 'normal'
};

console.log('📤 Sending notification with payload:');
console.log(JSON.stringify(notificationData, null, 2));
console.log('');

// Prepare request
const postData = JSON.stringify(notificationData);

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/merchants/send-info-notification',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
    }
};

// Send request
const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`📡 Response Status: ${res.statusCode}\n`);
        
        try {
            const response = JSON.parse(data);
            
            if (response.success) {
                console.log('✅ SUCCESS! Notification sent!\n');
                console.log('📊 Statistics:');
                console.log(`   • Targeted: ${response.targeted || 0} merchants`);
                console.log(`   • Sent: ${response.sent || 0}`);
                console.log(`   • Failed: ${response.failed || 0}`);
                console.log(`   • Notification ID: ${response.notificationId || 'N/A'}`);
                console.log('');
                console.log('📱 CHECK YOUR IPHONE NOW! 🔔');
                console.log('   You should receive a notification within 3 seconds.');
            } else {
                console.log('❌ FAILED to send notification\n');
                console.log(`Error: ${response.message || 'Unknown error'}`);
                console.log('');
                console.log('🔍 Troubleshooting:');
                console.log('   1. Check if WizzCentral server is running');
                console.log('   2. Verify AWS credentials: aws sso login --profile wizz-drivers-ghayth-dev');
                console.log('   3. Check FCM_SERVER_KEY in environment variables');
                console.log('   4. Verify merchants exist in WhizzMerchants_Businesses table');
            }
        } catch (error) {
            console.log('❌ Error parsing response:', error.message);
            console.log('Raw response:', data);
        }
    });
});

req.on('error', (error) => {
    console.log('❌ Request failed:', error.message);
    console.log('');
    console.log('🔍 Possible issues:');
    console.log('   • WizzCentral server not running on http://localhost:3000');
    console.log('   • Network connection issue');
    console.log('   • Firewall blocking localhost connections');
});

// Send the request
req.write(postData);
req.end();

// Timeout after 30 seconds
setTimeout(() => {
    console.log('\n⏱️  Request timeout after 30 seconds');
    process.exit(1);
}, 30000);
