const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'us-east-1' });
const docClient = DynamoDBDocumentClient.from(client);

// All 18 Iraqi Governorates + Districts + Neighborhoods
const allIraqiRegions = [
    // Additional Missing Governorates (to complete all 18)
    {
        regionId: 'REG_IQ_ANB',
        regionName: 'Anbar',
        regionNameArabic: 'الأنبار',
        regionCode: 'ANB',
        countryCode: 'IQ',
        level: 1,
        parentRegionId: 'REG_IQ',
        governorateId: 'REG_IQ_ANB',
        hierarchy: ['IQ', 'ANB'],
        coordinates: {
            radius: 45000,
            boundaries: [
                { lng: 38.8, lat: 34.5 },
                { lng: 43.5, lat: 34.5 },
                { lng: 43.5, lat: 32.0 },
                { lng: 38.8, lat: 32.0 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'inactive',
            populationEstimate: 1561000,
            areaKm2: 138501
        },
        serviceConfig: {
            minimumOrder: 20000,
            deliveryFee: 3500,
            maxDeliveryDistance: 45000,
            isActive: false,
            estimatedDeliveryTime: 90,
            serviceTypes: {
                delivery: false,
                pickup: false,
                dineIn: false
            }
        },
        statistics: {
            totalOrders: 0,
            activeDrivers: 0,
            activeMerchants: 0,
            avgOrderValue: 0
        }
    },
    {
        regionId: 'REG_IQ_BAB',
        regionName: 'Babylon',
        regionNameArabic: 'بابل',
        regionCode: 'BAB',
        countryCode: 'IQ',
        level: 1,
        parentRegionId: 'REG_IQ',
        governorateId: 'REG_IQ_BAB',
        hierarchy: ['IQ', 'BAB'],
        coordinates: {
            radius: 18000,
            boundaries: [
                { lng: 44.0, lat: 33.0 },
                { lng: 45.2, lat: 33.0 },
                { lng: 45.2, lat: 32.0 },
                { lng: 44.0, lat: 32.0 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            populationEstimate: 2065000,
            areaKm2: 5119
        },
        serviceConfig: {
            minimumOrder: 16000,
            deliveryFee: 2400,
            maxDeliveryDistance: 18000,
            isActive: true,
            estimatedDeliveryTime: 40,
            serviceTypes: {
                delivery: true,
                pickup: true,
                dineIn: true
            }
        },
        statistics: {
            totalOrders: 9800,
            activeDrivers: 75,
            activeMerchants: 320,
            avgOrderValue: 26500
        }
    },
    {
        regionId: 'REG_IQ_DYL',
        regionName: 'Diyala',
        regionNameArabic: 'ديالى',
        regionCode: 'DYL',
        countryCode: 'IQ',
        level: 1,
        parentRegionId: 'REG_IQ',
        governorateId: 'REG_IQ_DYL',
        hierarchy: ['IQ', 'DYL'],
        coordinates: {
            radius: 28000,
            boundaries: [
                { lng: 44.5, lat: 34.5 },
                { lng: 46.0, lat: 34.5 },
                { lng: 46.0, lat: 32.8 },
                { lng: 44.5, lat: 32.8 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'maintenance',
            populationEstimate: 1443000,
            areaKm2: 17685
        },
        serviceConfig: {
            minimumOrder: 17500,
            deliveryFee: 2900,
            maxDeliveryDistance: 28000,
            isActive: false,
            estimatedDeliveryTime: 65,
            serviceTypes: {
                delivery: false,
                pickup: false,
                dineIn: false
            }
        },
        statistics: {
            totalOrders: 0,
            activeDrivers: 0,
            activeMerchants: 0,
            avgOrderValue: 0
        }
    },
    {
        regionId: 'REG_IQ_SUL',
        regionName: 'Sulaymaniyah',
        regionNameArabic: 'السليمانية',
        regionCode: 'SUL',
        countryCode: 'IQ',
        level: 1,
        parentRegionId: 'REG_IQ',
        governorateId: 'REG_IQ_SUL',
        hierarchy: ['IQ', 'SUL'],
        coordinates: {
            radius: 25000,
            boundaries: [
                { lng: 44.5, lat: 36.5 },
                { lng: 46.5, lat: 36.5 },
                { lng: 46.5, lat: 34.8 },
                { lng: 44.5, lat: 34.8 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            populationEstimate: 1200000,
            areaKm2: 17023
        },
        serviceConfig: {
            minimumOrder: 19000,
            deliveryFee: 2700,
            maxDeliveryDistance: 25000,
            isActive: true,
            estimatedDeliveryTime: 50,
            serviceTypes: {
                delivery: true,
                pickup: true,
                dineIn: true
            }
        },
        statistics: {
            totalOrders: 7200,
            activeDrivers: 55,
            activeMerchants: 210,
            avgOrderValue: 30000
        }
    },
    {
        regionId: 'REG_IQ_DOH',
        regionName: 'Dohuk',
        regionNameArabic: 'دهوك',
        regionCode: 'DOH',
        countryCode: 'IQ',
        level: 1,
        parentRegionId: 'REG_IQ',
        governorateId: 'REG_IQ_DOH',
        hierarchy: ['IQ', 'DOH'],
        coordinates: {
            radius: 22000,
            boundaries: [
                { lng: 42.5, lat: 37.5 },
                { lng: 44.0, lat: 37.5 },
                { lng: 44.0, lat: 36.5 },
                { lng: 42.5, lat: 36.5 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            populationEstimate: 750000,
            areaKm2: 6553
        },
        serviceConfig: {
            minimumOrder: 18000,
            deliveryFee: 2600,
            maxDeliveryDistance: 22000,
            isActive: true,
            estimatedDeliveryTime: 45,
            serviceTypes: {
                delivery: true,
                pickup: true,
                dineIn: true
            }
        },
        statistics: {
            totalOrders: 4200,
            activeDrivers: 32,
            activeMerchants: 125,
            avgOrderValue: 28000
        }
    },
    {
        regionId: 'REG_IQ_WAS',
        regionName: 'Wasit',
        regionNameArabic: 'واسط',
        regionCode: 'WAS',
        countryCode: 'IQ',
        level: 1,
        parentRegionId: 'REG_IQ',
        governorateId: 'REG_IQ_WAS',
        hierarchy: ['IQ', 'WAS'],
        coordinates: {
            radius: 24000,
            boundaries: [
                { lng: 45.2, lat: 33.5 },
                { lng: 47.0, lat: 33.5 },
                { lng: 47.0, lat: 31.8 },
                { lng: 45.2, lat: 31.8 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            populationEstimate: 1220000,
            areaKm2: 17153
        },
        serviceConfig: {
            minimumOrder: 17000,
            deliveryFee: 2650,
            maxDeliveryDistance: 24000,
            isActive: true,
            estimatedDeliveryTime: 55,
            serviceTypes: {
                delivery: true,
                pickup: true,
                dineIn: true
            }
        },
        statistics: {
            totalOrders: 5800,
            activeDrivers: 42,
            activeMerchants: 165,
            avgOrderValue: 25000
        }
    },
    {
        regionId: 'REG_IQ_MAY',
        regionName: 'Maysan',
        regionNameArabic: 'ميسان',
        regionCode: 'MAY',
        countryCode: 'IQ',
        level: 1,
        parentRegionId: 'REG_IQ',
        governorateId: 'REG_IQ_MAY',
        hierarchy: ['IQ', 'MAY'],
        coordinates: {
            radius: 26000,
            boundaries: [
                { lng: 46.5, lat: 32.8 },
                { lng: 48.0, lat: 32.8 },
                { lng: 48.0, lat: 31.0 },
                { lng: 46.5, lat: 31.0 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            populationEstimate: 971000,
            areaKm2: 16072
        },
        serviceConfig: {
            minimumOrder: 17500,
            deliveryFee: 2700,
            maxDeliveryDistance: 26000,
            isActive: true,
            estimatedDeliveryTime: 60,
            serviceTypes: {
                delivery: true,
                pickup: true,
                dineIn: true
            }
        },
        statistics: {
            totalOrders: 4600,
            activeDrivers: 35,
            activeMerchants: 140,
            avgOrderValue: 24500
        }
    },
    {
        regionId: 'REG_IQ_DHI',
        regionName: 'Dhi Qar',
        regionNameArabic: 'ذي قار',
        regionCode: 'DHI',
        countryCode: 'IQ',
        level: 1,
        parentRegionId: 'REG_IQ',
        governorateId: 'REG_IQ_DHI',
        hierarchy: ['IQ', 'DHI'],
        coordinates: {
            radius: 28000,
            boundaries: [
                { lng: 45.8, lat: 32.0 },
                { lng: 47.5, lat: 32.0 },
                { lng: 47.5, lat: 30.2 },
                { lng: 45.8, lat: 30.2 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            populationEstimate: 1836000,
            areaKm2: 12900
        },
        serviceConfig: {
            minimumOrder: 16500,
            deliveryFee: 2550,
            maxDeliveryDistance: 28000,
            isActive: true,
            estimatedDeliveryTime: 50,
            serviceTypes: {
                delivery: true,
                pickup: true,
                dineIn: true
            }
        },
        statistics: {
            totalOrders: 8200,
            activeDrivers: 62,
            activeMerchants: 245,
            avgOrderValue: 23500
        }
    },
    {
        regionId: 'REG_IQ_MUT',
        regionName: 'Muthanna',
        regionNameArabic: 'المثنى',
        regionCode: 'MUT',
        countryCode: 'IQ',
        level: 1,
        parentRegionId: 'REG_IQ',
        governorateId: 'REG_IQ_MUT',
        hierarchy: ['IQ', 'MUT'],
        coordinates: {
            radius: 35000,
            boundaries: [
                { lng: 44.0, lat: 32.0 },
                { lng: 46.5, lat: 32.0 },
                { lng: 46.5, lat: 29.5 },
                { lng: 44.0, lat: 29.5 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'maintenance',
            populationEstimate: 719000,
            areaKm2: 51740
        },
        serviceConfig: {
            minimumOrder: 20000,
            deliveryFee: 3000,
            maxDeliveryDistance: 35000,
            isActive: false,
            estimatedDeliveryTime: 80,
            serviceTypes: {
                delivery: false,
                pickup: false,
                dineIn: false
            }
        },
        statistics: {
            totalOrders: 0,
            activeDrivers: 0,
            activeMerchants: 0,
            avgOrderValue: 0
        }
    },
    {
        regionId: 'REG_IQ_QAD',
        regionName: 'Qadisiyyah',
        regionNameArabic: 'القادسية',
        regionCode: 'QAD',
        countryCode: 'IQ',
        level: 1,
        parentRegionId: 'REG_IQ',
        governorateId: 'REG_IQ_QAD',
        hierarchy: ['IQ', 'QAD'],
        coordinates: {
            radius: 22000,
            boundaries: [
                { lng: 44.5, lat: 32.5 },
                { lng: 46.0, lat: 32.5 },
                { lng: 46.0, lat: 31.0 },
                { lng: 44.5, lat: 31.0 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            populationEstimate: 1134000,
            areaKm2: 8153
        },
        serviceConfig: {
            minimumOrder: 16000,
            deliveryFee: 2400,
            maxDeliveryDistance: 22000,
            isActive: true,
            estimatedDeliveryTime: 45,
            serviceTypes: {
                delivery: true,
                pickup: true,
                dineIn: true
            }
        },
        statistics: {
            totalOrders: 5400,
            activeDrivers: 40,
            activeMerchants: 155,
            avgOrderValue: 25500
        }
    },
    {
        regionId: 'REG_IQ_SAL',
        regionName: 'Saladin',
        regionNameArabic: 'صلاح الدين',
        regionCode: 'SAL',
        countryCode: 'IQ',
        level: 1,
        parentRegionId: 'REG_IQ',
        governorateId: 'REG_IQ_SAL',
        hierarchy: ['IQ', 'SAL'],
        coordinates: {
            radius: 30000,
            boundaries: [
                { lng: 43.0, lat: 35.5 },
                { lng: 45.0, lat: 35.5 },
                { lng: 45.0, lat: 33.8 },
                { lng: 43.0, lat: 33.8 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'inactive',
            populationEstimate: 1408000,
            areaKm2: 24751
        },
        serviceConfig: {
            minimumOrder: 19000,
            deliveryFee: 3200,
            maxDeliveryDistance: 30000,
            isActive: false,
            estimatedDeliveryTime: 75,
            serviceTypes: {
                delivery: false,
                pickup: false,
                dineIn: false
            }
        },
        statistics: {
            totalOrders: 0,
            activeDrivers: 0,
            activeMerchants: 0,
            avgOrderValue: 0
        }
    },
    // Baghdad Districts
    {
        regionId: 'REG_IQ_BGD_KRK',
        regionName: 'Al-Karkh',
        regionNameArabic: 'الكرخ',
        regionCode: 'BGD-KRK',
        countryCode: 'IQ',
        level: 2,
        parentRegionId: 'REG_IQ_BGD',
        governorateId: 'REG_IQ_BGD',
        hierarchy: ['IQ', 'BGD', 'KRK'],
        coordinates: {
            radius: 12000,
            boundaries: [
                { lng: 44.25, lat: 33.35 },
                { lng: 44.38, lat: 33.35 },
                { lng: 44.38, lat: 33.25 },
                { lng: 44.25, lat: 33.25 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            populationEstimate: 1500000,
            areaKm2: 180
        },
        serviceConfig: {
            minimumOrder: 14000,
            deliveryFee: 1700,
            maxDeliveryDistance: 12000,
            isActive: true,
            estimatedDeliveryTime: 35,
            serviceTypes: {
                delivery: true,
                pickup: true,
                dineIn: true
            }
        },
        statistics: {
            totalOrders: 18000,
            activeDrivers: 120,
            activeMerchants: 380,
            avgOrderValue: 30000
        }
    },
    {
        regionId: 'REG_IQ_BGD_RSF',
        regionName: 'Al-Rusafa',
        regionNameArabic: 'الرصافة',
        regionCode: 'BGD-RSF',
        countryCode: 'IQ',
        level: 2,
        parentRegionId: 'REG_IQ_BGD',
        governorateId: 'REG_IQ_BGD',
        hierarchy: ['IQ', 'BGD', 'RSF'],
        coordinates: {
            radius: 12000,
            boundaries: [
                { lng: 44.38, lat: 33.35 },
                { lng: 44.52, lat: 33.35 },
                { lng: 44.52, lat: 33.25 },
                { lng: 44.38, lat: 33.25 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            populationEstimate: 1800000,
            areaKm2: 200
        },
        serviceConfig: {
            minimumOrder: 14000,
            deliveryFee: 1700,
            maxDeliveryDistance: 12000,
            isActive: true,
            estimatedDeliveryTime: 35,
            serviceTypes: {
                delivery: true,
                pickup: true,
                dineIn: true
            }
        },
        statistics: {
            totalOrders: 22000,
            activeDrivers: 140,
            activeMerchants: 420,
            avgOrderValue: 29000
        }
    },
    // Neighborhoods
    {
        regionId: 'REG_IQ_BGD_KRK_MNS',
        regionName: 'Al-Mansour',
        regionNameArabic: 'المنصور',
        regionCode: 'BGD-KRK-MNS',
        countryCode: 'IQ',
        level: 3,
        parentRegionId: 'REG_IQ_BGD_KRK',
        governorateId: 'REG_IQ_BGD',
        hierarchy: ['IQ', 'BGD', 'KRK', 'MNS'],
        coordinates: {
            radius: 3000,
            boundaries: [
                { lng: 44.28, lat: 33.32 },
                { lng: 44.32, lat: 33.32 },
                { lng: 44.32, lat: 33.28 },
                { lng: 44.28, lat: 33.28 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            populationEstimate: 320000,
            areaKm2: 28.3
        },
        serviceConfig: {
            minimumOrder: 12000,
            deliveryFee: 1200,
            maxDeliveryDistance: 3000,
            isActive: true,
            estimatedDeliveryTime: 25,
            serviceTypes: {
                delivery: true,
                pickup: true,
                dineIn: true
            }
        },
        statistics: {
            totalOrders: 5200,
            activeDrivers: 30,
            activeMerchants: 95,
            avgOrderValue: 42000
        }
    },
    {
        regionId: 'REG_IQ_BGD_KRK_BAY',
        regionName: 'Al-Bayaa',
        regionNameArabic: 'البياع',
        regionCode: 'BGD-KRK-BAY',
        countryCode: 'IQ',
        level: 3,
        parentRegionId: 'REG_IQ_BGD_KRK',
        governorateId: 'REG_IQ_BGD',
        hierarchy: ['IQ', 'BGD', 'KRK', 'BAY'],
        coordinates: {
            radius: 3000,
            boundaries: [
                { lng: 44.26, lat: 33.29 },
                { lng: 44.31, lat: 33.29 },
                { lng: 44.31, lat: 33.25 },
                { lng: 44.26, lat: 33.25 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            populationEstimate: 220000,
            areaKm2: 18.5
        },
        serviceConfig: {
            minimumOrder: 11000,
            deliveryFee: 1200,
            maxDeliveryDistance: 3000,
            isActive: true,
            estimatedDeliveryTime: 25,
            serviceTypes: {
                delivery: true,
                pickup: true,
                dineIn: true
            }
        },
        statistics: {
            totalOrders: 4100,
            activeDrivers: 22,
            activeMerchants: 75,
            avgOrderValue: 32000
        }
    },
    {
        regionId: 'REG_IQ_BGD_RSF_KRD',
        regionName: 'Al-Karrada',
        regionNameArabic: 'الكرادة',
        regionCode: 'BGD-RSF-KRD',
        countryCode: 'IQ',
        level: 3,
        parentRegionId: 'REG_IQ_BGD_RSF',
        governorateId: 'REG_IQ_BGD',
        hierarchy: ['IQ', 'BGD', 'RSF', 'KRD'],
        coordinates: {
            radius: 2500,
            boundaries: [
                { lng: 44.39, lat: 33.32 },
                { lng: 44.42, lat: 33.32 },
                { lng: 44.42, lat: 33.29 },
                { lng: 44.39, lat: 33.29 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            populationEstimate: 250000,
            areaKm2: 19.6
        },
        serviceConfig: {
            minimumOrder: 10000,
            deliveryFee: 1000,
            maxDeliveryDistance: 2500,
            isActive: true,
            estimatedDeliveryTime: 20,
            serviceTypes: {
                delivery: true,
                pickup: true,
                dineIn: true
            }
        },
        statistics: {
            totalOrders: 4500,
            activeDrivers: 25,
            activeMerchants: 85,
            avgOrderValue: 38000
        }
    }
];

async function populateAWS() {
    console.log('🚀 Adding comprehensive Iraqi regions to AWS DynamoDB...');
    console.log(`📊 Total additional regions: ${allIraqiRegions.length}`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < allIraqiRegions.length; i++) {
        const region = allIraqiRegions[i];
        try {
            console.log(`[${i + 1}/${allIraqiRegions.length}] Adding ${region.regionName}...`);
            
            const command = new PutCommand({
                TableName: 'WizzCentral_Regions',
                Item: region
            });
            
            await docClient.send(command);
            console.log(`✅ Added: ${region.regionName} (${region.regionNameArabic})`);
            successCount++;
            
            // Delay to avoid overwhelming DynamoDB
            await new Promise(resolve => setTimeout(resolve, 300));
            
        } catch (error) {
            console.error(`❌ Failed to add ${region.regionName}:`, error.message);
            errorCount++;
        }
    }
    
    console.log('\n🎉 Population completed!');
    console.log(`✅ Successfully added: ${successCount} regions`);
    console.log(`❌ Failed additions: ${errorCount} regions`);
    
    // Final verification
    try {
        const scanCommand = new ScanCommand({
            TableName: 'WizzCentral_Regions',
            Select: 'COUNT'
        });
        
        const result = await docClient.send(scanCommand);
        console.log(`📊 Total items in AWS table: ${result.Count}`);
        
    } catch (error) {
        console.error('Failed to verify table:', error.message);
    }
}

populateAWS().catch(console.error);
