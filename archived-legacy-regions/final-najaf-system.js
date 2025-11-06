#!/usr/bin/env node
/**
 * Complete Najaf Regions System with GADM Enhancement
 * Final dataset ready for production deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🏛️  NAJAF COMPREHENSIVE REGIONS SYSTEM');
console.log('=====================================');
console.log('📅 Generated:', new Date().toISOString());
console.log('🌍 Enhanced with GADM official boundaries');
console.log('=====================================\n');

// Load the enhanced regions
const { enhancedRegions, enhancedSummary, gadmFeatures } = require('./enhance-najaf-with-gadm.js');

// Create comprehensive export structure
const najafComprehensiveSystem = {
  metadata: {
    system_name: 'Najaf Comprehensive Regions System',
    version: '2.0.0',
    created_date: new Date().toISOString(),
    total_regions: enhancedSummary.total_regions,
    districts: enhancedSummary.districts,
    neighborhoods: enhancedSummary.neighborhoods,
    enhanced_districts: enhancedSummary.enhanced_districts,
    data_sources: [
      'Manual curation with authentic Iraqi district names',
      'GADM 4.1 Official Iraqi Administrative Boundaries',
      'Real-world GPS coordinates and delivery logistics'
    ],
    enhancement_features: [
      'Official polygon boundaries from GADM',
      'Precise centroid calculations',
      'Enhanced delivery radius estimation',
      'Comprehensive service configurations',
      'Population and business statistics',
      'Multi-level hierarchical structure'
    ]
  },
  
  // Summary statistics
  summary: enhancedSummary,
  
  // Complete regions dataset
  regions: enhancedRegions,
  
  // GADM boundary data for mapping
  boundary_data: {
    najaf_gadm_features: gadmFeatures,
    coordinate_system: 'WGS84',
    precision: '4 decimal places',
    source: 'GADM 4.1 Iraq Level 2'
  },
  
  // Delivery system configuration
  delivery_system: {
    governorate: 'Najaf',
    total_coverage_area_km2: enhancedRegions.reduce((sum, r) => sum + (r.statistics?.area_km2 || 0), 0),
    total_population: enhancedRegions.reduce((sum, r) => sum + (r.statistics?.population || 0), 0),
    active_drivers: enhancedRegions.reduce((sum, r) => sum + (r.statistics?.active_drivers || 0), 0),
    total_orders: enhancedRegions.reduce((sum, r) => sum + (r.statistics?.total_orders || 0), 0)
  }
};

// Export to JSON file
const exportPath = './najaf-comprehensive-system.json';
fs.writeFileSync(exportPath, JSON.stringify(najafComprehensiveSystem, null, 2));

console.log('📊 System Overview:');
console.log('==================');
console.log(`• Total Regions: ${najafComprehensiveSystem.metadata.total_regions}`);
console.log(`• Districts: ${najafComprehensiveSystem.metadata.districts}`);
console.log(`• Neighborhoods: ${najafComprehensiveSystem.metadata.neighborhoods}`);
console.log(`• GADM Enhanced: ${najafComprehensiveSystem.metadata.enhanced_districts} districts`);
console.log(`• Total Population: ${najafComprehensiveSystem.delivery_system.total_population.toLocaleString()}`);
console.log(`• Coverage Area: ${najafComprehensiveSystem.delivery_system.total_coverage_area_km2} km²`);
console.log(`• Active Drivers: ${najafComprehensiveSystem.delivery_system.active_drivers}`);
console.log(`• Total Orders: ${najafComprehensiveSystem.delivery_system.total_orders.toLocaleString()}`);

console.log('\n🏙️  Districts Overview:');
console.log('======================');
const districts = enhancedRegions.filter(r => r.level === 2);
districts.forEach((district, index) => {
  const neighborhoods = enhancedRegions.filter(r => r.parent_id === district.regionId);
  const enhanced = district.enhanced_with_gadm ? '🌍 GADM Enhanced' : '📍 Standard';
  console.log(`${index + 1}. ${district.name} (${district.name_ar}) - ${enhanced}`);
  console.log(`   📍 Coordinates: ${district.coordinates.lat}, ${district.coordinates.lng}`);
  console.log(`   🏘️  Neighborhoods: ${neighborhoods.length}`);
  console.log(`   👥 Population: ${district.statistics.population.toLocaleString()}`);
  console.log(`   📦 Orders: ${district.statistics.total_orders}`);
  console.log(`   🚗 Drivers: ${district.statistics.active_drivers}`);
  
  if (district.enhanced_with_gadm) {
    console.log(`   🌍 GADM ID: ${district.gadm_data.gid_2}`);
    console.log(`   📐 Boundary: ${district.boundary.coordinates[0].length} coordinate points`);
  }
  console.log('');
});

console.log('🏘️  Neighborhoods by District:');
console.log('==============================');
districts.forEach(district => {
  const neighborhoods = enhancedRegions.filter(r => r.parent_id === district.regionId);
  console.log(`\n📍 ${district.name} (${neighborhoods.length} neighborhoods):`);
  neighborhoods.forEach((neighborhood, index) => {
    console.log(`   ${index + 1}. ${neighborhood.name} (${neighborhood.name_ar})`);
    console.log(`      GPS: ${neighborhood.coordinates.lat}, ${neighborhood.coordinates.lng}`);
    console.log(`      Population: ${neighborhood.statistics.population.toLocaleString()}`);
  });
});

// Create DynamoDB ready export
const dynamoDbExport = enhancedRegions.map(region => ({
  ...region,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  source: 'najaf-comprehensive-system-v2',
  country: 'Iraq',
  country_code: 'IQ',
  data_version: '2.0'
}));

const dynamoPath = './najaf-regions-dynamodb-ready.json';
fs.writeFileSync(dynamoPath, JSON.stringify(dynamoDbExport, null, 2));

console.log('\n📦 Export Files Created:');
console.log('========================');
console.log(`✅ Complete System: ${exportPath}`);
console.log(`✅ DynamoDB Ready: ${dynamoPath}`);
console.log(`📏 File Sizes:`);
console.log(`   • Complete: ${(fs.statSync(exportPath).size / 1024).toFixed(1)} KB`);
console.log(`   • DynamoDB: ${(fs.statSync(dynamoPath).size / 1024).toFixed(1)} KB`);

console.log('\n🚀 Deployment Instructions:');
console.log('===========================');
console.log('1. Upload to DynamoDB:');
console.log('   aws dynamodb batch-write-item --request-items file://najaf-regions-dynamodb-ready.json');
console.log('');
console.log('2. Or use AWS SDK in Node.js:');
console.log('   const regions = require("./najaf-regions-dynamodb-ready.json");');
console.log('   // Upload using DynamoDB DocumentClient');
console.log('');
console.log('3. Verify in admin panel:');
console.log('   • Check cascading dropdowns work');
console.log('   • Verify GPS coordinates display correctly');
console.log('   • Test delivery area calculations');

console.log('\n✅ Najaf Comprehensive Regions System Complete!');
console.log('🌍 Enhanced with official GADM boundaries');
console.log('📊 Ready for production deployment');

module.exports = najafComprehensiveSystem;
