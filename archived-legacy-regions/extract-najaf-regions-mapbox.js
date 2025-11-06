#!/usr/bin/env node
/**
 * Extract Najaf Regions from Mapbox Geocoding API
 * Creates comprehensive 3-level hierarchy: Governorate → District → Neighborhood
 * Uses real GPS coordinates and official place names
 */

const fetch = require('node-fetch');
const fs = require('fs');
require('dotenv').config({ path: '.env.mapbox' });

const MAPBOX_TOKEN = process.env.MAPBOX_ACCESS_TOKEN;
const BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

console.log('🗺️  NAJAF REGION EXTRACTION FROM MAPBOX');
console.log('==========================================');
console.log(`🔑 Token: ${MAPBOX_TOKEN ? '✅ Loaded' : '❌ Missing'}`);
console.log('==========================================\n');

if (!MAPBOX_TOKEN) {
  console.error('❌ Error: MAPBOX_ACCESS_TOKEN not found in .env.mapbox');
  process.exit(1);
}

// Najaf known districts and neighborhoods to search for
const najafSearchQueries = [
  // Main city center
  'النجف، العراق',
  'Najaf, Iraq',
  'النجف الأشرف، العراق',
  
  // Major districts
  'مركز النجف، العراق',
  'الكوفة، النجف، العراق',
  'المشخاب، النجف، العراق',
  'المناذرة، النجف، العراق',
  
  // Old City neighborhoods
  'المدينة القديمة، النجف، العراق',
  'Old City, Najaf, Iraq',
  'الحويش، النجف، العراق',
  'البراق، النجف، العراق',
  'العمارة، النجف، العراق',
  
  // Central neighborhoods
  'حي السعد، النجف، العراق',
  'حي الأمير، النجف، العراق',
  'حي الجامعة، النجف، العراق',
  'حي المعلمين، النجف، العراق',
  'حي الأطباء، النجف، العراق',
  'حي القضاة، النجف، العراق',
  'حي المهندسين، النجف، العراق',
  'حي الضباط، النجف، العراق',
  'حي الثورة، النجف، العراق',
  'حي الجديدة، النجف، العراق',
  
  // Religious/Historic areas
  'الصحن الشريف، النجف، العراق',
  'بحر النجف، العراق',
  'وادي السلام، النجف، العراق',
  
  // Modern neighborhoods
  'حي النصر، النجف، العراق',
  'حي الزهراء، النجف، العراق',
  'حي الإسكان، النجف، العراق',
  'حي الميلاد، النجف، العراق',
  'حي الجوادين، النجف، العراق',
  
  // Kufa area neighborhoods
  'الكوفة القديمة، النجف، العراق',
  'حي النهضة، الكوفة، العراق',
  'حي العسكري، الكوفة، العراق',
  'حي الجمعية، الكوفة، العراق',
  
  // Main roads/landmarks
  'شارع الرسول، النجف، العراق',
  'شارع الكوفة، النجف، العراق',
  'شارع السياحي، النجف، العراق',
  'شارع الصادق، النجف، العراق'
];

// Store extracted regions
const extractedRegions = {
  districts: [],
  neighborhoods: []
};

