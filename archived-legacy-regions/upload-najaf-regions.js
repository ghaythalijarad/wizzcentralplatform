#!/usr/bin/env node
/**
 * Upload Najaf Regions to DynamoDB
 * Populates 3 districts and 13 neighborhoods with real GPS coordinates
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const fs = require('fs');
const path = require('path');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'WizzCentral_Regions';

console.log('📤 UPLOADING NAJAF REGIONS TO DYNAMODB');
console.log('=====================================');
console.log(`📊 Table: ${TABLE_NAME}`);
console.log(`🌍 Region: us-east-1`);
console.log('=====================================\n');

// Load enhanced regions from our GADM-enhanced script
console.log('🔄 Loading enhanced Najaf regions with GADM boundary data...');
let regions, summary;

try {
  const enhancedData = require('./enhance-najaf-with-gadm.js');
  regions = enhancedData.enhancedRegions;
  summary = enhancedData.enhancedSummary;
  console.log(`✅ Loaded ${regions.length} enhanced regions\n`);
  console.log(`📊 Enhanced Districts: ${summary.enhanced_districts}/${summary.districts}`);
  console.log(`🌍 GADM Source: ${summary.gadm_source}`);
  console.log(`📅 Enhancement Date: ${summary.enhancement_date}\n`);
} catch (error) {
  console.error('❌ Error loading enhanced regions:', error.message);
  process.exit(1);
}

// Count by level
const districts = regions.filter(r => r.level === 2);
const neighborhoods = regions.filter(r => r.level === 3);

console.log('📋 Regions to upload:');
console.log(`   Districts (Level 2): ${districts.length}`);
console.log(`   Neighborhoods (Level 3): ${neighborhoods.length}`);
console.log(`   Total: ${regions.length}\n`);

// Upload function
async function uploadRegions() {
  let successCount = 0;
  let errorCount = 0;
  
  console.log('🚀 Starting upload...\n');
  
  for (const region of regions) {
    try {
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: region
      }));
      
      successCount++;
      const icon = region.level === 2 ? '🏙️' : '🏘️';
      const status = region.is_active ? '✅' : '❌';
      const enhanced = region.enhanced_with_gadm ? '🌍 GADM' : '📍 Standard';
      console.log(`${icon} [${successCount}/${regions.length}] ${status} ${region.name} (${region.name_ar}) - ${enhanced}`);
      console.log(`   ID: ${region.regionId}`);
      console.log(`   GPS: ${region.coordinates.lat}, ${region.coordinates.lng}`);
      if (region.enhanced_with_gadm) {
        console.log(`   GADM ID: ${region.gadm_data.gid_2}`);
        console.log(`   Boundary: ${region.boundary.type} with ${region.boundary.coordinates[0].length} coordinate points`);
      }
      console.log('');
      
      // Small delay to avoid throttling
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      errorCount++;
      console.error(`❌ Error uploading ${region.regionId}: ${error.message}\n`);
    }
  }
  
  console.log('\n=====================================');
  console.log('📊 UPLOAD COMPLETE');
  console.log('=====================================');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('=====================================\n');
  
  if (successCount > 0) {
    console.log('🎉 Enhanced Najaf regions are now in DynamoDB!');
    console.log('\n📍 You now have:');
    console.log(`   • ${districts.length} districts in Najaf`);
    console.log(`   • ${neighborhoods.length} neighborhoods with real GPS`);
    console.log(`   • ${summary.enhanced_districts} districts enhanced with official GADM boundaries`);
    console.log(`   • Precise polygon coordinates for advanced mapping`);
    console.log('\n🌍 GADM Enhancement Features:');
    console.log('   • Official Iraqi administrative boundaries');
    console.log('   • Precise centroid calculations');
    console.log('   • Polygon boundary data for mapping');
    console.log('   • Enhanced delivery radius calculations');
    console.log('\n🌐 View in admin panel:');
    console.log('   http://localhost:3000/pages/regions.html');
    console.log('\n✨ Test in apps:');
    console.log('   • Filter by governorate: Najaf');
    console.log('   • See cascading dropdowns work');
    console.log('   • Verify enhanced GPS coordinates');
    console.log('   • Test improved delivery area calculations\n');
  }
}

// Run the upload
uploadRegions().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
