const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand
} = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

const responseHelper = require('../utils/response');
const { validateInput } = require('../utils/validation');
const { verifyToken } = require('../utils/auth');

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

// Validation schemas
const createPromotionSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).required(),
  type: Joi.string().valid('percentage', 'fixed_amount', 'free_delivery', 'bogo').required(),
  code: Joi.string().min(3).max(20).required(),
  value: Joi.number().positive().required(),
  minOrderAmount: Joi.number().min(0).optional(),
  maxDiscountAmount: Joi.number().positive().optional(),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
  usageLimit: Joi.number().integer().positive().optional(),
  userUsageLimit: Joi.number().integer().positive().optional(),
  isActive: Joi.boolean().default(true),
  merchantIds: Joi.array().items(Joi.string()).optional(),
  customerSegments: Joi.array().items(Joi.string().valid('all', 'new', 'vip', 'regular')).default(['all']),
  applicableCategories: Joi.array().items(Joi.string()).optional()
});

const updatePromotionSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  description: Joi.string().max(500).optional(),
  value: Joi.number().positive().optional(),
  minOrderAmount: Joi.number().min(0).optional(),
  maxDiscountAmount: Joi.number().positive().optional(),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  usageLimit: Joi.number().integer().positive().optional(),
  userUsageLimit: Joi.number().integer().positive().optional(),
  isActive: Joi.boolean().optional(),
  merchantIds: Joi.array().items(Joi.string()).optional(),
  customerSegments: Joi.array().items(Joi.string().valid('all', 'new', 'vip', 'regular')).optional(),
  applicableCategories: Joi.array().items(Joi.string()).optional()
});

const validatePromotionCodeSchema = Joi.object({
  code: Joi.string().required(),
  customerId: Joi.string().required(),
  merchantId: Joi.string().optional(),
  orderAmount: Joi.number().positive().required()
});

