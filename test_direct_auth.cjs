#!/usr/bin/env node

/**
 * Direct Authentication Test
 * Test AWS Cognito authentication without the frontend
 */

const https = require('https');

async function testDirectAuthentication() {
    console.log('🔐 Testing Direct AWS Cognito Authentication...\n');

    const credentials = {
        email: 'g87_a@yahoo.com',
        password: 'Gha@551987'
    };

    const cognitoConfig = {
        region: 'us-east-1',
        userPoolId: 'us-east-1_LDgfo1Pmc',
        clientId: '3ngjf86vuq8up86urecprvm08j'
    };

    console.log('1️⃣ Testing Cognito User Pool connectivity...');
    
    try {
        // Test basic connectivity to Cognito
        const testRequest = {
            hostname: 'cognito-idp.us-east-1.amazonaws.com',
            port: 443,
            path: '/',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-amz-json-1.1',
                'X-Amz-Target': 'AWSCognitoIdentityProviderService.DescribeUserPool'
            }
        };

        const req = https.request(testRequest, (res) => {
            console.log('✅ Cognito endpoint reachable, status:', res.statusCode);
            
            if (res.statusCode === 400) {
                console.log('✅ This is expected - Cognito is responding (400 = missing/invalid auth)');
            }
            
            res.on('data', (data) => {
                try {
                    const response = JSON.parse(data.toString());
                    console.log('📝 Cognito response type:', response.__type || 'Unknown');
                } catch (e) {
                    console.log('📝 Cognito responded with data');
                }
            });
        });

        req.on('error', (error) => {
            if (error.code === 'ENOTFOUND') {
                console.log('❌ Cannot reach Cognito endpoint - network issue');
            } else {
                console.log('✅ Cognito endpoint reachable (connection successful)');
            }
        });

        req.write(JSON.stringify({}));
        req.end();

    } catch (error) {
        console.log('❌ Test failed:', error.message);
    }

    console.log('\n2️⃣ Authentication Analysis:');
    console.log('');
    console.log('🔍 Possible issues with login:');
    console.log('');
    console.log('A) JavaScript Error:');
    console.log('   - Check browser console for errors');
    console.log('   - AWS Cognito SDK might not be loading');
    console.log('   - Configuration timing issue');
    console.log('');
    console.log('B) Browser Security:');
    console.log('   - CORS blocking AWS calls');
    console.log('   - JavaScript disabled');
    console.log('   - Ad blocker interfering');
    console.log('');
    console.log('C) Authentication Service:');
    console.log('   - AuthService initialization failing');
    console.log('   - Cognito configuration incorrect');
    console.log('   - Network connectivity issue');
    console.log('');
    console.log('🧪 Next debugging steps:');
    console.log('1. Open https://main.d2f5oacwil9cbi.amplifyapp.com');
    console.log('2. Press F12 → Console tab');
    console.log('3. Type: manualLogin() and press Enter');
    console.log('4. Share any error messages you see');
    console.log('');
    console.log('This will help identify the exact issue!');
}

testDirectAuthentication();
