const { CognitoJwtVerifier } = require('aws-jwt-verify');
const bcrypt = require('bcryptjs');

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET || 'wizzcentral-super-secret-key-2024';

class AuthUtils {
  constructor() {
    // Initialize Cognito JWT verifier
    this.accessTokenVerifier = CognitoJwtVerifier.create({
      userPoolId: USER_POOL_ID,
      tokenUse: 'access',
      clientId: CLIENT_ID,
    });

    this.idTokenVerifier = CognitoJwtVerifier.create({
      userPoolId: USER_POOL_ID,
      tokenUse: 'id',
      clientId: CLIENT_ID,
    });
  }

  // Verify Cognito Access Token
  async verifyAccessToken(token) {
    try {
      return await this.accessTokenVerifier.verify(token);
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  // Verify Cognito ID Token
  async verifyIdToken(token) {
    try {
      return await this.idTokenVerifier.verify(token);
    } catch (error) {
      throw new Error('Invalid or expired ID token');
    }
  }

  // Verify any Cognito token (tries both access and ID)
  async verifyCognitoToken(token) {
    try {
      // Try access token first
      return await this.verifyAccessToken(token);
    } catch (error) {
      try {
        // Fallback to ID token
        return await this.verifyIdToken(token);
      } catch (idError) {
        throw new Error('Invalid or expired token');
      }
    }
  }

  // Hash password (still useful for local storage or additional security)
  async hashPassword(password) {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }

  // Compare password (still useful for local validation)
  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Extract token from Authorization header
  extractTokenFromHeader(authHeader) {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('Invalid authorization header');
    }
    return authHeader.substring(7);
  }

  // Extract token from event (API Gateway)
  extractTokenFromEvent(event) {
    const authHeader = event.headers?.Authorization || 
                      event.headers?.authorization || 
                      event.authorizationToken;
    
    if (!authHeader) {
      throw new Error('No authorization header found');
    }

    return this.extractTokenFromHeader(authHeader);
  }

  // Generate policy for API Gateway authorizer
  generatePolicy(principalId, effect, resource, context = {}) {
    const authResponse = {
      principalId
    };

    if (effect && resource) {
      const policyDocument = {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: effect,
            Resource: resource
          }
        ]
      };
      authResponse.policyDocument = policyDocument;
    }

    // Add context information
    authResponse.context = context;

    return authResponse;
  }

  // Validate user role
  hasRole(userRole, requiredRoles) {
    if (!Array.isArray(requiredRoles)) {
      requiredRoles = [requiredRoles];
    }
    return requiredRoles.includes(userRole);
  }

  // Check if user has admin privileges
  isAdmin(userRole) {
    return userRole === 'admin' || userRole === 'super_admin';
  }

  // Check if user can access resource
  canAccessResource(userRole, resourceOwner, userId) {
    // Admin can access all resources
    if (this.isAdmin(userRole)) {
      return true;
    }
    
    // User can access their own resources
    if (resourceOwner === userId) {
      return true;
    }
    
    return false;
  }
}

module.exports = new AuthUtils();
