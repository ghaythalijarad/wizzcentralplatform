const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, QueryCommand, GetCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
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

exports.updateProduct = async (event) => {
  try {
    console.log('=== UPDATE PRODUCT START ===');

    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const { merchantId, productId } = event.pathParameters;
    if (!merchantId || !productId) {
      return responseHelper.error(400, 'Merchant ID and Product ID are required');
    }

    const data = JSON.parse(event.body);
    console.log('Received data for update:', data);

    // Basic validation
    if (!data.name || !data.price || !data.categoryId) {
      return responseHelper.error(400, 'Product name, price, and category are required');
    }

    const {
      name,
      name_ar,
      description,
      description_ar,
      price,
      categoryId,
      preparation_time,
      is_available,
      image_url,
      allergens,
      ingredients
    } = data;

    const updateExpression = `
      SET #name = :name, 
          #name_ar = :name_ar, 
          #description = :description, 
          #description_ar = :description_ar, 
          #price = :price, 
          #categoryId = :categoryId, 
          #preparation_time = :preparation_time, 
          #is_available = :is_available, 
          #image_url = :image_url, 
          #allergens = :allergens, 
          #ingredients = :ingredients,
          #updated_at = :updated_at
    `;

    const expressionAttributeNames = {
      '#name': 'name',
      '#name_ar': 'name_ar',
      '#description': 'description',
      '#description_ar': 'description_ar',
      '#price': 'price',
      '#categoryId': 'categoryId',
      '#preparation_time': 'preparation_time',
      '#is_available': 'is_available',
      '#image_url': 'image_url',
      '#allergens': 'allergens',
      '#ingredients': 'ingredients',
      '#updated_at': 'updated_at'
    };

    const expressionAttributeValues = {
      ':name': name,
      ':name_ar': name_ar || null,
      ':description': description || null,
      ':description_ar': description_ar || null,
      ':price': price,
      ':categoryId': categoryId,
      ':preparation_time': preparation_time || 0,
      ':is_available': is_available,
      ':image_url': image_url || null,
      ':allergens': allergens || [],
      ':ingredients': ingredients || [],
      ':updated_at': new Date().toISOString()
    };

    const params = {
      TableName: PRODUCTS_TABLE,
      Key: {
        productId: productId
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ConditionExpression: 'attribute_exists(productId) AND businessId = :merchantId',
      ReturnValues: 'ALL_NEW'
    };
    
    // Add merchantId to expression attribute values for the condition check
    expressionAttributeValues[':merchantId'] = merchantId;


    console.log('Updating product with params:', JSON.stringify(params, null, 2));

    const result = await dynamodb.send(new UpdateCommand(params));

    console.log('Product updated successfully:', result.Attributes);

    return responseHelper.success(200, {
      message: 'Product updated successfully',
      product: result.Attributes
    });

  } catch (error) {
    console.error('Update product error:', error);
    if (error.name === 'ConditionalCheckFailedException') {
      return responseHelper.error(403, 'Update failed: Product does not exist or does not belong to this merchant.');
    }
    return responseHelper.serverError('Failed to update product');
  }
};
