#!/usr/bin/env node
/**
 * Upload Complete Najaf Regions to DynamoDB
 * Uploads districts and neighborhoods with proper hierarchy
 */

const AWS = require('aws-sdk');
const { najafRegions, summary } = require('./create-najaf-complete-regions');

console.log('🚀 Uploading Complete Najaf Regions to DynamoDB');
console.log('===============================================\n');

// Configure AWS DynamoDB
AWS.config.update({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'WizzCentral_Regions';

async function uploadNajafRegions() {
  try {
    console.log(`📊 Summary: ${summary.total_regions} regions (${summary.districts} districts, ${summary.neighborhoods} neighborhoods)`);
    console.log(`👥 Total Population: ${summary.total_population.toLocaleString()}`);
    console.log(`🚛 Active Drivers: ${summary.active_drivers}\n`);

    let uploadCount = 0;
    let errors = 0;

    for (const region of najafRegions) {
      try {
        console.log(`⬆️  Uploading: ${region.name} (${region.name_ar}) - Level ${region.level}`);
        
        const item = {
          id: region.regionId,
          name: region.name,
          name_ar: region.name_ar,
          level: region.level === 2 ? 'district' : 'neighborhood',
          parent_id: region.parent_id,
          governorate_id: region.governorate_id,
          coordinates: region.coordinates,
          is_active: region.is_active,
          service_config: region.service_config,
          statistics: region.statistics,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Add delivery_config for districts
        if (region.delivery_config) {
          item.delivery_config = region.delivery_config;
        }

        const params = {
          TableName: TABLE_NAME,
          Item: item,
          ConditionExpression: 'attribute_not_exists(id)'
        };

        await dynamodb.put(params).promise();
        uploadCount++;
        console.log(`   ✅ Success`);
        
        // Small delay to avoid throttling
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        if (error.code === 'ConditionalCheckFailedException') {
          console.log(`   ⚠️  Already exists: ${region.name}`);
        } else {
          console.log(`   ❌ Error: ${error.message}`);
          errors++;
        }
      }
    }

    console.log('\n📊 Upload Results:');
    console.log('=================');
    console.log(`✅ Successfully uploaded: ${uploadCount} regions`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📍 Total processed: ${najafRegions.length}`);

    if (uploadCount > 0) {
      console.log('\n🎉 Najaf regions successfully added to WizzCentral!');
      console.log('🔗 Test the API endpoints:');
      console.log('   • http://localhost:3000/api/regions?parent_id=najaf');
      console.log('   • http://localhost:3000/api/regions?parent_id=najaf_central');
      console.log('   • http://localhost:3000/api/regions?parent_id=najaf_kufa');
    }

  } catch (error) {
    console.error('💥 Upload failed:', error);
    process.exit(1);
  }
}

// Verify Najaf governorate exists first
async function verifyNajafExists() {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: { id: 'najaf' }
    };
    
    const result = await dynamodb.get(params).promise();
    
    if (!result.Item) {
      console.log('❌ Najaf governorate not found in database!');
      console.log('📝 Please ensure Najaf governorate exists before uploading districts.');
      process.exit(1);
    }
    
    console.log('✅ Najaf governorate found in database');
    console.log(`   Name: ${result.Item.name} (${result.Item.name_ar})`);
    console.log(`   Population: ${result.Item.statistics?.population || 'N/A'}\n`);
    
    return true;
  } catch (error) {
    console.error('💥 Error checking Najaf governorate:', error);
    process.exit(1);
  }
}

async function main() {
  console.log('🔍 Verifying Najaf governorate exists...');
  await verifyNajafExists();
  
  console.log('🚀 Starting upload process...');
  await uploadNajafRegions();
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { uploadNajafRegions, verifyNajafExists };
