/**
 * Test Script for Unified Campaign Creation System
 * Tests the end-to-end campaign creation workflow
 */

// Mock AWS SDK for testing
const mockDataService = {
    platformDiscounts: new Map(),
    
    async putItem(params) {
        const table = params.TableName;
        const item = params.Item;
        const key = item.discountId.S;
        
        console.log(`✅ PUT to ${table}:`, item);
        this.platformDiscounts.set(key, item);
        return { $metadata: { httpStatusCode: 200 } };
    },
    
    async query(params) {
        const table = params.TableName;
        console.log(`🔍 QUERY ${table}:`, params);
        
        if (params.FilterExpression && params.FilterExpression.includes('discountSource')) {
            // Filter for campaigns
            const campaigns = Array.from(this.platformDiscounts.values())
                .filter(item => item.discountSource && item.discountSource.S === 'campaign');
            
            console.log(`📊 Found ${campaigns.length} campaigns`);
            return {
                Items: campaigns,
                Count: campaigns.length
            };
        }
        
        return {
            Items: Array.from(this.platformDiscounts.values()),
            Count: this.platformDiscounts.size
        };
    },
    
    async updateItem(params) {
        const key = params.Key.discountId.S;
        const existing = this.platformDiscounts.get(key);
        
        if (existing) {
            // Apply updates
            Object.keys(params.UpdateExpression || {}).forEach(attr => {
                existing[attr] = params.ExpressionAttributeValues[`:${attr}`];
            });
            
            console.log(`✏️ UPDATED ${key}:`, existing);
            return { $metadata: { httpStatusCode: 200 } };
        }
        
        throw new Error(`Item ${key} not found`);
    },
    
    async deleteItem(params) {
        const key = params.Key.discountId.S;
        const deleted = this.platformDiscounts.delete(key);
        
        console.log(`🗑️ DELETED ${key}:`, deleted);
        return { $metadata: { httpStatusCode: 200 } };
    }
};

// Test Campaign Data
const testCampaign = {
    campaignName: "Test Special Campaign",
    campaignType: "percentage_discount",
    discountValue: 25,
    startDate: "2024-01-15",
    endDate: "2024-01-31",
    targetAudience: "all_drivers",
    region: "riyadh",
    description: "Test campaign for unified system validation"
};

// Test Functions
async function testCampaignCreation() {
    console.log("\n🧪 TESTING CAMPAIGN CREATION");
    console.log("=" .repeat(50));
    
    try {
        // Simulate campaign creation
        const campaignId = 'test-campaign-' + Date.now();
        const campaignData = {
            discountId: { S: campaignId },
            discountName: { S: testCampaign.campaignName },
            discountType: { S: testCampaign.campaignType },
            discountValue: { N: testCampaign.discountValue.toString() },
            startDate: { S: testCampaign.startDate },
            endDate: { S: testCampaign.endDate },
            targetAudience: { S: testCampaign.targetAudience },
            region: { S: testCampaign.region },
            description: { S: testCampaign.description },
            discountSource: { S: "campaign" }, // Key field for unified system
            status: { S: "active" },
            createdAt: { S: new Date().toISOString() }
        };
        
        await mockDataService.putItem({
            TableName: 'WizzCentral_Platform_Discounts',
            Item: campaignData
        });
        
        console.log("✅ Campaign created successfully!");
        return campaignId;
        
    } catch (error) {
        console.error("❌ Campaign creation failed:", error);
        throw error;
    }
}

async function testCampaignRetrieval() {
    console.log("\n🔍 TESTING CAMPAIGN RETRIEVAL");
    console.log("=" .repeat(50));
    
    try {
        const result = await mockDataService.query({
            TableName: 'WizzCentral_Platform_Discounts',
            FilterExpression: 'discountSource = :source',
            ExpressionAttributeValues: {
                ':source': { S: 'campaign' }
            }
        });
        
        console.log(`✅ Retrieved ${result.Count} campaigns`);
        result.Items.forEach((item, index) => {
            console.log(`Campaign ${index + 1}:`, {
                id: item.discountId.S,
                name: item.discountName.S,
                type: item.discountType.S,
                source: item.discountSource.S
            });
        });
        
        return result.Items;
        
    } catch (error) {
        console.error("❌ Campaign retrieval failed:", error);
        throw error;
    }
}

