#!/usr/bin/env node
console.log("Testing server startup...");

try {
    // Test basic Express
    console.log("1. Testing Express...");
    const express = require('express');
    console.log("✅ Express loaded");

    // Test AWS SDK
    console.log("2. Testing AWS SDK...");
    const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
    const { DynamoDBDocumentClient, GetCommand, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
    console.log("✅ AWS SDK loaded");

    // Test client creation
    console.log("3. Testing DynamoDB client creation...");
    const ddbClient = new DynamoDBClient({
        region: 'us-east-1',
    });
    const dynamoDB = DynamoDBDocumentClient.from(ddbClient);
    console.log("✅ DynamoDB client created");

    // Test basic Express app
    console.log("4. Testing Express app creation...");
    const app = express();
    console.log("✅ Express app created");

    // Test server start
    console.log("5. Starting server...");
    const server = app.listen(3001, () => {
        console.log("✅ Test server started on port 3001");
        console.log("🎉 All components working!");
        server.close();
        process.exit(0);
    });

} catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
}
