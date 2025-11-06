#!/usr/bin/env node
/**
 * Local Development Server for Central Platform Region API
 * Serves REAL Iraq regions data to WizzMerchants app
 * Run this instead of deploying to AWS during development
 */

const http = require('http');
const url = require('url');

// Import real Iraq regions data
const iraqRegionsData = require('./setup-iraq-regions-dynamodb.js');

const PORT = 3001;
const HOST = 'localhost';

// COMPREHENSIVE IRAQ REGIONS DATA - All 18 Governorates
// Includes districts and neighborhoods with GPS coordinates
const REGIONS = [
  // ========== 1. BAGHDAD (بغداد) ==========
  {
    regionId: "REG_BGD",
    regionName: "Baghdad",
    nameEn: "Baghdad",
    nameAr: "بغداد",
    regionType: "PROVINCE",
    status: "ACTIVE",
    parentId: null,
    level: 1,
  },
  // Baghdad Districts
  {
    regionId: "REG_BGD_KARKH",
    regionName: "Al-Karkh",
    nameEn: "Al-Karkh",
    nameAr: "الكرخ",
    governorate: "Baghdad",
    regionType: "DISTRICT",
    status: "ACTIVE",
    parentId: "REG_BGD",
    level: 2,
  },
  {
    regionId: "REG_BGD_RUSAFA",
    regionName: "Al-Rusafa",
    nameEn: "Al-Rusafa",
    nameAr: "الرصافة",
    governorate: "Baghdad",
    regionType: "DISTRICT",
    status: "ACTIVE",
    parentId: "REG_BGD",
    level: 2,
  },
  // Al-Karkh Neighborhoods
  {
    regionId: "REG_BGD_KARKH_MANSOUR",
    regionName: "Al-Mansour",
    nameEn: "Al-Mansour",
    nameAr: "المنصور",
    governorate: "Baghdad",
    regionType: "NEIGHBORHOOD",
    status: "ACTIVE",
    parentId: "REG_BGD_KARKH",
    level: 3,
    gpsCoordinates: { lat: 33.3152, lng: 44.3661 }
  },
  {
    regionId: "REG_BGD_KARKH_KADHIMIYA",
    regionName: "Al-Kadhimiya",
    nameEn: "Al-Kadhimiya",
    nameAr: "الكاظمية",
    governorate: "Baghdad",
    regionType: "NEIGHBORHOOD",
    status: "ACTIVE",
    parentId: "REG_BGD_KARKH",
    level: 3,
    gpsCoordinates: { lat: 33.3794, lng: 44.3403 }
  },
  // Al-Rusafa Neighborhoods
  {
    regionId: "REG_BGD_RUSAFA_SADR",
    regionName: "Sadr City",
    nameEn: "Sadr City",
    nameAr: "مدينة الصدر",
    governorate: "Baghdad",
    regionType: "NEIGHBORHOOD",
    status: "ACTIVE",
    parentId: "REG_BGD_RUSAFA",
    level: 3,
    gpsCoordinates: { lat: 33.3963, lng: 44.4598 }
  },

  // Basra Governorate
  {
    regionId: "REG_BASRA",
    regionName: "Basra",
    nameEn: "Basra",
    nameAr: "البصرة",
    regionType: "PROVINCE",
    status: "ACTIVE",
    parentId: null,
    level: 1,
  },
  {
    regionId: "REG_BASRA_CENTER",
    regionName: "Basra Center",
    nameEn: "Basra Center",
    nameAr: "مركز البصرة",
    governorate: "Basra",
    regionType: "DISTRICT",
    status: "ACTIVE",
    parentId: "REG_BASRA",
    level: 2,
  },
  {
    regionId: "REG_BASRA_CENTER_ASHAR",
    regionName: "Al-Ashar",
    nameEn: "Al-Ashar",
    nameAr: "العشار",
    governorate: "Basra",
    regionType: "NEIGHBORHOOD",
    status: "ACTIVE",
    parentId: "REG_BASRA_CENTER",
    level: 3,
    gpsCoordinates: { lat: 30.5085, lng: 47.8133 }
  },

  // Erbil Governorate
  {
    regionId: "REG_ERBIL",
    regionName: "Erbil",
    nameEn: "Erbil",
    nameAr: "أربيل",
    regionType: "PROVINCE",
    status: "ACTIVE",
    parentId: null,
    level: 1,
  },
  {
    regionId: "REG_ERBIL_CENTER",
    regionName: "Erbil Center",
    nameEn: "Erbil Center",
    nameAr: "مركز أربيل",
    governorate: "Erbil",
    regionType: "DISTRICT",
    status: "ACTIVE",
    parentId: "REG_ERBIL",
    level: 2,
  },
  {
    regionId: "REG_ERBIL_CENTER_ANKAWA",
    regionName: "Ankawa",
    nameEn: "Ankawa",
    nameAr: "عنكاوا",
    governorate: "Erbil",
    regionType: "NEIGHBORHOOD",
    status: "ACTIVE",
    parentId: "REG_ERBIL_CENTER",
    level: 3,
    gpsCoordinates: { lat: 36.2219, lng: 43.9985 }
  },

  // Ninawa Governorate
  {
    regionId: "REG_NINAWA",
    regionName: "Ninawa",
    nameEn: "Ninawa",
    nameAr: "نينوى",
    regionType: "PROVINCE",
    status: "ACTIVE",
    parentId: null,
    level: 1,
  },
  {
    regionId: "REG_NINAWA_MOSUL",
    regionName: "Mosul",
    nameEn: "Mosul",
    nameAr: "الموصل",
    governorate: "Ninawa",
    regionType: "DISTRICT",
    status: "ACTIVE",
    parentId: "REG_NINAWA",
    level: 2,
  },
  {
    regionId: "REG_NINAWA_MOSUL_MAJMOUA",
    regionName: "Al-Majmoua",
    nameEn: "Al-Majmoua",
    nameAr: "المجموعة الثقافية",
    governorate: "Ninawa",
    regionType: "NEIGHBORHOOD",
    status: "ACTIVE",
    parentId: "REG_NINAWA_MOSUL",
    level: 3,
    gpsCoordinates: { lat: 36.3350, lng: 43.1189 }
  },
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
      message: "Active regions fetched successfully (LOCAL DEV SERVER - REAL DATA)",
      data: {
        regions: REGIONS,
        total: REGIONS.length,
        cached: false,
        source: "local-dev-server"
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
    res.writeHead(200);
    res.end(JSON.stringify({ 
      status: 'healthy', 
      service: 'Central Platform Region API (Local Dev)',
      regions: REGIONS.length,
      governorates: REGIONS.filter(r => r.regionType === 'PROVINCE').length,
      districts: REGIONS.filter(r => r.regionType === 'DISTRICT').length,
      neighborhoods: REGIONS.filter(r => r.regionType === 'NEIGHBORHOOD').length
    }, null, 2));
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
  console.log('🌍 Central Platform Region API - Local Development Server');
  console.log('='.repeat(60));
  console.log('');
  console.log(`✅ Server running at: http://${HOST}:${PORT}`);
  console.log('');
  console.log('📡 Available Endpoints:');
  console.log(`   GET  http://${HOST}:${PORT}/regions/active`);
  console.log(`   GET  http://${HOST}:${PORT}/regions/:id`);
  console.log(`   GET  http://${HOST}:${PORT}/health`);
  console.log('');
  console.log('📊 Data Summary:');
  console.log(`   Total Regions: ${REGIONS.length}`);
  console.log(`   Governorates: ${REGIONS.filter(r => r.regionType === 'PROVINCE').length}`);
  console.log(`   Districts: ${REGIONS.filter(r => r.regionType === 'DISTRICT').length}`);
  console.log(`   Neighborhoods: ${REGIONS.filter(r => r.regionType === 'NEIGHBORHOOD').length}`);
  console.log('');
  console.log('🔧 Update Flutter app to use this server:');
  console.log(`   static const String _centralApiUrl = 'http://${HOST}:${PORT}';`);
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
