#!/usr/bin/env node
// Test script to verify Cognito login functionality
import { CognitoIdentityProviderClient, InitiateAuthCommand } from '@aws-sdk/client-cognito-identity-provider';
import crypto from 'crypto';

const region = 'us-east-1';
const userPoolId = 'us-east-1_aX8X9oQTV';
const clientId = '3u9frkvcn18lidj5dpm1a94mf2';
const username = 'g87_a@yahoo.com';
const password = 'Gha@551987';

const client = new CognitoIdentityProviderClient({ region });

// Create secret hash (if client has secret)
function createSecretHash(username, clientId, clientSecret) {
  if (!clientSecret) return undefined;
  const message = username + clientId;
  return crypto.createHmac('sha256', clientSecret).update(message).digest('base64');
}

async function testCognitoLogin() {
  console.log('🧪 Testing Cognito Login');
  console.log('========================');
  console.log(`Region: ${region}`);
  console.log(`User Pool: ${userPoolId}`);
  console.log(`Client ID: ${clientId}`);
  console.log(`Username: ${username}`);
  console.log('');

  try {
    // Test 1: USER_SRP_AUTH (what Amplify uses)
    console.log('1. Testing USER_SRP_AUTH flow...');
    const srpCommand = new InitiateAuthCommand({
      AuthFlow: 'USER_SRP_AUTH',
      ClientId: clientId,
      AuthParameters: {
        USERNAME: username,
        SRP_A: 'test' // This will fail but show us if flow is enabled
      }
    });

    try {
      await client.send(srpCommand);
    } catch (error) {
      if (error.name === 'NotAuthorizedException' && error.message.includes('SRP_A')) {
        console.log('   ✅ USER_SRP_AUTH flow is enabled (expected SRP_A error)');
      } else if (error.name === 'NotAuthorizedException' && error.message.includes('not enabled')) {
        console.log('   ❌ USER_SRP_AUTH flow is not enabled');
      } else {
        console.log(`   ⚠️  Unexpected error: ${error.message}`);
      }
    }

    // Test 2: Check if ADMIN_NO_SRP_AUTH is enabled
    console.log('2. Testing ADMIN_NO_SRP_AUTH flow...');
    const adminCommand = new InitiateAuthCommand({
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      ClientId: clientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password
      }
    });

    try {
      const result = await client.send(adminCommand);
      console.log('   ✅ ADMIN_NO_SRP_AUTH login successful!');
      console.log('   Access Token received:', result.AuthenticationResult?.AccessToken ? 'Yes' : 'No');
    } catch (error) {
      if (error.name === 'NotAuthorizedException' && error.message.includes('not enabled')) {
        console.log('   ❌ ADMIN_NO_SRP_AUTH flow is not enabled');
      } else {
        console.log(`   ❌ ADMIN_NO_SRP_AUTH failed: ${error.message}`);
      }
    }

    // Test 3: Check user status
    console.log('3. Checking user status...');
    try {
      const { AdminGetUserCommand } = await import('@aws-sdk/client-cognito-identity-provider');
      const getUserCommand = new AdminGetUserCommand({
        UserPoolId: userPoolId,
        Username: username
      });
      
      const userResult = await client.send(getUserCommand);
      console.log('   ✅ User found');
      console.log(`   User Status: ${userResult.UserStatus}`);
      console.log(`   Enabled: ${userResult.Enabled}`);
      
      const emailVerified = userResult.UserAttributes?.find(attr => attr.Name === 'email_verified');
      console.log(`   Email Verified: ${emailVerified?.Value || 'Not set'}`);
      
    } catch (error) {
      console.log(`   ❌ Failed to get user: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testCognitoLogin();
