// Sync local comprehensive data to DynamoDB
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Configure DynamoDB client for AWS
const dynamoClient = new DynamoDBClient({
    region: 'us-east-1',
});
const dynamoDocClient = DynamoDBDocumentClient.from(dynamoClient);

const TABLE_NAME = 'WizzCentral_Regions';

// Import the comprehensive data from our local server
const fs = require('fs');
const path = require('path');

// Function to convert our local format to DynamoDB format
function convertToAwsFormat(localRegion) {
    return {
        regionId: localRegion.id,
        regionName: localRegion.name,
        regionNameArabic: localRegion.name_ar,
        regionCode: localRegion.id.replace(/^(iraq|REG_IQ_?)/, '').toUpperCase(),
        countryCode: 'IQ',
        level: localRegion.level === 'country' ? 0 : 
               localRegion.level === 'governorate' ? 1 :
               localRegion.level === 'district' ? 2 : 3,
        parentRegionId: localRegion.parent_id || 'ROOT',
        governorateId: localRegion.governorate_id || localRegion.id,
        hierarchy: localRegion.level === 'country' ? ['IQ'] :
                  localRegion.level === 'governorate' ? ['IQ', localRegion.id.replace(/^(iraq|REG_IQ_?)/, '').toUpperCase()] :
                  ['IQ', localRegion.governorate_id.replace(/^(iraq|REG_IQ_?)/, '').toUpperCase(), localRegion.id.replace(/^.*_/, '').toUpperCase()],
        coordinates: {
            radius: localRegion.coordinates?.radius || 10000,
            boundaries: [
                { lng: (localRegion.coordinates?.lng || 44.3661) - 0.05, lat: (localRegion.coordinates?.lat || 33.3152) + 0.05 },
                { lng: (localRegion.coordinates?.lng || 44.3661) + 0.05, lat: (localRegion.coordinates?.lat || 33.3152) + 0.05 },
                { lng: (localRegion.coordinates?.lng || 44.3661) + 0.05, lat: (localRegion.coordinates?.lat || 33.3152) - 0.05 },
                { lng: (localRegion.coordinates?.lng || 44.3661) - 0.05, lat: (localRegion.coordinates?.lat || 33.3152) - 0.05 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: localRegion.is_active ? 'active' : 'inactive',
            populationEstimate: localRegion.statistics?.population || 0,
            areaKm2: localRegion.statistics?.area_km2 || 0
        },
        serviceConfig: {
            minimumOrder: localRegion.level === 'country' ? 0 : 
                         localRegion.level === 'governorate' ? 15000 :
                         localRegion.level === 'district' ? 12000 : 10000,
            deliveryFee: localRegion.level === 'country' ? 0 : 
                        localRegion.level === 'governorate' ? 2000 :
                        localRegion.level === 'district' ? 1500 : 1000,
            maxDeliveryDistance: localRegion.coordinates?.radius || 10000,
            isActive: localRegion.is_active,
            estimatedDeliveryTime: localRegion.level === 'country' ? 0 : 
                                  localRegion.level === 'governorate' ? 45 :
                                  localRegion.level === 'district' ? 35 : 25,
            serviceTypes: {
                delivery: localRegion.service_config?.delivery ?? true,
                pickup: localRegion.service_config?.pickup ?? true,
                dineIn: localRegion.service_config?.dineIn ?? true
            }
        },
        statistics: {
            totalOrders: localRegion.statistics?.total_orders || 0,
            activeDrivers: localRegion.statistics?.active_drivers || 0,
            activeMerchants: Math.floor((localRegion.statistics?.active_drivers || 0) * 3.5),
            avgOrderValue: localRegion.level === 'neighborhood' ? 35000 :
                          localRegion.level === 'district' ? 30000 :
                          localRegion.level === 'governorate' ? 28000 : 25000
        }
    };
}

// Comprehensive Iraqi regions from our working local data
const comprehensiveIraqiRegions = [
    {
        id: 'iraq',
        name: 'Iraq',
        name_ar: 'العراق',
        level: 'country',
        parent_id: null,
        governorate_id: null,
        coordinates: { lat: 33.2232, lng: 43.6793, radius: 500000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 40222493, area_km2: 438317, total_orders: 125680, active_drivers: 456 }
    },
    {
        id: 'baghdad',
        name: 'Baghdad',
        name_ar: 'بغداد',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3152, lng: 44.3661, radius: 50000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 9000000, area_km2: 5072, total_orders: 45230, active_drivers: 234 }
    },
    {
        id: 'basra',
        name: 'Basra',
        name_ar: 'البصرة',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'basra',
        coordinates: { lat: 30.5085, lng: 47.7804, radius: 45000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 2500000, area_km2: 19070, total_orders: 12450, active_drivers: 89 }
    },
    {
        id: 'erbil',
        name: 'Erbil',
        name_ar: 'أربيل',
        name_ku: 'هەولێر',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'erbil',
        coordinates: { lat: 36.1911, lng: 44.0093, radius: 35000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 1612700, area_km2: 15074, total_orders: 8940, active_drivers: 67 }
    },
    {
        id: 'mosul',
        name: 'Mosul',
        name_ar: 'الموصل',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'mosul',
        coordinates: { lat: 36.3407, lng: 43.1186, radius: 40000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 1800000, area_km2: 37323, total_orders: 6750, active_drivers: 52 }
    },
    {
        id: 'najaf',
        name: 'Najaf',
        name_ar: 'النجف',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'najaf',
        coordinates: { lat: 31.9996, lng: 44.3197, radius: 25000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 1400000, area_km2: 28824, total_orders: 3240, active_drivers: 23 }
    },
    {
        id: 'karbala',
        name: 'Karbala',
        name_ar: 'كربلاء',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'karbala',
        coordinates: { lat: 32.6160, lng: 44.0244, radius: 20000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 1240000, area_km2: 5034, total_orders: 2890, active_drivers: 19 }
    },
    {
        id: 'sulaymaniyah',
        name: 'Sulaymaniyah',
        name_ar: 'السليمانية',
        name_ku: 'سلێمانی',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'sulaymaniyah',
        coordinates: { lat: 35.5650, lng: 45.4329, radius: 30000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1200000, area_km2: 17023, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'dohuk',
        name: 'Dohuk',
        name_ar: 'دهوك',
        name_ku: 'دھۆک',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'dohuk',
        coordinates: { lat: 36.8622, lng: 42.9964, radius: 25000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 750000, area_km2: 6553, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'kirkuk',
        name: 'Kirkuk',
        name_ar: 'كركوك',
        name_ku: 'کەرکووک',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'kirkuk',
        coordinates: { lat: 35.4681, lng: 44.3922, radius: 28000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1395000, area_km2: 9679, total_orders: 0, active_drivers: 0 }
    },
    // Baghdad Districts
    {
        id: 'al_karkh',
        name: 'Al-Karkh',
        name_ar: 'الكرخ',
        level: 'district',
        parent_id: 'baghdad',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3007, lng: 44.3225, radius: 15000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 2800000, area_km2: 860, total_orders: 18500, active_drivers: 95 }
    },
    {
        id: 'al_rusafa',
        name: 'Al-Rusafa',
        name_ar: 'الرصافة',
        level: 'district',
        parent_id: 'baghdad',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3406, lng: 44.4009, radius: 15000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 3100000, area_km2: 920, total_orders: 19800, active_drivers: 105 }
    },
    {
        id: 'al_adhamiya',
        name: 'Al-Adhamiya',
        name_ar: 'الأعظمية',
        level: 'district',
        parent_id: 'baghdad',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3717, lng: 44.3842, radius: 8000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 650000, area_km2: 45, total_orders: 4200, active_drivers: 28 }
    },
    // Basra Districts
    {
        id: 'basra_central',
        name: 'Basra Central',
        name_ar: 'مركز البصرة',
        level: 'district',
        parent_id: 'basra',
        governorate_id: 'basra',
        coordinates: { lat: 30.5085, lng: 47.7804, radius: 12000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 850000, area_km2: 140, total_orders: 6780, active_drivers: 42 }
    },
    // Al-Karkh Neighborhoods
    {
        id: 'al_mansour',
        name: 'Al-Mansour',
        name_ar: 'المنصور',
        level: 'neighborhood',
        parent_id: 'al_karkh',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.293, lng: 44.3353, radius: 6000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 520000, area_km2: 32, total_orders: 6200, active_drivers: 38 }
    },
    {
        id: 'al_yarmouk',
        name: 'Al-Yarmouk',
        name_ar: 'اليرموك',
        level: 'neighborhood',
        parent_id: 'al_karkh',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.2854, lng: 44.3425, radius: 3000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 280000, area_km2: 12, total_orders: 3200, active_drivers: 18 }
    },
    {
        id: 'al_bayaa',
        name: 'Al-Bayaa',
        name_ar: 'البياع',
        level: 'neighborhood',
        parent_id: 'al_karkh',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.2545, lng: 44.3125, radius: 4000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 350000, area_km2: 18, total_orders: 4100, active_drivers: 22 }
    },
    // Al-Rusafa Neighborhoods
    {
        id: 'al_karrada',
        name: 'Al-Karrada',
        name_ar: 'الكرادة',
        level: 'neighborhood',
        parent_id: 'al_rusafa',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.312, lng: 44.3896, radius: 3500 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 450000, area_km2: 25, total_orders: 7800, active_drivers: 42 }
    },
    {
        id: 'sadr_city',
        name: 'Sadr City',
        name_ar: 'مدينة الصدر',
        level: 'neighborhood',
        parent_id: 'al_rusafa',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3547, lng: 44.4547, radius: 8000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 2200000, area_km2: 85, total_orders: 7500, active_drivers: 40 }
    },
    // Basra Neighborhoods
    {
        id: 'al_ashar',
        name: 'Al-Ashar',
        name_ar: 'العشار',
        level: 'neighborhood',
        parent_id: 'basra_central',
        governorate_id: 'basra',
        coordinates: { lat: 30.515, lng: 47.785, radius: 4000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 320000, area_km2: 22, total_orders: 3450, active_drivers: 18 }
    }
];

