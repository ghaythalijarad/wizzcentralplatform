#!/usr/bin/env node
/**
 * Test script to validate complete DynamoDB integration
 * Tests all endpoints and toggle functionality
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testEndpoint(endpoint, description) {
    try {
        console.log(`\n🔄 Testing: ${description}`);
        console.log(`   URL: ${BASE_URL}${endpoint}`);
        
        const response = await fetch(`${BASE_URL}${endpoint}`);
        const data = await response.json();
        
        console.log(`   Status: ${response.status}`);
        console.log(`   Success: ${data.success !== false ? '✅' : '❌'}`);
        console.log(`   Source: ${data.source || 'N/A'}`);
        
        if (data.pagination) {
            console.log(`   Total Records: ${data.pagination.total}`);
        }
        
        if (data.regionsCount !== undefined) {
            console.log(`   Regions Count: ${data.regionsCount}`);
        }
        
        return data;
    } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        return null;
    }
}

async function testToggle(regionId) {
    try {
        console.log(`\n🔄 Testing Toggle: ${regionId}`);
        
        // First get the region to see current status
        const getResponse = await fetch(`${BASE_URL}/api/regions/${regionId}`);
        const getResult = await getResponse.json();
        
        if (!getResult.success) {
            console.log(`   ❌ Region ${regionId} not found`);
            return false;
        }
        
        console.log(`   Current Status: ${getResult.data.is_active}`);
        
        // Now toggle it
        const toggleResponse = await fetch(`${BASE_URL}/api/regions/${regionId}/toggle`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const toggleResult = await toggleResponse.json();
        
        console.log(`   Toggle Status: ${toggleResponse.status}`);
        console.log(`   Toggle Success: ${toggleResult.success ? '✅' : '❌'}`);
        
        if (toggleResult.success) {
            console.log(`   Previous: ${toggleResult.data.previousStatus}`);
            console.log(`   New: ${toggleResult.data.newStatus}`);
        }
        
        return toggleResult.success;
    } catch (error) {
        console.log(`   ❌ Toggle Error: ${error.message}`);
        return false;
    }
}

async function runTests() {
    console.log('🧪 DynamoDB Integration Test Suite');
    console.log('=====================================');
    
    // Test all endpoints
    await testEndpoint('/health', 'Health Check');
    await testEndpoint('/api/regions', 'Get All Regions');
    await testEndpoint('/api/regions/statistics', 'Get Statistics');
    
    // Test specific regions
    const regions = await testEndpoint('/api/regions?limit=5', 'Get First 5 Regions');
    
    if (regions && regions.data && regions.data.length > 0) {
        const firstRegion = regions.data[0];
        console.log(`\n📍 Testing with region: ${firstRegion.id}`);
        
        await testEndpoint(`/api/regions/${firstRegion.id}`, 'Get Individual Region');
        await testToggle(firstRegion.id);
    } else {
        console.log('\n⚠️  No regions found in DynamoDB - testing with sample IDs');
        await testToggle('iraq');
        await testToggle('baghdad');
    }
    
    console.log('\n✅ Test suite complete!');
}

if (require.main === module) {
    runTests().catch(console.error);
}
