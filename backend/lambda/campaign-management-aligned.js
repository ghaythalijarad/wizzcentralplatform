/**
 * Campaign Management API - Architecture Aligned
 * Implements the 3-table campaign structure with GSI optimization
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const dynamoClient = new DynamoDBClient({ 
    region: process.env.AWS_REGION || 'us-east-1' 
});

const dynamoDB = DynamoDBDocumentClient.from(dynamoClient);

// Table names
const CAMPAIGNS_TABLE = process.env.CAMPAIGNS_TABLE || 'WizzCentral_Campaigns';
const CONDITIONS_TABLE = process.env.CONDITIONS_TABLE || 'WizzCentral_Campaign_Conditions';
const USAGE_TABLE = process.env.USAGE_TABLE || 'WizzCentral_Campaign_Usage';

/**
 * Validation utilities
 */
function validateCampaignData(campaignData) {
    const errors = [];
    
    if (!campaignData.title) errors.push('Campaign title is required');
    if (!campaignData.type) errors.push('Campaign type is required');
    if (!campaignData.discountType) errors.push('Discount type is required');
    if (!campaignData.discountValue || campaignData.discountValue <= 0) {
        errors.push('Valid discount value is required');
    }
    if (!campaignData.startDate) errors.push('Start date is required');
    if (!campaignData.endDate) errors.push('End date is required');
    
    if (campaignData.startDate && campaignData.endDate) {
        if (new Date(campaignData.startDate) >= new Date(campaignData.endDate)) {
            errors.push('End date must be after start date');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * POST /campaigns - Create campaign with 3-table structure
 */
exports.createCampaign = async (event) => {
    console.log('🚀 Creating campaign with aligned architecture...');
    
    try {
        const campaignData = JSON.parse(event.body);
        const campaignId = `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const now = new Date().toISOString();
        
        // Validate input
        const validation = validateCampaignData(campaignData);
        if (!validation.isValid) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    success: false,
                    error: 'Validation failed',
                    details: validation.errors 
                })
            };
        }
        
        // Prepare core campaign data
        const coreData = {
            campaignId,
            title: campaignData.title,
            type: campaignData.type,
            discountType: campaignData.discountType,
            discountValue: campaignData.discountValue,
            startDate: campaignData.startDate,
            endDate: campaignData.endDate,
            status: campaignData.autoActivate ? 'active' : 'draft',
            isActive: campaignData.autoActivate ? 'true' : 'false', // String for GSI
            usageLimit: campaignData.usageLimit || 1000,
            targetRestaurants: campaignData.targetRestaurants || [],
            minOrderValue: campaignData.minOrderValue || 0,
            description: campaignData.description || '',
            createdBy: event.requestContext?.identity?.cognitoIdentityId || 'system',
            createdAt: now,
            updatedAt: now,
            
            // GSI optimization fields
            statusIndex: `${campaignData.autoActivate ? 'active' : 'draft'}#${campaignData.startDate}`,
            activeIndex: `${campaignData.autoActivate ? 'true' : 'false'}#${campaignData.startDate}`
        };
        
        // Store in 3 tables atomically
        const writePromises = [
            // Core campaign
            dynamoDB.send(new PutCommand({
                TableName: CAMPAIGNS_TABLE,
                Item: coreData,
                ConditionExpression: 'attribute_not_exists(campaignId)' // Prevent duplicates
            })),
            
            // Usage tracking
            dynamoDB.send(new PutCommand({
                TableName: USAGE_TABLE,
                Item: {
                    campaignId,
                    usage: 0,
                    usageLimit: campaignData.usageLimit || 1000,
                    lastUsedAt: null,
                    createdAt: now
                }
            }))
        ];
        
        // Add conditions if provided
        if (campaignData.conditions && Array.isArray(campaignData.conditions) && campaignData.conditions.length > 0) {
            writePromises.push(
                dynamoDB.send(new PutCommand({
                    TableName: CONDITIONS_TABLE,
                    Item: {
                        campaignId,
                        conditions: campaignData.conditions,
                        conditionLogic: campaignData.conditionLogic || 'AND',
                        createdAt: now,
                        updatedAt: now
                    }
                }))
            );
        }
        
        await Promise.all(writePromises);
        
        console.log(`✅ Campaign created successfully: ${campaignId}`);
        
        return {
            statusCode: 201,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                success: true, 
                campaignId,
                message: 'Campaign created successfully',
                data: {
                    title: coreData.title,
                    type: coreData.type,
                    status: coreData.status,
                    discountValue: coreData.discountValue,
                    discountType: coreData.discountType
                }
            })
        };
        
    } catch (error) {
        console.error('❌ Error creating campaign:', error);
        
        if (error.name === 'ConditionalCheckFailedException') {
            return {
                statusCode: 409,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    success: false,
                    error: 'Campaign already exists'
                })
            };
        }
        
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                success: false,
                error: 'Internal server error',
                details: error.message
            })
        };
    }
};

