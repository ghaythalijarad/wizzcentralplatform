const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

async function verifyTable() {
    try {
        console.log('🔍 Checking AWS DynamoDB WizzCentral_Regions table...\n');
        
        const scanCommand = new ScanCommand({
            TableName: 'WizzCentral_Regions'
        });
        
        const result = await docClient.send(scanCommand);
        
        console.log(`📊 Total items in table: ${result.Count}\n`);
        
        // Group by level
        const levelBreakdown = {};
        const regions = [];
        
        result.Items.forEach(item => {
            const level = item.level;
            levelBreakdown[level] = (levelBreakdown[level] || 0) + 1;
            regions.push({
                name: item.regionName,
                nameAr: item.regionNameArabic,
                level: item.level,
                status: item.metadata?.status || 'unknown'
            });
        });
        
        console.log('📈 Level breakdown:');
        console.log(`   Level 0 (Country): ${levelBreakdown[0] || 0}`);
        console.log(`   Level 1 (Governorates): ${levelBreakdown[1] || 0}`);
        console.log(`   Level 2 (Districts): ${levelBreakdown[2] || 0}`);
        console.log(`   Level 3 (Neighborhoods): ${levelBreakdown[3] || 0}\n`);
        
        console.log('📋 All regions in table:');
        
        // Sort by level then name
        regions.sort((a, b) => {
            if (a.level !== b.level) return a.level - b.level;
            return a.name.localeCompare(b.name);
        });
        
        let currentLevel = -1;
        regions.forEach(region => {
            if (region.level !== currentLevel) {
                currentLevel = region.level;
                const levelName = region.level === 0 ? 'COUNTRY' : 
                                 region.level === 1 ? 'GOVERNORATES' :
                                 region.level === 2 ? 'DISTRICTS' : 'NEIGHBORHOODS';
                console.log(`\n   === ${levelName} ===`);
            }
            const statusIcon = region.status === 'active' ? '✅' : region.status === 'inactive' ? '❌' : '⚠️';
            console.log(`   ${statusIcon} ${region.name} (${region.nameAr})`);
        });
        
        console.log('\n✨ Verification complete!\n');
        
    } catch (error) {
        console.error('❌ Error verifying table:', error.message);
    }
}

verifyTable();
