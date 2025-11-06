// WizzCentral Platform - Region Management API (Phase 6)
// Central API to serve Customer, Driver, and Merchant apps
// Implements: Validation, Logging, Multi-language, Webhooks

const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });
const sns = new AWS.SNS({ region: 'us-east-1' });

const {
    REGION_TYPE,
    REGION_STATUS,
    validateRegionHierarchy
} = require('./regions-db-schema');

const { regionService } = require('./regions-service');

const TABLE_NAME = 'WizzCentral_Regions';
const LOGS_TABLE = 'WizzCentral_RegionLogs';
const SNS_TOPIC_ARN = process.env.REGION_UPDATES_TOPIC_ARN;

// ============================================================================
// PHASE 6: VALIDATION & SECURITY
// ============================================================================

/**
 * Validate region ID format
 * Prevents SQL injection and invalid IDs
 */
function validateRegionId(regionId) {
    if (!regionId) {
        throw new Error('Region ID is required');
    }
    
    // Must match REG_XXX format
    const regex = /^REG_[A-Z0-9_]+$/;
    if (!regex.test(regionId)) {
        throw new Error('Invalid region ID format. Expected: REG_XXX');
    }
    
    return true;
}

/**
 * Validate status value
 */
function validateStatus(status) {
    if (!status) {
        throw new Error('Status is required');
    }
    
    if (!Object.values(REGION_STATUS).includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${Object.values(REGION_STATUS).join(', ')}`);
    }
    
    return true;
}

/**
 * Validate admin user context
 */
function validateAdminUser(userContext) {
    if (!userContext || !userContext.userId) {
        throw new Error('Admin user context is required');
    }
    
    if (!userContext.email) {
        throw new Error('Admin email is required for audit trail');
    }
    
    return true;
}

/**
 * Sanitize region data before sending to apps
 * Removes sensitive admin-only fields
 */
function sanitizeRegionForApps(region) {
    const {
        createdBy,
        updatedBy,
        internalNotes,
        adminMetadata,
        ...publicData
    } = region;
    
    return publicData;
}

// ============================================================================
// PHASE 6: AUDIT LOGGING
// ============================================================================

/**
 * Log region status change to DynamoDB
 * Creates permanent audit trail with admin info
 */
async function logRegionStatusChange(regionId, change, adminUser) {
    console.log('📝 Logging region status change:', regionId);
    
    try {
        const logEntry = {
            logId: `LOG_${Date.now()}_${regionId}`,
            regionId,
            timestamp: new Date().toISOString(),
            action: change.action,
            oldStatus: change.oldStatus,
            newStatus: change.newStatus,
            adminUserId: adminUser.userId,
            adminEmail: adminUser.email,
            adminName: adminUser.name || adminUser.email,
            affectedRegions: change.affectedRegions || [],
            affectedCount: change.affectedCount || 0,
            cascaded: change.cascaded || false,
            reason: change.reason || 'Manual update',
            ipAddress: adminUser.ipAddress || 'unknown',
            userAgent: adminUser.userAgent || 'unknown',
            ttl: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year retention
        };
        
        await docClient.put({
            TableName: LOGS_TABLE,
            Item: logEntry
        }).promise();
        
        console.log('✅ Status change logged:', logEntry.logId);
        return logEntry;
        
    } catch (error) {
        console.error('❌ Error logging status change:', error);
        // Don't fail the request if logging fails
        return null;
    }
}

/**
 * Get region change history
 */
async function getRegionLogs(regionId, limit = 50) {
    console.log('📜 Getting logs for region:', regionId);
    
    try {
        const params = {
            TableName: LOGS_TABLE,
            IndexName: 'RegionIdIndex',
            KeyConditionExpression: 'regionId = :regionId',
            ExpressionAttributeValues: {
                ':regionId': regionId
            },
            ScanIndexForward: false, // Newest first
            Limit: limit
        };
        
        const result = await docClient.query(params).promise();
        return result.Items || [];
        
    } catch (error) {
        console.error('❌ Error getting region logs:', error);
        return [];
    }
}

// ============================================================================
// PHASE 6: WEBHOOK & NOTIFICATIONS
// ============================================================================

/**
 * Send webhook notification to apps when region status changes
 * Uses SNS to notify Customer, Driver, and Merchant apps
 */
async function notifyAppsOfStatusChange(region, change) {
    console.log('📢 Notifying apps of status change:', region.regionId);
    
    if (!SNS_TOPIC_ARN) {
        console.warn('⚠️  SNS_TOPIC_ARN not configured, skipping notifications');
        return;
    }
    
    try {
        const notification = {
            event: 'REGION_STATUS_CHANGED',
            timestamp: new Date().toISOString(),
            region: {
                regionId: region.regionId,
                regionName: region.regionName,
                regionNameArabic: region.regionNameArabic,
                regionType: region.region_type,
                governorate: region.governorate,
                status: region.status,
                previousStatus: change.oldStatus
            },
            affectedRegions: change.affectedRegions || [],
            affectedCount: change.affectedCount || 0,
            cascaded: change.cascaded || false
        };
        
        const message = {
            default: JSON.stringify(notification),
            // SMS notification for critical changes
            sms: `Region ${region.regionName} is now ${region.status}`,
            // Email notification
            email: `Region Status Update: ${region.regionName} (${region.regionNameArabic}) is now ${region.status}`,
            // HTTP notification (for webhooks)
            http: JSON.stringify(notification),
            https: JSON.stringify(notification)
        };
        
        await sns.publish({
            TopicArn: SNS_TOPIC_ARN,
            Message: JSON.stringify(message),
            MessageStructure: 'json',
            MessageAttributes: {
                event: {
                    DataType: 'String',
                    StringValue: 'REGION_STATUS_CHANGED'
                },
                regionId: {
                    DataType: 'String',
                    StringValue: region.regionId
                },
                status: {
                    DataType: 'String',
                    StringValue: region.status
                },
                cascaded: {
                    DataType: 'String',
                    StringValue: change.cascaded ? 'true' : 'false'
                }
            }
        }).promise();
        
        console.log('✅ Apps notified via SNS');
        
    } catch (error) {
        console.error('❌ Error sending notifications:', error);
        // Don't fail the request if notification fails
    }
}

// ============================================================================
// PHASE 6: MULTI-LANGUAGE SUPPORT
// ============================================================================

/**
 * Format region with multi-language labels
 * Returns both English and Arabic names
 */
function formatRegionWithMultiLanguage(region, language = 'en') {
    const formatted = {
        ...region,
        name: language === 'ar' ? region.regionNameArabic : region.regionName,
        nameEn: region.regionName,
        nameAr: region.regionNameArabic,
        typeLabel: getRegionTypeLabel(region.region_type, language),
        statusLabel: getStatusLabel(region.status, language)
    };
    
    return formatted;
}

/**
 * Get localized region type label
 */
function getRegionTypeLabel(type, language = 'en') {
    const labels = {
        [REGION_TYPE.PROVINCE]: {
            en: 'Province',
            ar: 'محافظة'
        },
        [REGION_TYPE.DISTRICT]: {
            en: 'District',
            ar: 'قضاء'
        },
        [REGION_TYPE.NEIGHBORHOOD]: {
            en: 'Neighborhood',
            ar: 'حي'
        }
    };
    
    return labels[type]?.[language] || type;
}

/**
 * Get localized status label
 */
function getStatusLabel(status, language = 'en') {
    const labels = {
        [REGION_STATUS.ACTIVE]: {
            en: 'Active',
            ar: 'نشط'
        },
        [REGION_STATUS.INACTIVE]: {
            en: 'Inactive',
            ar: 'غير نشط'
        }
    };
    
    return labels[status]?.[language] || status;
}

// ============================================================================
// PHASE 6: CORE API ENDPOINTS
// ============================================================================

/**
 * ENDPOINT: GET /regions/:id
 * Returns region with status and hierarchical data
 * Serves Customer, Driver, and Merchant apps
 */
async function getRegionById(regionId, options = {}) {
    console.log('🔍 Getting region by ID:', regionId);
    
    try {
        // PHASE 6: Validate region ID
        validateRegionId(regionId);
        
        const params = {
            TableName: TABLE_NAME,
            Key: { regionId }
        };
        
        const result = await docClient.get(params).promise();
        
        if (!result.Item) {
            throw new Error(`Region ${regionId} not found`);
        }
        
        let region = result.Item;
        
        // PHASE 6: Apply multi-language formatting
        const language = options.language || 'en';
        region = formatRegionWithMultiLanguage(region, language);
        
        // PHASE 6: Include hierarchical data if requested
        if (options.includeHierarchy) {
            region.hierarchy = await buildRegionHierarchy(region);
        }
        
        // PHASE 6: Include parent data if requested
        if (options.includeParent && region.parent_id) {
            region.parent = await getRegionById(region.parent_id, { language });
        }
        
        // PHASE 6: Include children if requested
        if (options.includeChildren) {
            region.children = await getChildRegions(regionId, { language });
        }
        
        // PHASE 6: Sanitize for app consumption
        if (options.sanitize !== false) {
            region = sanitizeRegionForApps(region);
        }
        
        console.log('✅ Region retrieved:', region.name);
        return region;
        
    } catch (error) {
        console.error('❌ Error getting region:', error);
        throw error;
    }
}

/**
 * Build complete hierarchy for a region
 */
async function buildRegionHierarchy(region) {
    const hierarchy = {
        self: region,
        parent: null,
        grandparent: null,
        children: [],
        descendants: []
    };
    
    // Get parent
    if (region.parent_id) {
        try {
            hierarchy.parent = await getRegionById(region.parent_id, { sanitize: false });
            
            // Get grandparent
            if (hierarchy.parent.parent_id) {
                hierarchy.grandparent = await getRegionById(hierarchy.parent.parent_id, { sanitize: false });
            }
        } catch (error) {
            console.warn('⚠️  Could not load parent:', error.message);
        }
    }
    
    // Get all descendants
    try {
        hierarchy.descendants = await getAllDescendants(region.regionId);
        hierarchy.children = hierarchy.descendants.filter(d => d.parent_id === region.regionId);
    } catch (error) {
        console.warn('⚠️  Could not load descendants:', error.message);
    }
    
    return hierarchy;
}

/**
 * Get all descendants recursively
 */
async function getAllDescendants(parentId) {
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
    
    // Recursively get grandchildren
    const descendants = [...children];
    for (const child of children) {
        const grandchildren = await getAllDescendants(child.regionId);
        descendants.push(...grandchildren);
    }
    
    return descendants;
}

/**
 * Get child regions
 */
async function getChildRegions(parentId, options = {}) {
    const params = {
        TableName: TABLE_NAME,
        IndexName: 'ParentIdIndex',
        KeyConditionExpression: 'parent_id = :parentId',
        ExpressionAttributeValues: {
            ':parentId': parentId
        }
    };
    
    const result = await docClient.query(params).promise();
    let children = result.Items || [];
    
    // Apply multi-language formatting
    if (options.language) {
        children = children.map(c => formatRegionWithMultiLanguage(c, options.language));
    }
    
    return children;
}

/**
 * ENDPOINT: GET /regions/active
 * Returns all active regions for caching
 * Optimized for app consumption
 */
async function getActiveRegions(options = {}) {
    console.log('✅ Getting active regions');
    
    try {
        const params = {
            TableName: TABLE_NAME,
            FilterExpression: '#status = :active',
            ExpressionAttributeNames: {
                '#status': 'status'
            },
            ExpressionAttributeValues: {
                ':active': REGION_STATUS.ACTIVE
            }
        };
        
        const result = await docClient.scan(params).promise();
        let regions = result.Items || [];
        
        // PHASE 6: Apply filters
        if (options.region_type) {
            regions = regions.filter(r => r.region_type === options.region_type);
        }
        
        if (options.governorate) {
            regions = regions.filter(r => r.governorate === options.governorate);
        }
        
        // PHASE 6: Multi-language support
        const language = options.language || 'en';
        regions = regions.map(r => formatRegionWithMultiLanguage(r, language));
        
        // PHASE 6: Sanitize for apps
        regions = regions.map(r => sanitizeRegionForApps(r));
        
        // PHASE 6: Build hierarchy if requested
        if (options.includeHierarchy) {
            const provinces = regions.filter(r => r.region_type === REGION_TYPE.PROVINCE);
            const districts = regions.filter(r => r.region_type === REGION_TYPE.DISTRICT);
            const neighborhoods = regions.filter(r => r.region_type === REGION_TYPE.NEIGHBORHOOD);
            
            const hierarchy = provinces.map(province => ({
                ...province,
                children: districts
                    .filter(d => d.parent_id === province.regionId)
                    .map(district => ({
                        ...district,
                        children: neighborhoods.filter(n => n.parent_id === district.regionId)
                    }))
            }));
            
            return {
                hierarchy,
                metadata: {
                    total: regions.length,
                    provinces: provinces.length,
                    districts: districts.length,
                    neighborhoods: neighborhoods.length,
                    language,
                    generatedAt: new Date().toISOString(),
                    cacheFor: 300 // Recommend 5 minute cache
                }
            };
        }
        
        console.log(`✅ Found ${regions.length} active regions`);
        
        return {
            regions,
            metadata: {
                total: regions.length,
                language,
                generatedAt: new Date().toISOString(),
                cacheFor: 300
            }
        };
        
    } catch (error) {
        console.error('❌ Error getting active regions:', error);
        throw error;
    }
}

/**
 * ENDPOINT: PATCH /regions/:id/status
 * Update region status with cascading and validation
 * PHASE 6: Full validation, logging, and notifications
 */
async function updateRegionStatus(regionId, newStatus, adminUser, options = {}) {
    console.log('🔄 Updating region status:', regionId, '→', newStatus);
    
    try {
        // PHASE 6: Validate inputs
        validateRegionId(regionId);
        validateStatus(newStatus);
        validateAdminUser(adminUser);
        
        // Get current region
        const currentRegion = await getRegionById(regionId, { sanitize: false });
        const oldStatus = currentRegion.status;
        
        // Check if status is actually changing
        if (oldStatus === newStatus) {
            return {
                success: true,
                message: 'Status unchanged',
                region: currentRegion,
                affectedRegions: [],
                affectedCount: 0
            };
        }
        
        // PHASE 6: Enforce cascading rules
        let validationResult;
        
        if (newStatus === REGION_STATUS.INACTIVE) {
            // Deactivating: Check if has children
            const children = await getChildRegions(regionId);
            if (children.length > 0) {
                console.log(`⚠️  Deactivating parent will cascade to ${children.length} children`);
            }
            validationResult = { valid: true, cascadeRequired: children.length > 0 };
            
        } else if (newStatus === REGION_STATUS.ACTIVE) {
            // Activating: Validate parent chain
            validationResult = await validateParentChainActive(currentRegion);
            if (!validationResult.valid) {
                throw new Error(validationResult.message);
            }
        }
        
        // Use RegionService for the actual update (handles cascading)
        const result = await regionService.toggleRegionStatus(regionId, newStatus);
        
        // PHASE 6: Log the status change
        const change = {
            action: newStatus === REGION_STATUS.ACTIVE ? 'ACTIVATE' : 'DEACTIVATE',
            oldStatus,
            newStatus,
            affectedRegions: result.affectedRegions?.regions || [],
            affectedCount: result.affectedRegions?.total || 1,
            cascaded: result.affectedRegions?.total > 1,
            reason: options.reason || 'Manual update'
        };
        
        await logRegionStatusChange(regionId, change, adminUser);
        
        // PHASE 6: Notify apps
        await notifyAppsOfStatusChange(result.region, change);
        
        console.log('✅ Status updated successfully');
        
        return {
            success: true,
            message: `Status changed from ${oldStatus} to ${newStatus}`,
            region: result.region,
            affectedRegions: result.affectedRegions?.regions || [],
            affectedCount: result.affectedRegions?.total || 1,
            cascaded: change.cascaded,
            logged: true,
            notified: true
        };
        
    } catch (error) {
        console.error('❌ Error updating region status:', error);
        
        // PHASE 6: Log failed attempt
        if (adminUser) {
            await logRegionStatusChange(regionId, {
                action: 'FAILED_UPDATE',
                oldStatus: 'unknown',
                newStatus,
                error: error.message,
                reason: options.reason
            }, adminUser);
        }
        
        throw error;
    }
}

/**
 * Validate that entire parent chain is active
 * PHASE 6: Enforces cascading rules
 */
async function validateParentChainActive(region) {
    console.log('🔍 Validating parent chain for:', region.regionId);
    
    // Province has no parent
    if (!region.parent_id) {
        return { valid: true };
    }
    
    try {
        // Check parent
        const parent = await getRegionById(region.parent_id, { sanitize: false });
        
        if (parent.status !== REGION_STATUS.ACTIVE) {
            return {
                valid: false,
                message: `Cannot activate ${region.regionName}: Parent ${parent.regionName} (${parent.regionType}) is ${parent.status}`
            };
        }
        
        // Check grandparent if exists
        if (parent.parent_id) {
            const grandparent = await getRegionById(parent.parent_id, { sanitize: false });
            
            if (grandparent.status !== REGION_STATUS.ACTIVE) {
                return {
                    valid: false,
                    message: `Cannot activate ${region.regionName}: Grandparent ${grandparent.regionName} (Province) is ${grandparent.status}`
                };
            }
        }
        
        return { valid: true };
        
    } catch (error) {
        return {
            valid: false,
            message: `Parent validation failed: ${error.message}`
        };
    }
}

// ============================================================================
// PHASE 6: LAMBDA HANDLER
// ============================================================================

/**
 * Main Lambda handler for Central Platform Region API
 * Serves Customer, Driver, and Merchant apps
 */
exports.handler = async (event) => {
    console.log('📨 Central Platform Region API - Event:', JSON.stringify(event, null, 2));
    
    try {
        const { httpMethod, pathParameters, queryStringParameters, body, headers, requestContext } = event;
        const regionId = pathParameters?.id;
        const path = event.path || '';
        
        // Extract language preference
        const language = headers?.['Accept-Language']?.startsWith('ar') ? 'ar' : 'en';
        
        // Extract admin user context (from JWT or API key)
        const adminUser = {
            userId: requestContext?.authorizer?.claims?.sub || 'system',
            email: requestContext?.authorizer?.claims?.email || 'system@wizz.com',
            name: requestContext?.authorizer?.claims?.name || 'System',
            ipAddress: requestContext?.identity?.sourceIp || 'unknown',
            userAgent: headers?.['User-Agent'] || 'unknown'
        };
        
        let response;
        
        // Route handling
        if (httpMethod === 'GET') {
            // GET /regions/active
            if (path.includes('/active') || pathParameters?.action === 'active') {
                response = await getActiveRegions({
                    ...queryStringParameters,
                    language
                });
            }
            // GET /regions/:id/logs
            else if (path.includes('/logs') || pathParameters?.action === 'logs') {
                response = await getRegionLogs(regionId);
            }
            // GET /regions/:id
            else if (regionId) {
                response = await getRegionById(regionId, {
                    includeHierarchy: queryStringParameters?.includeHierarchy === 'true',
                    includeParent: queryStringParameters?.includeParent === 'true',
                    includeChildren: queryStringParameters?.includeChildren === 'true',
                    language
                });
            }
            // GET /regions (not implemented in this handler)
            else {
                throw new Error('Use GET /regions/active for listing regions');
            }
        }
        // PATCH /regions/:id/status
        else if (httpMethod === 'PATCH' && path.includes('/status')) {
            const { status, reason } = JSON.parse(body || '{}');
            response = await updateRegionStatus(regionId, status, adminUser, { reason });
        }
        // Unsupported method
        else {
            throw new Error(`Unsupported method: ${httpMethod} ${path}`);
        }
        
        // PHASE 6: Consistent JSON response structure
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
                'Cache-Control': path.includes('/active') ? 'max-age=300' : 'no-cache',
                'X-API-Version': '1.0.0',
                'X-Content-Language': language
            },
            body: JSON.stringify({
                success: true,
                data: response,
                timestamp: new Date().toISOString(),
                language
            })
        };
        
    } catch (error) {
        console.error('❌ Central Platform API Error:', error);
        
        // PHASE 6: Consistent error response
        return {
            statusCode: error.message.includes('not found') ? 404 : 
                       error.message.includes('Invalid') ? 400 :
                       error.message.includes('Cannot activate') ? 422 : 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS'
            },
            body: JSON.stringify({
                success: false,
                error: {
                    message: error.message,
                    code: error.code || 'UNKNOWN_ERROR',
                    timestamp: new Date().toISOString()
                }
            })
        };
    }
};

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
    // Core endpoints
    getRegionById,
    getActiveRegions,
    updateRegionStatus,
    
    // Validation
    validateRegionId,
    validateStatus,
    validateAdminUser,
    validateParentChainActive,
    
    // Logging
    logRegionStatusChange,
    getRegionLogs,
    
    // Notifications
    notifyAppsOfStatusChange,
    
    // Multi-language
    formatRegionWithMultiLanguage,
    getRegionTypeLabel,
    getStatusLabel,
    
    // Utilities
    sanitizeRegionForApps,
    buildRegionHierarchy,
    getAllDescendants,
    getChildRegions,
    
    // Lambda handler
    handler: exports.handler
};
