// WizzCentral Regions Management - Database Schema
// This file defines the DynamoDB table structures for regions management

const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB({ region: 'us-east-1' });
const docClient = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

// Region Type Enum
const REGION_TYPE = {
    PROVINCE: 'PROVINCE',      // Top-level administrative region
    DISTRICT: 'DISTRICT',      // Mid-level region (child of province)
    NEIGHBORHOOD: 'NEIGHBORHOOD' // Lowest-level region (child of district)
};

// Region Status Enum
const REGION_STATUS = {
    ACTIVE: 'ACTIVE',       // Region is operational
    INACTIVE: 'INACTIVE'    // Region is closed/disabled
};

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
        },
        {
            AttributeName: 'parent_id',
            AttributeType: 'S'
        },
        {
            AttributeName: 'region_type',
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
        },
        {
            IndexName: 'ParentIdIndex',
            KeySchema: [
                {
                    AttributeName: 'parent_id',
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
        },
        {
            IndexName: 'RegionTypeIndex',
            KeySchema: [
                {
                    AttributeName: 'region_type',
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
        region_type: 'DISTRICT', // enum: PROVINCE, DISTRICT, NEIGHBORHOOD
        parent_id: null, // references parent region (null for provinces)
        isActive: true,
        status: 'ACTIVE', // enum: ACTIVE, INACTIVE
        gps_coordinates: { lat: 33.3152, lng: 44.3661 }, // GeoJSON or [lat, lng] array
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
        region_type: 'NEIGHBORHOOD', // child of Baghdad Central district
        parent_id: 'REG_001', // references parent region (Baghdad Central)
        isActive: true,
        status: 'ACTIVE',
        gps_coordinates: { lat: 33.3800, lng: 44.3400 },
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
        region_type: 'PROVINCE',
        parent_id: null,
        isActive: false,
        status: 'INACTIVE', // Province is inactive
        gps_coordinates: { lat: 30.5034, lng: 47.7804 },
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
        region_type: 'PROVINCE',
        parent_id: null,
        isActive: true,
        status: 'ACTIVE',
        gps_coordinates: { lat: 36.1911, lng: 44.0093 },
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
        region_type: 'DISTRICT',
        parent_id: null,
        isActive: false,
        status: 'INACTIVE',
        gps_coordinates: { lat: 32.0252, lng: 44.3358 },
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
    SAMPLE_GOVERNORATES,
    REGION_TYPE,
    REGION_STATUS,
    cascadeDeactivateChildren,
    updateRegionStatus,
    validateRegionHierarchy
};

/**
 * Region Model Schema
 * 
 * Fields:
 * - regionId: Unique identifier for the region (required)
 * - regionName: English name of the region (required)
 * - regionNameArabic: Arabic name of the region (required)
 * - governorate: Governorate the region belongs to (required)
 * - region_type: Type of region (PROVINCE, DISTRICT, NEIGHBORHOOD) (required)
 * - parent_id: ID of parent region (nullable, null for provinces)
 * - gps_coordinates: GPS coordinates as {lat, lng} object (required)
 * - status: Operational status (ACTIVE, INACTIVE) (required)
 * - isActive: Boolean flag for active status (maintained for backward compatibility)
 * - coordinates: Detailed coordinate data including center and boundaries
 * - serviceTypes: Available service types in the region
 * - operatingHours: Working hours for each day of the week
 * - deliveryFee: Base delivery fee for the region
 * - minimumOrder: Minimum order amount
 * - estimatedDeliveryTime: Average delivery time in minutes
 * - activeDrivers: Number of active drivers in the region
 * - activeMerchants: Number of active merchants in the region
 * - totalOrders: Total number of orders in the region
 * - createdAt: Timestamp when region was created
 * - updatedAt: Timestamp when region was last updated
 * - createdBy: User who created the region
 */

/**
 * Cascading Logic: Deactivate all child regions when parent is deactivated
 * This function ensures that when a province is set to INACTIVE,
 * all its children (districts and neighborhoods) are also set to INACTIVE.
 * 
 * @param {string} parentRegionId - The ID of the parent region being deactivated
 * @returns {Promise<Array>} Array of updated child region IDs
 */
async function cascadeDeactivateChildren(parentRegionId) {
    console.log(`🔄 Cascading deactivation for parent region: ${parentRegionId}`);
    
    try {
        const tableName = 'WizzCentral_Regions';
        
        // Query all children of this parent
        const params = {
            TableName: tableName,
            IndexName: 'ParentIdIndex',
            KeyConditionExpression: 'parent_id = :parentId',
            ExpressionAttributeValues: {
                ':parentId': parentRegionId
            }
        };
        
        const result = await docClient.query(params).promise();
        const childRegions = result.Items || [];
        
        console.log(`Found ${childRegions.length} child regions to deactivate`);
        
        const updatedRegions = [];
        
        // Update each child region to INACTIVE
        for (const child of childRegions) {
            const updateParams = {
                TableName: tableName,
                Key: { regionId: child.regionId },
                UpdateExpression: 'SET #status = :inactive, isActive = :false, updatedAt = :now',
                ExpressionAttributeNames: {
                    '#status': 'status'
                },
                ExpressionAttributeValues: {
                    ':inactive': REGION_STATUS.INACTIVE,
                    ':false': false,
                    ':now': new Date().toISOString()
                },
                ReturnValues: 'ALL_NEW'
            };
            
            const updated = await docClient.update(updateParams).promise();
            updatedRegions.push(updated.Attributes.regionId);
            
            // Recursively cascade to grandchildren
            if (child.region_type === REGION_TYPE.DISTRICT) {
                const grandchildren = await cascadeDeactivateChildren(child.regionId);
                updatedRegions.push(...grandchildren);
            }
        }
        
        console.log(`✅ Cascaded deactivation complete. Updated ${updatedRegions.length} regions`);
        return updatedRegions;
        
    } catch (error) {
        console.error('❌ Error cascading deactivation:', error);
        throw error;
    }
}

/**
 * Update a region's status with cascading logic
 * 
 * @param {string} regionId - The ID of the region to update
 * @param {string} newStatus - The new status (ACTIVE or INACTIVE)
 * @returns {Promise<Object>} Update result with affected regions
 */
async function updateRegionStatus(regionId, newStatus) {
    console.log(`📝 Updating region ${regionId} to status: ${newStatus}`);
    
    try {
        const tableName = 'WizzCentral_Regions';
        
        // Get the region first to check its type
        const getParams = {
            TableName: tableName,
            Key: { regionId }
        };
        
        const regionResult = await docClient.get(getParams).promise();
        const region = regionResult.Item;
        
        if (!region) {
            throw new Error(`Region ${regionId} not found`);
        }
        
        // Update the region's status
        const updateParams = {
            TableName: tableName,
            Key: { regionId },
            UpdateExpression: 'SET #status = :status, isActive = :isActive, updatedAt = :now',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':status': newStatus,
                ':isActive': newStatus === REGION_STATUS.ACTIVE,
                ':now': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        };
        
        const updated = await docClient.update(updateParams).promise();
        
        // If setting to INACTIVE and region has children, cascade the deactivation
        let affectedChildren = [];
        if (newStatus === REGION_STATUS.INACTIVE && 
            (region.region_type === REGION_TYPE.PROVINCE || region.region_type === REGION_TYPE.DISTRICT)) {
            affectedChildren = await cascadeDeactivateChildren(regionId);
        }
        
        return {
            success: true,
            updatedRegion: updated.Attributes,
            affectedChildren,
            message: affectedChildren.length > 0 
                ? `Region updated and ${affectedChildren.length} child regions deactivated`
                : 'Region updated successfully'
        };
        
    } catch (error) {
        console.error('❌ Error updating region status:', error);
        throw error;
    }
}

/**
 * Validate region hierarchy
 * Ensures proper parent-child relationships based on region types
 * 
 * @param {string} regionType - The type of the region being created/updated
 * @param {string} parentId - The parent region ID (can be null)
 * @returns {Promise<Object>} Validation result
 */
async function validateRegionHierarchy(regionType, parentId) {
    // PROVINCE should have no parent
    if (regionType === REGION_TYPE.PROVINCE && parentId) {
        return {
            valid: false,
            message: 'PROVINCE regions cannot have a parent'
        };
    }
    
    // DISTRICT and NEIGHBORHOOD must have a parent
    if ((regionType === REGION_TYPE.DISTRICT || regionType === REGION_TYPE.NEIGHBORHOOD) && !parentId) {
        return {
            valid: false,
            message: `${regionType} regions must have a parent`
        };
    }
    
    // If there's a parent, validate the parent exists and check hierarchy rules
    if (parentId) {
        const tableName = 'WizzCentral_Regions';
        const getParams = {
            TableName: tableName,
            Key: { regionId: parentId }
        };
        
        const parentResult = await docClient.get(getParams).promise();
        const parent = parentResult.Item;
        
        if (!parent) {
            return {
                valid: false,
                message: `Parent region ${parentId} not found`
            };
        }
        
        // DISTRICT can only be child of PROVINCE
        if (regionType === REGION_TYPE.DISTRICT && parent.region_type !== REGION_TYPE.PROVINCE) {
            return {
                valid: false,
                message: 'DISTRICT regions can only be children of PROVINCE regions'
            };
        }
        
        // NEIGHBORHOOD can only be child of DISTRICT
        if (regionType === REGION_TYPE.NEIGHBORHOOD && parent.region_type !== REGION_TYPE.DISTRICT) {
            return {
                valid: false,
                message: 'NEIGHBORHOOD regions can only be children of DISTRICT regions'
            };
        }
    }
    
    return { valid: true };
}
