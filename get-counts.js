// Get counts for dashboard stats
// This script will count records in each table and display the results

async function getTableCounts() {
    console.log('🔢 Getting counts from all tables...');
    
    try {
        // Check if AWSUtils is available
        if (!window.AWSUtils) {
            throw new Error('AWSUtils is not available. Please ensure aws-utils.js is loaded.');
        }
        
        // Initialize AWS
        await AWSUtils.initialize();
        const dynamoDB = await AWSUtils.getDynamoDBClient();
        
        const tables = {
            'merchants': 'order-receiver-businesses-dev',
            'orders': 'order-receiver-orders-dev', 
            'drivers': 'wizzcentral-backend-drivers-dev',
            'customers': 'wizzcentral-backend-customers-dev',
            'promotions': 'order-receiver-discounts-dev',
            'tickets': 'wizzcentral-backend-support-tickets-dev'
        };
        
        const counts = {};
        
        for (const [label, tableName] of Object.entries(tables)) {
            try {
                console.log(`📊 Scanning ${tableName}...`);
                const params = {
                    TableName: tableName,
                    Select: 'COUNT'
                };
                
                const result = await dynamoDB.scan(params).promise();
                counts[label] = result.Count;
                console.log(`✅ ${label}: ${result.Count} records`);
            } catch (error) {
                console.error(`❌ Error counting ${label}:`, error.message);
                counts[label] = 'Error';
            }
        }
        
        console.log('\n📈 FINAL COUNTS:');
        console.log('================');
        Object.entries(counts).forEach(([key, value]) => {
            console.log(`${key.toUpperCase()}: ${value}`);
        });
        
        return counts;
        
    } catch (error) {
        console.error('❌ Error getting table counts:', error);
        throw error;
    }
}

// Run the count function
window.getTableCounts = getTableCounts;

console.log('💡 Run getTableCounts() in the console to get all table counts');
