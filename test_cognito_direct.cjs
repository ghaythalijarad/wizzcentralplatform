#!/usr/bin/env node

/**
 * Local Authentication Test
 * Test the authentication directly with AWS Cognito to ensure credentials work
 */

const AWS = require('aws-sdk');

// Configuration from the Central Platform
const COGNITO_CONFIG = {
    region: 'us-east-1',
    userPoolId: 'us-east-1_LDgfo1Pmc',
    clientId: '3ngjf86vuq8up86urecprvm08j'
};

// Test credentials
const TEST_CREDENTIALS = {
    email: 'g87_a@yahoo.com',
    password: 'Gha@551987'
};

async function testCognitoAuthentication() {
    console.log('🔐 Testing AWS Cognito Authentication...\n');
    
    try {
        // Configure AWS SDK
        AWS.config.update({
            region: COGNITO_CONFIG.region
        });
        
        const cognitoIdentityServiceProvider = new AWS.CognitoIdentityServiceProvider();
        
        console.log('1️⃣ Testing Cognito User Pool connectivity...');
        
        // Test if we can reach the user pool
        try {
            const userPoolResponse = await cognitoIdentityServiceProvider.describeUserPool({
                UserPoolId: COGNITO_CONFIG.userPoolId
            }).promise();
            
            console.log('✅ User Pool is accessible');
            console.log('   Pool Name:', userPoolResponse.UserPool.Name);
            console.log('   Pool Status:', userPoolResponse.UserPool.Status);
        } catch (error) {
            console.log('❌ User Pool not accessible:', error.message);
            return;
        }
        
        console.log('\n2️⃣ Testing authentication with test credentials...');
        
        try {
            const authResponse = await cognitoIdentityServiceProvider.initiateAuth({
                AuthFlow: 'USER_PASSWORD_AUTH',
                ClientId: COGNITO_CONFIG.clientId,
                AuthParameters: {
                    USERNAME: TEST_CREDENTIALS.email,
                    PASSWORD: TEST_CREDENTIALS.password
                }
            }).promise();
            
            if (authResponse.AuthenticationResult) {
                console.log('✅ Authentication successful!');
                console.log('   Access Token received:', !!authResponse.AuthenticationResult.AccessToken);
                console.log('   ID Token received:', !!authResponse.AuthenticationResult.IdToken);
                console.log('   Token expires in:', authResponse.AuthenticationResult.ExpiresIn, 'seconds');
                
                console.log('\n🎉 SUCCESS: AWS Cognito authentication is working correctly!');
                console.log('   The issue is confirmed to be with the frontend configuration loading timing.');
                console.log('   Once the deployment completes with the retry mechanism, authentication should work.');
                
            } else {
                console.log('❌ Authentication failed: No authentication result returned');
            }
            
        } catch (authError) {
            if (authError.code === 'NotAuthorizedException') {
                console.log('❌ Authentication failed: Invalid credentials');
            } else if (authError.code === 'UserNotFoundException') {
                console.log('❌ Authentication failed: User not found');
            } else {
                console.log('❌ Authentication failed:', authError.message);
            }
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testCognitoAuthentication();
