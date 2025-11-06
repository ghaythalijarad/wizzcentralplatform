// WizzCentral Regions API Handler
// Handles API requests for regions with hierarchical structure support

const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
const {
    REGION_TYPE,
    REGION_STATUS,
    cascadeDeactivateChildren,
    updateRegionStatus,
    validateRegionHierarchy
} = require('./regions-db-schema');
const { regionService } = require('./regions-service');

const TABLE_NAME = 'WizzCentral_Regions';

/**
 * Get all regions with optional filters
 */
async function getRegions(filters = {}) {
    console.log('📥 Getting regions with filters:', filters);
    
    try {
        let params = {
            TableName: TABLE_NAME
        };
        
        // Apply filters if provided
        if (filters.region_type) {
            params.IndexName = 'RegionTypeIndex';
            params.KeyConditionExpression = 'region_type = :type';
            params.ExpressionAttributeValues = {
                ':type': filters.region_type
            };
        } else if (filters.parent_id) {
            params.IndexName = 'ParentIdIndex';
            params.KeyConditionExpression = 'parent_id = :parentId';
            params.ExpressionAttributeValues = {
                ':parentId': filters.parent_id
            };
        }
        
        const operation = params.KeyConditionExpression ? 'query' : 'scan';
        const result = await docClient[operation](params).promise();
        
        let regions = result.Items || [];
        
        // Apply additional filters
        if (filters.status) {
            regions = regions.filter(r => r.status === filters.status);
        }
        
        if (filters.governorate) {
            regions = regions.filter(r => r.governorate === filters.governorate);
        }
        
        console.log(`✅ Found ${regions.length} regions`);
        return regions;
        
    } catch (error) {
        console.error('❌ Error getting regions:', error);
        throw error;
    }
}

/**
 * Get a single region by ID
 */
async function getRegionById(regionId) {
    console.log(`📥 Getting region: ${regionId}`);
    
    try {
        const params = {
            TableName: TABLE_NAME,
            Key: { regionId }
        };
        
        const result = await docClient.get(params).promise();
        
        if (!result.Item) {
            throw new Error(`Region ${regionId} not found`);
        }
        
        console.log(`✅ Found region: ${result.Item.regionName}`);
        return result.Item;
        
    } catch (error) {
        console.error('❌ Error getting region:', error);
        throw error;
    }
}

/**
 * Get child regions of a parent
 */
async function getChildRegions(parentId) {
    console.log(`📥 Getting children of region: ${parentId}`);
    
    try {
        const params = {
            TableName: TABLE_NAME,
            IndexName: 'ParentIdIndex',
            KeyConditionExpression: 'parent_id = :parentId',
            ExpressionAttributeValues: {
                ':parentId': parentId
            }
        };
        
        const result = await docClient.query(params).promise();
        const children = result.Items || [];
        
        console.log(`✅ Found ${children.length} child regions`);
        return children;
        
    } catch (error) {
        console.error('❌ Error getting child regions:', error);
        throw error;
    }
}

/**
 * Get region hierarchy tree (parent with all descendants)
 */
async function getRegionHierarchy(regionId) {
    console.log(`🌳 Building hierarchy tree for region: ${regionId}`);
    
    try {
        const region = await getRegionById(regionId);
        const children = await getChildRegions(regionId);
        
        // Recursively get children for each child
        const childrenWithDescendants = await Promise.all(
            children.map(async (child) => {
                const descendants = await getRegionHierarchy(child.regionId);
                return descendants;
            })
        );
        
        return {
            ...region,
            children: childrenWithDescendants
        };
        
    } catch (error) {
        console.error('❌ Error building region hierarchy:', error);
        throw error;
    }
}

/**
 * Create a new region with validation
 */
