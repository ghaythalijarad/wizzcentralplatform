// Test Authenticated Promotion Creation
// Paste this in browser console AFTER logging in normally (not debug mode)

(async function testAuthenticatedPromotion() {
    console.log('🔑 TESTING AUTHENTICATED PROMOTION CREATION...');
    
    // Check authentication status
    const idToken = sessionStorage.getItem('idToken');
    const accessToken = sessionStorage.getItem('accessToken');
    const isAuth = sessionStorage.getItem('isAuthenticated');
    
    console.log('Auth Status:', {
        hasIdToken: !!idToken,
        hasAccessToken: !!accessToken,
        isAuthenticated: isAuth === 'true',
        debugMode: sessionStorage.getItem('debugMode')
    });
    
    if (!idToken) {
        console.log('❌ No idToken found. Please log in first.');
        console.log('Go to index.html and log in, then come back to promotions.html');
        return;
    }
    
    // Clear debug mode to use authenticated credentials
    sessionStorage.removeItem('debugMode');
    console.log('✅ Debug mode cleared - using authenticated credentials');
    
    try {
        // Re-initialize AWS with authenticated credentials
        console.log('🔧 Initializing AWS with authenticated credentials...');
        window.AWSUtils.reset(); // Clear cached client
        await window.AWSUtils.initialize();
        await window.dataService.initialize();
        console.log('✅ AWS initialized with authenticated credentials');
        
        // Test table access
        console.log('🔍 Testing table access...');
        const tables = await window.dataService.listTables();
        console.log('Available tables:', tables);
        
        // Test discount creation
        console.log('🎯 Testing platform discount creation...');
        const testDiscount = {
            discountId: 'auth_test_' + Date.now(),
            title: 'Authenticated Test Promotion',
            description: 'Created with authenticated credentials',
            type: 'percentage',
            value: 15,
            code: 'AUTH15',
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
            isActive: true,
            discountSource: 'platform'
        };
        
        const result = await window.dataService.createPlatformDiscount(testDiscount);
        console.log('🎉 SUCCESS! Promotion created:', result);
        
        // Refresh the page data
        console.log('🔄 Refreshing promotions table...');
        if (window.loadAllData) {
            await window.loadAllData();
        }
        
        console.log('✅ AUTHENTICATED PROMOTION CREATION SUCCESSFUL!');
        console.log('You should now see the promotion in the table with a Platform badge.');
        
    } catch (error) {
        console.log('❌ FAILED:', error);
        console.log('Error details:', error.stack);
        
        if (error.message.includes('AccessDenied') || error.message.includes('not authorized')) {
            console.log('💡 This is a permissions issue. The write permissions may still be propagating.');
            console.log('Wait 1-2 minutes and try again.');
        }
    }
})();
