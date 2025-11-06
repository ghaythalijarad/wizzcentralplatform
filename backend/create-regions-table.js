/**
 * Create DynamoDB Regions Table for WhizzCentral Platform
 * 
 * Table Structure:
 * - Primary Key: regionId (HASH)
 * - Attributes: name, name_ar, level (governorate/district), parent_id, coordinates, is_active, etc.
 * - GSI: LevelIndex (level + createdAt)
 * - GSI: ParentIndex (parent_id + name)
 * - GSI: ActiveIndex (is_active + level)
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { CreateTableCommand, DescribeTableCommand, PutCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ 
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: process.env.AWS_PROFILE ? undefined : {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const dynamoDB = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'WizzCentral_Regions';

const tableDefinition = {
    TableName: TABLE_NAME,
    KeySchema: [
        { AttributeName: 'regionId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
        { AttributeName: 'regionId', AttributeType: 'S' },
        { AttributeName: 'level', AttributeType: 'S' },
        { AttributeName: 'parent_id', AttributeType: 'S' },
        { AttributeName: 'is_active', AttributeType: 'S' },
        { AttributeName: 'createdAt', AttributeType: 'S' },
        { AttributeName: 'name', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
        {
            IndexName: 'LevelIndex',
            KeySchema: [
                { AttributeName: 'level', KeyType: 'HASH' },
                { AttributeName: 'createdAt', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        },
        {
            IndexName: 'ParentIndex',
            KeySchema: [
                { AttributeName: 'parent_id', KeyType: 'HASH' },
                { AttributeName: 'name', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        },
        {
            IndexName: 'ActiveIndex',
            KeySchema: [
                { AttributeName: 'is_active', KeyType: 'HASH' },
                { AttributeName: 'level', KeyType: 'RANGE' }
            ],
            Projection: { ProjectionType: 'ALL' },
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
    },
    StreamSpecification: {
        StreamEnabled: true,
        StreamViewType: 'NEW_AND_OLD_IMAGES'
    },
    SSESpecification: {
        SSEEnabled: true
    },
    Tags: [
        { Key: 'Service', Value: 'WizzCentral' },
        { Key: 'Environment', Value: 'dev' },
        { Key: 'Feature', Value: 'RegionsManagement' }
    ]
};

// Initial Iraqi regions data - ALL 18 GOVERNORATES
const initialRegions = [
    // Iraq Country Level
    {
        regionId: 'iraq',
        name: 'Iraq',
        name_ar: 'العراق',
        level: 'country',
        parent_id: null,
        coordinates: { lat: 33.2232, lng: 43.6793 },
        is_active: 'true',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
            population: 40222493,
            area_km2: 438317,
            capital: 'Baghdad'
        }
    },
    
    // ============================================
    // ALL 18 IRAQI GOVERNORATES (محافظات العراق)
    // ============================================
    
    // 1. BAGHDAD (بغداد)
    {
        regionId: 'baghdad',
        name: 'Baghdad',
        name_ar: 'بغداد',
        level: 'governorate',
        parent_id: 'iraq',
        coordinates: { lat: 33.3152, lng: 44.3661 },
        is_active: 'true',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
            population: 9000000,
            area_km2: 5072,
            capital: 'Baghdad'
        }
    },
    
    // 2. BASRA (البصرة)
    {
        regionId: 'basra',
        name: 'Basra',
        name_ar: 'البصرة',
        level: 'governorate',
        parent_id: 'iraq',
        coordinates: { lat: 30.5085, lng: 47.7835 },
        is_active: 'true',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
            population: 2600000,
            area_km2: 19070,
            capital: 'Basra'
        }
    },
    
    // 3. NAJAF (النجف)
    {
        regionId: 'najaf',
        name: 'Najaf',
        name_ar: 'النجف',
        level: 'governorate',
        parent_id: 'iraq',
        coordinates: { lat: 31.9990, lng: 44.3264 },
        is_active: 'true',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
            population: 1400000,
            area_km2: 28824,
            capital: 'Najaf'
        }
    },
    
    // 4. ERBIL (أربيل / ھەولێر)
    {
        regionId: 'erbil',
        name: 'Erbil',
        name_ar: 'أربيل',
        name_ku: 'ھەولێر',
        level: 'governorate',
        parent_id: 'iraq',
        coordinates: { lat: 36.1911, lng: 44.0094 },
        is_active: 'true',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
            population: 1750000,
            area_km2: 15074,
            capital: 'Erbil'
        }
    },
    
    // 5. MOSUL / NINEVEH (نينوى / الموصل)
    {
        regionId: 'nineveh',
        name: 'Nineveh',
        name_ar: 'نينوى',
        level: 'governorate',
        parent_id: 'iraq',
        coordinates: { lat: 36.3350, lng: 43.1189 },
        is_active: 'true',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
            population: 3700000,
            area_km2: 37323,
            capital: 'Mosul'
        }
    },
    
    // 6. SULAYMANIYAH (السليمانية / سلێمانی)
    {
        regionId: 'sulaymaniyah',
        name: 'Sulaymaniyah',
        name_ar: 'السليمانية',
        name_ku: 'سلێمانی',
        level: 'governorate',
        parent_id: 'iraq',
        coordinates: { lat: 35.5614, lng: 45.4309 },
        is_active: 'true',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
            population: 2000000,
            area_km2: 17023,
            capital: 'Sulaymaniyah'
        }
    },
    
    // 7. KIRKUK (كركوك)
    {
        regionId: 'kirkuk',
        name: 'Kirkuk',
        name_ar: 'كركوك',
        name_ku: 'کەرکووک',
        level: 'governorate',
        parent_id: 'iraq',
        coordinates: { lat: 35.4681, lng: 44.3922 },
        is_active: 'true',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
            population: 1600000,
            area_km2: 9679,
            capital: 'Kirkuk'
        }
    },
    
    // 8. DIYALA (ديالى)
    {
        regionId: 'diyala',
        name: 'Diyala',
        name_ar: 'ديالى',
        level: 'governorate',
        parent_id: 'iraq',
        coordinates: { lat: 33.7500, lng: 45.1667 },
        is_active: 'true',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
            population: 1600000,
            area_km2: 17685,
            capital: 'Baqubah'
        }
    },
    
    // 9. ANBAR (الأنبار)
    {
        regionId: 'anbar',
        name: 'Anbar',
        name_ar: 'الأنبار',
        level: 'governorate',
        parent_id: 'iraq',
        coordinates: { lat: 33.4206, lng: 43.3000 },
        is_active: 'false',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
            population: 1700000,
            area_km2: 138501,
            capital: 'Ramadi'
        }
    },
    
    // 10. KARBALA (كربلاء)
    {
        regionId: 'karbala',
        name: 'Karbala',
        name_ar: 'كربلاء',
        level: 'governorate',
        parent_id: 'iraq',
        coordinates: { lat: 32.6160, lng: 44.0250 },
        is_active: 'true',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
            population: 1200000,
            area_km2: 5034,
            capital: 'Karbala'
        }
    },
    
    // 11. BABIL (بابل)
    {
        regionId: 'babil',
        name: 'Babil',
        name_ar: 'بابل',
        level: 'governorate',
        parent_id: 'iraq',
        coordinates: { lat: 32.4636, lng: 44.5500 },
        is_active: 'true',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
            population: 2000000,
            area_km2: 5119,
            capital: 'Hillah'
        }
    },
    
    // 12. WASIT (واسط)
    {
        regionId: 'wasit',
        name: 'Wasit',
        name_ar: 'واسط',
        level: 'governorate',
        parent_id: 'iraq',
        coordinates: { lat: 32.4903, lng: 45.8250 },
        is_active: 'false',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
            population: 1300000,
            area_km2: 17153,
            capital: 'Kut'
        }
    },
    
    // 13. SALAH AD-DIN (صلاح الدين)
    {
        regionId: 'salah_ad_din',
        name: 'Salah ad-Din',
        name_ar: 'صلاح الدين',
        level: 'governorate',
        parent_id: 'iraq',
        coordinates: { lat: 34.6094, lng: 43.6772 },
        is_active: 'false',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
            population: 1500000,
            area_km2: 24751,
            capital: 'Tikrit'
        }
    },
    
    // 14. DHI QAR (ذي قار)
    {
        regionId: 'dhi_qar',
        name: 'Dhi Qar',
        name_ar: 'ذي قار',
        level: 'governorate',
        parent_id: 'iraq',
        coordinates: { lat: 31.0570, lng: 46.2580 },
        is_active: 'true',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
            population: 2100000,
            area_km2: 12900,
            capital: 'Nasiriyah'
        }
    },
    
    // 15. MAYSAN (ميسان)
    {
        regionId: 'maysan',
        name: 'Maysan',
        name_ar: 'ميسان',
        level: 'governorate',
        parent_id: 'iraq',
        coordinates: { lat: 31.8378, lng: 47.1536 },
        is_active: 'false',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
            population: 1000000,
            area_km2: 16072,
            capital: 'Amarah'
        }
    },
    
    // 16. MUTHANNA (المثنى)
    {
        regionId: 'muthanna',
        name: 'Muthanna',
        name_ar: 'المثنى',
        level: 'governorate',
        parent_id: 'iraq',
        coordinates: { lat: 29.9581, lng: 45.2942 },
        is_active: 'false',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
            population: 780000,
            area_km2: 51023,
            capital: 'Samawah'
        }
    },
    
    // 17. QADISIYYAH (القادسية)
    {
        regionId: 'qadisiyyah',
        name: 'Al-Qadisiyyah',
        name_ar: 'القادسية',
        level: 'governorate',
        parent_id: 'iraq',
        coordinates: { lat: 31.9833, lng: 45.0500 },
        is_active: 'false',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
            population: 1300000,
            area_km2: 8153,
            capital: 'Diwaniyah'
        }
    },
    
    // 18. DOHUK (دهوك / دھۆک)
    {
        regionId: 'dohuk',
        name: 'Dohuk',
        name_ar: 'دهوك',
        name_ku: 'دھۆک',
        level: 'governorate',
        parent_id: 'iraq',
        coordinates: { lat: 36.8675, lng: 42.9533 },
        is_active: 'true',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        metadata: {
            population: 1300000,
            area_km2: 10715,
            capital: 'Dohuk'
        }
    },
    // Districts for Baghdad
    {
        regionId: 'baghdad_karkh',
        name: 'Karkh',
        name_ar: 'الكرخ',
        level: 'district',
        parent_id: 'baghdad',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3406, lng: 44.3399 },
        is_active: 'true',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        regionId: 'baghdad_rusafa',
        name: 'Rusafa',
        name_ar: 'الرصافة',
        level: 'district',
        parent_id: 'baghdad',
        governorate_id: 'baghdad',
        coordinates: { lat: 33.3406, lng: 44.4009 },
        is_active: 'true',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    // Districts for Basra
    {
        regionId: 'basra_center',
        name: 'Basra Center',
        name_ar: 'مركز البصرة',
        level: 'district',
        parent_id: 'basra',
        governorate_id: 'basra',
        coordinates: { lat: 30.5085, lng: 47.7835 },
        is_active: 'true',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        regionId: 'basra_zubair',
        name: 'Zubair',
        name_ar: 'الزبير',
        level: 'district',
        parent_id: 'basra',
        governorate_id: 'basra',
        coordinates: { lat: 30.3858, lng: 47.7056 },
        is_active: 'false',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    // Districts for Najaf
    {
        regionId: 'najaf_center',
        name: 'Najaf Center',
        name_ar: 'مركز النجف',
        level: 'district',
        parent_id: 'najaf',
        governorate_id: 'najaf',
        coordinates: { lat: 31.9990, lng: 44.3264 },
        is_active: 'true',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        regionId: 'najaf_kufa',
        name: 'Kufa',
        name_ar: 'الكوفة',
        level: 'district',
        parent_id: 'najaf',
        governorate_id: 'najaf',
        coordinates: { lat: 32.0283, lng: 44.4014 },
        is_active: 'true',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

async function createTable() {
    try {
        console.log('🗺️  Creating WizzCentral Regions Table...\n');
        
        const forcePopulate = process.argv.includes('--force-populate');
        
        // Check if table already exists
        let tableExists = false;
        try {
            await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
            tableExists = true;
            console.log(`✅ Table ${TABLE_NAME} already exists`);
            
            if (!forcePopulate) {
                console.log('\n💡 To populate data anyway, run with --force-populate flag');
                return;
            } else {
                console.log('\n🔄 --force-populate flag detected, will insert data...');
            }
        } catch (error) {
            if (error.name !== 'ResourceNotFoundException') {
                throw error;
            }
        }
        
        // Create table only if it doesn't exist
        if (!tableExists) {
            console.log(`📋 Creating table: ${TABLE_NAME}`);
            const response = await client.send(new CreateTableCommand(tableDefinition));
            console.log(`✅ Table ${TABLE_NAME} created successfully`);
            console.log(`   ARN: ${response.TableDescription.TableArn}`);
            console.log(`   Status: ${response.TableDescription.TableStatus}`);
            
            // Wait for table to be active
            console.log('\n⏳ Waiting for table to be active...');
            await waitForTable(TABLE_NAME);
            console.log('✅ Table is active');
        }
        
        // Insert initial data (either for new table or forced populate)
        console.log('\n📝 Inserting initial Iraqi regions data...');
        for (const region of initialRegions) {
            try {
                await dynamoDB.send(new PutCommand({
                    TableName: TABLE_NAME,
                    Item: region
                }));
                console.log(`   ✅ Added: ${region.name} (${region.name_ar})`);
            } catch (error) {
                console.error(`   ❌ Failed to add ${region.name}:`, error.message);
            }
        }
        
        console.log('\n' + '='.repeat(60));
        console.log('✅ REGIONS TABLE SETUP COMPLETE');
        console.log('='.repeat(60));
        console.log(`\nTable Name: ${TABLE_NAME}`);
        console.log(`Total Regions Added: ${initialRegions.length}`);
        console.log(`  - Country: 1`);
        console.log(`  - Governorates: 18 (ALL Iraqi Governorates)`);
        console.log(`  - Districts: ${initialRegions.length - 19}`);
        console.log('\nGlobal Secondary Indexes:');
        console.log('  - LevelIndex: Query by level (country/governorate/district)');
        console.log('  - ParentIndex: Query districts by parent governorate');
        console.log('  - ActiveIndex: Query active/inactive regions');
        console.log('\n🌐 Access via API: http://localhost:3000/api/regions');
        console.log('');
        
    } catch (error) {
        console.error('❌ Error creating table:', error);
        throw error;
    }
}

async function waitForTable(tableName, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
        try {
            const response = await client.send(new DescribeTableCommand({ TableName: tableName }));
            if (response.Table.TableStatus === 'ACTIVE') {
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
    throw new Error('Table did not become active within timeout');
}

// Run if executed directly
if (require.main === module) {
    createTable()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { createTable, TABLE_NAME };
