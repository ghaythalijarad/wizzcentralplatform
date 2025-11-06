#!/usr/bin/env node
/**
 * Quick Upload Script - Add Comprehensive Najaf Regions
 * Adds all 20 regions (4 districts + 16 neighborhoods) to the database
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

// Configure DynamoDB client (same as local-dev-server.js)
const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: process.env.AWS_PROFILE ? undefined : {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});
const docClient = DynamoDBDocumentClient.from(client);

// Set environment variables for local development
process.env.AWS_REGION = process.env.AWS_REGION || 'us-east-1';
process.env.AWS_PROFILE = process.env.AWS_PROFILE || 'wizz-drivers-ghayth-dev';

const TABLE_NAME = 'WizzCentral_Regions';

console.log('🚀 UPLOADING COMPREHENSIVE NAJAF REGIONS');
console.log('==========================================\n');

// Load our comprehensive regions
const { najafRegions } = require('./create-najaf-complete-regions.js');

async function uploadRegions() {
    console.log(`📊 Uploading ${najafRegions.length} regions...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const region of najafRegions) {
        try {
            await docClient.send(new PutCommand({
                TableName: TABLE_NAME,
                Item: {
                    ...region,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    source: 'najaf-comprehensive-upload'
                }
            }));
            
            successCount++;
            const icon = region.level === 2 ? '🏙️' : '🏘️';
            console.log(`${icon} [${successCount}/${najafRegions.length}] ✅ ${region.name}`);
            console.log(`   ${region.name_ar}`);
            console.log(`   GPS: ${region.coordinates.lat}, ${region.coordinates.lng}\n`);
            
        } catch (error) {
            errorCount++;
            console.error(`❌ Failed to upload ${region.name}: ${error.message}\n`);
        }
        
        // Small delay to avoid throttling
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    console.log('\n📊 UPLOAD COMPLETE');
    console.log('==================');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    if (successCount > 0) {
        console.log('\n🎉 Najaf comprehensive regions uploaded!');
        console.log('\n🔄 Please refresh the Regions Management page to see:');
        console.log('   • 4 Districts (Level 2)');
        console.log('   • 16 Neighborhoods (Level 3)');
        console.log('   • Complete Arabic/English names');
        console.log('   • Enhanced GPS coordinates');
    }
}

uploadRegions().catch(console.error);
