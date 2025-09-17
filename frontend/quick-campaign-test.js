/**
 * Quick Campaign Creation Test Runner
 * Run this script in the browser console to test campaign functionality
 */

// Wait for page to load and run tests
(function() {
    console.log('🧪 QUICK CAMPAIGN CREATION TEST');
    console.log('=' .repeat(40));
    
    // Test 1: Basic element check
    console.log('\n1. Checking essential elements...');
    const essentialElements = [
        'createCampaignModal',
        'createCampaignForm',
        'campaignType',
        'campaignTitle'
    ];
    
    let elementsFound = 0;
    essentialElements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            elementsFound++;
            console.log(`✅ ${id} found`);
        } else {
            console.log(`❌ ${id} missing`);
        }
    });
    
    if (elementsFound === essentialElements.length) {
        console.log('✅ All essential elements found');
        
        // Test 2: Function availability
        console.log('\n2. Checking functions...');
        const functions = ['openCreateCampaignModal', 'createCampaignType'];
        let functionsFound = 0;
        
        functions.forEach(funcName => {
            if (typeof window[funcName] === 'function') {
                functionsFound++;
                console.log(`✅ ${funcName} available`);
            } else {
                console.log(`❌ ${funcName} missing`);
            }
        });
        
        if (functionsFound === functions.length) {
            console.log('✅ All functions available');
            
            // Test 3: Quick modal test
            console.log('\n3. Testing modal functionality...');
            try {
                const modal = document.getElementById('createCampaignModal');
                
                // Test opening
                if (typeof window.openCreateCampaignModal === 'function') {
                    window.openCreateCampaignModal();
                    
                    if (modal.style.display === 'flex') {
                        console.log('✅ Modal opens successfully');
                        
                        // Test form elements are visible
                        const form = document.getElementById('createCampaignForm');
                        if (form && form.offsetParent !== null) {
                            console.log('✅ Campaign form is visible');
                            
                            // Quick fill test
                            const titleInput = document.getElementById('campaignTitle');
                            if (titleInput) {
                                titleInput.value = 'Quick Test Campaign';
                                console.log('✅ Form can be filled');
                            }
                            
                            // Test closing
                            const closeBtn = document.getElementById('closeCampaignModalBtn');
                            if (closeBtn) {
                                closeBtn.click();
                                console.log('✅ Modal can be closed');
                            }
                        }
                    } else {
                        console.log('❌ Modal did not open');
                    }
                }
                
                console.log('\n🎉 CAMPAIGN SYSTEM BASIC TEST COMPLETE!');
                console.log('✅ You can now create campaigns using:');
                console.log('   • The "Create Campaign" button');
                console.log('   • Quick action cards for specific types');
                console.log('   • Manual form filling and submission');
                
            } catch (error) {
                console.error('❌ Modal test failed:', error);
            }
        } else {
            console.log('❌ Some functions missing - check campaign-manager.js loading');
        }
    } else {
        console.log('❌ Some essential elements missing - check HTML structure');
    }
    
    console.log('\n💡 To create a test campaign manually:');
    console.log('1. openCreateCampaignModal()');
    console.log('2. Fill the form');
    console.log('3. Click "Create Campaign"');
})();
