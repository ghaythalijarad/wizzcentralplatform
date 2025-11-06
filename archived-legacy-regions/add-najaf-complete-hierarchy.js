#!/usr/bin/env node
/**
 * Add Missing Najaf Districts and Neighborhoods
 * Supplements existing Najaf regions with complete hierarchy
 */

const AWS = require('aws-sdk');

console.log('🏛️  Adding Missing Najaf Districts & Neighborhoods');
console.log('================================================\n');

// Configure AWS DynamoDB
AWS.config.update({
  region: 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB.DocumentClient();
const TABLE_NAME = 'WizzCentral_Regions';

// Additional districts to add to Najaf
const additionalDistricts = [
  {
    id: 'najaf_manathera',
    name: 'Al-Manathera District',
    name_ar: 'قضاء المناذرة',
    level: 'district',
    parent_id: 'najaf',
    governorate_id: 'najaf',
    coordinates: { lat: 32.1256, lng: 44.2845, radius: 8000 },
    is_active: true,
    service_config: { delivery: true, pickup: false, express: false, standard: true },
    statistics: { population: 85000, area_km2: 420, total_orders: 650, active_drivers: 8 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'najaf_mishkhab',
    name: 'Al-Mishkhab District',
    name_ar: 'قضاء المشخاب',
    level: 'district',
    parent_id: 'najaf',
    governorate_id: 'najaf',
    coordinates: { lat: 31.8456, lng: 44.9145, radius: 9000 },
    is_active: true,
    service_config: { delivery: true, pickup: false, express: false, standard: true },
    statistics: { population: 130000, area_km2: 680, total_orders: 980, active_drivers: 12 },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Neighborhoods for existing najaf_center district
const najafCenterNeighborhoods = [
  {
    id: 'najaf_old_city',
    name: 'Old City Najaf',
    name_ar: 'المدينة القديمة',
    level: 'neighborhood',
    parent_id: 'najaf_center',
    governorate_id: 'najaf',
    coordinates: { lat: 32.0234, lng: 44.3189, radius: 3000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: true, standard: true },
    statistics: { population: 180000, area_km2: 25, total_orders: 2800, active_drivers: 15 }
  },
  {
    id: 'najaf_imam_ali_area',
    name: 'Imam Ali Shrine Area',
    name_ar: 'منطقة حرم الإمام علي',
    level: 'neighborhood',
    parent_id: 'najaf_center',
    governorate_id: 'najaf',
    coordinates: { lat: 32.0317, lng: 44.3189, radius: 2500 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: true, standard: true },
    statistics: { population: 95000, area_km2: 12, total_orders: 1850, active_drivers: 10 }
  },
  {
    id: 'najaf_hanana',
    name: 'Al-Hanana',
    name_ar: 'الحنانة',
    level: 'neighborhood',
    parent_id: 'najaf_center',
    governorate_id: 'najaf',
    coordinates: { lat: 31.9845, lng: 44.3567, radius: 4000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: true, standard: true },
    statistics: { population: 125000, area_km2: 18, total_orders: 1950, active_drivers: 8 }
  },
  {
    id: 'najaf_ghadeer',
    name: 'Al-Ghadeer',
    name_ar: 'الغدير',
    level: 'neighborhood',
    parent_id: 'najaf_center',
    governorate_id: 'najaf',
    coordinates: { lat: 31.9678, lng: 44.2987, radius: 3500 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: false, standard: true },
    statistics: { population: 98000, area_km2: 15, total_orders: 1450, active_drivers: 6 }
  }
];

// Neighborhoods for existing kufa district
const kufaNeighborhoods = [
  {
    id: 'kufa_center',
    name: 'Kufa Center',
    name_ar: 'مركز الكوفة',
    level: 'neighborhood',
    parent_id: 'kufa',
    governorate_id: 'najaf',
    coordinates: { lat: 32.0344, lng: 44.4017, radius: 3000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: true, standard: true },
    statistics: { population: 85000, area_km2: 15, total_orders: 1350, active_drivers: 8 }
  },
  {
    id: 'kufa_grand_mosque',
    name: 'Kufa Grand Mosque Area',
    name_ar: 'منطقة مسجد الكوفة الكبير',
    level: 'neighborhood',
    parent_id: 'kufa',
    governorate_id: 'najaf',
    coordinates: { lat: 32.0289, lng: 44.4056, radius: 2500 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: true, standard: true },
    statistics: { population: 65000, area_km2: 12, total_orders: 980, active_drivers: 6 }
  },
  {
    id: 'kufa_university',
    name: 'Al-Jami\'a (University Area)',
    name_ar: 'الجامعة',
    level: 'neighborhood',
    parent_id: 'kufa',
    governorate_id: 'najaf',
    coordinates: { lat: 32.0156, lng: 44.4178, radius: 4000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: true, standard: true },
    statistics: { population: 95000, area_km2: 18, total_orders: 1420, active_drivers: 5 }
  }
];

// Neighborhoods for new manathera district
const manatheraNeighborhoods = [
  {
    id: 'manathera_center',
    name: 'Manathera Center',
    name_ar: 'مركز المناذرة',
    level: 'neighborhood',
    parent_id: 'najaf_manathera',
    governorate_id: 'najaf',
    coordinates: { lat: 32.1256, lng: 44.2845, radius: 2500 },
    is_active: true,
    service_config: { delivery: true, pickup: false, express: false, standard: true },
    statistics: { population: 35000, area_km2: 8, total_orders: 280, active_drivers: 3 }
  },
  {
    id: 'manathera_haidariya',
    name: 'Al-Haidariya',
    name_ar: 'الحيدرية',
    level: 'neighborhood',
    parent_id: 'najaf_manathera',
    governorate_id: 'najaf',
    coordinates: { lat: 32.1189, lng: 44.2967, radius: 3000 },
    is_active: true,
    service_config: { delivery: true, pickup: false, express: false, standard: true },
    statistics: { population: 28000, area_km2: 12, total_orders: 210, active_drivers: 2 }
  }
];

// Neighborhoods for new mishkhab district
const mishkhabNeighborhoods = [
  {
    id: 'mishkhab_center',
    name: 'Mishkhab Center',
    name_ar: 'مركز المشخاب',
    level: 'neighborhood',
    parent_id: 'najaf_mishkhab',
    governorate_id: 'najaf',
    coordinates: { lat: 31.8456, lng: 44.9145, radius: 3000 },
    is_active: true,
    service_config: { delivery: true, pickup: false, express: false, standard: true },
    statistics: { population: 45000, area_km2: 12, total_orders: 350, active_drivers: 4 }
  },
  {
    id: 'mishkhab_hindiya',
    name: 'Al-Hindiya',
    name_ar: 'الهندية',
    level: 'neighborhood',
    parent_id: 'najaf_mishkhab',
    governorate_id: 'najaf',
    coordinates: { lat: 31.8234, lng: 44.9267, radius: 4000 },
    is_active: true,
    service_config: { delivery: true, pickup: false, express: false, standard: true },
    statistics: { population: 38000, area_km2: 15, total_orders: 290, active_drivers: 3 }
  }
];

async function uploadRegion(region, type) {
  try {
    const params = {
      TableName: TABLE_NAME,
      Item: {
        ...region,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      ConditionExpression: 'attribute_not_exists(id)'
    };

    await dynamodb.put(params).promise();
    console.log(`   ✅ ${region.name} (${region.name_ar})`);
    return true;
  } catch (error) {
    if (error.code === 'ConditionalCheckFailedException') {
      console.log(`   ⚠️  Already exists: ${region.name}`);
      return false;
    } else {
      console.log(`   ❌ Error: ${region.name} - ${error.message}`);
      return false;
    }
  }
}

async function main() {
  let totalUploaded = 0;
  
  // Upload additional districts
  console.log('📍 Adding New Districts:');
  console.log('========================');
  for (const district of additionalDistricts) {
    const success = await uploadRegion(district, 'district');
    if (success) totalUploaded++;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Upload neighborhoods for existing najaf_center
  console.log('\n🏘️  Adding Najaf Center Neighborhoods:');
  console.log('=====================================');
  for (const neighborhood of najafCenterNeighborhoods) {
    const success = await uploadRegion(neighborhood, 'neighborhood');
    if (success) totalUploaded++;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Upload neighborhoods for existing kufa
  console.log('\n🏘️  Adding Kufa Neighborhoods:');
  console.log('=============================');
  for (const neighborhood of kufaNeighborhoods) {
    const success = await uploadRegion(neighborhood, 'neighborhood');
    if (success) totalUploaded++;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Upload neighborhoods for new manathera
  console.log('\n🏘️  Adding Manathera Neighborhoods:');
  console.log('==================================');
  for (const neighborhood of manatheraNeighborhoods) {
    const success = await uploadRegion(neighborhood, 'neighborhood');
    if (success) totalUploaded++;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  // Upload neighborhoods for new mishkhab
  console.log('\n🏘️  Adding Mishkhab Neighborhoods:');
  console.log('=================================');
  for (const neighborhood of mishkhabNeighborhoods) {
    const success = await uploadRegion(neighborhood, 'neighborhood');
    if (success) totalUploaded++;
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\n🎉 Najaf Expansion Complete!');
  console.log('============================');
  console.log(`✅ Successfully added: ${totalUploaded} regions`);
  console.log('📍 Najaf now has 4 districts with multiple neighborhoods each');
  
  console.log('\n🔗 Test the complete Najaf hierarchy:');
  console.log('   • curl "http://localhost:3000/api/regions?parent_id=najaf"');
  console.log('   • curl "http://localhost:3000/api/regions?parent_id=najaf_center"');
  console.log('   • curl "http://localhost:3000/api/regions?parent_id=kufa"');
  console.log('   • curl "http://localhost:3000/api/regions?parent_id=najaf_manathera"');
  console.log('   • curl "http://localhost:3000/api/regions?parent_id=najaf_mishkhab"');
}

if (require.main === module) {
  main().catch(console.error);
}