// Create new promotion
exports.createPromotion = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const validation = validateInput(body, createPromotionSchema);
    if (!validation.isValid) {
      return responseHelper.error(400, 'Validation failed', validation.errors);
    }

    // Check if promotion code already exists
    const existingPromotion = await dynamodb.send(new QueryCommand({
      TableName: process.env.PROMOTIONS_TABLE,
      IndexName: 'Code-Index',
      KeyConditionExpression: 'code = :code',
      ExpressionAttributeValues: {
        ':code': body.code.toUpperCase()
      }
    }));

    if (existingPromotion.Items && existingPromotion.Items.length > 0) {
      return responseHelper.error(400, 'Promotion code already exists');
    }

    const promotionId = uuidv4();
    const timestamp = new Date().toISOString();

    const promotion = {
      promotionId,
      ...body,
      code: body.code.toUpperCase(),
      currentUsage: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: event.requestContext?.authorizer?.userId || 'system'
    };

    await dynamodb.send(new PutCommand({
      TableName: process.env.PROMOTIONS_TABLE,
      Item: promotion
    }));

    return responseHelper.success(201, promotion, 'Promotion created successfully');
  } catch (error) {
    console.error('Error creating promotion:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// Get promotion by ID
exports.getPromotion = async (event) => {
  try {
    const { promotionId } = event.pathParameters;

    const result = await dynamodb.send(new GetCommand({
      TableName: process.env.PROMOTIONS_TABLE,
      Key: { promotionId }
    }));

    if (!result.Item) {
      return responseHelper.error(404, 'Promotion not found');
    }

    return responseHelper.success(200, result.Item);
  } catch (error) {
    console.error('Error fetching promotion:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// Update promotion
exports.updatePromotion = async (event) => {
  try {
    const { promotionId } = event.pathParameters;
    const body = JSON.parse(event.body);
    const validation = validateInput(body, updatePromotionSchema);
    
    if (!validation.isValid) {
      return responseHelper.error(400, 'Validation failed', validation.errors);
    }

    // Check if promotion exists
    const existingPromotion = await dynamodb.send(new GetCommand({
      TableName: process.env.PROMOTIONS_TABLE,
      Key: { promotionId }
    }));

    if (!existingPromotion.Item) {
      return responseHelper.error(404, 'Promotion not found');
    }

    const updateExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    // Build update expression
    Object.entries(body).forEach(([key, value]) => {
      updateExpressions.push(`#${key} = :${key}`);
      expressionAttributeNames[`#${key}`] = key;
      expressionAttributeValues[`:${key}`] = value;
    });

    updateExpressions.push('#updatedAt = :updatedAt');
    expressionAttributeNames['#updatedAt'] = 'updatedAt';
    expressionAttributeValues[':updatedAt'] = new Date().toISOString();

    const result = await dynamodb.send(new UpdateCommand({
      TableName: process.env.PROMOTIONS_TABLE,
      Key: { promotionId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return responseHelper.success(200, result.Attributes, 'Promotion updated successfully');
  } catch (error) {
    console.error('Error updating promotion:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// Delete promotion
exports.deletePromotion = async (event) => {
  try {
    const { promotionId } = event.pathParameters;

    // Check if promotion exists
    const existingPromotion = await dynamodb.send(new GetCommand({
      TableName: process.env.PROMOTIONS_TABLE,
      Key: { promotionId }
    }));

    if (!existingPromotion.Item) {
      return responseHelper.error(404, 'Promotion not found');
    }

    await dynamodb.send(new DeleteCommand({
      TableName: process.env.PROMOTIONS_TABLE,
      Key: { promotionId }
    }));

    return responseHelper.success(200, null, 'Promotion deleted successfully');
  } catch (error) {
    console.error('Error deleting promotion:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// List promotions with filters
exports.listPromotions = async (event) => {
  try {
    const {
      isActive,
      type,
      merchantId,
      startDate,
      endDate,
      limit = 50,
      lastEvaluatedKey
    } = event.queryStringParameters || {};

    let params = {
      TableName: process.env.PROMOTIONS_TABLE,
      Limit: parseInt(limit)
    };

    // Add filters
    const filterExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (isActive !== undefined) {
      filterExpressions.push('isActive = :isActive');
      expressionAttributeValues[':isActive'] = isActive === 'true';
    }

    if (type) {
      filterExpressions.push('#type = :type');
      expressionAttributeNames['#type'] = 'type';
      expressionAttributeValues[':type'] = type;
    }

    if (merchantId) {
      filterExpressions.push('contains(merchantIds, :merchantId)');
      expressionAttributeValues[':merchantId'] = merchantId;
    }

    if (startDate && endDate) {
      filterExpressions.push('startDate >= :startDate AND endDate <= :endDate');
      expressionAttributeValues[':startDate'] = startDate;
      expressionAttributeValues[':endDate'] = endDate;
    }

    if (filterExpressions.length > 0) {
      params.FilterExpression = filterExpressions.join(' AND ');
      if (Object.keys(expressionAttributeNames).length > 0) {
        params.ExpressionAttributeNames = expressionAttributeNames;
      }
      params.ExpressionAttributeValues = expressionAttributeValues;
    }

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = JSON.parse(decodeURIComponent(lastEvaluatedKey));
    }

    const result = await dynamodb.send(new ScanCommand(params));

    return responseHelper.success(200, {
      promotions: result.Items,
      lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
      count: result.Items.length
    });
  } catch (error) {
    console.error('Error listing promotions:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// Validate promotion code
exports.validatePromotionCode = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const validation = validateInput(body, validatePromotionCodeSchema);
    if (!validation.isValid) {
      return responseHelper.error(400, 'Validation failed', validation.errors);
    }

    const { code, customerId, merchantId, orderAmount } = body;

    // Find promotion by code
    const promotionResult = await dynamodb.send(new QueryCommand({
      TableName: process.env.PROMOTIONS_TABLE,
      IndexName: 'Code-Index',
      KeyConditionExpression: 'code = :code',
      ExpressionAttributeValues: {
        ':code': code.toUpperCase()
      }
    }));

    if (!promotionResult.Items || promotionResult.Items.length === 0) {
      return responseHelper.error(404, 'Invalid promotion code');
    }

    const promotion = promotionResult.Items[0];
    const currentDate = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);

    // Validation checks
    const validationErrors = [];

    // Check if promotion is active
    if (!promotion.isActive) {
      validationErrors.push('Promotion is not active');
    }

    // Check date range
    if (currentDate < startDate) {
      validationErrors.push('Promotion has not started yet');
    }
    if (currentDate > endDate) {
      validationErrors.push('Promotion has expired');
    }

    // Check usage limit
    if (promotion.usageLimit && promotion.currentUsage >= promotion.usageLimit) {
      validationErrors.push('Promotion usage limit exceeded');
    }

    // Check minimum order amount
    if (promotion.minOrderAmount && orderAmount < promotion.minOrderAmount) {
      validationErrors.push(`Minimum order amount is $${promotion.minOrderAmount.toFixed(2)}`);
    }

    // Check merchant restriction
    if (promotion.merchantIds && promotion.merchantIds.length > 0 && merchantId) {
      if (!promotion.merchantIds.includes(merchantId)) {
        validationErrors.push('Promotion not applicable to this merchant');
      }
    }

    // Check user usage limit (would need to query usage history)
    if (promotion.userUsageLimit) {
      // This would require a separate table to track user usage
      // For now, we'll skip this check
    }

    if (validationErrors.length > 0) {
      return responseHelper.error(400, 'Promotion validation failed', validationErrors);
    }

    // Calculate discount
    let discountAmount = 0;
    switch (promotion.type) {
      case 'percentage':
        discountAmount = (orderAmount * promotion.value) / 100;
        if (promotion.maxDiscountAmount) {
          discountAmount = Math.min(discountAmount, promotion.maxDiscountAmount);
        }
        break;
      case 'fixed_amount':
        discountAmount = Math.min(promotion.value, orderAmount);
        break;
      case 'free_delivery':
        discountAmount = 5.99; // Assuming fixed delivery fee
        break;
      case 'bogo':
        // Buy one get one - would need more complex logic based on items
        discountAmount = 0; // Placeholder
        break;
      default:
        discountAmount = 0;
    }

    return responseHelper.success(200, {
      isValid: true,
      promotion: {
        promotionId: promotion.promotionId,
        name: promotion.name,
        description: promotion.description,
        type: promotion.type,
        code: promotion.code
      },
      discountAmount: Math.round(discountAmount * 100) / 100,
      message: 'Promotion code is valid'
    });
  } catch (error) {
    console.error('Error validating promotion code:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// Apply promotion (increment usage)
exports.applyPromotion = async (event) => {
  try {
    const { promotionId } = event.pathParameters;
    const body = JSON.parse(event.body);
    const { customerId, orderId } = body;

    if (!customerId || !orderId) {
      return responseHelper.error(400, 'Customer ID and Order ID are required');
    }

    // Check if promotion exists
    const existingPromotion = await dynamodb.send(new GetCommand({
      TableName: process.env.PROMOTIONS_TABLE,
      Key: { promotionId }
    }));

    if (!existingPromotion.Item) {
      return responseHelper.error(404, 'Promotion not found');
    }

    // Increment usage counter
    const result = await dynamodb.send(new UpdateCommand({
      TableName: process.env.PROMOTIONS_TABLE,
      Key: { promotionId },
      UpdateExpression: 'SET currentUsage = currentUsage + :increment, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':increment': 1,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    }));

    // Record usage in separate table (if needed for tracking)
    const usageRecord = {
      usageId: uuidv4(),
      promotionId,
      customerId,
      orderId,
      usedAt: new Date().toISOString()
    };

    await dynamodb.send(new PutCommand({
      TableName: process.env.PROMOTION_USAGE_TABLE,
      Item: usageRecord
    }));

    return responseHelper.success(200, result.Attributes, 'Promotion applied successfully');
  } catch (error) {
    console.error('Error applying promotion:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// Get promotion analytics
exports.getPromotionAnalytics = async (event) => {
  try {
    const { promotionId } = event.pathParameters;

    // Get promotion details
    const promotion = await dynamodb.send(new GetCommand({
      TableName: process.env.PROMOTIONS_TABLE,
      Key: { promotionId }
    }));

    if (!promotion.Item) {
      return responseHelper.error(404, 'Promotion not found');
    }

    // Get usage statistics
    const usageResult = await dynamodb.send(new QueryCommand({
      TableName: process.env.PROMOTION_USAGE_TABLE,
      IndexName: 'PromotionId-UsedAt-Index',
      KeyConditionExpression: 'promotionId = :promotionId',
      ExpressionAttributeValues: {
        ':promotionId': promotionId
      }
    }));

    const analytics = {
      promotion: promotion.Item,
      totalUsage: promotion.Item.currentUsage || 0,
      usageHistory: usageResult.Items || [],
      usageRate: promotion.Item.usageLimit ? 
        ((promotion.Item.currentUsage || 0) / promotion.Item.usageLimit * 100).toFixed(1) : 
        null,
      daysRemaining: Math.ceil((new Date(promotion.Item.endDate) - new Date()) / (1000 * 60 * 60 * 24)),
      isExpired: new Date() > new Date(promotion.Item.endDate)
    };

    return responseHelper.success(200, analytics);
  } catch (error) {
    console.error('Error fetching promotion analytics:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};
