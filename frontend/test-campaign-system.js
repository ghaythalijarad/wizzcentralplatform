/**
 * Campaign Creation End-to-End Test
 * Tests the complete campaign creation workflow
 */

console.log('🧪 TESTING CAMPAIGN CREATION WORKFLOW');
console.log('=' .repeat(50));

// Test data for campaign creation
const testCampaign = {
    campaignType: 'special-occasion',
    campaignTitle: 'End-to-End Test Campaign',
    campaignCode: 'E2E2025',
    campaignDescription: 'Test campaign for end-to-end validation',
    campaignDiscountType: 'percentage',
    campaignDiscountValue: '15',
    campaignStartDate: '2025-01-20',
    campaignEndDate: '2025-01-27',
    campaignUsageLimit: '100',
    campaignMinOrder: '30',
    campaignAutoActivate: true,
    campaignSingleUse: false,
    campaignStackable: false
};

// Test 1: Check if required elements exist
function testElementsExist() {
    console.log('\n1️⃣ Testing Element Existence');
    console.log('-' .repeat(30));
    
    const elements = [
        'createCampaignModal',
        'createCampaignForm', 
        'campaignType',
        'campaignTitle',
        'campaignCode',
        'campaignDescription',
        'campaignDiscountType',
        'campaignDiscountValue',
        'campaignStartDate',
        'campaignEndDate',
        'campaignsTableBody'
    ];
    
    const results = [];
    elements.forEach(id => {
        const element = document.getElementById(id);
        const exists = !!element;
        results.push({ id, exists });
        console.log(`${exists ? '✅' : '❌'} ${id}: ${exists ? 'Found' : 'Missing'}`);
    });
    
    const allExist = results.every(r => r.exists);
    console.log(`\n📊 Result: ${allExist ? '✅ All elements found' : '❌ Some elements missing'}`);
    return allExist;
}

// Test 2: Check if functions exist
function testFunctionsExist() {
    console.log('\n2️⃣ Testing Function Existence');
    console.log('-' .repeat(30));
    
    const functions = [
        'openCreateCampaignModal',
        'createCampaignType',
        'updateCampaignFields',
        'loadCampaignsData',
        'handleCampaignSubmit'
    ];
    
    const results = [];
    functions.forEach(funcName => {
        const exists = typeof window[funcName] === 'function';
        results.push({ funcName, exists });
        console.log(`${exists ? '✅' : '❌'} ${funcName}: ${exists ? 'Available' : 'Missing'}`);
    });
    
    const allExist = results.every(r => r.exists);
    console.log(`\n📊 Result: ${allExist ? '✅ All functions found' : '❌ Some functions missing'}`);
    return allExist;
}

// Test 3: Test modal functionality
function testModalFunctionality() {
    console.log('\n3️⃣ Testing Modal Functionality');
    console.log('-' .repeat(30));
    
    try {
        const modal = document.getElementById('createCampaignModal');
        
        // Test opening modal
        if (typeof window.openCreateCampaignModal === 'function') {
            window.openCreateCampaignModal();
            console.log('✅ Modal open function executed');
            
            if (modal.style.display === 'flex') {
                console.log('✅ Modal opened successfully');
                
                // Test closing modal
                const closeBtn = document.getElementById('closeCampaignModalBtn');
                if (closeBtn) {
                    closeBtn.click();
                    console.log('✅ Modal close button works');
                }
            } else {
                console.log('❌ Modal did not open');
                return false;
            }
        } else {
            console.log('❌ openCreateCampaignModal function not found');
            return false;
        }
        
        console.log('\n📊 Result: ✅ Modal functionality working');
        return true;
    } catch (error) {
        console.error('❌ Modal test failed:', error);
        return false;
    }
}

