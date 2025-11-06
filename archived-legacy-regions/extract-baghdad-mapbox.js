#!/usr/bin/env node
/**
 * Extract Baghdad Regions from Mapbox Geocoding API
 * Comprehensive 3-level hierarchy with real GPS coordinates
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Read Mapbox token
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

console.log('🗺️  BAGHDAD COMPREHENSIVE REGION EXTRACTION');
console.log('============================================');
console.log(`🔑 Token: ${MAPBOX_TOKEN ? '✅ Loaded' : '❌ Missing'}`);
console.log('============================================\n');

if (!MAPBOX_TOKEN) {
  console.error('❌ MAPBOX_ACCESS_TOKEN not found');
  process.exit(1);
}

// Baghdad places to search - comprehensive coverage
const baghdadPlaces = [
  // ==================== MAJOR DISTRICTS ====================
  { query: 'الكرخ، بغداد، العراق', type: 'district', priority: 1, district: 'karkh' },
  { query: 'الرصافة، بغداد، العراق', type: 'district', priority: 1, district: 'rusafa' },
  { query: 'مدينة الصدر، بغداد، العراق', type: 'district', priority: 1, district: 'sadr' },
  { query: 'أبو غريب، بغداد، العراق', type: 'district', priority: 2, district: 'abu_ghraib' },
  { query: 'المحمودية، بغداد، العراق', type: 'district', priority: 2, district: 'mahmudiya' },
  
  // ==================== KARKH NEIGHBORHOODS (West Baghdad) ====================
  { query: 'المنصور، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'karkh' },
  { query: 'الخضراء، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'karkh' },
  { query: 'العدل، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'karkh' },
  { query: 'البياع، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'karkh' },
  { query: 'الصيدية، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'karkh' },
  { query: 'العامرية، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'karkh' },
  { query: 'الغزالية، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'karkh' },
  { query: 'اليرموك، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'karkh' },
  { query: 'الحارثية، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'karkh' },
  { query: 'المأمون، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'karkh' },
  { query: 'الإسكان، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'karkh' },
  { query: 'الجامعة، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'karkh' },
  { query: 'الدورة، بغداد، العراق', type: 'neighborhood', priority: 2, district: 'karkh' },
  { query: 'البيضاء، بغداد، العراق', type: 'neighborhood', priority: 2, district: 'karkh' },
  { query: 'الشعلة، بغداد، العراق', type: 'neighborhood', priority: 2, district: 'karkh' },
  
  // ==================== RUSAFA NEIGHBORHOODS (East Baghdad) ====================
  { query: 'الكرادة، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'rusafa' },
  { query: 'الجادرية، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'rusafa' },
  { query: 'الأعظمية، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'rusafa' },
  { query: 'شارع فلسطين، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'rusafa' },
  { query: 'بغداد الجديدة، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'rusafa' },
  { query: 'الزيونة، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'rusafa' },
  { query: 'الكاظمية، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'rusafa' },
  { query: 'الشعب، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'rusafa' },
  { query: 'حي الأطباء، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'rusafa' },
  { query: 'حي المعلمين، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'rusafa' },
  { query: 'حي الجامعة، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'rusafa' },
  { query: 'الوزيرية، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'rusafa' },
  { query: 'الصليخ، بغداد، العراق', type: 'neighborhood', priority: 2, district: 'rusafa' },
  { query: 'الشماسية، بغداد، العراق', type: 'neighborhood', priority: 2, district: 'rusafa' },
  { query: 'بغداد القديمة، بغداد، العراق', type: 'neighborhood', priority: 2, district: 'rusafa' },
  { query: 'الباب الشرقي، بغداد، العراق', type: 'neighborhood', priority: 2, district: 'rusafa' },
  { query: 'الميدان، بغداد، العراق', type: 'neighborhood', priority: 2, district: 'rusafa' },
  { query: 'حي البنوك، بغداد، العراق', type: 'neighborhood', priority: 2, district: 'rusafa' },
  { query: 'الكريعات، بغداد، العراق', type: 'neighborhood', priority: 2, district: 'rusafa' },
  { query: 'زيونة، بغداد، العراق', type: 'neighborhood', priority: 2, district: 'rusafa' },
  
  // ==================== SADR CITY ====================
  { query: 'مدينة الصدر - القطاع الأول، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'sadr' },
  { query: 'مدينة الصدر - القطاع الثاني، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'sadr' },
  { query: 'مدينة الصدر - القطاع الثالث، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'sadr' },
  { query: 'جميلة، مدينة الصدر، بغداد، العراق', type: 'neighborhood', priority: 2, district: 'sadr' },
  { query: 'الحبيبية، مدينة الصدر، بغداد، العراق', type: 'neighborhood', priority: 2, district: 'sadr' },
  
  // ==================== ADDITIONAL AREAS ====================
  { query: 'حي العدل، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'karkh' },
  { query: 'حي المهندسين، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'karkh' },
  { query: 'حي الضباط، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'rusafa' },
  { query: 'حي القضاة، بغداد، العراق', type: 'neighborhood', priority: 1, district: 'rusafa' },
  { query: 'حي الحرية، بغداد، العراق', type: 'neighborhood', priority: 2, district: 'rusafa' },
  { query: 'المشتل، بغداد، العراق', type: 'neighborhood', priority: 2, district: 'rusafa' }
];

const extractedData = {
  districts: [],
  neighborhoods: []
};

const seenCoordinates = new Set();

// Make HTTPS request to Mapbox
function fetchMapboxData(query) {
  return new Promise((resolve, reject) => {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_TOKEN}&country=IQ&limit=1&language=ar`;
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error('JSON parse error'));
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    }).on('error', reject);
  });
}

// Process place
async function processPlace(place, index, total) {
  console.log(`[${index + 1}/${total}] 🔍 ${place.query.split('،')[0]}`);
  
  try {
    const data = await fetchMapboxData(place.query);
    
    if (!data.features || data.features.length === 0) {
      console.log('   ⚠️  No results\n');
      return;
    }
    
    const feature = data.features[0];
    const [lng, lat] = feature.center;
    
    // Check for duplicates
    const coordKey = `${lat.toFixed(3)},${lng.toFixed(3)}`;
    if (seenCoordinates.has(coordKey)) {
      console.log('   ⏭️  Duplicate location\n');
      return;
    }
    seenCoordinates.add(coordKey);
    
    // Calculate radius
    let radius = 5000;
    if (feature.bbox) {
      const [minLng, minLat, maxLng, maxLat] = feature.bbox;
      const latDiff = maxLat - minLat;
      const lngDiff = maxLng - minLng;
      radius = Math.round((((latDiff + lngDiff) / 2) * 111000) / 2);
      radius = Math.max(2000, Math.min(radius, 15000));
    }
    
    const regionData = {
      name: feature.text || place.query.split('،')[0],
      name_ar: feature.text_ar || feature.text || place.query.split('،')[0],
      type: place.type,
      district: place.district,
      priority: place.priority,
      coordinates: {
        lat: parseFloat(lat.toFixed(6)),
        lng: parseFloat(lng.toFixed(6)),
        radius: radius
      },
      relevance: feature.relevance
    };
    
    if (place.type === 'district') {
      extractedData.districts.push(regionData);
    } else {
      extractedData.neighborhoods.push(regionData);
    }
    
    console.log(`   ✅ ${regionData.name_ar}`);
    console.log(`   📍 ${regionData.coordinates.lat}, ${regionData.coordinates.lng} (${radius}m)\n`);
    
  } catch (error) {
    console.log(`   ❌ ${error.message}\n`);
  }
  
  // Rate limiting
  await new Promise(resolve => setTimeout(resolve, 350));
}

// Generate regionId
function generateRegionId(name, level, district) {
  const clean = name
    .toLowerCase()
    .replace(/حي\s*/g, '')
    .replace(/[أإآ]/g, 'a')
    .replace(/ة/g, 'h')
    .replace(/ى/g, 'a')
    .replace(/[^\w\s]/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .substring(0, 25);
  
  if (level === 2) {
    return `baghdad_${clean}`;
  } else {
    return `baghdad_${district}_${clean}`;
  }
}

