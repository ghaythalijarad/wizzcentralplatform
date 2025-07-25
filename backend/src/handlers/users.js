const database = require('../utils/database');
const responseHelper = require('../utils/response');
const { userSchemas, validate } = require('../utils/validation');

const USERS_TABLE = process.env.USERS_TABLE;

// Get user profile
exports.getProfile = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    // Get user ID from authorizer context
    const userId = JSON.parse(event.requestContext.authorizer.stringKey).userId;

    if (!userId) {
      return responseHelper.unauthorized('User ID not found in token');
    }

    // Get user from database
    const user = await database.getById(USERS_TABLE, userId);
    if (!user) {
      return responseHelper.notFound('User not found');
    }

    // Remove sensitive information
    const { password, resetToken, resetTokenExpires, loginAttempts, ...userProfile } = user;

    return responseHelper.success({
      user: userProfile
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return responseHelper.serverError('Failed to get user profile');
  }
};

// Update user profile
exports.updateProfile = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    // Get user ID from authorizer context
    const userId = JSON.parse(event.requestContext.authorizer.stringKey).userId;

    if (!userId) {
      return responseHelper.unauthorized('User ID not found in token');
    }

    const body = JSON.parse(event.body);
    
    // Validate input
    const validator = validate(userSchemas.updateProfile);
    const validation = validator(body);
    
    if (!validation.isValid) {
      return responseHelper.validation(validation.errors);
    }

    const updates = validation.data;

    // Check if user exists
    const existingUser = await database.getById(USERS_TABLE, userId);
    if (!existingUser) {
      return responseHelper.notFound('User not found');
    }

    // If email is being updated, check if new email already exists
    if (updates.email && updates.email !== existingUser.email) {
      const emailExists = await database.findByEmail(USERS_TABLE, updates.email);
      if (emailExists) {
        return responseHelper.conflict('Email already in use by another account');
      }
      
      // Mark email as unverified if changed
      updates.emailVerified = false;
    }

    // Update user profile
    const updatedUser = await database.update(USERS_TABLE, userId, updates);

    // Remove sensitive information
    const { password, resetToken, resetTokenExpires, loginAttempts, ...userResponse } = updatedUser;

    return responseHelper.success({
      user: userResponse,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return responseHelper.serverError('Failed to update profile');
  }
};

// Update user preferences
exports.updatePreferences = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    // Get user ID from authorizer context
    const userId = JSON.parse(event.requestContext.authorizer.stringKey).userId;

    if (!userId) {
      return responseHelper.unauthorized('User ID not found in token');
    }

    const body = JSON.parse(event.body);
    const { preferences } = body;

    if (!preferences || typeof preferences !== 'object') {
      return responseHelper.validation([
        { field: 'preferences', message: 'Preferences object is required' }
      ]);
    }

    // Get current user
    const user = await database.getById(USERS_TABLE, userId);
    if (!user) {
      return responseHelper.notFound('User not found');
    }

    // Merge with existing preferences
    const updatedPreferences = {
      ...user.profile?.preferences,
      ...preferences
    };

    // Update user preferences
    const updatedUser = await database.update(USERS_TABLE, userId, {
      'profile.preferences': updatedPreferences
    });

    return responseHelper.success({
      preferences: updatedPreferences,
      message: 'Preferences updated successfully'
    });

  } catch (error) {
    console.error('Update preferences error:', error);
    return responseHelper.serverError('Failed to update preferences');
  }
};

// Change password
exports.changePassword = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    // Get user ID from authorizer context
    const userId = JSON.parse(event.requestContext.authorizer.stringKey).userId;

    if (!userId) {
      return responseHelper.unauthorized('User ID not found in token');
    }

    const body = JSON.parse(event.body);
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return responseHelper.validation([
        { field: 'currentPassword', message: 'Current password is required' },
        { field: 'newPassword', message: 'New password is required' }
      ]);
    }

    // Get user
    const user = await database.getById(USERS_TABLE, userId);
    if (!user) {
      return responseHelper.notFound('User not found');
    }

    // Verify current password
    const authUtils = require('../utils/auth');
    const isCurrentPasswordValid = await authUtils.comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return responseHelper.unauthorized('Current password is incorrect');
    }

    // Validate new password
    const passwordValidator = validate(userSchemas.register);
    const passwordValidation = passwordValidator({ password: newPassword });
    if (!passwordValidation.isValid) {
      const passwordErrors = passwordValidation.errors.filter(e => e.field === 'password');
      return responseHelper.validation(passwordErrors);
    }

    // Hash new password
    const hashedPassword = await authUtils.hashPassword(newPassword);

    // Update password
    await database.update(USERS_TABLE, userId, {
      password: hashedPassword
    });

    return responseHelper.success({
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    return responseHelper.serverError('Failed to change password');
  }
};

