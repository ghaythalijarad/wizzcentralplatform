// Performance Test Script for Platform Discount Creation
// Run this in browser console to test optimized performance

async function performanceTest() {
    console.log('=== Platform Discount Performance Test ===');
    
    // Test 1: AWS Connection Speed
    console.log('\n1. Testing AWS Connection Speed...');
    const awsStart = performance.now();
    try {
        if (!window.dataService) {
            throw new Error('DataService not available');
        }
        await window.dataService.initialize();
        const awsEnd = performance.now();
        console.log(`✅ AWS Connection: ${(awsEnd - awsStart).toFixed(2)}ms`);
    } catch (error) {
        console.error(`❌ AWS Connection failed:`, error.message);
        return;
    }
    
    // Test 2: Platform Discount Creation Speed
    console.log('\n2. Testing Platform Discount Creation Speed...');
    const createStart = performance.now();
    
    const testDiscount = {
        discountId: 'perf_test_' + Date.now(),
        title: 'Performance Test Discount',
        description: 'Testing optimized creation speed',
        type: 'percentage',
        value: 15,
        minOrderValue: 20,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '2025-12-31',
        isActive: true,
        usage: 0,
        limit: 100,
        discountSource: 'platform'
    };
    
    try {
        const result = await window.dataService.createPlatformDiscount(testDiscount);
        const createEnd = performance.now();
        console.log(`✅ Platform Discount Creation: ${(createEnd - createStart).toFixed(2)}ms`);
        console.log('Created:', result);
    } catch (error) {
        console.error(`❌ Platform Discount Creation failed:`, error.message);
        return;
    }
    
    // Test 3: Platform Discount Loading Speed
    console.log('\n3. Testing Platform Discount Loading Speed...');
    const loadStart = performance.now();
    
    try {
        const discounts = await window.dataService.getPlatformDiscounts();
        const loadEnd = performance.now();
        console.log(`✅ Platform Discount Loading: ${(loadEnd - loadStart).toFixed(2)}ms`);
        console.log(`Loaded ${discounts.length} discounts`);
    } catch (error) {
        console.error(`❌ Platform Discount Loading failed:`, error.message);
    }
    
    console.log('\n=== Performance Test Complete ===');
}

// Auto-run test when script loads
if (typeof window !== 'undefined') {
    console.log('Performance test script loaded. Run performanceTest() to execute.');
    // Uncomment the line below to auto-run the test
    // setTimeout(performanceTest, 2000);
}
