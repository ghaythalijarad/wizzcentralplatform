// Script to expand Iraqi regions data with comprehensive districts and neighborhoods

const comprehensiveRegionsExpansion = [
    // ==================== EXPANDED DISTRICTS ====================
    
    // BAGHDAD DISTRICTS (More detailed)
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
    {
        id: 'al_kadhimiya',
        name: 'Al-Kadhimiya',
        name_ar: 'الكاظمية',
        level: 'district',
        parent_id: 'baghdad',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3789, lng: 44.3396, radius: 9000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 750000, area_km2: 52, total_orders: 5800, active_drivers: 35 }
    },
    {
        id: 'al_thawra',
        name: 'Al-Thawra',
        name_ar: 'الثورة',
        level: 'district',
        parent_id: 'baghdad',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3547, lng: 44.4547, radius: 12000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 2200000, area_km2: 85, total_orders: 7500, active_drivers: 40 }
    },
    {
        id: 'new_baghdad',
        name: 'New Baghdad',
        name_ar: 'بغداد الجديدة',
        level: 'district',
        parent_id: 'baghdad',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.2850, lng: 44.4500, radius: 10000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 580000, area_km2: 38, total_orders: 3900, active_drivers: 26 }
    },

    // BASRA DISTRICTS (More detailed)
    {
        id: 'al_maqal',
        name: 'Al-Maqal',
        name_ar: 'المعقل',
        level: 'district',
        parent_id: 'basra',
        governorate_id: 'basra',
        coordinates: { lat: 30.5200, lng: 47.7600, radius: 8000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 420000, area_km2: 35, total_orders: 2800, active_drivers: 18 }
    },
    {
        id: 'al_hartha',
        name: 'Al-Hartha',
        name_ar: 'الهارثة',
        level: 'district',
        parent_id: 'basra',
        governorate_id: 'basra',
        coordinates: { lat: 30.6150, lng: 47.8200, radius: 12000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 380000, area_km2: 55, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'abu_al_khasib',
        name: 'Abu Al-Khasib',
        name_ar: 'أبو الخصيب',
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
        id: 'erbil_center',
        name: 'Erbil Center',
        name_ar: 'مركز أربيل',
        name_ku: 'ناوەندی هەولێر',
        level: 'district',
        parent_id: 'erbil',
        governorate_id: 'erbil',
        coordinates: { lat: 36.1911, lng: 44.0093, radius: 8000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 850000, area_km2: 45, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'ankawa',
        name: 'Ankawa',
        name_ar: 'عنكاوا',
        name_ku: 'عەنکاوا',
        level: 'district',
        parent_id: 'erbil',
        governorate_id: 'erbil',
        coordinates: { lat: 36.2200, lng: 44.0400, radius: 6000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 150000, area_km2: 18, total_orders: 0, active_drivers: 0 }
    },

    // NAJAF DISTRICTS
    {
        id: 'najaf_center',
        name: 'Najaf Center',
        name_ar: 'مركز النجف',
        level: 'district',
        parent_id: 'najaf',
        governorate_id: 'najaf',
        coordinates: { lat: 31.9996, lng: 44.3267, radius: 8000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 650000, area_km2: 32, total_orders: 2100, active_drivers: 15 }
    },
    {
        id: 'kufa',
        name: 'Kufa',
        name_ar: 'الكوفة',
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
        id: 'karbala_center',
        name: 'Karbala Center',
        name_ar: 'مركز كربلاء',
        level: 'district',
        parent_id: 'karbala',
        governorate_id: 'karbala',
        coordinates: { lat: 32.6169, lng: 44.0252, radius: 8000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 580000, area_km2: 25, total_orders: 1900, active_drivers: 12 }
    },
    {
        id: 'hindiya',
        name: 'Hindiya',
        name_ar: 'الهندية',
        level: 'district',
        parent_id: 'karbala',
        governorate_id: 'karbala',
        coordinates: { lat: 32.5567, lng: 44.2633, radius: 12000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 180000, area_km2: 45, total_orders: 0, active_drivers: 0 }
    },

    // ==================== EXPANDED NEIGHBORHOODS ====================

    // BAGHDAD NEIGHBORHOODS (Al-Karkh District)
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
    {
        id: 'al_amiriya',
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
        id: 'al_ghazaliya',
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
        id: 'al_dora',
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

    // BAGHDAD NEIGHBORHOODS (Al-Rusafa District)
    {
        id: 'al_jadriya',
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
        id: 'al_waziriya',
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
        id: 'al_arasat',
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
        id: 'al_sinaa',
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

    // BAGHDAD NEIGHBORHOODS (Al-Adhamiya District)
    {
        id: 'al_adhamiya_center',
        name: 'Al-Adhamiya Center',
        name_ar: 'مركز الأعظمية',
        level: 'neighborhood',
        parent_id: 'al_adhamiya',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3717, lng: 44.3842, radius: 2500 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 180000, area_km2: 8, total_orders: 2100, active_drivers: 12 }
    },
    {
        id: 'al_salam',
        name: 'Al-Salam',
        name_ar: 'السلام',
        level: 'neighborhood',
        parent_id: 'al_adhamiya',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3856, lng: 44.3967, radius: 4000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 320000, area_km2: 16, total_orders: 1900, active_drivers: 11 }
    },

    // BAGHDAD NEIGHBORHOODS (Al-Kadhimiya District)
    {
        id: 'al_kadhimiya_center',
        name: 'Al-Kadhimiya Center',
        name_ar: 'مركز الكاظمية',
        level: 'neighborhood',
        parent_id: 'al_kadhimiya',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3789, lng: 44.3396, radius: 2000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 150000, area_km2: 6, total_orders: 2600, active_drivers: 14 }
    },
    {
        id: 'al_shula',
        name: 'Al-Shula',
        name_ar: 'الشعلة',
        level: 'neighborhood',
        parent_id: 'al_kadhimiya',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.4012, lng: 44.3225, radius: 5000 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 580000, area_km2: 32, total_orders: 2800, active_drivers: 16 }
    },

    // BAGHDAD NEIGHBORHOODS (New Baghdad District)
    {
        id: 'new_baghdad_center',
        name: 'New Baghdad Center',
        name_ar: 'مركز بغداد الجديدة',
        level: 'neighborhood',
        parent_id: 'new_baghdad',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.2850, lng: 44.4500, radius: 3000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 220000, area_km2: 12, total_orders: 1800, active_drivers: 11 }
    },
    {
        id: 'al_zaafaraniya',
        name: 'Al-Zaafaraniya',
        name_ar: 'الزعفرانية',
        level: 'neighborhood',
        parent_id: 'new_baghdad',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.2654, lng: 44.4713, radius: 4000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 360000, area_km2: 26, total_orders: 2100, active_drivers: 15 }
    },

    // BASRA NEIGHBORHOODS (Al-Maqal District)
    {
        id: 'al_maqal_center',
        name: 'Al-Maqal Center',
        name_ar: 'مركز المعقل',
        level: 'neighborhood',
        parent_id: 'al_maqal',
        governorate_id: 'basra',
        coordinates: { lat: 30.5200, lng: 47.7600, radius: 2500 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 180000, area_km2: 10, total_orders: 1200, active_drivers: 8 }
    },
    {
        id: 'al_jamhuriya',
        name: 'Al-Jamhuriya',
        name_ar: 'الجمهورية',
        level: 'neighborhood',
        parent_id: 'al_maqal',
        governorate_id: 'basra',
        coordinates: { lat: 30.5350, lng: 47.7750, radius: 3000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: false, standard: true },
        statistics: { population: 240000, area_km2: 15, total_orders: 1600, active_drivers: 10 }
    },

    // BASRA NEIGHBORHOODS (Basra Central District)
    {
        id: 'al_hakimiya',
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
        id: 'al_tameemi',
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

    // ERBIL NEIGHBORHOODS (Erbil Center District)
    {
        id: 'erbil_citadel',
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
        id: 'shorsh',
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

    // NAJAF NEIGHBORHOODS (Najaf Center District)
    {
        id: 'najaf_old_city',
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
        id: 'al_maidan',
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

    // KARBALA NEIGHBORHOODS (Karbala Center District)
    {
        id: 'karbala_old_city',
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
        id: 'al_hur',
        name: 'Al-Hur',
        name_ar: 'الحر',
        level: 'neighborhood',
        parent_id: 'karbala_center',
        governorate_id: 'karbala',
        coordinates: { lat: 32.6250, lng: 44.0350, radius: 3500 },
        is_active: true,
        service_config: { delivery: true, pickup: false, express: false, standard: true },
        statistics: { population: 220000, area_km2: 15, total_orders: 1010, active_drivers: 6 }
    }
];

console.log(`Generated comprehensive regions expansion with ${comprehensiveRegionsExpansion.length} additional regions:`);
console.log('- Districts:', comprehensiveRegionsExpansion.filter(r => r.level === 'district').length);
console.log('- Neighborhoods:', comprehensiveRegionsExpansion.filter(r => r.level === 'neighborhood').length);

module.exports = comprehensiveRegionsExpansion;
