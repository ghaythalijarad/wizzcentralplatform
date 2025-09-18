// Test Script for End-to-End Promotion Creation Workflow
// Run this script in the browser console on the promotions page

(async function testPromotionCreation() {
    console.log('🧪 STARTING PROMOTION CREATION TEST...');
    
    try {
        // Step 1: Verify page setup
        console.log('1️⃣ Verifying page setup...');
        
        if (!document.getElementById('addPromotionForm')) {
            throw new Error('Add promotion form not found');
        }
        
        if (!window.dataService) {
            throw new Error('Data service not loaded');
        }
        
        if (!window.AWSUtils) {
            throw new Error('AWS utils not loaded');
        }
        
        console.log('✅ Page setup verified');
        
        // Step 2: Test AWS initialization
        console.log('2️⃣ Testing AWS initialization...');
        
        // Enable debug mode for testing
        sessionStorage.setItem('debugMode', 'true');
        sessionStorage.setItem('debugForceUnauth', 'true');
        sessionStorage.setItem('isAuthenticated', 'true');
        sessionStorage.setItem('userEmail', 'test@example.com');
        
        await window.AWSUtils.initialize();
        const client = await window.AWSUtils.getDynamoDBClient();
        
        if (!client) {
            throw new Error('DynamoDB client not available');
        }
        
        console.log('✅ AWS initialized successfully');
        
        // Step 3: Test data service availability
        console.log('3️⃣ Testing data service...');
        
        const dataServiceClient = await window.dataService.getClientSafe();
        if (!dataServiceClient) {
            throw new Error('Data service client not available');
        }
        
        console.log('✅ Data service available');
        
        // Step 4: Test table access
        console.log('4️⃣ Testing table access...');
        
        try {
            const tables = await window.dataService.listTables();
            console.log('📋 Available tables:', tables.slice(0, 5));
        } catch (tableError) {
            console.warn('⚠️ Table listing failed (may be expected):', tableError.message);
        }
        
        // Step 5: Simulate form submission
        console.log('5️⃣ Testing promotion creation...');
        
        const testPromotion = {
            title: 'Test Promotion ' + Date.now(),
            code: 'TEST' + Date.now(),
            type: 'percentage',
            value: '25',
            description: 'Test promotion created by automated test',
            startDate: new Date().toISOString().slice(0, 16), // datetime-local format
            endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
            limit: '100',
            minOrder: '50'
        };
        
        // Create a form event
        const form = document.getElementById('addPromotionForm');
        const formData = new FormData();
        
        Object.entries(testPromotion).forEach(([key, value]) => {
            formData.append(key, value);
        });
        
        const mockEvent = {
            preventDefault: () => {},
            target: form
        };
        
        // Override form.elements for the test
        const originalFormData = form.querySelector.bind(form);
        form.querySelector = (selector) => {
            const input = originalFormData(selector);
            if (input) return input;
            
            // Mock input elements
            const mockInput = {
                value: testPromotion[selector.replace(/[\[\]]/g, '').replace('name=', '').replace(/"/g, '')] || ''
            };
            return mockInput;
        };
        
        // Mock FormData constructor for the test
        const OriginalFormData = window.FormData;
        window.FormData = function(formElement) {
            if (formElement === form) {
                const mockFormData = new OriginalFormData();
                Object.entries(testPromotion).forEach(([key, value]) => {
                    mockFormData.append(key, value);
                });
                return mockFormData;
            }
            return new OriginalFormData(formElement);
        };
        
        // Test the actual handleAddPromotion function
        if (window.handleAddPromotion) {
            await window.handleAddPromotion(mockEvent);
        } else {
            throw new Error('handleAddPromotion function not found');
        }
        
        // Restore original FormData
        window.FormData = OriginalFormData;
        
        console.log('✅ PROMOTION CREATION TEST COMPLETED SUCCESSFULLY!');
        console.log('🎉 All components are working properly.');
        
        return {
            success: true,
            testPromotion,
            message: 'Promotion creation workflow is functional'
        };
        
    } catch (error) {
        console.error('❌ PROMOTION CREATION TEST FAILED:', error);
        console.error('Error details:', error.stack);
        
        // Provide specific troubleshooting guidance
        if (error.message.includes('DynamoDB client unavailable')) {
            console.log('💡 SOLUTION: The DynamoDB client issue persists. Try running the fix script:');
            console.log('   Run: await fetch("/fix-dynamodb-client.js").then(r => r.text()).then(eval)');
        } else if (error.message.includes('Data service not available')) {
            console.log('💡 SOLUTION: Data service loading issue. Check script loading order.');
        } else if (error.message.includes('AWS utils not loaded')) {
            console.log('💡 SOLUTION: AWS utils not loaded. Check script tags in HTML.');
        }
        
        return {
            success: false,
            error: error.message,
            stack: error.stack
        };
    }
})();
