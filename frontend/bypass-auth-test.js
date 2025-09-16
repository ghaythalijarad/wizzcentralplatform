// BYPASS AUTH TEST - Run this in browser console on promotions page
(function() {
    console.log('🔧 BYPASSING AUTH AND TESTING...');
    
    // Force enable debug mode and set fake auth
    sessionStorage.setItem('debugMode', 'true');
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('userEmail', 'test@example.com');
    sessionStorage.setItem('userId', 'test-user-123');
    sessionStorage.setItem('idToken', 'fake-token');
    
    console.log('✅ Auth bypass set');
    
    // Wait for scripts to load
    setTimeout(() => {
        console.log('🔍 Checking dependencies...');
        console.log('dataService:', !!window.dataService);
        console.log('AWSUtils:', !!window.AWSUtils);
        console.log('Auth:', !!window.Auth);
        
        if (!window.dataService) {
            console.log('❌ dataService missing - checking script load');
            return;
        }
        
        // Test data service initialization
        console.log('🔧 Testing data service...');
        window.dataService.initialize().then(() => {
            console.log('✅ Data service initialized');
            
            // Test platform discount creation directly
            const testDiscount = {
                discountId: 'test_bypass_' + Date.now(),
                title: 'Bypass Test',
                description: 'Test with auth bypass',
                type: 'percentage',
                value: 5,
                code: 'BYPASS5',
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0],
                isActive: true,
                discountSource: 'platform'
            };
            
            console.log('📝 Creating test discount...');
            return window.dataService.createPlatformDiscount(testDiscount);
        }).then(result => {
            console.log('🎉 SUCCESS! Platform discount created:', result);
            
            // Now test the UI
            console.log('🧪 Testing UI...');
            const btn = document.getElementById('openAddPromotionModalBtn');
            if (btn) {
                btn.click();
                const modal = document.getElementById('addPromotionModal');
                if (modal && modal.style.display === 'flex') {
                    console.log('✅ Modal opens correctly');
                    
                    // Fill and submit form
                    const fields = {
                        title: 'UI TEST ' + Date.now(),
                        code: 'UI123',
                        type: 'percentage',
                        value: '12',
                        description: 'UI test with auth bypass',
                        startDate: new Date().toISOString().slice(0, 16),
                        endDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0, 16)
                    };
                    
                    for (const [id, value] of Object.entries(fields)) {
                        const field = document.getElementById(id);
                        if (field) field.value = value;
                    }
                    
                    const form = document.getElementById('addPromotionForm');
                    if (form) {
                        console.log('📝 Submitting UI form...');
                        form.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
                        
                        setTimeout(() => {
                            console.log('Final result - Modal closed:', modal.style.display === 'none' ? '✅ YES' : '❌ NO');
                        }, 2000);
                    }
                } else {
                    console.log('❌ Modal failed to open');
                }
            } else {
                console.log('❌ Create button not found');
            }
        }).catch(error => {
            console.log('❌ ERROR:', error);
        });
    }, 1000);
})();
