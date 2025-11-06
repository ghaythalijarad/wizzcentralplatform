#!/usr/bin/env node
/**
 * Extract Baghdad Regions from Mapbox Geocoding API
 * Creates comprehensive 3-level hierarchy with real GPS coordinates
 * Baghdad → Districts → Neighborhoods
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

console.log('🏛️  BAGHDAD COMPREHENSIVE REGION EXTRACTION');
console.log('============================================');
console.log(`🔑 Mapbox Token: ${MAPBOX_TOKEN ? '✅ Loaded (' + MAPBOX_TOKEN.substring(0, 20) + '...)' : '❌ Missing'}`);
console.log('============================================\n');

if (!MAPBOX_TOKEN) {
  console.error('❌ MAPBOX_ACCESS_TOKEN not found in .env.mapbox');
  process.exit(1);
}

// Comprehensive Baghdad places to search
const baghdadSearchQueries = [
  // Major Districts (Level 2)
  { query: 'الكرخ، بغداد، العراق', type: 'district', priority: 1, expected_parent: 'baghdad' },
  { query: 'Al-Karkh District, Baghdad, Iraq', type: 'district', priority: 1, expected_parent: 'baghdad' },
  { query: 'الرصافة، بغداد، العراق', type: 'district', priority: 1, expected_parent: 'baghdad' },
  { query: 'Al-Rusafa District, Baghdad, Iraq', type: 'district', priority: 1, expected_parent: 'baghdad' },
  { query: 'مدينة الصدر، بغداد، العراق', type: 'district', priority: 1, expected_parent: 'baghdad' },
  { query: 'Sadr City, Baghdad, Iraq', type: 'district', priority: 1, expected_parent: 'baghdad' },
  { query: 'الكاظمية، بغداد، العراق', type: 'district', priority: 1, expected_parent: 'baghdad' },
  { query: 'الأعظمية، بغداد، العراق', type: 'district', priority: 1, expected_parent: 'baghdad' },

  // Al-Karkh Neighborhoods (West Baghdad)
  { query: 'المنصور، بغداد، العراق', type: 'neighborhood', priority: 1, expected_parent: 'baghdad_karkh' },
  { query: 'Al-Mansour, Baghdad, Iraq', type: 'neighborhood', priority: 1, expected_parent: 'baghdad_karkh' },
  { query: 'الخضراء، بغداد، العراق', type: 'neighborhood', priority: 1, expected_parent: 'baghdad_karkh' },
  { query: 'العدل، بغداد، العراق', type: 'neighborhood', priority: 1, expected_parent: 'baghdad_karkh' },
  { query: 'البياع، بغداد، العراق', type: 'neighborhood', priority: 1, expected_parent: 'baghdad_karkh' },
  { query: 'الصيدية، بغداد، العراق', type: 'neighborhood', priority: 1, expected_parent: 'baghdad_karkh' },
  { query: 'العامرية، بغداد، العراق', type: 'neighborhood', priority: 1, expected_parent: 'baghdad_karkh' },
  { query: 'اليرموك، بغداد، العراق', type: 'neighborhood', priority: 1, expected_parent: 'baghdad_karkh' },
  { query: 'الدورة، بغداد، العراق', type: 'neighborhood', priority: 1, expected_parent: 'baghdad_karkh' },

  // Al-Rusafa Neighborhoods (East Baghdad)
  { query: 'الكرادة، بغداد، العراق', type: 'neighborhood', priority: 1, expected_parent: 'baghdad_rusafa' },
  { query: 'Al-Karrada, Baghdad, Iraq', type: 'neighborhood', priority: 1, expected_parent: 'baghdad_rusafa' },
  { query: 'الجادرية، بغداد، العراق', type: 'neighborhood', priority: 1, expected_parent: 'baghdad_rusafa' },
  { query: 'شارع فلسطين، بغداد، العراق', type: 'neighborhood', priority: 1, expected_parent: 'baghdad_rusafa' },
  { query: 'بغداد الجديدة، بغداد، العراق', type: 'neighborhood', priority: 1, expected_parent: 'baghdad_rusafa' },
  { query: 'New Baghdad, Iraq', type: 'neighborhood', priority: 1, expected_parent: 'baghdad_rusafa' },
  { query: 'الزيونة، بغداد، العراق', type: 'neighborhood', priority: 1, expected_parent: 'baghdad_rusafa' },
  { query: 'الشعب، بغداد، العراق', type: 'neighborhood', priority: 1, expected_parent: 'baghdad_rusafa' },

  // Sadr City Sectors
  { query: 'قطاع 1، مدينة الصدر، العراق', type: 'neighborhood', priority: 1, expected_parent: 'baghdad_sadr_city' },
  { query: 'قطاع 2، مدينة الصدر، العراق', type: 'neighborhood', priority: 1, expected_parent: 'baghdad_sadr_city' },
  { query: 'قطاع 3، مدينة الصدر، العراق', type: 'neighborhood', priority: 1, expected_parent: 'baghdad_sadr_city' }
];

const extractedRegions = [];
let processedCount = 0;

// Make HTTPS request to Mapbox
function fetchMapboxData(query) {
  return new Promise((resolve, reject) => {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_TOKEN}&country=IQ&limit=3&proximity=44.3661,33.3152&bbox=44.1,33.1,44.6,33.6`;
    
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

// Generate regionId from name and type
function generateRegionId(name, type, expectedParent) {
  const clean = name
    .toLowerCase()
    .replace(/حي\s*/g, '')
    .replace(/شارع\s*/g, 'street_')
    .replace(/قطاع\s*/g, 'sector_')
    .replace(/مدينة\s*/g, '')
    .replace(/[أإآ]/g, 'a')
    .replace(/ة/g, 'h')
    .replace(/[^\w\s\-]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .replace(/-+/g, '_')
    .substring(0, 25);

  if (type === 'district') {
    return `baghdad_${clean}`;
  } else {
    const parent = expectedParent ? expectedParent.split('_').pop() : 'central';
    return `baghdad_${parent}_${clean}`;
  }
}

