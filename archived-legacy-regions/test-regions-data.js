#!/usr/bin/env node
/**
 * Test Script - Verify Najaf Regions Data
 */

console.log('🔍 Testing Najaf Regions Data...');
console.log('================================\n');

try {
    // Load the regions
    const { najafRegions, summary } = require('./create-najaf-complete-regions.js');
    
    console.log('✅ Regions data loaded successfully!');
    console.log(`📊 Total regions: ${najafRegions.length}`);
    console.log(`🏙️ Districts: ${summary.districts}`);
    console.log(`🏘️ Neighborhoods: ${summary.neighborhoods}`);
    
    console.log('\n📋 Sample regions:');
    najafRegions.slice(0, 3).forEach(region => {
        console.log(`   • ${region.name} (${region.name_ar}) - Level ${region.level}`);
    });
    
    console.log('\n🚀 Ready for upload!');
    
} catch (error) {
    console.error('❌ Error loading regions:', error.message);
}