async function createRegion(regionData) {
    console.log('📝 Creating new region:', regionData.regionName);
    
    try {
        // Validate hierarchy
        const validation = await validateRegionHierarchy(
            regionData.region_type,
            regionData.parent_id
        );
        
        if (!validation.valid) {
            throw new Error(validation.message);
        }
        
        // Ensure required fields are present
        const requiredFields = ['regionId', 'regionName', 'regionNameArabic', 'region_type', 'gps_coordinates', 'status'];
        for (const field of requiredFields) {
            if (!regionData[field]) {
                throw new Error(`Missing required field: ${field}`);
            }
        }
        
        // Set default values
        const region = {
            ...regionData,
            isActive: regionData.status === REGION_STATUS.ACTIVE,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        const params = {
            TableName: TABLE_NAME,
            Item: region,
            ConditionExpression: 'attribute_not_exists(regionId)'
        };
        
        await docClient.put(params).promise();
        
        console.log(`✅ Region created: ${region.regionName}`);
        return region;
        
    } catch (error) {
        console.error('❌ Error creating region:', error);
        throw error;
    }
}

/**
 * Update a region with validation
 */
async function updateRegion(regionId, updates) {
    console.log(`📝 Updating region: ${regionId}`);
    
    try {
        // Get existing region
        const existingRegion = await getRegionById(regionId);
        
        // If changing hierarchy, validate
        if (updates.region_type || updates.parent_id) {
            const newType = updates.region_type || existingRegion.region_type;
            const newParentId = updates.parent_id !== undefined ? updates.parent_id : existingRegion.parent_id;
            
            const validation = await validateRegionHierarchy(newType, newParentId);
            if (!validation.valid) {
                throw new Error(validation.message);
            }
        }
        
        // Build update expression
        const updateExpressions = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};
        
        Object.keys(updates).forEach((key, index) => {
            const placeholder = `:val${index}`;
            const namePlaceholder = `#field${index}`;
            
            updateExpressions.push(`${namePlaceholder} = ${placeholder}`);
            expressionAttributeNames[namePlaceholder] = key;
            expressionAttributeValues[placeholder] = updates[key];
        });
        
        // Always update the updatedAt timestamp
        updateExpressions.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = new Date().toISOString();
        
        // Sync isActive with status if status is being updated
        if (updates.status) {
            updateExpressions.push('#isActive = :isActive');
            expressionAttributeNames['#isActive'] = 'isActive';
            expressionAttributeValues[':isActive'] = updates.status === REGION_STATUS.ACTIVE;
        }
        
        const params = {
            TableName: TABLE_NAME,
            Key: { regionId },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        };
        
        const result = await docClient.update(params).promise();
        
        console.log(`✅ Region updated: ${result.Attributes.regionName}`);
        return result.Attributes;
        
    } catch (error) {
        console.error('❌ Error updating region:', error);
        throw error;
    }
}

/**
 * Delete a region (only if it has no children)
 */
async function deleteRegion(regionId) {
    console.log(`🗑️ Deleting region: ${regionId}`);
    
    try {
        // Check if region has children
        const children = await getChildRegions(regionId);
        
        if (children.length > 0) {
            throw new Error(`Cannot delete region with ${children.length} child regions. Delete children first or deactivate instead.`);
        }
        
        const params = {
            TableName: TABLE_NAME,
            Key: { regionId }
        };
        
        await docClient.delete(params).promise();
        
        console.log(`✅ Region deleted: ${regionId}`);
        return { success: true, regionId };
        
    } catch (error) {
        console.error('❌ Error deleting region:', error);
        throw error;
    }
}

/**
 * PHASE 5: Get complete region hierarchy
 * Returns full nested structure: provinces → districts → neighborhoods
 * GET /regions/hierarchy
 */
async function getCompleteHierarchy() {
    console.log('🌳 Building complete region hierarchy');
    
    try {
        // Get all provinces (regions with no parent)
        const provinces = await getRegions({ 
            region_type: REGION_TYPE.PROVINCE 
        });
        
        // Build hierarchy tree for each province
        const hierarchyTree = await Promise.all(
            provinces.map(async (province) => {
                // Get all districts for this province
                const districts = await getChildRegions(province.regionId);
                
                // For each district, get its neighborhoods
                const districtsWithNeighborhoods = await Promise.all(
                    districts.map(async (district) => {
                        const neighborhoods = await getChildRegions(district.regionId);
                        return {
                            ...district,
                            children: neighborhoods
                        };
                    })
                );
                
                return {
                    ...province,
                    children: districtsWithNeighborhoods
                };
            })
        );
        
        console.log(`✅ Built complete hierarchy with ${hierarchyTree.length} provinces`);
        return {
            hierarchy: hierarchyTree,
            metadata: {
                totalProvinces: hierarchyTree.length,
                totalDistricts: hierarchyTree.reduce((sum, p) => sum + p.children.length, 0),
                totalNeighborhoods: hierarchyTree.reduce((sum, p) => 
                    sum + p.children.reduce((dSum, d) => dSum + d.children.length, 0), 0
                ),
                generatedAt: new Date().toISOString()
            }
        };
        
    } catch (error) {
        console.error('❌ Error building complete hierarchy:', error);
        throw error;
    }
}

