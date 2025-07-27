const { v4: uuidv4 } = require('uuid');
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

    const { id } = event.pathParameters;

    if (!id) {
      return responseHelper.validation([
        { field: 'id', message: 'Merchant ID is required' }
      ]);
    }

    // Get merchant from database
    const merchant = await database.getById(MERCHANTS_TABLE, id);

    if (!merchant) {
      return responseHelper.notFound('Merchant not found');
    }

    return responseHelper.success({
      merchant
    });

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

    const { id } = event.pathParameters;
    const body = JSON.parse(event.body);

    if (!id) {
      return responseHelper.validation([
        { field: 'id', message: 'Merchant ID is required' }
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
    const existingMerchant = await database.getById(MERCHANTS_TABLE, 'businessId', id);
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

    // Update merchant
    const updatedMerchant = await database.update(MERCHANTS_TABLE, 'businessId', id, updates);

    return responseHelper.success({
      merchant: updatedMerchant,
      message: 'Merchant updated successfully'
    });

  } catch (error) {
    console.error('Update merchant error:', error);
    return responseHelper.serverError('Failed to update merchant');
  }
};

// Update merchant status (approve, reject, suspend, etc.)
exports.updateMerchantStatus = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    // Get user context from authorizer
    const userContext = JSON.parse(event.requestContext.authorizer.stringKey);

    // Check if user has permission to update merchant status
    if (!['admin', 'manager'].includes(userContext.role)) {
      return responseHelper.forbidden('Insufficient permissions to update merchant status');
    }

    const { id } = event.pathParameters;
    const body = JSON.parse(event.body);

    if (!id) {
      return responseHelper.validation([
        { field: 'id', message: 'Merchant ID is required' }
      ]);
    }

    // Validate input
    const validator = validate(merchantSchemas.updateStatus);
    const validation = validator(body);

    if (!validation.isValid) {
      return responseHelper.validation(validation.errors);
    }

    const { action, reason, sendEmail = true } = validation.data;

    // Check if merchant exists
    const merchant = await database.getById(MERCHANTS_TABLE, id);
    if (!merchant) {
      return responseHelper.notFound('Merchant not found');
    }

    // Map actions to statuses
    const statusMap = {
      approve: 'verified',
      reject: 'rejected',
      suspend: 'suspended',
      review: 'under-review',
      reactivate: 'verified'
    };

    const newStatus = statusMap[action];
    if (!newStatus) {
      return responseHelper.validation([
        { field: 'action', message: 'Invalid action' }
      ]);
    }

    // Validate status transition
    const validTransitions = {
      pending: ['verified', 'rejected', 'under-review'],
      'under-review': ['verified', 'rejected', 'suspended'],
      verified: ['suspended', 'under-review'],
      suspended: ['verified', 'under-review'],
      rejected: ['under-review'] // Allow rejected merchants to be reviewed again
    };

    if (!validTransitions[merchant.status]?.includes(newStatus)) {
      return responseHelper.validation([
        { field: 'action', message: `Cannot ${action} merchant with current status: ${merchant.status}` }
      ]);
    }

    // Prepare status history entry
    const statusHistoryEntry = {
      status: newStatus,
      previousStatus: merchant.status,
      action,
      changedBy: userContext.userId,
      changedAt: new Date().toISOString(),
      reason
    };

    // Prepare update data
    const updateData = {
      status: newStatus,
      statusHistory: [...(merchant.statusHistory || []), statusHistoryEntry]
    };

    // Add rating for newly approved merchants
    if (action === 'approve' && !merchant.rating) {
      updateData.rating = 5.0; // Start with perfect rating
    }

    // Update merchant status
    const updatedMerchant = await database.update(MERCHANTS_TABLE, id, updateData);

    // Send email notification if requested
    if (sendEmail) {
      try {
        await emailService.sendMerchantStatusEmail(
          merchant,
          action,
          reason,
          userContext.email || 'Admin User'
        );
      } catch (emailError) {
        console.error('Failed to send status email:', emailError);
        // Continue without failing the status update
      }
    }

    // Prepare success message
    const actionMessages = {
      approve: 'Merchant has been approved successfully',
      reject: 'Merchant application has been rejected',
      suspend: 'Merchant has been suspended',
      review: 'Merchant has been marked for review',
      reactivate: 'Merchant has been reactivated'
    };

    return responseHelper.success({
      merchant: updatedMerchant,
      message: actionMessages[action],
      emailSent: sendEmail
    });

  } catch (error) {
    console.error('Update merchant status error:', error);
    return responseHelper.serverError('Failed to update merchant status');
  }
};

// Delete merchant (soft delete)
exports.deleteMerchant = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    // Get user context from authorizer
    const userContext = JSON.parse(event.requestContext.authorizer.stringKey);

    // Check if user has permission to delete merchants
    if (userContext.role !== 'admin') {
      return responseHelper.forbidden('Admin access required to delete merchants');
    }

    const { id } = event.pathParameters;

    if (!id) {
      return responseHelper.validation([
        { field: 'id', message: 'Merchant ID is required' }
      ]);
    }

    // Check if merchant exists
    const merchant = await database.getById(MERCHANTS_TABLE, id);
    if (!merchant) {
      return responseHelper.notFound('Merchant not found');
    }

    // Soft delete by updating status
    await database.update(MERCHANTS_TABLE, id, {
      status: 'deleted',
      deletedAt: new Date().toISOString(),
      deletedBy: userContext.userId
    });

    return responseHelper.success({
      message: 'Merchant deleted successfully'
    });

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

    const { id } = event.pathParameters;

    if (!id) {
      return responseHelper.validation([
        { field: 'id', message: 'Merchant ID is required' }
      ]);
    }

    // Check if merchant exists
    const merchant = await database.getById(MERCHANTS_TABLE, id);
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
