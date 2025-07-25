// Handler for order-receiver-businesses-dev table
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const BUSINESSES_TABLE = 'order-receiver-businesses-dev';

// Get all businesses from order-receiver-businesses-dev table
exports.getBusinesses = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: ''
      };
    }

    console.log('Fetching businesses from DynamoDB table:', BUSINESSES_TABLE);

    // Scan the businesses table
    const params = {
      TableName: BUSINESSES_TABLE
    };

    const result = await dynamodb.scan(params).promise();
    console.log('DynamoDB scan result:', result);

    // Transform the data to match our frontend format
    const businesses = result.Items.map(item => ({
      businessId: item.businessId,
      businessName: item.businessName || item.name,
      email: item.email || item.contactEmail,
      phone: item.phone || item.contactPhone,
      status: item.status || 'unknown',
      category: item.category || item.businessType || 'Unknown',
      owner: item.owner || item.ownerName,
      createdAt: item.createdAt || item.registrationDate,
      address: item.address || item.businessAddress,
      logo: item.logo,
      description: item.description,
      rating: item.rating,
      ordersToday: item.ordersToday || 0,
      revenueToday: item.revenueToday || 0,
      commission: item.commission || 0
    }));

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        businesses: businesses,
        count: businesses.length
      })
    };

  } catch (error) {
    console.error('Error fetching businesses:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to fetch businesses',
        message: error.message
      })
    };
  }
};

// Update business status
exports.updateBusinessStatus = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: ''
      };
    }

    if (event.httpMethod !== 'PUT') {
      return {
        statusCode: 405,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    const { businessId } = event.pathParameters || {};
    const requestBody = JSON.parse(event.body || '{}');
    const { status, reason } = requestBody;

    if (!businessId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Business ID is required' })
      };
    }

    if (!status) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ error: 'Status is required' })
      };
    }

    // Validate status
    const validStatuses = ['pending', 'approved', 'unknown', 'suspended'];
    if (!validStatuses.includes(status)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          error: 'Invalid status',
          validStatuses: validStatuses
        })
      };
    }

    console.log(`Updating business ${businessId} status to ${status}`);

    // Update the business status in DynamoDB
    const updateParams = {
      TableName: BUSINESSES_TABLE,
      Key: {
        businessId: businessId
      },
      UpdateExpression: 'SET #status = :status, #lastUpdated = :lastUpdated',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#lastUpdated': 'lastUpdated'
      },
      ExpressionAttributeValues: {
        ':status': status,
        ':lastUpdated': new Date().toISOString()
      },
      ReturnValues: 'ALL_NEW'
    };

    // Add reason if provided
    if (reason) {
      updateParams.UpdateExpression += ', #statusReason = :statusReason';
      updateParams.ExpressionAttributeNames['#statusReason'] = 'statusReason';
      updateParams.ExpressionAttributeValues[':statusReason'] = reason;
    }

    const result = await dynamodb.update(updateParams).promise();
    console.log('Update result:', result);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Business status updated successfully',
        business: result.Attributes
      })
    };

  } catch (error) {
    console.error('Error updating business status:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to update business status',
        message: error.message
      })
    };
  }
};
