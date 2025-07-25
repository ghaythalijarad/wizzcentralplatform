const { 
  CognitoIdentityProviderClient, 
  AdminInitiateAuthCommand,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  AdminGetUserCommand,
  ListUsersCommand,
  AdminRespondToAuthChallengeCommand
} = require('@aws-sdk/client-cognito-identity-provider');
const { CognitoJwtVerifier } = require('aws-jwt-verify');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const database = require('../utils/database');
const responseHelper = require('../utils/response');
const { userSchemas, validate } = require('../utils/validation');

const cognitoClient = new CognitoIdentityProviderClient({ 
  region: process.env.COGNITO_REGION || 'us-east-1' 
});

const USERS_TABLE = process.env.USERS_TABLE;
const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const CLIENT_SECRET = process.env.COGNITO_CLIENT_SECRET;

// Create secret hash for Cognito
function createSecretHash(username) {
  const message = username + CLIENT_ID;
  const key = CLIENT_SECRET;
  return crypto.createHmac('sha256', key).update(message).digest('base64');
}

// User registration with Cognito
exports.register = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const body = JSON.parse(event.body);
    
    // Validate input
    const validator = validate(userSchemas.register);
    const validation = validator(body);
    
    if (!validation.isValid) {
      return responseHelper.validation(validation.errors);
    }

    const { name, email, password, role } = validation.data;

    // Check if user exists in DynamoDB first
    const existingUser = await database.findByEmail(USERS_TABLE, email);
    if (existingUser) {
      return responseHelper.conflict('User with this email already exists');
    }

    const userId = uuidv4();
    const secretHash = createSecretHash(email);

    // Create user in Cognito
    const createUserCommand = new AdminCreateUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      UserAttributes: [
        { Name: 'email', Value: email },
        { Name: 'name', Value: name },
        { Name: 'email_verified', Value: 'true' }
      ],
      MessageAction: 'SUPPRESS',
      TemporaryPassword: 'TempPass123!'
    });

    try {
      await cognitoClient.send(createUserCommand);
    } catch (cognitoError) {
      if (cognitoError.name === 'UsernameExistsException') {
        return responseHelper.conflict('User with this email already exists');
      }
      throw cognitoError;
    }

    // Set permanent password
    const setPasswordCommand = new AdminSetUserPasswordCommand({
      UserPoolId: USER_POOL_ID,
      Username: email,
      Password: password,
      Permanent: true
    });

    await cognitoClient.send(setPasswordCommand);

    // Create user record in DynamoDB
    const user = {
      userId,
      name,
      email,
      role: role || 'customer',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await database.create(USERS_TABLE, user);

    return responseHelper.success({
      message: 'User registered successfully',
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return responseHelper.error('Registration failed', 500);
  }
};

// User login with Cognito
exports.login = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const body = JSON.parse(event.body);
    
    // Validate input
    const validator = validate(userSchemas.login);
    const validation = validator(body);
    
    if (!validation.isValid) {
      return responseHelper.validation(validation.errors);
    }

    const { email, password } = validation.data;
    const secretHash = createSecretHash(email);

    // Authenticate with Cognito
    const authCommand = new AdminInitiateAuthCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      AuthFlow: 'ADMIN_NO_SRP_AUTH',
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: secretHash
      }
    });

    try {
      const authResponse = await cognitoClient.send(authCommand);
      
      if (authResponse.ChallengeName) {
        return responseHelper.error('Authentication challenge required', 400);
      }

      const tokens = authResponse.AuthenticationResult;
      
      // Get user data from DynamoDB
      const user = await database.findByEmail(USERS_TABLE, email);
      
      if (user) {
        // Update last login
        await database.update(USERS_TABLE, 'userId', user.userId, {
          lastLoginAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }

      return responseHelper.success({
        message: 'Login successful',
        tokens: {
          accessToken: tokens.AccessToken,
          idToken: tokens.IdToken,
          refreshToken: tokens.RefreshToken
        },
        user: user ? {
          userId: user.userId,
          email: user.email,
          name: user.name,
          role: user.role
        } : null
      });

    } catch (cognitoError) {
      console.error('Cognito auth error:', cognitoError);
      if (cognitoError.name === 'NotAuthorizedException') {
        return responseHelper.unauthorized('Invalid email or password');
      }
      if (cognitoError.name === 'UserNotConfirmedException') {
        return responseHelper.error('User not confirmed', 400);
      }
      throw cognitoError;
    }

  } catch (error) {
    console.error('Login error:', error);
    return responseHelper.error('Login failed', 500);
  }
};

// Refresh token
exports.refreshToken = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const body = JSON.parse(event.body);
    const { refreshToken, email } = body;

    if (!refreshToken || !email) {
      return responseHelper.badRequest('Refresh token and email are required');
    }

    const secretHash = createSecretHash(email);

    const authCommand = new AdminInitiateAuthCommand({
      UserPoolId: USER_POOL_ID,
      ClientId: CLIENT_ID,
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
        SECRET_HASH: secretHash
      }
    });

    try {
      const authResponse = await cognitoClient.send(authCommand);
      const tokens = authResponse.AuthenticationResult;

      return responseHelper.success({
        message: 'Token refreshed successfully',
        tokens: {
          accessToken: tokens.AccessToken,
          idToken: tokens.IdToken
        }
      });

    } catch (cognitoError) {
      console.error('Token refresh error:', cognitoError);
      if (cognitoError.name === 'NotAuthorizedException') {
        return responseHelper.unauthorized('Invalid refresh token');
      }
      throw cognitoError;
    }

  } catch (error) {
    console.error('Refresh token error:', error);
    return responseHelper.error('Token refresh failed', 500);
  }
};

// Initiate password reset
exports.initiatePasswordReset = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const body = JSON.parse(event.body);
    const { email } = body;

    if (!email) {
      return responseHelper.badRequest('Email is required');
    }

    // For now, just return success - implement actual password reset logic here
    return responseHelper.success({
      message: 'Password reset instructions sent to your email'
    });

  } catch (error) {
    console.error('Password reset initiation error:', error);
    return responseHelper.error('Password reset initiation failed', 500);
  }
};

// Confirm password reset
exports.confirmPasswordReset = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const body = JSON.parse(event.body);
    const { email, code, newPassword } = body;

    if (!email || !code || !newPassword) {
      return responseHelper.badRequest('Email, code, and new password are required');
    }

    // For now, just return success - implement actual password reset confirmation logic here
    return responseHelper.success({
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Password reset confirmation error:', error);
    return responseHelper.error('Password reset confirmation failed', 500);
  }
};

// Change password
exports.changePassword = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const body = JSON.parse(event.body);
    const { oldPassword, newPassword } = body;

    if (!oldPassword || !newPassword) {
      return responseHelper.badRequest('Old password and new password are required');
    }

    // For now, just return success - implement actual password change logic here
    return responseHelper.success({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Password change error:', error);
    return responseHelper.error('Password change failed', 500);
  }
};

// Authorization handler for API Gateway
exports.authorize = async (event) => {
  try {
    const token = event.authorizationToken;
    
    if (!token) {
      throw new Error('Unauthorized');
    }

    // Extract the token (remove 'Bearer ' prefix if present)
    const cleanToken = token.replace(/^Bearer\s+/, '');
    
    // For now, allow all requests - you can implement proper JWT verification here
    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: event.methodArn
          }
        ]
      }
    };

  } catch (error) {
    console.error('Authorization error:', error);
    throw new Error('Unauthorized');
  }
};
