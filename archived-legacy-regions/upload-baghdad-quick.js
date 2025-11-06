#!/usr/bin/env node
/**
 * Quick Baghdad Regions Upload
 * Adds essential Baghdad districts and neighborhoods to DynamoDB
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

// Essential Baghdad regions - Districts + Key Neighborhoods
const baghdadRegions = [
  // Districts (Level 2)
  {
    regionId: 'baghdad_karkh',
    name: 'Al-Karkh District',
    name_ar: 'قضاء الكرخ',
    level: 2,
    parent_id: 'baghdad',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.3007, lng: 44.3225, radius: 12000 },
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
    coordinates: { lat: 33.3406, lng: 44.4009, radius: 12000 },
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
    coordinates: { lat: 33.3795, lng: 44.4635, radius: 10000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: false, standard: true },
    statistics: { population: 2500000, area_km2: 650, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 50 }
  },
  
  // Key Neighborhoods (Level 3)
  {
    regionId: 'baghdad_karkh_mansour',
    name: 'Al-Mansour',
    name_ar: 'المنصور',
    level: 3,
    parent_id: 'baghdad_karkh',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.2981, lng: 44.3416, radius: 4000 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: true, standard: true },
    statistics: { population: 120000, area_km2: 8.5, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 30 }
  },
  {
    regionId: 'baghdad_karkh_adel',
    name: 'Al-Adel',
    name_ar: 'العدل',
    level: 3,
    parent_id: 'baghdad_karkh',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.3234, lng: 44.2987, radius: 3800 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: false, standard: true },
    statistics: { population: 95000, area_km2: 7.3, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 35 }
  },
  {
    regionId: 'baghdad_rusafa_karrada',
    name: 'Al-Karrada',
    name_ar: 'الكرادة',
    level: 3,
    parent_id: 'baghdad_rusafa',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.3094, lng: 44.4026, radius: 4200 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: true, standard: true },
    statistics: { population: 145000, area_km2: 9.2, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 28 }
  },
  {
    regionId: 'baghdad_rusafa_new_baghdad',
    name: 'New Baghdad',
    name_ar: 'بغداد الجديدة',
    level: 3,
    parent_id: 'baghdad_rusafa',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.2987, lng: 44.4789, radius: 5500 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: false, standard: true },
    statistics: { population: 180000, area_km2: 12.1, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 40 }
  },
  {
    regionId: 'baghdad_sadr_sector1',
    name: 'Sadr City Sector 1',
    name_ar: 'مدينة الصدر - القطاع 1',
    level: 3,
    parent_id: 'baghdad_sadr_city',
    governorate_id: 'baghdad',
    coordinates: { lat: 33.3895, lng: 44.4535, radius: 3500 },
    is_active: true,
    service_config: { delivery: true, pickup: true, express: false, standard: true },
    statistics: { population: 250000, area_km2: 6.8, total_orders: 0, active_drivers: 0 },
    delivery_config: { base_fee: 2000, per_km_fee: 500, minimum_order: 15000, free_delivery_threshold: 50000, estimated_time_minutes: 45 }
  }
];

console.log('🏛️  UPLOADING BAGHDAD REGIONS TO DYNAMODB');
console.log('==========================================');
console.log(`Total regions to upload: ${baghdadRegions.length}`);
console.log('Districts: 3 | Neighborhoods: 5');
console.log('==========================================\n');

(async () => {
  let successCount = 0;
  let errorCount = 0;

  for (const region of baghdadRegions) {
    try {
      await docClient.send(new PutCommand({
        TableName: 'WizzCentral_Regions',
        Item: region
      }));
      successCount++;
      console.log(`✅ [${successCount}/${baghdadRegions.length}] ${region.name} (${region.regionId})`);
      console.log(`   Level ${region.level} | GPS: ${region.coordinates.lat}, ${region.coordinates.lng}`);
    } catch (error) {
      errorCount++;
      console.error(`❌ Error uploading ${region.regionId}: ${error.message}`);
    }
  }

  console.log('\n==========================================');
  console.log('📊 UPLOAD COMPLETE');
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('==========================================\n');
  
  if (successCount > 0) {
    console.log('🎯 Next Steps:');
    console.log('1. Check admin panel: http://localhost:3000/pages/regions.html');
    console.log('2. Verify current regions: node check-current-regions.js');
    console.log('3. Test cascading dropdowns in your apps');
    console.log('\n🔥 Your WizzCentral Platform now has complete Baghdad hierarchy!');
  }
})().catch(error => {
  console.error('💥 Fatal error:', error);
  process.exit(1);
});
