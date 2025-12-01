#!/usr/bin/env node
/**
 * Test script for bulk upload functionality
 * Tests the SKU-based matching and deduplication
 */

const fs = require('fs');
const path = require('path');

// Read the sample CSV file
const csvPath = path.join(__dirname, 'sample-bulk-upload-template.csv');
const csvContent = fs.readFileSync(csvPath, 'utf-8');

// Parse CSV to JSON
function csvToJson(csv) {
  const lines = csv.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, index) => {
      const value = values[index]?.trim() || '';
      // Convert boolean strings
      if (value === 'true') obj[header] = true;
      else if (value === 'false') obj[header] = false;
      // Convert numbers
      else if (header === 'price' || header === 'vatRate' || header === 'stockQty') {
        obj[header] = value ? parseFloat(value) : undefined;
      }
      // Keep string values
      else {
        obj[header] = value || undefined;
      }
    });
    return obj;
  });
}

const items = csvToJson(csvContent);

console.log('📋 Parsed CSV Data:');
console.log(JSON.stringify(items, null, 2));
console.log(`\n✅ Total items: ${items.length}`);

// Test the bulk upload endpoint
async function testBulkUpload(businessId) {
  const url = `http://localhost:3000/api/merchants/${businessId}/items/bulk`;
  
  console.log(`\n🚀 Testing bulk upload to: ${url}`);
  console.log(`📦 Uploading ${items.length} items...`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-debug-mode': 'true' // Enable debug mode to bypass auth
      },
      body: JSON.stringify({ 
        merchantId: businessId,
        items 
      })
    });
    
    const result = await response.json();
    
    console.log('\n📊 Upload Results:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.summary) {
      console.log('\n📈 Summary:');
      console.log(`  ✅ Created: ${result.summary.created}`);
      console.log(`  🔄 Updated: ${result.summary.updated}`);
      console.log(`  ❌ Failed: ${result.summary.failed}`);
    }
    
    if (result.errors && result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(err => {
        console.log(`  Row ${err.row}: ${err.error}`);
      });
    }
    
    return result;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    throw error;
  }
}

// Test deduplication by uploading the same items twice
async function testDeduplication(businessId) {
  console.log('\n\n🔄 Testing Deduplication...');
  console.log('================================\n');
  
  // First upload
  console.log('1️⃣ First upload (should create all items):');
  const result1 = await testBulkUpload(businessId);
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Second upload with same data
  console.log('\n\n2️⃣ Second upload (should update via SKU matching):');
  const result2 = await testBulkUpload(businessId);
  
  // Verify that second upload updated instead of creating
  console.log('\n✅ Deduplication Test Results:');
  console.log(`  First upload created: ${result1.summary?.created || 0}`);
  console.log(`  Second upload updated: ${result2.summary?.updated || 0}`);
  
  if (result2.summary?.updated > 0) {
    console.log('  ✅ SKU-based deduplication working correctly!');
  } else {
    console.log('  ⚠️  Warning: No updates detected on second upload');
  }
}

// Main execution
async function main() {
  // You need to provide a valid business ID
  const businessId = process.argv[2];
  
  if (!businessId) {
    console.log('❌ Please provide a business ID as argument:');
    console.log('   node test-bulk-upload.js <businessId>');
    console.log('\n💡 To get a business ID, visit:');
    console.log('   http://localhost:3000/pages/merchants.html');
    process.exit(1);
  }
  
  console.log('🧪 Starting Bulk Upload Tests');
  console.log('================================\n');
  console.log(`📍 Business ID: ${businessId}`);
  
  try {
    await testDeduplication(businessId);
    console.log('\n\n✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Tests failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { csvToJson, testBulkUpload, testDeduplication };
