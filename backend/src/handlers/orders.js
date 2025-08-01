const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  PutCommand,
  GetCommand,
  UpdateCommand,
  QueryCommand,
  ScanCommand
} = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');
const Joi = require('joi');

const responseHelper = require('../utils/response');
const { validateInput } = require('../utils/validation');
const { verifyToken } = require('../utils/auth');
const { sendEmail } = require('../utils/email');

// Import merchant integration functionality
const merchantIntegration = require('./merchant-integration');

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

// Validation schemas
const createOrderSchema = Joi.object({
  customerId: Joi.string().required(),
  merchantId: Joi.string().required(),
  items: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    price: Joi.number().positive().required(),
    quantity: Joi.number().integer().positive().required(),
    options: Joi.array().items(Joi.string()).optional()
  })).min(1).required(),
  deliveryAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zipCode: Joi.string().required(),
    coordinates: Joi.object({
      lat: Joi.number().required(),
      lng: Joi.number().required()
    }).optional()
  }).required(),
  paymentMethod: Joi.string().valid('card', 'cash', 'digital_wallet').required(),
  specialInstructions: Joi.string().max(500).optional(),
  promotionCode: Joi.string().optional()
});

const updateOrderSchema = Joi.object({
  status: Joi.string().valid(
    'pending', 'confirmed', 'preparing', 'ready_for_pickup',
    'picked_up', 'out_for_delivery', 'delivered', 'cancelled'
  ).required(),
  driverId: Joi.string().when('status', {
    is: 'picked_up',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  estimatedDeliveryTime: Joi.date().iso().optional(),
  actualDeliveryTime: Joi.date().iso().when('status', {
    is: 'delivered',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  cancellationReason: Joi.string().when('status', {
    is: 'cancelled',
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

// Create new order
exports.createOrder = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const validation = validateInput(body, createOrderSchema);
    if (!validation.isValid) {
      return responseHelper.error(400, 'Validation failed', validation.errors);
    }

    // Calculate totals
    const subtotal = body.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const deliveryFee = 5.99; // Static for now, can be dynamic based on distance
    const tax = subtotal * 0.08; // 8% tax
    const total = subtotal + deliveryFee + tax;

    const orderId = uuidv4();
    const timestamp = new Date().toISOString();

    const order = {
      orderId,
      customerId: body.customerId,
      merchantId: body.merchantId,
      items: body.items,
      deliveryAddress: body.deliveryAddress,
      paymentMethod: body.paymentMethod,
      specialInstructions: body.specialInstructions || '',
      promotionCode: body.promotionCode || null,
      status: 'pending',
      subtotal: Math.round(subtotal * 100) / 100,
      deliveryFee: Math.round(deliveryFee * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      createdAt: timestamp,
      updatedAt: timestamp,
      estimatedDeliveryTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(), // 45 minutes from now
      orderNumber: `WZ${Date.now().toString().slice(-6)}`
    };

    await dynamodb.send(new PutCommand({
      TableName: process.env.ORDERS_TABLE,
      Item: order
    }));

    // Send confirmation emails (implement as needed)
    // await sendOrderConfirmationEmail(order);

    return responseHelper.success(201, order, 'Order created successfully');
  } catch (error) {
    console.error('Error creating order:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// Get order by ID
exports.getOrder = async (event) => {
  try {
    const { orderId } = event.pathParameters;

    const result = await dynamodb.send(new GetCommand({
      TableName: process.env.ORDERS_TABLE,
      Key: { orderId }
    }));

    if (!result.Item) {
      return responseHelper.error(404, 'Order not found');
    }

    return responseHelper.success(200, result.Item);
  } catch (error) {
    console.error('Error fetching order:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// Update order
exports.updateOrder = async (event) => {
  try {
    const { orderId } = event.pathParameters;
    const body = JSON.parse(event.body);
    const validation = validateInput(body, updateOrderSchema);
    
    if (!validation.isValid) {
      return responseHelper.error(400, 'Validation failed', validation.errors);
    }

    // Check if order exists
    const existingOrder = await dynamodb.send(new GetCommand({
      TableName: process.env.ORDERS_TABLE,
      Key: { orderId }
    }));

    if (!existingOrder.Item) {
      return responseHelper.error(404, 'Order not found');
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
      TableName: process.env.ORDERS_TABLE,
      Key: { orderId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    }));

    return responseHelper.success(200, result.Attributes, 'Order updated successfully');
  } catch (error) {
    console.error('Error updating order:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// List orders with filters
exports.listOrders = async (event) => {
  try {
    const {
      status,
      customerId,
      merchantId,
      driverId,
      startDate,
      endDate,
      limit = 50,
      lastEvaluatedKey
    } = event.queryStringParameters || {};

    let params = {
      TableName: process.env.ORDERS_TABLE,
      Limit: parseInt(limit)
    };

    // Add filters
    const filterExpressions = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};

    if (status) {
      filterExpressions.push('#status = :status');
      expressionAttributeNames['#status'] = 'status';
      expressionAttributeValues[':status'] = status;
    }

    if (customerId) {
      filterExpressions.push('customerId = :customerId');
      expressionAttributeValues[':customerId'] = customerId;
    }

    if (merchantId) {
      filterExpressions.push('merchantId = :merchantId');
      expressionAttributeValues[':merchantId'] = merchantId;
    }

    if (driverId) {
      filterExpressions.push('driverId = :driverId');
      expressionAttributeValues[':driverId'] = driverId;
    }

    if (startDate && endDate) {
      filterExpressions.push('createdAt BETWEEN :startDate AND :endDate');
      expressionAttributeValues[':startDate'] = startDate;
      expressionAttributeValues[':endDate'] = endDate;
    }

    if (filterExpressions.length > 0) {
      params.FilterExpression = filterExpressions.join(' AND ');
      params.ExpressionAttributeNames = expressionAttributeNames;
      params.ExpressionAttributeValues = expressionAttributeValues;
    }

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = JSON.parse(decodeURIComponent(lastEvaluatedKey));
    }

    const result = await dynamodb.send(new ScanCommand(params));

    return responseHelper.success(200, {
      orders: result.Items,
      lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
      count: result.Items.length
    });
  } catch (error) {
    console.error('Error listing orders:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// Get customer orders
exports.getCustomerOrders = async (event) => {
  try {
    const { customerId } = event.pathParameters;
    const { limit = 20, lastEvaluatedKey } = event.queryStringParameters || {};

    const params = {
      TableName: process.env.ORDERS_TABLE,
      IndexName: 'CustomerId-CreatedAt-Index',
      KeyConditionExpression: 'customerId = :customerId',
      ExpressionAttributeValues: {
        ':customerId': customerId
      },
      ScanIndexForward: false, // Latest first
      Limit: parseInt(limit)
    };

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = JSON.parse(decodeURIComponent(lastEvaluatedKey));
    }

    const result = await dynamodb.send(new QueryCommand(params));

    return responseHelper.success(200, {
      orders: result.Items,
      lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
      count: result.Items.length
    });
  } catch (error) {
    console.error('Error fetching customer orders:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// Get merchant orders
exports.getMerchantOrders = async (event) => {
  try {
    const { merchantId } = event.pathParameters;
    const { status, limit = 20, lastEvaluatedKey } = event.queryStringParameters || {};

    let params = {
      TableName: process.env.ORDERS_TABLE,
      IndexName: 'MerchantId-CreatedAt-Index',
      KeyConditionExpression: 'merchantId = :merchantId',
      ExpressionAttributeValues: {
        ':merchantId': merchantId
      },
      ScanIndexForward: false, // Latest first
      Limit: parseInt(limit)
    };

    if (status) {
      params.FilterExpression = '#status = :status';
      params.ExpressionAttributeNames = { '#status': 'status' };
      params.ExpressionAttributeValues[':status'] = status;
    }

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = JSON.parse(decodeURIComponent(lastEvaluatedKey));
    }

    const result = await dynamodb.send(new QueryCommand(params));

    return responseHelper.success(200, {
      orders: result.Items,
      lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
      count: result.Items.length
    });
  } catch (error) {
    console.error('Error fetching merchant orders:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// Get driver orders
exports.getDriverOrders = async (event) => {
  try {
    const { driverId } = event.pathParameters;
    const { status, limit = 20, lastEvaluatedKey } = event.queryStringParameters || {};

    let params = {
      TableName: process.env.ORDERS_TABLE,
      IndexName: 'DriverId-CreatedAt-Index',
      KeyConditionExpression: 'driverId = :driverId',
      ExpressionAttributeValues: {
        ':driverId': driverId
      },
      ScanIndexForward: false, // Latest first
      Limit: parseInt(limit)
    };

    if (status) {
      params.FilterExpression = '#status = :status';
      params.ExpressionAttributeNames = { '#status': 'status' };
      params.ExpressionAttributeValues[':status'] = status;
    }

    if (lastEvaluatedKey) {
      params.ExclusiveStartKey = JSON.parse(decodeURIComponent(lastEvaluatedKey));
    }

    const result = await dynamodb.send(new QueryCommand(params));

    return responseHelper.success(200, {
      orders: result.Items,
      lastEvaluatedKey: result.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) : null,
      count: result.Items.length
    });
  } catch (error) {
    console.error('Error fetching driver orders:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};

// Cancel order
exports.cancelOrder = async (event) => {
  try {
    const { orderId } = event.pathParameters;
    const body = JSON.parse(event.body);
    const { reason } = body;

    if (!reason) {
      return responseHelper.error(400, 'Cancellation reason is required');
    }

    // Check if order exists and can be cancelled
    const existingOrder = await dynamodb.send(new GetCommand({
      TableName: process.env.ORDERS_TABLE,
      Key: { orderId }
    }));

    if (!existingOrder.Item) {
      return responseHelper.error(404, 'Order not found');
    }

    const order = existingOrder.Item;
    const nonCancellableStatuses = ['delivered', 'cancelled'];
    
    if (nonCancellableStatuses.includes(order.status)) {
      return responseHelper.error(400, `Cannot cancel order with status: ${order.status}`);
    }

    const result = await dynamodb.send(new UpdateCommand({
      TableName: process.env.ORDERS_TABLE,
      Key: { orderId },
      UpdateExpression: 'SET #status = :status, cancellationReason = :reason, updatedAt = :updatedAt',
      ExpressionAttributeNames: {
        '#status': 'status'
      },
      ExpressionAttributeValues: {
        ':status': 'cancelled',
        ':reason': reason,
        ':updatedAt': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    }));

    return responseHelper.success(200, result.Attributes, 'Order cancelled successfully');
  } catch (error) {
    console.error('Error cancelling order:', error);
    return responseHelper.error(500, 'Internal server error');
  }
};
