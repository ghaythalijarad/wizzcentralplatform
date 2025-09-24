// Complete Iraqi Regions Data Population Script
// This script populates DynamoDB with comprehensive Iraqi regions data

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
const dynamoClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const dynamoDB = DynamoDBDocumentClient.from(dynamoClient);
const REGIONS_TABLE = 'WizzCentral_Regions';

// Complete Iraqi Regions Dataset - All 18 Governorates + Major Cities
const completeIraqiRegions = [
    // Country Level
    {
        id: 'iraq',
        name: 'Iraq',
        name_ar: 'العراق',
        level: 'country',
        parent_id: null,
        governorate_id: null,
        coordinates: { lat: 33.2232, lng: 43.6793, radius: 1000000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 40222493, area_km2: 438317, total_orders: 125680, active_drivers: 456 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'active'
        }
    },

    // ALL 18 GOVERNORATES OF IRAQ
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
        statistics: { population: 9000000, area_km2: 5072, total_orders: 45230, active_drivers: 234 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'active'
        }
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
        statistics: { population: 2500000, area_km2: 19070, total_orders: 12450, active_drivers: 89 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'active'
        }
    },
    {
        id: 'nineveh',
        name: 'Nineveh',
        name_ar: 'نينوى',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'nineveh',
        coordinates: { lat: 36.3407, lng: 43.1186, radius: 60000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 3270000, area_km2: 37323, total_orders: 0, active_drivers: 0 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'inactive'
        }
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
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1612700, area_km2: 15074, total_orders: 0, active_drivers: 0 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'inactive'
        }
    },
    {
        id: 'sulaymaniyah',
        name: 'Sulaymaniyah',
        name_ar: 'السليمانية',
        name_ku: 'سلێمانی',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'sulaymaniyah',
        coordinates: { lat: 35.5650, lng: 45.4377, radius: 40000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1950000, area_km2: 17023, total_orders: 0, active_drivers: 0 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'inactive'
        }
    },
    {
        id: 'duhok',
        name: 'Duhok',
        name_ar: 'دهوك',
        name_ku: 'دهۆک',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'duhok',
        coordinates: { lat: 36.8617, lng: 42.9977, radius: 30000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1292535, area_km2: 6553, total_orders: 0, active_drivers: 0 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'inactive'
        }
    },
    {
        id: 'kirkuk',
        name: 'Kirkuk',
        name_ar: 'كركوك',
        name_ku: 'کەرکووک',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'kirkuk',
        coordinates: { lat: 35.4681, lng: 44.3922, radius: 35000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1395614, area_km2: 9679, total_orders: 0, active_drivers: 0 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'inactive'
        }
    },
    {
        id: 'anbar',
        name: 'Anbar',
        name_ar: 'الأنبار',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'anbar',
        coordinates: { lat: 33.4224, lng: 41.8818, radius: 80000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1561000, area_km2: 138501, total_orders: 0, active_drivers: 0 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'inactive'
        }
    },
    {
        id: 'najaf',
        name: 'Najaf',
        name_ar: 'النجف',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'najaf',
        coordinates: { lat: 31.9996, lng: 44.3267, radius: 30000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 1285500, area_km2: 28824, total_orders: 3240, active_drivers: 23 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'active'
        }
    },
    {
        id: 'karbala',
        name: 'Karbala',
        name_ar: 'كربلاء',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'karbala',
        coordinates: { lat: 32.6160, lng: 44.0242, radius: 25000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 1066600, area_km2: 5034, total_orders: 2890, active_drivers: 19 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'active'
        }
    },
    {
        id: 'babylon',
        name: 'Babylon',
        name_ar: 'بابل',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'babylon',
        coordinates: { lat: 32.5403, lng: 44.4215, radius: 30000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 2065042, area_km2: 5315, total_orders: 0, active_drivers: 0 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'inactive'
        }
    },
    {
        id: 'diyala',
        name: 'Diyala',
        name_ar: 'ديالى',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'diyala',
        coordinates: { lat: 33.7500, lng: 44.9667, radius: 40000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1443200, area_km2: 17685, total_orders: 0, active_drivers: 0 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'inactive'
        }
    },
    {
        id: 'saladin',
        name: 'Saladin',
        name_ar: 'صلاح الدين',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'saladin',
        coordinates: { lat: 34.6186, lng: 43.6793, radius: 35000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1508000, area_km2: 24751, total_orders: 0, active_drivers: 0 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'inactive'
        }
    },
    {
        id: 'wasit',
        name: 'Wasit',
        name_ar: 'واسط',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'wasit',
        coordinates: { lat: 32.4833, lng: 45.8333, radius: 30000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1225000, area_km2: 17153, total_orders: 0, active_drivers: 0 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'inactive'
        }
    },
    {
        id: 'maysan',
        name: 'Maysan',
        name_ar: 'ميسان',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'maysan',
        coordinates: { lat: 31.9306, lng: 47.1361, radius: 35000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1010000, area_km2: 16072, total_orders: 0, active_drivers: 0 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'inactive'
        }
    },
    {
        id: 'dhi_qar',
        name: 'Dhi Qar',
        name_ar: 'ذي قار',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'dhi_qar',
        coordinates: { lat: 31.0500, lng: 46.2583, radius: 40000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1890000, area_km2: 12900, total_orders: 0, active_drivers: 0 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'inactive'
        }
    },
    {
        id: 'muthanna',
        name: 'Muthanna',
        name_ar: 'المثنى',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'muthanna',
        coordinates: { lat: 29.7500, lng: 45.8333, radius: 35000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 719000, area_km2: 51740, total_orders: 0, active_drivers: 0 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'inactive'
        }
    },
    {
        id: 'qadisiyyah',
        name: 'Qadisiyyah',
        name_ar: 'القادسية',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'qadisiyyah',
        coordinates: { lat: 31.9833, lng: 44.9167, radius: 30000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1220000, area_km2: 8153, total_orders: 0, active_drivers: 0 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'inactive'
        }
    },

    // MAJOR CITIES (DISTRICT LEVEL) - Baghdad Districts
    {
        id: 'baghdad_karkh',
        name: 'Al-Karkh',
        name_ar: 'الكرخ',
        level: 'district',
        parent_id: 'baghdad',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3354, lng: 44.3412, radius: 20000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 4500000, area_km2: 2536, total_orders: 22615, active_drivers: 117 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'active'
        }
    },
    {
        id: 'baghdad_rusafa',
        name: 'Al-Rusafa',
        name_ar: 'الرصافة',
        level: 'district',
        parent_id: 'baghdad',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3000, lng: 44.4000, radius: 20000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 4500000, area_km2: 2536, total_orders: 22615, active_drivers: 117 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'active'
        }
    },

    // Major Districts in Other Governorates
    {
        id: 'basra_central',
        name: 'Basra Central',
        name_ar: 'مركز البصرة',
        level: 'district',
        parent_id: 'basra',
        governorate_id: 'basra',
        coordinates: { lat: 30.5085, lng: 47.7804, radius: 15000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 850000, area_km2: 140, total_orders: 6780, active_drivers: 42 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'active'
        }
    },
    {
        id: 'mosul_center',
        name: 'Mosul Center',
        name_ar: 'مركز الموصل',
        level: 'district',
        parent_id: 'nineveh',
        governorate_id: 'nineveh',
        coordinates: { lat: 36.3407, lng: 43.1186, radius: 15000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1500000, area_km2: 180, total_orders: 0, active_drivers: 0 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'inactive'
        }
    },
    {
        id: 'erbil_center',
        name: 'Erbil Center',
        name_ar: 'مركز أربيل',
        name_ku: 'ناوەندی هەولێر',
        level: 'district',
        parent_id: 'erbil',
        governorate_id: 'erbil',
        coordinates: { lat: 36.1911, lng: 44.0093, radius: 12000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 900000, area_km2: 120, total_orders: 0, active_drivers: 0 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'inactive'
        }
    },
    {
        id: 'najaf_center',
        name: 'Najaf Center',
        name_ar: 'مركز النجف',
        level: 'district',
        parent_id: 'najaf',
        governorate_id: 'najaf',
        coordinates: { lat: 31.9996, lng: 44.3267, radius: 10000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 650000, area_km2: 85, total_orders: 1890, active_drivers: 15 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'active'
        }
    },
    {
        id: 'karbala_center',
        name: 'Karbala Center',
        name_ar: 'مركز كربلاء',
        level: 'district',
        parent_id: 'karbala',
        governorate_id: 'karbala',
        coordinates: { lat: 32.6160, lng: 44.0242, radius: 8000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 520000, area_km2: 65, total_orders: 1540, active_drivers: 12 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'active'
        }
    },

    // NEIGHBORHOOD LEVEL - Baghdad Neighborhoods
    {
        id: 'karrada',
        name: 'Al-Karrada',
        name_ar: 'الكرادة',
        level: 'neighborhood',
        parent_id: 'baghdad_rusafa',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3085, lng: 44.3937, radius: 3000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 320000, area_km2: 12, total_orders: 8900, active_drivers: 45 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'active'
        }
    },
    {
        id: 'mansour',
        name: 'Al-Mansour',
        name_ar: 'المنصور',
        level: 'neighborhood',
        parent_id: 'baghdad_karkh',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3354, lng: 44.3412, radius: 3500 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 280000, area_km2: 15, total_orders: 7650, active_drivers: 38 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'active'
        }
    },
    {
        id: 'jadiriya',
        name: 'Al-Jadiriya',
        name_ar: 'الجادرية',
        level: 'neighborhood',
        parent_id: 'baghdad_rusafa',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.2862, lng: 44.3777, radius: 2500 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 180000, area_km2: 8, total_orders: 5420, active_drivers: 28 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'active'
        }
    },
    {
        id: 'kadhimiya',
        name: 'Al-Kadhimiya',
        name_ar: 'الكاظمية',
        level: 'neighborhood',
        parent_id: 'baghdad_karkh',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3789, lng: 44.3396, radius: 3000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 250000, area_km2: 10, total_orders: 6230, active_drivers: 32 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'active'
        }
    },
    {
        id: 'adhamiya',
        name: 'Al-Adhamiya',
        name_ar: 'الأعظمية',
        level: 'neighborhood',
        parent_id: 'baghdad_rusafa',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3717, lng: 44.3842, radius: 2800 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 200000, area_km2: 9, total_orders: 4890, active_drivers: 25 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'active'
        }
    },
    {
        id: 'sadr_city',
        name: 'Sadr City',
        name_ar: 'مدينة الصدر',
        level: 'neighborhood',
        parent_id: 'baghdad_rusafa',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3547, lng: 44.4547, radius: 4000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 750000, area_km2: 18, total_orders: 3200, active_drivers: 16 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'active'
        }
    },

    // Basra Neighborhoods
    {
        id: 'basra_old_city',
        name: 'Basra Old City',
        name_ar: 'البصرة القديمة',
        level: 'neighborhood',
        parent_id: 'basra_central',
        governorate_id: 'basra',
        coordinates: { lat: 30.5000, lng: 47.7700, radius: 2000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 150000, area_km2: 6, total_orders: 2340, active_drivers: 18 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'active'
        }
    },
    {
        id: 'ashar',
        name: 'Al-Ashar',
        name_ar: 'العشار',
        level: 'neighborhood',
        parent_id: 'basra_central',
        governorate_id: 'basra',
        coordinates: { lat: 30.5100, lng: 47.7850, radius: 2500 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 200000, area_km2: 8, total_orders: 3120, active_drivers: 24 },
        metadata: {
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_by: 'system',
            status: 'active'
        }
    }
];

