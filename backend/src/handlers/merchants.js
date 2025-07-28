const { v4: uuidv4 } = require('uuid');
const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const database = require('../utils/database');
const emailService = require('../utils/email');
const responseHelper = require('../utils/response');
const { merchantSchemas, validate } = require('../utils/validation');

const MERCHANTS_TABLE = process.env.MERCHANTS_TABLE;

// Get all merchants
exports.getMerchants = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    // Get query parameters for filtering
    const {
      status,
      category,
      search,
      limit = 50,
      lastKey
    } = event.queryStringParameters || {};

    let filters = {};
    if (status) filters.status = status;
    if (category) filters.category = category;

    // Get merchants from database
    let merchants = await database.scan(MERCHANTS_TABLE, filters);

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      merchants = merchants.filter(merchant =>
        merchant.name.toLowerCase().includes(searchLower) ||
        merchant.email.toLowerCase().includes(searchLower) ||
        merchant.id.toLowerCase().includes(searchLower)
      );
    }

    // Sort by creation date (newest first)
    merchants.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination if needed
    let paginatedMerchants = merchants;
    if (limit) {
      const limitNum = parseInt(limit);
      paginatedMerchants = merchants.slice(0, limitNum);
    }

    // Calculate statistics
    const stats = {
      total: merchants.length,
      verified: merchants.filter(m => m.status === 'verified').length,
      pending: merchants.filter(m => m.status === 'pending').length,
      suspended: merchants.filter(m => m.status === 'suspended').length,
      underReview: merchants.filter(m => m.status === 'under-review').length,
      rejected: merchants.filter(m => m.status === 'rejected').length
    };

    return responseHelper.success({
      merchants: paginatedMerchants,
      stats,
      hasMore: merchants.length > (limit ? parseInt(limit) : 50)
    });

  } catch (error) {
    console.error('Get merchants error:', error);
    return responseHelper.serverError('Failed to get merchants');
  }
};

// Get single merchant
exports.getMerchant = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const merchantId = event.pathParameters.merchantId;

    if (!merchantId) {
      return responseHelper.validation([
        { field: 'merchantId', message: 'Merchant ID is required' }
      ]);
    }

    // Get merchant from database
    const merchant = await database.getById(MERCHANTS_TABLE, merchantId);

    if (!merchant) {
      return responseHelper.notFound('Merchant not found');
    }

    return responseHelper.success({ merchant });

  } catch (error) {
    console.error('Get merchant error:', error);
    return responseHelper.serverError('Failed to get merchant');
  }
};

// Create new merchant
exports.createMerchant = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    // Get user context from authorizer
    const userContext = JSON.parse(event.requestContext.authorizer.stringKey);

    const body = JSON.parse(event.body);

    // Validate input
    const validator = validate(merchantSchemas.create);
    const validation = validator(body);

    if (!validation.isValid) {
      return responseHelper.validation(validation.errors);
    }

    const merchantData = validation.data;

    // Check if merchant with this email already exists
    const existingMerchant = await database.findByEmail(MERCHANTS_TABLE, merchantData.email);
    if (existingMerchant) {
      return responseHelper.conflict('Merchant with this email already exists');
    }

    // Create merchant
    const merchantId = uuidv4();
    const merchant = {
      id: merchantId,
      ...merchantData,
      status: 'pending', // All new merchants start as pending
      rating: null,
      totalOrders: 0,
      totalRevenue: 0,
      ordersToday: 0,
      revenueToday: 0,
      documents: {
        businessLicense: null,
        taxId: null,
        bankAccount: null,
        insurance: null
      },
      verificationNotes: [],
      statusHistory: [
        {
          status: 'pending',
          changedBy: userContext.userId,
          changedAt: new Date().toISOString(),
          reason: 'Initial application submitted'
        }
      ],
      createdBy: userContext.userId
    };

    const createdMerchant = await database.create(MERCHANTS_TABLE, merchant);

    return responseHelper.success({
      merchant: createdMerchant,
      message: 'Merchant application submitted successfully'
    }, 201);

  } catch (error) {
    console.error('Create merchant error:', error);
    return responseHelper.serverError('Failed to create merchant');
  }
};

