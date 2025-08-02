// /backend/src/handlers/customer_handlers.js

const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

const MERCHANTS_TABLE = process.env.MERCHANTS_TABLE;
// NOTE: This is hardcoded for now based on inspection of your other files.
// For a production system, this should be passed as an environment variable in serverless.yml
const PRODUCTS_TABLE = "wizz-merchant-products-dev";

/**
 * Handler to list all active merchants.
 * Fetches merchants from DynamoDB where 'isActive' is true.
 */
module.exports.listMerchants = async (event) => {
    const params = {
        TableName: MERCHANTS_TABLE,
        FilterExpression: "isActive = :isActive",
        ExpressionAttributeValues: {
            ":isActive": true
        }
    };

    try {
        const result = await dynamoDb.scan(params).promise();
        return {
            statusCode: 200,
            headers: {
                "Access-Control-Allow-Origin": "*", // Enable CORS
            },
            body: JSON.stringify(result.Items),
        };
    } catch (error) {
        console.error("Error fetching merchants:", error);
        return {
            statusCode: 500,
            headers: {
                "Access-Control-Allow-Origin": "*",
            },
            body: JSON.stringify({ message: "Could not fetch merchants." }),
        };
    }
};

/**
 * Handler to get detailed information for a single merchant.
 */
module.exports.getMerchantDetails = async (event) => {
    const params = {
        TableName: MERCHANTS_TABLE,
        Key: {
            businessId: event.pathParameters.businessId,
        },
    };

    try {
        const result = await dynamoDb.get(params).promise();
        if (result.Item) {
            return {
                statusCode: 200,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify(result.Item),
            };
        } else {
            return {
                statusCode: 404,
                headers: { "Access-Control-Allow-Origin": "*" },
                body: JSON.stringify({ message: "Merchant not found." }),
            };
        }
    } catch (error) {
        console.error("Error fetching merchant details:", error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: "Could not fetch merchant details." }),
        };
    }
};

/**
 * Handler to get all products for a specific merchant.
 * This assumes a Global Secondary Index (GSI) named 'businessId-index' on the products table.
 */
module.exports.getMerchantProducts = async (event) => {
    const params = {
        TableName: PRODUCTS_TABLE,
        IndexName: 'businessId-index', // Assumption: A GSI on businessId exists
        KeyConditionExpression: "businessId = :businessId",
        ExpressionAttributeValues: {
            ":businessId": event.pathParameters.businessId
        }
    };

    try {
        const result = await dynamoDb.query(params).promise();
        return {
            statusCode: 200,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify(result.Items),
        };
    } catch (error) {
        console.error("Error fetching merchant products:", error);
        return {
            statusCode: 500,
            headers: { "Access-Control-Allow-Origin": "*" },
            body: JSON.stringify({ message: "Could not fetch merchant products. Please ensure the table and indexes are correctly configured." }),
        };
    }
};
