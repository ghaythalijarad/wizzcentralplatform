// MOCK TEST - Run this in browser console to test promotion creation without AWS
(function() {
    console.log('🧪 MOCK DATA SERVICE TEST');
    
    // Enable mock data service
    sessionStorage.setItem('useMockData', 'true');
    sessionStorage.setItem('debugMode', 'true');
    sessionStorage.setItem('isAuthenticated', 'true');
    sessionStorage.setItem('userEmail', 'test@mock.com');
    
    // Load mock data service
    const script = document.createElement('script');
    script.src = '../mock-data-service.js';
    document.head.appendChild(script);
    
    setTimeout(() => {
        console.log('✅ Mock setup complete');
        
        // Check dependencies
        console.log('📋 DEPENDENCY CHECK:');
        console.log('- Auth:', !!window.Auth);
        console.log('- AWSUtils:', !!window.AWSUtils);
        console.log('- dataService:', !!window.dataService);
        console.log('- mockDataService:', !!window.mockDataService);
        
        // Override data service with mock
        if (window.mockDataService) {
            window.dataService = window.mockDataService;
            console.log('🔄 Data service replaced with mock');
        }
        
        // Test the UI workflow
        console.log('🎭 TESTING WITH MOCK DATA...');
        
        const btn = document.getElementById('openAddPromotionModalBtn');
        const modal = document.getElementById('addPromotionModal');
        const form = document.getElementById('addPromotionForm');
        
        if (!btn || !modal || !form) {
            console.log('❌ Missing DOM elements');
            return;
        }
        
        // Open modal
        btn.click();
        
        if (modal.style.display === 'flex') {
            console.log('✅ Modal opened');
            
            // Fill form
            document.getElementById('title').value = 'MOCK TEST ' + Date.now();
            document.getElementById('code').value = 'MOCK123';
            document.getElementById('type').value = 'percentage';
            document.getElementById('value').value = '25';
            document.getElementById('description').value = 'Mock test promotion';
            document.getElementById('startDate').value = new Date().toISOString().slice(0,16);
            document.getElementById('endDate').value = new Date(Date.now()+7*24*60*60*1000).toISOString().slice(0,16);
            
            console.log('✅ Form filled with mock data');
            
            // Submit form
            console.log('📝 SUBMITTING WITH MOCK SERVICE...');
            form.dispatchEvent(new Event('submit', {bubbles: true, cancelable: true}));
            
            // Check result
            setTimeout(() => {
                const success = modal.style.display === 'none';
                console.log('🏁 MOCK TEST RESULT:', success ? '🎉 SUCCESS!' : '❌ FAILED');
                
                if (success) {
                    console.log('✅ Promotion creation workflow is working!');
                    console.log('💡 The issue is AWS permissions, not the code');
                } else {
                    console.log('❌ There may be a code issue to investigate');
                }
            }, 2000);
            
        } else {
            console.log('❌ Modal failed to open');
        }
        
    }, 1000);
    
})();
