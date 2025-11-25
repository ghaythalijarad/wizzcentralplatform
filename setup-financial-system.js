#!/usr/bin/env node
/**
 * Setup Financial Management System
 * Creates tables and populates with sample data
 * Run: node setup-financial-system.js
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const ddbClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1'
});

const dynamoDB = DynamoDBDocumentClient.from(ddbClient);

const COMMISSIONS_TABLE = 'WizzCentral_Commission_Rules';
const DELIVERY_FEES_TABLE = 'WizzCentral_Delivery_Fee_Rules';

// Sample commission rules (merchant-specific only)
const now = Date.now();
const inAYear = now + 365 * 24 * 60 * 60 * 1000;
const sampleCommissionRules = [
    {
        ruleId: `COMM_${now}_m_sununu`,
        ruleName: 'سنونو Commission',
        merchantId: 'business_1756855226821_cshyb2wugda',
        ruleType: 'percentage',
        isActive: true,
        priority: 1,
        effectiveFrom: now,
        effectiveTo: inAYear,
        createdAt: now,
        updatedAt: now,
        rates: { currency: 'IQD', percentage: 12.0 }
    },
    {
        ruleId: `COMM_${now + 1}_m_kartoshka`,
        ruleName: 'كارتوشكا Commission',
        merchantId: 'business_1756336745961_ywix4oy9aa',
        ruleType: 'percentage',
        isActive: true,
        priority: 1,
        effectiveFrom: now,
        effectiveTo: inAYear,
        createdAt: now,
        updatedAt: now,
        rates: { currency: 'IQD', percentage: 10.0 }
    },
    {
        ruleId: `COMM_${now + 2}_m_karada`,
        ruleName: 'أسواق الكرادة Commission',
        merchantId: 'business_1756392075844_vdlqud6gyu',
        ruleType: 'hybrid',
        isActive: true,
        priority: 2,
        effectiveFrom: now,
        effectiveTo: inAYear,
        createdAt: now,
        updatedAt: now,
        rates: { currency: 'IQD', percentage: 8.0, flatFee: 250 }
    }
];

// Sample delivery fee rules
const sampleDeliveryFeeRules = [
    {
        ruleId: `DELIV_${Date.now()}_bgd`,
        ruleName: 'Baghdad Standard Delivery',
        ruleType: 'distance_based',
        isActive: true,
        priority: 10,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        conditions: {
            regionId: 'REG_IQ_BGD',
            serviceType: 'standard'
        },
        rates: {
            currency: 'IQD',
            baseFee: 2000,
            perKmRate: 250,
            minimumFee: 1500,
            maximumFee: 8000,
            freeDeliveryThreshold: 25000
        }
    },
    {
        ruleId: `DELIV_${Date.now() + 1}_bgd_express`,
        ruleName: 'Baghdad Express Delivery',
        ruleType: 'distance_based',
        isActive: true,
        priority: 5,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        conditions: {
            regionId: 'REG_IQ_BGD',
            serviceType: 'express'
        },
        rates: {
            currency: 'IQD',
            baseFee: 3500,
            perKmRate: 400,
            minimumFee: 3000,
            maximumFee: 12000,
            freeDeliveryThreshold: 50000
        }
    },
    {
        ruleId: `DELIV_${Date.now() + 2}_njf`,
        ruleName: 'Najaf Standard Delivery',
        ruleType: 'distance_based',
        isActive: true,
        priority: 10,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        conditions: {
            regionId: 'REG_IQ_NJF',
            serviceType: 'standard'
        },
        rates: {
            currency: 'IQD',
            baseFee: 1500,
            perKmRate: 200,
            minimumFee: 1000,
            maximumFee: 6000,
            freeDeliveryThreshold: 20000
        }
    },
    {
        ruleId: `DELIV_${Date.now() + 3}_flat`,
        ruleName: 'Flat Rate All Regions',
        ruleType: 'flat',
        isActive: false,
        priority: 20,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        conditions: {
            regionId: 'all',
            serviceType: 'standard'
        },
        rates: {
            currency: 'IQD',
            baseFee: 2500,
            minimumFee: 2500,
            maximumFee: 2500,
            freeDeliveryThreshold: 30000
        }
    }
];

async function populateTable(tableName, items, itemType) {
    console.log(`\n📝 Populating ${tableName} with ${items.length} ${itemType}...`);
    
    for (const item of items) {
        try {
            const command = new PutCommand({
                TableName: tableName,
                Item: item
            });
            
            await dynamoDB.send(command);
            console.log(`   ✅ Added: ${item.ruleName} (${item.ruleId})`);
        } catch (error) {
            console.error(`   ❌ Failed to add ${item.ruleName}:`, error.message);
        }
    }
    
    console.log(`✅ Finished populating ${tableName}`);
}

async function main() {
    console.log('🚀 Setting up Financial Management System');
    console.log('==========================================\n');
    console.log(`Region: ${process.env.AWS_REGION || 'us-east-1'}`);
    console.log(`Profile: ${process.env.AWS_PROFILE || 'default'}\n`);
    
    console.log('⚠️  NOTE: This script assumes tables already exist.');
    console.log('   Run create-financial-tables.js first if needed.\n');
    
    try {
        // Populate commission rules
        await populateTable(COMMISSIONS_TABLE, sampleCommissionRules, 'commission rules');
        
        // Populate delivery fee rules
        await populateTable(DELIVERY_FEES_TABLE, sampleDeliveryFeeRules, 'delivery fee rules');
        
        console.log('\n✅ Financial Management System Setup Complete!');
        console.log('\n📊 Sample Data Summary:');
        console.log(`   • Commission Rules: ${sampleCommissionRules.length} (${sampleCommissionRules.filter(r => r.isActive).length} active)`);
        console.log(`   • Delivery Fee Rules: ${sampleDeliveryFeeRules.length} (${sampleDeliveryFeeRules.filter(r => r.isActive).length} active)`);
        console.log('\n📋 Commission Rules:');
        sampleCommissionRules.forEach(rule => {
            const status = rule.isActive ? '✅' : '⏸️ ';
            const rate = rule.ruleType === 'percentage' 
                ? `${rule.rates.percentage}%` 
                : rule.ruleType === 'tiered' 
                    ? 'Tiered' 
                    : 'Other';
            console.log(`   ${status} ${rule.ruleName} - ${rate} (Priority: ${rule.priority})`);
        });
        console.log('\n🚚 Delivery Fee Rules:');
        sampleDeliveryFeeRules.forEach(rule => {
            const status = rule.isActive ? '✅' : '⏸️ ';
            const region = rule.conditions.regionId === 'all' ? 'All Regions' : rule.conditions.regionId;
            console.log(`   ${status} ${rule.ruleName} - ${region} (Priority: ${rule.priority})`);
        });
        console.log('\n🎯 Next Steps:');
        console.log('   1. Start/restart local dev server: npm run local');
        console.log('   2. Open: http://localhost:3000/financial-management.html');
        console.log('   3. Test commission calculation with sample order');
        console.log('   4. Create your own custom rules!');
        
    } catch (error) {
        console.error('\n❌ Error setting up system:', error);
        console.error('\n💡 Troubleshooting:');
        console.error('   1. Ensure tables exist (run create-financial-tables.js)');
        console.error('   2. Verify AWS credentials: aws sso login');
        console.error('   3. Check DynamoDB permissions');
        process.exit(1);
    }
}

main();
