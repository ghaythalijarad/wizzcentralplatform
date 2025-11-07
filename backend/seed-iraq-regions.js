#!/usr/bin/env node
/**
 * Seed Iraq Regions: Add all 18 governorates and their districts to DynamoDB
 * Based on official Iraqi administrative divisions
 * 
 * Usage:
 *   AWS_PROFILE=wizz-drivers-ghayth-dev node backend/seed-iraq-regions.js
 *   
 * Options:
 *   --dry-run     Show what would be created without writing to DB
 *   --force       Overwrite existing regions with same name
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE_NAME = process.env.REGIONS_TABLE || 'WizzCentral_Regions';
const REGION = process.env.AWS_REGION || 'us-east-1';
const DRY_RUN = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

const ddb = new DynamoDBClient({
  region: REGION,
  credentials: process.env.AWS_PROFILE ? undefined : {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});
const doc = DynamoDBDocumentClient.from(ddb);

// Iraq's 18 governorates with districts (in Arabic and English)
// Coordinates are approximate center points
const IRAQ_REGIONS = {
  country: {
    regionId: 'iraq',
    name: 'Iraq',
    name_ar: 'العراق',
    level: 0,
    coordinates: { lat: 33.2232, lng: 43.6793 },
    parent_id: null
  },
  governorates: [
    {
      regionId: 'baghdad',
      name: 'Baghdad',
      name_ar: 'بغداد',
      coordinates: { lat: 33.3152, lng: 44.3661 },
      districts: [
        { name: 'Al-Rusafa', name_ar: 'الرصافة', lat: 33.3406, lng: 44.4009 },
        { name: 'Al-Karkh', name_ar: 'الكرخ', lat: 33.3007, lng: 44.3225 },
        { name: 'Al-Adhamiya', name_ar: 'الأعظمية', lat: 33.3775, lng: 44.3817 },
        { name: 'Al-Kadhimiya', name_ar: 'الكاظمية', lat: 33.3803, lng: 44.3403 },
        { name: 'New Baghdad', name_ar: 'بغداد الجديدة', lat: 33.2872, lng: 44.4489 },
        { name: 'Al-Sadr City', name_ar: 'مدينة الصدر', lat: 33.3748, lng: 44.4589 },
        { name: 'Al-Rashid', name_ar: 'الرشيد', lat: 33.2350, lng: 44.3667 },
        { name: 'Abu Ghraib', name_ar: 'أبو غريب', lat: 33.3089, lng: 44.1850 },
        { name: 'Al-Mahmoudiya', name_ar: 'المحمودية', lat: 33.0778, lng: 44.3483 }
      ]
    },
    {
      regionId: 'basra',
      name: 'Basra',
      name_ar: 'البصرة',
      coordinates: { lat: 30.5085, lng: 47.7835 },
      districts: [
        { name: 'Basra', name_ar: 'البصرة', lat: 30.5085, lng: 47.7835 },
        { name: 'Abu Al-Khaseeb', name_ar: 'أبو الخصيب', lat: 30.4783, lng: 47.9856 },
        { name: 'Al-Zubair', name_ar: 'الزبير', lat: 30.3858, lng: 47.7014 },
        { name: 'Al-Qurna', name_ar: 'القرنة', lat: 31.0133, lng: 47.4319 },
        { name: 'Al-Midaina', name_ar: 'المدينة', lat: 30.6333, lng: 47.7667 },
        { name: 'Shatt Al-Arab', name_ar: 'شط العرب', lat: 30.4500, lng: 48.0167 },
        { name: 'Al-Fao', name_ar: 'الفاو', lat: 29.9761, lng: 48.4731 }
      ]
    },
    {
      regionId: 'nineveh',
      name: 'Nineveh',
      name_ar: 'نينوى',
      coordinates: { lat: 36.3489, lng: 43.1361 },
      districts: [
        { name: 'Mosul', name_ar: 'الموصل', lat: 36.3489, lng: 43.1361 },
        { name: 'Tel Afar', name_ar: 'تلعفر', lat: 36.3778, lng: 42.4506 },
        { name: 'Sinjar', name_ar: 'سنجار', lat: 36.3189, lng: 41.8708 },
        { name: 'Al-Ba\'aj', name_ar: 'البعاج', lat: 36.7014, lng: 41.9425 },
        { name: 'Al-Hamdaniya', name_ar: 'الحمدانية', lat: 36.2667, lng: 43.4167 },
        { name: 'Tal Kayf', name_ar: 'تلكيف', lat: 36.4667, lng: 43.3833 },
        { name: 'Sheikhan', name_ar: 'الشيخان', lat: 36.6833, lng: 43.2833 },
        { name: 'Al-Shura', name_ar: 'الشورة', lat: 36.1833, lng: 43.1667 },
        { name: 'Makhmur', name_ar: 'مخمور', lat: 35.7667, lng: 43.5833 }
      ]
    },
    {
      regionId: 'erbil',
      name: 'Erbil',
      name_ar: 'أربيل',
      coordinates: { lat: 36.1911, lng: 44.0092 },
      districts: [
        { name: 'Erbil', name_ar: 'أربيل', lat: 36.1911, lng: 44.0092 },
        { name: 'Shaqlawa', name_ar: 'شقلاوة', lat: 36.4000, lng: 44.3167 },
        { name: 'Koya', name_ar: 'كويسنجق', lat: 36.0833, lng: 44.6333 },
        { name: 'Rawanduz', name_ar: 'راوندوز', lat: 36.6167, lng: 44.5167 },
        { name: 'Soran', name_ar: 'سوران', lat: 36.6500, lng: 44.5500 },
        { name: 'Choman', name_ar: 'جومان', lat: 36.6167, lng: 44.9000 },
        { name: 'Mergasur', name_ar: 'ميركةسور', lat: 36.8167, lng: 44.5500 }
      ]
    },
    {
      regionId: 'sulaymaniyah',
      name: 'Sulaymaniyah',
      name_ar: 'السليمانية',
      coordinates: { lat: 35.5611, lng: 45.4375 },
      districts: [
        { name: 'Sulaymaniyah', name_ar: 'السليمانية', lat: 35.5611, lng: 45.4375 },
        { name: 'Halabja', name_ar: 'حلبجة', lat: 35.1833, lng: 45.9833 },
        { name: 'Penjwin', name_ar: 'بنجوين', lat: 35.6167, lng: 45.9500 },
        { name: 'Ranya', name_ar: 'رانية', lat: 36.2667, lng: 44.8833 },
        { name: 'Qaladiza', name_ar: 'قلادزة', lat: 36.1333, lng: 45.0833 },
        { name: 'Darbandikhan', name_ar: 'دربندخان', lat: 35.1167, lng: 45.7167 },
        { name: 'Sharazur', name_ar: 'شارەزوور', lat: 35.4167, lng: 45.6000 },
        { name: 'Dukan', name_ar: 'دوكان', lat: 35.9667, lng: 44.9500 }
      ]
    },
    {
      regionId: 'dohuk',
      name: 'Dohuk',
      name_ar: 'دهوك',
      coordinates: { lat: 36.8625, lng: 42.9989 },
      districts: [
        { name: 'Dohuk', name_ar: 'دهوك', lat: 36.8625, lng: 42.9989 },
        { name: 'Zakho', name_ar: 'زاخو', lat: 37.1472, lng: 42.6856 },
        { name: 'Amedi', name_ar: 'العمادية', lat: 37.0928, lng: 43.4906 },
        { name: 'Semel', name_ar: 'سميل', lat: 36.8167, lng: 42.8500 },
        { name: 'Akre', name_ar: 'عقرة', lat: 36.7500, lng: 43.8833 },
        { name: 'Bardarash', name_ar: 'بردرش', lat: 36.6333, lng: 43.3333 }
      ]
    },
    {
      regionId: 'kirkuk',
      name: 'Kirkuk',
      name_ar: 'كركوك',
      coordinates: { lat: 35.4681, lng: 44.3922 },
      districts: [
        { name: 'Kirkuk', name_ar: 'كركوك', lat: 35.4681, lng: 44.3922 },
        { name: 'Hawija', name_ar: 'الحويجة', lat: 35.3000, lng: 43.7833 },
        { name: 'Dibis', name_ar: 'دبس', lat: 35.5833, lng: 44.2000 },
        { name: 'Daquq', name_ar: 'داقوق', lat: 35.0500, lng: 44.4167 }
      ]
    },
    {
      regionId: 'diyala',
      name: 'Diyala',
      name_ar: 'ديالى',
      coordinates: { lat: 33.7500, lng: 45.2167 },
      districts: [
        { name: 'Baqubah', name_ar: 'بعقوبة', lat: 33.7500, lng: 44.6500 },
        { name: 'Muqdadiya', name_ar: 'المقدادية', lat: 33.9833, lng: 44.9333 },
        { name: 'Khalis', name_ar: 'الخالص', lat: 33.8167, lng: 44.5333 },
        { name: 'Khanaqin', name_ar: 'خانقين', lat: 34.3500, lng: 45.3833 },
        { name: 'Balad Ruz', name_ar: 'بلدروز', lat: 33.9500, lng: 44.7500 },
        { name: 'Al-Khalis', name_ar: 'الخالص', lat: 33.8167, lng: 44.5333 }
      ]
    },
    {
      regionId: 'anbar',
      name: 'Anbar',
      name_ar: 'الأنبار',
      coordinates: { lat: 33.4261, lng: 43.3008 },
      districts: [
        { name: 'Ramadi', name_ar: 'الرمادي', lat: 33.4261, lng: 43.3008 },
        { name: 'Fallujah', name_ar: 'الفلوجة', lat: 33.3500, lng: 43.7833 },
        { name: 'Haditha', name_ar: 'حديثة', lat: 34.1383, lng: 42.3764 },
        { name: 'Hit', name_ar: 'هيت', lat: 33.6419, lng: 42.8258 },
        { name: 'Al-Qa\'im', name_ar: 'القائم', lat: 34.4000, lng: 41.0167 },
        { name: 'Annah', name_ar: 'عانة', lat: 34.3667, lng: 41.9833 },
        { name: 'Rawa', name_ar: 'راوة', lat: 34.4667, lng: 41.9167 },
        { name: 'Rutba', name_ar: 'الرطبة', lat: 33.0375, lng: 40.2842 }
      ]
    },
    {
      regionId: 'saladin',
      name: 'Saladin',
      name_ar: 'صلاح الدين',
      coordinates: { lat: 34.6097, lng: 43.6783 },
      districts: [
        { name: 'Tikrit', name_ar: 'تكريت', lat: 34.6097, lng: 43.6783 },
        { name: 'Samarra', name_ar: 'سامراء', lat: 34.2000, lng: 43.8750 },
        { name: 'Baiji', name_ar: 'بيجي', lat: 34.9331, lng: 43.4914 },
        { name: 'Tuz Khurmatu', name_ar: 'طوزخورماتو', lat: 34.8833, lng: 44.6333 },
        { name: 'Ad-Dawr', name_ar: 'الدور', lat: 34.4500, lng: 43.7167 },
        { name: 'Al-Shirqat', name_ar: 'الشرقاط', lat: 35.4667, lng: 43.2333 },
        { name: 'Balad', name_ar: 'بلد', lat: 34.0167, lng: 44.1500 },
        { name: 'Dujail', name_ar: 'الدجيل', lat: 33.8833, lng: 44.0333 }
      ]
    },
    {
      regionId: 'najaf',
      name: 'Najaf',
      name_ar: 'النجف',
      coordinates: { lat: 31.9996, lng: 44.3267 },
      districts: [
        { name: 'Najaf', name_ar: 'النجف', lat: 31.9996, lng: 44.3267 },
        { name: 'Al-Kufa', name_ar: 'الكوفة', lat: 32.0286, lng: 44.4042 },
        { name: 'Al-Mishkhab', name_ar: 'المشخاب', lat: 32.0333, lng: 44.6333 },
        { name: 'Al-Manathera', name_ar: 'المناذرة', lat: 31.9667, lng: 44.3667 }
      ]
    },
    {
      regionId: 'karbala',
      name: 'Karbala',
      name_ar: 'كربلاء',
      coordinates: { lat: 32.6169, lng: 44.0252 },
      districts: [
        { name: 'Karbala', name_ar: 'كربلاء', lat: 32.6169, lng: 44.0252 },
        { name: 'Al-Hindiya', name_ar: 'الهندية', lat: 32.5500, lng: 44.2667 },
        { name: 'Ain Al-Tamur', name_ar: 'عين التمر', lat: 32.4667, lng: 43.3833 }
      ]
    },
    {
      regionId: 'babil',
      name: 'Babil',
      name_ar: 'بابل',
      coordinates: { lat: 32.4647, lng: 44.4206 },
      districts: [
        { name: 'Hillah', name_ar: 'الحلة', lat: 32.4647, lng: 44.4206 },
        { name: 'Al-Musayib', name_ar: 'المسيب', lat: 32.7833, lng: 44.2833 },
        { name: 'Al-Mahawil', name_ar: 'المحاويل', lat: 32.5833, lng: 44.6167 },
        { name: 'Al-Hashimiya', name_ar: 'الهاشمية', lat: 32.3500, lng: 44.6000 },
        { name: 'Al-Qasim', name_ar: 'القاسم', lat: 32.2833, lng: 44.4667 }
      ]
    },
    {
      regionId: 'wasit',
      name: 'Wasit',
      name_ar: 'واسط',
      coordinates: { lat: 32.4931, lng: 45.8328 },
      districts: [
        { name: 'Kut', name_ar: 'الكوت', lat: 32.4931, lng: 45.8328 },
        { name: 'Al-Hai', name_ar: 'الحي', lat: 32.1833, lng: 46.0333 },
        { name: 'Al-Suwaira', name_ar: 'الصويرة', lat: 32.9500, lng: 45.0167 },
        { name: 'Al-Aziziya', name_ar: 'العزيزية', lat: 33.0667, lng: 45.0667 },
        { name: 'Badra', name_ar: 'بدرة', lat: 33.1000, lng: 45.9667 },
        { name: 'Al-Nu\'maniya', name_ar: 'النعمانية', lat: 32.3333, lng: 45.4000 }
      ]
    },
    {
      regionId: 'dhi_qar',
      name: 'Dhi Qar',
      name_ar: 'ذي قار',
      coordinates: { lat: 31.0586, lng: 46.2533 },
      districts: [
        { name: 'Nasiriyah', name_ar: 'الناصرية', lat: 31.0586, lng: 46.2533 },
        { name: 'Al-Rifai', name_ar: 'الرفاعي', lat: 31.5000, lng: 46.1167 },
        { name: 'Suq Al-Shuyukh', name_ar: 'سوق الشيوخ', lat: 31.4167, lng: 46.5167 },
        { name: 'Al-Chibayish', name_ar: 'الجبايش', lat: 30.9500, lng: 46.8500 },
        { name: 'Al-Islah', name_ar: 'الإصلاح', lat: 31.1667, lng: 46.5333 },
        { name: 'Al-Dawaya', name_ar: 'الدواية', lat: 31.6500, lng: 45.8500 }
      ]
    },
    {
      regionId: 'maysan',
      name: 'Maysan',
      name_ar: 'ميسان',
      coordinates: { lat: 31.8367, lng: 47.1525 },
      districts: [
        { name: 'Amarah', name_ar: 'العمارة', lat: 31.8367, lng: 47.1525 },
        { name: 'Ali Al-Gharbi', name_ar: 'علي الغربي', lat: 32.4667, lng: 47.0333 },
        { name: 'Al-Majar Al-Kabir', name_ar: 'المجر الكبير', lat: 31.5333, lng: 47.1833 },
        { name: 'Qalat Salih', name_ar: 'قلعة صالح', lat: 32.3333, lng: 47.2833 },
        { name: 'Al-Meimuna', name_ar: 'الميمونة', lat: 31.4833, lng: 47.6667 },
        { name: 'Al-Kahla', name_ar: 'الكحلاء', lat: 31.6667, lng: 47.5000 }
      ]
    },
    {
      regionId: 'muthanna',
      name: 'Al-Muthanna',
      name_ar: 'المثنى',
      coordinates: { lat: 29.9697, lng: 45.3111 },
      districts: [
        { name: 'Samawah', name_ar: 'السماوة', lat: 31.3167, lng: 45.2833 },
        { name: 'Al-Rumaitha', name_ar: 'الرميثة', lat: 31.5333, lng: 45.2667 },
        { name: 'Al-Salman', name_ar: 'السلمان', lat: 30.4000, lng: 44.6000 },
        { name: 'Al-Warka', name_ar: 'الوركاء', lat: 31.3167, lng: 45.1833 }
      ]
    },
    {
      regionId: 'qadisiyyah',
      name: 'Al-Qadisiyyah',
      name_ar: 'القادسية',
      coordinates: { lat: 32.0333, lng: 45.3333 },
      districts: [
        { name: 'Diwaniyah', name_ar: 'الديوانية', lat: 31.9833, lng: 44.9333 },
        { name: 'Afak', name_ar: 'عفك', lat: 32.0667, lng: 45.2333 },
        { name: 'Al-Shamiya', name_ar: 'الشامية', lat: 31.9167, lng: 44.6000 },
        { name: 'Al-Hamza', name_ar: 'الحمزة', lat: 32.0833, lng: 44.7500 },
        { name: 'Ghammas', name_ar: 'غماس', lat: 31.7167, lng: 44.8500 }
      ]
    }
  ]
};

// Helper to generate regionId from name
function generateRegionId(name) {
  return name.toLowerCase()
    .replace(/[\s\-]/g, '_')
    .replace(/[^\w_]/g, '')
    .replace(/_+/g, '_');
}

// Helper to generate a circular polygon boundary from center point and radius
function generateCirclePolygon(lat, lng, radiusMeters, vertices = 64) {
  const latRad = (lat * Math.PI) / 180;
  const degPerMeterLat = 1 / 110574;
  const degPerMeterLng = 1 / (111320 * Math.cos(latRad) || 1e-9);
  
  const ring = [];
  for (let i = 0; i < vertices; i++) {
    const theta = (2 * Math.PI * i) / vertices;
    const dLat = Math.sin(theta) * radiusMeters * degPerMeterLat;
    const dLng = Math.cos(theta) * radiusMeters * degPerMeterLng;
    const ptLat = Math.max(-90, Math.min(90, lat + dLat));
    let ptLng = lng + dLng;
    
    // Normalize longitude to [-180, 180]
    if (ptLng > 180) ptLng = ((ptLng + 180) % 360) - 180;
    if (ptLng < -180) ptLng = ((ptLng - 180) % 360) + 180;
    
    ring.push([Number(ptLng.toFixed(6)), Number(ptLat.toFixed(6))]);
  }
  
  // Close the ring
  ring.push([...ring[0]]);
  
  return {
    type: 'Polygon',
    coordinates: [ring]
  };
}

// Get default radius based on region level
function getDefaultRadius(level) {
  switch (level) {
    case 0: return 1000000; // Country: ~1000 km
    case 1: return 50000;   // Governorate: ~50 km
    case 2: return 15000;   // District: ~15 km
    case 3: return 5000;    // Neighborhood: ~5 km
    default: return 10000;
  }
}

// Helper to create region item with boundary
function createRegionItem(data, level, parentId = null) {
  const now = new Date().toISOString();
  const regionId = data.regionId || generateRegionId(data.name);
  const nameLower = data.name.toLowerCase();
  const nameArLower = data.name_ar ? data.name_ar.toLowerCase() : '';
  
  // Extract coordinates
  const lat = data.coordinates?.lat || data.lat || 33.3152;
  const lng = data.coordinates?.lng || data.lng || 44.3661;
  const radius = data.radius || getDefaultRadius(level);
  
  // Generate polygon boundary
  const boundary = generateCirclePolygon(lat, lng, radius, 64);
  
  return {
    regionId,
    name: data.name,
    name_ar: data.name_ar || '',
    level,
    level_n: level,
    parent_id: parentId,
    is_active: true,
    is_active_s: 'true',
    boundary, // Add the polygon boundary
    // Keep coordinates for backward compatibility and as fallback
    coordinates: {
      lat,
      lng,
      radius
    },
    name_lower: nameLower,
    name_ar_lower: nameArLower,
    level_name: `L#${level}#N#${nameLower}`,
    level_updated_at: `L#${level}#U#${now}`,
    createdAt: now,
    updatedAt: now,
    updated_at: now,
    service_config: {
      delivery: true,
      pickup: false,
      dineIn: false
    },
    delivery_config: {
      base_fee: 0,
      minimum_order: 0,
      estimated_time_minutes: 30
    }
  };
}

// Check if region exists by name and level
async function regionExists(name, level, parentId = null) {
  try {
    const params = {
      TableName: TABLE_NAME,
      FilterExpression: '#nm = :nm AND #lvl = :lvl',
      ExpressionAttributeNames: {
        '#nm': 'name',
        '#lvl': 'level_n'
      },
      ExpressionAttributeValues: {
        ':nm': name,
        ':lvl': level
      }
    };
    
    if (parentId) {
      params.FilterExpression += ' AND parent_id = :pid';
      params.ExpressionAttributeValues[':pid'] = parentId;
    }
    
    const result = await doc.send(new ScanCommand(params));
    return (result.Items || []).length > 0;
  } catch (error) {
    console.warn('Error checking region existence:', error.message);
    return false;
  }
}

// Create region with conflict check
async function createRegion(item) {
  if (!FORCE) {
    const exists = await regionExists(item.name, item.level_n, item.parent_id);
    if (exists) {
      console.log(`⏭️  Skipping ${item.name} (${item.name_ar}) - already exists`);
      return { skipped: true };
    }
  }
  
  if (DRY_RUN) {
    console.log(`[DRY RUN] Would create: ${item.name} (${item.name_ar}) at level ${item.level}`);
    return { created: false, dryRun: true };
  }
  
  try {
    await doc.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      ...(FORCE ? {} : { ConditionExpression: 'attribute_not_exists(regionId)' })
    }));
    console.log(`✅ Created: ${item.name} (${item.name_ar}) - ${item.regionId}`);
    return { created: true };
  } catch (error) {
    if (error.name === 'ConditionalCheckFailedException') {
      console.log(`⏭️  Skipping ${item.name} - already exists`);
      return { skipped: true };
    }
    throw error;
  }
}

// Main seeding function
async function seedIraqRegions() {
  console.log(`\n🌍 Seeding Iraq Regions to ${TABLE_NAME} (${REGION})`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : FORCE ? 'FORCE' : 'NORMAL'}\n`);
  
  const stats = { created: 0, skipped: 0, failed: 0 };
  
  try {
    // 1. Create country (Iraq) - Level 0
    console.log('📍 Creating country...');
    const countryItem = createRegionItem(IRAQ_REGIONS.country, 0);
    const countryResult = await createRegion(countryItem);
    if (countryResult.created) stats.created++;
    else if (countryResult.skipped) stats.skipped++;
    
    // 2. Create governorates - Level 1
    console.log('\n📍 Creating governorates...');
    for (const gov of IRAQ_REGIONS.governorates) {
      const govItem = createRegionItem(gov, 1, 'iraq');
      const govResult = await createRegion(govItem);
      if (govResult.created) stats.created++;
      else if (govResult.skipped) stats.skipped++;
      
      // 3. Create districts for this governorate - Level 2
      if (gov.districts && gov.districts.length > 0) {
        console.log(`   Creating ${gov.districts.length} districts for ${gov.name}...`);
        for (const district of gov.districts) {
          const districtData = {
            ...district,
            regionId: generateRegionId(`${gov.name}_${district.name}`),
            coordinates: { lat: district.lat, lng: district.lng }
          };
          const districtItem = createRegionItem(districtData, 2, gov.regionId);
          const distResult = await createRegion(districtItem);
          if (distResult.created) stats.created++;
          else if (distResult.skipped) stats.skipped++;
        }
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Created:  ${stats.created}`);
    console.log(`⏭️  Skipped:  ${stats.skipped}`);
    console.log(`❌ Failed:   ${stats.failed}`);
    console.log('='.repeat(60));
    
    if (DRY_RUN) {
      console.log('\n💡 This was a DRY RUN. Re-run without --dry-run to persist changes.');
    }
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    if (String(error.message || '').toLowerCase().includes('expired') || 
        String(error.name || '').includes('Expired')) {
      console.error(`\n💡 Hint: aws sso login --profile ${process.env.AWS_PROFILE || 'default'}`);
    }
    process.exit(1);
  }
}

// Run seeding
seedIraqRegions().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
