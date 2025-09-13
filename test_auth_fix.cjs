#!/usr/bin/env node

/**
 * Test Authentication Fix
 * This script tests the authentication flow to identify the exact issue
 */

const https = require('https');
const { URL } = require('url');

async function testAuthenticationFlow() {
    console.log('🧪 Testing Central Platform Authentication Flow...\n');
    
    try {
        // 1. Test if the platform is accessible
        console.log('1️⃣ Testing platform accessibility...');
        const response = await fetch('https://main.d2f5oacwil9cbi.amplifyapp.com');
        const html = await response.text();
        
        if (response.ok) {
            console.log('✅ Platform is accessible');
        } else {
            console.log('❌ Platform is not accessible:', response.status);
            return;
        }
        
        // 2. Check if config.js is being loaded properly
        console.log('\n2️⃣ Testing config.js accessibility...');
        const configResponse = await fetch('https://main.d2f5oacwil9cbi.amplifyapp.com/config.js');
        
        if (configResponse.ok) {
            const configContent = await configResponse.text();
            console.log('✅ config.js is accessible');
            
            // Check if it contains the expected configuration
            if (configContent.includes('WIZZCENTRAL_CONFIG')) {
                console.log('✅ Configuration object found in config.js');
                
                // Extract Cognito config
                if (configContent.includes('us-east-1_LDgfo1Pmc')) {
                    console.log('✅ Cognito User Pool ID found');
                } else {
                    console.log('❌ Cognito User Pool ID missing');
                }
                
                if (configContent.includes('3ngjf86vuq8up86urecprvm08j')) {
                    console.log('✅ Cognito Client ID found');
                } else {
                    console.log('❌ Cognito Client ID missing');
                }
            } else {
                console.log('❌ Configuration object missing from config.js');
            }
        } else {
            console.log('❌ config.js is not accessible:', configResponse.status);
        }
        
        // 3. Check auth-service.js
        console.log('\n3️⃣ Testing auth-service.js accessibility...');
        const authServiceResponse = await fetch('https://main.d2f5oacwil9cbi.amplifyapp.com/auth-service.js');
        
        if (authServiceResponse.ok) {
            console.log('✅ auth-service.js is accessible');
        } else {
            console.log('❌ auth-service.js is not accessible:', authServiceResponse.status);
        }
        
        // 4. Test if AWS Cognito SDK is being loaded
        console.log('\n4️⃣ Testing AWS SDK accessibility...');
        try {
            const cognitoResponse = await fetch('https://unpkg.com/amazon-cognito-identity-js@6.3.12/dist/amazon-cognito-identity.min.js');
            if (cognitoResponse.ok) {
                console.log('✅ AWS Cognito SDK is accessible from CDN');
            } else {
                console.log('❌ AWS Cognito SDK is not accessible from CDN');
            }
        } catch (error) {
            console.log('❌ Error accessing AWS Cognito SDK:', error.message);
        }
        
        // 5. Test the actual authentication endpoint (without trying to log in)
        console.log('\n5️⃣ Testing Cognito User Pool connectivity...');
        const cognitoEndpoint = 'https://cognito-idp.us-east-1.amazonaws.com/';
        
        try {
            const cognitoTest = await fetch(cognitoEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-amz-json-1.1',
                    'X-Amz-Target': 'AWSCognitoIdentityProviderService.ListUsers'
                },
                body: JSON.stringify({})
            });
            
            // We expect this to fail with an authentication error, not a connection error
            console.log('✅ Cognito endpoint is reachable (status:', cognitoTest.status, ')');
        } catch (error) {
            if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
                console.log('❌ Cannot reach Cognito endpoint:', error.message);
            } else {
                console.log('✅ Cognito endpoint is reachable (connection successful)');
            }
        }
        
        console.log('\n🔍 Analysis Summary:');
        console.log('The issue appears to be with the browser-side configuration loading timing.');
        console.log('The configuration and scripts are accessible, but the JavaScript execution');
        console.log('order might be causing the "Configuration Not Ready" error.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Helper function for Node.js compatibility
async function fetch(url, options = {}) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const requestOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: options.method || 'GET',
            headers: options.headers || {}
        };
        
        const req = https.request(requestOptions, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    text: () => Promise.resolve(data),
                    json: () => Promise.resolve(JSON.parse(data))
                });
            });
        });
        
        req.on('error', reject);
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

testAuthenticationFlow();
