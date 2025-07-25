#!/usr/bin/env node
// Script to create a test user in Cognito and set permanent password
import { CognitoIdentityProviderClient, AdminCreateUserCommand, AdminSetUserPasswordCommand } from '@aws-sdk/client-cognito-identity-provider';
import dotenv from 'dotenv';

dotenv.config();

const region = process.env.COGNITO_REGION || 'us-east-1';
const userPoolId = process.env.COGNITO_USER_POOL_ID;
const username = 'G87_a@yahoo.com';
const password = 'Gha@551987';

if (!userPoolId) {
  console.error('COGNITO_USER_POOL_ID is not defined in environment');
  process.exit(1);
}

async function main() {
  const client = new CognitoIdentityProviderClient({ region });

  // Attempt to create user
  try {
    const createUser = new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: username,
      UserAttributes: [
        { Name: 'email', Value: username },
        { Name: 'email_verified', Value: 'true' }
      ],
      TemporaryPassword: password,
      MessageAction: 'SUPPRESS'
    });
    await client.send(createUser);
    console.log(`✅ Created user ${username}`);
  } catch (e) {
    if (e.name === 'UsernameExistsException') {
      console.log(`⚠️  User ${username} already exists`);
    } else {
      console.error('Error creating user:', e);
      process.exit(1);
    }
  }

  // Set permanent password
  try {
    const setPassword = new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: username,
      Password: password,
      Permanent: true
    });
    await client.send(setPassword);
    console.log(`✅ Set permanent password for ${username}`);
  } catch (e) {
    console.error('Error setting password:', e);
    process.exit(1);
  }

  console.log(`🎉 Test user setup complete. You can now log in with ${username}`);
}

main();