// Sleep function for rate limiting
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch place data from Mapbox
async function fetchPlaceData(query) {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `${BASE_URL}/${encodedQuery}.json?access_token=${MAPBOX_TOKEN}&country=IQ&limit=5&types=place,locality,neighborhood,district`;
    
    console.log(`🔍 Searching: ${query}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(`❌ Error fetching ${query}: ${error.message}`);
    return null;
  }
}

// Extract relevant region info from Mapbox feature
function extractRegionInfo(feature, query) {
  const placeType = feature.place_type[0];
  const coordinates = feature.center;
  const placeName = feature.text;
  const placeNameArabic = feature.text_ar || feature.text;
  const context = feature.context || [];
  
  // Extract bounding box for radius calculation
  let radius = 5000; // default 5km
  if (feature.bbox) {
    const [minLng, minLat, maxLng, maxLat] = feature.bbox;
    const latDiff = maxLat - minLat;
    const lngDiff = maxLng - minLng;
    const avgDiff = (latDiff + lngDiff) / 2;
    // Rough conversion: 1 degree ≈ 111km
    radius = Math.round((avgDiff * 111000) / 2); // Convert to meters and take radius
    radius = Math.min(Math.max(radius, 2000), 15000); // Clamp between 2km and 15km
  }
  
  // Determine level based on place_type
  let level = 3; // Default to neighborhood
  if (placeType === 'place' || placeType === 'district') {
    // If population > 100k or name contains "district"/"قضاء", it's a district
    const hasDistrictKeyword = placeName.includes('District') || 
                               placeName.includes('قضاء') || 
                               placeName.includes('مركز');
    level = hasDistrictKeyword ? 2 : 3;
  }
  
  return {
    query: query,
    name: placeName,
    name_ar: placeNameArabic,
    level: level,
    type: placeType,
    coordinates: {
      lat: coordinates[1],
      lng: coordinates[0],
      radius: radius
    },
    bbox: feature.bbox,
    relevance: feature.relevance,
    fullName: feature.place_name,
    context: context.map(c => ({ type: c.id.split('.')[0], name: c.text }))
  };
}

// Generate regionId from name
function generateRegionId(name, level, parentId) {
  const cleanName = name
    .toLowerCase()
    .replace(/[أإآ]/g, 'a')
    .replace(/ة/g, 'h')
    .replace(/ى/g, 'a')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_')
    .substring(0, 30);
  
  if (level === 2) {
    return `najaf_${cleanName}`;
  } else {
    const parent = parentId ? parentId.split('_').pop() : 'central';
    return `najaf_${parent}_${cleanName}`;
  }
}

// Main extraction function
async function extractNajafRegions() {
  console.log(`📋 Processing ${najafSearchQueries.length} search queries...\n`);
  
  let processedCount = 0;
  
  for (const query of najafSearchQueries) {
    processedCount++;
    console.log(`[${processedCount}/${najafSearchQueries.length}] Processing: ${query}`);
    
    const data = await fetchPlaceData(query);
    
    if (!data || !data.features || data.features.length === 0) {
      console.log(`   ⚠️  No results found\n`);
      continue;
    }
    
    // Process each feature
    for (const feature of data.features) {
      const regionInfo = extractRegionInfo(feature, query);
      
      // Only keep results with high relevance (> 0.6) and in Najaf governorate
      if (regionInfo.relevance < 0.6) {
        console.log(`   ⏭️  Skipped: ${regionInfo.name} (low relevance: ${regionInfo.relevance})`);
        continue;
      }
      
      // Check if it's actually in Najaf
      const isInNajaf = regionInfo.fullName.includes('Najaf') || 
                        regionInfo.fullName.includes('النجف') ||
                        regionInfo.context.some(c => c.name.includes('Najaf') || c.name.includes('النجف'));
      
      if (!isInNajaf) {
        console.log(`   ⏭️  Skipped: ${regionInfo.name} (not in Najaf)`);
        continue;
      }
      
      // Check for duplicates
      const targetArray = regionInfo.level === 2 ? extractedRegions.districts : extractedRegions.neighborhoods;
      const isDuplicate = targetArray.some(r => 
        r.name === regionInfo.name || 
        (Math.abs(r.coordinates.lat - regionInfo.coordinates.lat) < 0.01 && 
         Math.abs(r.coordinates.lng - regionInfo.coordinates.lng) < 0.01)
      );
      
      if (isDuplicate) {
        console.log(`   ⏭️  Skipped: ${regionInfo.name} (duplicate)`);
        continue;
      }
      
      targetArray.push(regionInfo);
      console.log(`   ✅ Extracted: ${regionInfo.name} (${regionInfo.name_ar}) - Level ${regionInfo.level}`);
      console.log(`      📍 Coordinates: ${regionInfo.coordinates.lat.toFixed(4)}, ${regionInfo.coordinates.lng.toFixed(4)}`);
      console.log(`      📏 Radius: ${regionInfo.coordinates.radius}m\n`);
    }
    
    // Rate limiting: Wait 200ms between requests to respect Mapbox API limits
    await sleep(200);
  }
  
  console.log('\n==========================================');
  console.log('📊 EXTRACTION COMPLETE');
  console.log('==========================================');
  console.log(`Districts extracted: ${extractedRegions.districts.length}`);
  console.log(`Neighborhoods extracted: ${extractedRegions.neighborhoods.length}`);
  console.log(`Total regions: ${extractedRegions.districts.length + extractedRegions.neighborhoods.length}`);
  console.log('==========================================\n');
}

// Convert to DynamoDB format
function convertToDynamoDBFormat() {
  const dynamoDBRegions = [];
  
  // Add districts
  extractedRegions.districts.forEach(district => {
    const regionId = generateRegionId(district.name, 2, 'najaf');
    dynamoDBRegions.push({
      regionId: regionId,
      name: district.name,
      name_ar: district.name_ar,
      level: 2,
      parent_id: 'najaf',
      governorate_id: 'najaf',
      coordinates: district.coordinates,
      is_active: true,
      service_config: { delivery: true, pickup: false, express: false, standard: true },
      statistics: { population: 0, area_km2: 0, total_orders: 0, active_drivers: 0 },
      delivery_config: {
        base_fee: 2500,
        per_km_fee: 600,
        minimum_order: 18000,
        free_delivery_threshold: 55000,
        estimated_time_minutes: 50
      },
      metadata: {
        source: 'mapbox',
        extracted_at: new Date().toISOString(),
        bbox: district.bbox
      }
    });
  });
  
  // Add neighborhoods - try to assign to best matching district
  extractedRegions.neighborhoods.forEach(neighborhood => {
    // Find closest district
    let closestDistrict = null;
    let minDistance = Infinity;
    
    extractedRegions.districts.forEach(district => {
      const distance = Math.sqrt(
        Math.pow(neighborhood.coordinates.lat - district.coordinates.lat, 2) +
        Math.pow(neighborhood.coordinates.lng - district.coordinates.lng, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestDistrict = district;
      }
    });
    
    const parentId = closestDistrict ? generateRegionId(closestDistrict.name, 2, 'najaf') : 'najaf_central';
    const regionId = generateRegionId(neighborhood.name, 3, parentId);
    
    dynamoDBRegions.push({
      regionId: regionId,
      name: neighborhood.name,
      name_ar: neighborhood.name_ar,
      level: 3,
      parent_id: parentId,
      governorate_id: 'najaf',
      coordinates: neighborhood.coordinates,
      is_active: true,
      service_config: { delivery: true, pickup: false, express: false, standard: true },
      statistics: { population: 0, area_km2: 0, total_orders: 0, active_drivers: 0 },
      delivery_config: {
        base_fee: 2500,
        per_km_fee: 600,
        minimum_order: 18000,
        free_delivery_threshold: 55000,
        estimated_time_minutes: 45
      },
      metadata: {
        source: 'mapbox',
        extracted_at: new Date().toISOString(),
        bbox: neighborhood.bbox
      }
    });
  });
  
  return dynamoDBRegions;
}

// Save results
async function saveResults() {
  const dynamoDBRegions = convertToDynamoDBFormat();
  
  // Save raw extraction
  fs.writeFileSync(
    'najaf-regions-raw-mapbox.json',
    JSON.stringify(extractedRegions, null, 2)
  );
  console.log('✅ Saved raw data to: najaf-regions-raw-mapbox.json');
  
  // Save DynamoDB format
  fs.writeFileSync(
    'najaf-regions-dynamodb.json',
    JSON.stringify(dynamoDBRegions, null, 2)
  );
  console.log('✅ Saved DynamoDB format to: najaf-regions-dynamodb.json');
  
  // Save as JavaScript module for direct import
  const jsContent = `// Auto-generated Najaf Regions from Mapbox API
// Generated: ${new Date().toISOString()}
// Total regions: ${dynamoDBRegions.length}

module.exports = ${JSON.stringify(dynamoDBRegions, null, 2)};
`;
  
  fs.writeFileSync('najaf-regions-module.js', jsContent);
  console.log('✅ Saved JavaScript module to: najaf-regions-module.js');
  
  // Print summary
  console.log('\n==========================================');
  console.log('📊 SUMMARY');
  console.log('==========================================');
  console.log(`Total regions ready for import: ${dynamoDBRegions.length}`);
  
  const byLevel = dynamoDBRegions.reduce((acc, r) => {
    acc[r.level] = (acc[r.level] || 0) + 1;
    return acc;
  }, {});
  
  console.log(`Districts (Level 2): ${byLevel[2] || 0}`);
  console.log(`Neighborhoods (Level 3): ${byLevel[3] || 0}`);
  console.log('==========================================\n');
  
  // Show sample regions
  console.log('📋 Sample Regions:');
  dynamoDBRegions.slice(0, 5).forEach(r => {
    console.log(`\n   ${r.name} (${r.name_ar})`);
    console.log(`   ID: ${r.regionId}`);
    console.log(`   Level: ${r.level === 2 ? 'District' : 'Neighborhood'}`);
    console.log(`   Coordinates: ${r.coordinates.lat.toFixed(4)}, ${r.coordinates.lng.toFixed(4)}`);
  });
  
  console.log('\n\n🎯 Next Steps:');
  console.log('1. Review the generated files');
  console.log('2. Run: node upload-najaf-to-dynamodb.js');
  console.log('3. Verify in admin panel: http://localhost:3000/pages/regions.html');
}

// Run the extraction
(async () => {
  try {
    await extractNajafRegions();
    await saveResults();
    console.log('\n✅ All done! Najaf regions extracted successfully.\n');
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
})();
