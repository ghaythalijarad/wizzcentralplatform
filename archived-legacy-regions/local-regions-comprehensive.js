#!/usr/bin/env node
/**
 * Local Development Server for Central Platform Region API
 * Serves COMPREHENSIVE REAL Iraq regions data (All 18 Governorates)
 * Run this instead of deploying to AWS during development
 */

const http = require('http');
const url = require('url');

const PORT = 3001;
const HOST = 'localhost';

// COMPREHENSIVE IRAQ REGIONS DATA - All 18 Governorates with Districts & Neighborhoods
const REGIONS = [
  // ========== 1. BAGHDAD (بغداد) ==========
  { regionId: "REG_BGD", regionName: "Baghdad", nameEn: "Baghdad", nameAr: "بغداد", regionType: "PROVINCE", status: "ACTIVE", parentId: null, level: 1 },
  { regionId: "REG_BGD_KARKH", regionName: "Al-Karkh", nameEn: "Al-Karkh", nameAr: "الكرخ", governorate: "Baghdad", regionType: "DISTRICT", status: "ACTIVE", parentId: "REG_BGD", level: 2 },
  { regionId: "REG_BGD_RUSAFA", regionName: "Al-Rusafa", nameEn: "Al-Rusafa", nameAr: "الرصافة", governorate: "Baghdad", regionType: "DISTRICT", status: "ACTIVE", parentId: "REG_BGD", level: 2 },
  { regionId: "REG_BGD_KARKH_MANSOUR", regionName: "Al-Mansour", nameEn: "Al-Mansour", nameAr: "المنصور", governorate: "Baghdad", regionType: "NEIGHBORHOOD", status: "ACTIVE", parentId: "REG_BGD_KARKH", level: 3, gpsCoordinates: { lat: 33.3152, lng: 44.3661 } },
  { regionId: "REG_BGD_KARKH_KADHIMIYA", regionName: "Al-Kadhimiya", nameEn: "Al-Kadhimiya", nameAr: "الكاظمية", governorate: "Baghdad", regionType: "NEIGHBORHOOD", status: "ACTIVE", parentId: "REG_BGD_KARKH", level: 3, gpsCoordinates: { lat: 33.3794, lng: 44.3403 } },
  { regionId: "REG_BGD_RUSAFA_SADR", regionName: "Sadr City", nameEn: "Sadr City", nameAr: "مدينة الصدر", governorate: "Baghdad", regionType: "NEIGHBORHOOD", status: "ACTIVE", parentId: "REG_BGD_RUSAFA", level: 3, gpsCoordinates: { lat: 33.3963, lng: 44.4598 } },

  // ========== 2. BASRA (البصرة) ==========
  { regionId: "REG_BASRA", regionName: "Basra", nameEn: "Basra", nameAr: "البصرة", regionType: "PROVINCE", status: "ACTIVE", parentId: null, level: 1 },
  { regionId: "REG_BASRA_CENTER", regionName: "Basra Center", nameEn: "Basra Center", nameAr: "مركز البصرة", governorate: "Basra", regionType: "DISTRICT", status: "ACTIVE", parentId: "REG_BASRA", level: 2 },
  { regionId: "REG_BASRA_ZUBAIR", regionName: "Az Zubayr", nameEn: "Az Zubayr", nameAr: "الزبير", governorate: "Basra", regionType: "DISTRICT", status: "ACTIVE", parentId: "REG_BASRA", level: 2 },
  { regionId: "REG_BASRA_CENTER_ASHAR", regionName: "Al-Ashar", nameEn: "Al-Ashar", nameAr: "العشار", governorate: "Basra", regionType: "NEIGHBORHOOD", status: "ACTIVE", parentId: "REG_BASRA_CENTER", level: 3, gpsCoordinates: { lat: 30.5085, lng: 47.8133 } },
  { regionId: "REG_BASRA_ZUBAIR_CENTER", regionName: "Az Zubayr Center", nameEn: "Az Zubayr Center", nameAr: "مركز الزبير", governorate: "Basra", regionType: "NEIGHBORHOOD", status: "ACTIVE", parentId: "REG_BASRA_ZUBAIR", level: 3, gpsCoordinates: { lat: 30.3895, lng: 47.7025 } },

  // ========== 3. ERBIL (أربيل) ==========
  { regionId: "REG_ERBIL", regionName: "Erbil", nameEn: "Erbil", nameAr: "أربيل", regionType: "PROVINCE", status: "ACTIVE", parentId: null, level: 1 },
  { regionId: "REG_ERBIL_CENTER", regionName: "Erbil Center", nameEn: "Erbil Center", nameAr: "مركز أربيل", governorate: "Erbil", regionType: "DISTRICT", status: "ACTIVE", parentId: "REG_ERBIL", level: 2 },
  { regionId: "REG_ERBIL_CENTER_ANKAWA", regionName: "Ankawa", nameEn: "Ankawa", nameAr: "عنكاوا", governorate: "Erbil", regionType: "NEIGHBORHOOD", status: "ACTIVE", parentId: "REG_ERBIL_CENTER", level: 3, gpsCoordinates: { lat: 36.2219, lng: 43.9985 } },
  { regionId: "REG_ERBIL_CENTER_CITADEL", regionName: "Erbil Citadel", nameEn: "Erbil Citadel", nameAr: "قلعة أربيل", governorate: "Erbil", regionType: "NEIGHBORHOOD", status: "ACTIVE", parentId: "REG_ERBIL_CENTER", level: 3, gpsCoordinates: { lat: 36.1911, lng: 44.0092 } },

  // ========== 4. NINAWA (نينوى) ==========
  { regionId: "REG_NINAWA", regionName: "Ninawa", nameEn: "Ninawa", nameAr: "نينوى", regionType: "PROVINCE", status: "ACTIVE", parentId: null, level: 1 },
  { regionId: "REG_NINAWA_MOSUL", regionName: "Mosul", nameEn: "Mosul", nameAr: "الموصل", governorate: "Ninawa", regionType: "DISTRICT", status: "ACTIVE", parentId: "REG_NINAWA", level: 2 },
  { regionId: "REG_NINAWA_MOSUL_LEFT", regionName: "Left Bank", nameEn: "Left Bank", nameAr: "الساحل الأيسر", governorate: "Ninawa", regionType: "NEIGHBORHOOD", status: "ACTIVE", parentId: "REG_NINAWA_MOSUL", level: 3, gpsCoordinates: { lat: 36.3350, lng: 43.1189 } },
  { regionId: "REG_NINAWA_MOSUL_RIGHT", regionName: "Right Bank", nameEn: "Right Bank", nameAr: "الساحل الأيمن", governorate: "Ninawa", regionType: "NEIGHBORHOOD", status: "ACTIVE", parentId: "REG_NINAWA_MOSUL", level: 3, gpsCoordinates: { lat: 36.3489, lng: 43.1453 } },

  // ========== 5. SULAYMANIYAH (السليمانية) ==========
  { regionId: "REG_SULAYMANIYAH", regionName: "Sulaymaniyah", nameEn: "Sulaymaniyah", nameAr: "السليمانية", regionType: "PROVINCE", status: "ACTIVE", parentId: null, level: 1 },
  { regionId: "REG_SULAYMANIYAH_CENTER", regionName: "Sulaymaniyah Center", nameEn: "Sulaymaniyah Center", nameAr: "مركز السليمانية", governorate: "Sulaymaniyah", regionType: "DISTRICT", status: "ACTIVE", parentId: "REG_SULAYMANIYAH", level: 2 },
  { regionId: "REG_SULAYMANIYAH_SARAY", regionName: "Saray", nameEn: "Saray", nameAr: "سراي", governorate: "Sulaymaniyah", regionType: "NEIGHBORHOOD", status: "ACTIVE", parentId: "REG_SULAYMANIYAH_CENTER", level: 3, gpsCoordinates: { lat: 35.5575, lng: 45.4375 } },

  // ========== 6. KIRKUK (كركوك) ==========
  { regionId: "REG_KIRKUK", regionName: "Kirkuk", nameEn: "Kirkuk", nameAr: "كركوك", regionType: "PROVINCE", status: "ACTIVE", parentId: null, level: 1 },
  { regionId: "REG_KIRKUK_CENTER", regionName: "Kirkuk Center", nameEn: "Kirkuk Center", nameAr: "مركز كركوك", governorate: "Kirkuk", regionType: "DISTRICT", status: "ACTIVE", parentId: "REG_KIRKUK", level: 2 },
  { regionId: "REG_KIRKUK_CENTER_QORIA", regionName: "Al-Qoria", nameEn: "Al-Qoria", nameAr: "القورية", governorate: "Kirkuk", regionType: "NEIGHBORHOOD", status: "ACTIVE", parentId: "REG_KIRKUK_CENTER", level: 3, gpsCoordinates: { lat: 35.4681, lng: 44.3922 } },

  // ========== 7. DIYALA (ديالى) ==========
  { regionId: "REG_DIYALA", regionName: "Diyala", nameEn: "Diyala", nameAr: "ديالى", regionType: "PROVINCE", status: "ACTIVE", parentId: null, level: 1 },
  { regionId: "REG_DIYALA_BAQUBAH", regionName: "Baqubah", nameEn: "Baqubah", nameAr: "بعقوبة", governorate: "Diyala", regionType: "DISTRICT", status: "ACTIVE", parentId: "REG_DIYALA", level: 2 },
  { regionId: "REG_DIYALA_BAQUBAH_CENTER", regionName: "Baqubah Center", nameEn: "Baqubah Center", nameAr: "مركز بعقوبة", governorate: "Diyala", regionType: "NEIGHBORHOOD", status: "ACTIVE", parentId: "REG_DIYALA_BAQUBAH", level: 3, gpsCoordinates: { lat: 33.7481, lng: 44.6442 } },

  // ========== 8. ANBAR (الأنبار) ==========
  { regionId: "REG_ANBAR", regionName: "Anbar", nameEn: "Anbar", nameAr: "الأنبار", regionType: "PROVINCE", status: "ACTIVE", parentId: null, level: 1 },
  { regionId: "REG_ANBAR_RAMADI", regionName: "Ramadi", nameEn: "Ramadi", nameAr: "الرمادي", governorate: "Anbar", regionType: "DISTRICT", status: "ACTIVE", parentId: "REG_ANBAR", level: 2 },
  { regionId: "REG_ANBAR_FALLUJAH", regionName: "Fallujah", nameEn: "Fallujah", nameAr: "الفلوجة", governorate: "Anbar", regionType: "DISTRICT", status: "ACTIVE", parentId: "REG_ANBAR", level: 2 },
  { regionId: "REG_ANBAR_RAMADI_CENTER", regionName: "Ramadi Center", nameEn: "Ramadi Center", nameAr: "مركز الرمادي", governorate: "Anbar", regionType: "NEIGHBORHOOD", status: "ACTIVE", parentId: "REG_ANBAR_RAMADI", level: 3, gpsCoordinates: { lat: 33.4236, lng: 43.3058 } },
  { regionId: "REG_ANBAR_FALLUJAH_CENTER", regionName: "Fallujah Center", nameEn: "Fallujah Center", nameAr: "مركز الفلوجة", governorate: "Anbar", regionType: "NEIGHBORHOOD", status: "ACTIVE", parentId: "REG_ANBAR_FALLUJAH", level: 3, gpsCoordinates: { lat: 33.3489, lng: 43.7836 } },

  // ========== 9. SALAH AD DIN (صلاح الدين) ==========
  { regionId: "REG_SALAHAD_DIN", regionName: "Salah ad Din", nameEn: "Salah ad Din", nameAr: "صلاح الدين", regionType: "PROVINCE", status: "ACTIVE", parentId: null, level: 1 },
  { regionId: "REG_SALAHAD_DIN_TIKRIT", regionName: "Tikrit", nameEn: "Tikrit", nameAr: "تكريت", governorate: "Salah ad Din", regionType: "DISTRICT", status: "ACTIVE", parentId: "REG_SALAHAD_DIN", level: 2 },
  { regionId: "REG_SALAHAD_DIN_TIKRIT_CENTER", regionName: "Tikrit Center", nameEn: "Tikrit Center", nameAr: "مركز تكريت", governorate: "Salah ad Din", regionType: "NEIGHBORHOOD", status: "ACTIVE", parentId: "REG_SALAHAD_DIN_TIKRIT", level: 3, gpsCoordinates: { lat: 34.6089, lng: 43.6789 } },

  // ========== 10. WASIT (واسط) ==========
  { regionId: "REG_WASIT", regionName: "Wasit", nameEn: "Wasit", nameAr: "واسط", regionType: "PROVINCE", status: "ACTIVE", parentId: null, level: 1 },
  { regionId: "REG_WASIT_KUT", regionName: "Al-Kut", nameEn: "Al-Kut", nameAr: "الكوت", governorate: "Wasit", regionType: "DISTRICT", status: "ACTIVE", parentId: "REG_WASIT", level: 2 },
  { regionId: "REG_WASIT_KUT_CENTER", regionName: "Al-Kut Center", nameEn: "Al-Kut Center", nameAr: "مركز الكوت", governorate: "Wasit", regionType: "NEIGHBORHOOD", status: "ACTIVE", parentId: "REG_WASIT_KUT", level: 3, gpsCoordinates: { lat: 32.5128, lng: 45.8189 } },

  // ========== 11. BABIL (بابل) ==========
  { regionId: "REG_BABIL", regionName: "Babil", nameEn: "Babil", nameAr: "بابل", regionType: "PROVINCE", status: "ACTIVE", parentId: null, level: 1 },
  { regionId: "REG_BABIL_HILLAH", regionName: "Al-Hillah", nameEn: "Al-Hillah", nameAr: "الحلة", governorate: "Babil", regionType: "DISTRICT", status: "ACTIVE", parentId: "REG_BABIL", level: 2 },
  { regionId: "REG_BABIL_HILLAH_CENTER", regionName: "Al-Hillah Center", nameEn: "Al-Hillah Center", nameAr: "مركز الحلة", governorate: "Babil", regionType: "NEIGHBORHOOD", status: "ACTIVE", parentId: "REG_BABIL_HILLAH", level: 3, gpsCoordinates: { lat: 32.4839, lng: 44.4189 } },

  // ========== 12. KARBALA (كربلاء) ==========
  { regionId: "REG_KARBALA", regionName: "Karbala", nameEn: "Karbala", nameAr: "كربلاء", regionType: "PROVINCE", status: "ACTIVE", parentId: null, level: 1 },
  { regionId: "REG_KARBALA_CENTER", regionName: "Karbala Center", nameEn: "Karbala Center", nameAr: "مركز كربلاء", governorate: "Karbala", regionType: "DISTRICT", status: "ACTIVE", parentId: "REG_KARBALA", level: 2 },
  { regionId: "REG_KARBALA_OLD_CITY", regionName: "Old City", nameEn: "Old City", nameAr: "المدينة القديمة", governorate: "Karbala", regionType: "NEIGHBORHOOD", status: "ACTIVE", parentId: "REG_KARBALA_CENTER", level: 3, gpsCoordinates: { lat: 32.6149, lng: 44.0247 } },

  // ========== 13. NAJAF (النجف) ==========
  { regionId: "REG_NAJAF", regionName: "Najaf", nameEn: "Najaf", nameAr: "النجف", regionType: "PROVINCE", status: "ACTIVE", parentId: null, level: 1 },
  { regionId: "REG_NAJAF_CENTER", regionName: "Najaf Center", nameEn: "Najaf Center", nameAr: "مركز النجف", governorate: "Najaf", regionType: "DISTRICT", status: "ACTIVE", parentId: "REG_NAJAF", level: 2 },
  { regionId: "REG_NAJAF_OLD_CITY", regionName: "Old City", nameEn: "Old City", nameAr: "المدينة القديمة", governorate: "Najaf", regionType: "NEIGHBORHOOD", status: "ACTIVE", parentId: "REG_NAJAF_CENTER", level: 3, gpsCoordinates: { lat: 31.9996, lng: 44.3145 } },

  // ========== 14. DHI QAR (ذي قار) ==========
  { regionId: "REG_DHI_QAR", regionName: "Dhi Qar", nameEn: "Dhi Qar", nameAr: "ذي قار", regionType: "PROVINCE", status: "ACTIVE", parentId: null, level: 1 },
  { regionId: "REG_DHI_QAR_NASIRIYAH", regionName: "An-Nasiriyah", nameEn: "An-Nasiriyah", nameAr: "الناصرية", governorate: "Dhi Qar", regionType: "DISTRICT", status: "ACTIVE", parentId: "REG_DHI_QAR", level: 2 },
  { regionId: "REG_DHI_QAR_NASIRIYAH_CENTER", regionName: "An-Nasiriyah Center", nameEn: "An-Nasiriyah Center", nameAr: "مركز الناصرية", governorate: "Dhi Qar", regionType: "NEIGHBORHOOD", status: "ACTIVE", parentId: "REG_DHI_QAR_NASIRIYAH", level: 3, gpsCoordinates: { lat: 31.0432, lng: 46.2572 } },

  // ========== 15. MAYSAN (ميسان) ==========
  { regionId: "REG_MAYSAN", regionName: "Maysan", nameEn: "Maysan", nameAr: "ميسان", regionType: "PROVINCE", status: "ACTIVE", parentId: null, level: 1 },
  { regionId: "REG_MAYSAN_AMARAH", regionName: "Al-Amarah", nameEn: "Al-Amarah", nameAr: "العمارة", governorate: "Maysan", regionType: "DISTRICT", status: "ACTIVE", parentId: "REG_MAYSAN", level: 2 },
  { regionId: "REG_MAYSAN_AMARAH_CENTER", regionName: "Al-Amarah Center", nameEn: "Al-Amarah Center", nameAr: "مركز العمارة", governorate: "Maysan", regionType: "NEIGHBORHOOD", status: "ACTIVE", parentId: "REG_MAYSAN_AMARAH", level: 3, gpsCoordinates: { lat: 31.8357, lng: 47.1447 } },

  // ========== 16. MUTHANNA (المثنى) ==========
  { regionId: "REG_MUTHANNA", regionName: "Al-Muthanna", nameEn: "Al-Muthanna", nameAr: "المثنى", regionType: "PROVINCE", status: "ACTIVE", parentId: null, level: 1 },
  { regionId: "REG_MUTHANNA_SAMAWAH", regionName: "As-Samawah", nameEn: "As-Samawah", nameAr: "السماوة", governorate: "Al-Muthanna", regionType: "DISTRICT", status: "ACTIVE", parentId: "REG_MUTHANNA", level: 2 },
  { regionId: "REG_MUTHANNA_SAMAWAH_CENTER", regionName: "As-Samawah Center", nameEn: "As-Samawah Center", nameAr: "مركز السماوة", governorate: "Al-Muthanna", regionType: "NEIGHBORHOOD", status: "ACTIVE", parentId: "REG_MUTHANNA_SAMAWAH", level: 3, gpsCoordinates: { lat: 31.3119, lng: 45.2836 } },

  // ========== 17. QADISIYYAH (القادسية) ==========
  { regionId: "REG_QADISIYYAH", regionName: "Al-Qadisiyyah", nameEn: "Al-Qadisiyyah", nameAr: "القادسية", regionType: "PROVINCE", status: "ACTIVE", parentId: null, level: 1 },
  { regionId: "REG_QADISIYYAH_DIWANIYAH", regionName: "Ad-Diwaniyah", nameEn: "Ad-Diwaniyah", nameAr: "الديوانية", governorate: "Al-Qadisiyyah", regionType: "DISTRICT", status: "ACTIVE", parentId: "REG_QADISIYYAH", level: 2 },
  { regionId: "REG_QADISIYYAH_DIWANIYAH_CENTER", regionName: "Ad-Diwaniyah Center", nameEn: "Ad-Diwaniyah Center", nameAr: "مركز الديوانية", governorate: "Al-Qadisiyyah", regionType: "NEIGHBORHOOD", status: "ACTIVE", parentId: "REG_QADISIYYAH_DIWANIYAH", level: 3, gpsCoordinates: { lat: 31.9929, lng: 44.9255 } },

  // ========== 18. DOHUK (دهوك) ==========
  { regionId: "REG_DOHUK", regionName: "Dohuk", nameEn: "Dohuk", nameAr: "دهوك", regionType: "PROVINCE", status: "ACTIVE", parentId: null, level: 1 },
  { regionId: "REG_DOHUK_CENTER", regionName: "Dohuk Center", nameEn: "Dohuk Center", nameAr: "مركز دهوك", governorate: "Dohuk", regionType: "DISTRICT", status: "ACTIVE", parentId: "REG_DOHUK", level: 2 },
  { regionId: "REG_DOHUK_CENTER_CITY", regionName: "Dohuk City", nameEn: "Dohuk City", nameAr: "مدينة دهوك", governorate: "Dohuk", regionType: "NEIGHBORHOOD", status: "ACTIVE", parentId: "REG_DOHUK_CENTER", level: 3, gpsCoordinates: { lat: 36.8617, lng: 42.9533 } },
];