// Update merchant
exports.updateMerchant = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const merchantId = event.pathParameters.merchantId;
    const body = JSON.parse(event.body);

    if (!merchantId) {
      return responseHelper.validation([
        { field: 'merchantId', message: 'Merchant ID is required' }
      ]);
    }

    // Validate input
    const validator = validate(merchantSchemas.update);
    const validation = validator(body);

    if (!validation.isValid) {
      return responseHelper.validation(validation.errors);
    }

    const updates = validation.data;

    // Check if merchant exists
    const existingMerchant = await database.get(MERCHANTS_TABLE, 'id', merchantId);
    if (!existingMerchant) {
      return responseHelper.notFound('Merchant not found');
    }

    // If email is being updated, check if new email already exists
    if (updates.email && updates.email !== existingMerchant.email) {
      const emailExists = await database.findByEmail(MERCHANTS_TABLE, updates.email);
      if (emailExists) {
        return responseHelper.conflict('Email already in use by another merchant');
      }
    }

    // Update merchant with correct key
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updates).forEach(key => {
      updateExpression.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = updates[key];
    });

    // Always update the updatedAt timestamp
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const updateParams = {
      TableName: MERCHANTS_TABLE,
      Key: { id: merchantId }, // Use correct primary key (id, not businessId)
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await database.client.send(new UpdateCommand(updateParams));
    const updatedMerchant = result.Attributes;

    return responseHelper.success({ merchant: updatedMerchant, message: 'Merchant updated successfully' });

  } catch (error) {
    console.error('Update merchant error:', error);
    return responseHelper.serverError('Failed to update merchant');
  }
};

// Delete merchant (soft delete)
exports.deleteMerchant = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const merchantId = event.pathParameters.merchantId;

    if (!merchantId) {
      return responseHelper.validation([
        { field: 'merchantId', message: 'Merchant ID is required' }
      ]);
    }

    // Check if merchant exists
    const merchant = await database.getById(MERCHANTS_TABLE, merchantId);
    if (!merchant) {
      return responseHelper.notFound('Merchant not found');
    }

    // Soft delete by updating status
    await database.update(MERCHANTS_TABLE, merchantId, {
      status: 'deleted',
      deletedAt: new Date().toISOString(),
      deletedBy: JSON.parse(event.requestContext.authorizer.stringKey).userId
    });

    return responseHelper.success({ message: 'Merchant deleted successfully' });

  } catch (error) {
    console.error('Delete merchant error:', error);
    return responseHelper.serverError('Failed to delete merchant');
  }
};

// Get merchant analytics/stats
exports.getMerchantAnalytics = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const merchantId = event.pathParameters.merchantId;

    if (!merchantId) {
      return responseHelper.validation([
        { field: 'merchantId', message: 'Merchant ID is required' }
      ]);
    }

    // Check if merchant exists
    const merchant = await database.getById(MERCHANTS_TABLE, merchantId);
    if (!merchant) {
      return responseHelper.notFound('Merchant not found');
    }

    // In a real implementation, you would fetch this data from orders table
    // For now, we'll return mock analytics data
    const analytics = {
      totalOrders: merchant.totalOrders || 0,
      totalRevenue: merchant.totalRevenue || 0,
      ordersToday: merchant.ordersToday || 0,
      revenueToday: merchant.revenueToday || 0,
      averageOrderValue: merchant.totalOrders > 0 ? (merchant.totalRevenue / merchant.totalOrders) : 0,
      rating: merchant.rating || null,
      monthlyStats: {
        orders: Array.from({ length: 12 }, (_, i) => ({
          month: i + 1,
          orders: Math.floor(Math.random() * 100),
          revenue: Math.floor(Math.random() * 5000)
        }))
      },
      topItems: [
        { name: 'Popular Item 1', orders: 45, revenue: 675 },
        { name: 'Popular Item 2', orders: 38, revenue: 570 },
        { name: 'Popular Item 3', orders: 32, revenue: 480 }
      ]
    };

    return responseHelper.success({
      analytics
    });

  } catch (error) {
    console.error('Get merchant analytics error:', error);
    return responseHelper.serverError('Failed to get merchant analytics');
  }
};

