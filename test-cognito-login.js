const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({ region: 'us-east-1' });

const cognito = new AWS.CognitoIdentityServiceProvider();

const userPoolId = 'us-east-1_Cp9YnOQWi';
const clientId = '5hun8p61grnakisu5gammcjelv';
const username = 'g87_a@yahoo.com';
const password = 'Gha@551987';

async function testLogin() {
    console.log('🔐 Testing Cognito login...');
    console.log('User Pool:', userPoolId);
    console.log('Client ID:', clientId);
    console.log('Username:', username);
    console.log('');

    try {
        // First, let's check if the user exists and their status
        console.log('1️⃣ Checking user status...');
        const userDetails = await cognito.adminGetUser({
            UserPoolId: userPoolId,
            Username: username
        }).promise();

        console.log('✅ User found:');
        console.log('   Status:', userDetails.UserStatus);
        console.log('   Enabled:', userDetails.Enabled);
        console.log('   Attributes:', userDetails.UserAttributes);
        console.log('');

        // Try to initiate auth
        console.log('2️⃣ Attempting to initiate authentication...');
        const authResult = await cognito.adminInitiateAuth({
            UserPoolId: userPoolId,
            ClientId: clientId,
            AuthFlow: 'ADMIN_NO_SRP_AUTH',
            AuthParameters: {
                USERNAME: username,
                PASSWORD: password
            }
        }).promise();

        console.log('✅ Authentication successful!');
        console.log('   Access Token:', authResult.AuthenticationResult.AccessToken.substring(0, 50) + '...');
        console.log('   ID Token:', authResult.AuthenticationResult.IdToken.substring(0, 50) + '...');
        console.log('');
        console.log('🎉 Login test PASSED - credentials are valid!');

    } catch (error) {
        console.error('❌ Login test FAILED');
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('');
        
        if (error.code === 'NotAuthorizedException') {
            console.log('🔍 This usually means:');
            console.log('   - Incorrect password');
            console.log('   - User needs to change password');
            console.log('   - Account is disabled');
        } else if (error.code === 'UserNotFoundException') {
            console.log('🔍 User does not exist in the user pool');
        } else if (error.code === 'UserNotConfirmedException') {
            console.log('🔍 User email has not been confirmed');
        }
        
        console.error('Full error:', error);
    }
}

testLogin();
