// Test script to create a sample promotion and verify the loading process
(async function createTestPromotionAndVerify() {
    console.log('🎯 Creating test promotion and verifying display...');
    
    try {
        // Wait for required services to load
        console.log('⏳ Waiting for services to initialize...');
        
        let attempts = 0;
        while ((!window.dataService || !window.AWSUtils) && attempts < 20) {
            await new Promise(resolve => setTimeout(resolve, 500));
            attempts++;
        }
        
        if (!window.dataService) {
            throw new Error('DataService not available after waiting');
        }
        
        console.log('✅ Services available, initializing...');
        
        // Initialize services
        await window.dataService.initialize();
        console.log('✅ DataService initialized');
        
        // Create a test promotion
        const testPromotion = {
            discountId: 'wizzcentral_test_' + Date.now(),
            title: 'WizzCentral Welcome Promotion',
            name: 'WizzCentral Welcome Promotion',
            description: 'Special discount for new WizzCentral platform users',
            type: 'percentage',
            value: 20,
            code: 'WELCOME20',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            isActive: true,
            usage: 0,
            currentUsage: 0,
            limit: 500,
            usageLimit: 500,
            minOrderValue: 15,
            minOrderAmount: 15,
            discountSource: 'platform',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        console.log('🚀 Creating test promotion:', testPromotion.title);
        
        const result = await window.dataService.createPlatformDiscount(testPromotion);
        
        if (result.success) {
            console.log('✅ Test promotion created successfully!');
            console.log('📊 Promotion details:', {
                id: result.discountId,
                title: testPromotion.title,
                code: testPromotion.code,
                value: testPromotion.value + '%',
                minOrder: '$' + testPromotion.minOrderValue
            });
            
            // Now test the loading process
            console.log('🔄 Testing promotion loading process...');
            
            if (window.loadAllData) {
                await window.loadAllData();
                console.log('✅ loadAllData completed');
            } else if (window.loadPlatformDiscountsData) {
                await window.loadPlatformDiscountsData();
                console.log('✅ loadPlatformDiscountsData completed');
            }
            
            // Check if promotions are now visible
            const promotionsTableBody = document.getElementById('promotionsTableBody');
            if (promotionsTableBody) {
                const hasPromotions = !promotionsTableBody.innerHTML.includes('Loading promotions') && 
                                     !promotionsTableBody.innerHTML.includes('No promotions found');
                
                if (hasPromotions) {
                    console.log('🎉 SUCCESS! Promotions are now visible in the table');
                    console.log('✅ WizzCentral Promotions display issue RESOLVED');
                } else {
                    console.log('⚠️ Promotions created but table still shows loading/empty state');
                    console.log('Table content:', promotionsTableBody.innerHTML.substring(0, 200) + '...');
                }
            }
            
        } else {
            console.error('❌ Failed to create test promotion');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
})();
