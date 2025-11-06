#!/usr/bin/env node
/**
 * Clean and Replace All Najaf Regions in Local Server
 * Removes all old Najaf entries and adds only our comprehensive 20-region system
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 CLEANING AND REPLACING ALL NAJAF REGIONS');
console.log('============================================\n');

// Load our comprehensive regions
const { najafRegions } = require('./create-najaf-complete-regions.js');

// Read the local server file
const serverFile = path.join(__dirname, 'local-dev-server.js');
let serverContent = fs.readFileSync(serverFile, 'utf8');

console.log('📋 Loading comprehensive Najaf regions...');
console.log(`✅ Loaded ${najafRegions.length} regions\n`);

// Create backup
const backupFile = `${serverFile}.backup-${Date.now()}`;
fs.writeFileSync(backupFile, serverContent);
console.log(`📦 Backup created: ${path.basename(backupFile)}`);

// Convert our regions to the local server format
const convertedRegions = najafRegions.map(region => ({
    id: region.regionId,
    name: region.name,
    name_ar: region.name_ar,
    level: region.level === 2 ? 'district' : 'neighborhood',
    parent_id: region.parent_id,
    governorate_id: region.governorate_id,
    coordinates: region.coordinates,
    is_active: region.is_active,
    service_config: region.service_config,
    statistics: region.statistics,
    ...(region.delivery_config && { delivery_config: region.delivery_config }),
    ...(region.enhanced_with_gadm && { 
        enhanced_with_gadm: region.enhanced_with_gadm,
        gadm_data: region.gadm_data,
        boundary: region.boundary
    })
}));

// Generate the new comprehensive Najaf regions code
const districtsCode = convertedRegions
    .filter(r => r.level === 'district')
    .map(region => `    {
        id: '${region.id}',
        name: '${region.name}',
        name_ar: '${region.name_ar}',
        level: '${region.level}',
        parent_id: '${region.parent_id}',
        governorate_id: '${region.governorate_id}',
        coordinates: { lat: ${region.coordinates.lat}, lng: ${region.coordinates.lng}, radius: ${region.coordinates.radius} },
        is_active: ${region.is_active},
        service_config: ${JSON.stringify(region.service_config)},
        statistics: ${JSON.stringify(region.statistics)}${region.delivery_config ? ',\n        delivery_config: ' + JSON.stringify(region.delivery_config) : ''}${region.enhanced_with_gadm ? ',\n        enhanced_with_gadm: true,\n        gadm_data: ' + JSON.stringify(region.gadm_data) : ''}
    }`)
    .join(',\n');

const neighborhoodsCode = convertedRegions
    .filter(r => r.level === 'neighborhood')
    .map(region => `    {
        id: '${region.id}',
        name: '${region.name}',
        name_ar: '${region.name_ar}',
        level: '${region.level}',
        parent_id: '${region.parent_id}',
        governorate_id: '${region.governorate_id}',
        coordinates: { lat: ${region.coordinates.lat}, lng: ${region.coordinates.lng}, radius: ${region.coordinates.radius} },
        is_active: ${region.is_active},
        service_config: ${JSON.stringify(region.service_config)},
        statistics: ${JSON.stringify(region.statistics)}
    }`)
    .join(',\n');

// Step 1: Remove ALL existing Najaf-related entries
console.log('🗑️  Removing all existing Najaf entries...');

// Remove any lines that contain najaf-related IDs
const najafPatterns = [
    /    \/\/ NAJAF DISTRICTS[\s\S]*?(?=    \/\/ [A-Z]+ DISTRICTS|    \/\/ ADDITIONAL|\];)/g,
    /    \/\/ NAJAF NEIGHBORHOODS[\s\S]*?(?=    \/\/ [A-Z]+ NEIGHBORHOODS|    \/\/ ADDITIONAL|\];)/g,
    /    \/\/ ADDITIONAL KUFA NEIGHBORHOODS[\s\S]*?(?=\];)/g,
    /    \{[\s\S]*?parent_id: 'kufa',[\s\S]*?\},/g,
    /    \{[\s\S]*?id: 'najaf_center'[\s\S]*?\},/g,
    /    \{[\s\S]*?id: 'kufa'[\s\S]*?\},/g,
    /    \{[\s\S]*?id: 'najaf_old_city'[\s\S]*?\},/g,
    /    \{[\s\S]*?id: 'al_maidan'[\s\S]*?\},/g,
    /    \{[\s\S]*?id: 'kufa_old_city'[\s\S]*?\},/g,
    /    \{[\s\S]*?id: 'kufa_university_area'[\s\S]*?\},/g
];

najafPatterns.forEach((pattern, index) => {
    const matches = serverContent.match(pattern);
    if (matches) {
        console.log(`   ✅ Removed pattern ${index + 1}: ${matches.length} matches`);
        serverContent = serverContent.replace(pattern, '');
    }
});

// Step 2: Insert our comprehensive Najaf regions after Karbala
console.log('📝 Inserting comprehensive Najaf regions...');

const insertionPoint = /    \/\/ KARBALA DISTRICTS/;
const najafSection = `
    // ============================================
    // NAJAF COMPREHENSIVE REGIONS - ENHANCED WITH GADM
    // ============================================
    
    // NAJAF DISTRICTS (4 Districts - 3 Enhanced with GADM Boundaries)
${districtsCode},

    // NAJAF NEIGHBORHOODS (16 Neighborhoods across all districts)
${neighborhoodsCode},

    // KARBALA DISTRICTS`;

if (insertionPoint.test(serverContent)) {
    serverContent = serverContent.replace(insertionPoint, najafSection);
    console.log('✅ Inserted comprehensive Najaf regions');
} else {
    console.log('⚠️  Could not find insertion point');
}

// Step 3: Clean up any trailing commas or formatting issues
serverContent = serverContent.replace(/,(\s*),/g, ',');
serverContent = serverContent.replace(/,(\s*)\]/g, '\n]');

// Write the updated file
fs.writeFileSync(serverFile, serverContent);

console.log('\n✅ CLEANUP AND REPLACEMENT COMPLETE!');
console.log('====================================');
console.log('📊 Replaced with comprehensive system:');
console.log(`   • ${convertedRegions.filter(r => r.level === 'district').length} Districts (Level 2)`);
console.log(`   • ${convertedRegions.filter(r => r.level === 'neighborhood').length} Neighborhoods (Level 3)`);
console.log(`   • ${convertedRegions.filter(r => r.enhanced_with_gadm).length} GADM-enhanced districts`);
console.log('');
console.log('🔄 NEXT STEPS:');
console.log('1. Restart the local server (Ctrl+C then npm start)');
console.log('2. Refresh the Regions Management page');
console.log('3. You should now see all 20 comprehensive Najaf regions!');
console.log('');
console.log('🎯 Expected in UI:');
console.log('   • 4 Districts: Najaf Central, Al-Kufa, Al-Manathera, Al-Mishkhab');
console.log('   • 16 Neighborhoods with authentic Arabic names');
console.log('   • Enhanced GPS coordinates and delivery configurations');
console.log('');
console.log('🎉 The comprehensive Najaf regions system is now active!');
