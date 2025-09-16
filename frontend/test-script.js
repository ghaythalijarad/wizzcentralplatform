// Quick Test Script for Promotion Creation
// Copy and paste this into the browser console on the promotions page

console.log('🧪 TESTING PROMOTION CREATION...');

// Test 1: Check if Create button exists and works
const createBtn = document.getElementById('openAddPromotionModalBtn');
console.log('Create button:', createBtn ? '✅ Found' : '❌ Missing');

if (createBtn) {
    // Test 2: Click the button to open modal
    createBtn.click();
    const modal = document.getElementById('addPromotionModal');
    console.log('Modal opens:', modal && modal.style.display === 'flex' ? '✅ Yes' : '❌ No');
    
    if (modal && modal.style.display === 'flex') {
        // Test 3: Fill the form with test data
        const testData = {
            title: 'TEST PROMO ' + Date.now(),
            code: 'TEST' + Math.floor(Math.random() * 1000),
            type: 'percentage',
            value: '25',
            description: 'Auto-generated test promotion',
            startDate: new Date().toISOString().slice(0, 16),
            endDate: new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0, 16),
            limit: '50',
            minOrder: '20'
        };
        
        // Fill form fields
        let filled = 0;
        for (const [field, value] of Object.entries(testData)) {
            const element = document.getElementById(field);
            if (element) {
                element.value = value;
                filled++;
            }
        }
        console.log(`Form fields filled: ${filled}/${Object.keys(testData).length}`);
        
        // Test 4: Submit the form
        const form = document.getElementById('addPromotionForm');
        if (form) {
            console.log('📝 Submitting form...');
            
            // Set debug mode
            sessionStorage.setItem('debugMode', 'true');
            
            // Submit form
            const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
            form.dispatchEvent(submitEvent);
            
            // Check result after 3 seconds
            setTimeout(() => {
                const isModalClosed = modal.style.display === 'none';
                console.log('Modal closed after submit:', isModalClosed ? '✅ Yes' : '❌ No');
                
                if (isModalClosed) {
                    console.log('🎉 PROMOTION CREATION TEST PASSED!');
                } else {
                    console.log('❌ Test failed - modal should close after successful creation');
                }
            }, 3000);
            
        } else {
            console.log('❌ Form element not found');
        }
    }
} else {
    console.log('❌ Cannot test - Create button not found');
}

console.log('✅ Test script completed. Check results above.');