async function syncToAWS() {
    console.log('🚀 Starting sync of comprehensive Iraqi regions to AWS DynamoDB...');
    console.log(`📊 Total regions to sync: ${comprehensiveIraqiRegions.length}`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const localRegion of comprehensiveIraqiRegions) {
        try {
            const awsRegion = convertToAwsFormat(localRegion);
            
            const command = new PutCommand({
                TableName: TABLE_NAME,
                Item: awsRegion
            });
            
            await dynamoDocClient.send(command);
            console.log(`✅ Synced: ${localRegion.name} (${localRegion.name_ar}) - Level: ${localRegion.level}`);
            successCount++;
            
            // Small delay to avoid overwhelming DynamoDB
            await new Promise(resolve => setTimeout(resolve, 200));
            
        } catch (error) {
            console.error(`❌ Failed to sync ${localRegion.name}:`, error.message);
            errorCount++;
        }
    }
    
    console.log('\n🎉 Sync completed!');
    console.log(`✅ Successfully synced: ${successCount} regions`);
    console.log(`❌ Failed syncs: ${errorCount} regions`);
    
    // Verify the final state
    try {
        const scanCommand = new ScanCommand({
            TableName: TABLE_NAME,
            Select: 'COUNT'
        });
        
        const result = await dynamoDocClient.send(scanCommand);
        console.log(`📊 Total items in AWS DynamoDB table: ${result.Count}`);
        
    } catch (error) {
        console.error('Failed to verify table count:', error.message);
    }
}

// Run the sync
syncToAWS().catch(console.error);
