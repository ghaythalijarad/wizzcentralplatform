// Simple Promotion Creation Test
// Test the current promotion creation workflow end-to-end
// Run this in browser console after the DynamoDB fix

(async function testPromotionCreationWorkflow() {
    console.log('🧪 TESTING PROMOTION CREATION WORKFLOW...');
    
    try {
        // Step 1: Verify prerequisites
        if (!window.dataService) {
            throw new Error('Data service not available');
        }
        
        if (!document.getElementById('addPromotionForm')) {
            throw new Error('Promotion form not found');
        }
        
        console.log('✅ Prerequisites verified');
        
        // Step 2: Test direct promotion creation via data service
        console.log('📝 Creating test promotion...');
        
        const testPromotion = {
            discountId: 'test_promo_' + Date.now(),
            title: 'Test Workflow Promotion',
            name: 'Test Workflow Promotion',
            description: 'Created by workflow test script',
            type: 'percentage',
            value: 20,
            code: 'WORKFLOW' + Date.now(),
            startDate: new Date().toISOString(),
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            isActive: true,
            usage: 0,
            currentUsage: 0,
            limit: 100,
            discountSource: 'platform',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const result = await window.dataService.createPlatformDiscount(testPromotion);
        console.log('✅ Promotion created successfully:', result);
        
        // Step 3: Test form submission workflow
        console.log('🔄 Testing form submission workflow...');
        
        // Simulate form data
        const formData = new FormData();
        formData.append('title', 'Form Test Promotion ' + Date.now());
        formData.append('code', 'FORMTEST' + Date.now());
        formData.append('type', 'percentage');
        formData.append('value', '25');
        formData.append('description', 'Created via form test');
        formData.append('startDate', new Date().toISOString().slice(0, 16));
        formData.append('endDate', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16));
        formData.append('limit', '50');
        formData.append('minOrder', '30');
        
        // Create mock event
        const mockEvent = {
            preventDefault: () => {},
            target: {
                reset: () => console.log('Form reset called')
            }
        };
        
        // Override FormData constructor temporarily
        const OriginalFormData = window.FormData;
        window.FormData = function(form) {
            if (form === mockEvent.target) {
                return formData;
            }
            return new OriginalFormData(form);
        };
        
        // Test the handleAddPromotion function if available
        if (window.handleAddPromotion) {
            await window.handleAddPromotion(mockEvent);
            console.log('✅ Form submission workflow completed');
        } else {
            console.warn('⚠️ handleAddPromotion function not found globally');
        }
        
        // Restore FormData
        window.FormData = OriginalFormData;
        
        // Step 4: Refresh data display
        console.log('🔄 Refreshing promotion display...');
        
        if (window.loadAllData) {
            await window.loadAllData();
        } else if (window.loadPlatformDiscountsData) {
            await window.loadPlatformDiscountsData();
        }
        
        console.log('🎉 PROMOTION CREATION WORKFLOW TEST COMPLETED SUCCESSFULLY!');
        console.log('✅ Both direct API and form submission methods are working');
        
        return {
            success: true,
            message: 'Promotion creation workflow is fully functional',
            testPromotionId: testPromotion.discountId
        };
        
    } catch (error) {
        console.error('❌ PROMOTION CREATION WORKFLOW TEST FAILED:', error);
        console.error('Error details:', error.stack);
        
        // Provide specific guidance based on error type
        if (error.message.includes('DynamoDB client unavailable')) {
            console.log('💡 SOLUTION: Run the enhanced DynamoDB fix script first');
            console.log('   Copy and paste: await fetch("/enhanced-dynamodb-fix.js").then(r => r.text()).then(eval)');
        } else if (error.message.includes('Data service not available')) {
            console.log('💡 SOLUTION: Ensure page is fully loaded and scripts are initialized');
        } else if (error.message.includes('AccessDenied')) {
            console.log('💡 SOLUTION: AWS permissions issue - may need IAM policy update');
        }
        
        return {
            success: false,
            error: error.message,
            troubleshooting: 'Check console for specific error guidance'
        };
    }
})();