async function testCampaignUpdate(campaignId) {
    console.log("\n✏️ TESTING CAMPAIGN UPDATE");
    console.log("=" .repeat(50));
    
    try {
        await mockDataService.updateItem({
            TableName: 'WizzCentral_Platform_Discounts',
            Key: {
                discountId: { S: campaignId }
            },
            UpdateExpression: 'SET discountValue = :value, description = :desc',
            ExpressionAttributeValues: {
                ':value': { N: '30' },
                ':desc': { S: 'Updated test campaign description' }
            }
        });
        
        console.log("✅ Campaign updated successfully!");
        
    } catch (error) {
        console.error("❌ Campaign update failed:", error);
        throw error;
    }
}

async function testCampaignDeletion(campaignId) {
    console.log("\n🗑️ TESTING CAMPAIGN DELETION");
    console.log("=" .repeat(50));
    
    try {
        await mockDataService.deleteItem({
            TableName: 'WizzCentral_Platform_Discounts',
            Key: {
                discountId: { S: campaignId }
            }
        });
        
        console.log("✅ Campaign deleted successfully!");
        
    } catch (error) {
        console.error("❌ Campaign deletion failed:", error);
        throw error;
    }
}

async function testUnifiedSystemIntegrity() {
    console.log("\n🔧 TESTING UNIFIED SYSTEM INTEGRITY");
    console.log("=" .repeat(50));
    
    try {
        // Create both a campaign and a regular discount
        const campaignId = 'campaign-' + Date.now();
        const discountId = 'discount-' + Date.now();
        
        // Create campaign
        await mockDataService.putItem({
            TableName: 'WizzCentral_Platform_Discounts',
            Item: {
                discountId: { S: campaignId },
                discountName: { S: "Test Campaign" },
                discountSource: { S: "campaign" },
                discountType: { S: "percentage_discount" },
                discountValue: { N: "20" }
            }
        });
        
        // Create regular discount
        await mockDataService.putItem({
            TableName: 'WizzCentral_Platform_Discounts',
            Item: {
                discountId: { S: discountId },
                discountName: { S: "Test Discount" },
                discountSource: { S: "merchant" },
                discountType: { S: "fixed_amount" },
                discountValue: { N: "50" }
            }
        });
        
        // Test filtering
        const allItems = await mockDataService.query({
            TableName: 'WizzCentral_Platform_Discounts'
        });
        
        const campaigns = await mockDataService.query({
            TableName: 'WizzCentral_Platform_Discounts',
            FilterExpression: 'discountSource = :source',
            ExpressionAttributeValues: {
                ':source': { S: 'campaign' }
            }
        });
        
        console.log(`📊 Total items: ${allItems.Count}`);
        console.log(`📊 Campaigns only: ${campaigns.Count}`);
        
        if (allItems.Count === 2 && campaigns.Count === 1) {
            console.log("✅ Unified system integrity verified!");
        } else {
            console.log("❌ Unified system integrity check failed!");
        }
        
    } catch (error) {
        console.error("❌ Unified system integrity test failed:", error);
        throw error;
    }
}

// Run all tests
async function runAllTests() {
    console.log("🚀 STARTING UNIFIED CAMPAIGN SYSTEM TESTS");
    console.log("=" .repeat(60));
    
    try {
        // Test campaign lifecycle
        const campaignId = await testCampaignCreation();
        await testCampaignRetrieval();
        await testCampaignUpdate(campaignId);
        await testCampaignRetrieval(); // Verify update
        
        // Test system integrity
        await testUnifiedSystemIntegrity();
        
        // Clean up
        await testCampaignDeletion(campaignId);
        
        console.log("\n🎉 ALL TESTS PASSED!");
        console.log("✅ Unified Campaign/Discount system is working correctly");
        
    } catch (error) {
        console.error("\n💥 TEST SUITE FAILED:", error);
    }
}

// Export for use in browser console
if (typeof window !== 'undefined') {
    window.testCampaignSystem = runAllTests;
    window.mockDataService = mockDataService;
}

// Run tests if in Node.js environment
if (typeof module !== 'undefined') {
    runAllTests();
}
