const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
const responseHelper = require('../utils/response');

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(client);

const PRODUCTS_TABLE = 'order-receiver-products-dev';
const CATEGORIES_TABLE = 'order-receiver-categories-dev';

// Get all categories
exports.getCategories = async (event) => {
  try {
    console.log('=== GET CATEGORIES START ===');
    
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    console.log('Scanning categories table:', CATEGORIES_TABLE);

    const result = await dynamodb.send(new ScanCommand({
      TableName: CATEGORIES_TABLE
    }));

    console.log(`Found ${result.Items?.length || 0} categories`);

    // Transform categories to a simple map structure
    const categories = {};
    if (result.Items) {
      result.Items.forEach(item => {
        categories[item.categoryId] = item.name || item.name_ar || 'Unknown Category';
      });
    }

    return responseHelper.success(200, {
      categories,
      count: Object.keys(categories).length
    });

  } catch (error) {
    console.error('Get categories error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    console.error('Event object:', JSON.stringify(event, null, 2));
    return responseHelper.serverError('Failed to load categories');
  }
};

// Get products by business ID
exports.getProductsByBusiness = async (event) => {
  try {
    console.log('=== GET PRODUCTS BY BUSINESS START ===');
    
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const { merchantId } = event.pathParameters;
    
    if (!merchantId) {
      return responseHelper.error(400, 'Merchant ID is required');
    }

    console.log('Loading products for merchant:', merchantId);

    // Scan products table with filter for businessId (the field name in DynamoDB)
    const result = await dynamodb.send(new ScanCommand({
      TableName: PRODUCTS_TABLE,
      FilterExpression: 'businessId = :businessId',
      ExpressionAttributeValues: {
        ':businessId': merchantId
      }
    }));

    console.log(`Found ${result.Items?.length || 0} products for merchant ${merchantId}`);

    const products = result.Items || [];

    // Log sample product for debugging
    if (products.length > 0) {
      console.log('Sample product:', JSON.stringify(products[0], null, 2));
    }

    return responseHelper.success(200, {
      products,
      count: products.length,
      merchantId
    });

  } catch (error) {
    console.error('Get products by business error:', error);
    return responseHelper.serverError('Failed to load products');
  }
};

// Get all products (with optional business filter)
exports.getProducts = async (event) => {
  try {
    console.log('=== GET PRODUCTS START ===');
    
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const { businessId, categoryId, limit = 100 } = event.queryStringParameters || {};

    console.log('Query parameters:', { businessId, categoryId, limit });

    let scanParams = {
      TableName: PRODUCTS_TABLE,
      Limit: parseInt(limit)
    };

    // Add filters if provided
    const filterExpressions = [];
    const expressionAttributeValues = {};

    if (businessId) {
      filterExpressions.push('businessId = :businessId');
      expressionAttributeValues[':businessId'] = businessId;
    }

    if (categoryId) {
      filterExpressions.push('categoryId = :categoryId');
      expressionAttributeValues[':categoryId'] = categoryId;
    }

    if (filterExpressions.length > 0) {
      scanParams.FilterExpression = filterExpressions.join(' AND ');
      scanParams.ExpressionAttributeValues = expressionAttributeValues;
    }

    console.log('Scan params:', scanParams);

    const result = await dynamodb.send(new ScanCommand(scanParams));

    console.log(`Found ${result.Items?.length || 0} products`);

    const products = result.Items || [];

    return responseHelper.success(200, {
      products,
      count: products.length,
      filters: { businessId, categoryId }
    });

  } catch (error) {
    console.error('Get products error:', error);
    return responseHelper.serverError('Failed to load products');
  }
};

// Get single product by ID
exports.getProduct = async (event) => {
  try {
    console.log('=== GET PRODUCT START ===');
    
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const { productId } = event.pathParameters;

    if (!productId) {
      return responseHelper.error(400, 'Product ID is required');
    }

    console.log('Loading product:', productId);

    const result = await dynamodb.send(new GetCommand({
      TableName: PRODUCTS_TABLE,
      Key: {
        productId: productId
      }
    }));

    const product = result.Item;

    if (!product) {
      return responseHelper.notFound('Product not found');
    }

    console.log('Found product:', JSON.stringify(product, null, 2));

    return responseHelper.success(200, { product });

  } catch (error) {
    console.error('Get product error:', error);
    return responseHelper.serverError('Failed to load product');
  }
};

// Get products by merchant ID (duplicate of getProductsByBusiness, but using correct naming)
exports.getProductsByMerchant = async (event) => {
  try {
    console.log('=== GET PRODUCTS BY MERCHANT START ===');
    
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const { merchantId } = event.pathParameters;
    
    if (!merchantId) {
      return responseHelper.error(400, 'Merchant ID is required');
    }

    console.log('Loading products for merchant:', merchantId);

    const result = await dynamodb.send(new ScanCommand({
      TableName: PRODUCTS_TABLE,
      FilterExpression: 'businessId = :businessId',
      ExpressionAttributeValues: {
        ':businessId': merchantId
      }
    }));

    console.log(`Found ${result.Items?.length || 0} products for merchant ${merchantId}`);

    const products = result.Items || [];

    return responseHelper.success(200, {
      products,
      count: products.length,
      merchantId
    });

  } catch (error) {
    console.error('Get products by merchant error:', error);
    return responseHelper.serverError('Failed to load products');
  }
};
