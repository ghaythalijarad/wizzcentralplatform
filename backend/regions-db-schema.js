// WizzCentral Regions Management - Database Schema
// This file defines the DynamoDB table structures for regions management

const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB({ region: 'us-east-1' });

// Main Regions Table Schema
const REGIONS_TABLE_SCHEMA = {
    TableName: 'WizzCentral_Regions',
    KeySchema: [
        {
            AttributeName: 'regionId',
            KeyType: 'HASH'
        }
    ],
    AttributeDefinitions: [
        {
            AttributeName: 'regionId',
            AttributeType: 'S'
        },
        {
            AttributeName: 'governorate',
            AttributeType: 'S'
        }
    ],
    GlobalSecondaryIndexes: [
        {
            IndexName: 'GovernorateIndex',
            KeySchema: [
                {
                    AttributeName: 'governorate',
                    KeyType: 'HASH'
                }
            ],
            Projection: {
                ProjectionType: 'ALL'
            },
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5
            }
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 10,
        WriteCapacityUnits: 10
    }
};

// Governorates Table Schema
const GOVERNORATES_TABLE_SCHEMA = {
    TableName: 'WizzCentral_Governorates',
    KeySchema: [
        {
            AttributeName: 'governorateId',
            KeyType: 'HASH'
        }
    ],
    AttributeDefinitions: [
        {
            AttributeName: 'governorateId',
            AttributeType: 'S'
        }
    ],
    ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
    }
};