// Function to batch write regions to DynamoDB
async function populateRegions() {
    console.log('🇮🇶 Starting Iraqi Regions Population...');
    
    const batchSize = 25; // DynamoDB batch limit
    const batches = [];
    
    // Split regions into batches
    for (let i = 0; i < completeIraqiRegions.length; i += batchSize) {
        batches.push(completeIraqiRegions.slice(i, i + batchSize));
    }
    
    let totalInserted = 0;
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        
        const requestItems = {
            [REGIONS_TABLE]: batch.map(region => ({
                PutRequest: {
                    Item: region
                }
            }))
        };
        
        try {
            console.log(`📦 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} items)...`);
            
            const command = new BatchWriteCommand({
                RequestItems: requestItems
            });
            
            const result = await dynamoDB.send(command);
            
            if (result.UnprocessedItems && Object.keys(result.UnprocessedItems).length > 0) {
                console.warn('⚠️ Some items were not processed:', result.UnprocessedItems);
            }
            
            totalInserted += batch.length;
            console.log(`✅ Batch ${batchIndex + 1} completed. Total inserted: ${totalInserted}`);
            
            // Add delay between batches to avoid throttling
            if (batchIndex < batches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
        } catch (error) {
            console.error(`❌ Error processing batch ${batchIndex + 1}:`, error);
            
            // Fallback: try individual inserts for this batch
            console.log('🔄 Attempting individual inserts for failed batch...');
            for (const region of batch) {
                try {
                    const putCommand = new PutCommand({
                        TableName: REGIONS_TABLE,
                        Item: region
                    });
                    
                    await dynamoDB.send(putCommand);
                    totalInserted++;
                    console.log(`✅ Individual insert: ${region.name}`);
                    
                } catch (individualError) {
                    console.error(`❌ Failed to insert ${region.name}:`, individualError.message);
                }
            }
        }
    }
    
    console.log('🎉 Iraqi Regions Population Complete!');
    console.log(`📊 Total regions inserted: ${totalInserted}/${completeIraqiRegions.length}`);
    console.log('\n📍 Summary:');
    console.log(`   • Country: 1 (Iraq)`);
    console.log(`   • Governorates: 18 (all Iraqi governorates)`);
    console.log(`   • Districts: 8 (major city centers)`);
    console.log(`   • Neighborhoods: ${completeIraqiRegions.filter(r => r.level === 'neighborhood').length} (Baghdad, Basra areas)`);
    console.log(`   • Active regions: ${completeIraqiRegions.filter(r => r.is_active).length}`);
    console.log(`   • Inactive regions: ${completeIraqiRegions.filter(r => !r.is_active).length}`);
    
    return totalInserted;
}

