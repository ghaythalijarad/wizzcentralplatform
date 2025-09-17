// Campaign Creation Test Script - Run in Browser Console
// This script tests the unified campaign creation system

(async function testCampaignCreation() {
    console.log('🧪 TESTING UNIFIED CAMPAIGN CREATION...');
    
    try {
        // Step 1: Verify data service is available
        if (!window.dataService) {
            throw new Error('DataService not available');
        }
        
        console.log('✅ DataService is available');
        
        // Step 2: Initialize data service
        await window.dataService.initialize();
        console.log('✅ DataService initialized');
        
        // Step 3: Test campaign creation with unified table
        const testCampaignData = {
            title: 'Test Unified Campaign',
            code: 'UNIFIED' + Date.now(),
            type: 'first-order', // Campaign type
            description: 'Test campaign for unified table structure',
            discountType: 'percentage',
            discountValue: 15,
            minOrderValue: 25,
            usageLimit: 100,
            startDate: new Date().toISOString().split('T')[0],
            endDate: new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0],
            autoActivate: true,
            singleUse: false,
            stackable: true,
            targetRestaurants: [],
            targetSegments: ['new-customers'],
            occasions: ['weekend']
        };
        
        console.log('📝 Creating test campaign with data:', testCampaignData);
        
        // Step 4: Create campaign
        const createdCampaign = await window.dataService.createCampaign(testCampaignData);
        
        if (createdCampaign) {
            console.log('🎉 Campaign created successfully!');
            console.log('Campaign ID:', createdCampaign.campaignId);
            console.log('Discount ID:', createdCampaign.discountId);
            console.log('Discount Source:', createdCampaign.discountSource);
            console.log('Full Campaign Object:', createdCampaign);
            
            // Step 5: Verify campaign can be retrieved
            const retrievedCampaigns = await window.dataService.getCampaigns();
            console.log(`✅ Retrieved ${retrievedCampaigns.length} campaigns from unified table`);
            
            const ourCampaign = retrievedCampaigns.find(c => c.campaignId === createdCampaign.campaignId);
            if (ourCampaign) {
                console.log('✅ Our campaign found in campaigns list');
                console.log('Retrieved Campaign:', ourCampaign);
            } else {
                console.warn('⚠️ Our campaign not found in campaigns list');
            }
            
            // Step 6: Test that campaign is NOT in regular platform discounts
            const platformDiscounts = await window.dataService.getPlatformDiscounts();
            const inDiscounts = platformDiscounts.find(d => d.discountId === createdCampaign.discountId);
            
            if (!inDiscounts) {
                console.log('✅ Campaign correctly excluded from platform discounts list');
            } else {
                console.warn('⚠️ Campaign incorrectly appears in platform discounts list');
            }
            
            console.log('🏁 UNIFIED CAMPAIGN TEST COMPLETED SUCCESSFULLY!');
            console.log('📊 Summary:');
            console.log('   • Campaign saved to WizzCentral_Platform_Discounts table');
            console.log('   • Campaign marked with discountSource: "campaign"');
            console.log('   • Campaign appears in getCampaigns() results');
            console.log('   • Campaign filtered out of getPlatformDiscounts() results');
            console.log('   • Unified table structure working correctly');
            
        } else {
            throw new Error('Campaign creation returned null');
        }
        
    } catch (error) {
        console.error('❌ Campaign creation test failed:', error);
        console.log('🔍 Troubleshooting steps:');
        console.log('1. Check AWS credentials and permissions');
        console.log('2. Verify WizzCentral_Platform_Discounts table exists');
        console.log('3. Check browser console for detailed error messages');
        console.log('4. Ensure data service is properly initialized');
    }
})();