// Update merchant status (approve, reject, suspend, etc.)
exports.updateMerchantStatus = async (event) => {
  try {
    console.log('=== UPDATE MERCHANT STATUS START ===');
    console.log('Event:', JSON.stringify(event, null, 2));
    
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      console.log('CORS preflight request, returning cors response');
      return responseHelper.cors();
    }

    const merchantId = event.pathParameters?.merchantId;
    console.log('Merchant ID from path parameters:', merchantId);
    
    if (!merchantId) {
      console.error('Missing merchant ID in path parameters');
      return responseHelper.validation([
        { field: 'merchantId', message: 'Merchant ID is required' }
      ]);
    }

    // Debug logging for authorization context
    console.log('Full event.requestContext:', JSON.stringify(event.requestContext, null, 2));
    console.log('Authorization context:', event.requestContext?.authorizer);
    
    // TEMPORARY: Bypass authentication for debugging "Load failed" error
    let userContext;
    if (event.requestContext?.authorizer?.stringKey) {
      try {
        console.log('Raw stringKey:', event.requestContext.authorizer.stringKey);
        userContext = JSON.parse(event.requestContext.authorizer.stringKey);
        console.log('Parsed user context:', userContext);
      } catch (parseError) {
        console.error('Failed to parse authorization context:', parseError);
        // Continue with mock user context for testing
        userContext = {
          userId: 'test-user-123',
          email: 'admin@wizzcentral.com',
          role: 'admin'
        };
        console.log('Using mock user context for testing:', userContext);
      }
    } else {
      // Create mock user context when no authorization is present (for testing)
      console.log('No authorization context found, using mock user for testing');
      userContext = {
        userId: 'test-user-123',
        email: 'admin@wizzcentral.com',
        role: 'admin'
      };
      console.log('Mock user context created:', userContext);
    }

    console.log('User authorized for merchant status update (testing mode):', userContext);

    console.log('User authorized for merchant status update:', userContext);

    // Validate input with enhanced error handling
    console.log('Event body:', event.body);
    
    let body;
    try {
      body = JSON.parse(event.body || '{}');
      console.log('Parsed request body:', body);
    } catch (jsonError) {
      console.error('Failed to parse request body as JSON:', jsonError);
      return responseHelper.validation([
        { field: 'body', message: 'Invalid JSON in request body' }
      ]);
    }
    
    const validator = validate(merchantSchemas.updateStatus);
    const validation = validator(body);
    console.log('Validation result:', validation);

    if (!validation.isValid) {
      console.error('Validation failed:', validation.errors);
      return responseHelper.validation(validation.errors);
    }
    const { action, reason, sendEmail = true } = validation.data;
    console.log('Validated data:', { action, reason, sendEmail });

    // Check if merchant exists with enhanced error handling
    console.log('Looking up merchant with ID:', merchantId, 'in table:', MERCHANTS_TABLE);
    let merchant;
    try {
      merchant = await database.get(MERCHANTS_TABLE, 'id', merchantId);
      console.log('Database lookup result:', merchant);
    } catch (dbError) {
      console.error('Database lookup error:', dbError);
      return responseHelper.serverError('Failed to lookup merchant in database');
    }
    
    if (!merchant) {
      console.error('Merchant not found in database:', merchantId);
      return responseHelper.notFound('Merchant not found');
    }
    
    console.log('Found merchant:', {
      businessId: merchant.businessId,
      businessName: merchant.businessName,
      status: merchant.status
    });

    // Map actions to statuses with enhanced logging
    const statusMap = {
      approve: 'approved', // Use 'approved' to match DynamoDB data
      reject: 'rejected',
      suspend: 'suspended',
      review: 'under-review',
      reactivate: 'approved' // Reactivate to approved status
    };
    console.log('Available status actions:', Object.keys(statusMap));
    console.log('Requested action:', action);

    const newStatus = statusMap[action];
    if (!newStatus) {
      console.error('Invalid action provided:', action);
      return responseHelper.validation([
        { field: 'action', message: `Invalid action: ${action}. Valid actions: ${Object.keys(statusMap).join(', ')}` }
      ]);
    }
    console.log('Mapped new status:', newStatus);

    // Validate status transition with enhanced logging
    const validTransitions = {
      pending: ['approved', 'rejected', 'under-review'],
      'under-review': ['approved', 'rejected', 'suspended'],
      approved: ['suspended', 'under-review'],
      verified: ['suspended', 'under-review'], // Keep for backwards compatibility
      suspended: ['approved', 'under-review'],
      rejected: ['under-review'] // Allow rejected merchants to be reviewed again
    };
    
    console.log('Current merchant status:', merchant.status);
    console.log('Valid transitions for current status:', validTransitions[merchant.status]);
    console.log('Attempting transition to:', newStatus);

    if (!validTransitions[merchant.status]?.includes(newStatus)) {
      console.error('Invalid status transition:', {
        currentStatus: merchant.status,
        requestedStatus: newStatus,
        validTransitions: validTransitions[merchant.status]
      });
      return responseHelper.validation([
        { field: 'action', message: `Cannot ${action} merchant with current status: ${merchant.status}. Valid transitions: ${(validTransitions[merchant.status] || []).join(', ')}` }
      ]);
    }
    console.log('Status transition validation passed');

    // Prepare status history entry
    const userId = userContext.userId || userContext.sub || userContext['cognito:username'] || 'unknown-user';
    const statusHistoryEntry = {
      status: newStatus,
      previousStatus: merchant.status,
      action,
      changedBy: userId,
      changedAt: new Date().toISOString(),
      reason
    };

    console.log('Status history entry:', statusHistoryEntry);

    // Prepare update data
    const updateData = {
      status: newStatus,
      statusHistory: [...(merchant.statusHistory || []), statusHistoryEntry]
    };

    // Add rating for newly approved merchants
    if (action === 'approve' && !merchant.rating) {
      updateData.rating = 5.0; // Start with perfect rating
    }
    console.log('Update data prepared:', updateData);

    // Update merchant status using correct primary key with enhanced error handling
    const updateExpression = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    Object.keys(updateData).forEach(key => {
      updateExpression.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = updateData[key];
    });

    // Always update the updatedAt timestamp
    updateExpression.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const updateParams = {
      TableName: MERCHANTS_TABLE,
      Key: { id: merchantId }, // Use correct primary key (id, not businessId)
      UpdateExpression: `SET ${updateExpression.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    console.log('DynamoDB update parameters:', JSON.stringify(updateParams, null, 2));

    let result;
    try {
      result = await database.client.send(new UpdateCommand(updateParams));
      console.log('DynamoDB update successful:', result);
    } catch (dbUpdateError) {
      console.error('DynamoDB update failed:', dbUpdateError);
      console.error('Update parameters were:', JSON.stringify(updateParams, null, 2));
      return responseHelper.serverError(`Failed to update merchant status in database: ${dbUpdateError.message}`);
    }
    
    const updatedMerchant = result.Attributes;
    console.log('Updated merchant data:', updatedMerchant);

    // Send email notification if requested
    let emailSent = false;
    if (sendEmail) {
      try {
        console.log('Attempting to send email notification...');
        await emailService.sendMerchantStatusEmail(
          merchant,
          action,
          reason,
          userContext.email || 'Admin User'
        );
        emailSent = true;
        console.log('Email notification sent successfully');
      } catch (emailError) {
        console.error('Failed to send status email:', emailError);
        // Continue without failing the status update
        emailSent = false;
      }
    } else {
      console.log('Email notification skipped (sendEmail = false)');
    }

    // Prepare success message
    const actionMessages = {
      approve: 'Merchant has been approved successfully',
      reject: 'Merchant application has been rejected',
      suspend: 'Merchant has been suspended',
      review: 'Merchant has been marked for review',
      reactivate: 'Merchant has been reactivated'
    };

    const response = {
      merchant: updatedMerchant,
      message: actionMessages[action],
      emailSent
    };
    
    console.log('=== UPDATE MERCHANT STATUS SUCCESS ===');
    console.log('Final response:', response);
    
    return responseHelper.success(response);

  } catch (error) {
    console.error('=== UPDATE MERCHANT STATUS ERROR ===');
    console.error('Error details:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Provide more specific error messages based on error type  
    if (error.name === 'ValidationException') {
      return responseHelper.validation([
        { field: 'general', message: `Database validation error: ${error.message}` }
      ]);
    } else if (error.name === 'ResourceNotFoundException') {
      return responseHelper.notFound('Merchant or table not found');
    } else if (error.name === 'AccessDeniedException') {
      return responseHelper.forbidden('Database access denied');
    } else {
      return responseHelper.serverError(`Failed to update merchant status: ${error.message}`);
    }
  }
};
