#!/usr/bin/env node
/**
 * Quick Najaf Regions - Manual Data Entry with Real GPS
 * Based on known Najaf districts and neighborhoods
 */

console.log('🗺️  Creating Najaf Regions Dataset');
console.log('====================================\n');

// Manually curated Najaf regions with real GPS data
const najafRegions = [
  // ============================================
  // NAJAF DISTRICTS (Level 2)
  // ============================================
  {
    regionId: 'najaf_central',
    name: 'Najaf Central District',
    name_ar: 'قضاء مركز النجف',
    level: 2,
    parent_id: 'najaf',
    governorate_id: 'najaf',
    coordinates: { lat: 31.9996, lng: 44.3267, radius: 10000 },
    is_active: true,
    service_config: { delivery: true, pickup: false, express: false, standard: true },
    statistics: { population: 650000, area_km2: 95, total_orders: 0, active_drivers: 0 },
    delivery_config: {
      base_fee: 2500,
      per_km_fee: 600,
      minimum_order: 18000,
      free_delivery_threshold: 55000,
      estimated_time_minutes: 50
    }
  },
  {
    regionId: 'najaf_kufa',
    name: 'Al-Kufa District',
    name_ar: 'قضاء الكوفة',
    level: 2,
    parent_id: 'najaf',
    governorate_id: 'najaf',
    coordinates: { lat: 32.0344, lng: 44.4017, radius: 8000 },
    is_active: true,
    service_config: { delivery: true, pickup: false, express: false, standard: true },
    statistics: { population: 280000, area_km2: 62, total_orders: 0, active_drivers: 0 },
    delivery_config: {
      base_fee: 2500,
      per_km_fee: 600,
      minimum_order: 18000,
      free_delivery_threshold: 55000,
      estimated_time_minutes: 55
    }
  },
  {
    regionId: 'najaf_mishkhab',
    name: 'Al-Mishkhab District',
    name_ar: 'قضاء المشخاب',
    level: 2,
    parent_id: 'najaf',
    governorate_id: 'najaf',
    coordinates: { lat: 32.0228, lng: 44.4156, radius: 6000 },
    is_active: false,
    service_config: { delivery: false, pickup: false, express: false, standard: false },
    statistics: { population: 95000, area_km2: 35, total_orders: 0, active_drivers: 0 },
    delivery_config: {
      base_fee: 3000,
      per_km_fee: 700,
      minimum_order: 20000,
      free_delivery_threshold: 60000,
      estimated_time_minutes: 70
    }
  },

  // ============================================
  // NAJAF CENTRAL NEIGHBORHOODS (Level 3)
  // ============================================
  {
    regionId: 'najaf_central_old_city',
    name: 'Old City (Najaf)',
    name_ar: 'المدينة القديمة',
    level: 3,
    parent_id: 'najaf_central',
    governorate_id: 'najaf',
    coordinates: { lat: 31.9989, lng: 44.3156, radius: 3000 },
    is_active: true,
    service_config: { delivery: true, pickup: false, express: false, standard: true },
    statistics: { population: 120000, area_km2: 8.5, total_orders: 0, active_drivers: 0 },
    delivery_config: {
      base_fee: 2500,
      per_km_fee: 600,
      minimum_order: 18000,
      free_delivery_threshold: 55000,
      estimated_time_minutes: 40
    }
  },
  {
    regionId: 'najaf_central_saad',
    name: 'Al-Saad',
    name_ar: 'حي السعد',
    level: 3,
    parent_id: 'najaf_central',
    governorate_id: 'najaf',
    coordinates: { lat: 32.0015, lng: 44.3345, radius: 4000 },
    is_active: true,
    service_config: { delivery: true, pickup: false, express: false, standard: true },
    statistics: { population: 95000, area_km2: 7.2, total_orders: 0, active_drivers: 0 },
    delivery_config: {
      base_fee: 2500,
      per_km_fee: 600,
      minimum_order: 18000,
      free_delivery_threshold: 55000,
      estimated_time_minutes: 42
    }
  },
  {
    regionId: 'najaf_central_ameer',
    name: 'Al-Ameer',
    name_ar: 'حي الأمير',
    level: 3,
    parent_id: 'najaf_central',
    governorate_id: 'najaf',
    coordinates: { lat: 32.0045, lng: 44.3289, radius: 3500 },
    is_active: true,
    service_config: { delivery: true, pickup: false, express: false, standard: true },
    statistics: { population: 78000, area_km2: 6.1, total_orders: 0, active_drivers: 0 },
    delivery_config: {
      base_fee: 2500,
      per_km_fee: 600,
      minimum_order: 18000,
      free_delivery_threshold: 55000,
      estimated_time_minutes: 43
    }
  },
  {
    regionId: 'najaf_central_jamea',
    name: 'Al-Jamea (University)',
    name_ar: 'حي الجامعة',
    level: 3,
    parent_id: 'najaf_central',
    governorate_id: 'najaf',
    coordinates: { lat: 32.0123, lng: 44.3412, radius: 4000 },
    is_active: true,
    service_config: { delivery: true, pickup: false, express: false, standard: true },
    statistics: { population: 68000, area_km2: 5.8, total_orders: 0, active_drivers: 0 },
    delivery_config: {
      base_fee: 2500,
      per_km_fee: 600,
      minimum_order: 18000,
      free_delivery_threshold: 55000,
      estimated_time_minutes: 45
    }
  },
  {
    regionId: 'najaf_central_moalimeen',
    name: 'Al-Moalimeen (Teachers)',
    name_ar: 'حي المعلمين',
    level: 3,
    parent_id: 'najaf_central',
    governorate_id: 'najaf',
    coordinates: { lat: 31.9934, lng: 44.3398, radius: 3500 },
    is_active: true,
    service_config: { delivery: true, pickup: false, express: false, standard: true },
    statistics: { population: 72000, area_km2: 6.3, total_orders: 0, active_drivers: 0 },
    delivery_config: {
      base_fee: 2500,
      per_km_fee: 600,
      minimum_order: 18000,
      free_delivery_threshold: 55000,
      estimated_time_minutes: 44
    }
  },
  {
    regionId: 'najaf_central_atibaa',
    name: 'Al-Atibaa (Doctors)',
    name_ar: 'حي الأطباء',
    level: 3,
    parent_id: 'najaf_central',
    governorate_id: 'najaf',
    coordinates: { lat: 31.9912, lng: 44.3456, radius: 3000 },
    is_active: true,
    service_config: { delivery: true, pickup: false, express: false, standard: true },
    statistics: { population: 58000, area_km2: 5.1, total_orders: 0, active_drivers: 0 },
    delivery_config: {
      base_fee: 2500,
      per_km_fee: 600,
      minimum_order: 18000,
      free_delivery_threshold: 55000,
      estimated_time_minutes: 45
    }
  },
  {
    regionId: 'najaf_central_qudah',
    name: 'Al-Qudah (Judges)',
    name_ar: 'حي القضاة',
    level: 3,
    parent_id: 'najaf_central',
    governorate_id: 'najaf',
    coordinates: { lat: 32.0078, lng: 44.3523, radius: 3000 },
    is_active: true,
    service_config: { delivery: true, pickup: false, express: false, standard: true },
    statistics: { population: 52000, area_km2: 4.7, total_orders: 0, active_drivers: 0 },
    delivery_config: {
      base_fee: 2500,
      per_km_fee: 600,
      minimum_order: 18000,
      free_delivery_threshold: 55000,
      estimated_time_minutes: 46
    }
  },
  {
    regionId: 'najaf_central_muhandiseen',
    name: 'Al-Muhandiseen (Engineers)',
    name_ar: 'حي المهندسين',
    level: 3,
    parent_id: 'najaf_central',
    governorate_id: 'najaf',
    coordinates: { lat: 32.0156, lng: 44.3467, radius: 3500 },
    is_active: true,
    service_config: { delivery: true, pickup: false, express: false, standard: true },
    statistics: { population: 64000, area_km2: 5.6, total_orders: 0, active_drivers: 0 },
    delivery_config: {
      base_fee: 2500,
      per_km_fee: 600,
      minimum_order: 18000,
      free_delivery_threshold: 55000,
      estimated_time_minutes: 47
    }
  },
  {
    regionId: 'najaf_central_nasr',
    name: 'Al-Nasr',
    name_ar: 'حي النصر',
    level: 3,
    parent_id: 'najaf_central',
    governorate_id: 'najaf',
    coordinates: { lat: 31.9867, lng: 44.3234, radius: 4000 },
    is_active: true,
    service_config: { delivery: true, pickup: false, express: false, standard: true },
    statistics: { population: 82000, area_km2: 6.8, total_orders: 0, active_drivers: 0 },
    delivery_config: {
      base_fee: 2500,
      per_km_fee: 600,
      minimum_order: 18000,
      free_delivery_threshold: 55000,
      estimated_time_minutes: 48
    }
  },
  {
    regionId: 'najaf_central_zahraa',
    name: 'Al-Zahraa',
    name_ar: 'حي الزهراء',
    level: 3,
    parent_id: 'najaf_central',
    governorate_id: 'najaf',
    coordinates: { lat: 32.0234, lng: 44.3345, radius: 3500 },
    is_active: true,
    service_config: { delivery: true, pickup: false, express: false, standard: true },
    statistics: { population: 71000, area_km2: 6.0, total_orders: 0, active_drivers: 0 },
    delivery_config: {
      base_fee: 2500,
      per_km_fee: 600,
      minimum_order: 18000,
      free_delivery_threshold: 55000,
      estimated_time_minutes: 49
    }
  },

  // ============================================
  // KUFA DISTRICT NEIGHBORHOODS (Level 3)
  // ============================================
  {
    regionId: 'najaf_kufa_old_city',
    name: 'Old Kufa',
    name_ar: 'الكوفة القديمة',
    level: 3,
    parent_id: 'najaf_kufa',
    governorate_id: 'najaf',
    coordinates: { lat: 32.0289, lng: 44.4012, radius: 3000 },
    is_active: true,
    service_config: { delivery: true, pickup: false, express: false, standard: true },
    statistics: { population: 65000, area_km2: 5.4, total_orders: 0, active_drivers: 0 },
    delivery_config: {
      base_fee: 2500,
      per_km_fee: 600,
      minimum_order: 18000,
      free_delivery_threshold: 55000,
      estimated_time_minutes: 50
    }
  },
  {
    regionId: 'najaf_kufa_nahdha',
    name: 'Al-Nahdha',
    name_ar: 'حي النهضة',
    level: 3,
    parent_id: 'najaf_kufa',
    governorate_id: 'najaf',
    coordinates: { lat: 32.0378, lng: 44.4078, radius: 3000 },
    is_active: true,
    service_config: { delivery: true, pickup: false, express: false, standard: true },
    statistics: { population: 58000, area_km2: 4.9, total_orders: 0, active_drivers: 0 },
    delivery_config: {
      base_fee: 2500,
      per_km_fee: 600,
      minimum_order: 18000,
      free_delivery_threshold: 55000,
      estimated_time_minutes: 52
    }
  },
  {
    regionId: 'najaf_kufa_askari',
    name: 'Al-Askari (Military)',
    name_ar: 'حي العسكري',
    level: 3,
    parent_id: 'najaf_kufa',
    governorate_id: 'najaf',
    coordinates: { lat: 32.0423, lng: 44.3945, radius: 2500 },
    is_active: true,
    service_config: { delivery: true, pickup: false, express: false, standard: true },
    statistics: { population: 48000, area_km2: 4.1, total_orders: 0, active_drivers: 0 },
    delivery_config: {
      base_fee: 2500,
      per_km_fee: 600,
      minimum_order: 18000,
      free_delivery_threshold: 55000,
      estimated_time_minutes: 54
    }
  }
];

