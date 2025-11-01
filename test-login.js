#!/usr/bin/env node
/**
 * Test Login Script for WizzCentral Platform
 * Tests authentication with provided credentials
 */

const { CognitoIdentityProviderClient, InitiateAuthCommand, GetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const crypto = require('crypto');

// Configuration
const COGNITO_CONFIG = {
    region: 'us-east-1',
    userPoolId: 'us-east-1_Cp9YnOQWi', // wizzcentral user pool
    clientId: '97sgkf07b6n8qeugfcsntbd8c', // My web app - jj3fiz
    clientSecret: null // Will be retrieved from environment or AWS
};

// Test credentials
const TEST_EMAIL = 'g87_a@yahoo.com';
const TEST_PASSWORD = 'Gha@551987';

// Initialize Cognito client
const cognitoClient = new CognitoIdentityProviderClient({ 
    region: COGNITO_CONFIG.region 
});

/**
 * Calculate SECRET_HASH for Cognito authentication
 * Required when app client has a client secret
 */
function calculateSecretHash(username, clientId, clientSecret) {
    const message = username + clientId;
    const hmac = crypto.createHmac('sha256', clientSecret);
    hmac.update(message);
    return hmac.digest('base64');
}

/**
 * Retrieve the client secret from AWS
 */
async function getClientSecret() {
    try {
        const { CognitoIdentityProviderClient, DescribeUserPoolClientCommand } = require('@aws-sdk/client-cognito-identity-provider');
        const client = new CognitoIdentityProviderClient({ region: COGNITO_CONFIG.region });
        
        const command = new DescribeUserPoolClientCommand({
            UserPoolId: COGNITO_CONFIG.userPoolId,
            ClientId: COGNITO_CONFIG.clientId
        });
        
        const response = await client.send(command);
        return response.UserPoolClient.ClientSecret;
    } catch (error) {
        console.log('⚠️  Could not retrieve client secret automatically:', error.message);
        console.log('💡 You may need to provide the client secret manually or use AWS CLI.\n');
        return null;
    }
}

async function testLogin() {
    console.log('🔐 Testing WizzCentral Platform Login');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email: ${TEST_EMAIL}`);
    console.log(`🔑 Password: ${'*'.repeat(TEST_PASSWORD.length)}`);
    console.log(`🌍 Region: ${COGNITO_CONFIG.region}`);
    console.log(`👥 User Pool: ${COGNITO_CONFIG.userPoolId}`);
    console.log(`📱 Client ID: ${COGNITO_CONFIG.clientId}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    try {
        // Retrieve client secret if not already set
        if (!COGNITO_CONFIG.clientSecret) {
            console.log('🔑 Retrieving client secret...');
            COGNITO_CONFIG.clientSecret = await getClientSecret();
            if (!COGNITO_CONFIG.clientSecret) {
                throw new Error('Client secret is required but could not be retrieved');
            }
            console.log('✅ Client secret retrieved\n');
        }

        console.log('🔄 Attempting authentication...\n');

        // Calculate SECRET_HASH
        const secretHash = calculateSecretHash(TEST_EMAIL, COGNITO_CONFIG.clientId, COGNITO_CONFIG.clientSecret);

        // Initiate authentication
        const authCommand = new InitiateAuthCommand({
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: COGNITO_CONFIG.clientId,
            AuthParameters: {
                USERNAME: TEST_EMAIL,
                PASSWORD: TEST_PASSWORD,
                SECRET_HASH: secretHash
            }
        });

        const authResponse = await cognitoClient.send(authCommand);

        if (authResponse.AuthenticationResult) {
            console.log('✅ Login Successful!\n');
            console.log('📦 Authentication Result:');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            
            const { AccessToken, IdToken, RefreshToken, ExpiresIn } = authResponse.AuthenticationResult;
            
            console.log(`🎫 Access Token: ${AccessToken.substring(0, 50)}...`);
            console.log(`🆔 ID Token: ${IdToken.substring(0, 50)}...`);
            console.log(`🔄 Refresh Token: ${RefreshToken ? RefreshToken.substring(0, 50) + '...' : 'N/A'}`);
            console.log(`⏰ Expires In: ${ExpiresIn} seconds (${Math.floor(ExpiresIn / 60)} minutes)`);
            console.log('');

            // Decode and display ID token payload
            try {
                const idTokenPayload = JSON.parse(Buffer.from(IdToken.split('.')[1], 'base64').toString());
                console.log('👤 User Information:');
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(`   Email: ${idTokenPayload.email || 'N/A'}`);
                console.log(`   Email Verified: ${idTokenPayload.email_verified || false}`);
                console.log(`   Sub (User ID): ${idTokenPayload.sub || 'N/A'}`);
                console.log(`   Username: ${idTokenPayload['cognito:username'] || 'N/A'}`);
                console.log(`   Groups: ${idTokenPayload['cognito:groups'] ? idTokenPayload['cognito:groups'].join(', ') : 'None'}`);
                console.log(`   Token Use: ${idTokenPayload.token_use || 'N/A'}`);
                console.log(`   Auth Time: ${idTokenPayload.auth_time ? new Date(idTokenPayload.auth_time * 1000).toLocaleString() : 'N/A'}`);
                console.log(`   Issued At: ${idTokenPayload.iat ? new Date(idTokenPayload.iat * 1000).toLocaleString() : 'N/A'}`);
                console.log(`   Expires At: ${idTokenPayload.exp ? new Date(idTokenPayload.exp * 1000).toLocaleString() : 'N/A'}`);
                console.log('');
            } catch (decodeError) {
                console.log('⚠️  Could not decode ID token:', decodeError.message);
            }

            // Get user details
            try {
                console.log('🔍 Fetching User Details...');
                const getUserCommand = new GetUserCommand({
                    AccessToken: AccessToken
                });
                
                const userResponse = await cognitoClient.send(getUserCommand);
                console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                console.log(`   Username: ${userResponse.Username}`);
                console.log(`   User Status: ${userResponse.UserStatus || 'N/A'}`);
                console.log(`   Enabled: ${userResponse.Enabled !== undefined ? userResponse.Enabled : 'N/A'}`);
                console.log('');
                
                if (userResponse.UserAttributes && userResponse.UserAttributes.length > 0) {
                    console.log('   User Attributes:');
                    userResponse.UserAttributes.forEach(attr => {
                        console.log(`      ${attr.Name}: ${attr.Value}`);
                    });
                }
                console.log('');
            } catch (userError) {
                console.log('⚠️  Could not fetch user details:', userError.message);
                console.log('');
            }

            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('✨ Login test completed successfully!');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

            return {
                success: true,
                tokens: {
                    accessToken: AccessToken,
                    idToken: IdToken,
                    refreshToken: RefreshToken
                },
                expiresIn: ExpiresIn
            };

        } else if (authResponse.ChallengeName) {
            console.log('⚠️  Authentication Challenge Required');
            console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log(`   Challenge: ${authResponse.ChallengeName}`);
            console.log(`   Session: ${authResponse.Session ? authResponse.Session.substring(0, 50) + '...' : 'N/A'}`);
            console.log('');
            
            if (authResponse.ChallengeParameters) {
                console.log('   Challenge Parameters:');
                Object.entries(authResponse.ChallengeParameters).forEach(([key, value]) => {
                    console.log(`      ${key}: ${value}`);
                });
            }
            console.log('');
            
            return {
                success: false,
                error: 'Challenge required',
                challenge: authResponse.ChallengeName
            };
        } else {
            console.log('❌ Unexpected authentication response');
            console.log(JSON.stringify(authResponse, null, 2));
            return {
                success: false,
                error: 'Unexpected response'
            };
        }

    } catch (error) {
        console.log('❌ Login Failed!\n');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`   Error Type: ${error.name || 'Unknown'}`);
        console.log(`   Error Code: ${error.$metadata?.httpStatusCode || 'N/A'}`);
        console.log(`   Error Message: ${error.message || 'Unknown error'}`);
        console.log('');

        // Common error explanations
        if (error.name === 'NotAuthorizedException') {
            console.log('💡 Possible Reasons:');
            console.log('   • Incorrect email or password');
            console.log('   • Account may be disabled');
            console.log('   • Too many failed login attempts');
        } else if (error.name === 'UserNotFoundException') {
            console.log('💡 Possible Reasons:');
            console.log('   • User does not exist in this user pool');
            console.log('   • Email address is incorrect');
        } else if (error.name === 'UserNotConfirmedException') {
            console.log('💡 Possible Reasons:');
            console.log('   • Email verification is required');
            console.log('   • Account confirmation is pending');
        } else if (error.name === 'InvalidParameterException') {
            console.log('💡 Possible Reasons:');
            console.log('   • USER_PASSWORD_AUTH flow may not be enabled');
            console.log('   • Check Cognito App Client settings');
        }

        console.log('');
        console.log('🔍 Full Error Details:');
        console.log(JSON.stringify(error, null, 2));
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        return {
            success: false,
            error: error.message,
            errorType: error.name
        };
    }
}

// Run the test
testLogin()
    .then(result => {
        if (result.success) {
            process.exit(0);
        } else {
            process.exit(1);
        }
    })
    .catch(err => {
        console.error('Unexpected error:', err);
        process.exit(1);
    });
