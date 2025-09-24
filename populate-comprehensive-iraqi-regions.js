const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize DynamoDB client
const client = new DynamoDBClient({
    region: 'us-east-1', // N. Virginia region as shown in your console
});
const docClient = DynamoDBDocumentClient.from(client);

const TABLE_NAME = 'WizzCentral_Regions';

// Comprehensive Iraqi regions data matching your DynamoDB schema
const comprehensiveIraqiRegions = [
    // Additional Governorates
    {
        regionId: 'REG_IQ_MOZ',
        regionName: 'Mosul',
        regionNameArabic: 'الموصل',
        regionCode: 'MOZ',
        countryCode: 'IQ',
        level: 1,
        parentRegionId: 'REG_IQ',
        governorateId: 'REG_IQ_MOZ',
        hierarchy: ['IQ', 'MOZ'],
        coordinates: {
            radius: 28000,
            boundaries: [
                { lng: 42.5, lat: 37.0 },
                { lng: 44.5, lat: 37.0 },
                { lng: 44.5, lat: 35.8 },
                { lng: 42.5, lat: 35.8 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            populationEstimate: 1800000,
            areaKm2: 37323
        },
        serviceConfig: {
            minimumOrder: 17000,
            deliveryFee: 2800,
            maxDeliveryDistance: 28000,
            isActive: true,
            estimatedDeliveryTime: 55,
            serviceTypes: {
                delivery: true,
                pickup: true,
                dineIn: true
            }
        },
        statistics: {
            totalOrders: 8500,
            activeDrivers: 65,
            activeMerchants: 280,
            avgOrderValue: 24000
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
        regionId: 'REG_IQ_KRK',
        regionName: 'Kirkuk',
        regionNameArabic: 'كركوك',
        regionCode: 'KRK',
        countryCode: 'IQ',
        level: 1,
        parentRegionId: 'REG_IQ',
        governorateId: 'REG_IQ_KRK',
        hierarchy: ['IQ', 'KRK'],
        coordinates: {
            radius: 26000,
            boundaries: [
                { lng: 43.8, lat: 36.0 },
                { lng: 45.5, lat: 36.0 },
                { lng: 45.5, lat: 34.8 },
                { lng: 43.8, lat: 34.8 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            populationEstimate: 1395000,
            areaKm2: 9679
        },
        serviceConfig: {
            minimumOrder: 18500,
            deliveryFee: 2750,
            maxDeliveryDistance: 26000,
            isActive: true,
            estimatedDeliveryTime: 50,
            serviceTypes: {
                delivery: true,
                pickup: true,
                dineIn: true
            }
        },
        statistics: {
            totalOrders: 6400,
            activeDrivers: 48,
            activeMerchants: 190,
            avgOrderValue: 27500
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

    // Additional Baghdad Districts
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

    {
        regionId: 'REG_IQ_BGD_ADH',
        regionName: 'Al-Adhamiya',
        regionNameArabic: 'الأعظمية',
        regionCode: 'BGD-ADH',
        countryCode: 'IQ',
        level: 2,
        parentRegionId: 'REG_IQ_BGD',
        governorateId: 'REG_IQ_BGD',
        hierarchy: ['IQ', 'BGD', 'ADH'],
        coordinates: {
            radius: 8000,
            boundaries: [
                { lng: 44.35, lat: 33.42 },
                { lng: 44.42, lat: 33.42 },
                { lng: 44.42, lat: 33.35 },
                { lng: 44.35, lat: 33.35 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            populationEstimate: 650000,
            areaKm2: 45
        },
        serviceConfig: {
            minimumOrder: 13000,
            deliveryFee: 1500,
            maxDeliveryDistance: 8000,
            isActive: true,
            estimatedDeliveryTime: 30,
            serviceTypes: {
                delivery: true,
                pickup: true,
                dineIn: true
            }
        },
        statistics: {
            totalOrders: 9500,
            activeDrivers: 60,
            activeMerchants: 180,
            avgOrderValue: 31000
        }
    },

    // Additional Basra Districts
    {
        regionId: 'REG_IQ_BSR_MAQ',
        regionName: 'Al-Maqal',
        regionNameArabic: 'المعقل',
        regionCode: 'BSR-MAQ',
        countryCode: 'IQ',
        level: 2,
        parentRegionId: 'REG_IQ_BSR',
        governorateId: 'REG_IQ_BSR',
        hierarchy: ['IQ', 'BSR', 'MAQ'],
        coordinates: {
            radius: 8000,
            boundaries: [
                { lng: 47.7, lat: 30.58 },
                { lng: 47.82, lat: 30.58 },
                { lng: 47.82, lat: 30.48 },
                { lng: 47.7, lat: 30.48 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            populationEstimate: 420000,
            areaKm2: 35
        },
        serviceConfig: {
            minimumOrder: 15000,
            deliveryFee: 1800,
            maxDeliveryDistance: 8000,
            isActive: true,
            estimatedDeliveryTime: 35,
            serviceTypes: {
                delivery: true,
                pickup: true,
                dineIn: true
            }
        },
        statistics: {
            totalOrders: 6800,
            activeDrivers: 45,
            activeMerchants: 165,
            avgOrderValue: 27000
        }
    },

    {
        regionId: 'REG_IQ_BSR_HAR',
        regionName: 'Al-Hartha',
        regionNameArabic: 'الهارثة',
        regionCode: 'BSR-HAR',
        countryCode: 'IQ',
        level: 2,
        parentRegionId: 'REG_IQ_BSR',
        governorateId: 'REG_IQ_BSR',
        hierarchy: ['IQ', 'BSR', 'HAR'],
        coordinates: {
            radius: 12000,
            boundaries: [
                { lng: 47.78, lat: 30.65 },
                { lng: 47.88, lat: 30.65 },
                { lng: 47.88, lat: 30.58 },
                { lng: 47.78, lat: 30.58 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'inactive',
            populationEstimate: 380000,
            areaKm2: 55
        },
        serviceConfig: {
            minimumOrder: 16000,
            deliveryFee: 2200,
            maxDeliveryDistance: 12000,
            isActive: false,
            estimatedDeliveryTime: 45,
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

    // Additional Erbil Districts
    {
        regionId: 'REG_IQ_ERB_SOR',
        regionName: 'Soran',
        regionNameArabic: 'سوران',
        regionCode: 'ERB-SOR',
        countryCode: 'IQ',
        level: 2,
        parentRegionId: 'REG_IQ_ERB',
        governorateId: 'REG_IQ_ERB',
        hierarchy: ['IQ', 'ERB', 'SOR'],
        coordinates: {
            radius: 15000,
            boundaries: [
                { lng: 44.5, lat: 36.7 },
                { lng: 44.7, lat: 36.7 },
                { lng: 44.7, lat: 36.5 },
                { lng: 44.5, lat: 36.5 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            populationEstimate: 280000,
            areaKm2: 3500
        },
        serviceConfig: {
            minimumOrder: 19000,
            deliveryFee: 2800,
            maxDeliveryDistance: 15000,
            isActive: true,
            estimatedDeliveryTime: 50,
            serviceTypes: {
                delivery: true,
                pickup: true,
                dineIn: true
            }
        },
        statistics: {
            totalOrders: 3200,
            activeDrivers: 22,
            activeMerchants: 85,
            avgOrderValue: 33000
        }
    },

    // Neighborhoods in Baghdad
    {
        regionId: 'REG_IQ_BGD_CTR_YRM',
        regionName: 'Al-Yarmouk',
        regionNameArabic: 'اليرموك',
        regionCode: 'BGD-CTR-YRM',
        countryCode: 'IQ',
        level: 3,
        parentRegionId: 'REG_IQ_BGD_CTR',
        governorateId: 'REG_IQ_BGD',
        hierarchy: ['IQ', 'BGD', 'CTR', 'YRM'],
        coordinates: {
            radius: 2500,
            boundaries: [
                { lng: 44.32, lat: 33.31 },
                { lng: 44.36, lat: 33.31 },
                { lng: 44.36, lat: 33.28 },
                { lng: 44.32, lat: 33.28 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            populationEstimate: 180000,
            areaKm2: 15.2
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
            totalOrders: 3200,
            activeDrivers: 18,
            activeMerchants: 65,
            avgOrderValue: 35000
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
                { lng: 44.28, lat: 33.29 },
                { lng: 44.33, lat: 33.29 },
                { lng: 44.33, lat: 33.25 },
                { lng: 44.28, lat: 33.25 }
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
        regionId: 'REG_IQ_BGD_KRK_AMR',
        regionName: 'Al-Amiriya',
        regionNameArabic: 'الأميرية',
        regionCode: 'BGD-KRK-AMR',
        countryCode: 'IQ',
        level: 3,
        parentRegionId: 'REG_IQ_BGD_KRK',
        governorateId: 'REG_IQ_BGD',
        hierarchy: ['IQ', 'BGD', 'KRK', 'AMR'],
        coordinates: {
            radius: 4000,
            boundaries: [
                { lng: 44.28, lat: 33.34 },
                { lng: 44.34, lat: 33.34 },
                { lng: 44.34, lat: 33.29 },
                { lng: 44.28, lat: 33.29 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            populationEstimate: 280000,
            areaKm2: 22.8
        },
        serviceConfig: {
            minimumOrder: 12000,
            deliveryFee: 1300,
            maxDeliveryDistance: 4000,
            isActive: true,
            estimatedDeliveryTime: 25,
            serviceTypes: {
                delivery: true,
                pickup: true,
                dineIn: true
            }
        },
        statistics: {
            totalOrders: 4800,
            activeDrivers: 26,
            activeMerchants: 85,
            avgOrderValue: 33000
        }
    },

    {
        regionId: 'REG_IQ_BGD_RSF_TAH',
        regionName: 'Tahrir Square',
        regionNameArabic: 'ساحة التحرير',
        regionCode: 'BGD-RSF-TAH',
        countryCode: 'IQ',
        level: 3,
        parentRegionId: 'REG_IQ_BGD_RSF',
        governorateId: 'REG_IQ_BGD',
        hierarchy: ['IQ', 'BGD', 'RSF', 'TAH'],
        coordinates: {
            radius: 2000,
            boundaries: [
                { lng: 44.39, lat: 33.33 },
                { lng: 44.42, lat: 33.33 },
                { lng: 44.42, lat: 33.30 },
                { lng: 44.39, lat: 33.30 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            populationEstimate: 150000,
            areaKm2: 12.6
        },
        serviceConfig: {
            minimumOrder: 8000,
            deliveryFee: 800,
            maxDeliveryDistance: 2000,
            isActive: true,
            estimatedDeliveryTime: 15,
            serviceTypes: {
                delivery: true,
                pickup: true,
                dineIn: true
            }
        },
        statistics: {
            totalOrders: 6200,
            activeDrivers: 35,
            activeMerchants: 120,
            avgOrderValue: 45000
        }
    },

    // Basra Neighborhoods
    {
        regionId: 'REG_IQ_BSR_CTR_ASH',
        regionName: 'Al-Ashar',
        regionNameArabic: 'العشار',
        regionCode: 'BSR-CTR-ASH',
        countryCode: 'IQ',
        level: 3,
        parentRegionId: 'REG_IQ_BSR_CTR',
        governorateId: 'REG_IQ_BSR',
        hierarchy: ['IQ', 'BSR', 'CTR', 'ASH'],
        coordinates: {
            radius: 3500,
            boundaries: [
                { lng: 47.76, lat: 30.52 },
                { lng: 47.81, lat: 30.52 },
                { lng: 47.81, lat: 30.48 },
                { lng: 47.76, lat: 30.48 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            populationEstimate: 320000,
            areaKm2: 24.5
        },
        serviceConfig: {
            minimumOrder: 14000,
            deliveryFee: 1500,
            maxDeliveryDistance: 3500,
            isActive: true,
            estimatedDeliveryTime: 30,
            serviceTypes: {
                delivery: true,
                pickup: true,
                dineIn: true
            }
        },
        statistics: {
            totalOrders: 5800,
            activeDrivers: 32,
            activeMerchants: 145,
            avgOrderValue: 28000
        }
    },

    // Erbil Neighborhoods
    {
        regionId: 'REG_IQ_ERB_CTR_ANK',
        regionName: 'Ankawa',
        regionNameArabic: 'عنكاوا',
        regionCode: 'ERB-CTR-ANK',
        countryCode: 'IQ',
        level: 3,
        parentRegionId: 'REG_IQ_ERB_CTR',
        governorateId: 'REG_IQ_ERB',
        hierarchy: ['IQ', 'ERB', 'CTR', 'ANK'],
        coordinates: {
            radius: 4000,
            boundaries: [
                { lng: 44.01, lat: 36.25 },
                { lng: 44.06, lat: 36.25 },
                { lng: 44.06, lat: 36.21 },
                { lng: 44.01, lat: 36.21 }
            ]
        },
        metadata: {
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'active',
            populationEstimate: 180000,
            areaKm2: 16.8
        },
        serviceConfig: {
            minimumOrder: 16000,
            deliveryFee: 1800,
            maxDeliveryDistance: 4000,
            isActive: true,
            estimatedDeliveryTime: 35,
            serviceTypes: {
                delivery: true,
                pickup: true,
                dineIn: true
            }
        },
        statistics: {
            totalOrders: 4200,
            activeDrivers: 25,
            activeMerchants: 95,
            avgOrderValue: 38000
        }
    }
];

async function populateRegions() {
    console.log('🚀 Starting comprehensive DynamoDB regions population...');
    console.log(`📊 Total regions to insert: ${comprehensiveIraqiRegions.length}`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const region of comprehensiveIraqiRegions) {
        try {
            const command = new PutCommand({
                TableName: TABLE_NAME,
                Item: region
            });
            
            await docClient.send(command);
            console.log(`✅ Inserted: ${region.regionName} (${region.regionNameArabic}) - Level ${region.level}`);
            successCount++;
            
            // Add small delay to avoid overwhelming DynamoDB
            await new Promise(resolve => setTimeout(resolve, 100));
            
        } catch (error) {
            console.error(`❌ Failed to insert ${region.regionName}:`, error.message);
            errorCount++;
        }
    }
    
    console.log('\n🎉 Population completed!');
    console.log(`✅ Successfully inserted: ${successCount} regions`);
    console.log(`❌ Failed insertions: ${errorCount} regions`);
    
    // Verify the data
    try {
        const scanCommand = new ScanCommand({
            TableName: TABLE_NAME,
            Select: 'COUNT'
        });
        
        const result = await docClient.send(scanCommand);
        console.log(`📊 Total items in table after population: ${result.Count}`);
        
        // Get level breakdown
        const fullScanCommand = new ScanCommand({
            TableName: TABLE_NAME
        });
        
        const fullResult = await docClient.send(fullScanCommand);
        const levelBreakdown = fullResult.Items.reduce((acc, item) => {
            const level = item.level;
            acc[level] = (acc[level] || 0) + 1;
            return acc;
        }, {});
        
        console.log('\n📈 Level breakdown:');
        console.log(`   Level 0 (Country): ${levelBreakdown[0] || 0}`);
        console.log(`   Level 1 (Governorates): ${levelBreakdown[1] || 0}`);
        console.log(`   Level 2 (Districts): ${levelBreakdown[2] || 0}`);
        console.log(`   Level 3 (Neighborhoods): ${levelBreakdown[3] || 0}`);
        
    } catch (error) {
        console.error('Failed to verify table count:', error.message);
    }
}

// Run the population script
console.log('Script starting...');
populateRegions().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
});
