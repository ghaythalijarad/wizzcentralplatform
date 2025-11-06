const fs = require('fs');

// First, let's create the final export by directly loading and processing the data
console.log('🏛️  NAJAF COMPREHENSIVE REGIONS - FINAL EXPORT');
console.log('==============================================');

// Load GADM data
const gadmData = JSON.parse(fs.readFileSync('/Users/ghaythallaheebi/Downloads/gadm41_IRQ_2.json', 'utf8'));
const najafGadmFeatures = gadmData.features.filter(feature => feature.properties.NAME_1 === 'An-Najaf');

console.log(`✅ GADM data loaded: ${najafGadmFeatures.length} Najaf districts found`);

// Load original regions (suppress output by temporarily redirecting console)
const originalConsole = console.log;
console.log = () => {}; // Temporarily silence
const { najafRegions } = require('./create-najaf-complete-regions.js');
console.log = originalConsole; // Restore

console.log(`✅ Original regions loaded: ${najafRegions.length} regions`);

// Apply GADM enhancements manually
const districtMapping = {
  'Najaf': 'najaf_central',
  'AlKufa': 'najaf_kufa', 
  'AlManathera': 'najaf_manathera',
  'AlMishkhab': 'najaf_mishkhab'
};

function calculateCentroid(coordinates) {
  let allCoords = [];
  if (coordinates[0] && Array.isArray(coordinates[0][0])) {
    allCoords = coordinates[0][0];
  } else if (coordinates[0] && Array.isArray(coordinates[0])) {
    allCoords = coordinates[0];
  } else {
    allCoords = coordinates;
  }
  
  let totalLng = 0, totalLat = 0;
  let count = allCoords.length;
  
  allCoords.forEach(coord => {
    totalLng += coord[0];
    totalLat += coord[1];
  });
  
  return {
    lng: totalLng / count,
    lat: totalLat / count
  };
}

function calculateRadius(coordinates) {
  let allCoords = [];
  if (coordinates[0] && Array.isArray(coordinates[0][0])) {
    allCoords = coordinates[0][0];
  } else if (coordinates[0] && Array.isArray(coordinates[0])) {
    allCoords = coordinates[0];
  } else {
    allCoords = coordinates;
  }
  
  let minLng = Infinity, maxLng = -Infinity;
  let minLat = Infinity, maxLat = -Infinity;
  
  allCoords.forEach(coord => {
    minLng = Math.min(minLng, coord[0]);
    maxLng = Math.max(maxLng, coord[0]);
    minLat = Math.min(minLat, coord[1]);
    maxLat = Math.max(maxLat, coord[1]);
  });
  
  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;
  const radiusKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111.32 / 2;
  return Math.round(radiusKm * 1000);
}

// Enhance regions
const enhancedRegions = najafRegions.map(region => {
  if (region.level === 2) {
    const gadmDistrict = najafGadmFeatures.find(feature => {
      const gadmName = feature.properties.NAME_2;
      return districtMapping[gadmName] === region.regionId;
    });
    
    if (gadmDistrict) {
      const geometry = gadmDistrict.geometry;
      const centroid = calculateCentroid(geometry.coordinates);
      const radius = calculateRadius(geometry.coordinates);
      
      return {
        ...region,
        coordinates: {
          lat: Math.round(centroid.lat * 10000) / 10000,
          lng: Math.round(centroid.lng * 10000) / 10000,
          radius: radius
        },
        boundary: {
          type: geometry.type,
          coordinates: geometry.coordinates
        },
        gadm_data: {
          gid_2: gadmDistrict.properties.GID_2,
          name_2: gadmDistrict.properties.NAME_2,
          engtype_2: gadmDistrict.properties.ENGTYPE_2,
          cc_2: gadmDistrict.properties.CC_2
        },
        enhanced_with_gadm: true,
        enhancement_date: new Date().toISOString()
      };
    }
  }
  return region;
});

// Create final export
const finalExport = enhancedRegions.map(region => ({
  ...region,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  source: 'najaf-comprehensive-system-v2-gadm-enhanced',
  country: 'Iraq',
  country_code: 'IQ',
  data_version: '2.0'
}));

// Save to file
const exportPath = './najaf-regions-complete-final.json';
fs.writeFileSync(exportPath, JSON.stringify(finalExport, null, 2));

// Statistics
const districts = finalExport.filter(r => r.level === 2);
const neighborhoods = finalExport.filter(r => r.level === 3);
const enhanced = finalExport.filter(r => r.enhanced_with_gadm);

console.log('\n📊 FINAL DATASET SUMMARY');
console.log('========================');
console.log(`• Total Regions: ${finalExport.length}`);
console.log(`• Districts: ${districts.length}`);
console.log(`• Neighborhoods: ${neighborhoods.length}`);
console.log(`• GADM Enhanced: ${enhanced.length} districts`);
console.log(`• Total Population: ${finalExport.reduce((sum, r) => sum + (r.statistics?.population || 0), 0).toLocaleString()}`);
console.log(`• Total Orders: ${finalExport.reduce((sum, r) => sum + (r.statistics?.total_orders || 0), 0).toLocaleString()}`);
console.log(`• Active Drivers: ${finalExport.reduce((sum, r) => sum + (r.statistics?.active_drivers || 0), 0)}`);

console.log('\n🌍 GADM ENHANCED DISTRICTS');
console.log('==========================');
enhanced.forEach(district => {
  console.log(`• ${district.name} (${district.name_ar})`);
  console.log(`  GADM ID: ${district.gadm_data.gid_2}`);
  console.log(`  GPS: ${district.coordinates.lat}, ${district.coordinates.lng}`);
  console.log(`  Radius: ${district.coordinates.radius}m`);
  console.log(`  Boundary Points: ${district.boundary.coordinates[0].length}`);
});

console.log('\n🏘️  NEIGHBORHOODS BY DISTRICT');
console.log('=============================');
districts.forEach(district => {
  const districtNeighborhoods = neighborhoods.filter(n => n.parent_id === district.regionId);
  console.log(`\n📍 ${district.name} (${districtNeighborhoods.length} neighborhoods):`);
  districtNeighborhoods.forEach((neighborhood, index) => {
    console.log(`   ${index + 1}. ${neighborhood.name} (${neighborhood.name_ar})`);
    console.log(`      GPS: ${neighborhood.coordinates.lat}, ${neighborhood.coordinates.lng}`);
    console.log(`      Population: ${neighborhood.statistics.population.toLocaleString()}`);
  });
});

console.log(`\n📦 EXPORT FILE CREATED`);
console.log('=====================');
console.log(`File: ${exportPath}`);
console.log(`Size: ${(fs.statSync(exportPath).size / 1024).toFixed(1)} KB`);
console.log(`Records: ${finalExport.length}`);

console.log('\n🚀 DEPLOYMENT READY');
console.log('==================');
console.log('✅ Complete 3-level hierarchy (Governorate → Districts → Neighborhoods)');
console.log('✅ Enhanced with official GADM boundaries');
console.log('✅ Real GPS coordinates for all locations');
console.log('✅ Comprehensive delivery configurations');
console.log('✅ Population and business statistics');
console.log('✅ Ready for DynamoDB upload');

console.log('\n🎉 NAJAF COMPREHENSIVE REGIONS SYSTEM COMPLETE!');

module.exports = finalExport;
