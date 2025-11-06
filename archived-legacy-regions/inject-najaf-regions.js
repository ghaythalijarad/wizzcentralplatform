#!/usr/bin/env node
/**
 * Inject Enhanced Najaf Regions into Local Server
 * Replaces basic Najaf regions with comprehensive 20-region system
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 INJECTING ENHANCED NAJAF REGIONS INTO LOCAL SERVER');
console.log('====================================================\n');

// Load our comprehensive regions
const { najafRegions } = require('./create-najaf-complete-regions.js');

// Read the local server file
const serverFile = path.join(__dirname, 'local-dev-server.js');
let serverContent = fs.readFileSync(serverFile, 'utf8');

console.log('📋 Loading comprehensive Najaf regions...');
console.log(`✅ Loaded ${najafRegions.length} regions\n`);

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

// Generate the replacement code
const najafDistrictsCode = convertedRegions
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

const najafNeighborhoodsCode = convertedRegions
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

// Replace the existing Najaf districts section
const oldNajafDistrictsPattern = /    \/\/ NAJAF DISTRICTS\s+\{[\s\S]*?\},\s*\{[\s\S]*?\},\s*(?=\s*\/\/ KARBALA DISTRICTS)/;

const newNajafDistrictsSection = `    // NAJAF DISTRICTS - ENHANCED WITH GADM BOUNDARIES
${najafDistrictsCode},

`;

console.log('🔄 Replacing existing Najaf districts...');
if (oldNajafDistrictsPattern.test(serverContent)) {
    serverContent = serverContent.replace(oldNajafDistrictsPattern, newNajafDistrictsSection);
    console.log('✅ Najaf districts section replaced');
} else {
    console.log('⚠️  Could not find Najaf districts pattern to replace');
}

// Find and replace the neighborhoods section
const oldNeighborhoodsPattern = /    \/\/ NAJAF NEIGHBORHOODS.*?\{[\s\S]*?\},\s*\{[\s\S]*?\},/;

const newNeighborhoodsSection = `    // NAJAF NEIGHBORHOODS - COMPREHENSIVE 16 NEIGHBORHOODS
${najafNeighborhoodsCode},

    // END NAJAF COMPREHENSIVE REGIONS
`;

console.log('🔄 Replacing existing Najaf neighborhoods...');
if (oldNeighborhoodsPattern.test(serverContent)) {
    serverContent = serverContent.replace(oldNeighborhoodsPattern, newNeighborhoodsSection);
    console.log('✅ Najaf neighborhoods section replaced');
} else {
    console.log('⚠️  Could not find Najaf neighborhoods pattern to replace');
}

// Create backup
const backupFile = `${serverFile}.backup-${Date.now()}`;
fs.writeFileSync(backupFile, fs.readFileSync(serverFile, 'utf8'));
console.log(`📦 Backup created: ${path.basename(backupFile)}`);

// Write the updated file
fs.writeFileSync(serverFile, serverContent);

console.log('\n✅ INJECTION COMPLETE!');
console.log('======================');
console.log('📊 Enhanced local server with:');
console.log(`   • ${convertedRegions.filter(r => r.level === 'district').length} Najaf districts`);
console.log(`   • ${convertedRegions.filter(r => r.level === 'neighborhood').length} Najaf neighborhoods`);
console.log(`   • ${convertedRegions.filter(r => r.enhanced_with_gadm).length} GADM-enhanced districts`);
console.log('');
console.log('🔄 Please restart the local server to see the changes:');
console.log('   1. Stop current server (Ctrl+C)');  
console.log('   2. Run: npm start');
console.log('   3. Refresh the Regions Management page');
console.log('');
console.log('🎉 You will then see all 20 comprehensive Najaf regions!');