/**
 * PHASE 5: Get only active regions (for frontend apps)
 * Returns filtered list of ACTIVE regions only
 * GET /regions/active
 * 
 * Query parameters:
 * - region_type: Filter by PROVINCE, DISTRICT, or NEIGHBORHOOD
 * - governorate: Filter by governorate name
 * - includeHierarchy: If true, returns hierarchical structure
 */
async function getActiveRegions(options = {}) {
    console.log('✅ Getting active regions with options:', options);
    
    try {
        // Get all active regions
        let activeRegions = await getRegions({ 
            status: REGION_STATUS.ACTIVE 
        });
        
        // Apply additional filters
        if (options.region_type) {
            activeRegions = activeRegions.filter(r => 
                r.region_type === options.region_type
            );
        }
        
        if (options.governorate) {
            activeRegions = activeRegions.filter(r => 
                r.governorate === options.governorate
            );
        }
        
        // If hierarchical structure requested
        if (options.includeHierarchy === 'true') {
            // Build hierarchy only with active regions
            const provinces = activeRegions.filter(r => 
                r.region_type === REGION_TYPE.PROVINCE
            );
            
            const hierarchyTree = await Promise.all(
                provinces.map(async (province) => {
                    const districts = activeRegions.filter(r => 
                        r.parent_id === province.regionId && 
                        r.region_type === REGION_TYPE.DISTRICT
                    );
                    
                    const districtsWithNeighborhoods = districts.map(district => {
                        const neighborhoods = activeRegions.filter(r => 
                            r.parent_id === district.regionId && 
                            r.region_type === REGION_TYPE.NEIGHBORHOOD
                        );
                        
                        return {
                            ...district,
                            children: neighborhoods
                        };
                    });
                    
                    return {
                        ...province,
                        children: districtsWithNeighborhoods
                    };
                })
            );
            
            return {
                hierarchy: hierarchyTree,
                metadata: {
                    totalActive: activeRegions.length,
                    byType: {
                        provinces: provinces.length,
                        districts: activeRegions.filter(r => r.region_type === REGION_TYPE.DISTRICT).length,
                        neighborhoods: activeRegions.filter(r => r.region_type === REGION_TYPE.NEIGHBORHOOD).length
                    },
                    generatedAt: new Date().toISOString()
                }
            };
        }
        
        console.log(`✅ Found ${activeRegions.length} active regions`);
        return {
            regions: activeRegions,
            metadata: {
                total: activeRegions.length,
                byType: {
                    provinces: activeRegions.filter(r => r.region_type === REGION_TYPE.PROVINCE).length,
                    districts: activeRegions.filter(r => r.region_type === REGION_TYPE.DISTRICT).length,
                    neighborhoods: activeRegions.filter(r => r.region_type === REGION_TYPE.NEIGHBORHOOD).length
                }
            }
        };
        
    } catch (error) {
        console.error('❌ Error getting active regions:', error);
        throw error;
    }
}

/**
 * PHASE 5: Toggle region status with automatic child updates
 * PATCH /regions/:id/toggleStatus
 * 
 * Uses RegionService for cascading logic:
 * - Deactivating a region deactivates all children
 * - Activating a region validates parent chain is active
 */
async function toggleRegionStatus(regionId, requestBody) {
    console.log(`🔄 Toggling status for region: ${regionId}`);
    
    try {
        // Parse request body
        const { status } = requestBody;
        
        // Validate status value
        if (!status || !Object.values(REGION_STATUS).includes(status)) {
            throw new Error(`Invalid status. Must be one of: ${Object.values(REGION_STATUS).join(', ')}`);
        }
        
        // Get current region to check current status
        const currentRegion = await getRegionById(regionId);
        
        // If status is same, no need to update
        if (currentRegion.status === status) {
            return {
                success: true,
                message: `Region already has status: ${status}`,
                region: currentRegion,
                affectedRegions: {
                    provinces: 0,
                    districts: 0,
                    neighborhoods: 0,
                    total: 0
                }
            };
        }
        
        // Use RegionService for status toggle with cascading logic
        const result = await regionService.toggleRegionStatus(regionId, status);
        
        console.log(`✅ Status toggled successfully. Affected ${result.affectedRegions.total} regions`);
        return result;
        
    } catch (error) {
        console.error('❌ Error toggling region status:', error);
        throw error;
    }
}

