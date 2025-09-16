// SIMPLE PROMOTION TEST - Run this in browser console on promotions page
(function() {
    console.log('🧪 TESTING PROMOTION CREATION NOW...');
    
    // Enable debug mode
    sessionStorage.setItem('debugMode', 'true');
    
    // Step 1: Find and click Create button
    const createBtn = document.getElementById('openAddPromotionModalBtn');
    if (!createBtn) {
        console.log('❌ FAILED: Create button not found');
        return;
    }
    console.log('✅ Found create button');
    
    // Click it
    createBtn.click();
    
    // Step 2: Check if modal opened
    const modal = document.getElementById('addPromotionModal');
    if (!modal || modal.style.display !== 'flex') {
        console.log('❌ FAILED: Modal did not open');
        return;
    }
    console.log('✅ Modal opened');
    
    // Step 3: Fill form with test data
    const fields = {
        'title': 'SCRIPT TEST ' + Date.now(),
        'code': 'SCRIPT123',
        'type': 'percentage',
        'value': '10',
        'description': 'Test from script',
        'startDate': new Date().toISOString().slice(0, 16),
        'endDate': new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0, 16)
    };
    
    let filledCount = 0;
    for (const [id, value] of Object.entries(fields)) {
        const field = document.getElementById(id);
        if (field) {
            field.value = value;
            filledCount++;
        }
    }
    console.log(`✅ Filled ${filledCount} fields`);
    
    // Step 4: Submit form
    const form = document.getElementById('addPromotionForm');
    if (!form) {
        console.log('❌ FAILED: Form not found');
        return;
    }
    
    console.log('📝 SUBMITTING FORM...');
    
    // Create and dispatch submit event
    const submitEvent = new Event('submit', {
        bubbles: true,
        cancelable: true
    });
    
    form.dispatchEvent(submitEvent);
    
    // Step 5: Check result after 3 seconds
    setTimeout(() => {
        const isClosed = modal.style.display === 'none';
        if (isClosed) {
            console.log('🎉 SUCCESS! Modal closed - promotion likely created');
        } else {
            console.log('❌ FAILED: Modal still open - check for errors');
        }
    }, 3000);
    
})();
