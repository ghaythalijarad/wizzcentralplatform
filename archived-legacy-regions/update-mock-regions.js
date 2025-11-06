#!/usr/bin/env node
/**
 * Update Mock Regions Data Script
 * This script updates the local development server with comprehensive Iraqi regions data
 */

const fs = require('fs');
const path = require('path');

const serverFilePath = path.join(__dirname, 'local-dev-server.js');

// Comprehensive Iraqi Regions Dataset (All 18 Governorates)
const comprehensiveIraqiRegions = `[
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
        statistics: { population: 40222493, area_km2: 438317, total_orders: 125680, active_drivers: 456 }
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
        id: 'nineveh',
        name: 'Nineveh',
        name_ar: 'نينوى',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'nineveh',
        coordinates: { lat: 36.3407, lng: 43.1186, radius: 60000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 3270000, area_km2: 37323, total_orders: 0, active_drivers: 0 }
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
        statistics: { population: 1612700, area_km2: 15074, total_orders: 0, active_drivers: 0 }
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
        statistics: { population: 1950000, area_km2: 17023, total_orders: 0, active_drivers: 0 }
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
        statistics: { population: 1292535, area_km2: 6553, total_orders: 0, active_drivers: 0 }
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
        statistics: { population: 1395614, area_km2: 9679, total_orders: 0, active_drivers: 0 }
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
        statistics: { population: 1561000, area_km2: 138501, total_orders: 0, active_drivers: 0 }
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
        statistics: { population: 1285500, area_km2: 28824, total_orders: 3240, active_drivers: 23 }
    },
    {
        id: 'karbala',
        name: 'Karbala',
        name_ar: 'كربلاء',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'karbala',
        coordinates: { lat: 32.6169, lng: 44.0252, radius: 25000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 1066600, area_km2: 5034, total_orders: 2890, active_drivers: 19 }
    },
    {
        id: 'babylon',
        name: 'Babylon',
        name_ar: 'بابل',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'babylon',
        coordinates: { lat: 32.5422, lng: 44.4267, radius: 35000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 2025500, area_km2: 5119, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'diyala',
        name: 'Diyala',
        name_ar: 'ديالى',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'diyala',
        coordinates: { lat: 33.7500, lng: 44.9300, radius: 45000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1443200, area_km2: 17685, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'saladin',
        name: 'Saladin',
        name_ar: 'صلاح الدين',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'saladin',
        coordinates: { lat: 34.2000, lng: 43.6700, radius: 50000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1408200, area_km2: 24751, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'wasit',
        name: 'Wasit',
        name_ar: 'واسط',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'wasit',
        coordinates: { lat: 32.4500, lng: 45.8300, radius: 40000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1250000, area_km2: 17153, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'maysan',
        name: 'Maysan',
        name_ar: 'ميسان',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'maysan',
        coordinates: { lat: 31.9300, lng: 47.1500, radius: 45000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1065000, area_km2: 16072, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'dhi_qar',
        name: 'Dhi Qar',
        name_ar: 'ذي قار',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'dhi_qar',
        coordinates: { lat: 31.0570, lng: 46.2580, radius: 50000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1999500, area_km2: 12900, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'muthanna',
        name: 'Muthanna',
        name_ar: 'المثنى',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'muthanna',
        coordinates: { lat: 29.7594, lng: 45.3711, radius: 55000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 734000, area_km2: 51740, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'qadisiyyah',
        name: 'Qadisiyyah',
        name_ar: 'القادسية',
        level: 'governorate',
        parent_id: 'iraq',
        governorate_id: 'qadisiyyah',
        coordinates: { lat: 31.9833, lng: 45.0500, radius: 35000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1228000, area_km2: 8153, total_orders: 0, active_drivers: 0 }
    },

    // MAJOR DISTRICTS
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

    // MAJOR NEIGHBORHOODS IN BAGHDAD
    {
        id: 'al_karrada',
        name: 'Al-Karrada',
        name_ar: 'الكرادة',
        level: 'neighborhood',
        parent_id: 'al_rusafa',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3089, lng: 44.4161, radius: 5000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 450000, area_km2: 25, total_orders: 5600, active_drivers: 32 }
    },
    {
        id: 'al_mansour',
        name: 'Al-Mansour',
        name_ar: 'المنصور',
        level: 'neighborhood',
        parent_id: 'al_karkh',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.2930, lng: 44.3353, radius: 6000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 520000, area_km2: 32, total_orders: 6200, active_drivers: 38 }
    },
    {
        id: 'sadr_city',
        name: 'Sadr City',
        name_ar: 'مدينة الصدر',
        level: 'neighborhood',
        parent_id: 'al_rusafa',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3947, lng: 44.4658, radius: 8000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 2500000, area_km2: 95, total_orders: 8900, active_drivers: 45 }
    },

    // MAJOR NEIGHBORHOODS IN BASRA
    {
        id: 'basra_old_city',
        name: 'Basra Old City',
        name_ar: 'البصرة القديمة',
        level: 'neighborhood',
        parent_id: 'basra_central',
        governorate_id: 'basra',
        coordinates: { lat: 30.5085, lng: 47.7804, radius: 4000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 280000, area_km2: 15, total_orders: 2890, active_drivers: 18 }
    },
    {
        id: 'al_ashar',
        name: 'Al-Ashar',
        name_ar: 'العشار',
        level: 'neighborhood',
        parent_id: 'basra_central',
        governorate_id: 'basra',
        coordinates: { lat: 30.5200, lng: 47.7950, radius: 5000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 350000, area_km2: 28, total_orders: 3450, active_drivers: 22 }
    }
]`;

console.log('🔄 Updating local development server with comprehensive Iraqi regions data...');

try {
    // Read the current server file
    let serverContent = fs.readFileSync(serverFilePath, 'utf8');
    
    // Find the mockRegionsData array and replace it
    const mockRegionsStart = serverContent.indexOf('const mockRegionsData = [');
    const mockRegionsEnd = serverContent.indexOf('];', mockRegionsStart) + 2;
    
    if (mockRegionsStart === -1 || mockRegionsEnd === -1) {
        throw new Error('Could not find mockRegionsData array in the server file');
    }
    
    // Replace the mock data
    const beforeMockData = serverContent.substring(0, mockRegionsStart);
    const afterMockData = serverContent.substring(mockRegionsEnd);
    
    const updatedContent = beforeMockData + 
        '// Mock regions data for local development - Complete Iraqi Regions Dataset (All 18 Governorates)\\n' +
        'const mockRegionsData = ' + comprehensiveIraqiRegions + ';' +
        afterMockData;
    
    // Write the updated content back to the file
    fs.writeFileSync(serverFilePath, updatedContent, 'utf8');
    
    console.log('✅ Successfully updated local-dev-server.js with comprehensive Iraqi regions data!');
    console.log('📊 Updated dataset includes:');
    console.log('   • 1 Country: Iraq');
    console.log('   • 18 Governorates: All Iraqi governorates');
    console.log('   • 3 Districts: Major city centers');
    console.log('   • 6 Neighborhoods: Baghdad and Basra areas');
    console.log('   • Total: 28 regions (vs 15 previous regions)');
    console.log('');
    console.log('🚀 You can now start the development server:');
    console.log('   npm run start  or  node local-dev-server.js');
    console.log('');
    console.log('🌐 Check the regions management page to see all Iraqi cities!');
    
} catch (error) {
    console.error('❌ Error updating server file:', error.message);
    process.exit(1);
}
