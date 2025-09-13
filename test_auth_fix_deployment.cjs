#!/usr/bin/env node

/**
 * Test Authentication Fix After Deployment
 * This script waits for deployment and tests if the authentication issue is resolved
 */

const https = require('https');

async function testAuthenticationAfterDeployment() {
    console.log('🚀 Testing Authentication Fix After Deployment...\n');
    
    try {
        console.log('⏳ Waiting for deployment to complete...');
        
        // Wait a bit for deployment
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 seconds
        
        console.log('🧪 Testing the updated platform...');
        
        const response = await fetch('https://main.d2f5oacwil9cbi.amplifyapp.com');
        const html = await response.text();
        
        if (response.ok) {
            console.log('✅ Platform is accessible after update');
            
            // Check if the retry mechanism is in place
            if (html.includes('retry') && html.includes('checkConfiguration')) {
                console.log('✅ Configuration retry mechanism is deployed');
            } else {
                console.log('⚠️ Configuration retry mechanism not found in deployed version');
            }
            
            // Check if the old "Configuration Not Ready" blocking code is removed
            if (html.includes('Configuration Not Ready') && html.includes('Please refresh the page')) {
                console.log('⚠️ Old blocking "Configuration Not Ready" code still present');
            } else {
                console.log('✅ Old blocking configuration code has been removed');
            }
            
            // Check if waitForConfig function is present
            if (html.includes('waitForConfig')) {
                console.log('✅ New waitForConfig mechanism is deployed');
            } else {
                console.log('⚠️ New waitForConfig mechanism not found');
            }
            
        } else {
            console.log('❌ Platform is not accessible:', response.status);
        }
        
        console.log('\n📋 Next Steps:');
        console.log('1. Open the Central Platform: https://main.d2f5oacwil9cbi.amplifyapp.com');
        console.log('2. Login with: g87_a@yahoo.com / Gha@551987');
        console.log('3. Navigate to Support Center → Live Chat tab');
        console.log('4. This will establish the agent WebSocket connection');
        console.log('5. Test Flutter app messages - they should now appear in live chat');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Helper function for Node.js fetch
async function fetch(url) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const req = https.request({
            hostname: parsedUrl.hostname,
            port: 443,
            path: parsedUrl.pathname,
            method: 'GET'
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    text: () => Promise.resolve(data)
                });
            });
        });
        
        req.on('error', reject);
        req.end();
    });
}

testAuthenticationAfterDeployment();
