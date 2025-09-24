#!/usr/bin/env node
/**
 * Verification Script for Iraqi Regions in AWS DynamoDB
 * Validates comprehensive coverage of all 18 governorates with districts and neighborhoods
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
const client = new DynamoDBClient({
    region: 'us-east-1',
});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'WizzCentral_Regions';

// Official list of 18 Iraqi governorates
const EXPECTED_GOVERNORATES = [
    'baghdad', 'basra', 'nineveh', 'erbil', 'sulaymaniyah', 'duhok',
    'kirkuk', 'anbar', 'najaf', 'karbala', 'babylon', 'diyala',
    'saladin', 'wasit', 'maysan', 'dhi_qar', 'muthanna', 'qadisiyyah'
];

async function verifyIraqiRegions() {
    try {
        console.log('🔍 IRAQI REGIONS VERIFICATION');
        console.log('===============================================');
        console.log(`📊 Target Table: ${TABLE_NAME}`);
        console.log(`🌍 Expected Governorates: ${EXPECTED_GOVERNORATES.length}`);
        console.log('===============================================');
        console.log('');

        // Scan all regions
        let allRegions = [];
        let lastEvaluatedKey = null;

        do {
            const scanParams = {
                TableName: TABLE_NAME,
                ...(lastEvaluatedKey && { ExclusiveStartKey: lastEvaluatedKey })
            };

            const result = await docClient.send(new ScanCommand(scanParams));
            allRegions = allRegions.concat(result.Items || []);
            lastEvaluatedKey = result.LastEvaluatedKey;

        } while (lastEvaluatedKey);

        console.log(`📊 Total regions found: ${allRegions.length}`);
        console.log('');

        // Analyze by level
        const byLevel = {
            0: allRegions.filter(r => r.level === 0), // country
            1: allRegions.filter(r => r.level === 1), // governorate
            2: allRegions.filter(r => r.level === 2), // district
            3: allRegions.filter(r => r.level === 3)  // neighborhood
        };

        console.log('📋 HIERARCHY BREAKDOWN:');
        console.log(`   🌍 Country (Level 0): ${byLevel[0].length}`);
        console.log(`   🏛️  Governorate (Level 1): ${byLevel[1].length}/18`);
        console.log(`   🏙️  District (Level 2): ${byLevel[2].length}`);
        console.log(`   🏘️  Neighborhood (Level 3): ${byLevel[3].length}`);
        console.log('');

        // Check Iraq country level
        const iraq = byLevel[0].find(r => r.regionId === 'iraq');
        if (iraq) {
            console.log('✅ Iraq country level found');
        } else {
            console.log('❌ Iraq country level missing');
        }
        console.log('');

        // Verify all 18 governorates
        console.log('🏛️  GOVERNORATE VERIFICATION:');
        const foundGovernorates = byLevel[1].map(g => g.regionId.toLowerCase());
        const missingGovernorates = EXPECTED_GOVERNORATES.filter(expected => 
            !foundGovernorates.includes(expected)
        );

        if (missingGovernorates.length === 0) {
            console.log('✅ ALL 18 IRAQI GOVERNORATES PRESENT');
        } else {
            console.log(`❌ MISSING ${missingGovernorates.length} GOVERNORATES:`);
            missingGovernorates.forEach(gov => console.log(`   - ${gov}`));
        }
        console.log('');

        // Detailed governorate analysis
        console.log('📍 GOVERNORATE DETAILS:');
        byLevel[1]
            .sort((a, b) => a.regionName.localeCompare(b.regionName))
            .forEach(gov => {
                const districts = byLevel[2].filter(d => d.governorateId === gov.regionId);
                const neighborhoods = byLevel[3].filter(n => n.governorateId === gov.regionId);
                const status = gov.metadata?.status === 'active' ? '🟢' : '🔴';
                
                console.log(`  ${status} ${gov.regionName} (${gov.regionNameArabic})`);
                console.log(`     📍 ID: ${gov.regionId}`);
                console.log(`     🏙️  Districts: ${districts.length}`);
                console.log(`     🏘️  Neighborhoods: ${neighborhoods.length}`);
                console.log(`     👥 Population: ${(gov.metadata?.populationEstimate || 0).toLocaleString()}`);
                console.log(`     📦 Orders: ${(gov.statistics?.totalOrders || 0).toLocaleString()}`);
                console.log(`     🚗 Drivers: ${gov.statistics?.activeDrivers || 0}`);
                console.log('');
            });

        // Service coverage analysis
        const activeRegions = allRegions.filter(r => r.metadata?.status === 'active');
        const deliveryEnabled = allRegions.filter(r => r.serviceConfig?.serviceTypes?.delivery);
        const pickupEnabled = allRegions.filter(r => r.serviceConfig?.serviceTypes?.pickup);

        console.log('🔧 SERVICE COVERAGE ANALYSIS:');
        console.log(`   🟢 Active regions: ${activeRegions.length}/${allRegions.length}`);
        console.log(`   🚚 Delivery enabled: ${deliveryEnabled.length}/${allRegions.length}`);
        console.log(`   📦 Pickup enabled: ${pickupEnabled.length}/${allRegions.length}`);
        console.log('');

        // Population and operational statistics
        const totalPopulation = allRegions.reduce((sum, r) => sum + (r.metadata?.populationEstimate || 0), 0);
        const totalOrders = allRegions.reduce((sum, r) => sum + (r.statistics?.totalOrders || 0), 0);
        const totalDrivers = allRegions.reduce((sum, r) => sum + (r.statistics?.activeDrivers || 0), 0);
        const totalMerchants = allRegions.reduce((sum, r) => sum + (r.statistics?.activeMerchants || 0), 0);

        console.log('📈 OPERATIONAL STATISTICS:');
        console.log(`   👥 Total Population: ${totalPopulation.toLocaleString()}`);
        console.log(`   📦 Total Orders: ${totalOrders.toLocaleString()}`);
        console.log(`   🚗 Total Drivers: ${totalDrivers.toLocaleString()}`);
        console.log(`   🏪 Total Merchants: ${totalMerchants.toLocaleString()}`);
        console.log('');

        // Data quality checks
        console.log('🔍 DATA QUALITY CHECKS:');
        const regionsWithoutArabic = allRegions.filter(r => !r.regionNameArabic);
        const regionsWithoutCoordinates = allRegions.filter(r => !r.coordinates?.lat || !r.coordinates?.lng);
        const regionsWithoutStats = allRegions.filter(r => !r.statistics);

        console.log(`   ❓ Missing Arabic names: ${regionsWithoutArabic.length}`);
        console.log(`   ❓ Missing coordinates: ${regionsWithoutCoordinates.length}`);
        console.log(`   ❓ Missing statistics: ${regionsWithoutStats.length}`);
        console.log('');

        // Hierarchy validation
        console.log('🔗 HIERARCHY VALIDATION:');
        let hierarchyErrors = 0;
        
        // Check districts have valid governorate parents
        byLevel[2].forEach(district => {
            if (!byLevel[1].find(gov => gov.regionId === district.parentRegionId)) {
                console.log(`   ❌ District ${district.regionName} has invalid parent: ${district.parentRegionId}`);
                hierarchyErrors++;
            }
        });

        // Check neighborhoods have valid district parents
        byLevel[3].forEach(neighborhood => {
            if (!byLevel[2].find(dist => dist.regionId === neighborhood.parentRegionId)) {
                console.log(`   ❌ Neighborhood ${neighborhood.regionName} has invalid parent: ${neighborhood.parentRegionId}`);
                hierarchyErrors++;
            }
        });

        if (hierarchyErrors === 0) {
            console.log('   ✅ All hierarchical relationships valid');
        } else {
            console.log(`   ❌ Found ${hierarchyErrors} hierarchy errors`);
        }
        console.log('');

        // Final assessment
        console.log('🏁 VERIFICATION SUMMARY:');
        console.log('===============================================');
        
        const checks = [
            { name: 'Iraq country level', passed: !!iraq },
            { name: 'All 18 governorates', passed: missingGovernorates.length === 0 },
            { name: 'Districts present', passed: byLevel[2].length > 0 },
            { name: 'Neighborhoods present', passed: byLevel[3].length > 0 },
            { name: 'Hierarchy valid', passed: hierarchyErrors === 0 },
            { name: 'Data quality good', passed: regionsWithoutArabic.length === 0 && regionsWithoutCoordinates.length === 0 }
        ];

        const passedChecks = checks.filter(c => c.passed).length;
        const allPassed = passedChecks === checks.length;

        checks.forEach(check => {
            const status = check.passed ? '✅' : '❌';
            console.log(`${status} ${check.name}`);
        });

        console.log('');
        console.log(`📊 Overall Status: ${passedChecks}/${checks.length} checks passed`);
        
        if (allPassed) {
            console.log('🎉 ✅ VERIFICATION SUCCESSFUL - Iraqi regions data is comprehensive and valid!');
        } else {
            console.log('⚠️  ❌ VERIFICATION FAILED - Issues found that need attention');
        }

        console.log('===============================================');

        return {
            success: allPassed,
            totalRegions: allRegions.length,
            governoratesFound: foundGovernorates.length,
            missingGovernorates: missingGovernorates,
            hierarchyErrors: hierarchyErrors,
            checks: checks
        };

    } catch (error) {
        console.error('❌ Verification failed:', error);
        throw error;
    }
}

// Run verification
if (require.main === module) {
    verifyIraqiRegions()
        .then((result) => {
            console.log('🏁 Verification completed');
            process.exit(result.success ? 0 : 1);
        })
        .catch(error => {
            console.error('💥 Verification failed:', error);
            process.exit(1);
        });
}

module.exports = { verifyIraqiRegions };
