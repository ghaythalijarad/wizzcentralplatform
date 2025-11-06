#!/usr/bin/env node
/**
 * Populate WizzCentral_Regions table with data
 * Use this if table exists but is empty
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ 
    region: process.env.AWS_REGION || 'us-east-1'
});

const dynamoDB = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'WizzCentral_Regions';

// Load the regions data from the main create script
const { initialRegions } = require('./regions-data');

async function populateTable() {
    try {
        console.log('🗺️  Populating WizzCentral_Regions table...\n');
        
        // Check current item count
        const scanResult = await dynamoDB.send(new ScanCommand({
            TableName: TABLE_NAME,
            Select: 'COUNT'
        }));
        
        console.log(`📊 Current items in table: ${scanResult.Count}`);
        
        if (scanResult.Count > 0) {
            console.log('\n⚠️  Table already has data.');
            console.log('   Do you want to add more data anyway? (This may create duplicates)');
            console.log('   Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
        
        console.log('\n📝 Inserting regions data...');
        let successCount = 0;
        let errorCount = 0;
        
        for (const region of initialRegions) {
            try {
                await dynamoDB.send(new PutCommand({
                    TableName: TABLE_NAME,
                    Item: region
                }));
                console.log(`   ✅ ${region.name} (${region.name_ar})`);
                successCount++;
            } catch (error) {
                console.error(`   ❌ Failed: ${region.name} - ${error.message}`);
                errorCount++;
            }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ DATA POPULATION COMPLETE');
        console.log('='.repeat(60));
        console.log(`\nSuccessfully added: ${successCount}`);
        console.log(`Failed: ${errorCount}`);
        console.log(`Total in regions data: ${initialRegions.length}`);
        console.log('');
        
    } catch (error) {
        console.error('❌ Error populating table:', error);
        throw error;
    }
}

// Run if executed directly
if (require.main === module) {
    populateTable()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { populateTable };
