/**
 * AWS WebSocket Connection Handler
 * Manages real-time connections for merchant apps
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, DeleteCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const { ApiGatewayManagementApiClient, PostToConnectionCommand } = require('@aws-sdk/client-apigatewaymanagementapi');

const dynamoDbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamodb = DynamoDBDocumentClient.from(dynamoDbClient);

const CONNECTIONS_TABLE = process.env.WEBSOCKET_CONNECTIONS_TABLE || 'websocket-connections-dev';

exports.connect = async (event) => {
    console.log('WebSocket Connect:', event);
    
    const connectionId = event.requestContext.connectionId;
    const stage = event.requestContext.stage;
    const domainName = event.requestContext.domainName;
    
    // Extract merchant/business ID from query parameters
    const queryParams = event.queryStringParameters || {};
    const businessId = queryParams.businessId;
    const userType = queryParams.userType || 'merchant'; // merchant, driver, customer
    
    if (!businessId) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'businessId is required' })
        };
    }
    
    try {
        // Store connection in DynamoDB
        await dynamodb.put({
            TableName: CONNECTIONS_TABLE,
            Item: {
                connectionId,
                businessId,
                userType,
                stage,
                domainName,
                connectedAt: new Date().toISOString(),
                ttl: Math.floor(Date.now() / 1000) + (2 * 60 * 60) // 2 hours TTL
            }
        }).promise();
        
        console.log(`✅ WebSocket connection stored: ${connectionId} for business: ${businessId}`);
        
        // Send welcome message
        const apiGateway = new AWS.ApiGatewayManagementApi({
            endpoint: `https://${domainName}/${stage}`
        });
        
        await apiGateway.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify({
                type: 'connection_established',
                message: 'Connected to WizzCentral real-time notifications',
                businessId,
                connectionId
            })
        }).promise();
        
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Connected successfully' })
        };
        
    } catch (error) {
        console.error('WebSocket connection error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to connect' })
        };
    }
};

exports.disconnect = async (event) => {
    console.log('WebSocket Disconnect:', event);
    
    const connectionId = event.requestContext.connectionId;
    
    try {
        // Remove connection from DynamoDB
        await dynamodb.delete({
            TableName: CONNECTIONS_TABLE,
            Key: { connectionId }
        }).promise();
        
        console.log(`✅ WebSocket connection removed: ${connectionId}`);
        
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Disconnected successfully' })
        };
        
    } catch (error) {
        console.error('WebSocket disconnect error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to disconnect' })
        };
    }
};

exports.defaultHandler = async (event) => {
    console.log('WebSocket Default Handler:', event);
    
    const connectionId = event.requestContext.connectionId;
    const stage = event.requestContext.stage;
    const domainName = event.requestContext.domainName;
    
    try {
        const apiGateway = new AWS.ApiGatewayManagementApi({
            endpoint: `https://${domainName}/${stage}`
        });
        
        await apiGateway.postToConnection({
            ConnectionId: connectionId,
            Data: JSON.stringify({
                type: 'ping_response',
                message: 'Connection is active',
                timestamp: new Date().toISOString()
            })
        }).promise();
        
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Ping successful' })
        };
        
    } catch (error) {
        console.error('WebSocket default handler error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to handle message' })
        };
    }
};

// Helper function to get connections for a business
exports.getBusinessConnections = async (businessId) => {
    try {
        const result = await dynamodb.query({
            TableName: CONNECTIONS_TABLE,
            IndexName: 'BusinessIdIndex',
            KeyConditionExpression: 'businessId = :businessId',
            ExpressionAttributeValues: {
                ':businessId': businessId
            }
        }).promise();
        
        return result.Items || [];
    } catch (error) {
        console.error('Error getting business connections:', error);
        return [];
    }
};
