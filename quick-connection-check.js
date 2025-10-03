#!/usr/bin/env node

// Quick connection checker
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

console.log('🔍 Quick WebSocket Connection Check');
console.log('=' .repeat(40));

async function checkConnections() {
    try {
        const result = await docClient.send(new ScanCommand({
            TableName: 'WizzUser_websocket_connections_dev'
        }));
        
        const connections = result.Items || [];
        const driverConnections = connections.filter(conn => 
            conn.userType === 'driver' || conn.driverId
        );
        
        console.log(`📊 Total connections: ${connections.length}`);
        console.log(`🚗 Driver connections: ${driverConnections.length}`);
        
        if (driverConnections.length > 0) {
            console.log('\n✅ DRIVERS ARE CONNECTED!');
            console.log('🎯 Assignment system should work now');
            
            driverConnections.forEach((conn, i) => {
                console.log(`   ${i+1}. Driver: ${conn.userId || conn.driverId}`);
                console.log(`      Status: ${conn.connectionStatus || 'unknown'}`);
            });
        } else {
            console.log('\n❌ NO DRIVERS CONNECTED');
            console.log('💡 Start WizzDriver Flutter app and go online');
        }
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

setInterval(checkConnections, 5000); // Check every 5 seconds
checkConnections();