// Helper function to set CORS headers
function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Accept-Language, User-Agent');
  res.setHeader('Content-Type', 'application/json');
}

// Request handler
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res);
    res.writeHead(200);
    res.end();
    return;
  }

  console.log(`${new Date().toISOString()} - ${req.method} ${pathname}`);

  // GET /regions/active - Return all active regions
  if (pathname === '/regions/active' && req.method === 'GET') {
    setCorsHeaders(res);
    
    const response = {
      success: true,
      message: "Active regions fetched successfully (LOCAL DEV - ALL 18 IRAQI GOVERNORATES)",
      data: {
        regions: REGIONS,
        total: REGIONS.length,
        cached: false,
        source: "local-dev-server-comprehensive"
      }
    };

    res.writeHead(200);
    res.end(JSON.stringify(response, null, 2));
    console.log(`✅ Returned ${REGIONS.length} active regions`);
    return;
  }

  // GET /regions/:id - Return specific region
  if (pathname.startsWith('/regions/') && req.method === 'GET') {
    setCorsHeaders(res);
    
    const regionId = pathname.split('/')[2];
    const region = REGIONS.find(r => r.regionId === regionId);

    if (region) {
      const response = {
        success: true,
        message: "Region found",
        data: { region }
      };
      res.writeHead(200);
      res.end(JSON.stringify(response, null, 2));
      console.log(`✅ Returned region: ${regionId}`);
    } else {
      const response = {
        success: false,
        message: "Region not found",
        error: { code: 'REGION_NOT_FOUND' }
      };
      res.writeHead(404);
      res.end(JSON.stringify(response, null, 2));
      console.log(`❌ Region not found: ${regionId}`);
    }
    return;
  }

  // Health check
  if (pathname === '/health' && req.method === 'GET') {
    setCorsHeaders(res);
    const stats = {
      status: 'healthy', 
      service: 'Central Platform Region API (Local Dev - Comprehensive Iraq Data)',
      totalRegions: REGIONS.length,
      governorates: REGIONS.filter(r => r.regionType === 'PROVINCE').length,
      districts: REGIONS.filter(r => r.regionType === 'DISTRICT').length,
      neighborhoods: REGIONS.filter(r => r.regionType === 'NEIGHBORHOOD').length,
      governoratesList: REGIONS.filter(r => r.regionType === 'PROVINCE').map(r => r.nameAr)
    };
    res.writeHead(200);
    res.end(JSON.stringify(stats, null, 2));
    return;
  }

  // 404 - Not Found
  setCorsHeaders(res);
  res.writeHead(404);
  res.end(JSON.stringify({
    success: false,
    message: "Endpoint not found",
    availableEndpoints: [
      'GET /regions/active',
      'GET /regions/:id',
      'GET /health'
    ]
  }, null, 2));
});