// Sample data for Iraq regions
const SAMPLE_REGIONS = [
    {
        regionId: 'REG_001',
        regionName: 'Baghdad Central',
        regionNameArabic: 'بغداد المركز',
        governorate: 'Baghdad',
        isActive: true,
        coordinates: {
            center: { lat: 33.3152, lng: 44.3661 },
            boundaries: [
                { lat: 33.32, lng: 44.35 },
                { lat: 33.31, lng: 44.38 },
                { lat: 33.30, lng: 44.37 },
                { lat: 33.31, lng: 44.35 }
            ]
        },
        serviceTypes: {
            delivery: true,
            pickup: true,
            dineIn: false
        },
        operatingHours: {
            monday: { start: '08:00', end: '22:00' },
            tuesday: { start: '08:00', end: '22:00' },
            wednesday: { start: '08:00', end: '22:00' },
            thursday: { start: '08:00', end: '22:00' },
            friday: { start: '08:00', end: '23:00' },
            saturday: { start: '08:00', end: '23:00' },
            sunday: { start: '09:00', end: '22:00' }
        },
        deliveryFee: 2000,
        minimumOrder: 15000,
        estimatedDeliveryTime: 30,
        activeDrivers: 12,
        activeMerchants: 45,
        totalOrders: 1250,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin@wizz.com',
        status: 'active'
    },
    {
        regionId: 'REG_002',
        regionName: 'Baghdad Kadhimiya',
        regionNameArabic: 'بغداد الكاظمية',
        governorate: 'Baghdad',
        isActive: true,
        coordinates: {
            center: { lat: 33.3800, lng: 44.3400 },
            boundaries: [
                { lat: 33.39, lng: 44.33 },
                { lat: 33.38, lng: 44.36 },
                { lat: 33.37, lng: 44.35 },
                { lat: 33.38, lng: 44.33 }
            ]
        },
        serviceTypes: {
            delivery: true,
            pickup: true,
            dineIn: false
        },
        operatingHours: {
            monday: { start: '08:00', end: '22:00' },
            tuesday: { start: '08:00', end: '22:00' },
            wednesday: { start: '08:00', end: '22:00' },
            thursday: { start: '08:00', end: '22:00' },
            friday: { start: '08:00', end: '23:00' },
            saturday: { start: '08:00', end: '23:00' },
            sunday: { start: '09:00', end: '22:00' }
        },
        deliveryFee: 2500,
        minimumOrder: 18000,
        estimatedDeliveryTime: 35,
        activeDrivers: 8,
        activeMerchants: 32,
        totalOrders: 890,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin@wizz.com',
        status: 'active'
    },
    {
        regionId: 'REG_003',
        regionName: 'Basra Central',
        regionNameArabic: 'البصرة المركز',
        governorate: 'Basra',
        isActive: false,
        coordinates: {
            center: { lat: 30.5034, lng: 47.7804 },
            boundaries: [
                { lat: 30.52, lng: 47.76 },
                { lat: 30.51, lng: 47.80 },
                { lat: 30.49, lng: 47.79 },
                { lat: 30.50, lng: 47.76 }
            ]
        },
        serviceTypes: {
            delivery: false,
            pickup: false,
            dineIn: false
        },
        operatingHours: {
            monday: { start: '00:00', end: '00:00' },
            tuesday: { start: '00:00', end: '00:00' },
            wednesday: { start: '00:00', end: '00:00' },
            thursday: { start: '00:00', end: '00:00' },
            friday: { start: '00:00', end: '00:00' },
            saturday: { start: '00:00', end: '00:00' },
            sunday: { start: '00:00', end: '00:00' }
        },
        deliveryFee: 0,
        minimumOrder: 0,
        estimatedDeliveryTime: 0,
        activeDrivers: 0,
        activeMerchants: 0,
        totalOrders: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin@wizz.com',
        status: 'inactive'
    },
    {
        regionId: 'REG_004',
        regionName: 'Erbil Central',
        regionNameArabic: 'أربيل المركز',
        governorate: 'Erbil',
        isActive: true,
        coordinates: {
            center: { lat: 36.1911, lng: 44.0093 },
            boundaries: [
                { lat: 36.20, lng: 44.00 },
                { lat: 36.19, lng: 44.02 },
                { lat: 36.18, lng: 44.01 },
                { lat: 36.19, lng: 44.00 }
            ]
        },
        serviceTypes: {
            delivery: true,
            pickup: true,
            dineIn: true
        },
        operatingHours: {
            monday: { start: '08:00', end: '22:00' },
            tuesday: { start: '08:00', end: '22:00' },
            wednesday: { start: '08:00', end: '22:00' },
            thursday: { start: '08:00', end: '22:00' },
            friday: { start: '08:00', end: '23:00' },
            saturday: { start: '08:00', end: '23:00' },
            sunday: { start: '09:00', end: '22:00' }
        },
        deliveryFee: 3000,
        minimumOrder: 20000,
        estimatedDeliveryTime: 40,
        activeDrivers: 15,
        activeMerchants: 28,
        totalOrders: 675,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin@wizz.com',
        status: 'active'
    },
    {
        regionId: 'REG_005',
        regionName: 'Najaf Central',
        regionNameArabic: 'النجف المركز',
        governorate: 'Najaf',
        isActive: false,
        coordinates: {
            center: { lat: 32.0252, lng: 44.3358 },
            boundaries: [
                { lat: 32.03, lng: 44.32 },
                { lat: 32.02, lng: 44.35 },
                { lat: 32.01, lng: 44.34 },
                { lat: 32.02, lng: 44.32 }
            ]
        },
        serviceTypes: {
            delivery: false,
            pickup: false,
            dineIn: false
        },
        operatingHours: {
            monday: { start: '00:00', end: '00:00' },
            tuesday: { start: '00:00', end: '00:00' },
            wednesday: { start: '00:00', end: '00:00' },
            thursday: { start: '00:00', end: '00:00' },
            friday: { start: '00:00', end: '00:00' },
            saturday: { start: '00:00', end: '00:00' },
            sunday: { start: '00:00', end: '00:00' }
        },
        deliveryFee: 0,
        minimumOrder: 0,
        estimatedDeliveryTime: 0,
        activeDrivers: 0,
        activeMerchants: 0,
        totalOrders: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'admin@wizz.com',
        status: 'maintenance'
    }
];

const SAMPLE_GOVERNORATES = [
    {
        governorateId: 'GOV_001',
        governorateName: 'Baghdad',
        governorateNameArabic: 'بغداد',
        regionalManager: 'ahmed.hassan@wizz.com',
        totalRegions: 8,
        activeRegions: 5
    },
    {
        governorateId: 'GOV_002',
        governorateName: 'Basra',
        governorateNameArabic: 'البصرة',
        regionalManager: 'sara.ali@wizz.com',
        totalRegions: 4,
        activeRegions: 0
    },
    {
        governorateId: 'GOV_003',
        governorateName: 'Erbil',
        governorateNameArabic: 'أربيل',
        regionalManager: 'omar.kurdish@wizz.com',
        totalRegions: 3,
        activeRegions: 2
    },
    {
        governorateId: 'GOV_004',
        governorateName: 'Najaf',
        governorateNameArabic: 'النجف',
        regionalManager: 'fatima.najafi@wizz.com',
        totalRegions: 2,
        activeRegions: 0
    }
];

module.exports = {
    REGIONS_TABLE_SCHEMA,
    GOVERNORATES_TABLE_SCHEMA,
    SAMPLE_REGIONS,
    SAMPLE_GOVERNORATES
};
