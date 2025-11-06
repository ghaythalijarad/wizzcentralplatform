#!/usr/bin/env node
/**
 * Complete Iraqi Regions Hierarchy Population Script
 * Populates 3-level hierarchy: Governorate → District → Neighborhood
 * Focuses on Baghdad first with complete coverage
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'WizzCentral_Regions';
const DRY_RUN = process.argv.includes('--dry-run');

console.log('🗺️  IRAQI REGIONS COMPLETE HIERARCHY POPULATION');
console.log('================================================');
console.log(`📊 Table: ${TABLE_NAME}`);
console.log(`🌍 Region: us-east-1`);
console.log(`${DRY_RUN ? '🔍 DRY RUN MODE (no changes will be made)' : '✍️  LIVE MODE (will write to DynamoDB)'}`);
console.log('================================================\n');

// Complete Iraqi Regions Data
const completeRegionsData = [
  
  // ============================================
  // BAGHDAD GOVERNORATE - COMPLETE COVERAGE
  // ============================================
  
  // Baghdad Districts (4 major districts)
  {
    regionId: 'baghdad_karkh',
    name: 'Al-Karkh District',
    name_ar: 'قضاء الكرخ',
    level: 2,
    parent_id: 'baghdad',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.3007, lng: 44.3225, radius: 15000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: true, standard: true },
    statistics: { population: 2800000, area_km2: 860, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 45 }
  },
  {
    regionId: 'baghdad_rusafa',
    name: 'Al-Rusafa District',
    name_ar: 'قضاء الرصافة',
    level: 2,
    parent_id: 'baghdad',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.3406, lng: 44.4009, radius: 15000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: true, standard: true },
    statistics: { population: 3100000, area_km2: 920, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 45 }
  },
  {
    regionId: 'baghdad_sadr_city',
    name: 'Sadr City District',
    name_ar: 'قضاء مدينة الصدر',
    level: 2,
    parent_id: 'baghdad',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.3795, lng: 44.4635, radius: 12000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: false, standard: true },
    statistics: { population: 2500000, area_km2: 650, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 50 }
  },
  {
    regionId: 'baghdad_abu_ghraib',
    name: 'Abu Ghraib District',
    name_ar: 'قضاء أبو غريب',
    level: 2,
    parent_id: 'baghdad',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.3067, lng: 44.1850, radius: 10000 },
    is_active: false,
    service_config: { delivery: false, pickup: false, express: false, standard: false },
    statistics: { population: 600000, area_km2: 480, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 3000, per_km_fee: 600, minimum_order: 20000, free_delivery_threshold: 60000, estimated_time_minutes: 60 }
  },

  // ============================================
  // AL-KARKH NEIGHBORHOODS (West Baghdad)
  // ============================================
  
  {
    regionId: 'baghdad_karkh_mansour',
    name: 'Al-Mansour',
    name_ar: 'المنصور',
    level: 3,
    parent_id: 'baghdad_karkh',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.2981, lng: 44.3416, radius: 5000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: true, standard: true },
    statistics: { population: 120000, area_km2: 8.5, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 30 }
  },
  {
    regionId: 'baghdad_karkh_khadhraa',
    name: 'Al-Khadhraa',
    name_ar: 'الخضراء',
    level: 3,
    parent_id: 'baghdad_karkh',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.3125, lng: 44.3567, radius: 4000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: true, standard: true },
    statistics: { population: 85000, area_km2: 6.2, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 30 }
  },
  {
    regionId: 'baghdad_karkh_adel',
    name: 'Al-Adel',
    name_ar: 'العدل',
    level: 3,
    parent_id: 'baghdad_karkh',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.3234, lng: 44.2987, radius: 4500 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: false, standard: true },
    statistics: { population: 95000, area_km2: 7.3, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 35 }
  },
  {
    regionId: 'baghdad_karkh_bayaa',
    name: 'Al-Bayaa',
    name_ar: 'البياع',
    level: 3,
    parent_id: 'baghdad_karkh',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.2754, lng: 44.3178, radius: 5000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: false, standard: true },
    statistics: { population: 110000, area_km2: 8.1, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 40 }
  },
  {
    regionId: 'baghdad_karkh_saidiya',
    name: 'Al-Saidiya',
    name_ar: 'الصيدية',
    level: 3,
    parent_id: 'baghdad_karkh',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.2456, lng: 44.3289, radius: 4000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: false, standard: true },
    statistics: { population: 75000, area_km2: 5.4, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 40 }
  },
  {
    regionId: 'baghdad_karkh_amiriya',
    name: 'Al-Amiriya',
    name_ar: 'العامرية',
    level: 3,
    parent_id: 'baghdad_karkh',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.2876, lng: 44.2654, radius: 6000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: false, standard: true },
    statistics: { population: 130000, area_km2: 9.8, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 45 }
  },
  {
    regionId: 'baghdad_karkh_ghazaliya',
    name: 'Al-Ghazaliya',
    name_ar: 'الغزالية',
    level: 3,
    parent_id: 'baghdad_karkh',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.2567, lng: 44.2234, radius: 5500 },
    is_active: false,
    service_config: { delivery: false, pickup: false, express: false, standard: false },
    statistics: { population: 88000, area_km2: 7.6, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2500, per_km_fee: 600, minimum_order: 20000, free_delivery_threshold: 60000, estimated_time_minutes: 50 }
  },
  {
    regionId: 'baghdad_karkh_yarmouk',
    name: 'Al-Yarmouk',
    name_ar: 'اليرموك',
    level: 3,
    parent_id: 'baghdad_karkh',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.2789, lng: 44.3345, radius: 4000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: true, standard: true },
    statistics: { population: 65000, area_km2: 4.8, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 35 }
  },

  // ============================================
  // AL-RUSAFA NEIGHBORHOODS (East Baghdad)
  // ============================================
  
  {
    regionId: 'baghdad_rusafa_karrada',
    name: 'Al-Karrada',
    name_ar: 'الكرادة',
    level: 3,
    parent_id: 'baghdad_rusafa',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.3094, lng: 44.4026, radius: 5000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: true, standard: true },
    statistics: { population: 145000, area_km2: 9.2, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 30 }
  },
  {
    regionId: 'baghdad_rusafa_jadriya',
    name: 'Al-Jadriya',
    name_ar: 'الجادرية',
    level: 3,
    parent_id: 'baghdad_rusafa',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.2876, lng: 44.3854, radius: 4000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: true, standard: true },
    statistics: { population: 72000, area_km2: 5.6, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 30 }
  },
  {
    regionId: 'baghdad_rusafa_adhamiya',
    name: 'Al-Adhamiya',
    name_ar: 'الأعظمية',
    level: 3,
    parent_id: 'baghdad_rusafa',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.3778, lng: 44.3778, radius: 5000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: false, standard: true },
    statistics: { population: 118000, area_km2: 7.9, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 35 }
  },
  {
    regionId: 'baghdad_rusafa_palestine_street',
    name: 'Palestine Street',
    name_ar: 'شارع فلسطين',
    level: 3,
    parent_id: 'baghdad_rusafa',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.3234, lng: 44.4456, radius: 6000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: true, standard: true },
    statistics: { population: 155000, area_km2: 10.4, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 40 }
  },
  {
    regionId: 'baghdad_rusafa_new_baghdad',
    name: 'New Baghdad',
    name_ar: 'بغداد الجديدة',
    level: 3,
    parent_id: 'baghdad_rusafa',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.2987, lng: 44.4789, radius: 7000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: false, standard: true },
    statistics: { population: 180000, area_km2: 12.1, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 45 }
  },
  {
    regionId: 'baghdad_rusafa_zayouna',
    name: 'Al-Zayouna',
    name_ar: 'الزيونة',
    level: 3,
    parent_id: 'baghdad_rusafa',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.3156, lng: 44.4234, radius: 4000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: true, standard: true },
    statistics: { population: 68000, area_km2: 5.2, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 35 }
  },
  {
    regionId: 'baghdad_rusafa_kadhimiya',
    name: 'Al-Kadhimiya',
    name_ar: 'الكاظمية',
    level: 3,
    parent_id: 'baghdad_rusafa',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.3817, lng: 44.3422, radius: 5000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: false, standard: true },
    statistics: { population: 125000, area_km2: 8.3, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 40 }
  },
  {
    regionId: 'baghdad_rusafa_shaab',
    name: 'Al-Shaab',
    name_ar: 'الشعب',
    level: 3,
    parent_id: 'baghdad_rusafa',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.3645, lng: 44.4345, radius: 5000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: false, standard: true },
    statistics: { population: 98000, area_km2: 7.1, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 40 }
  },

  // ============================================
  // SADR CITY NEIGHBORHOODS
  // ============================================
  
  {
    regionId: 'baghdad_sadr_sector1',
    name: 'Sadr City Sector 1',
    name_ar: 'مدينة الصدر - القطاع 1',
    level: 3,
    parent_id: 'baghdad_sadr_city',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.3895, lng: 44.4535, radius: 4000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: false, standard: true },
    statistics: { population: 250000, area_km2: 6.8, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 45 }
  },
  {
    regionId: 'baghdad_sadr_sector2',
    name: 'Sadr City Sector 2',
    name_ar: 'مدينة الصدر - القطاع 2',
    level: 3,
    parent_id: 'baghdad_sadr_city',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.3795, lng: 44.4735, radius: 4000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: false, standard: true },
    statistics: { population: 260000, area_km2: 7.2, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 50 }
  },
  {
    regionId: 'baghdad_sadr_sector3',
    name: 'Sadr City Sector 3',
    name_ar: 'مدينة الصدر - القطاع 3',
    level: 3,
    parent_id: 'baghdad_sadr_city',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.3695, lng: 44.4635, radius: 4000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: false, standard: true },
    statistics: { population: 245000, area_km2: 6.5, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 50 }
  },

  // ============================================
  // BASRA GOVERNORATE
  // ============================================
  
  {
    regionId: 'basra_central',
    name: 'Basra Central District',
    name_ar: 'قضاء مركز البصرة',
    level: 2,
    parent_id: 'basra',
    governorate_id: 'basra',
    coordinates: { lat: 30.5085, lng: 47.7804, radius: 12000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: false, standard: true },
    statistics: { population: 850000, area_km2: 140, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2500, per_km_fee: 600, minimum_order: 18000, free_delivery_threshold: 55000, estimated_time_minutes: 50 }
  },
  {
    regionId: 'basra_ashar',
    name: 'Al-Ashar',
    name_ar: 'العشار',
    level: 3,
    parent_id: 'basra_central',
    governorate_id: 'basra',
    coordinates: { lat: 30.5132, lng: 47.8167, radius: 5000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: false, standard: true },
    statistics: { population: 180000, area_km2: 12.5, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2500, per_km_fee: 600, minimum_order: 18000, free_delivery_threshold: 55000, estimated_time_minutes: 40 }
  },
  {
    regionId: 'basra_jazair',
    name: 'Al-Jazair',
    name_ar: 'الجزائر',
    level: 3,
    parent_id: 'basra_central',
    governorate_id: 'basra',
    coordinates: { lat: 30.5234, lng: 47.7989, radius: 6000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: false, standard: true },
    statistics: { population: 195000, area_km2: 14.2, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2500, per_km_fee: 600, minimum_order: 18000, free_delivery_threshold: 55000, estimated_time_minutes: 45 }
  },
  {
    regionId: 'basra_jumhuriya',
    name: 'Al-Jumhuriya',
    name_ar: 'الجمهورية',
    level: 3,
    parent_id: 'basra_central',
    governorate_id: 'basra',
    coordinates: { lat: 30.4987, lng: 47.7654, radius: 5000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: false, standard: true },
    statistics: { population: 145000, area_km2: 10.8, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2500, per_km_fee: 600, minimum_order: 18000, free_delivery_threshold: 55000, estimated_time_minutes: 45 }
  },

  // ============================================
  // NAJAF & KARBALA (Religious tourism cities)
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
    delivery_config: { base_fee: 2500, per_km_fee: 600, minimum_order: 18000, free_delivery_threshold: 55000, estimated_time_minutes: 50 }
  },
  {
    regionId: 'najaf_old_city',
    name: 'Najaf Old City',
    name_ar: 'المدينة القديمة',
    level: 3,
    parent_id: 'najaf_central',
    governorate_id: 'najaf',
    coordinates: { lat: 31.9989, lng: 44.3156, radius: 3000 },
    is_active: true,
    service_config: { delivery: true, pickup: false, express: false, standard: true },
    statistics: { population: 120000, area_km2: 8.5, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2500, per_km_fee: 600, minimum_order: 18000, free_delivery_threshold: 55000, estimated_time_minutes: 40 }
  },
  
  {
    regionId: 'karbala_central',
    name: 'Karbala Central District',
    name_ar: 'قضاء مركز كربلاء',
    level: 2,
    parent_id: 'karbala',
    governorate_id: 'karbala',
    coordinates: { lat: 32.6169, lng: 44.0252, radius: 10000 },
    is_active: true,
    service_config: { delivery: true, pickup: false, express: false, standard: true },
    statistics: { population: 550000, area_km2: 78, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2500, per_km_fee: 600, minimum_order: 18000, free_delivery_threshold: 55000, estimated_time_minutes: 50 }
  },
  {
    regionId: 'karbala_old_city',
    name: 'Karbala Old City',
    name_ar: 'المدينة القديمة',
    level: 3,
    parent_id: 'karbala_central',
    governorate_id: 'karbala',
    coordinates: { lat: 32.6154, lng: 44.0234, radius: 3000 },
    is_active: true,
    service_config: { delivery: true, pickup: false, express: false, standard: true },
    statistics: { population: 95000, area_km2: 7.2, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2500, per_km_fee: 600, minimum_order: 18000, free_delivery_threshold: 55000, estimated_time_minutes: 40 }
  }
];

// Main population function
async function populateRegions() {
  console.log(`📦 Total regions to populate: ${completeRegionsData.length}\n`);
  
  // Count by level
  const byLevel = {
    2: completeRegionsData.filter(r => r.level === 2).length,
    3: completeRegionsData.filter(r => r.level === 3).length
  };
  
  console.log('📊 Breakdown:');
  console.log(`   Districts (Level 2): ${byLevel[2]}`);
  console.log(`   Neighborhoods (Level 3): ${byLevel[3]}`);
  console.log('');
  
  if (DRY_RUN) {
    console.log('🔍 DRY RUN - Showing first 5 regions that would be created:\n');
    completeRegionsData.slice(0, 5).forEach((region, idx) => {
      console.log(`${idx + 1}. ${region.name} (${region.name_ar})`);
      console.log(`   ID: ${region.regionId}`);
      console.log(`   Level: ${region.level === 2 ? 'District' : 'Neighborhood'}`);
      console.log(`   Parent: ${region.parent_id}`);
      console.log(`   Active: ${region.is_active ? '✅' : '❌'}`);
      console.log('');
    });
    console.log(`... and ${completeRegionsData.length - 5} more regions\n`);
    console.log('✅ DRY RUN COMPLETE');
    console.log('Run without --dry-run to actually populate the database');
    return;
  }
  
  // Actually populate
  let successCount = 0;
  let errorCount = 0;
  
  console.log('✍️  Starting population...\n');
  
  for (const region of completeRegionsData) {
    try {
      await docClient.send(new PutCommand({
        TableName: TABLE_NAME,
        Item: region
      }));
      successCount++;
      console.log(`✅ ${successCount}/${completeRegionsData.length} - ${region.name} (${region.regionId})`);
    } catch (error) {
      errorCount++;
      console.error(`❌ Error populating ${region.regionId}: ${error.message}`);
    }
  }
  
  console.log('\n================================================');
  console.log('📊 POPULATION COMPLETE');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('================================================\n');
  
  console.log('🔍 Verifying total regions in database...');
  const scanResult = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
  console.log(`📊 Total regions in database: ${scanResult.Items.length}`);
  
  const levels = {};
  scanResult.Items.forEach(item => {
    const levelName = item.level === 0 ? 'Country' : item.level === 1 ? 'Governorate' : item.level === 2 ? 'District' : 'Neighborhood';
    levels[levelName] = (levels[levelName] || 0) + 1;
  });
  
  console.log('\n📋 Current Database Structure:');
  Object.entries(levels).forEach(([level, count]) => {
    console.log(`   ${level}: ${count}`);
  });
  
  console.log('\n✅ Population script completed successfully!');
  console.log('🌐 Check your admin panel: http://localhost:3000/pages/regions.html');
}

// Run the script
populateRegions().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