// Process a single search query
async function processSearchQuery(searchItem) {
  processedCount++;
  console.log(`\n[${processedCount}/${baghdadSearchQueries.length}] 🔍 Searching: ${searchItem.query}`);
  
  try {
    const data = await fetchMapboxData(searchItem.query);
    
    if (!data.features || data.features.length === 0) {
      console.log('   ⚠️  No results found');
      return;
    }
    
    // Process the best match
    const feature = data.features[0];
    const coordinates = feature.center;
    const placeName = feature.text || searchItem.query.split('،')[0];
    const placeNameArabic = feature.text_ar || feature.text || placeName;
    
    // Calculate radius from bbox or use defaults
    let radius;
    if (searchItem.type === 'district') {
      radius = 8000; // 8km for districts
    } else {
      radius = 4000; // 4km for neighborhoods
    }
    
    if (feature.bbox) {
      const [minLng, minLat, maxLng, maxLat] = feature.bbox;
      const latDiff = maxLat - minLat;
      const lngDiff = maxLng - minLng;
      const calculatedRadius = Math.round((((latDiff + lngDiff) / 2) * 111000) / 2);
      radius = Math.max(2000, Math.min(calculatedRadius, searchItem.type === 'district' ? 15000 : 8000));
    }
    
    // Verify it's in Baghdad
    const isBaghdad = feature.place_name.toLowerCase().includes('baghdad') || 
                      feature.place_name.includes('بغداد') ||
                      (coordinates[1] >= 33.1 && coordinates[1] <= 33.6 && 
                       coordinates[0] >= 44.1 && coordinates[0] <= 44.6);
    
    if (!isBaghdad) {
      console.log(`   ⏭️  Skipped: ${placeName} (not in Baghdad)`);
      return;
    }
    
    // Check for duplicates
    const isDuplicate = extractedRegions.some(r => 
      r.name === placeName || 
      (Math.abs(r.coordinates.lat - coordinates[1]) < 0.01 && 
       Math.abs(r.coordinates.lng - coordinates[0]) < 0.01)
    );
    
    if (isDuplicate) {
      console.log(`   ⏭️  Skipped: ${placeName} (duplicate)`);
      return;
    }
    
    const regionInfo = {
      name: placeName,
      name_ar: placeNameArabic,
      type: searchItem.type,
      priority: searchItem.priority,
      expected_parent: searchItem.expected_parent,
      coordinates: {
        lat: parseFloat(coordinates[1].toFixed(6)),
        lng: parseFloat(coordinates[0].toFixed(6)),
        radius: radius
      },
      relevance: feature.relevance,
      place_name: feature.place_name,
      regionId: generateRegionId(placeName, searchItem.type, searchItem.expected_parent)
    };
    
    extractedRegions.push(regionInfo);
    
    console.log(`   ✅ Found: ${regionInfo.name} (${regionInfo.name_ar})`);
    console.log(`   📍 GPS: ${regionInfo.coordinates.lat}, ${regionInfo.coordinates.lng}`);
    console.log(`   🆔 ID: ${regionInfo.regionId}`);
    console.log(`   📏 Radius: ${radius}m | Relevance: ${(regionInfo.relevance * 100).toFixed(0)}%`);
    
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}`);
  }
  
  // Rate limiting - 300ms between requests
  await new Promise(resolve => setTimeout(resolve, 300));
}

// Convert to DynamoDB format
function convertToDynamoDBFormat() {
  const regions = [];
  
  // Group by type
  const districts = extractedRegions.filter(r => r.type === 'district' && r.priority === 1);
  const neighborhoods = extractedRegions.filter(r => r.type === 'neighborhood');
  
  console.log(`\n📊 Converting to DynamoDB format...`);
  console.log(`   Districts: ${districts.length}`);
  console.log(`   Neighborhoods: ${neighborhoods.length}\n`);
  
  // Add districts (Level 2)
  districts.forEach(d => {
    regions.push({
      regionId: d.regionId,
      name: d.name,
      name_ar: d.name_ar,
      level: 2,
      parent_id: 'baghdad',
      governorate_id: 'baghdad',
      coordinates: d.coordinates,
      is_active: true,
      service_config: { delivery: true, pickup: true, express: true, standard: true },
      statistics: { population: 0, area_km2: 0, total_orders: 0, active_drivers: 0 },
      delivery_config: {
        base_fee: 2000,
        per_km_fee: 500,
        minimum_order: 15000,
        free_delivery_threshold: 50000,
        estimated_time_minutes: 45
      },
      metadata: {
        source: 'mapbox_api',
        extracted_at: new Date().toISOString(),
        relevance: d.relevance
      }
    });
  });
  
  // Add neighborhoods (Level 3)
  neighborhoods.forEach(n => {
    // Find best parent district
    let parentId = 'baghdad_karkh'; // default
    if (n.expected_parent) {
      const parentDistrict = districts.find(d => d.regionId === n.expected_parent);
      if (parentDistrict) {
        parentId = parentDistrict.regionId;
      }
    }
    
    regions.push({
      regionId: n.regionId,
      name: n.name,
      name_ar: n.name_ar,
      level: 3,
      parent_id: parentId,
      governorate_id: 'baghdad',
      coordinates: n.coordinates,
      is_active: true,
      service_config: { delivery: true, pickup: true, express: true, standard: true },
      statistics: { population: 0, area_km2: 0, total_orders: 0, active_drivers: 0 },
      delivery_config: {
        base_fee: 2000,
        per_km_fee: 500,
        minimum_order: 15000,
        free_delivery_threshold: 50000,
        estimated_time_minutes: 35
      },
      metadata: {
        source: 'mapbox_api',
        extracted_at: new Date().toISOString(),
        relevance: n.relevance
      }
    });
  });
  
  return regions;
}

// Main execution
(async () => {
  try {
    console.log('🚀 Starting Baghdad region extraction...\n');
    
    // Process all search queries
    for (const searchItem of baghdadSearchQueries) {
      await processSearchQuery(searchItem);
    }
    
    console.log('\n\n==========================================');
    console.log('✅ EXTRACTION COMPLETE');
    console.log('==========================================');
    console.log(`Total places extracted: ${extractedRegions.length}`);
    
    const byType = {
      district: extractedRegions.filter(r => r.type === 'district').length,
      neighborhood: extractedRegions.filter(r => r.type === 'neighborhood').length
    };
    console.log(`Districts: ${byType.district}`);
    console.log(`Neighborhoods: ${byType.neighborhood}`);
    console.log('==========================================\n');
    
    // Convert and save
    const dynamoDBRegions = convertToDynamoDBFormat();
    
    // Save files
    fs.writeFileSync('baghdad-mapbox-raw.json', JSON.stringify(extractedRegions, null, 2));
    console.log('✅ Saved raw extraction: baghdad-mapbox-raw.json');
    
    fs.writeFileSync('baghdad-regions-dynamodb.json', JSON.stringify(dynamoDBRegions, null, 2));
    console.log('✅ Saved DynamoDB format: baghdad-regions-dynamodb.json');
    
    // Create upload script
    const uploadScript = `#!/usr/bin/env node
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const fs = require('fs');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

(async () => {
  console.log('📤 Uploading Baghdad regions to DynamoDB...\\n');
  
  const regions = JSON.parse(fs.readFileSync('baghdad-regions-dynamodb.json', 'utf8'));
  let count = 0;
  
  for (const region of regions) {
    try {
      await docClient.send(new PutCommand({
        TableName: 'WizzCentral_Regions',
        Item: region
      }));
      count++;
      console.log(\`✅ [\${count}/\${regions.length}] \${region.name} (\${region.regionId})\`);
    } catch (error) {
      console.error(\`❌ Error uploading \${region.regionId}: \${error.message}\`);
    }
  }
  
  console.log(\`\\n✅ Upload complete! \${count}/\${regions.length} regions uploaded.\`);
  console.log('\\n🌐 View in admin panel: http://localhost:3000/pages/regions.html');
})().catch(console.error);
`;
    
    fs.writeFileSync('upload-baghdad-regions.js', uploadScript);
    fs.chmodSync('upload-baghdad-regions.js', '755');
    console.log('✅ Created upload script: upload-baghdad-regions.js');
    
    // Final summary
    console.log('\n==========================================');
    console.log('📊 FINAL SUMMARY');
    console.log('==========================================');
    console.log(`Total regions ready for import: ${dynamoDBRegions.length}`);
    console.log(`Districts (Level 2): ${dynamoDBRegions.filter(r => r.level === 2).length}`);
    console.log(`Neighborhoods (Level 3): ${dynamoDBRegions.filter(r => r.level === 3).length}`);
    console.log('==========================================\n');
    
    console.log('🎯 Next steps:');
    console.log('1. Review extracted data: cat baghdad-regions-dynamodb.json | head -50');
    console.log('2. Upload to DynamoDB: node upload-baghdad-regions.js');
    console.log('3. Verify in admin panel: http://localhost:3000/pages/regions.html');
    console.log('4. Check region hierarchy working in your apps\n');
    
    // Show sample regions
    console.log('📋 Sample extracted regions:');
    dynamoDBRegions.slice(0, 8).forEach((r, i) => {
      console.log(`   ${i+1}. ${r.name} (${r.name_ar})`);
      console.log(`      Level ${r.level} | Parent: ${r.parent_id} | GPS: ${r.coordinates.lat.toFixed(4)}, ${r.coordinates.lng.toFixed(4)}`);
    });
    
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  }
})();