// Start server
server.listen(PORT, HOST, () => {
  console.log('');
  console.log('🌍 CENTRAL PLATFORM REGION API - COMPREHENSIVE IRAQ DATA');
  console.log('='.repeat(70));
  console.log('');
  console.log(`✅ Server running at: http://${HOST}:${PORT}`);
  console.log('');
  console.log('📡 Available Endpoints:');
  console.log(`   GET  http://${HOST}:${PORT}/regions/active`);
  console.log(`   GET  http://${HOST}:${PORT}/regions/:id`);
  console.log(`   GET  http://${HOST}:${PORT}/health`);
  console.log('');
  console.log('📊 COMPREHENSIVE DATA - ALL 18 IRAQI GOVERNORATES:');
  console.log(`   Total Regions: ${REGIONS.length}`);
  console.log(`   Governorates: ${REGIONS.filter(r => r.regionType === 'PROVINCE').length}`);
  console.log(`   Districts: ${REGIONS.filter(r => r.regionType === 'DISTRICT').length}`);
  console.log(`   Neighborhoods: ${REGIONS.filter(r => r.regionType === 'NEIGHBORHOOD').length}`);
  console.log('');
  console.log('🗺️  Governorates Included:');
  const governorates = REGIONS.filter(r => r.regionType === 'PROVINCE');
  governorates.forEach((gov, idx) => {
    console.log(`   ${idx + 1}. ${gov.nameEn} (${gov.nameAr})`);
  });
  console.log('');
  console.log('🔧 Flutter App Configuration:');
  console.log(`   static const String _centralApiUrl = 'http://${HOST}:${PORT}';`);
  console.log(`   static const bool _useMockData = false;`);
  console.log('');
  console.log('⏹️  Press Ctrl+C to stop');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
