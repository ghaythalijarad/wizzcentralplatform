#!/usr/bin/env node
/**
 * Extract Najaf Regions from Mapbox - Comprehensive Data Collection
 * Real GPS coordinates for districts and neighborhoods
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Read Mapbox token from .env file
const envPath = path.join(__dirname, '.env.mapbox');
let MAPBOX_TOKEN = '';

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const tokenMatch = envContent.match(/MAPBOX_ACCESS_TOKEN=(.+)/);
  if (tokenMatch) {
    MAPBOX_TOKEN = tokenMatch[1].trim();
  }
} catch (error) {
  console.error('❌ Error reading .env.mapbox:', error.message);
  process.exit(1);
}

console.log('🗺️  NAJAF COMPREHENSIVE REGION EXTRACTION');
console.log('==========================================');
console.log(`🔑 Mapbox Token: ${MAPBOX_TOKEN ? '✅ Loaded (' + MAPBOX_TOKEN.substring(0, 20) + '...)' : '❌ Missing'}`);
console.log('==========================================\n');

if (!MAPBOX_TOKEN) {
  console.error('❌ MAPBOX_ACCESS_TOKEN not found');
  process.exit(1);
}

// Najaf places to search (Arabic names for better results)
const najafPlaces = [
  // Main governorate
  { query: 'النجف الأشرف، العراق', type: 'governorate', priority: 1 },
  
  // Major districts
  { query: 'مركز النجف، العراق', type: 'district', priority: 1 },
  { query: 'الكوفة، النجف، العراق', type: 'district', priority: 1 },
  { query: 'المشخاب، النجف، العراق', type: 'district', priority: 1 },
  { query: 'المناذرة، النجف، العراق', type: 'district', priority: 2 },
  
  // Central Najaf neighborhoods
  { query: 'المدينة القديمة، النجف، العراق', type: 'neighborhood', priority: 1 },
  { query: 'حي السعد، النجف، العراق', type: 'neighborhood', priority: 1 },
  { query: 'حي الأمير، النجف، العراق', type: 'neighborhood', priority: 1 },
  { query: 'حي الجامعة، النجف، العراق', type: 'neighborhood', priority: 1 },
  { query: 'حي المعلمين، النجف، العراق', type: 'neighborhood', priority: 1 },
  { query: 'حي الأطباء، النجف، العراق', type: 'neighborhood', priority: 1 },
  { query: 'حي القضاة، النجف، العراق', type: 'neighborhood', priority: 1 },
  { query: 'حي المهندسين، النجف، العراق', type: 'neighborhood', priority: 1 },
  { query: 'حي الضباط، النجف، العراق', type: 'neighborhood', priority: 2 },
  { query: 'حي الثورة، النجف، العراق', type: 'neighborhood', priority: 2 },
  { query: 'حي الجديدة، النجف، العراق', type: 'neighborhood', priority: 2 },
  { query: 'حي النصر، النجف، العراق', type: 'neighborhood', priority: 2 },
  { query: 'حي الزهراء، النجف، العراق', type: 'neighborhood', priority: 2 },
  { query: 'حي الإسكان، النجف، العراق', type: 'neighborhood', priority: 2 },
  { query: 'حي الجوادين، النجف، العراق', type: 'neighborhood', priority: 2 },
  { query: 'الحويش، النجف، العراق', type: 'neighborhood', priority: 2 },
  { query: 'البراق، النجف، العراق', type: 'neighborhood', priority: 2 },
  { query: 'العمارة، النجف، العراق', type: 'neighborhood', priority: 2 },
  
  // Kufa neighborhoods
  { query: 'الكوفة القديمة، العراق', type: 'neighborhood', priority: 1 },
  { query: 'حي النهضة، الكوفة، العراق', type: 'neighborhood', priority: 2 },
  { query: 'حي العسكري، الكوفة، العراق', type: 'neighborhood', priority: 2 },
  { query: 'حي الجمعية، الكوفة، العراق', type: 'neighborhood', priority: 2 }
];

const results = [];
let processedCount = 0;

// Make HTTPS request to Mapbox
function fetchMapboxData(query) {
  return new Promise((resolve, reject) => {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_TOKEN}&country=IQ&limit=3&language=ar`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed);
          } catch (error) {
            reject(new Error('JSON parse error: ' + error.message));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Process a single place
async function processPlace(place) {
  processedCount++;
  console.log(`\n[${processedCount}/${najafPlaces.length}] 🔍 Searching: ${place.query}`);
  
  try {
    const data = await fetchMapboxData(place.query);
    
    if (!data.features || data.features.length === 0) {
      console.log('   ⚠️  No results found');
      return;
    }
    
    const feature = data.features[0]; // Take the best match
    const coordinates = feature.center;
    const placeName = feature.text || place.query.split('،')[0];
    const placeNameArabic = feature.text_ar || feature.text || placeName;
    
    // Calculate radius from bbox
    let radius = 5000;
    if (feature.bbox) {
      const [minLng, minLat, maxLng, maxLat] = feature.bbox;
      const latDiff = maxLat - minLat;
      const lngDiff = maxLng - minLng;
      radius = Math.round((((latDiff + lngDiff) / 2) * 111000) / 2);
      radius = Math.max(2000, Math.min(radius, 12000)); // Clamp 2-12km
    }
    
    const regionInfo = {
      name: placeName,
      name_ar: placeNameArabic,
      type: place.type,
      priority: place.priority,
      coordinates: {
        lat: parseFloat(coordinates[1].toFixed(6)),
        lng: parseFloat(coordinates[0].toFixed(6)),
        radius: radius
      },
      relevance: feature.relevance,
      place_name: feature.place_name
    };
    
    results.push(regionInfo);
    
    console.log(`   ✅ Found: ${regionInfo.name} (${regionInfo.name_ar})`);
    console.log(`   📍 GPS: ${regionInfo.coordinates.lat}, ${regionInfo.coordinates.lng}`);
    console.log(`   📏 Radius: ${radius}m | Relevance: ${(regionInfo.relevance * 100).toFixed(0)}%`);
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
  
  // Rate limiting
  await new Promise(resolve => setTimeout(resolve, 300));
}

// Generate regionId
function generateRegionId(name, level) {
  const clean = name
    .toLowerCase()
    .replace(/حي\s*/g, '')
    .replace(/[أإآ]/g, 'a')
    .replace(/ة/g, 'h')
    .replace(/[^\w\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .substring(0, 25);
  
  if (level === 2) {
    return `najaf_${clean}`;
  } else {
    return `najaf_central_${clean}`;
  }
}

// Convert to DynamoDB format
function convertToDynamoDBFormat() {
  const regions = [];
  
  // Group by type
  const districts = results.filter(r => r.type === 'district' && r.priority === 1);
  const neighborhoods = results.filter(r => r.type === 'neighborhood');
  
  console.log(`\n\n📊 Converting to DynamoDB format...`);
  console.log(`   Districts: ${districts.length}`);
  console.log(`   Neighborhoods: ${neighborhoods.length}\n`);
  
  // Add districts
  districts.forEach(d => {
    regions.push({
      regionId: generateRegionId(d.name, 2),
      name: d.name,
      name_ar: d.name_ar,
      level: 2,
      parent_id: 'najaf',
      governorate_id: 'najaf',
      coordinates: d.coordinates,
      is_active: true,
      service_config: { delivery: true, pickup: false, express: false, standard: true },
      statistics: { population: 0, area_km2: 0, total_orders: 0, active_drivers: 0 },
      delivery_config: {
        base_fee: 2500,
        per_km_fee: 600,
        minimum_order: 18000,
        free_delivery_threshold: 55000,
        estimated_time_minutes: 50
      }
    });
  });
  
  // Add neighborhoods
  neighborhoods.forEach(n => {
    // Assign to najaf_central for now
    regions.push({
      regionId: generateRegionId(n.name, 3),
      name: n.name,
      name_ar: n.name_ar,
      level: 3,
      parent_id: 'najaf_central',
      governorate_id: 'najaf',
      coordinates: n.coordinates,
      is_active: true,
      service_config: { delivery: true, pickup: false, express: false, standard: true },
      statistics: { population: 0, area_km2: 0, total_orders: 0, active_drivers: 0 },
      delivery_config: {
        base_fee: 2500,
        per_km_fee: 600,
        minimum_order: 18000,
        free_delivery_threshold: 55000,
        estimated_time_minutes: 45
      }
    });
  });
  
  return regions;
}

// Main execution
(async () => {
  try {
    console.log('🚀 Starting extraction...\n');
    
    // Process all places
    for (const place of najafPlaces) {
      await processPlace(place);
    }
    
    console.log('\n\n==========================================');
    console.log('✅ EXTRACTION COMPLETE');
    console.log('==========================================');
    console.log(`Total places extracted: ${results.length}`);
    console.log('==========================================\n');
    
    // Convert and save
    const dynamoDBRegions = convertToDynamoDBFormat();
    
    // Save files
    fs.writeFileSync('najaf-mapbox-raw.json', JSON.stringify(results, null, 2));
    console.log('✅ Saved raw data: najaf-mapbox-raw.json');
    
    fs.writeFileSync('najaf-dynamodb-ready.json', JSON.stringify(dynamoDBRegions, null, 2));
    console.log('✅ Saved DynamoDB format: najaf-dynamodb-ready.json');
    
    // Create upload script
    const uploadScript = `#!/usr/bin/env node
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const regions = require('./najaf-dynamodb-ready.json');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

(async () => {
  console.log('📤 Uploading ${dynamoDBRegions.length} Najaf regions to DynamoDB...\\n');
  let count = 0;
  for (const region of regions) {
    await docClient.send(new PutCommand({
      TableName: 'WizzCentral_Regions',
      Item: region
    }));
    count++;
    console.log(\`✅ [\${count}/\${regions.length}] \${region.name} (\${region.regionId})\`);
  }
  console.log('\\n✅ Upload complete!');
})();
`;
    
    fs.writeFileSync('upload-najaf-to-dynamodb.js', uploadScript);
    fs.chmodSync('upload-najaf-to-dynamodb.js', '755');
    console.log('✅ Created upload script: upload-najaf-to-dynamodb.js');
    
    // Summary
    console.log('\n==========================================');
    console.log('📊 FINAL SUMMARY');
    console.log('==========================================');
    console.log(`Total regions ready: ${dynamoDBRegions.length}`);
    console.log(`Districts: ${dynamoDBRegions.filter(r => r.level === 2).length}`);
    console.log(`Neighborhoods: ${dynamoDBRegions.filter(r => r.level === 3).length}`);
    console.log('==========================================\n');
    
    console.log('🎯 Next steps:');
    console.log('1. Review: najaf-dynamodb-ready.json');
    console.log('2. Upload: node upload-najaf-to-dynamodb.js');
    console.log('3. Verify in admin panel');
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }
})();
