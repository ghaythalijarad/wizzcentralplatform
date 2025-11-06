#!/usr/bin/env node
/**
 * Fix Parent-Child Relationships in DynamoDB Regions Table
 * 
 * This script standardizes parent_id values to match existing regionId values.
 * 
 * Known Issues (from DynamoDB Console):
 * - Some regions use simple names: baghdad, basra, najaf, kirkuk
 * - Others use coded IDs: REG_IQ_BGD, REG_IQ_BSR, REG_IQ_ERB
 * - Children may reference non-existent parent formats
 * 
 * Solution:
 * - Standardize all governorate parent_id values to match their actual regionId
 * - Update all children to use the correct parent regionId format
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const dynamoDB = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'WizzCentral_Regions';

// Mapping of known problematic parent_id values to correct regionId
const PARENT_ID_FIXES = {
    // If children reference these, update to the correct regionId
    'baghdad_central': 'baghdad',
    'basra_central': 'basra',
    'najaf_central': 'najaf',
    'najaf_kufa': 'najaf',
    'kirkuk_central': 'kirkuk',
    'erbil_central': 'erbil',
    'mosul_central': 'mosul',
    'karbala_central': 'karbala',
    'babylon_central': 'babylon',
    
    // Add coded ID mappings if needed
    'REG_IQ_BGD': 'baghdad',
    'REG_IQ_BSR': 'basra',
    'REG_IQ_NJF': 'najaf',
    'REG_IQ_KRK': 'kirkuk',
    'REG_IQ_ERB': 'erbil',
    'REG_IQ_NIN': 'mosul',
    'REG_IQ_KBL': 'karbala',
    'REG_IQ_BBL': 'babylon',
};

async function fixRelationships(dryRun = true) {
    console.log('\n🔧 FIXING PARENT-CHILD RELATIONSHIPS');
    console.log('═'.repeat(80));
    console.log(`Mode: ${dryRun ? '🧪 DRY RUN (no changes)' : '⚡ ACTUAL RUN (applying fixes)'}`);
    console.log('═'.repeat(80));

    try {
        // Step 1: Load all regions
        console.log('\n📥 Loading all regions...');
        const result = await dynamoDB.send(new ScanCommand({ TableName: TABLE_NAME }));
        const regions = result.Items || [];
        console.log(`✅ Loaded ${regions.length} regions\n`);

        // Step 2: Build regionId lookup map
        const regionMap = new Map();
        regions.forEach(r => regionMap.set(r.regionId, r));

        // Step 3: Identify all regions with problematic parent_id
        const toFix = [];
        
        regions.forEach(region => {
            // Skip country level (level 0)
            if (region.level === '0' || region.level === 0) return;
            
            const parentId = region.parent_id;
            
            // Check if parent_id needs fixing
            if (!parentId) {
                toFix.push({
                    regionId: region.regionId,
                    name: region.name,
                    level: region.level,
                    currentParentId: null,
                    issue: 'Missing parent_id',
                    suggestedFix: 'MANUAL_REVIEW_NEEDED'
                });
                return;
            }
            
            // Check if parent exists
            if (!regionMap.has(parentId)) {
                // Parent doesn't exist - check if we have a known fix
                const fixedParentId = PARENT_ID_FIXES[parentId];
                
                if (fixedParentId && regionMap.has(fixedParentId)) {
                    toFix.push({
                        regionId: region.regionId,
                        name: region.name,
                        level: region.level,
                        currentParentId: parentId,
                        newParentId: fixedParentId,
                        issue: `Parent "${parentId}" not found`,
                        suggestedFix: `Update to "${fixedParentId}"`
                    });
                } else {
                    // Try to find a match by name
                    const possibleParents = regions.filter(r => {
                        if (!r.name) return false;
                        const rName = r.name.toLowerCase();
                        const pId = parentId.toLowerCase();
                        return rName.includes(pId) || pId.includes(rName);
                    });
                    
                    if (possibleParents.length === 1) {
                        toFix.push({
                            regionId: region.regionId,
                            name: region.name,
                            level: region.level,
                            currentParentId: parentId,
                            newParentId: possibleParents[0].regionId,
                            issue: `Parent "${parentId}" not found`,
                            suggestedFix: `Update to "${possibleParents[0].regionId}" (matched by name)`
                        });
                    } else {
                        toFix.push({
                            regionId: region.regionId,
                            name: region.name,
                            level: region.level,
                            currentParentId: parentId,
                            issue: `Parent "${parentId}" not found`,
                            suggestedFix: possibleParents.length > 1 
                                ? `AMBIGUOUS: ${possibleParents.map(p => p.regionId).join(', ')}`
                                : 'MANUAL_REVIEW_NEEDED'
                        });
                    }
                }
            }
        });

        // Step 4: Report findings
        console.log('🔍 ANALYSIS RESULTS:');
        console.log('─'.repeat(80));
        console.log(`Total regions checked: ${regions.length}`);
        console.log(`Regions needing fixes: ${toFix.length}`);
        console.log(`Valid relationships: ${regions.length - toFix.length - 1}`); // -1 for country

        if (toFix.length === 0) {
            console.log('\n✅ No fixes needed! All relationships are valid.\n');
            return;
        }

        // Group by fix type
        const autoFixable = toFix.filter(f => f.newParentId);
        const needsReview = toFix.filter(f => !f.newParentId);

        console.log(`\n📋 Breakdown:`);
        console.log(`  ✅ Auto-fixable: ${autoFixable.length}`);
        console.log(`  ⚠️  Needs review: ${needsReview.length}`);

        // Show auto-fixable items
        if (autoFixable.length > 0) {
            console.log('\n\n✅ AUTO-FIXABLE RELATIONSHIPS:');
            console.log('─'.repeat(80));
            autoFixable.forEach((fix, idx) => {
                console.log(`\n${idx + 1}. Region: ${fix.regionId} (${fix.name})`);
                console.log(`   Current parent_id: "${fix.currentParentId}"`);
                console.log(`   New parent_id:     "${fix.newParentId}"`);
                console.log(`   Level: ${fix.level}`);
            });
        }

        // Show items needing review
        if (needsReview.length > 0) {
            console.log('\n\n⚠️  ITEMS NEEDING MANUAL REVIEW:');
            console.log('─'.repeat(80));
            needsReview.forEach((fix, idx) => {
                console.log(`\n${idx + 1}. Region: ${fix.regionId} (${fix.name})`);
                console.log(`   Current parent_id: ${fix.currentParentId || '(null)'}`);
                console.log(`   Issue: ${fix.issue}`);
                console.log(`   Level: ${fix.level}`);
                if (fix.suggestedFix && fix.suggestedFix !== 'MANUAL_REVIEW_NEEDED') {
                    console.log(`   Suggestion: ${fix.suggestedFix}`);
                }
            });
        }

        // Step 5: Apply fixes if not dry run
        if (!dryRun && autoFixable.length > 0) {
            console.log('\n\n⚡ APPLYING FIXES...');
            console.log('═'.repeat(80));

            let successCount = 0;
            let errorCount = 0;

            for (const fix of autoFixable) {
                try {
                    await dynamoDB.send(new UpdateCommand({
                        TableName: TABLE_NAME,
                        Key: { regionId: fix.regionId },
                        UpdateExpression: 'SET parent_id = :newParentId, updatedAt = :now',
                        ExpressionAttributeValues: {
                            ':newParentId': fix.newParentId,
                            ':now': new Date().toISOString()
                        }
                    }));
                    
                    console.log(`✅ Fixed: ${fix.regionId} → parent_id="${fix.newParentId}"`);
                    successCount++;
                } catch (error) {
                    console.error(`❌ Error fixing ${fix.regionId}:`, error.message);
                    errorCount++;
                }
            }

            console.log('\n' + '═'.repeat(80));
            console.log('📊 FIX RESULTS:');
            console.log(`  ✅ Successfully fixed: ${successCount}`);
            console.log(`  ❌ Errors: ${errorCount}`);
            console.log(`  ⚠️  Still need review: ${needsReview.length}`);
        } else if (dryRun) {
            console.log('\n\n🧪 DRY RUN COMPLETE - No changes were made');
            console.log('═'.repeat(80));
            console.log('To apply these fixes, run:');
            console.log('  node backend/fix-parent-relationships.js --actual');
        }

        console.log('\n✅ Script complete!\n');

    } catch (error) {
        console.error('\n❌ Fatal error:', error);
        console.error(error.stack);
        process.exit(1);
    }
}

// Parse command line args
const args = process.argv.slice(2);
const dryRun = !args.includes('--actual');

// Run the fix
fixRelationships(dryRun).catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
