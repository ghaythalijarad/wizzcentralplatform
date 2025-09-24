// Script to inject comprehensive Iraqi regions data
const fs = require('fs');
const path = require('path');

// Comprehensive additional regions data
const additionalRegions = `
    // ==================== ADDITIONAL DISTRICTS ====================
    
    // More BAGHDAD DISTRICTS
    {
        id: 'al_adhamiya_district',
        name: 'Al-Adhamiya District',
        name_ar: 'قضاء الأعظمية',
        level: 'district',
        parent_id: 'baghdad',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3717, lng: 44.3842, radius: 8000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 650000, area_km2: 45, total_orders: 4200, active_drivers: 28 }
    },
    {
        id: 'al_kadhimiya_district',
        name: 'Al-Kadhimiya District',
        name_ar: 'قضاء الكاظمية',
        level: 'district',
        parent_id: 'baghdad',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3789, lng: 44.3396, radius: 9000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 750000, area_km2: 52, total_orders: 5800, active_drivers: 35 }
    },
    {
        id: 'al_thawra_district',
        name: 'Al-Thawra District',
        name_ar: 'قضاء الثورة',
        level: 'district',
        parent_id: 'baghdad',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3547, lng: 44.4547, radius: 12000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 2200000, area_km2: 85, total_orders: 7500, active_drivers: 40 }
    },
    {
        id: 'new_baghdad_district',
        name: 'New Baghdad District',
        name_ar: 'قضاء بغداد الجديدة',
        level: 'district',
        parent_id: 'baghdad',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.2850, lng: 44.4500, radius: 10000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 580000, area_km2: 38, total_orders: 3900, active_drivers: 26 }
    },

    // More BASRA DISTRICTS
    {
        id: 'al_maqal_district',
        name: 'Al-Maqal District',
        name_ar: 'قضاء المعقل',
        level: 'district',
        parent_id: 'basra',
        governorate_id: 'basra',
        coordinates: { lat: 30.5200, lng: 47.7600, radius: 8000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 420000, area_km2: 35, total_orders: 2800, active_drivers: 18 }
    },
    {
        id: 'al_hartha_district',
        name: 'Al-Hartha District',
        name_ar: 'قضاء الهارثة',
        level: 'district',
        parent_id: 'basra',
        governorate_id: 'basra',
        coordinates: { lat: 30.6150, lng: 47.8200, radius: 12000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 380000, area_km2: 55, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'abu_al_khasib_district',
        name: 'Abu Al-Khasib District',
        name_ar: 'قضاء أبو الخصيب',
        level: 'district',
        parent_id: 'basra',
        governorate_id: 'basra',
        coordinates: { lat: 30.0400, lng: 47.9300, radius: 15000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 290000, area_km2: 75, total_orders: 0, active_drivers: 0 }
    },

    // ERBIL DISTRICTS
    {
        id: 'erbil_center_district',
        name: 'Erbil Center District',
        name_ar: 'قضاء مركز أربيل',
        name_ku: 'قەزای ناوەندی هەولێر',
        level: 'district',
        parent_id: 'erbil',
        governorate_id: 'erbil',
        coordinates: { lat: 36.1911, lng: 44.0093, radius: 8000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 850000, area_km2: 45, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'shaqlawa_district',
        name: 'Shaqlawa District',
        name_ar: 'قضاء شقلاوة',
        name_ku: 'قەزای شەقڵاوە',
        level: 'district',
        parent_id: 'erbil',
        governorate_id: 'erbil',
        coordinates: { lat: 36.4083, lng: 44.3183, radius: 15000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 95000, area_km2: 1200, total_orders: 0, active_drivers: 0 }
    },

    // NAJAF DISTRICTS
    {
        id: 'najaf_center_district',
        name: 'Najaf Center District',
        name_ar: 'قضاء مركز النجف',
        level: 'district',
        parent_id: 'najaf',
        governorate_id: 'najaf',
        coordinates: { lat: 31.9996, lng: 44.3267, radius: 8000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 650000, area_km2: 32, total_orders: 2100, active_drivers: 15 }
    },
    {
        id: 'kufa_district',
        name: 'Kufa District',
        name_ar: 'قضاء الكوفة',
        level: 'district',
        parent_id: 'najaf',
        governorate_id: 'najaf',
        coordinates: { lat: 32.0296, lng: 44.3731, radius: 10000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 220000, area_km2: 28, total_orders: 980, active_drivers: 8 }
    },

    // KARBALA DISTRICTS
    {
        id: 'karbala_center_district',
        name: 'Karbala Center District',
        name_ar: 'قضاء مركز كربلاء',
        level: 'district',
        parent_id: 'karbala',
        governorate_id: 'karbala',
        coordinates: { lat: 32.6169, lng: 44.0252, radius: 8000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 580000, area_km2: 25, total_orders: 1900, active_drivers: 12 }
    },
    {
        id: 'hindiya_district',
        name: 'Hindiya District',
        name_ar: 'قضاء الهندية',
        level: 'district',
        parent_id: 'karbala',
        governorate_id: 'karbala',
        coordinates: { lat: 32.5567, lng: 44.2633, radius: 12000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 180000, area_km2: 45, total_orders: 0, active_drivers: 0 }
    },

    // ==================== EXPANDED NEIGHBORHOODS ====================

    // BAGHDAD NEIGHBORHOODS (Al-Karkh Areas)
    {
        id: 'al_yarmouk_neighborhood',
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
        id: 'al_bayaa_neighborhood',
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
    {
        id: 'al_amiriya_neighborhood',
        name: 'Al-Amiriya',
        name_ar: 'الأميرية',
        level: 'neighborhood',
        parent_id: 'al_karkh',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3154, lng: 44.2987, radius: 5000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 420000, area_km2: 22, total_orders: 4800, active_drivers: 26 }
    },
    {
        id: 'al_ghazaliya_neighborhood',
        name: 'Al-Ghazaliya',
        name_ar: 'الغزالية',
        level: 'neighborhood',
        parent_id: 'al_karkh',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3567, lng: 44.2845, radius: 4500 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 380000, area_km2: 20, total_orders: 3600, active_drivers: 20 }
    },
    {
        id: 'al_dora_neighborhood',
        name: 'Al-Dora',
        name_ar: 'الدورة',
        level: 'neighborhood',
        parent_id: 'al_karkh',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.2145, lng: 44.3687, radius: 6000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 450000, area_km2: 28, total_orders: 2900, active_drivers: 16 }
    },

    // BAGHDAD NEIGHBORHOODS (Al-Rusafa Areas)
    {
        id: 'al_jadriya_neighborhood',
        name: 'Al-Jadriya',
        name_ar: 'الجادرية',
        level: 'neighborhood',
        parent_id: 'al_rusafa',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.2862, lng: 44.3777, radius: 3500 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 120000, area_km2: 8, total_orders: 2800, active_drivers: 16 }
    },
    {
        id: 'al_waziriya_neighborhood',
        name: 'Al-Waziriya',
        name_ar: 'الوزيرية',
        level: 'neighborhood',
        parent_id: 'al_rusafa',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3289, lng: 44.3945, radius: 2500 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 85000, area_km2: 6, total_orders: 2200, active_drivers: 12 }
    },
    {
        id: 'al_arasat_neighborhood',
        name: 'Al-Arasat',
        name_ar: 'الأراضي',
        level: 'neighborhood',
        parent_id: 'al_rusafa',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3240, lng: 44.3951, radius: 2000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 65000, area_km2: 4, total_orders: 1800, active_drivers: 10 }
    },
    {
        id: 'al_sinaa_neighborhood',
        name: 'Al-Sinaa',
        name_ar: 'الصناع',
        level: 'neighborhood',
        parent_id: 'al_rusafa',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3425, lng: 44.4125, radius: 3000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 190000, area_km2: 11, total_orders: 2900, active_drivers: 15 }
    },

    // BASRA NEIGHBORHOODS
    {
        id: 'al_maqal_center_neighborhood',
        name: 'Al-Maqal Center',
        name_ar: 'مركز المعقل',
        level: 'neighborhood',
        parent_id: 'basra_central',
        governorate_id: 'basra',
        coordinates: { lat: 30.5200, lng: 47.7600, radius: 2500 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 180000, area_km2: 10, total_orders: 1200, active_drivers: 8 }
    },
    {
        id: 'al_jamhuriya_neighborhood',
        name: 'Al-Jamhuriya',
        name_ar: 'الجمهورية',
        level: 'neighborhood',
        parent_id: 'basra_central',
        governorate_id: 'basra',
        coordinates: { lat: 30.5350, lng: 47.7750, radius: 3000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 240000, area_km2: 15, total_orders: 1600, active_drivers: 10 }
    },
    {
        id: 'al_hakimiya_neighborhood',
        name: 'Al-Hakimiya',
        name_ar: 'الحكيمية',
        level: 'neighborhood',
        parent_id: 'basra_central',
        governorate_id: 'basra',
        coordinates: { lat: 30.5150, lng: 47.7900, radius: 2500 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 160000, area_km2: 8, total_orders: 1400, active_drivers: 9 }
    },
    {
        id: 'al_tameemi_neighborhood',
        name: 'Al-Tameemi',
        name_ar: 'التميمي',
        level: 'neighborhood',
        parent_id: 'basra_central',
        governorate_id: 'basra',
        coordinates: { lat: 30.5050, lng: 47.8050, radius: 3000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 200000, area_km2: 12, total_orders: 1800, active_drivers: 11 }
    },

    // ERBIL NEIGHBORHOODS
    {
        id: 'erbil_citadel_neighborhood',
        name: 'Erbil Citadel',
        name_ar: 'قلعة أربيل',
        name_ku: 'قەڵای هەولێر',
        level: 'neighborhood',
        parent_id: 'erbil_center',
        governorate_id: 'erbil',
        coordinates: { lat: 36.1911, lng: 44.0093, radius: 1000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 5000, area_km2: 1, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'shorsh_neighborhood',
        name: 'Shorsh',
        name_ar: 'شورش',
        name_ku: 'شۆڕش',
        level: 'neighborhood',
        parent_id: 'erbil_center',
        governorate_id: 'erbil',
        coordinates: { lat: 36.1850, lng: 44.0200, radius: 2500 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 120000, area_km2: 8, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'ankawa_neighborhood',
        name: 'Ankawa',
        name_ar: 'عنكاوا',
        name_ku: 'عەنکاوا',
        level: 'neighborhood',
        parent_id: 'erbil_center',
        governorate_id: 'erbil',
        coordinates: { lat: 36.2200, lng: 44.0400, radius: 6000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 150000, area_km2: 18, total_orders: 0, active_drivers: 0 }
    },

    // NAJAF NEIGHBORHOODS
    {
        id: 'najaf_old_city_neighborhood',
        name: 'Najaf Old City',
        name_ar: 'النجف القديمة',
        level: 'neighborhood',
        parent_id: 'najaf_center',
        governorate_id: 'najaf',
        coordinates: { lat: 31.9996, lng: 44.3267, radius: 2000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 180000, area_km2: 6, total_orders: 980, active_drivers: 7 }
    },
    {
        id: 'al_maidan_neighborhood',
        name: 'Al-Maidan',
        name_ar: 'الميدان',
        level: 'neighborhood',
        parent_id: 'najaf_center',
        governorate_id: 'najaf',
        coordinates: { lat: 32.0050, lng: 44.3350, radius: 3000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 220000, area_km2: 12, total_orders: 1120, active_drivers: 8 }
    },

    // KARBALA NEIGHBORHOODS
    {
        id: 'karbala_old_city_neighborhood',
        name: 'Karbala Old City',
        name_ar: 'كربلاء القديمة',
        level: 'neighborhood',
        parent_id: 'karbala_center',
        governorate_id: 'karbala',
        coordinates: { lat: 32.6169, lng: 44.0252, radius: 2000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 160000, area_km2: 5, total_orders: 890, active_drivers: 6 }
    },
    {
        id: 'al_hur_neighborhood',
        name: 'Al-Hur',
        name_ar: 'الحر',
        level: 'neighborhood',
        parent_id: 'karbala_center',
        governorate_id: 'karbala',
        coordinates: { lat: 32.6250, lng: 44.0350, radius: 3500 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 220000, area_km2: 15, total_orders: 1010, active_drivers: 6 }
    },`;

console.log('🔍 Reading current server file...');
const serverFilePath = path.join(__dirname, 'local-dev-server.js');
let serverContent = fs.readFileSync(serverFilePath, 'utf8');

// Find the location to insert new regions (before the closing of the array)
const insertionPoint = serverContent.lastIndexOf('    }');
const beforeInsertion = serverContent.substring(0, insertionPoint + 5);
const afterInsertion = serverContent.substring(insertionPoint + 5);

// Insert the additional regions
const updatedContent = beforeInsertion + ',' + additionalRegions + afterInsertion;

console.log('✏️  Adding comprehensive Iraqi regions data...');
fs.writeFileSync(serverFilePath, updatedContent, 'utf8');

console.log('✅ Successfully expanded Iraqi regions data!');
console.log('📊 Added comprehensive districts and neighborhoods for major Iraqi cities');
console.log('');
console.log('🏙️  Enhanced regions include:');
console.log('   • Baghdad: Multiple districts and neighborhoods');
console.log('   • Basra: Districts and neighborhoods');
console.log('   • Erbil: Districts including Citadel and Ankawa');
console.log('   • Najaf: Historic and modern areas');
console.log('   • Karbala: Religious and residential districts');
console.log('');
console.log('🚀 Ready to restart the server for updated data!');
