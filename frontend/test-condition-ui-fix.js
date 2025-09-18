// Test for Campaign Condition UI Form Submission Bug Fix
// This script tests that clicking condition UI elements doesn't trigger unwanted form submissions

console.log('🧪 Testing Campaign Condition UI Form Submission Fix');
console.log('=' .repeat(60));

// Wait for page to load
setTimeout(() => {
    runConditionUITests();
}, 2000);

async function runConditionUITests() {
    console.log('\n1️⃣ Testing Advanced Conditions Checkbox');
    await testAdvancedConditionsCheckbox();
    
    console.log('\n2️⃣ Testing Condition Selection');
    await testConditionSelection();
    
    console.log('\n3️⃣ Testing Condition Modal Interactions');
    await testConditionModalInteractions();
    
    console.log('\n4️⃣ Testing Proper Form Submission');
    await testProperFormSubmission();
    
    console.log('\n🎉 All tests completed!');
}

async function testAdvancedConditionsCheckbox() {
    console.log('Testing: Advanced conditions checkbox click...');
    
    try {
        // Open campaign modal first
        const createBtn = document.querySelector('[onclick*="openCreateCampaignModal"]');
        if (createBtn) {
            createBtn.click();
            await sleep(500);
            
            const modal = document.getElementById('createCampaignModal');
            if (modal && modal.style.display === 'flex') {
                console.log('✅ Campaign modal opened');
                
                // Test advanced conditions checkbox
                const checkbox = document.getElementById('useAdvancedConditions');
                if (checkbox) {
                    console.log('📋 Testing checkbox interaction...');
                    
                    // Listen for form submission
                    let formSubmitted = false;
                    const form = document.getElementById('createCampaignForm');
                    const submitHandler = (e) => {
                        formSubmitted = true;
                        e.preventDefault();
                        console.log('🚨 Form submission detected!');
                    };
                    
                    form.addEventListener('submit', submitHandler);
                    
                    // Click the checkbox
                    checkbox.click();
                    await sleep(300);
                    
                    // Check if form was submitted
                    if (formSubmitted) {
                        console.log('❌ FAIL: Checkbox click triggered form submission');
                    } else {
                        console.log('✅ PASS: Checkbox click did not trigger form submission');
                    }
                    
                    form.removeEventListener('submit', submitHandler);
                } else {
                    console.log('❌ Advanced conditions checkbox not found');
                }
            } else {
                console.log('❌ Campaign modal failed to open');
            }
        } else {
            console.log('❌ Create campaign button not found');
        }
    } catch (error) {
        console.log('❌ Error testing checkbox:', error);
    }
}

async function testConditionSelection() {
    console.log('Testing: Condition selection interactions...');
    
    try {
        // Ensure advanced conditions are enabled
        const checkbox = document.getElementById('useAdvancedConditions');
        if (checkbox && !checkbox.checked) {
            checkbox.click();
            await sleep(500);
        }
        
        // Look for condition add buttons
        const conditionBtns = document.querySelectorAll('.add-btn');
        if (conditionBtns.length > 0) {
            console.log(`📋 Found ${conditionBtns.length} condition buttons to test`);
            
            let formSubmitted = false;
            const form = document.getElementById('createCampaignForm');
            const submitHandler = (e) => {
                formSubmitted = true;
                e.preventDefault();
                console.log('🚨 Form submission detected from condition button!');
            };
            
            form.addEventListener('submit', submitHandler);
            
            // Test clicking first condition button
            const firstBtn = conditionBtns[0];
            console.log('🖱️ Clicking condition button:', firstBtn.textContent.trim());
            firstBtn.click();
            await sleep(300);
            
            if (formSubmitted) {
                console.log('❌ FAIL: Condition button click triggered form submission');
            } else {
                console.log('✅ PASS: Condition button click did not trigger form submission');
            }
            
            form.removeEventListener('submit', submitHandler);
        } else {
            console.log('⚠️ No condition buttons found - advanced conditions may not be enabled');
        }
    } catch (error) {
        console.log('❌ Error testing condition selection:', error);
    }
}

async function testConditionModalInteractions() {
    console.log('Testing: Condition modal interactions...');
    
    try {
        // Check if condition modal is open
        const modal = document.getElementById('conditionModal');
        if (modal && modal.style.display === 'flex') {
            console.log('📋 Condition modal is open, testing interactions...');
            
            let formSubmitted = false;
            const form = document.getElementById('createCampaignForm');
            const submitHandler = (e) => {
                formSubmitted = true;
                e.preventDefault();
                console.log('🚨 Form submission detected from modal!');
            };
            
            form.addEventListener('submit', submitHandler);
            
            // Test modal close button
            const closeBtn = modal.querySelector('.modal-close');
            if (closeBtn) {
                console.log('🖱️ Testing modal close button...');
                closeBtn.click();
                await sleep(300);
                
                if (formSubmitted) {
                    console.log('❌ FAIL: Modal close button triggered form submission');
                } else {
                    console.log('✅ PASS: Modal close button did not trigger form submission');
                }
            }
            
            form.removeEventListener('submit', submitHandler);
        } else {
            console.log('⚠️ Condition modal not open - test skipped');
        }
    } catch (error) {
        console.log('❌ Error testing modal interactions:', error);
    }
}

async function testProperFormSubmission() {
    console.log('Testing: Proper form submission with submit button...');
    
    try {
        // Fill in minimal required fields
        const campaignType = document.getElementById('campaignType');
        const campaignName = document.getElementById('campaignName');
        const campaignValue = document.getElementById('campaignValue');
        
        if (campaignType && campaignName && campaignValue) {
            campaignType.value = 'loyalty';
            campaignName.value = 'Test Campaign ' + Date.now();
            campaignValue.value = '10';
            
            console.log('📋 Form fields filled, testing submit button...');
            
            let formSubmissionAttempted = false;
            const form = document.getElementById('createCampaignForm');
            const submitHandler = (e) => {
                formSubmissionAttempted = true;
                e.preventDefault(); // Prevent actual submission in test
                console.log('✅ Form submission attempted through proper submit button');
            };
            
            form.addEventListener('submit', submitHandler);
            
            // Click the actual submit button
            const submitBtn = document.getElementById('submitCampaignBtn') || 
                            document.querySelector('button[type="submit"]');
            
            if (submitBtn) {
                console.log('🖱️ Clicking submit button:', submitBtn.textContent.trim());
                submitBtn.click();
                await sleep(300);
                
                if (formSubmissionAttempted) {
                    console.log('✅ PASS: Submit button properly triggered form submission');
                } else {
                    console.log('❌ FAIL: Submit button did not trigger form submission');
                }
            } else {
                console.log('❌ Submit button not found');
            }
            
            form.removeEventListener('submit', submitHandler);
        } else {
            console.log('❌ Required form fields not found');
        }
    } catch (error) {
        console.log('❌ Error testing proper form submission:', error);
    }
    
    // Close the modal after testing
    const modal = document.getElementById('createCampaignModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Auto-run if loaded directly
if (typeof window !== 'undefined') {
    console.log('🚀 Condition UI fix test script loaded');
}
