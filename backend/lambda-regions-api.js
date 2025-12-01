/**
 * WizzCentral Platform - Regions API Lambda Handler
 * Handles all CRUD operations for service regions with polygon boundaries
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, QueryCommand, ScanCommand, PutCommand, DeleteCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

// Configure AWS SDK
const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const dynamoDB = DynamoDBDocumentClient.from(ddbClient);

const REGIONS_TABLE = process.env.REGIONS_TABLE || 'WizzCentral_Regions';

// CORS is now handled at Lambda Function URL level (not in handler)
// Response helper
function response(statusCode, body, event) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
    };
}

// Validate polygon boundary
function validatePolygonBoundary(boundary) {
    if (!boundary || typeof boundary !== 'object') {
        return { valid: false, error: 'BOUNDARY_MISSING', message: 'boundary field is required' };
    }
    if (boundary.type !== 'Polygon') {
        return { valid: false, error: 'BOUNDARY_TYPE_INVALID', message: 'boundary.type must be "Polygon"' };
    }
    if (!Array.isArray(boundary.coordinates) || boundary.coordinates.length === 0) {
        return { valid: false, error: 'BOUNDARY_COORDS_INVALID', message: 'boundary.coordinates must be a non-empty array' };
    }
    
    const ring = boundary.coordinates[0];
    if (!Array.isArray(ring) || ring.length < 4) {
        return { valid: false, error: 'BOUNDARY_RING_TOO_SHORT', message: 'Polygon ring must have at least 4 points (3 unique + closing point)' };
    }
    
    // Validate each point
    for (let i = 0; i < ring.length; i++) {
        const pt = ring[i];
        if (!Array.isArray(pt) || pt.length !== 2) {
            return { valid: false, error: 'BOUNDARY_POINT_INVALID', message: `Point ${i} must be [lng, lat]` };
        }
        const [lng, lat] = pt;
        if (typeof lng !== 'number' || typeof lat !== 'number') {
            return { valid: false, error: 'BOUNDARY_COORDS_TYPE', message: `Point ${i} coordinates must be numbers` };
        }
        if (lng < -180 || lng > 180 || lat < -90 || lat > 90) {
            return { valid: false, error: 'BOUNDARY_COORDS_RANGE', message: `Point ${i} coordinates out of range` };
        }
    }
    
    // Verify ring is closed
    const first = ring[0];
    const last = ring[ring.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
        return { valid: false, error: 'BOUNDARY_RING_NOT_CLOSED', message: 'Polygon ring must be closed (first point === last point)' };
    }
    
    return { valid: true };
}

// Point-in-polygon test
function pointInPolygon(lat, lng, boundary) {
    if (!boundary || boundary.type !== 'Polygon') return false;
    const ring = boundary.coordinates[0];
    if (!ring || ring.length < 4) return false;
    
    let inside = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        const [xi, yi] = ring[i];
        const [xj, yj] = ring[j];
        const intersect = ((yi > lat) !== (yj > lat)) && (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// Parse path and method from Lambda event
function parseRequest(event) {
    // Handle different event formats (ALB, API Gateway, Function URL)
    const httpMethod = event.httpMethod || event.requestContext?.http?.method || 'GET';
    const rawPath = event.path || event.rawPath || event.requestContext?.http?.path || '/';
    const queryParams = event.queryStringParameters || {};
    const body = event.body ? (typeof event.body === 'string' ? JSON.parse(event.body) : event.body) : {};
    
    // Extract path segments
    const pathMatch = rawPath.match(/^\/(?:api\/)?regions\/?(.*)$/);
    const pathSegments = pathMatch ? pathMatch[1].split('/').filter(Boolean) : [];
    
    return { httpMethod, pathSegments, queryParams, body };
}

// Main handler
exports.handler = async (event, context) => {
    console.log('Regions API invoked:', JSON.stringify({ 
        httpMethod: event.httpMethod || event.requestContext?.http?.method,
        path: event.path || event.rawPath,
        queryParams: event.queryStringParameters 
    }));
    
    try {
        // Handle OPTIONS preflight
        if (event.requestContext?.http?.method === 'OPTIONS' || event.httpMethod === 'OPTIONS') {
            return response(200, { message: 'CORS OK' }, event);
        }
        
        const { httpMethod, pathSegments, queryParams, body } = parseRequest(event);
        
        // Route handling
        if (httpMethod === 'GET' && pathSegments.length === 0) {
            return await listRegions(queryParams, event);
        } else if (httpMethod === 'POST' && pathSegments.length === 0) {
            return await createRegion(body, event);
        } else if (httpMethod === 'GET' && pathSegments.length === 1) {
            return await getRegion(pathSegments[0], event);
        } else if (httpMethod === 'PUT' && pathSegments.length === 1) {
            return await updateRegion(pathSegments[0], body, event);
        } else if (httpMethod === 'DELETE' && pathSegments.length === 1) {
            return await deleteRegion(pathSegments[0], event);
        } else if (httpMethod === 'PATCH' && pathSegments.length === 2 && pathSegments[1] === 'toggle') {
            return await toggleRegion(pathSegments[0], event);
        }
        
        return response(404, { error: 'NOT_FOUND', message: 'Route not found' }, event);
        
    } catch (error) {
        console.error('Handler error:', error);
        return response(500, { 
            error: 'INTERNAL_ERROR', 
            message: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }, event);
    }
};

// List regions with pagination and filtering
async function listRegions(queryParams, event) {
    const { pageMode, limit: limitStr, nextToken, contains, level, parent_id, is_active, search } = queryParams;
    const limit = parseInt(limitStr) || 10;
    
    let items = [];
    let lastKey = null;
    
    // Build FilterExpression for DynamoDB
    const filterParts = [];
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    if (level !== undefined) {
        const levelNum = parseInt(level);
        filterParts.push('(#level = :level OR level_n = :level)');
        expressionAttributeNames['#level'] = 'level';
        expressionAttributeValues[':level'] = levelNum;
    }
    
    if (parent_id) {
        filterParts.push('parent_id = :parent_id');
        expressionAttributeValues[':parent_id'] = parent_id;
    }
    
    if (is_active !== undefined) {
        const activeVal = is_active === 'true';
        filterParts.push('is_active = :is_active');
        expressionAttributeValues[':is_active'] = activeVal;
    }
    
    // Server-side pagination mode
    if (pageMode === 'server') {
        // Decode start key if provided
        let exclusiveStartKey = null;
        if (nextToken) {
            try {
                exclusiveStartKey = JSON.parse(Buffer.from(nextToken, 'base64').toString());
            } catch (e) {
                return response(400, { error: 'INVALID_TOKEN', message: 'Invalid nextToken' }, event);
            }
        }

        // Accumulate items matching all filters (including search/contains) until we reach `limit` or the table is exhausted
        const pageItems = [];
        let safety = 0; // guard against excessive loops
        let lastEvaluatedKey = exclusiveStartKey || null;

        // Pre-parse contains if present
        let containsLatLng = null;
        if (contains) {
            const [latStr, lngStr] = String(contains).split(',');
            const lat = parseFloat(latStr);
            const lng = parseFloat(lngStr);
            if (!isNaN(lat) && !isNaN(lng)) containsLatLng = { lat, lng };
        }

        while (pageItems.length < limit && safety < 50) {
            const scanParams = { TableName: REGIONS_TABLE, Limit: Math.max(limit, 25) };
            if (lastEvaluatedKey) scanParams.ExclusiveStartKey = lastEvaluatedKey;
            if (filterParts.length > 0) {
                scanParams.FilterExpression = filterParts.join(' AND ');
                if (Object.keys(expressionAttributeNames).length > 0) {
                    scanParams.ExpressionAttributeNames = expressionAttributeNames;
                }
                scanParams.ExpressionAttributeValues = expressionAttributeValues;
            }
            const result = await dynamoDB.send(new ScanCommand(scanParams));
            const batch = (result.Items || []).filter(r => {
                // Apply search filter if provided
                if (search) {
                    const s = String(search).toLowerCase();
                    const n1 = String(r.name || '').toLowerCase();
                    const n2 = String(r.name_ar || '').toLowerCase();
                    if (!(n1.includes(s) || n2.includes(s))) return false;
                }
                // Apply point-in-polygon filter if provided
                if (containsLatLng) {
                    if (!pointInPolygon(containsLatLng.lat, containsLatLng.lng, r.boundary)) return false;
                }
                return true;
            });

            for (const r of batch) {
                pageItems.push(r);
                if (pageItems.length >= limit) break;
            }

            lastEvaluatedKey = result.LastEvaluatedKey || null;
            if (!lastEvaluatedKey) break; // no more data
            safety++;
        }

        items = pageItems;
        lastKey = (items.length >= limit) ? lastEvaluatedKey : null;
    } else {
        // Fetch all (client-side pagination)
        let scanResult;
        do {
            const scanParams = { TableName: REGIONS_TABLE };
            if (scanResult?.LastEvaluatedKey) {
                scanParams.ExclusiveStartKey = scanResult.LastEvaluatedKey;
            }
            scanResult = await dynamoDB.send(new ScanCommand(scanParams));
            items = items.concat(scanResult.Items || []);
        } while (scanResult.LastEvaluatedKey);
        
        // Apply filters client-side for fetch-all mode
        if (level !== undefined) {
            const levelNum = parseInt(level);
            items = items.filter(r => r.level === levelNum || r.level_n === levelNum);
        }
        
        if (parent_id) {
            items = items.filter(r => r.parent_id === parent_id);
        }
        
        if (is_active !== undefined) {
            const activeVal = is_active === 'true';
            items = items.filter(r => r.is_active === activeVal);
        }
    }
    
    // Apply client-side only filters (search and point-in-polygon) when not in server mode
    if (pageMode !== 'server' && search) {
        const searchLower = search.toLowerCase();
        items = items.filter(r => 
            (r.name || '').toLowerCase().includes(searchLower) ||
            (r.name_ar || '').toLowerCase().includes(searchLower)
        );
    }
    
    if (pageMode !== 'server' && contains) {
        const [latStr, lngStr] = contains.split(',');
        const lat = parseFloat(latStr);
        const lng = parseFloat(lngStr);
        if (!isNaN(lat) && !isNaN(lng)) {
            items = items.filter(r => pointInPolygon(lat, lng, r.boundary));
        }
    }
    
    // Build response
    const responseData = {
        items,
        total: items.length
    };
    
    if (pageMode === 'server' && lastKey) {
        responseData.nextToken = Buffer.from(JSON.stringify(lastKey)).toString('base64');
    }
    
    return response(200, responseData, event);
}

// Get single region
async function getRegion(regionId, event) {
    const result = await dynamoDB.send(new GetCommand({
        TableName: REGIONS_TABLE,
        Key: { regionId }
    }));
    
    if (!result.Item) {
        return response(404, { error: 'NOT_FOUND', message: 'Region not found' }, event);
    }
    
    return response(200, result.Item, event);
}

// Create region
async function createRegion(data, event) {
    // ✅ Accept both 'geometry' (new) and 'boundary' (legacy) from frontend
    const { regionId, name, name_ar, level, parent_id, geometry, boundary, service_config, delivery_config } = data;
    
    // Use geometry if provided, otherwise fallback to boundary (for backward compatibility)
    const geomData = geometry || boundary;
    
    // Validate required fields
    if (!regionId || !name) {
        return response(400, { error: 'MISSING_FIELDS', message: 'regionId and name are required' }, event);
    }
    
    if (level === undefined || level === null) {
        return response(400, { error: 'MISSING_LEVEL', message: 'level is required' }, event);
    }
    
    // Validate geometry
    const validation = validatePolygonBoundary(geomData);
    if (!validation.valid) {
        return response(400, { error: validation.error, message: validation.message }, event);
    }
    
    // Check for duplicate
    const existing = await dynamoDB.send(new GetCommand({
        TableName: REGIONS_TABLE,
        Key: { regionId }
    }));
    
    if (existing.Item) {
        return response(409, { error: 'ALREADY_EXISTS', message: 'Region with this ID already exists' }, event);
    }
    
    // Create item
    const now = new Date().toISOString();
    const nameLower = name.toLowerCase();
    const item = {
        regionId,
        name,
        name_ar: name_ar || '',
        level,
        level_n: level,
        parent_id: parent_id || null,
        geometry: geomData,  // ✅ Save geometry directly from frontend
        is_active: true,
        is_active_s: 'true',
        name_lower: nameLower,
        name_ar_lower: (name_ar || '').toLowerCase(),
        level_name: `L#${level}#N#${nameLower}`,
        level_updated_at: `L#${level}#U#${now}`,
        service_config: service_config || {},
        delivery_config: delivery_config || {},
        createdAt: now,
        updatedAt: now,
        updated_at: now
    };
    
    await dynamoDB.send(new PutCommand({
        TableName: REGIONS_TABLE,
        Item: item
    }));
    
    return response(201, item, event);
}

// Update region
async function updateRegion(regionId, data, event) {
    // Get existing region
    const existing = await dynamoDB.send(new GetCommand({
        TableName: REGIONS_TABLE,
        Key: { regionId }
    }));
    
    if (!existing.Item) {
        return response(404, { error: 'NOT_FOUND', message: 'Region not found' }, event);
    }
    
    // ✅ Accept both 'geometry' (new) and 'boundary' (legacy)
    const geomData = data.geometry || data.boundary;
    
    // If geometry is being updated, validate it
    if (geomData) {
        const validation = validatePolygonBoundary(geomData);
        if (!validation.valid) {
            return response(400, { error: validation.error, message: validation.message }, event);
        }
    }
    
    // Build update expression
    const now = new Date().toISOString();
    const updateExpr = [];
    const exprNames = {};
    const exprValues = {};
    
    // ✅ Updated to accept 'geometry' directly, with 'boundary' as fallback
    const updatableFields = ['name', 'name_ar', 'level', 'parent_id', 'geometry', 'boundary', 'is_active', 'service_config', 'delivery_config'];
    
    for (const field of updatableFields) {
        if (data[field] !== undefined) {
            // If both geometry and boundary exist, prefer geometry
            if (field === 'boundary' && data.geometry) {
                continue; // Skip boundary if geometry is provided
            }
            
            // Map 'boundary' to 'geometry' for backward compatibility
            const targetField = field === 'boundary' ? 'geometry' : field;
            updateExpr.push(`#${targetField} = :${targetField}`);
            exprNames[`#${targetField}`] = targetField;
            exprValues[`:${targetField}`] = data[field];
        }
    }
    
    // Update helper attributes if relevant fields changed
    if (data.name) {
        const nameLower = data.name.toLowerCase();
        updateExpr.push('#name_lower = :name_lower');
        exprNames['#name_lower'] = 'name_lower';
        exprValues[':name_lower'] = nameLower;
        
        if (data.level !== undefined) {
            updateExpr.push('#level_name = :level_name');
            exprNames['#level_name'] = 'level_name';
            exprValues[':level_name'] = `L#${data.level}#N#${nameLower}`;
        }
    }
    
    if (data.level !== undefined) {
        updateExpr.push('#level_n = :level_n', '#level_updated_at = :level_updated_at');
        exprNames['#level_n'] = 'level_n';
        exprNames['#level_updated_at'] = 'level_updated_at';
        exprValues[':level_n'] = data.level;
        exprValues[':level_updated_at'] = `L#${data.level}#U#${now}`;
    }
    
    if (data.is_active !== undefined) {
        updateExpr.push('#is_active_s = :is_active_s');
        exprNames['#is_active_s'] = 'is_active_s';
        exprValues[':is_active_s'] = data.is_active ? 'true' : 'false';
    }
    
    updateExpr.push('#updatedAt = :updatedAt', '#updated_at = :updated_at');
    exprNames['#updatedAt'] = 'updatedAt';
    exprNames['#updated_at'] = 'updated_at';
    exprValues[':updatedAt'] = now;
    exprValues[':updated_at'] = now;
    
    const result = await dynamoDB.send(new UpdateCommand({
        TableName: REGIONS_TABLE,
        Key: { regionId },
        UpdateExpression: `SET ${updateExpr.join(', ')}`,
        ExpressionAttributeNames: exprNames,
        ExpressionAttributeValues: exprValues,
        ReturnValues: 'ALL_NEW'
    }));
    
    return response(200, result.Attributes, event);
}

// Delete region
async function deleteRegion(regionId, event) {
    await dynamoDB.send(new DeleteCommand({
        TableName: REGIONS_TABLE,
        Key: { regionId }
    }));
    
    return response(200, { message: 'Region deleted successfully' }, event);
}

// Toggle region active status
async function toggleRegion(regionId, event) {
    const existing = await dynamoDB.send(new GetCommand({
        TableName: REGIONS_TABLE,
        Key: { regionId }
    }));
    
    if (!existing.Item) {
        return response(404, { error: 'NOT_FOUND', message: 'Region not found' }, event);
    }
    
    const newStatus = !existing.Item.is_active;
    const now = new Date().toISOString();
    
    const result = await dynamoDB.send(new UpdateCommand({
        TableName: REGIONS_TABLE,
        Key: { regionId },
        UpdateExpression: 'SET is_active = :status, is_active_s = :status_s, #level_updated_at = :level_updated_at, #updatedAt = :updatedAt, #updated_at = :updated_at',
        ExpressionAttributeNames: {
            '#level_updated_at': 'level_updated_at',
            '#updatedAt': 'updatedAt',
            '#updated_at': 'updated_at'
        },
        ExpressionAttributeValues: {
            ':status': newStatus,
            ':status_s': newStatus ? 'true' : 'false',
            ':level_updated_at': `L#${existing.Item.level}#U#${now}`,
            ':updatedAt': now,
            ':updated_at': now
        },
        ReturnValues: 'ALL_NEW'
    }));
    
    return response(200, result.Attributes, event);
}
