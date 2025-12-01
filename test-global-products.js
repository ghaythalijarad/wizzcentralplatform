#!/usr/bin/env node
/**
 * Test GlobalProducts Implementation
 * Tests that products are properly linked to global catalog
 */

const fs = require('fs');
const path = require('path');

// Read sample CSV
const csvPath = path.join(__dirname, 'sample-bulk-upload-template.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

function csvToJson(csv) {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, index) => {
      const value = values[index]?.trim() || '';
      if (value === 'true') obj[header] = true;
      else if (value === 'false') obj[header] = false;
      else if (header === 'price' || header === 'vatRate' || header === 'stockQty') {
        obj[header] = value ? parseFloat(value) : undefined;
      }
      else {
        obj[header] = value || undefined;
      }
    });
    return obj;
  });
}

const items = csvToJson(csvContent);

console.log('✅ Script loaded');
console.log(`✅ Parsed ${items.length} items from CSV`);

async function testGlobalProductsUpload(businessId) {
  const url = `http://localhost:3000/api/merchants/${businessId}/items/bulk`;
  
  console.log('🧪 Testing GlobalProducts Implementation');
  console.log('=========================================\n');
  console.log(`📍 Business ID: ${businessId}`);
  console.log(`📦 Uploading ${items.length} items...\n`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-debug-mode': 'true'
      },
      body: JSON.stringify({ 
        merchantId: businessId,
        items 
      })
    });
    
    const result = await response.json();
    
    console.log('📊 Upload Results:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.summary) {
      console.log('\n✅ Summary:');
      console.log(`   Created: ${result.summary.created}`);
      console.log(`   Updated: ${result.summary.updated}`);
      console.log(`   Skipped: ${result.summary.skipped}`);
      console.log(`   Errors: ${result.summary.errors}`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

async function verifyGlobalProducts(businessId) {
  console.log('\n\n🔍 Verifying GlobalProducts Linkage');
  console.log('=====================================\n');
  
  // Query merchant products to check globalProductId
  const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
  const { DynamoDBDocumentClient, QueryCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');
  
  require('dotenv').config();
  
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1'
  });
  
  const dynamodb = DynamoDBDocumentClient.from(client);
  
  // Get merchant products
  const productsResult = await dynamodb.send(new QueryCommand({
    TableName: 'WhizzMerchants_Products',
    IndexName: 'BusinessIdIndex',
    KeyConditionExpression: 'businessId = :bid',
    ExpressionAttributeValues: { ':bid': businessId },
    Limit: 5
  }));
  
  console.log(`✅ Found ${productsResult.Items.length} merchant products\n`);
  
  for (const product of productsResult.Items) {
    console.log(`📦 Product: ${product.name || '(using global)'}`);
    console.log(`   Product ID: ${product.productId}`);
    console.log(`   Global ID: ${product.globalProductId || 'MISSING!'}`);
    console.log(`   Price: ${product.price} ${product.currency}`);
    
    if (product.globalProductId) {
      // Fetch global product details
      const globalResult = await dynamodb.send(new GetCommand({
        TableName: 'WhizzMerchants_GlobalProducts',
        Key: { globalProductId: product.globalProductId }
      }));
      
      if (globalResult.Item) {
        console.log(`   ✅ Global: ${globalResult.Item.canonicalName}`);
        console.log(`   Usage Count: ${globalResult.Item.usageCount} merchants`);
        console.log(`   SKU: ${globalResult.Item.sku || 'N/A'}`);
      } else {
        console.log(`   ❌ Global product not found!`);
      }
    }
    console.log('');
  }
}

async function main() {
  const businessId = process.argv[2];
  
  if (!businessId) {
    console.log('❌ Please provide a business ID:');
    console.log('   node test-global-products.js <businessId>');
    process.exit(1);
  }
  
  try {
    // Test upload
    await testGlobalProductsUpload(businessId);
    
    // Wait a moment for writes to complete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify global products linkage
    await verifyGlobalProducts(businessId);
    
    console.log('\n✅ GlobalProducts test complete!\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

main();
