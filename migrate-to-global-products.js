#!/usr/bin/env node
/**
 * Migration Script: Migrate existing products to GlobalProducts table
 * Week 3 Implementation
 * 
 * This script:
 * 1. Scans all products from WhizzMerchants_Products
 * 2. Groups products by SKU/barcode/name to find duplicates
 * 3. Creates canonical GlobalProducts records
 * 4. Updates Products table with globalProductId references
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand, PutCommand, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config();

const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1'
});

const dynamodb = DynamoDBDocumentClient.from(client);

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || 'WhizzMerchants_Products';
const GLOBAL_PRODUCTS_TABLE = 'WhizzMerchants_GlobalProducts';

// Normalize string for comparison
function normalize(str) {
    if (!str) return '';
    return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Generate fingerprint for product
function generateFingerprint(item) {
    const data = JSON.stringify({
        name: item.name || '',
        description: item.description || '',
        categoryId: item.categoryId || '',
        sku: item.sku || '',
        barcode: item.barcode || '',
        portion: item.portion || ''
    });
    return crypto.createHash('sha256').update(data).digest('hex');
}

// Group products by matching criteria
function groupProducts(products) {
    const groups = new Map();
    
    for (const product of products) {
        // Generate a grouping key based on priority: SKU > Barcode > Name+Category
        let groupKey;
        
        if (product.sku) {
            groupKey = `sku:${product.sku.toLowerCase()}`;
        } else if (product.barcode) {
            groupKey = `barcode:${product.barcode}`;
        } else {
            const normalizedName = normalize(product.name);
            const category = product.categoryId || 'uncategorized';
            groupKey = `name:${normalizedName}:${category}`;
        }
        
        if (!groups.has(groupKey)) {
            groups.set(groupKey, []);
        }
        
        groups.get(groupKey).push(product);
    }
    
    return groups;
}

// Create canonical global product from a group of merchant products
function createGlobalProduct(productGroup) {
    // Use the first product as the base (or most complete one)
    const base = productGroup.reduce((best, current) => {
        // Prefer products with more complete data
        const currentScore = (current.description ? 1 : 0) + 
                           (current.imageUrl ? 1 : 0) + 
                           (current.sku ? 1 : 0) + 
                           (current.barcode ? 1 : 0);
        const bestScore = (best.description ? 1 : 0) + 
                        (best.imageUrl ? 1 : 0) + 
                        (best.sku ? 1 : 0) + 
                        (best.barcode ? 1 : 0);
        return currentScore > bestScore ? current : best;
    }, productGroup[0]);
    
    const globalProductId = uuidv4();
    
    // Ensure searchableName is never empty (fallback to globalProductId)
    const searchableName = normalize(base.name) || globalProductId;
    
    // Ensure categoryId is never empty (use 'uncategorized' as fallback)
    const categoryId = base.categoryId || 'uncategorized';
    
    const globalProduct = {
        globalProductId,
        canonicalName: base.name,
        searchableName,  // Required for GSI
        categoryId,      // Required for GSI
        description: base.description || '',
        imageUrl: base.imageUrl || '',
        imageHash: base.imageHash || '',
        portion: base.portion || '',
        usageCount: productGroup.length, // How many merchants use this product
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: base.businessId, // First merchant who created it
        fingerprint: generateFingerprint(base)
    };
    
    // Only add SKU and barcode if they have values (DynamoDB GSI doesn't allow empty strings)
    if (base.sku) {
        globalProduct.sku = base.sku;
    }
    if (base.barcode) {
        globalProduct.barcode = base.barcode;
    }
    
    return globalProduct;
}

async function scanAllProducts() {
    console.log('📊 Scanning all products from ' + PRODUCTS_TABLE + '...');
    
    const products = [];
    let lastEvaluatedKey = null;
    
    do {
        const params = {
            TableName: PRODUCTS_TABLE
        };
        
        if (lastEvaluatedKey) {
            params.ExclusiveStartKey = lastEvaluatedKey;
        }
        
        const result = await dynamodb.send(new ScanCommand(params));
        products.push(...result.Items);
        lastEvaluatedKey = result.LastEvaluatedKey;
        
        process.stdout.write(`\r   Found ${products.length} products...`);
    } while (lastEvaluatedKey);
    
    console.log('');
    return products;
}

async function migrateProducts() {
    console.log('🔄 Starting Migration to GlobalProducts');
    console.log('=' .repeat(60));
    console.log('');
    
    // Step 1: Scan all existing products
    const allProducts = await scanAllProducts();
    console.log(`✅ Found ${allProducts.length} total products`);
    console.log('');
    
    // Step 2: Group products by matching criteria
    console.log('🔍 Grouping products by SKU/barcode/name...');
    const productGroups = groupProducts(allProducts);
    console.log(`✅ Identified ${productGroups.size} unique products`);
    console.log('');
    
    // Step 3: Create global products
    console.log('📝 Creating GlobalProducts records...');
    let createdCount = 0;
    let updatedCount = 0;
    const globalProductMap = new Map(); // Map group key → globalProductId
    
    for (const [groupKey, productGroup] of productGroups) {
        const globalProduct = createGlobalProduct(productGroup);
        
        try {
            await dynamodb.send(new PutCommand({
                TableName: GLOBAL_PRODUCTS_TABLE,
                Item: globalProduct
            }));
            
            globalProductMap.set(groupKey, {
                globalProductId: globalProduct.globalProductId,
                products: productGroup
            });
            
            createdCount++;
            process.stdout.write(`\r   Created ${createdCount}/${productGroups.size} global products...`);
        } catch (error) {
            console.error(`\n❌ Error creating global product for "${globalProduct.canonicalName}":`, error.message);
        }
    }
    
    console.log('');
    console.log(`✅ Created ${createdCount} GlobalProducts records`);
    console.log('');
    
    // Step 4: Update Products table with globalProductId references
    console.log('🔗 Linking merchant products to global catalog...');
    
    for (const [groupKey, group] of globalProductMap) {
        const { globalProductId, products } = group;
        
        for (const product of products) {
            try {
                await dynamodb.send(new UpdateCommand({
                    TableName: PRODUCTS_TABLE,
                    Key: {
                        productId: product.productId
                    },
                    UpdateExpression: 'SET globalProductId = :gid, updatedAt = :now',
                    ExpressionAttributeValues: {
                        ':gid': globalProductId,
                        ':now': new Date().toISOString()
                    }
                }));
                
                updatedCount++;
                process.stdout.write(`\r   Linked ${updatedCount}/${allProducts.length} products...`);
            } catch (error) {
                console.error(`\n❌ Error updating product ${product.productId}:`, error.message);
            }
        }
    }
    
    console.log('');
    console.log(`✅ Linked ${updatedCount} merchant products to global catalog`);
    console.log('');
    
    // Step 5: Summary
    console.log('📊 Migration Summary:');
    console.log('=' .repeat(60));
    console.log(`   Total Products Scanned: ${allProducts.length}`);
    console.log(`   Unique Products (GlobalProducts): ${createdCount}`);
    console.log(`   Products Linked: ${updatedCount}`);
    console.log(`   Deduplication Ratio: ${((1 - createdCount / allProducts.length) * 100).toFixed(1)}%`);
    console.log('');
    
    // Show some stats
    const groupSizes = Array.from(productGroups.values()).map(g => g.length);
    const avgDuplicates = (groupSizes.reduce((a, b) => a + b, 0) / groupSizes.length).toFixed(2);
    const maxDuplicates = Math.max(...groupSizes);
    
    console.log('📈 Duplication Statistics:');
    console.log(`   Average merchants per product: ${avgDuplicates}`);
    console.log(`   Most popular product: ${maxDuplicates} merchants`);
    console.log('');
    
    // Find most popular product
    const mostPopular = Array.from(productGroups.values())
        .reduce((max, current) => current.length > max.length ? current : max);
    console.log('🏆 Most Popular Product:');
    console.log(`   Name: ${mostPopular[0].name}`);
    console.log(`   Used by: ${mostPopular.length} merchants`);
    console.log('');
    
    console.log('✅ Migration Complete!');
    console.log('');
    console.log('📝 Next Steps:');
    console.log('   1. Verify data: node verify-global-products.js');
    console.log('   2. Update bulk upload handler to use GlobalProducts');
    console.log('   3. Test with new uploads');
}

async function main() {
    try {
        await migrateProducts();
    } catch (error) {
        console.error('');
        console.error('❌ Migration failed:', error);
        console.error('');
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { migrateProducts, groupProducts, createGlobalProduct };
