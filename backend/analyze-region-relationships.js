#!/usr/bin/env node
/**
 * Analyze Parent-Child Relationships in DynamoDB Regions Table
 * 
 * This script:
 * 1. Scans all 116 regions
 * 2. Analyzes parent_id → regionId relationships
 * 3. Identifies broken links
 * 4. Shows hierarchy tree
 * 5. Suggests fixes
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const dynamoDB = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'WizzCentral_Regions';

async function analyzeRelationships() {
    console.log('\n🔍 ANALYZING PARENT-CHILD RELATIONSHIPS');
    console.log('═'.repeat(80));

    try {
        // Scan all regions
        const result = await dynamoDB.send(new ScanCommand({ TableName: TABLE_NAME }));
        const regions = result.Items || [];
        
        console.log(`\n📊 Total regions: ${regions.length}\n`);

        // Create a map for quick lookup
        const regionMap = new Map();
        regions.forEach(r => regionMap.set(r.regionId, r));

        // Analyze by level
        const byLevel = {
            0: [],
            1: [],
            2: [],
            3: []
        };

        regions.forEach(r => {
            const level = parseInt(r.level) || 0;
            byLevel[level].push(r);
        });

        console.log('📋 Regions by Level:');
        console.log(`  Level 0 (Country): ${byLevel[0].length}`);
        console.log(`  Level 1 (Governorate): ${byLevel[1].length}`);
        console.log(`  Level 2 (District): ${byLevel[2].length}`);
        console.log(`  Level 3 (Neighborhood): ${byLevel[3].length}`);

        // Check for broken parent relationships
        console.log('\n\n🔗 PARENT-CHILD RELATIONSHIP ANALYSIS');
        console.log('═'.repeat(80));

        const broken = [];
        const orphans = [];
        const valid = [];

        regions.forEach(region => {
            if (region.level === '0' || region.level === 0) {
                // Country level - no parent needed
                valid.push({ region: region.regionId, status: 'ROOT' });
                return;
            }

            const parentId = region.parent_id;
            
            if (!parentId) {
                orphans.push({
                    regionId: region.regionId,
                    name: region.name,
                    level: region.level,
                    issue: 'No parent_id specified'
                });
                return;
            }

            // Check if parent exists
            const parent = regionMap.get(parentId);
            
            if (!parent) {
                broken.push({
                    regionId: region.regionId,
                    name: region.name,
                    level: region.level,
                    parent_id: parentId,
                    issue: `Parent "${parentId}" not found in table`
                });
            } else {
                valid.push({
                    region: region.regionId,
                    parent: parentId,
                    status: 'LINKED'
                });
            }
        });

        console.log(`\n✅ Valid relationships: ${valid.length}`);
        console.log(`❌ Broken relationships: ${broken.length}`);
        console.log(`⚠️  Orphans (no parent_id): ${orphans.length}`);

        if (broken.length > 0) {
            console.log('\n\n❌ BROKEN RELATIONSHIPS (parent_id points to non-existent regionId):');
            console.log('─'.repeat(80));
            broken.forEach(b => {
                console.log(`\n  Region: ${b.regionId}`);
                console.log(`    Name: ${b.name}`);
                console.log(`    Level: ${b.level}`);
                console.log(`    Looking for parent: "${b.parent_id}"`);
                console.log(`    Issue: ${b.issue}`);
                
                // Suggest potential matches
                const suggestions = regions.filter(r => 
                    r.name && b.parent_id &&
                    (r.name.toLowerCase().includes(b.parent_id.toLowerCase()) ||
                     b.parent_id.toLowerCase().includes(r.name.toLowerCase()) ||
                     r.regionId.toLowerCase().includes(b.parent_id.toLowerCase()))
                ).slice(0, 3);
                
                if (suggestions.length > 0) {
                    console.log(`    💡 Possible parents:`);
                    suggestions.forEach(s => {
                        console.log(`       - ${s.regionId} (${s.name}, level ${s.level})`);
                    });
                }
            });
        }

        if (orphans.length > 0) {
            console.log('\n\n⚠️  ORPHANS (regions without parent_id):');
            console.log('─'.repeat(80));
            orphans.forEach(o => {
                console.log(`  ${o.regionId} - ${o.name} (level ${o.level})`);
            });
        }

        // Show hierarchy tree for sample governorate
        console.log('\n\n🌳 SAMPLE HIERARCHY TREE (Najaf):');
        console.log('═'.repeat(80));
        
        const najaf = regions.find(r => r.regionId === 'najaf' || r.regionId === 'REG_IQ_NJF');
        if (najaf) {
            showTree(najaf, regions, regionMap, 0);
        }

        console.log('\n\n🌳 SAMPLE HIERARCHY TREE (Baghdad):');
        console.log('═'.repeat(80));
        
        const baghdad = regions.find(r => r.regionId === 'baghdad' || r.regionId === 'REG_IQ_BGD');
        if (baghdad) {
            showTree(baghdad, regions, regionMap, 0);
        }

        // Show all unique parent_id values that don't have matching regionId
        console.log('\n\n🔍 PARENT_ID VALUES WITH NO MATCHING REGIONID:');
        console.log('═'.repeat(80));
        
        const allParentIds = new Set(regions.map(r => r.parent_id).filter(Boolean));
        const allRegionIds = new Set(regions.map(r => r.regionId));
        
        const missingParents = [...allParentIds].filter(pid => !allRegionIds.has(pid));
        
        if (missingParents.length === 0) {
            console.log('✅ All parent_id values have matching regionId entries!');
        } else {
            missingParents.forEach(mp => {
                const children = regions.filter(r => r.parent_id === mp);
                console.log(`\n  "${mp}" - used by ${children.length} regions:`);
                children.slice(0, 5).forEach(c => {
                    console.log(`    - ${c.regionId} (${c.name})`);
                });
                if (children.length > 5) {
                    console.log(`    ... and ${children.length - 5} more`);
                }
            });
        }

        console.log('\n' + '═'.repeat(80));
        console.log('✅ Analysis complete!\n');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

function showTree(region, allRegions, regionMap, depth = 0) {
    const indent = '  '.repeat(depth);
    const icon = depth === 0 ? '🏛️' : depth === 1 ? '📍' : depth === 2 ? '🏘️' : '🏠';
    
    console.log(`${indent}${icon} ${region.name || region.regionId} (${region.regionId}) [Level ${region.level}]`);
    
    // Find children
    const children = allRegions.filter(r => r.parent_id === region.regionId);
    
    if (children.length > 0 && depth < 3) { // Limit depth to avoid huge output
        children.slice(0, 5).forEach(child => {
            showTree(child, allRegions, regionMap, depth + 1);
        });
        
        if (children.length > 5) {
            console.log(`${indent}  ... and ${children.length - 5} more children`);
        }
    }
}

// Run analysis
analyzeRelationships();
