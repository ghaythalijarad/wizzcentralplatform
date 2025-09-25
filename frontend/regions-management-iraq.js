// WizzCentral Iraq Regions Management - Multi-Level Hierarchy
// Comprehensive regions management with governorates, districts, neighborhoods
// Version redeploy marker: 2025-09-25T00:00:00Z force Amplify build

const SCRIPT_VERSION = "20250926.1";

// Static comprehensive data for all Iraqi regions to be used in production
const COMPREHENSIVE_IRAQI_REGIONS = [
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
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
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
    {
        id: 'erbil_center',
        name: 'Erbil Center',
        name_ar: 'مركز أربيل',
        name_ku: 'ناوەندی هەولێر',
        level: 'district',
        parent_id: 'erbil',
        governorate_id: 'erbil',
        coordinates: { lat: 36.1911, lng: 44.0093, radius: 8000 },
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
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
        is_active: true,
        service_config: { delivery: true, pickup: true, express: true, standard: true },
        statistics: { population: 150000, area_km2: 18, total_orders: 0, active_drivers: 0 }
    },
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
    {
        id: 'mosul_center',
        name: 'Mosul Center',
        name_ar: 'مركز الموصل',
        level: 'district',
        parent_id: 'nineveh',
        governorate_id: 'nineveh',
        coordinates: { lat: 36.3350, lng: 43.1189, radius: 12000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 1200000, area_km2: 180, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'tel_afar',
        name: 'Tel Afar',
        name_ar: 'تلعفر',
        level: 'district',
        parent_id: 'nineveh',
        governorate_id: 'nineveh',
        coordinates: { lat: 36.3742, lng: 42.4505, radius: 8000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 180000, area_km2: 85, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'sulaymaniyah_center',
        name: 'Sulaymaniyah Center',
        name_ar: 'مركز السليمانية',
        name_ku: 'ناوەندی سلێمانی',
        level: 'district',
        parent_id: 'sulaymaniyah',
        governorate_id: 'sulaymaniyah',
        coordinates: { lat: 35.5650, lng: 45.4377, radius: 10000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 850000, area_km2: 120, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'halabja',
        name: 'Halabja',
        name_ar: 'هەڵەبجە',
        name_ku: 'هەڵەبجە',
        level: 'district',
        parent_id: 'sulaymaniyah',
        governorate_id: 'sulaymaniyah',
        coordinates: { lat: 35.1765, lng: 45.9852, radius: 6000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 95000, area_km2: 55, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'duhok_center',
        name: 'Duhok Center',
        name_ar: 'مركز دهوك',
        name_ku: 'ناوەندی دهۆک',
        level: 'district',
        parent_id: 'duhok',
        governorate_id: 'duhok',
        coordinates: { lat: 36.8617, lng: 42.9977, radius: 8000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 400000, area_km2: 65, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'zakho',
        name: 'Zakho',
        name_ar: 'زاخو',
        name_ku: 'زاخۆ',
        level: 'district',
        parent_id: 'duhok',
        governorate_id: 'duhok',
        coordinates: { lat: 37.1431, lng: 42.6813, radius: 6000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 180000, area_km2: 45, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'kirkuk_center',
        name: 'Kirkuk Center',
        name_ar: 'مركز كركوك',
        name_ku: 'ناوەندی کەرکووک',
        level: 'district',
        parent_id: 'kirkuk',
        governorate_id: 'kirkuk',
        coordinates: { lat: 35.4681, lng: 44.3922, radius: 10000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 750000, area_km2: 95, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'tuz_khurmatu',
        name: 'Tuz Khurmatu',
        name_ar: 'طوزخورماتو',
        name_ku: 'تووزخورماتوو',
        level: 'district',
        parent_id: 'kirkuk',
        governorate_id: 'kirkuk',
        coordinates: { lat: 34.8833, lng: 44.6333, radius: 6000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 150000, area_km2: 42, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'ramadi_center',
        name: 'Ramadi Center',
        name_ar: 'مركز الرمادي',
        level: 'district',
        parent_id: 'anbar',
        governorate_id: 'anbar',
        coordinates: { lat: 33.4224, lng: 43.3089, radius: 8000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 280000, area_km2: 55, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'fallujah',
        name: 'Fallujah',
        name_ar: 'الفلوجة',
        level: 'district',
        parent_id: 'anbar',
        governorate_id: 'anbar',
        coordinates: { lat: 33.3510, lng: 43.7844, radius: 6000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 220000, area_km2: 38, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'hit',
        name: 'Hit',
        name_ar: 'هيت',
        level: 'district',
        parent_id: 'anbar',
        governorate_id: 'anbar',
        coordinates: { lat: 33.6417, lng: 42.8261, radius: 5000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 120000, area_km2: 28, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'hillah_center',
        name: 'Hillah Center',
        name_ar: 'مركز الحلة',
        level: 'district',
        parent_id: 'babylon',
        governorate_id: 'babylon',
        coordinates: { lat: 32.4722, lng: 44.4267, radius: 8000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 580000, area_km2: 75, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'musayyib',
        name: 'Musayyib',
        name_ar: 'المسيب',
        level: 'district',
        parent_id: 'babylon',
        governorate_id: 'babylon',
        coordinates: { lat: 32.7833, lng: 44.2833, radius: 6000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 180000, area_km2: 42, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'baqubah_center',
        name: 'Baqubah Center',
        name_ar: 'مركز بعقوبة',
        level: 'district',
        parent_id: 'diyala',
        governorate_id: 'diyala',
        coordinates: { lat: 33.7500, lng: 44.6500, radius: 8000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 380000, area_km2: 58, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'khanaqin',
        name: 'Khanaqin',
        name_ar: 'خانقين',
        name_ku: 'خانەقین',
        level: 'district',
        parent_id: 'diyala',
        governorate_id: 'diyala',
        coordinates: { lat: 34.3667, lng: 45.4167, radius: 6000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 150000, area_km2: 35, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'tikrit_center',
        name: 'Tikrit Center',
        name_ar: 'مركز تكريت',
        level: 'district',
        parent_id: 'saladin',
        governorate_id: 'saladin',
        coordinates: { lat: 34.6056, lng: 43.6781, radius: 6000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 220000, area_km2: 45, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'samarra',
        name: 'Samarra',
        name_ar: 'سامراء',
        level: 'district',
        parent_id: 'saladin',
        governorate_id: 'saladin',
        coordinates: { lat: 34.1967, lng: 43.8744, radius: 5000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 180000, area_km2: 38, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'kut_center',
        name: 'Kut Center',
        name_ar: 'مركز الكوت',
        level: 'district',
        parent_id: 'wasit',
        governorate_id: 'wasit',
        coordinates: { lat: 32.5128, lng: 45.8183, radius: 8000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 380000, area_km2: 65, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'amarah_center',
        name: 'Amarah Center',
        name_ar: 'مركز العمارة',
        level: 'district',
        parent_id: 'maysan',
        governorate_id: 'maysan',
        coordinates: { lat: 31.9300, lng: 47.1500, radius: 8000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 320000, area_km2: 55, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'nasiriyah_center',
        name: 'Nasiriyah Center',
        name_ar: 'مركز الناصرية',
        level: 'district',
        parent_id: 'dhi_qar',
        governorate_id: 'dhi_qar',
        coordinates: { lat: 31.0570, lng: 46.2580, radius: 10000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 480000, area_km2: 82, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'samawah_center',
        name: 'Samawah Center',
        name_ar: 'مركز السماوة',
        level: 'district',
        parent_id: 'muthanna',
        governorate_id: 'muthanna',
        coordinates: { lat: 31.3317, lng: 45.2942, radius: 8000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 280000, area_km2: 58, total_orders: 0, active_drivers: 0 }
    },
    {
        id: 'diwaniya_center',
        name: 'Diwaniya Center',
        name_ar: 'مركز الديوانية',
        level: 'district',
        parent_id: 'qadisiyyah',
        governorate_id: 'qadisiyyah',
        coordinates: { lat: 31.9833, lng: 45.0500, radius: 8000 },
        is_active: false,
        service_config: { delivery: false, pickup: false, express: false, standard: false },
        statistics: { population: 420000, area_km2: 68, total_orders: 0, active_drivers: 0 }
    }
];

class IraqRegionsManager {
    constructor() {
        // Determine API base robustly for dev (Vite on 5173) vs local API on 3000
        const { protocol, hostname, port } = window.location;
        const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
        this.isProduction = window.location.hostname.includes('amplifyapp.com') ||
                            window.location.hostname.includes('d2f5oacwil9cbi.amplifyapp.com');
        if (this.isProduction) {
            // In production we won't call the API; keep origin for completeness
            this.apiBase = window.location.origin;
        } else if (isLocalhost) {
            // If running frontend on Vite (5173) or any port != 3000, point API to 3000
            const apiPort = port && port !== '3000' ? '3000' : (port || '3000');
            this.apiBase = `${protocol}//${hostname}:${apiPort}`;
        } else {
            this.apiBase = window.location.origin;
        }

        this.regionsData = [];
        this.currentLevel = 'governorate';
        this.currentParent = 'iraq';
        this.selectedRegion = null;
        this.map = null;
        this.mapMarkers = [];
        this.hierarchyPath = [];
        this.levelNames = ['Country', 'Governorate', 'District', 'Neighborhood', 'Street'];
        this.levelMapping = {
            0: 'country',
            1: 'governorate', 
            2: 'district',
            3: 'neighborhood',
            4: 'street'
        };
        // Hold full sample dataset for production and offline fallbacks
        this.sampleData = null;
        
        console.log('🌍 Environment detected:', this.isProduction ? 'Production (Amplify)' : 'Development');
        console.log('🔗 API Base:', this.apiBase);
        
        // Initialize event listeners
        this.initializeEventListeners();
    }

    async init() {
        // Display version badge
        const versionBadge = document.getElementById('version-badge');
        if (versionBadge) {
            versionBadge.textContent = `v${SCRIPT_VERSION}`;
        }

        // Normalize header to remove deprecated metric columns before data load
        this.normalizeTableHeader();
        console.log('🇮🇶 Iraq Regions Manager: Initializing...');
        try {
            await this.initializeMap();
            
            if (this.isProduction) {
                console.log('🌍 Production environment detected - using sample data');
                this.loadSampleRegionsData('governorate', 'iraq');
                this.showNotification('Regions management loaded successfully', 'success');
            } else {
                try {
                    console.log('🌐 Development environment - attempting to load regions from API...');
                    await this.loadRegions();
                    console.log('✅ Successfully loaded regions from API');
                } catch (apiError) {
                    console.log('🔄 API unavailable - falling back to sample data');
                    this.loadSampleRegionsData('governorate', 'iraq');
                    this.showNotification('Development mode: showing sample data', 'info');
                }
            }
            
            console.log('✅ Iraq Regions Manager: Initialized successfully');
        } catch (error) {
            console.error('❌ Iraq Regions Manager: Initialization failed:', error);
            try {
                await this.initializeMap();
                this.loadSampleRegionsData('governorate', 'iraq');
                this.showError('Using offline sample data - some features may be limited');
                console.log('✅ Iraq Regions Manager: Emergency fallback successful');
            } catch (fallbackError) {
                console.error('❌ Complete initialization failure:', fallbackError);
                this.showError('Failed to initialize regions management');
            }
        }
    }

    initializeEventListeners() {
        // Level navigation
        document.addEventListener('click', (e) => {
            if (e.target.matches('.level-nav-btn')) {
                const level = parseInt(e.target.dataset.level);
                const parentId = e.target.dataset.parentId;
                this.navigateToLevel(level, parentId);
            }
            
            if (e.target.matches('.region-drill-down')) {
                e.preventDefault();
                const regionId = e.target.dataset.regionId;
                this.drillDownToRegion(regionId);
            }

            if (e.target.matches('.breadcrumb-item')) {
                const level = parseInt(e.target.dataset.level);
                const regionId = e.target.dataset.regionId;
                this.navigateToLevel(level, regionId);
            }
        });

        // Search functionality
        const searchInput = document.getElementById('regionSearch');
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => {
                this.searchRegions(searchInput.value);
            }, 300));
        }

        // Add region button
        const addButton = document.querySelector('.btn-add-region');
        if (addButton) {
            addButton.addEventListener('click', () => this.openAddRegionModal());
        }
    }

    async loadRegions(level = this.currentLevel, parentId = this.currentParent, search = '') {
        // In production (Amplify), use sample data only since no backend APIs are available
        if (this.isProduction) {
            console.log('🌍 Production environment: Using sample data (no backend APIs on Amplify)');
            this.loadSampleRegionsData(level, parentId);
            if (search) this.applyClientSearch(search, level);
            this.showNotification('Regions loaded successfully', 'success');
            return;
        }

        // Development environment: Try API first, fallback to sample data
        try {
            this.showLoading();
            
            const params = new URLSearchParams({
                level: level,
                limit: '100'
            });

            if (parentId && parentId !== 'iraq') {
                params.append('parent_id', parentId);
            }
            
            if (search) {
                params.append('search', search);
            }

            console.log('📍 Loading regions with params:', params.toString(), '->', `${this.apiBase}/api/regions`);
            const response = await fetch(`${this.apiBase}/api/regions?${params}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const result = await response.json();

            if (result.success) {
                this.regionsData = result.data;
                this.currentLevel = level;
                this.currentParent = parentId;
                
                // Update hierarchy path
                await this.updateHierarchyPath();
                
                // Render regions
                this.renderRegions();
                this.updateMapMarkers();
                
                console.log(`📍 Loaded ${this.regionsData.length} regions for level ${level} from API`);
                
                // Show success notification for API data
                if (this.regionsData.length > 0) {
                    this.showNotification(`Loaded ${this.regionsData.length} regions from server`, 'success');
                }
            } else {
                throw new Error(result.error || 'Failed to load regions');
            }
        } catch (error) {
            console.error('❌ Error loading regions:', error);
            console.log('🔄 API unavailable in development - falling back to sample data');
            this.loadSampleRegionsData(level, parentId);
            if (search) this.applyClientSearch(search, level);
            this.showNotification('Development mode: showing sample data', 'info');
        } finally {
            this.hideLoading();
        }
    }

    async updateHierarchyPath() {
        try {
            if (!this.hierarchyPath || this.hierarchyPath.length === 0) {
                this.hierarchyPath = [{ regionName: 'Iraq', regionNameArabic: 'العراق', regionId: 'iraq', depth: 0 }];
            }

            if (this.currentParent && this.currentParent !== 'iraq') {
                const tail = this.hierarchyPath[this.hierarchyPath.length - 1];
                if (!tail || tail.regionId !== this.currentParent) {
                    if (this.isProduction) {
                        // In production, use local lookup only
                        const r = this.findRegionById(this.currentParent) || {};
                        this.hierarchyPath.push({
                            regionName: r.name || 'Unknown',
                            regionNameArabic: r.name_ar || 'غير معروف',
                            regionId: r.id || this.currentParent,
                            depth: this.hierarchyPath.length
                        });
                    } else {
                        // In development, try API first then fallback to local lookup
                        try {
                            const response = await fetch(`${this.apiBase}/api/regions/${this.currentParent}`);
                            if (response.ok) {
                                const result = await response.json();
                                const r = result.data || {};
                                this.hierarchyPath.push({
                                    regionName: r.name || 'Unknown',
                                    regionNameArabic: r.name_ar || 'غير معروف',
                                    regionId: r.id || this.currentParent,
                                    depth: this.hierarchyPath.length
                                });
                            } else {
                                throw new Error('API not available');
                            }
                        } catch (apiError) {
                            // Fallback to local lookup
                            const r = this.findRegionById(this.currentParent) || {};
                            this.hierarchyPath.push({
                                regionName: r.name || 'Unknown',
                                regionNameArabic: r.name_ar || 'غير معروف',
                                regionId: r.id || this.currentParent,
                                depth: this.hierarchyPath.length
                            });
                        }
                    }
                }
            } else {
                this.hierarchyPath = [{ regionName: 'Iraq', regionNameArabic: 'العراق', regionId: 'iraq', depth: 0 }];
            }
            
            this.renderBreadcrumb();
        } catch (error) {
            console.error('Error updating hierarchy path:', error);
            this.hierarchyPath = [{ regionName: 'Iraq', regionNameArabic: 'العراق', regionId: 'iraq', depth: 0 }];
            this.renderBreadcrumb();
        }
    }

    async checkServerStatus() {
        try {
            console.log('🔍 Checking server status...');
            const response = await fetch(`${this.apiBase}/health`, { 
                method: 'GET'
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Server is online:', result);
                return true;
            } else {
                console.log('❌ Server responded with error:', response.status, response.statusText);
                return false;
            }
        } catch (error) {
            console.log('❌ Server is not accessible:', error.message);
            console.log('💡 Make sure the development server is running:');
            console.log('   cd /Users/ghaythallaheebi/wizzcentralplatform');
            console.log('   node local-dev-server.js');
            return false;
        }
    }

    renderBreadcrumb() {
        const container = document.getElementById('hierarchyBreadcrumb');
        if (!container) return;

        const levelDisplay = (lvl) => {
            switch (lvl) {
                case 'country': return 'Country';
                case 'governorate': return 'Governorate';
                case 'district': return 'District';
                case 'neighborhood': return 'Neighborhood';
                case 'street': return 'Street';
                default: return 'Unknown';
            }
        };

        container.innerHTML = `
            <div class="breadcrumb-container">
                <div class="breadcrumb-path">
                    ${this.hierarchyPath.map((item, index) => `
                        <button class="breadcrumb-item ${index === this.hierarchyPath.length - 1 ? 'active' : ''}"
                                data-level="${index}"
                                data-region-id="${item.regionId}">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>${item.regionName}</span>
                            <span class="arabic">(${item.regionNameArabic})</span>
                        </button>
                        ${index < this.hierarchyPath.length - 1 ? '<i class="fas fa-chevron-right breadcrumb-separator"></i>' : ''}
                    `).join('')}
                </div>
                <div class="level-indicator">
                    <span class="level-badge">Level: ${levelDisplay(this.currentLevel)}</span>
                    <span class="region-count">${this.regionsData.length} regions</span>
                </div>
            </div>
        `;

        // Add styles if not already present
        this.addBreadcrumbStyles();
    }

    addBreadcrumbStyles() {
        if (document.getElementById('breadcrumb-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'breadcrumb-styles';
        styles.textContent = `
            .hierarchy-breadcrumb {
                margin: 1rem 0;
                padding: 1rem;
                background: var(--md-sys-color-surface-container);
                border-radius: var(--md-sys-shape-corner-medium);
                border: 1px solid var(--md-sys-color-outline-variant);
            }

            .breadcrumb-container {
                display: flex;
                justify-content: space-between;
                align-items: center;
                flex-wrap: wrap;
                gap: 1rem;
            }

            .breadcrumb-path {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                flex-wrap: wrap;
            }

            .breadcrumb-item {
                background: none;
                border: 1px solid var(--md-sys-color-outline);
                border-radius: var(--md-sys-shape-corner-small);
                padding: 0.5rem 0.75rem;
                cursor: pointer;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.875rem;
                color: var(--md-sys-color-on-surface);
            }

            .breadcrumb-item:hover { background: var(--md-sys-color-surface-container-high); border-color: var(--md-sys-color-primary); }
            .breadcrumb-item.active { background: var(--md-sys-color-primary-container); border-color: var(--md-sys-color-primary); color: var(--md-sys-color-on-primary-container); cursor: default; }
            .breadcrumb-item .arabic { font-size: 0.75rem; opacity: 0.7; }
            .breadcrumb-separator { color: var(--md-sys-color-on-surface-variant); font-size: 0.75rem; }
            .level-indicator { display: flex; align-items: center; gap: 1rem; }
            .level-badge { background: var(--md-sys-color-secondary-container); color: var(--md-sys-color-on-secondary-container); padding: 0.25rem 0.75rem; border-radius: var(--md-sys-shape-corner-full); font-size: 0.875rem; font-weight: 500; }
            .region-count { color: var(--md-sys-color-on-surface-variant); font-size: 0.875rem; }
        `;
        document.head.appendChild(styles);
    }

    renderRegions() {
        // Ensure header stays normalized in case of dynamic reinjection
        this.normalizeTableHeader();
        // Populate the existing table body in regions.html
        const tbody = document.getElementById('regionsTableBody');
        if (!tbody) return;

        if (!Array.isArray(this.regionsData) || this.regionsData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="loading-cell">
                        <div class="empty-state">
                            <i class="fas fa-map"></i>
                            <h3>No regions found</h3>
                            <p>No regions available at this level</p>
                        </div>
                    </td>
                </tr>
            `;
            this.updatePagination(0);
            return;
        }

        const rows = this.regionsData.map(region => {
            const nextLevel = this.getNextLevel(region.level);
            const isActive = !!region.is_active;
            const governorate = region.governorate_id || (region.level === 'governorate' ? '-' : (region.parent_id || '-'));

            return `
                <tr class="region-row ${isActive ? 'active' : 'inactive'}">
                    <td>
                        <div class="region-name-cell">
                            <span class="region-name-en">${region.name || 'Unknown'}</span>
                            <span class="region-name-ar">${region.name_ar || ''}</span>
                        </div>
                    </td>
                    <td>${governorate || '-'}</td>
                    <td>
                        <span class="status-badge ${isActive ? 'active' : 'inactive'}">
                            ${isActive ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td class="actions-cell">
                        ${nextLevel ? `<button class="action-btn view region-drill-down" data-region-id="${region.id}"><i class="fas fa-search-plus"></i> View</button>` : ''}
                        <button class="action-btn edit" onclick="regionsManager.editRegion && regionsManager.editRegion('${region.id}')"><i class="fas fa-edit"></i> Edit</button>
                        <button class="action-btn toggle" onclick="regionsManager.toggleRegionStatus && regionsManager.toggleRegionStatus('${region.id}')"><i class="fas fa-power-off"></i> Toggle</button>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.innerHTML = rows;
        
        // Update pagination info
        this.updatePagination(this.regionsData.length);
    }

    getNextLevel(currentLevel) {
        const order = ['country', 'governorate', 'district', 'neighborhood', 'street'];
        const idx = order.indexOf(currentLevel);
        if (idx === -1 || idx === order.length - 1) return null;
        return order[idx + 1];
    }

    async initializeMap() {
        try {
            const mapContainer = document.getElementById('regionsMap');
            if (!mapContainer) {
                console.warn('Map container not found');
                return;
            }

            // Initialize Leaflet map centered on Iraq
            this.map = L.map('regionsMap').setView([33.2232, 43.6793], 6);

            // Add tile layer
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);

            console.log('✅ Map initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing map:', error);
        }
    }

    updateMapMarkers() {
        if (!this.map) return;

        // Clear existing markers
        this.mapMarkers.forEach(marker => this.map.removeLayer(marker));
        this.mapMarkers = [];

        // Add markers for current regions
        this.regionsData.forEach(region => {
            const coords = region.coordinates || {};
            const center = coords.center || coords;
            if (center && typeof center.lat === 'number' && typeof center.lng === 'number') {
                const marker = L.marker([center.lat, center.lng]).addTo(this.map);

                marker.bindPopup(`
                    <div>
                        <h4>${region.name || ''}</h4>
                        <p>${region.name_ar || ''}</p>
                        <p>Status: ${region.is_active ? 'Active' : 'Inactive'}</p>
                    </div>
                `);

                this.mapMarkers.push(marker);
            }
        });

        // Fit map to show all markers
        if (this.mapMarkers.length > 0) {
            const group = new L.featureGroup(this.mapMarkers);
            this.map.fitBounds(group.getBounds().pad(0.1));
        }
    }

    focusOnMap(regionId) {
        const region = this.regionsData.find(r => r.id === regionId);
        if (!region || !region.coordinates || !this.map) return;

        const coords = region.coordinates.center || region.coordinates;
        if (!coords) return;

        this.map.setView([coords.lat, coords.lng], 12);

        // Open popup for this region
        this.mapMarkers.forEach(marker => {
            const markerLatLng = marker.getLatLng();
            if (markerLatLng.lat === coords.lat && markerLatLng.lng === coords.lng) {
                marker.openPopup();
            }
        });
    }

    // Navigation helpers
    drillDownToRegion(regionId) {
        const region = this.regionsData.find(r => r.id === regionId);
        if (!region) return;
        const nextLevel = this.getNextLevel(region.level);
        if (!nextLevel) return;

        // Extend breadcrumb path
        this.hierarchyPath = this.hierarchyPath && this.hierarchyPath.length > 0 ? this.hierarchyPath : [{ regionName: 'Iraq', regionNameArabic: 'العراق', regionId: 'iraq', depth: 0 }];
        this.hierarchyPath.push({
            regionName: region.name,
            regionNameArabic: region.name_ar,
            regionId: region.id,
            depth: this.hierarchyPath.length
        });
        this.renderBreadcrumb();

        // Load children of selected region
        this.loadRegions(nextLevel, region.id);
    }

    navigateToLevel(depthIndex, regionId) {
        // depthIndex corresponds to breadcrumb index (0=root Iraq)
        const levelByDepth = ['governorate', 'district', 'neighborhood', 'street'];
        const targetLevel = levelByDepth[depthIndex] || 'governorate';
        const targetParent = regionId || 'iraq';

        // Trim path
        this.hierarchyPath = (this.hierarchyPath || []).slice(0, depthIndex + 1);
        if (this.hierarchyPath.length === 0) {
            this.hierarchyPath = [{ regionName: 'Iraq', regionNameArabic: 'العراق', regionId: 'iraq', depth: 0 }];
        }
        this.renderBreadcrumb();

        // Load target
        this.loadRegions(targetLevel, targetParent);
    }

    searchRegions(term) {
        const q = (term || '').trim();
        if (this.isProduction) {
            // In production, use client-side search only
            this.applyClientSearch(q, this.currentLevel);
        } else {
            // In development, try API first, fallback to client search if needed
            this.loadRegions(this.currentLevel, this.currentParent, q).catch(() => {
                // If API fails, use client-side search
                this.applyClientSearch(q, this.currentLevel);
            });
        }
    }

    // Client-side search over sample data or current list
    applyClientSearch(term, level = this.currentLevel) {
        try {
            const base = (this.sampleData?.[level]) ? this.sampleData[level] : this.regionsData;
            const q = (term || '').toLowerCase();
            if (!q) {
                // Reset to base
                this.regionsData = base.slice();
            } else {
                this.regionsData = base.filter(r => {
                    const en = (r.name || '').toLowerCase();
                    const ar = (r.name_ar || '');
                    const id = (r.id || '').toLowerCase();
                    return en.includes(q) || ar.includes(term) || id.includes(q);
                });
            }
            this.renderRegions();
            this.updateMapMarkers();
            this.renderBreadcrumb();
        } catch (e) {
            console.warn('Client search failed:', e.message);
        }
    }

    findRegionById(regionId) {
        if (!regionId) return null;
        // Search current view first
        let found = (this.regionsData || []).find(r => r.id === regionId);
        if (found) return found;
        // Search sample dataset across levels
        if (this.sampleData) {
            for (const lvl of Object.keys(this.sampleData)) {
                const arr = this.sampleData[lvl] || [];
                const match = arr.find(r => r.id === regionId);
                if (match) return match;
            }
        }
        return null;
    }

    openAddRegionModal() {
        console.log('Opening add region modal for level:', this.currentLevel + 1);
        // No-op placeholder: Modal handled elsewhere
    }

    editRegion(regionId) {
        console.log('Editing region:', regionId);
        // Implementation for edit region (out of scope)
    }

    async deleteRegion(regionId) {
        const region = this.regionsData.find(r => r.id === regionId);
        if (!region) return;

        if (!confirm(`Are you sure you want to delete "${region.name}"?`)) {
            return;
        }

        try {
            const response = await fetch(`${this.apiBase}/api/regions/${regionId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                await this.loadRegions(this.currentLevel, this.currentParent);
                // statistics refresh removed (metrics no longer displayed)
                this.showSuccess('Region deleted successfully');
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Error deleting region:', error);
            this.showError('Failed to delete region');
        }
    }

    refreshRegions() {
        this.loadRegions(this.currentLevel, this.currentParent);
    }

    // Utility functions
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    showLoading() {
        const tbody = document.getElementById('regionsTableBody');
        if (tbody) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="loading-cell">
                        <div class="loading-state">
                            <i class="fas fa-spinner fa-spin"></i>
                            Loading regions data...
                        </div>
                    </td>
                </tr>
            `;
        }
    }

    hideLoading() {
        // Hidden when renderRegions() is called
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);

        // Add notification styles if not present
        this.addNotificationStyles();
    }

    addNotificationStyles() {
        if (document.getElementById('notification-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'notification-styles';
        styles.textContent = `
            .notification { position: fixed; top: 20px; right: 20px; background: var(--md-sys-color-surface); border: 1px solid var(--md-sys-color-outline); border-radius: var(--md-sys-shape-corner-medium); padding: 1rem; box-shadow: var(--md-sys-elevation-3); z-index: 10000; max-width: 400px; display: flex; align-items: center; gap: 1rem; animation: slideIn 0.3s ease-out; }
            .notification-error { border-color: var(--md-sys-color-error); background: var(--md-sys-color-error-container); color: var(--md-sys-color-on-error-container); }
            .notification-success { border-color: var(--md-sys-color-success); background: var(--md-sys-color-success-container); color: var (--md-sys-color-on-success-container); }
            .notification-content { display: flex; align-items: center; gap: 0.5rem; flex: 1; }
            .notification-close { background: none; border: none; cursor: pointer; color: inherit; opacity: 0.7; transition: opacity 0.2s ease; }
            .notification-close:hover { opacity: 1; }
            @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        `;
        document.head.appendChild(styles);
    }

    loadSampleRegionsData(level, parentId) {
        console.log('📊 Loading comprehensive static Iraqi regions data...');
        
        // Initialize and cache sample dataset if not yet set
        if (!this.sampleData) {
            // Group the flat comprehensive data by level
            this.sampleData = COMPREHENSIVE_IRAQI_REGIONS.reduce((acc, region) => {
                const regionLevel = region.level;
                if (!acc[regionLevel]) {
                    acc[regionLevel] = [];
                }
                acc[regionLevel].push(region);
                return acc;
            }, {});
            console.log('📦 Comprehensive data processed and cached.');
        }
        
        // Filter data based on the current view (level and parent)
        const dataForLevel = this.sampleData[level] || [];
        
        if (level === 'governorate') {
            // For governorate level, the parent is always 'iraq'
            this.regionsData = dataForLevel;
        } else {
            // For deeper levels, filter by parent_id
            this.regionsData = dataForLevel.filter(r => r.parent_id === parentId);
        }

        this.currentLevel = level;
        this.currentParent = parentId;
        
        // Update hierarchy path for sample data
        this.hierarchyPath = [{ regionName: 'Iraq', regionNameArabic: 'العراق', regionId: 'iraq', depth: 0 }];
        if (parentId && parentId !== 'iraq') {
            const parent = this.findRegionById(parentId);
            if (parent) {
                // Reconstruct the path up to the parent
                const path = [];
                let current = parent;
                while (current && current.parent_id) {
                    path.unshift(current);
                    current = this.findRegionById(current.parent_id);
                }
                if (current) path.unshift(current);

                this.hierarchyPath.push(...path.map((p, i) => ({
                    regionName: p.name,
                    regionNameArabic: p.name_ar,
                    regionId: p.id,
                    depth: i + 1
                })));
            }
        }
        
        // Render the data
        this.renderRegions();
        this.renderBreadcrumb();
        this.updateMapMarkers();
        
        console.log(`📊 Loaded ${this.regionsData.length} static regions for level '${level}' with parent '${parentId}'`);
    }

    normalizeTableHeader() {
        try {
            const headerRow = document.querySelector('#regionsDataTable thead tr');
            if (!headerRow) return;
            const hasDeprecated = /Drivers|Merchants|Delivery Fee|Min Order|Total Orders/i.test(headerRow.innerText) || headerRow.children.length > 4;
            if (hasDeprecated) {
                headerRow.innerHTML = `
                    <th class="sortable" onclick="sortTable('regionName')">
                        <i class="fas fa-map-marker-alt"></i>
                        Region Name
                        <i class="fas fa-sort sort-icon"></i>
                    </th>
                    <th class="sortable" onclick="sortTable('governorate')">
                        <i class="fas fa-map"></i>
                        Governorate
                        <i class="fas fa-sort sort-icon"></i>
                    </th>
                    <th class="sortable" onclick="sortTable('isActive')">
                        <i class="fas fa-power-off"></i>
                        Status
                        <i class="fas fa-sort sort-icon"></i>
                    </th>
                    <th>
                        <i class="fas fa-cog"></i>
                        Actions
                    </th>`;
                console.log('🔧 Regions table header normalized (deprecated columns removed)');
            }
        } catch (e) {
            console.warn('Header normalization failed:', e.message);
        }
    }

    updatePagination(totalItems) {
        const showingStart = document.getElementById('showingStart');
        const showingEnd = document.getElementById('showingEnd');
        const totalCount = document.getElementById('totalCount');
        const paginationInfo = document.getElementById('tablePagination');
        
        if (!showingStart || !showingEnd || !totalCount) return;
        
        if (totalItems === 0) {
            showingStart.textContent = '0';
            showingEnd.textContent = '0';
            totalCount.textContent = '0';
            if (paginationInfo) paginationInfo.style.display = 'none';
            return;
        }
        
        // For now, we show all items (no actual pagination implemented yet)
        showingStart.textContent = '1';
        showingEnd.textContent = totalItems.toString();
        totalCount.textContent = totalItems.toString();
        
        if (paginationInfo) {
            paginationInfo.style.display = 'flex';
        }
        
        // Update pagination buttons (disable since we're showing all)
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        if (prevBtn) prevBtn.disabled = true;
        if (nextBtn) nextBtn.disabled = true;
        
        // Clear page numbers since we're showing all
        const pageNumbers = document.getElementById('pageNumbers');
        if (pageNumbers) pageNumbers.innerHTML = '<button class="page-number active">1</button>';
    }
}

// Global instance and functions
let regionsManager;

// Global functions for HTML onclick handlers
function openAddRegionModal() {
    if (regionsManager) {
        regionsManager.openAddRegionModal();
    }
}

function closeRegionModal() {
    if (regionsManager) {
        regionsManager.closeRegionModal?.();
    }
}

function refreshRegionsData() {
    if (regionsManager) {
        regionsManager.refreshRegions();
    }
}

function saveRegion() {
    if (regionsManager) {
        regionsManager.saveRegion?.();
    }
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IraqRegionsManager;
}
