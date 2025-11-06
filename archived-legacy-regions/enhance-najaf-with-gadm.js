const fs = require('fs');
const path = require('path');

console.log('🔍 Loading GADM Iraq administrative boundaries...');

// Load GADM Iraq data first
const gadmPath = '/Users/ghaythallaheebi/Downloads/gadm41_IRQ_2.json';
let gadmData;
try {
  gadmData = JSON.parse(fs.readFileSync(gadmPath, 'utf8'));
  console.log(`✅ GADM data loaded: ${gadmData.features.length} features found`);
} catch (error) {
  console.error('❌ Error loading GADM data:', error.message);
  process.exit(1);
}

// Load existing Najaf regions
console.log('📋 Loading existing Najaf regions...');
let najafRegions, summary;
try {
  const regionsModule = require('./create-najaf-complete-regions.js');
  najafRegions = regionsModule.najafRegions;
  summary = regionsModule.summary;
  console.log(`✅ Najaf regions loaded: ${najafRegions.length} regions found`);
} catch (error) {
  console.error('❌ Error loading Najaf regions:', error.message);
  process.exit(1);
}

// Extract Najaf-specific districts from GADM
console.log('📍 Extracting Najaf districts from GADM data...');
const najafGadmFeatures = gadmData.features.filter(feature => 
  feature.properties.NAME_1 === 'An-Najaf'
);

console.log(`✅ Found ${najafGadmFeatures.length} Najaf districts in GADM:`);
najafGadmFeatures.forEach(feature => {
  console.log(`  • ${feature.properties.NAME_2} (${feature.properties.ENGTYPE_2})`);
});

// Create mapping between GADM districts and existing regions
const districtMapping = {
  'Najaf': 'najaf_central',
  'AlKufa': 'najaf_kufa', 
  'AlManathera': 'najaf_manathera',
  'AlMishkhab': 'najaf_mishkhab'
};

// Function to calculate centroid from polygon coordinates
function calculateCentroid(coordinates) {
  // Handle different geometry types
  let allCoords = [];
  
  if (coordinates[0] && Array.isArray(coordinates[0][0])) {
    // MultiPolygon or Polygon with holes
    allCoords = coordinates[0][0];
  } else if (coordinates[0] && Array.isArray(coordinates[0])) {
    // Simple Polygon
    allCoords = coordinates[0];
  } else {
    // Direct coordinate array
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

// Function to calculate approximate radius from polygon bounds
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
  
  // Calculate distance between opposite corners
  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;
  
  // Approximate radius in meters (rough conversion for Iraq region)
  const radiusKm = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff) * 111.32 / 2;
  return Math.round(radiusKm * 1000); // Convert to meters
}

// Enhance existing regions with GADM boundary data
console.log('\n🔧 Enhancing regions with GADM boundary data...');

const enhancedRegions = najafRegions.map(region => {
  // Only enhance level 2 districts
  if (region.level === 2) {
    // Find matching GADM feature
    const gadmDistrict = najafGadmFeatures.find(feature => {
      const gadmName = feature.properties.NAME_2;
      return districtMapping[gadmName] === region.regionId;
    });
    
    if (gadmDistrict) {
      console.log(`  ✅ Enhancing ${region.name} with GADM boundary data...`);
      
      // Calculate precise centroid and radius from GADM geometry
      const geometry = gadmDistrict.geometry;
      const centroid = calculateCentroid(geometry.coordinates);
      const radius = calculateRadius(geometry.coordinates);
      
      // Add GADM boundary data to region
      return {
        ...region,
        // Update coordinates with more precise centroid
        coordinates: {
          lat: Math.round(centroid.lat * 10000) / 10000, // 4 decimal precision
          lng: Math.round(centroid.lng * 10000) / 10000,
          radius: radius
        },
        // Add boundary geometry for advanced features
        boundary: {
          type: geometry.type,
          coordinates: geometry.coordinates
        },
        // Add GADM metadata
        gadm_data: {
          gid_2: gadmDistrict.properties.GID_2,
          name_2: gadmDistrict.properties.NAME_2,
          engtype_2: gadmDistrict.properties.ENGTYPE_2,
          cc_2: gadmDistrict.properties.CC_2
        },
        // Mark as enhanced
        enhanced_with_gadm: true,
        enhancement_date: new Date().toISOString()
      };
    } else {
      console.log(`  ⚠️  No GADM match found for ${region.name}`);
      return region;
    }
  }
  
  // Return neighborhoods unchanged for now
  return region;
});

// Enhanced summary
const enhancedSummary = {
  ...summary,
  enhanced_districts: enhancedRegions.filter(r => r.enhanced_with_gadm).length,
  enhancement_date: new Date().toISOString(),
  gadm_source: 'gadm41_IRQ_2.json',
  data_quality: 'Official Iraqi Administrative Boundaries'
};

console.log('\n📊 Enhanced Najaf Regions Summary:');
console.log('==================================');
console.log(`• Total Regions: ${enhancedSummary.total_regions}`);
console.log(`• Enhanced Districts: ${enhancedSummary.enhanced_districts}/${enhancedSummary.districts}`);
console.log(`• Neighborhoods: ${enhancedSummary.neighborhoods}`);
console.log(`• Data Source: ${enhancedSummary.gadm_source}`);
console.log(`• Enhancement Date: ${enhancedSummary.enhancement_date}`);

// Show enhanced districts with new coordinates
console.log('\n🌍 Enhanced District Coordinates:');
console.log('=================================');
const enhancedDistricts = enhancedRegions.filter(r => r.level === 2 && r.enhanced_with_gadm);
enhancedDistricts.forEach(district => {
  console.log(`• ${district.name}`);
  console.log(`  Original: lat ${najafRegions.find(r => r.regionId === district.regionId).coordinates.lat}, lng ${najafRegions.find(r => r.regionId === district.regionId).coordinates.lng}`);
  console.log(`  Enhanced: lat ${district.coordinates.lat}, lng ${district.coordinates.lng} (radius: ${district.coordinates.radius}m)`);
  console.log(`  GADM ID: ${district.gadm_data.gid_2}`);
});

// Export enhanced data
module.exports = { 
  enhancedRegions, 
  enhancedSummary,
  gadmFeatures: najafGadmFeatures 
};

console.log('\n✅ Najaf regions successfully enhanced with GADM boundary data!');
console.log('🚀 Ready for database upload...');
