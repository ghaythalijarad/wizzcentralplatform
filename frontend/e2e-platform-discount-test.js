// End-to-End Platform Discount Test
// This script tests the complete platform discount workflow

console.log('🧪 Starting E2E Platform Discount Test...');

async function runE2ETest() {
    const testId = `e2e_test_${Date.now()}`;
    const testCode = `TEST${Date.now().toString().slice(-6)}`;
    
    try {
        console.log(`🎯 Test ID: ${testId}`);
        console.log(`💾 Test Code: ${testCode}`);
        
        // Step 1: Initialize debug mode
        console.log('🔧 Step 1: Setting up debug mode...');
        sessionStorage.setItem('debugMode', 'true');
        sessionStorage.setItem('debugForceUnauth', 'true');
        sessionStorage.removeItem('idToken');
        sessionStorage.removeItem('accessToken');
        
        // Step 2: Wait for services
        console.log('⏳ Step 2: Waiting for services...');
        await waitForServices();
        
        // Step 3: Initialize AWS
        console.log('🔄 Step 3: Initializing AWS...');
        await window.AWSUtils.initialize();
        
        // Step 4: Create platform discount
        console.log('🚀 Step 4: Creating platform discount...');
        const discountData = {
            discountId: testId,
            title: `E2E Test Discount ${new Date().toLocaleTimeString()}`,
            name: `E2E Test Discount ${new Date().toLocaleTimeString()}`,
            description: 'Automated test discount for E2E verification',
            type: 'percentage',
            value: 20,
            code: testCode,
            minOrderValue: 100,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            isActive: true,
            usage: 0,
            limit: 50,
            discountSource: 'platform',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            createdBy: 'e2e-test'
        };
        
        const createResult = await window.dataService.createPlatformDiscount(discountData);
        
        if (!createResult.success) {
            throw new Error('Failed to create platform discount');
        }
        
        console.log('✅ Step 4 Complete: Discount created successfully');
        
        // Step 5: Verify creation by loading discounts
        console.log('🔍 Step 5: Verifying discount creation...');
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds for consistency
        
        const allDiscounts = await window.dataService.getPlatformDiscounts();
        const ourDiscount = allDiscounts.find(d => d.discountId === testId);
        
        if (!ourDiscount) {
            throw new Error(`Created discount not found in list (ID: ${testId})`);
        }
        
        console.log('✅ Step 5 Complete: Discount verified in database');
        
        // Step 6: Test promotions page integration
        console.log('📋 Step 6: Testing promotions page integration...');
        
        // This would be tested by the promotions-clean.js logic
        const normalizedDiscount = {
            id: ourDiscount.discountId,
            title: ourDiscount.name || ourDiscount.title || 'Untitled',
            code: ourDiscount.code || 'N/A',
            type: ourDiscount.type,
            value: ourDiscount.value,
            status: ourDiscount.isActive ? 'active' : 'inactive',
            usage: ourDiscount.usage || 0,
            limit: ourDiscount.limit || 0,
            startDate: ourDiscount.startDate || 'N/A',
            endDate: ourDiscount.endDate || 'N/A',
            description: ourDiscount.description || '',
            minOrderValue: ourDiscount.minOrderValue || 0,
            source: 'platform'
        };
        
        console.log('✅ Step 6 Complete: Discount normalized for promotions display');
        
        // Success!
        console.log('🎉 E2E TEST PASSED! All steps completed successfully.');
        console.log('📊 Summary:');
        console.log(`   • Created discount: ${discountData.title}`);
        console.log(`   • Code: ${discountData.code}`);
        console.log(`   • Value: ${discountData.value}% off`);
        console.log(`   • ID: ${testId}`);
        console.log(`   • Min Order: $${discountData.minOrderValue}`);
        console.log(`   • Usage Limit: ${discountData.limit}`);
        console.log(`   • Source: platform`);
        
        return {
            success: true,
            testId,
            discountData: normalizedDiscount
        };
        
    } catch (error) {
        console.error('❌ E2E TEST FAILED:', error.message);
        console.error('🔍 Error details:', error);
        return {
            success: false,
            error: error.message,
            testId
        };
    }
}

async function waitForServices() {
    // Wait for AWS SDK
    if (typeof AWS === 'undefined') {
        throw new Error('AWS SDK not loaded');
    }
    
    // Wait for dataService
    if (!window.dataService) {
        console.log('⏳ Waiting for dataService...');
        await new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 20;
            
            const check = () => {
                attempts++;
                if (window.dataService) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('DataService failed to load'));
                } else {
                    setTimeout(check, 500);
                }
            };
            
            check();
        });
    }
    
    console.log('✅ All services available');
}

// Auto-run test if this script is loaded directly
if (typeof window !== 'undefined') {
    window.runE2ETest = runE2ETest;
    console.log('✅ E2E test function loaded. Call runE2ETest() to start.');
}

// Node.js export (if needed)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { runE2ETest };
}