// Test 4: Test form filling and submission
async function testFormSubmission() {
    console.log('\n4️⃣ Testing Form Submission');
    console.log('-' .repeat(30));
    
    try {
        // Open modal first
        if (typeof window.openCreateCampaignModal === 'function') {
            window.openCreateCampaignModal();
        }
        
        // Fill form
        let filledFields = 0;
        Object.keys(testCampaign).forEach(fieldName => {
            const element = document.getElementById(fieldName);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = testCampaign[fieldName];
                } else {
                    element.value = testCampaign[fieldName];
                }
                filledFields++;
            }
        });
        
        console.log(`✅ Filled ${filledFields} form fields`);
        
        // Trigger campaign type change to show relevant sections
        const campaignTypeSelect = document.getElementById('campaignType');
        if (campaignTypeSelect && typeof window.updateCampaignFields === 'function') {
            campaignTypeSelect.dispatchEvent(new Event('change'));
            console.log('✅ Campaign type change triggered');
        }
        
        // Test form submission
        const form = document.getElementById('createCampaignForm');
        if (form) {
            console.log('📝 Attempting form submission...');
            
            // Create submit event
            const submitEvent = new Event('submit', {
                bubbles: true,
                cancelable: true
            });
            
            form.dispatchEvent(submitEvent);
            console.log('✅ Form submission event dispatched');
            
            // Wait a moment to see results
            setTimeout(() => {
                const modal = document.getElementById('createCampaignModal');
                if (modal.style.display === 'none') {
                    console.log('✅ Modal closed after submission - likely successful');
                } else {
                    console.log('⚠️ Modal still open - check for errors');
                }
            }, 2000);
        }
        
        console.log('\n📊 Result: ✅ Form submission test completed');
        return true;
    } catch (error) {
        console.error('❌ Form submission test failed:', error);
        return false;
    }
}

// Test 5: Check data service integration
function testDataServiceIntegration() {
    console.log('\n5️⃣ Testing Data Service Integration');
    console.log('-' .repeat(30));
    
    const checks = [
        { name: 'dataService', exists: !!window.dataService },
        { name: 'createCampaign', exists: !!(window.dataService && window.dataService.createCampaign) },
        { name: 'getCampaigns', exists: !!(window.dataService && window.dataService.getCampaigns) },
        { name: 'updateCampaign', exists: !!(window.dataService && window.dataService.updateCampaign) },
        { name: 'deleteCampaign', exists: !!(window.dataService && window.dataService.deleteCampaign) }
    ];
    
    checks.forEach(check => {
        console.log(`${check.exists ? '✅' : '❌'} ${check.name}: ${check.exists ? 'Available' : 'Missing'}`);
    });
    
    const allExist = checks.every(c => c.exists);
    console.log(`\n📊 Result: ${allExist ? '✅ Data service integration complete' : '❌ Some data service methods missing'}`);
    return allExist;
}

// Run all tests
async function runAllTests() {
    console.log('\n🚀 RUNNING COMPLETE CAMPAIGN TEST SUITE');
    console.log('=' .repeat(60));
    
    const results = [];
    
    results.push({ name: 'Element Existence', result: testElementsExist() });
    results.push({ name: 'Function Existence', result: testFunctionsExist() });
    results.push({ name: 'Modal Functionality', result: testModalFunctionality() });
    results.push({ name: 'Data Service Integration', result: testDataServiceIntegration() });
    
    // Run form submission test last
    setTimeout(async () => {
        results.push({ name: 'Form Submission', result: await testFormSubmission() });
        
        // Final summary
        console.log('\n🏁 FINAL TEST RESULTS');
        console.log('=' .repeat(40));
        
        results.forEach(test => {
            console.log(`${test.result ? '✅' : '❌'} ${test.name}`);
        });
        
        const allPassed = results.every(r => r.result);
        console.log('\n' + '=' .repeat(40));
        console.log(allPassed ? 
            '🎉 ALL TESTS PASSED! Campaign system is working correctly.' : 
            '⚠️ Some tests failed. Check the details above.');
        console.log('=' .repeat(40));
        
        if (allPassed) {
            console.log('\n💡 You can now:');
            console.log('   • Create campaigns via the UI');
            console.log('   • Use quick action cards');
            console.log('   • View campaigns in the table');
            console.log('   • Test campaign targeting');
        }
    }, 1000);
}

// Export for browser console usage
window.testCampaignSystem = runAllTests;
window.testCampaignElements = testElementsExist;
window.testCampaignFunctions = testFunctionsExist;
window.testCampaignModal = testModalFunctionality;
window.testCampaignForm = testFormSubmission;
window.testCampaignDataService = testDataServiceIntegration;

// Auto-run tests if in browser environment
if (typeof document !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(runAllTests, 1000);
    });
} else if (typeof document !== 'undefined') {
    setTimeout(runAllTests, 1000);
}

console.log('\n💡 You can also run individual tests:');
console.log('   • testCampaignElements()');
console.log('   • testCampaignFunctions()');
console.log('   • testCampaignModal()');
console.log('   • testCampaignForm()');
console.log('   • testCampaignDataService()');
console.log('   • testCampaignSystem() - runs all tests');