/**
 * Middleware: Validate region status logic
 * Used before any status-changing operations
 */
function validateStatusChange(currentStatus, newStatus, regionType, hasChildren) {
    const errors = [];
    
    // Cannot change to same status
    if (currentStatus === newStatus) {
        errors.push('Status is already set to ' + newStatus);
    }
    
    // Validate status value
    if (!Object.values(REGION_STATUS).includes(newStatus)) {
        errors.push('Invalid status value. Must be ACTIVE or INACTIVE');
    }
    
    // Warning if deactivating with children
    if (newStatus === REGION_STATUS.INACTIVE && hasChildren) {
        return {
            valid: true,
            warnings: ['This will cascade and deactivate all child regions'],
            errors: []
        };
    }
    
    return {
        valid: errors.length === 0,
        errors,
        warnings: []
    };
}

/**
 * Lambda handler for API Gateway
 * PHASE 5: Enhanced with new endpoints
 */
exports.handler = async (event) => {
    console.log('📨 Received event:', JSON.stringify(event, null, 2));
    
    try {
        const { httpMethod, pathParameters, queryStringParameters, body, path } = event;
        const regionId = pathParameters?.regionId;
        const action = pathParameters?.action;
        
        let response;
        
        // Parse path to handle special routes
        const pathSegments = (path || '').split('/').filter(Boolean);
        
        switch (httpMethod) {
            case 'GET':
                // PHASE 5: GET /regions/hierarchy
                if (pathSegments.includes('hierarchy') || action === 'hierarchy') {
                    response = await getCompleteHierarchy();
                }
                // PHASE 5: GET /regions/active
                else if (pathSegments.includes('active') || action === 'active') {
                    response = await getActiveRegions(queryStringParameters || {});
                }
                // GET /regions/summary
                else if (pathSegments.includes('summary') || action === 'summary') {
                    response = await regionService.getRegionStatusSummary();
                }
                // GET /regions/:id
                else if (regionId) {
                    if (queryStringParameters?.includeHierarchy === 'true') {
                        response = await getRegionHierarchy(regionId);
                    } else if (queryStringParameters?.children === 'true') {
                        response = await getChildRegions(regionId);
                    } else {
                        response = await getRegionById(regionId);
                    }
                }
                // GET /regions
                else {
                    response = await getRegions(queryStringParameters || {});
                }
                break;
                
            case 'POST':
                const createData = JSON.parse(body);
                response = await createRegion(createData);
                break;
                
            case 'PUT':
                const updateData = JSON.parse(body);
                if (updateData.status) {
                    // Use RegionService for status toggle with cascading logic
                    response = await regionService.toggleRegionStatus(regionId, updateData.status);
                } else {
                    response = await updateRegion(regionId, updateData);
                }
                break;
                
            case 'PATCH':
                // PHASE 5: PATCH /regions/:id/toggleStatus
                if (pathSegments.includes('toggleStatus') || action === 'toggleStatus') {
                    const patchData = JSON.parse(body);
                    response = await toggleRegionStatus(regionId, patchData);
                } else {
                    throw new Error('PATCH method requires /toggleStatus action');
                }
                break;
                
            case 'DELETE':
                response = await deleteRegion(regionId);
                break;
                
            default:
                throw new Error(`Unsupported method: ${httpMethod}`);
        }
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Methods': '*'
            },
            body: JSON.stringify({
                success: true,
                data: response
            })
        };
        
    } catch (error) {
        console.error('❌ Handler error:', error);
        
        return {
            statusCode: error.message.includes('not found') ? 404 : 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Methods': '*'
            },
            body: JSON.stringify({
                success: false,
                error: error.message
            })
        };
    }
};

module.exports = {
    // Existing functions
    getRegions,
    getRegionById,
    getChildRegions,
    getRegionHierarchy,
    createRegion,
    updateRegion,
    deleteRegion,
    
    // PHASE 5: New API endpoint functions
    getCompleteHierarchy,
    getActiveRegions,
    toggleRegionStatus,
    validateStatusChange,
    
    // Lambda handler
    handler: exports.handler
};