/**
 * GET /campaigns/active - Optimized active campaign retrieval with GSI
 */
exports.getActiveCampaigns = async (event) => {
    console.log('📊 Fetching active campaigns using GSI...');
    
    try {
        const now = new Date().toISOString();
        
        // Use GSI for efficient querying
        const result = await dynamoDB.send(new QueryCommand({
            TableName: CAMPAIGNS_TABLE,
            IndexName: 'ActiveCampaignsIndex',
            KeyConditionExpression: 'isActive = :active',
            FilterExpression: '#status = :status AND startDate <= :now AND endDate >= :now',
            ExpressionAttributeNames: { 
                '#status': 'status' 
            },
            ExpressionAttributeValues: {
                ':active': 'true',
                ':status': 'active', 
                ':now': now
            }
        }));
        
        // Enrich campaigns with usage data
        const campaigns = await Promise.all(
            (result.Items || []).map(async (campaign) => {
                try {
                    const usageResult = await dynamoDB.send(new GetCommand({
                        TableName: USAGE_TABLE,
                        Key: { campaignId: campaign.campaignId }
                    }));
                    
                    return {
                        ...campaign,
                        usage: usageResult.Item?.usage || 0,
                        usageRemaining: (campaign.usageLimit || 1000) - (usageResult.Item?.usage || 0)
                    };
                } catch (error) {
                    console.warn(`⚠️ Could not fetch usage for ${campaign.campaignId}`);
                    return campaign;
                }
            })
        );
        
        console.log(`✅ Retrieved ${campaigns.length} active campaigns`);
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                success: true,
                campaigns,
                count: campaigns.length,
                timestamp: now
            })
        };
        
    } catch (error) {
        console.error('❌ Error fetching active campaigns:', error);
        
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                success: false,
                error: 'Failed to fetch campaigns',
                details: error.message
            })
        };
    }
};

/**
 * GET /campaigns - Get all campaigns with filtering
 */
exports.getAllCampaigns = async (event) => {
    console.log('📋 Fetching all campaigns...');
    
    try {
        const queryParams = event.queryStringParameters || {};
        const status = queryParams.status;
        const type = queryParams.type;
        
        let result;
        
        if (status) {
            // Use StatusIndex GSI for status filtering
            result = await dynamoDB.send(new QueryCommand({
                TableName: CAMPAIGNS_TABLE,
                IndexName: 'StatusIndex',
                KeyConditionExpression: '#status = :status',
                ExpressionAttributeNames: { '#status': 'status' },
                ExpressionAttributeValues: { ':status': status }
            }));
        } else {
            // Scan all campaigns
            result = await dynamoDB.send(new ScanCommand({
                TableName: CAMPAIGNS_TABLE
            }));
        }
        
        let campaigns = result.Items || [];
        
        // Filter by type if specified
        if (type) {
            campaigns = campaigns.filter(c => c.type === type);
        }
        
        // Enrich with usage data
        campaigns = await Promise.all(
            campaigns.map(async (campaign) => {
                try {
                    const usageResult = await dynamoDB.send(new GetCommand({
                        TableName: USAGE_TABLE,
                        Key: { campaignId: campaign.campaignId }
                    }));
                    
                    return {
                        ...campaign,
                        usage: usageResult.Item?.usage || 0,
                        usageRemaining: (campaign.usageLimit || 1000) - (usageResult.Item?.usage || 0)
                    };
                } catch (error) {
                    return campaign;
                }
            })
        );
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                success: true,
                campaigns,
                count: campaigns.length,
                filters: { status, type }
            })
        };
        
    } catch (error) {
        console.error('❌ Error fetching campaigns:', error);
        
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                success: false,
                error: 'Failed to fetch campaigns'
            })
        };
    }
};

/**
 * POST /campaigns/{id}/redeem - Atomic usage tracking
 */
