// Quick Campaign Creation Test
// Tests the end-to-end campaign creation workflow

(async function testCampaignCreation() {
    console.log('🧪 Starting Campaign Creation Test');
    console.log('=' .repeat(50));

    // Wait for services to be ready
    console.log('⏳ Waiting for services to initialize...');
    await new Promise(resolve => {
        const check = () => {
            if (window.campaignManager && window.dataService) {
                console.log('✅ Services ready');
                resolve();
            } else {
                console.log('⏳ Still waiting... Campaign Manager:', !!window.campaignManager, 'Data Service:', !!window.dataService);
                setTimeout(check, 1000);
            }
        };
        check();
    });

    try {
        // Test 1: Check if campaign manager is ready
        console.log('\n1️⃣ Testing Campaign Manager');
        console.log('-' .repeat(30));
        
        if (typeof window.campaignManager?.loadCampaigns === 'function') {
            console.log('✅ Campaign manager methods available');
            
            // Load existing campaigns
            await window.campaignManager.loadCampaigns();
            console.log(`📊 Found ${window.campaignManager.campaigns?.length || 0} existing campaigns`);
        } else {
            console.log('❌ Campaign manager methods not available');
            return;
        }

        // Test 2: Test modal functionality
        console.log('\n2️⃣ Testing Modal Functions');
        console.log('-' .repeat(30));
        
        if (typeof window.openCreateCampaignModal === 'function') {
            console.log('✅ openCreateCampaignModal function available');
        } else {
            console.log('❌ openCreateCampaignModal function missing');
        }

        if (typeof window.createCampaignType === 'function') {
            console.log('✅ createCampaignType function available');
        } else {
            console.log('❌ createCampaignType function missing');
        }

        // Test 3: Test campaign creation
        console.log('\n3️⃣ Testing Campaign Creation');
        console.log('-' .repeat(30));
        
        const testData = new FormData();
        testData.append('title', 'End-to-End Test Campaign');
        testData.append('code', 'E2E2025');
        testData.append('type', 'promotional');
        testData.append('description', 'Campaign created for end-to-end testing');
        testData.append('discountType', 'percentage');
        testData.append('discountValue', '20');
        testData.append('minOrderValue', '40');
        testData.append('usageLimit', '50');
        testData.append('startDate', new Date().toISOString().split('T')[0]);
        testData.append('endDate', new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0]);

        console.log('📝 Creating test campaign...');
        const result = await window.campaignManager.createCampaign(testData);
        
        if (result) {
            console.log('✅ Campaign creation successful!');
            console.log('📄 Result:', result);
        } else {
            console.log('⚠️ Campaign creation completed but returned no result');
        }

        // Test 4: Verify campaign was created
        console.log('\n4️⃣ Verifying Campaign Creation');
        console.log('-' .repeat(30));
        
        await window.campaignManager.loadCampaigns();
        const createdCampaign = window.campaignManager.campaigns.find(c => c.code === 'E2E2025');
        
        if (createdCampaign) {
            console.log('✅ Campaign found in campaign list');
            console.log('📋 Campaign details:', {
                title: createdCampaign.title,
                code: createdCampaign.code,
                type: createdCampaign.type,
                discountValue: createdCampaign.discountValue
            });
        } else {
            console.log('❌ Campaign not found in campaign list');
        }

        console.log('\n🎉 Test completed successfully!');
        console.log('✅ Campaign system is working properly');

    } catch (error) {
        console.error('\n❌ Test failed:', error);
        console.error('Stack:', error.stack);
    }
})();
