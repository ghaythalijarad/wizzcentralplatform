// MOCK DATA SERVICE FOR TESTING - Bypass AWS permissions
// Add this script to test promotion creation without AWS

window.mockDataService = {
    async initialize() {
        console.log('🔧 Mock data service initialized');
        return true;
    },
    
    async createPlatformDiscount(discountData) {
        console.log('📝 Mock: Creating platform discount', discountData);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock successful response
        return {
            success: true,
            discountId: discountData.discountId || 'mock_' + Date.now()
        };
    },
    
    async getPlatformDiscounts() {
        console.log('📋 Mock: Getting platform discounts');
        
        // Return mock data
        return [
            {
                discountId: 'mock_1',
                title: 'Mock Platform Discount',
                description: 'Test discount from mock service',
                type: 'percentage',
                value: 15,
                code: 'MOCK15',
                isActive: true,
                discountSource: 'platform'
            }
        ];
    }
};

// Override the real data service with mock for testing
if (sessionStorage.getItem('useMockData') === 'true') {
    window.dataService = window.mockDataService;
    console.log('🧪 Using mock data service for testing');
}
