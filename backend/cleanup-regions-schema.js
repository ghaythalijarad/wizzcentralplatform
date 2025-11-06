#!/usr/bin/env node
/**
 * Clean Up DynamoDB Regions Table Schema
 * 
 * Removes unnecessary fields from all 116 items and standardizes to:
 * - regionId (primary key)
 * - name (English)
 * - name_ar (Arabic)
 * - level (country/governorate/district)
 * - parent_id (parent region)
 * - is_active ("true" or "false" string)
 * - coordinates (lat/lng object)
 * - createdAt, updatedAt (timestamps)
 * - metadata (optional: population, area_km2, capital)
 * 
 * Removes:
 * - governorate_id, governorateId, parentRegionId (use parent_id only)
 * - boundary, countryCode, delivery_config, enhanced_with_gadm, gadm_data
 * - regionCode, regionName, hierarchy
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ 
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: process.env.AWS_PROFILE ? undefined : {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const dynamoDB = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'WizzCentral_Regions';

// Fields to keep
const KEEP_FIELDS = [
    'regionId',
    'name',
    'name_ar',
    'level',
    'parent_id',
    'is_active',
    'coordinates',
    'createdAt',
    'updatedAt',
    'metadata'
];

// Fields to remove
const REMOVE_FIELDS = [
    'governorate_id',
    'governorateId',
    'parentRegionId',
    'boundary',
    'countryCode',
    'delivery_config',
    'enhanced_with_gadm',
    'gadm_data',
    'regionCode',
    'regionName',
    'hierarchy'
];

async function getAllRegions() {
    console.log('\n📋 Scanning all regions from DynamoDB...');
    const params = {
        TableName: TABLE_NAME
    };

    try {
        const result = await dynamoDB.send(new ScanCommand(params));
        console.log(`✅ Found ${result.Items.length} regions`);
        return result.Items || [];
    } catch (error) {
        console.error('❌ Error scanning regions:', error);
        throw error;
    }
}

function cleanRegionItem(item) {
    const cleanedItem = {};
    
    // Keep only specified fields
    KEEP_FIELDS.forEach(field => {
        if (item.hasOwnProperty(field)) {
            cleanedItem[field] = item[field];
        }
    });

    // Normalize parent_id field
    if (!cleanedItem.parent_id && item.governorate_id) {
        cleanedItem.parent_id = item.governorate_id;
    }
    if (!cleanedItem.parent_id && item.governorateId) {
        cleanedItem.parent_id = item.governorateId;
    }
    if (!cleanedItem.parent_id && item.parentRegionId) {
        cleanedItem.parent_id = item.parentRegionId;
    }

    // Ensure required fields exist
    if (!cleanedItem.regionId) {
        throw new Error(`Missing regionId in item: ${JSON.stringify(item)}`);
    }

    // Normalize is_active to string
    if (typeof cleanedItem.is_active === 'boolean') {
        cleanedItem.is_active = cleanedItem.is_active ? 'true' : 'false';
    }
    if (!cleanedItem.is_active) {
        cleanedItem.is_active = 'true'; // Default to active
    }

    // Ensure timestamps exist
    const now = new Date().toISOString();
    if (!cleanedItem.createdAt) {
        cleanedItem.createdAt = now;
    }
    if (!cleanedItem.updatedAt) {
        cleanedItem.updatedAt = now;
    }

    // Normalize coordinates
    if (cleanedItem.coordinates) {
        // Ensure it has lat and lng
        if (!cleanedItem.coordinates.lat && cleanedItem.coordinates.latitude) {
            cleanedItem.coordinates.lat = cleanedItem.coordinates.latitude;
            delete cleanedItem.coordinates.latitude;
        }
        if (!cleanedItem.coordinates.lng && cleanedItem.coordinates.longitude) {
            cleanedItem.coordinates.lng = cleanedItem.coordinates.longitude;
            delete cleanedItem.coordinates.longitude;
        }
    }

    // Clean metadata if it exists
    if (cleanedItem.metadata) {
        const cleanedMetadata = {};
        const allowedMetadataFields = ['population', 'area_km2', 'capital'];
        allowedMetadataFields.forEach(field => {
            if (cleanedItem.metadata[field] !== undefined) {
                cleanedMetadata[field] = cleanedItem.metadata[field];
            }
        });
        cleanedItem.metadata = Object.keys(cleanedMetadata).length > 0 ? cleanedMetadata : undefined;
        if (!cleanedItem.metadata) {
            delete cleanedItem.metadata;
        }
    }

    return cleanedItem;
}

async function updateRegion(cleanedItem) {
    try {
        await dynamoDB.send(new PutCommand({
            TableName: TABLE_NAME,
            Item: cleanedItem
        }));
        return true;
    } catch (error) {
        console.error(`❌ Error updating region ${cleanedItem.regionId}:`, error.message);
        return false;
    }
}

async function cleanupSchema() {
    console.log('\n🧹 STARTING DYNAMODB SCHEMA CLEANUP');
    console.log('═'.repeat(80));
    console.log('📦 Table:', TABLE_NAME);
    console.log('✅ Keeping fields:', KEEP_FIELDS.join(', '));
    console.log('❌ Removing fields:', REMOVE_FIELDS.join(', '));
    console.log('═'.repeat(80));

    try {
        // Get all regions
        const regions = await getAllRegions();
        
        if (regions.length === 0) {
            console.log('\n⚠️  No regions found in table');
            return;
        }

        console.log(`\n🔄 Processing ${regions.length} regions...`);
        
        let successCount = 0;
        let errorCount = 0;
        const errors = [];

        for (let i = 0; i < regions.length; i++) {
            const region = regions[i];
            const progress = `[${i + 1}/${regions.length}]`;
            
            try {
                const cleanedItem = cleanRegionItem(region);
                const success = await updateRegion(cleanedItem);
                
                if (success) {
                    successCount++;
                    console.log(`${progress} ✅ ${cleanedItem.name || cleanedItem.regionId}`);
                } else {
                    errorCount++;
                    errors.push({ regionId: region.regionId, error: 'Update failed' });
                }
            } catch (error) {
                errorCount++;
                errors.push({ regionId: region.regionId, error: error.message });
                console.log(`${progress} ❌ ${region.regionId}: ${error.message}`);
            }
        }

        console.log('\n' + '═'.repeat(80));
        console.log('📊 CLEANUP SUMMARY');
        console.log('═'.repeat(80));
        console.log(`✅ Successfully cleaned: ${successCount} regions`);
        console.log(`❌ Errors: ${errorCount} regions`);
        console.log(`📈 Total processed: ${regions.length} regions`);
        
        if (errors.length > 0) {
            console.log('\n❌ Failed regions:');
            errors.forEach(err => {
                console.log(`  - ${err.regionId}: ${err.error}`);
            });
        }

        console.log('\n✨ Schema cleanup completed!');
        console.log('═'.repeat(80));

    } catch (error) {
        console.error('\n❌ FATAL ERROR:', error);
        process.exit(1);
    }
}

// Dry run mode
async function dryRun() {
    console.log('\n🔍 DRY RUN MODE - No changes will be made');
    console.log('═'.repeat(80));

    try {
        const regions = await getAllRegions();
        
        console.log(`\n📋 Analyzing ${regions.length} regions...\n`);

        let itemsNeedingCleanup = 0;
        const fieldCounts = {};

        regions.forEach(region => {
            let hasUnnecessaryFields = false;
            
            Object.keys(region).forEach(field => {
                if (!fieldCounts[field]) {
                    fieldCounts[field] = 0;
                }
                fieldCounts[field]++;

                if (REMOVE_FIELDS.includes(field)) {
                    hasUnnecessaryFields = true;
                }
            });

            if (hasUnnecessaryFields) {
                itemsNeedingCleanup++;
            }
        });

        console.log('📊 Field Usage Across All Items:');
        Object.entries(fieldCounts)
            .sort((a, b) => b[1] - a[1])
            .forEach(([field, count]) => {
                const symbol = REMOVE_FIELDS.includes(field) ? '❌' : '✅';
                console.log(`  ${symbol} ${field}: ${count} items`);
            });

        console.log(`\n🧹 Items needing cleanup: ${itemsNeedingCleanup}/${regions.length}`);
        console.log('\n💡 Run without --dry-run to perform actual cleanup');
        console.log('═'.repeat(80));

    } catch (error) {
        console.error('\n❌ Error during dry run:', error);
        process.exit(1);
    }
}

// Main execution
const isDryRun = process.argv.includes('--dry-run');

if (isDryRun) {
    dryRun();
} else {
    // Show warning before actual cleanup
    console.log('\n⚠️  WARNING: This will modify all items in the DynamoDB table!');
    console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');
    
    setTimeout(() => {
        cleanupSchema();
    }, 3000);
}
