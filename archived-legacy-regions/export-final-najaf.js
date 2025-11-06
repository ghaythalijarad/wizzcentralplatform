const fs = require('fs');

console.log('🏛️  CREATING NAJAF COMPREHENSIVE EXPORT');
console.log('======================================\n');

// Load enhanced regions
const { enhancedRegions, enhancedSummary } = require('./enhance-najaf-with-gadm.js');

console.log(`✅ Loaded ${enhancedRegions.length} enhanced regions`);
console.log(`📊 Enhanced Districts: ${enhancedSummary.enhanced_districts}/${enhancedSummary.districts}`);

// Create DynamoDB ready export
const dynamoDbExport = enhancedRegions.map(region => ({
  ...region,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  source: 'najaf-comprehensive-system-v2-gadm-enhanced',
  country: 'Iraq',
  country_code: 'IQ',
  data_version: '2.0'
}));

// Save the file
const exportPath = './najaf-regions-final.json';
fs.writeFileSync(exportPath, JSON.stringify(dynamoDbExport, null, 2));

console.log(`\n📦 Export created: ${exportPath}`);
console.log(`📏 File size: ${(fs.statSync(exportPath).size / 1024).toFixed(1)} KB`);

// Show summary
console.log('\n📊 Final Dataset Summary:');
console.log('=========================');
const districts = enhancedRegions.filter(r => r.level === 2);
const neighborhoods = enhancedRegions.filter(r => r.level === 3);
const enhanced = enhancedRegions.filter(r => r.enhanced_with_gadm);

console.log(`• Total Regions: ${enhancedRegions.length}`);
console.log(`• Districts: ${districts.length}`);
console.log(`• Neighborhoods: ${neighborhoods.length}`);
console.log(`• GADM Enhanced: ${enhanced.length} districts`);
console.log(`• Total Population: ${enhancedRegions.reduce((sum, r) => sum + (r.statistics?.population || 0), 0).toLocaleString()}`);

console.log('\n🌍 Enhanced Districts:');
enhanced.forEach(district => {
  console.log(`  • ${district.name} - GADM ID: ${district.gadm_data.gid_2}`);
  console.log(`    GPS: ${district.coordinates.lat}, ${district.coordinates.lng}`);
});

console.log('\n✅ Najaf regions system complete and ready for deployment!');

module.exports = dynamoDbExport;