// Convert to DynamoDB format
function convertToDynamoDB() {
  const regions = [];
  
  // Add districts
  extractedData.districts.forEach(d => {
    regions.push({
      regionId: generateRegionId(d.name, 2, d.district),
      name: d.name,
      name_ar: d.name_ar,
      level: 2,
      parent_id: 'baghdad',
      governorate_id: 'baghdad',
      coordinates: d.coordinates,
      is_active: d.priority === 1,
      service_config: {
        delivery: true,
        pickup: true,
        express: d.priority === 1,
        standard: true
      },
      statistics: {
        population: 0,
        area_km2: 0,
        total_orders: 0,
        active_drivers: 0
      },
      delivery_config: {
        base_fee: 2000,
        per_km_fee: 500,
        minimum_order: 15000,
        free_delivery_threshold: 50000,
        estimated_time_minutes: 45
      },
      metadata: {
        source: 'mapbox_api',
        extracted_at: new Date().toISOString()
      }
    });
  });
  
  // Add neighborhoods
  extractedData.neighborhoods.forEach(n => {
    const parentId = generateRegionId(n.district, 2, n.district);
    regions.push({
      regionId: generateRegionId(n.name, 3, n.district),
      name: n.name,
      name_ar: n.name_ar,
      level: 3,
      parent_id: parentId,
      governorate_id: 'baghdad',
      coordinates: n.coordinates,
      is_active: n.priority === 1,
      service_config: {
        delivery: true,
        pickup: true,
        express: n.priority === 1,
        standard: true
      },
      statistics: {
        population: 0,
        area_km2: 0,
        total_orders: 0,
        active_drivers: 0
      },
      delivery_config: {
        base_fee: 2000,
        per_km_fee: 500,
        minimum_order: 15000,
        free_delivery_threshold: 50000,
        estimated_time_minutes: n.priority === 1 ? 35 : 45
      },
      metadata: {
        source: 'mapbox_api',
        extracted_at: new Date().toISOString()
      }
    });
  });
  
  return regions;
}

