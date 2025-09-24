// Test script to verify dashboard integration
const fetch = require('node-fetch');

async function testDashboardIntegration() {
    try {
        console.log('🧪 Testing dashboard integration...');
        
        // Test 1: Demo endpoint
        console.log('\n1. Testing demo endpoint...');
        const demoResponse = await fetch('http://localhost:3000/dashboard/stats/demo');
        const demoData = await demoResponse.json();
        
        console.log('Demo endpoint response:', {
            success: demoData.success,
            customersCount: demoData.data?.customersCount,
            dataSource: demoData.dataSource
        });
        
        // Test 2: Dashboard HTML
        console.log('\n2. Testing dashboard HTML...');
        const htmlResponse = await fetch('http://localhost:3000/frontend/pages/dashboard.html');
        const htmlText = await htmlResponse.text();
        
        const hasCustomerElements = htmlText.includes('customersCount') && htmlText.includes('Total Customers');
        const hasDataSourceIndicator = htmlText.includes('dataSourceIndicator');
        const hasDashboardJS = htmlText.includes('dashboard.js');
        
        console.log('Dashboard HTML check:', {
            hasCustomerElements,
            hasDataSourceIndicator,
            hasDashboardJS,
            statusCode: htmlResponse.status
        });
        
        // Test 3: JavaScript file
        console.log('\n3. Testing dashboard JavaScript...');
        const jsResponse = await fetch('http://localhost:3000/frontend/dashboard.js');
        const jsText = await jsResponse.text();
        
        const hasLoadDashboardStats = jsText.includes('loadDashboardStats');
        const hasShowDataSourceIndicator = jsText.includes('showDashboardDataSourceIndicator');
        const hasFallbackLogic = jsText.includes('demo endpoint');
        
        console.log('Dashboard JavaScript check:', {
            hasLoadDashboardStats,
            hasShowDataSourceIndicator,
            hasFallbackLogic,
            statusCode: jsResponse.status
        });
        
        // Summary
        console.log('\n✅ Integration test results:');
        console.log(`- Demo endpoint working: ${demoData.success ? '✅' : '❌'}`);
        console.log(`- Customers count in demo: ${demoData.data?.customersCount || 0}`);
        console.log(`- Dashboard HTML served: ${htmlResponse.status === 200 ? '✅' : '❌'}`);
        console.log(`- Dashboard JS served: ${jsResponse.status === 200 ? '✅' : '❌'}`);
        console.log(`- Required elements present: ${hasCustomerElements && hasDataSourceIndicator ? '✅' : '❌'}`);
        console.log(`- Fallback logic implemented: ${hasFallbackLogic ? '✅' : '❌'}`);
        
        if (demoData.success && demoData.data?.customersCount === 3) {
            console.log('\n🎉 SUCCESS: Dashboard should display 3 customers when AWS credentials are unavailable!');
        } else {
            console.log('\n❌ ISSUE: Demo data not returning expected customer count');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testDashboardIntegration();
