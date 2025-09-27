#!/usr/bin/env node
/**
 * Debug WebSocket Connections Script
 * Checks what's in the websocket connections table
 */

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, ScanCommand } = require("@aws-sdk/lib-dynamodb");

// Initialize DynamoDB client
const dynamoDBClient = new DynamoDBClient({ region: "us-east-1" });
const dynamoDB = DynamoDBDocumentClient.from(dynamoDBClient);

const WEBSOCKET_CONNECTIONS_TABLE = 'WizzUser_websocket_connections_dev';

async function debugWebSocketConnections() {
    try {
        console.log('🔍 Scanning all WebSocket connections...');
        
        // First, get all connections without any filter
        const allConnections = await dynamoDB.send(new ScanCommand({
            TableName: WEBSOCKET_CONNECTIONS_TABLE
        }));

        console.log(`\n📊 Total connections in table: ${allConnections.Items?.length || 0}`);
        
        if (allConnections.Items && allConnections.Items.length > 0) {
            console.log('\n📋 All connections:');
            allConnections.Items.forEach((connection, index) => {
                console.log(`\n  ${index + 1}. Connection ID: ${connection.connectionId}`);
                console.log(`     Driver ID: ${connection.driverId || 'N/A'}`);
                console.log(`     User ID: ${connection.userId || 'N/A'}`);
                console.log(`     Connection Status: ${connection.connectionStatus || 'N/A'}`);
                console.log(`     User Type: ${connection.userType || 'N/A'}`);
                console.log(`     Created At: ${connection.createdAt || 'N/A'}`);
                console.log(`     Last Activity: ${connection.lastActivity || 'N/A'}`);
            });

            // Check for connections with driverId
            const driversConnections = allConnections.Items.filter(conn => conn.driverId);
            console.log(`\n🚗 Connections with driverId: ${driversConnections.length}`);
            
            // Check for connected status
            const connectedConnections = allConnections.Items.filter(conn => conn.connectionStatus === 'connected');
            console.log(`🟢 Connections with 'connected' status: ${connectedConnections.length}`);
            
            // Check for both driverId and connected status
            const connectedDrivers = allConnections.Items.filter(conn => 
                conn.driverId && conn.connectionStatus === 'connected'
            );
            console.log(`🎯 Connected drivers ready for assignments: ${connectedDrivers.length}`);
            
            if (connectedDrivers.length > 0) {
                console.log('\n🚗 Connected drivers:');
                connectedDrivers.forEach((driver, index) => {
                    console.log(`  ${index + 1}. Driver ID: ${driver.driverId}`);
                    console.log(`     Connection ID: ${driver.connectionId}`);
                    console.log(`     Last Activity: ${driver.lastActivity}`);
                });
            }
            
        } else {
            console.log('\n❌ No connections found in the table');
        }
        
    } catch (error) {
        console.error('❌ Error scanning WebSocket connections:', error.message);
        console.error('Full error:', error);
    }
}

// Run the debug function
debugWebSocketConnections()
    .then(() => {
        console.log('\n✅ Debug complete');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Debug failed:', error);
        process.exit(1);
    });