// Main execution
(async () => {
  try {
    console.log(`📋 Processing ${baghdadPlaces.length} locations...\n`);
    
    for (let i = 0; i < baghdadPlaces.length; i++) {
      await processPlace(baghdadPlaces[i], i, baghdadPlaces.length);
    }
    
    console.log('\n==========================================');
    console.log('✅ EXTRACTION COMPLETE');
    console.log('==========================================');
    console.log(`Districts: ${extractedData.districts.length}`);
    console.log(`Neighborhoods: ${extractedData.neighborhoods.length}`);
    console.log(`Total: ${extractedData.districts.length + extractedData.neighborhoods.length}`);
    console.log('==========================================\n');
    
    // Convert and save
    const dynamoDBRegions = convertToDynamoDB();
    
    fs.writeFileSync(
      'baghdad-regions-dynamodb.json',
      JSON.stringify(dynamoDBRegions, null, 2)
    );
    console.log('✅ Saved: baghdad-regions-dynamodb.json\n');
    
    // Create upload script
    const uploadScript = `#!/usr/bin/env node
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const fs = require('fs');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);
const regions = JSON.parse(fs.readFileSync('baghdad-regions-dynamodb.json', 'utf8'));

(async () => {
  console.log('📤 Uploading \${regions.length} Baghdad regions...\\n');
  let count = 0;
  for (const region of regions) {
    try {
      await docClient.send(new PutCommand({
        TableName: 'WizzCentral_Regions',
        Item: region
      }));
      count++;
      process.stdout.write(\`\\r✅ [\${count}/\${regions.length}] \${region.name}\`);
    } catch (error) {
      console.error(\`\\n❌ Error with \${region.regionId}: \${error.message}\`);
    }
  }
  console.log('\\n\\n✅ Upload complete!');
  console.log('🌐 View: http://localhost:3000/pages/regions.html');
})().catch(err => console.error('❌ Fatal:', err));
`;
    
    fs.writeFileSync('upload-baghdad-regions.js', uploadScript);
    fs.chmodSync('upload-baghdad-regions.js', '755');
    console.log('✅ Created: upload-baghdad-regions.js\n');
    
    // Summary
    console.log('📊 Summary by District:');
    const byDistrict = {};
    dynamoDBRegions.forEach(r => {
      if (r.level === 3) {
        const district = r.parent_id.split('_').pop();
        byDistrict[district] = (byDistrict[district] || 0) + 1;
      }
    });
    Object.entries(byDistrict).sort((a, b) => b[1] - a[1]).forEach(([d, count]) => {
      console.log(`   ${d}: ${count} neighborhoods`);
    });
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Review: cat baghdad-regions-dynamodb.json | jq . | head -50');
    console.log('2. Upload: node upload-baghdad-regions.js');
    console.log('3. Verify: open http://localhost:3000/pages/regions.html');
    console.log('\n');
    
  } catch (error) {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  }
})();