// Get all users (admin only)
exports.getUsers = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    // Get user role from authorizer context
    const userContext = JSON.parse(event.requestContext.authorizer.stringKey);
    
    if (userContext.role !== 'admin') {
      return responseHelper.forbidden('Admin access required');
    }

    // Get query parameters
    const { status, role, limit = 50, lastKey } = event.queryStringParameters || {};

    let filters = {};
    if (status) filters.status = status;
    if (role) filters.role = role;

    // Get users from database
    const users = await database.scan(USERS_TABLE, filters);

    // Remove sensitive information from all users
    const sanitizedUsers = users.map(user => {
      const { password, resetToken, resetTokenExpires, ...sanitizedUser } = user;
      return sanitizedUser;
    });

    // Apply pagination if needed
    let paginatedUsers = sanitizedUsers;
    if (limit) {
      const limitNum = parseInt(limit);
      paginatedUsers = sanitizedUsers.slice(0, limitNum);
    }

    return responseHelper.success({
      users: paginatedUsers,
      total: users.length,
      hasMore: sanitizedUsers.length > (limit ? parseInt(limit) : 50)
    });

  } catch (error) {
    console.error('Get users error:', error);
    return responseHelper.serverError('Failed to get users');
  }
};

// Update user status (admin only)
exports.updateUserStatus = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    // Get user role from authorizer context
    const userContext = JSON.parse(event.requestContext.authorizer.stringKey);
    
    if (userContext.role !== 'admin') {
      return responseHelper.forbidden('Admin access required');
    }

    const { id } = event.pathParameters;
    const body = JSON.parse(event.body);
    const { status, reason } = body;

    if (!status || !['active', 'inactive', 'suspended'].includes(status)) {
      return responseHelper.validation([
        { field: 'status', message: 'Valid status is required (active, inactive, suspended)' }
      ]);
    }

    if (!reason) {
      return responseHelper.validation([
        { field: 'reason', message: 'Reason is required for status change' }
      ]);
    }

    // Check if user exists
    const user = await database.getById(USERS_TABLE, id);
    if (!user) {
      return responseHelper.notFound('User not found');
    }

    // Update user status
    const updatedUser = await database.update(USERS_TABLE, id, {
      status,
      statusChangedBy: userContext.userId,
      statusChangedAt: new Date().toISOString(),
      statusChangeReason: reason
    });

    // Remove sensitive information
    const { password, resetToken, resetTokenExpires, ...userResponse } = updatedUser;

    return responseHelper.success({
      user: userResponse,
      message: `User status updated to ${status}`
    });

  } catch (error) {
    console.error('Update user status error:', error);
    return responseHelper.serverError('Failed to update user status');
  }
};

// Delete user account (admin only or self-deletion)
exports.deleteUser = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    // Get user context from authorizer
    const userContext = JSON.parse(event.requestContext.authorizer.stringKey);
    const { id } = event.pathParameters;

    // Check if user can delete (admin or self)
    if (userContext.role !== 'admin' && userContext.userId !== id) {
      return responseHelper.forbidden('Cannot delete other users');
    }

    // Check if user exists
    const user = await database.getById(USERS_TABLE, id);
    if (!user) {
      return responseHelper.notFound('User not found');
    }

    // Prevent admin from deleting themselves
    if (userContext.userId === id && userContext.role === 'admin') {
      return responseHelper.forbidden('Cannot delete your own admin account');
    }

    // Soft delete by updating status
    await database.update(USERS_TABLE, id, {
      status: 'deleted',
      deletedAt: new Date().toISOString(),
      deletedBy: userContext.userId
    });

    return responseHelper.success({
      message: 'User account deleted successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return responseHelper.serverError('Failed to delete user');
  }
};
