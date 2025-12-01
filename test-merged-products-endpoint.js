#!/usr/bin/env node

/**
 * Test the new GlobalProducts merge endpoint
 * 
 * This script tests the new API endpoint that merges Products table data
 * with GlobalProducts canonical data
 */

const merchantId = process.argv[2] || 'business_1756855226821_cshyb2wugda';

async function testMergedProductsEndpoint() {
    console.log('🧪 Testing GlobalProducts Merge Endpoint\n');
    console.log('═'.repeat(60));
    
    try {
        // Test 1: Get all products for merchant
        console.log('\n📋 Test 1: GET /api/merchants/:merchantId/products');
        console.log('─'.repeat(60));
        
        const response = await fetch(`http://localhost:3000/api/merchants/${merchantId}/products`, {
            headers: {
                'x-debug-mode': 'true'
            }
        });
        
        const data = await response.json();
        
        if (!data.success) {
            console.error('❌ Failed:', data.error);
            return;
        }
        
        console.log(`✅ Success! Found ${data.count} products`);
        console.log('─'.repeat(60));
        
        // Show sample products
        if (data.products.length > 0) {
            console.log('\n📦 Sample Products:');
            
            // Show first 3 products with different data patterns
            const samples = data.products.slice(0, 3);
            
            samples.forEach((product, index) => {
                console.log(`\n${index + 1}. Product ID: ${product.productId}`);
                console.log(`   Name: ${product.name || 'N/A'}`);
                console.log(`   Category: ${product.categoryId || 'N/A'}`);
                console.log(`   Price: ${product.price} ${product.currency || 'IQD'}`);
                console.log(`   Stock: ${product.stockQty || 0}`);
                console.log(`   Global Product ID: ${product.globalProductId || 'None'}`);
                
                if (product.dataSource) {
                    console.log(`   Data Source:`);
                    console.log(`     - Name: ${product.dataSource.name}`);
                    console.log(`     - Description: ${product.dataSource.description}`);
                    console.log(`     - Category: ${product.dataSource.categoryId}`);
                }
            });
            
            // Analyze data sources
            console.log('\n📊 Data Source Analysis:');
            console.log('─'.repeat(60));
            
            const stats = {
                total: data.products.length,
                withGlobalId: 0,
                usingGlobalName: 0,
                usingGlobalCategory: 0,
                usingGlobalDescription: 0,
                legacy: 0
            };
            
            data.products.forEach(product => {
                if (product.globalProductId) {
                    stats.withGlobalId++;
                }
                if (product.dataSource?.name === 'global') {
                    stats.usingGlobalName++;
                }
                if (product.dataSource?.categoryId === 'global') {
                    stats.usingGlobalCategory++;
                }
                if (product.dataSource?.description === 'global') {
                    stats.usingGlobalDescription++;
                }
                if (!product.globalProductId) {
                    stats.legacy++;
                }
            });
            
            console.log(`Total Products: ${stats.total}`);
            console.log(`With GlobalProductId: ${stats.withGlobalId} (${Math.round(stats.withGlobalId/stats.total*100)}%)`);
            console.log(`Using Global Name: ${stats.usingGlobalName} (${Math.round(stats.usingGlobalName/stats.total*100)}%)`);
            console.log(`Using Global Category: ${stats.usingGlobalCategory} (${Math.round(stats.usingGlobalCategory/stats.total*100)}%)`);
            console.log(`Using Global Description: ${stats.usingGlobalDescription} (${Math.round(stats.usingGlobalDescription/stats.total*100)}%)`);
            console.log(`Legacy Products: ${stats.legacy} (${Math.round(stats.legacy/stats.total*100)}%)`);
            
            // Test 2: Get single product
            if (data.products.length > 0) {
                const testProductId = data.products[0].productId;
                
                console.log('\n📋 Test 2: GET /api/merchants/:merchantId/products/:productId');
                console.log('─'.repeat(60));
                console.log(`Testing with product: ${testProductId}`);
                
                const singleResponse = await fetch(
                    `http://localhost:3000/api/merchants/${merchantId}/products/${testProductId}`,
                    {
                        headers: {
                            'x-debug-mode': 'true'
                        }
                    }
                );
                
                const singleData = await singleResponse.json();
                
                if (singleData.success) {
                    console.log('✅ Single product fetch successful');
                    console.log(`   Name: ${singleData.product.name}`);
                    console.log(`   Price: ${singleData.product.price} ${singleData.product.currency}`);
                    console.log(`   Global Product ID: ${singleData.product.globalProductId || 'None'}`);
                } else {
                    console.error('❌ Failed:', singleData.error);
                }
            }
        }
        
        console.log('\n═'.repeat(60));
        console.log('✅ All tests completed!');
        console.log('\n💡 Next Steps:');
        console.log('   1. Update frontend to use this new endpoint');
        console.log('   2. Products with null values will now show global data');
        console.log('   3. dataSource field shows where each field comes from');
        
    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('\nMake sure:');
        console.error('   1. Local dev server is running (npm start)');
        console.error('   2. AWS credentials are configured');
        console.error('   3. Merchant ID is valid');
    }
}

// Run tests
testMergedProductsEndpoint().catch(console.error);
