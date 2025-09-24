#!/usr/bin/env node
/**
 * Analyze Iraqi Governorates Coverage - All 18 Governorates with Districts & Neighborhoods
 */

const fs = require('fs');

try {
    console.log('📊 COMPREHENSIVE COVERAGE ANALYSIS - ALL 18 IRAQI GOVERNORATES');
    console.log('===============================================');

    // Read and parse regions from local dev server
    const localDevServer = fs.readFileSync('./local-dev-server.js', 'utf8');
    const match = localDevServer.match(/const comprehensiveIraqiRegions = \[([\s\S]*?)\];/);
    
    if (!match) {
        console.error('❌ Could not find regions data in local-dev-server.js');
        process.exit(1);
    }

    const regionsStr = '[' + match[1] + ']';
    const regions = eval('(' + regionsStr + ')');
    
    // All 18 Iraqi Governorates (official list)
    const officialGovernorates = [
        'baghdad', 'basra', 'nineveh', 'erbil', 'sulaymaniyah', 'duhok', 
        'kirkuk', 'anbar', 'najaf', 'karbala', 'babylon', 'diyala', 
        'saladin', 'wasit', 'maysan', 'dhi_qar', 'muthanna', 'qadisiyyah'
    ];
    
    const governorates = regions.filter(r => r.level === 'governorate').sort((a, b) => a.name.localeCompare(b.name));
    
    console.log('📍 GOVERNORATES COVERAGE (' + governorates.length + '/18):');
    console.log('');
    
    // Check each governorate
    governorates.forEach(gov => {
        const districts = regions.filter(r => r.level === 'district' && r.governorate_id === gov.id);
        const neighborhoods = regions.filter(r => r.level === 'neighborhood' && r.governorate_id === gov.id);
        
        console.log('✓ ' + gov.name + ' (' + gov.name_ar + ')');
        console.log('  📍 ID: ' + gov.id);
        console.log('  🏛️  Districts: ' + districts.length);
        
        districts.forEach(dist => {
            const distNeighborhoods = neighborhoods.filter(n => n.parent_id === dist.id);
            console.log('     • ' + dist.name + ' (' + dist.name_ar + ') - ' + distNeighborhoods.length + ' neighborhoods');
        });
        
        console.log('  🏘️  Total Neighborhoods: ' + neighborhoods.length);
        neighborhoods.forEach(neigh => {
            console.log('     • ' + neigh.name + ' (' + neigh.name_ar + ') [parent: ' + neigh.parent_id + ']');
        });
        
        console.log('  🔧 Service Status: ' + (gov.is_active ? '🟢 ACTIVE' : '🔴 INACTIVE'));
        console.log('  👥 Population: ' + (gov.statistics?.population || 0).toLocaleString());
        console.log('  📦 Orders: ' + (gov.statistics?.total_orders || 0).toLocaleString());
        console.log('  🚗 Drivers: ' + (gov.statistics?.active_drivers || 0));
        console.log('');
    });
    
    // Check for missing governorates
    const existingGovIds = governorates.map(g => g.id);
    const missingGovs = officialGovernorates.filter(id => !existingGovIds.includes(id));
    
    if (missingGovs.length > 0) {
        console.log('❌ MISSING GOVERNORATES (' + missingGovs.length + '):');
        missingGovs.forEach(id => console.log('  - ' + id));
        console.log('');
    } else {
        console.log('✅ ALL 18 GOVERNORATES COVERED');
        console.log('');
    }
    
    console.log('📊 HIERARCHICAL SUMMARY:');
    console.log('  📍 Total Regions: ' + regions.length);
    console.log('  🌍 Countries: ' + regions.filter(r => r.level === 'country').length);
    console.log('  🏛️  Governorates: ' + regions.filter(r => r.level === 'governorate').length + '/18');
    console.log('  🏙️  Districts: ' + regions.filter(r => r.level === 'district').length);
    console.log('  🏘️  Neighborhoods: ' + regions.filter(r => r.level === 'neighborhood').length);
    console.log('');
    
    console.log('🔧 SERVICE STATUS:');
    console.log('  🟢 Active Regions: ' + regions.filter(r => r.is_active).length);
    console.log('  🔴 Inactive Regions: ' + regions.filter(r => !r.is_active).length);
    console.log('');
    
    console.log('📈 OPERATIONAL STATISTICS:');
    const totalPopulation = regions.reduce((sum, r) => sum + (r.statistics?.population || 0), 0);
    const totalOrders = regions.reduce((sum, r) => sum + (r.statistics?.total_orders || 0), 0);
    const totalDrivers = regions.reduce((sum, r) => sum + (r.statistics?.active_drivers || 0), 0);
    
    console.log('  👥 Total Population: ' + totalPopulation.toLocaleString());
    console.log('  📦 Total Orders: ' + totalOrders.toLocaleString());
    console.log('  🚗 Total Drivers: ' + totalDrivers.toLocaleString());
    
    console.log('===============================================');
    console.log('✅ ANALYSIS COMPLETE - READY FOR AWS POPULATION');
    
} catch (error) {
    console.error('❌ Error analyzing coverage:', error.message);
    process.exit(1);
}
