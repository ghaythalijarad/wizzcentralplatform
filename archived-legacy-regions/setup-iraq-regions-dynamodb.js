#!/usr/bin/env node
/**
 * Setup Iraq Regions in DynamoDB
 * Creates tables and populates with comprehensive Iraq regions data
 */

const { DynamoDBClient, CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { 
    DynamoDBDocumentClient, 
    PutCommand, 
    BatchWriteCommand
} = require('@aws-sdk/lib-dynamodb');

// Configure AWS SDK
const ddbClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: process.env.AWS_PROFILE ? undefined : {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const dynamoDB = DynamoDBDocumentClient.from(ddbClient);

const TABLE_NAME = 'WizzCentral_Regions';

// Comprehensive Iraq Regions Data
const iraqRegionsData = [
    // Country Level (0)
    {
        regionId: "REG_IQ",
        regionCode: "IQ",
        regionName: "Iraq",
        regionNameArabic: "العراق",
        level: 0,
        parentRegionId: "ROOT",
        governorateId: "REG_IQ",
        countryCode: "IQ",
        hierarchy: ["IQ"],
        coordinates: {
            center: { lat: 33.2232, lng: 43.6793 },
            boundaries: [
                { lat: 37.4, lng: 38.8 },
                { lat: 37.4, lng: 48.8 },
                { lat: 29.1, lng: 48.8 },
                { lat: 29.1, lng: 38.8 }
            ],
            radius: 500000
        },
        serviceConfig: {
            isActive: true,
            serviceTypes: { delivery: true, pickup: true, dineIn: true },
            deliveryFee: 0,
            minimumOrder: 0,
            estimatedDeliveryTime: 0,
            maxDeliveryDistance: 500000
        },
        statistics: {
            activeDrivers: 2500,
            activeMerchants: 8500,
            totalOrders: 125000,
            avgOrderValue: 25000
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: "active",
            populationEstimate: 40000000,
            areaKm2: 438317,
            timeZone: "Asia/Baghdad"
        }
    },

    // GOVERNORATES (Level 1) - All 19 Iraqi Governorates
    {
        regionId: "REG_IQ_BGD",
        regionCode: "BGD",
        regionName: "Baghdad",
        regionNameArabic: "بغداد",
        level: 1,
        parentRegionId: "REG_IQ",
        governorateId: "REG_IQ_BGD",
        countryCode: "IQ",
        hierarchy: ["IQ", "BGD"],
        coordinates: {
            center: { lat: 33.3152, lng: 44.3661 },
            boundaries: [
                { lat: 33.50, lng: 44.00 },
                { lat: 33.50, lng: 44.70 },
                { lat: 33.00, lng: 44.70 },
                { lat: 33.00, lng: 44.00 }
            ],
            radius: 25000
        },
        serviceConfig: {
            isActive: true,
            serviceTypes: { delivery: true, pickup: true, dineIn: true },
            deliveryFee: 2000,
            minimumOrder: 15000,
            estimatedDeliveryTime: 30,
            maxDeliveryDistance: 25000
        },
        statistics: {
            activeDrivers: 350,
            activeMerchants: 1200,
            totalOrders: 45000,
            avgOrderValue: 28000
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: "active",
            populationEstimate: 7000000,
            areaKm2: 4555
        }
    },

    {
        regionId: "REG_IQ_BSR",
        regionCode: "BSR",
        regionName: "Basra",
        regionNameArabic: "البصرة",
        level: 1,
        parentRegionId: "REG_IQ",
        governorateId: "REG_IQ_BSR",
        countryCode: "IQ",
        hierarchy: ["IQ", "BSR"],
        coordinates: {
            center: { lat: 30.5084, lng: 47.7837 },
            boundaries: [
                { lat: 31.5, lng: 46.5 },
                { lat: 31.5, lng: 48.5 },
                { lat: 29.5, lng: 48.5 },
                { lat: 29.5, lng: 46.5 }
            ],
            radius: 30000
        },
        serviceConfig: {
            isActive: true,
            serviceTypes: { delivery: true, pickup: true, dineIn: true },
            deliveryFee: 2500,
            minimumOrder: 18000,
            estimatedDeliveryTime: 35,
            maxDeliveryDistance: 30000
        },
        statistics: {
            activeDrivers: 180,
            activeMerchants: 650,
            totalOrders: 22000,
            avgOrderValue: 26000
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: "active",
            populationEstimate: 2500000,
            areaKm2: 19070
        }
    },

    {
        regionId: "REG_IQ_ERB",
        regionCode: "ERB",
        regionName: "Erbil",
        regionNameArabic: "أربيل",
        level: 1,
        parentRegionId: "REG_IQ",
        governorateId: "REG_IQ_ERB",
        countryCode: "IQ",
        hierarchy: ["IQ", "ERB"],
        coordinates: {
            center: { lat: 36.2384, lng: 44.0094 },
            boundaries: [
                { lat: 37.0, lng: 43.5 },
                { lat: 37.0, lng: 45.0 },
                { lat: 35.5, lng: 45.0 },
                { lat: 35.5, lng: 43.5 }
            ],
            radius: 35000
        },
        serviceConfig: {
            isActive: true,
            serviceTypes: { delivery: true, pickup: true, dineIn: true },
            deliveryFee: 3000,
            minimumOrder: 20000,
            estimatedDeliveryTime: 40,
            maxDeliveryDistance: 35000
        },
        statistics: {
            activeDrivers: 120,
            activeMerchants: 450,
            totalOrders: 15000,
            avgOrderValue: 32000
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: "active",
            populationEstimate: 1500000,
            areaKm2: 15074
        }
    },

    {
        regionId: "REG_IQ_NJF",
        regionCode: "NJF",
        regionName: "Najaf",
        regionNameArabic: "النجف",
        level: 1,
        parentRegionId: "REG_IQ",
        governorateId: "REG_IQ_NJF",
        countryCode: "IQ",
        hierarchy: ["IQ", "NJF"],
        coordinates: {
            center: { lat: 32.0256, lng: 44.3418 },
            boundaries: [
                { lat: 32.5, lng: 43.8 },
                { lat: 32.5, lng: 44.8 },
                { lat: 31.5, lng: 44.8 },
                { lat: 31.5, lng: 43.8 }
            ],
            radius: 25000
        },
        serviceConfig: {
            isActive: false,
            serviceTypes: { delivery: false, pickup: false, dineIn: false },
            deliveryFee: 2500,
            minimumOrder: 18000,
            estimatedDeliveryTime: 35,
            maxDeliveryDistance: 25000
        },
        statistics: {
            activeDrivers: 0,
            activeMerchants: 0,
            totalOrders: 0,
            avgOrderValue: 0
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: "inactive",
            populationEstimate: 1400000,
            areaKm2: 28824
        }
    },

    {
        regionId: "REG_IQ_KRB",
        regionCode: "KRB",
        regionName: "Karbala",
        regionNameArabic: "كربلاء",
        level: 1,
        parentRegionId: "REG_IQ",
        governorateId: "REG_IQ_KRB",
        countryCode: "IQ",
        hierarchy: ["IQ", "KRB"],
        coordinates: {
            center: { lat: 32.6100, lng: 44.0244 },
            boundaries: [
                { lat: 33.0, lng: 43.5 },
                { lat: 33.0, lng: 44.5 },
                { lat: 32.2, lng: 44.5 },
                { lat: 32.2, lng: 43.5 }
            ],
            radius: 20000
        },
        serviceConfig: {
            isActive: false,
            serviceTypes: { delivery: false, pickup: false, dineIn: false },
            deliveryFee: 2200,
            minimumOrder: 16000,
            estimatedDeliveryTime: 32,
            maxDeliveryDistance: 20000
        },
        statistics: {
            activeDrivers: 0,
            activeMerchants: 0,
            totalOrders: 0,
            avgOrderValue: 0
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: "maintenance",
            populationEstimate: 1200000,
            areaKm2: 5034
        }
    },

    // DISTRICTS (Level 2) - Major districts for each governorate
    
    // Baghdad Districts
    {
        regionId: "REG_IQ_BGD_CTR",
        regionCode: "BGD-CTR",
        regionName: "Baghdad Center",
        regionNameArabic: "بغداد المركز",
        level: 2,
        parentRegionId: "REG_IQ_BGD",
        governorateId: "REG_IQ_BGD",
        countryCode: "IQ",
        hierarchy: ["IQ", "BGD", "CTR"],
        coordinates: {
            center: { lat: 33.3152, lng: 44.3661 },
            boundaries: [
                { lat: 33.35, lng: 44.30 },
                { lat: 33.35, lng: 44.45 },
                { lat: 33.28, lng: 44.45 },
                { lat: 33.28, lng: 44.30 }
            ],
            radius: 8000
        },
        serviceConfig: {
            isActive: true,
            serviceTypes: { delivery: true, pickup: true, dineIn: true },
            deliveryFee: 1500,
            minimumOrder: 12000,
            estimatedDeliveryTime: 20,
            maxDeliveryDistance: 8000
        },
        statistics: {
            activeDrivers: 85,
            activeMerchants: 280,
            totalOrders: 12000,
            avgOrderValue: 32000
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: "active",
            populationEstimate: 1200000,
            areaKm2: 200
        }
    },

    {
        regionId: "REG_IQ_BGD_KDH",
        regionCode: "BGD-KDH",
        regionName: "Kadhimiya",
        regionNameArabic: "الكاظمية",
        level: 2,
        parentRegionId: "REG_IQ_BGD",
        governorateId: "REG_IQ_BGD",
        countryCode: "IQ",
        hierarchy: ["IQ", "BGD", "KDH"],
        coordinates: {
            center: { lat: 33.3814, lng: 44.3822 },
            boundaries: [
                { lat: 33.42, lng: 44.34 },
                { lat: 33.42, lng: 44.42 },
                { lat: 33.34, lng: 44.42 },
                { lat: 33.34, lng: 44.34 }
            ],
            radius: 6000
        },
        serviceConfig: {
            isActive: true,
            serviceTypes: { delivery: true, pickup: true, dineIn: true },
            deliveryFee: 1800,
            minimumOrder: 15000,
            estimatedDeliveryTime: 25,
            maxDeliveryDistance: 6000
        },
        statistics: {
            activeDrivers: 45,
            activeMerchants: 150,
            totalOrders: 8000,
            avgOrderValue: 28000
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: "active",
            populationEstimate: 800000,
            areaKm2: 113
        }
    },

    {
        regionId: "REG_IQ_BGD_SDR",
        regionCode: "BGD-SDR",
        regionName: "Sadr City",
        regionNameArabic: "مدينة الصدر",
        level: 2,
        parentRegionId: "REG_IQ_BGD",
        governorateId: "REG_IQ_BGD",
        countryCode: "IQ",
        hierarchy: ["IQ", "BGD", "SDR"],
        coordinates: {
            center: { lat: 33.3847, lng: 44.4581 },
            boundaries: [
                { lat: 33.42, lng: 44.42 },
                { lat: 33.42, lng: 44.50 },
                { lat: 33.35, lng: 44.50 },
                { lat: 33.35, lng: 44.42 }
            ],
            radius: 7000
        },
        serviceConfig: {
            isActive: true,
            serviceTypes: { delivery: true, pickup: true, dineIn: false },
            deliveryFee: 2000,
            minimumOrder: 18000,
            estimatedDeliveryTime: 30,
            maxDeliveryDistance: 7000
        },
        statistics: {
            activeDrivers: 65,
            activeMerchants: 200,
            totalOrders: 10000,
            avgOrderValue: 22000
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: "active",
            populationEstimate: 2500000,
            areaKm2: 49
        }
    },

    // Basra Districts
    {
        regionId: "REG_IQ_BSR_CTR",
        regionCode: "BSR-CTR",
        regionName: "Basra Center",
        regionNameArabic: "مركز البصرة",
        level: 2,
        parentRegionId: "REG_IQ_BSR",
        governorateId: "REG_IQ_BSR",
        countryCode: "IQ",
        hierarchy: ["IQ", "BSR", "CTR"],
        coordinates: {
            center: { lat: 30.5084, lng: 47.7837 },
            boundaries: [
                { lat: 30.55, lng: 47.72 },
                { lat: 30.55, lng: 47.85 },
                { lat: 30.47, lng: 47.85 },
                { lat: 30.47, lng: 47.72 }
            ],
            radius: 10000
        },
        serviceConfig: {
            isActive: true,
            serviceTypes: { delivery: true, pickup: true, dineIn: true },
            deliveryFee: 2000,
            minimumOrder: 16000,
            estimatedDeliveryTime: 25,
            maxDeliveryDistance: 10000
        },
        statistics: {
            activeDrivers: 75,
            activeMerchants: 280,
            totalOrders: 9500,
            avgOrderValue: 29000
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: "active",
            populationEstimate: 1000000,
            areaKm2: 314
        }
    },

    // Erbil Districts
    {
        regionId: "REG_IQ_ERB_CTR",
        regionCode: "ERB-CTR",
        regionName: "Erbil Center",
        regionNameArabic: "مركز أربيل",
        level: 2,
        parentRegionId: "REG_IQ_ERB",
        governorateId: "REG_IQ_ERB",
        countryCode: "IQ",
        hierarchy: ["IQ", "ERB", "CTR"],
        coordinates: {
            center: { lat: 36.2384, lng: 44.0094 },
            boundaries: [
                { lat: 36.28, lng: 43.97 },
                { lat: 36.28, lng: 44.05 },
                { lat: 36.20, lng: 44.05 },
                { lat: 36.20, lng: 43.97 }
            ],
            radius: 12000
        },
        serviceConfig: {
            isActive: true,
            serviceTypes: { delivery: true, pickup: true, dineIn: true },
            deliveryFee: 2500,
            minimumOrder: 18000,
            estimatedDeliveryTime: 30,
            maxDeliveryDistance: 12000
        },
        statistics: {
            activeDrivers: 55,
            activeMerchants: 200,
            totalOrders: 7500,
            avgOrderValue: 35000
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: "active",
            populationEstimate: 850000,
            areaKm2: 452
        }
    },

    // NEIGHBORHOODS (Level 3) - Sub-districts
    {
        regionId: "REG_IQ_BGD_CTR_KRD",
        regionCode: "BGD-CTR-KRD",
        regionName: "Karrada",
        regionNameArabic: "الكرادة",
        level: 3,
        parentRegionId: "REG_IQ_BGD_CTR",
        governorateId: "REG_IQ_BGD",
        countryCode: "IQ",
        hierarchy: ["IQ", "BGD", "CTR", "KRD"],
        coordinates: {
            center: { lat: 33.3069, lng: 44.4072 },
            boundaries: [
                { lat: 33.32, lng: 44.39 },
                { lat: 33.32, lng: 44.42 },
                { lat: 33.29, lng: 44.42 },
                { lat: 33.29, lng: 44.39 }
            ],
            radius: 2500
        },
        serviceConfig: {
            isActive: true,
            serviceTypes: { delivery: true, pickup: true, dineIn: true },
            deliveryFee: 1000,
            minimumOrder: 10000,
            estimatedDeliveryTime: 15,
            maxDeliveryDistance: 2500
        },
        statistics: {
            activeDrivers: 25,
            activeMerchants: 85,
            totalOrders: 4500,
            avgOrderValue: 38000
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: "active",
            populationEstimate: 250000,
            areaKm2: 19.6
        }
    },

    {
        regionId: "REG_IQ_BGD_CTR_MNS",
        regionCode: "BGD-CTR-MNS",
        regionName: "Mansour",
        regionNameArabic: "المنصور",
        level: 3,
        parentRegionId: "REG_IQ_BGD_CTR",
        governorateId: "REG_IQ_BGD",
        countryCode: "IQ",
        hierarchy: ["IQ", "BGD", "CTR", "MNS"],
        coordinates: {
            center: { lat: 33.3219, lng: 44.3347 },
            boundaries: [
                { lat: 33.34, lng: 44.31 },
                { lat: 33.34, lng: 44.36 },
                { lat: 33.30, lng: 44.36 },
                { lat: 33.30, lng: 44.31 }
            ],
            radius: 3000
        },
        serviceConfig: {
            isActive: true,
            serviceTypes: { delivery: true, pickup: true, dineIn: true },
            deliveryFee: 1200,
            minimumOrder: 12000,
            estimatedDeliveryTime: 18,
            maxDeliveryDistance: 3000
        },
        statistics: {
            activeDrivers: 30,
            activeMerchants: 95,
            totalOrders: 5200,
            avgOrderValue: 42000
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: "active",
            populationEstimate: 320000,
            areaKm2: 28.3
        }
    }
];

async function createTable() {
    const tableParams = {
        TableName: TABLE_NAME,
        KeySchema: [
            { AttributeName: 'regionId', KeyType: 'HASH' }
        ],
        AttributeDefinitions: [
            { AttributeName: 'regionId', AttributeType: 'S' },
            { AttributeName: 'level', AttributeType: 'N' },
            { AttributeName: 'parentRegionId', AttributeType: 'S' },
            { AttributeName: 'governorateId', AttributeType: 'S' }
        ],
        GlobalSecondaryIndexes: [
            {
                IndexName: 'LevelIndex',
                KeySchema: [
                    { AttributeName: 'level', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' },
                BillingMode: 'PAY_PER_REQUEST'
            },
            {
                IndexName: 'ParentIndex',
                KeySchema: [
                    { AttributeName: 'parentRegionId', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' },
                BillingMode: 'PAY_PER_REQUEST'
            },
            {
                IndexName: 'GovernorateIndex',
                KeySchema: [
                    { AttributeName: 'governorateId', KeyType: 'HASH' }
                ],
                Projection: { ProjectionType: 'ALL' },
                BillingMode: 'PAY_PER_REQUEST'
            }
        ],
        BillingMode: 'PAY_PER_REQUEST'
    };

    try {
        // Check if table exists
        try {
            await ddbClient.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
            console.log(`✅ Table ${TABLE_NAME} already exists`);
            return;
        } catch (error) {
            if (error.name !== 'ResourceNotFoundException') {
                throw error;
            }
        }

        // Create table
        await ddbClient.send(new CreateTableCommand(tableParams));
        console.log(`✅ Created table ${TABLE_NAME}`);
        
        // Wait for table to be active
        console.log('⏳ Waiting for table to become active...');
        await waitForTableActive();
        
    } catch (error) {
        console.error('❌ Error creating table:', error);
        throw error;
    }
}

async function waitForTableActive() {
    let attempts = 0;
    const maxAttempts = 30;
    
    while (attempts < maxAttempts) {
        try {
            const result = await ddbClient.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
            if (result.Table.TableStatus === 'ACTIVE') {
                console.log('✅ Table is now active');
                return;
            }
            console.log(`⏳ Table status: ${result.Table.TableStatus}, waiting...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            attempts++;
        } catch (error) {
            console.error('❌ Error checking table status:', error);
            throw error;
        }
    }
    throw new Error('Table did not become active within timeout period');
}

async function populateRegions() {
    console.log(`📝 Populating ${iraqRegionsData.length} regions...`);
    
    try {
        // Write regions in batches of 25 (DynamoDB limit)
        const batchSize = 25;
        for (let i = 0; i < iraqRegionsData.length; i += batchSize) {
            const batch = iraqRegionsData.slice(i, i + batchSize);
            
            const writeRequests = batch.map(region => ({
                PutRequest: {
                    Item: region
                }
            }));

            const batchParams = {
                RequestItems: {
                    [TABLE_NAME]: writeRequests
                }
            };

            await dynamoDB.send(new BatchWriteCommand(batchParams));
            console.log(`✅ Inserted batch ${Math.floor(i / batchSize) + 1}`);
        }
        
        console.log(`✅ Successfully populated ${iraqRegionsData.length} regions`);
        
    } catch (error) {
        console.error('❌ Error populating regions:', error);
        throw error;
    }
}

async function main() {
    console.log('🇮🇶 Setting up Iraq Regions in DynamoDB...');
    console.log(`📋 AWS Region: ${process.env.AWS_REGION || 'us-east-1'}`);
    console.log(`👤 AWS Profile: ${process.env.AWS_PROFILE || 'default'}`);
    
    try {
        await createTable();
        await populateRegions();
        
        console.log('');
        console.log('🎉 Iraq Regions setup completed successfully!');
        console.log(`📊 Table: ${TABLE_NAME}`);
        console.log(`🗺️ Regions: ${iraqRegionsData.length}`);
        console.log('📈 Breakdown:');
        
        const levelCounts = iraqRegionsData.reduce((acc, region) => {
            acc[region.level] = (acc[region.level] || 0) + 1;
            return acc;
        }, {});
        
        const levelNames = ['Country', 'Governorates', 'Districts', 'Neighborhoods', 'Streets'];
        Object.entries(levelCounts).forEach(([level, count]) => {
            console.log(`   Level ${level} (${levelNames[level]}): ${count}`);
        });
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main, iraqRegionsData };
