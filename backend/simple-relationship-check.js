#!/usr/bin/env node
/**
 * Simple Parent-Child Relationship Checker
 */

console.log('Starting relationship check...\n');

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const dynamoDB = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'WizzCentral_Regions';

async function checkRelationships() {
    try {
        console.log('Scanning DynamoDB table...');
        
        const result = await dynamoDB.send(new ScanCommand({ 
            TableName: TABLE_NAME 
        }));
        
        const regions = result.Items || [];
        console.log(`✅ Loaded ${regions.length} regions\n`);

        // Create lookup map
        const regionMap = new Map();
        regions.forEach(r => regionMap.set(r.regionId, r));

        // Check each region
        const issues = [];
        
        regions.forEach(region => {
            // Skip country level
            if (region.level === '0' || region.level === 0) return;
            
            const parentId = region.parent_id;
            
            if (!parentId) {
                issues.push({
                    type: 'NO_PARENT',
                    regionId: region.regionId,
                    name: region.name,
                    level: region.level
                });
                return;
            }
            
            // Check if parent exists
            if (!regionMap.has(parentId)) {
                issues.push({
                    type: 'BROKEN_LINK',
                    regionId: region.regionId,
                    name: region.name,
                    level: region.level,
                    parent_id: parentId
                });
            }
        });

        console.log('═'.repeat(60));
        console.log('RELATIONSHIP CHECK RESULTS');
        console.log('═'.repeat(60));
        console.log(`Total regions: ${regions.length}`);
        console.log(`Issues found: ${issues.length}\n`);

        if (issues.length === 0) {
            console.log('✅ All relationships are valid!');
        } else {
            // Group by type
            const noParent = issues.filter(i => i.type === 'NO_PARENT');
            const brokenLinks = issues.filter(i => i.type === 'BROKEN_LINK');
            
            if (noParent.length > 0) {
                console.log(`\n⚠️  ${noParent.length} regions without parent_id:`);
                noParent.forEach(i => {
                    console.log(`   - ${i.regionId} (${i.name}) [Level ${i.level}]`);
                });
            }
            
            if (brokenLinks.length > 0) {
                console.log(`\n❌ ${brokenLinks.length} regions with broken parent links:`);
                brokenLinks.forEach(i => {
                    console.log(`   - ${i.regionId} → parent_id="${i.parent_id}" (NOT FOUND)`);
                    console.log(`     Name: ${i.name}, Level: ${i.level}`);
                    
                    // Find possible matches
                    const matches = regions.filter(r => 
                        r.regionId.toLowerCase().includes(i.parent_id.toLowerCase()) ||
                        (r.name && r.name.toLowerCase().includes(i.parent_id.toLowerCase()))
                    );
                    
                    if (matches.length > 0) {
                        console.log(`     💡 Possible matches:`);
                        matches.slice(0, 3).forEach(m => {
                            console.log(`        → ${m.regionId} (${m.name})`);
                        });
                    }
                    console.log('');
                });
            }
            
            // Show missing parent_id values
            console.log('\n📋 Missing parent_id values:');
            const allParentIds = new Set(regions.map(r => r.parent_id).filter(Boolean));
            const allRegionIds = new Set(regions.map(r => r.regionId));
            const missingParents = [...allParentIds].filter(pid => !allRegionIds.has(pid));
            
            missingParents.forEach(mp => {
                const count = regions.filter(r => r.parent_id === mp).length;
                console.log(`   "${mp}" - used by ${count} regions`);
            });
        }

        console.log('\n' + '═'.repeat(60));
        console.log('✅ Check complete\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

checkRelationships().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
