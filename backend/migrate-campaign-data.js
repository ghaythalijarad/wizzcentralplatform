/**
 * Campaign Data Migration Script - Architecture Alignment
 * Migrates existing campaigns from WizzCentral_Platform_Discounts to new 3-table structure
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ 
    region: process.env.AWS_REGION || 'us-east-1' 
});

const dynamoDB = DynamoDBDocumentClient.from(dynamoClient);

// Table names
const SOURCE_TABLE = 'WizzCentral_Platform_Discounts';
const CAMPAIGNS_TABLE = 'WizzCentral_Campaigns';
const CONDITIONS_TABLE = 'WizzCentral_Campaign_Conditions';
const USAGE_TABLE = 'WizzCentral_Campaign_Usage';

class CampaignMigrator {
    constructor() {
        this.migrationStats = {
            totalFound: 0,
            successfulMigrations: 0,
            failures: 0,
            skipped: 0
        };
    }

    /**
     * Step 1: Find all existing campaigns in platform discounts table
     */
    async findExistingCampaigns() {
        console.log('🔍 Scanning for existing campaigns...');
        
        try {
            const result = await dynamoDB.send(new ScanCommand({
                TableName: SOURCE_TABLE,
                FilterExpression: 'discountSource = :source',
                ExpressionAttributeValues: {
                    ':source': 'campaign'
                }
            }));
            
            this.migrationStats.totalFound = result.Items.length;
            console.log(`📊 Found ${result.Items.length} campaigns to migrate`);
            
            return result.Items || [];
            
        } catch (error) {
            console.error('❌ Error scanning for campaigns:', error);
            throw error;
        }
    }

    /**
     * Step 2: Transform campaign data for new structure
     */
    transformCampaignData(legacyCampaign) {
        const campaignId = legacyCampaign.discountId || `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        
        // Core campaign data
        const coreData = {
            campaignId,
            title: legacyCampaign.title || legacyCampaign.discountTitle || 'Migrated Campaign',
            type: legacyCampaign.campaignType || legacyCampaign.type || 'marketing',
            discountType: legacyCampaign.discountType || 'percentage',
            discountValue: legacyCampaign.discountValue || legacyCampaign.value || 0,
            startDate: legacyCampaign.startDate || legacyCampaign.validFrom || now,
            endDate: legacyCampaign.endDate || legacyCampaign.validTo || new Date(Date.now() + 30*24*60*60*1000).toISOString(),
            status: (legacyCampaign.isActive || legacyCampaign.status === 'active') ? 'active' : 'inactive',
            isActive: legacyCampaign.isActive ? 'true' : 'false', // String for GSI compatibility
            usageLimit: legacyCampaign.usageLimit || legacyCampaign.limit || 1000,
            targetRestaurants: this.formatTargetRestaurants(legacyCampaign.targetRestaurants),
            createdBy: legacyCampaign.createdBy || 'migration-script',
            createdAt: legacyCampaign.createdAt || now,
            updatedAt: now,
            
            // Additional fields for backwards compatibility
            minOrderValue: legacyCampaign.minOrderValue || legacyCampaign.minOrder || 0,
            description: legacyCampaign.description || `Migrated from platform discounts: ${campaignId}`,
            
            // GSI optimization fields
            statusIndex: `${(legacyCampaign.isActive || legacyCampaign.status === 'active') ? 'active' : 'inactive'}#${legacyCampaign.startDate || now}`,
            activeIndex: `${legacyCampaign.isActive ? 'true' : 'false'}#${legacyCampaign.startDate || now}`
        };
        
        // Conditions data (if exists)
        const conditionsData = legacyCampaign.conditions ? {
            campaignId,
            conditions: Array.isArray(legacyCampaign.conditions) ? legacyCampaign.conditions : [],
            conditionLogic: legacyCampaign.conditionLogic || 'AND',
            createdAt: now,
            updatedAt: now
        } : null;
        
        // Usage tracking data
        const usageData = {
            campaignId,
            usage: legacyCampaign.usage || 0,
            usageLimit: legacyCampaign.usageLimit || legacyCampaign.limit || 1000,
            lastUsedAt: legacyCampaign.lastUsedAt || null,
            createdAt: now
        };
        
        return { coreData, conditionsData, usageData };
    }

    /**
     * Helper: Format target restaurants for GSI compatibility
     */
    formatTargetRestaurants(targetRestaurants) {
        if (!targetRestaurants || !Array.isArray(targetRestaurants)) {
            return [];
        }
        return targetRestaurants;
    }

    /**
     * Step 3: Migrate single campaign to new structure
     */
    async migrateSingleCampaign(legacyCampaign) {
        try {
            const { coreData, conditionsData, usageData } = this.transformCampaignData(legacyCampaign);
            
            console.log(`📝 Migrating campaign: ${coreData.title} (${coreData.campaignId})`);
            
            // Insert into all three tables
            const promises = [
                // Core campaign data
                dynamoDB.send(new PutCommand({
                    TableName: CAMPAIGNS_TABLE,
                    Item: coreData
                })),
                
                // Usage tracking
                dynamoDB.send(new PutCommand({
                    TableName: USAGE_TABLE,
                    Item: usageData
                }))
            ];
            
            // Add conditions if they exist
            if (conditionsData) {
                promises.push(
                    dynamoDB.send(new PutCommand({
                        TableName: CONDITIONS_TABLE,
                        Item: conditionsData
                    }))
                );
            }
            
            await Promise.all(promises);
            
            this.migrationStats.successfulMigrations++;
            console.log(`✅ Successfully migrated: ${coreData.title}`);
            
            return { success: true, campaignId: coreData.campaignId };
            
        } catch (error) {
            this.migrationStats.failures++;
            console.error(`❌ Failed to migrate campaign ${legacyCampaign.discountId || 'unknown'}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    /**
     * Step 4: Run complete migration
     */
    async runMigration(dryRun = false) {
        console.log('🚀 Starting Campaign Architecture Migration...\n');
        
        if (dryRun) {
            console.log('🧪 DRY RUN MODE - No data will be written\n');
        }
        
        try {
            // Find existing campaigns
            const existingCampaigns = await this.findExistingCampaigns();
            
            if (existingCampaigns.length === 0) {
                console.log('ℹ️ No campaigns found to migrate');
                return { success: true, stats: this.migrationStats };
            }
            
            console.log(`\n📋 Migration Plan:`);
            console.log(`  📊 Total campaigns to migrate: ${existingCampaigns.length}`);
            console.log(`  🎯 Target tables: ${CAMPAIGNS_TABLE}, ${CONDITIONS_TABLE}, ${USAGE_TABLE}`);
            console.log(`  🔄 Mode: ${dryRun ? 'DRY RUN' : 'LIVE MIGRATION'}\n`);
            
            if (dryRun) {
                // Dry run - just analyze the data
                console.log('🔍 Dry Run Analysis:');
                for (const campaign of existingCampaigns) {
                    const { coreData, conditionsData } = this.transformCampaignData(campaign);
                    console.log(`  📝 ${coreData.title} - Type: ${coreData.type} - Conditions: ${conditionsData ? 'Yes' : 'No'}`);
                }
                console.log('\n✅ Dry run complete. Data structure looks good!');
                return { success: true, stats: this.migrationStats };
            }
            
            // Live migration
            console.log('📦 Starting live migration...\n');
            
            for (const campaign of existingCampaigns) {
                await this.migrateSingleCampaign(campaign);
                
                // Small delay to avoid overwhelming DynamoDB
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Print final statistics
            console.log('\n📊 Migration Complete!');
            console.log('='.repeat(50));
            console.log(`✅ Successful migrations: ${this.migrationStats.successfulMigrations}`);
            console.log(`❌ Failed migrations: ${this.migrationStats.failures}`);
            console.log(`⏭️ Skipped: ${this.migrationStats.skipped}`);
            console.log(`📈 Success rate: ${Math.round((this.migrationStats.successfulMigrations / this.migrationStats.totalFound) * 100)}%`);
            
            if (this.migrationStats.failures > 0) {
                console.log('\n⚠️ Some migrations failed. Check the logs above for details.');
            }
            
            return { 
                success: this.migrationStats.failures === 0, 
                stats: this.migrationStats 
            };
            
        } catch (error) {
            console.error('💥 Migration failed:', error);
            throw error;
        }
    }

    /**
     * Verify migration was successful
     */
    async verifyMigration() {
        console.log('🔍 Verifying migration...');
        
        try {
            const [campaignsResult, conditionsResult, usageResult] = await Promise.all([
                dynamoDB.send(new ScanCommand({ 
                    TableName: CAMPAIGNS_TABLE,
                    Select: 'COUNT'
                })),
                dynamoDB.send(new ScanCommand({ 
                    TableName: CONDITIONS_TABLE,
                    Select: 'COUNT'
                })),
                dynamoDB.send(new ScanCommand({ 
                    TableName: USAGE_TABLE,
                    Select: 'COUNT'
                }))
            ]);
            
            console.log('📊 Migration Verification:');
            console.log(`  📦 Campaigns: ${campaignsResult.Count}`);
            console.log(`  📋 Conditions: ${conditionsResult.Count}`);
            console.log(`  📈 Usage records: ${usageResult.Count}`);
            
            return {
                campaigns: campaignsResult.Count,
                conditions: conditionsResult.Count,
                usage: usageResult.Count
            };
            
        } catch (error) {
            console.error('❌ Verification failed:', error);
            throw error;
        }
    }
}

// Command line interface
async function main() {
    const args = process.argv.slice(2);
    const isDryRun = args.includes('--dry-run');
    const isVerify = args.includes('--verify');
    
    const migrator = new CampaignMigrator();
    
    try {
        if (isVerify) {
            await migrator.verifyMigration();
        } else {
            const result = await migrator.runMigration(isDryRun);
            
            if (result.success) {
                console.log('\n🎉 Migration completed successfully!');
                if (!isDryRun) {
                    console.log('💡 Run with --verify to check migration results');
                }
            } else {
                console.log('\n⚠️ Migration completed with errors. Check logs above.');
                process.exit(1);
            }
        }
        
    } catch (error) {
        console.error('💥 Migration script failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    console.log('🏗️ Campaign Architecture Migration Script');
    console.log('Usage:');
    console.log('  node migrate-campaign-data.js           # Run live migration');
    console.log('  node migrate-campaign-data.js --dry-run # Analyze data without writing');
    console.log('  node migrate-campaign-data.js --verify  # Verify migration results\n');
    
    main();
}

module.exports = { CampaignMigrator };
