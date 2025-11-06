#!/usr/bin/env node
/**
 * Direct Region Upload via Local API
 * Uses the same configuration as the running local server
 */

const fetch = require('node-fetch');

async function uploadRegionsViaAPI() {
    console.log('🚀 UPLOADING NAJAF REGIONS VIA LOCAL API');
    console.log('=========================================\n');
    
    // Load regions
    const { najafRegions } = require('./create-najaf-complete-regions.js');
    
    console.log(`📊 Uploading ${najafRegions.length} regions to local server...\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const region of najafRegions) {
        try {
            const response = await fetch('http://localhost:3000/api/regions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...region,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    source: 'najaf-comprehensive-local-upload'
                })
            });
            
            if (response.ok) {
                successCount++;
                const icon = region.level === 2 ? '🏙️' : '🏘️';
                console.log(`${icon} [${successCount}/${najafRegions.length}] ✅ ${region.name}`);
                console.log(`   ${region.name_ar}`);
                console.log(`   GPS: ${region.coordinates.lat}, ${region.coordinates.lng}\n`);
            } else {
                throw new Error(`HTTP ${response.status}: ${await response.text()}`);
            }
            
        } catch (error) {
            errorCount++;
            console.error(`❌ Failed to upload ${region.name}: ${error.message}\n`);
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 UPLOAD COMPLETE');
    console.log('==================');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    
    if (successCount > 0) {
        console.log('\n🎉 Najaf comprehensive regions uploaded!');
        console.log('\n🔄 Please refresh the Regions Management page to see all 20 regions!');
    }
}

uploadRegionsViaAPI().catch(console.error);