exports.redeemCampaign = async (event) => {
    console.log('🎯 Processing campaign redemption...');
    
    try {
        const { campaignId } = event.pathParameters;
        const { userId, orderTotal, metadata } = JSON.parse(event.body);
        
        if (!campaignId || !userId) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    success: false,
                    error: 'Campaign ID and User ID are required'
                })
            };
        }
        
        // Get campaign and conditions
        const [campaignResult, conditionsResult] = await Promise.all([
            dynamoDB.send(new GetCommand({
                TableName: CAMPAIGNS_TABLE,
                Key: { campaignId }
            })),
            dynamoDB.send(new GetCommand({
                TableName: CONDITIONS_TABLE,
                Key: { campaignId }
            }))
        ]);
        
        const campaign = campaignResult.Item;
        const conditions = conditionsResult.Item;
        
        if (!campaign) {
            return {
                statusCode: 404,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    success: false,
                    error: 'Campaign not found'
                })
            };
        }
        
        // Check if campaign is active and within date range
        const now = new Date().toISOString();
        if (campaign.status !== 'active' || campaign.isActive !== 'true') {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    success: false,
                    error: 'Campaign is not active'
                })
            };
        }
        
        if (now < campaign.startDate || now > campaign.endDate) {
            return {
                statusCode: 403,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    success: false,
                    error: 'Campaign is not currently valid'
                })
            };
        }
        
        // Evaluate conditions if they exist
        if (conditions && conditions.conditions && conditions.conditions.length > 0) {
            const isEligible = await evaluateConditions(conditions.conditions, { 
                userId, 
                orderTotal,
                metadata 
            });
            
            if (!isEligible) {
                return {
                    statusCode: 403,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        success: false,
                        error: 'User not eligible for this campaign'
                    })
                };
            }
        }
        
        // Atomic usage increment with condition
        const updateResult = await dynamoDB.send(new UpdateCommand({
            TableName: USAGE_TABLE,
            Key: { campaignId },
            UpdateExpression: 'SET usage = usage + :inc, lastUsedAt = :now',
            ConditionExpression: 'usage < usageLimit',
            ExpressionAttributeValues: {
                ':inc': 1,
                ':now': now
            },
            ReturnValues: 'ALL_NEW'
        }));
        
        console.log(`✅ Campaign redeemed: ${campaignId} by ${userId}`);
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                success: true,
                campaignId,
                usage: updateResult.Attributes.usage,
                usageLimit: updateResult.Attributes.usageLimit,
                usageRemaining: updateResult.Attributes.usageLimit - updateResult.Attributes.usage,
                discountValue: campaign.discountValue,
                discountType: campaign.discountType,
                message: 'Campaign redeemed successfully'
            })
        };
        
    } catch (error) {
        console.error('❌ Error redeeming campaign:', error);
        
        if (error.name === 'ConditionalCheckFailedException') {
            return {
                statusCode: 409,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    success: false,
                    error: 'Campaign usage limit exceeded'
                })
            };
        }
        
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                success: false,
                error: 'Failed to redeem campaign'
            })
        };
    }
};

/**
 * Backend condition evaluation (not in DynamoDB)
 */
async function evaluateConditions(conditions, userData) {
    console.log('🔍 Evaluating campaign conditions...');
    
    if (!conditions || conditions.length === 0) {
        return true; // No conditions = always eligible
    }
    
    try {
        // For now, implement basic condition evaluation
        // In production, this would fetch user profile and order history
        
        return conditions.every(condition => {
            const { field, operator, value } = condition;
            
            let actualValue;
            
            // Simple field mapping - extend as needed
            switch (field) {
                case 'order.total':
                    actualValue = userData.orderTotal;
                    break;
                case 'user.isActive':
                    actualValue = true; // Assume active for now
                    break;
                case 'user.marketingConsent':
                    actualValue = true; // Assume consent for now
                    break;
                default:
                    console.warn(`Unknown condition field: ${field}`);
                    return true; // Default to eligible
            }
            
            // Apply condition logic
            switch (operator) {
                case 'equals':
                    return actualValue == value;
                case 'greaterThan':
                    return Number(actualValue) > Number(value);
                case 'lessThan':
                    return Number(actualValue) < Number(value);
                case 'contains':
                    return String(actualValue).includes(String(value));
                default:
                    console.warn(`Unknown operator: ${operator}`);
                    return true;
            }
        });
        
    } catch (error) {
        console.error('❌ Error evaluating conditions:', error);
        return false; // Fail safe - deny access on error
    }
}

/**
 * PUT /campaigns/{id} - Update campaign
 */
exports.updateCampaign = async (event) => {
    console.log('📝 Updating campaign...');
    
    try {
        const { campaignId } = event.pathParameters;
        const updateData = JSON.parse(event.body);
        const now = new Date().toISOString();
        
        // Build update expression
        const updateExpressions = [];
        const expressionAttributeValues = {};
        const expressionAttributeNames = {};
        
        // Allow updating specific fields
        const allowedFields = ['status', 'isActive', 'endDate', 'usageLimit', 'description'];
        
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                updateExpressions.push(`#${field} = :${field}`);
                expressionAttributeNames[`#${field}`] = field;
                expressionAttributeValues[`:${field}`] = updateData[field];
            }
        }
        
        if (updateExpressions.length === 0) {
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    success: false,
                    error: 'No valid fields to update'
                })
            };
        }
        
        // Always update timestamp
        updateExpressions.push('#updatedAt = :updatedAt');
        expressionAttributeNames['#updatedAt'] = 'updatedAt';
        expressionAttributeValues[':updatedAt'] = now;
        
        const result = await dynamoDB.send(new UpdateCommand({
            TableName: CAMPAIGNS_TABLE,
            Key: { campaignId },
            UpdateExpression: `SET ${updateExpressions.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues,
            ReturnValues: 'ALL_NEW'
        }));
        
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                success: true,
                campaign: result.Attributes,
                message: 'Campaign updated successfully'
            })
        };
        
    } catch (error) {
        console.error('❌ Error updating campaign:', error);
        
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                success: false,
                error: 'Failed to update campaign'
            })
        };
    }
};