// Test function to verify data
async function verifyData() {
    try {
        console.log('\n🔍 Verifying inserted data...');
        
        const { ScanCommand } = require('@aws-sdk/lib-dynamodb');
        const scanCommand = new ScanCommand({
            TableName: REGIONS_TABLE
        });
        
        const result = await dynamoDB.send(scanCommand);
        const regions = result.Items || [];
        
        console.log(`📊 Found ${regions.length} regions in database`);
        
        // Group by level
        const byLevel = regions.reduce((acc, region) => {
            acc[region.level] = (acc[region.level] || 0) + 1;
            return acc;
        }, {});
        
        console.log('📈 Breakdown by level:', byLevel);
        
        // Show active vs inactive
        const activeCount = regions.filter(r => r.is_active).length;
        const inactiveCount = regions.filter(r => !r.is_active).length;
        
        console.log(`✅ Active regions: ${activeCount}`);
        console.log(`❌ Inactive regions: ${inactiveCount}`);
        
        return regions;
        
    } catch (error) {
        console.error('❌ Error verifying data:', error);
        return [];
    }
}

// Main execution
async function main() {
    try {
        await populateRegions();
        await verifyData();
        
        console.log('\n🎯 Iraqi regions data population completed successfully!');
        console.log('🌐 You can now view all Iraqi cities and governorates in the regions management page.');
        
    } catch (error) {
        console.error('❌ Population failed:', error);
        process.exit(1);
    }
}

// Export for module usage
if (require.main === module) {
    main();
}

module.exports = {
    completeIraqiRegions,
    populateRegions,
    verifyData
};