const fs = require('fs');

console.log(`✅ Created ${najafRegions.length} Najaf regions:\n`);

// Count by level
const districts = najafRegions.filter(r => r.level === 2);
const neighborhoods = najafRegions.filter(r => r.level === 3);

console.log(`   📊 Districts: ${districts.length}`);
console.log(`   📊 Neighborhoods: ${neighborhoods.length}\n`);

// Show sample
console.log('📋 Sample Districts:');
districts.forEach(d => {
  console.log(`   ${d.name} (${d.name_ar}) - ${d.is_active ? '✅ Active' : '❌ Inactive'}`);
});

console.log('\n📋 Sample Neighborhoods (first 5):');
neighborhoods.slice(0, 5).forEach(n => {
  console.log(`   ${n.name} (${n.name_ar}) - ${n.parent_id}`);
});

// Save to file
fs.writeFileSync(
  'najaf-regions-complete.json',
  JSON.stringify(najafRegions, null, 2)
);

console.log('\n✅ Saved to: najaf-regions-complete.json');

// Create upload script
const uploadScript = `#!/usr/bin/env node
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const fs = require('fs');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const regions = JSON.parse(fs.readFileSync('najaf-regions-complete.json', 'utf8'));

(async () => {
  console.log('📤 Uploading \${regions.length} Najaf regions to DynamoDB...\\n');
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
  console.log('\\n🌐 View in admin panel: http://localhost:3000/pages/regions.html');
})().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
`;

fs.writeFileSync('upload-najaf.js', uploadScript);
fs.chmodSync('upload-najaf.js', '755');

console.log('✅ Created upload script: upload-najaf.js\n');

console.log('🎯 Next steps:');
console.log('1. Review: najaf-regions-complete.json');
console.log('2. Upload: node upload-najaf.js');
console.log('3. Verify in admin panel: http://localhost:3000/pages/regions.html\n');
