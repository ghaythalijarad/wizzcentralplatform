/**
 * WizzCentral Campaign Management API
 * Lambda function for campaign CRUD operations
 * Author: WizzCentral Dev Team
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, QueryCommand, ScanCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { CognitoIdentityProviderClient, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');

// Initialize AWS SDK v3 services
const ddbClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1'
});
const dynamoDB = DynamoDBDocumentClient.from(ddbClient);
const cognito = new CognitoIdentityProviderClient({
    region: process.env.AWS_REGION || 'us-east-1'
});

// Table names
const CAMPAIGNS_TABLE = 'WizzCentral_Campaigns';
const CONDITIONS_TABLE = 'WizzCentral_Campaign_Conditions';
const USAGE_TABLE = 'WizzCentral_Campaign_Usage';
const ANALYTICS_TABLE = 'WizzCentral_Campaign_Analytics';
const USERS_TABLE = 'WizzUser_users_dev';
const TRANSACTIONS_TABLE = 'WizzUser_transactions_dev';

// CORS headers
const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

exports.handler = async (event) => {
    console.log('📋 Campaign API Request:', JSON.stringify(event, null, 2));

    try {
        // Handle CORS preflight
        if (event.httpMethod === 'OPTIONS') {
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: 'CORS preflight successful' })
            };
        }

        const httpMethod = event.httpMethod;
        const path = event.resource;
        const pathParams = event.pathParameters || {};
        const queryParams = event.queryStringParameters || {};
        const body = event.body ? JSON.parse(event.body) : {};

        // Extract user context from JWT
        const userContext = extractUserContext(event);
        
        // Route to appropriate handler
        switch (true) {
            case path === '/campaigns' && httpMethod === 'GET':
                return await getCampaigns(queryParams, userContext);
                
            case path === '/campaigns' && httpMethod === 'POST':
                return await createCampaign(body, userContext);
                
            case path === '/campaigns/{campaignId}' && httpMethod === 'GET':
                return await getCampaign(pathParams.campaignId, userContext);
                
            case path === '/campaigns/{campaignId}' && httpMethod === 'PUT':
                return await updateCampaign(pathParams.campaignId, body, userContext);
                
            case path === '/campaigns/{campaignId}' && httpMethod === 'DELETE':
                return await deleteCampaign(pathParams.campaignId, userContext);
                
            case path === '/campaigns/{campaignId}/validate' && httpMethod === 'POST':
                return await validateCampaignEligibility(pathParams.campaignId, body, userContext);
                
            case path === '/campaigns/{campaignId}/apply' && httpMethod === 'POST':
                return await applyCampaign(pathParams.campaignId, body, userContext);
                
            case path === '/campaigns/{campaignId}/analytics' && httpMethod === 'GET':
                return await getCampaignAnalytics(pathParams.campaignId, queryParams, userContext);
                
            case path === '/campaigns/eligible' && httpMethod === 'POST':
                return await getEligibleCampaigns(body, userContext);
                
            default:
                return createResponse(404, { error: 'Route not found' });
        }
        
    } catch (error) {
        console.error('❌ Campaign API Error:', error);
        return createResponse(500, { 
            error: 'Internal server error',
            message: error.message 
        });
    }
};

// ============================================
// CAMPAIGN CRUD OPERATIONS
// ============================================

async function getCampaigns(queryParams, userContext) {
    try {
        const { status, type, limit = 50, offset = 0 } = queryParams;
        
        const params = {
            TableName: CAMPAIGNS_TABLE,
            Limit: parseInt(limit)
        };

        // Add filters if provided
        if (status) {
            params.FilterExpression = '#status = :status';
            params.ExpressionAttributeNames = { '#status': 'status' };
            params.ExpressionAttributeValues = { ':status': status };
        }

        if (type) {
            if (params.FilterExpression) {
                params.FilterExpression += ' AND #type = :type';
            } else {
                params.FilterExpression = '#type = :type';
                params.ExpressionAttributeNames = {};
                params.ExpressionAttributeValues = {};
            }
            params.ExpressionAttributeNames['#type'] = 'type';
            params.ExpressionAttributeValues[':type'] = type;
        }

        const result = await dynamoDB.send(new ScanCommand(params));
        
        // Enrich campaigns with condition details
        const enrichedCampaigns = await Promise.all(
            result.Items.map(async (campaign) => {
                if (campaign.usesAdvancedConditions) {
                    campaign.conditionDetails = await getCampaignConditionDetails(campaign.campaignId);
                }
                return campaign;
            })
        );

        return createResponse(200, {
            success: true,
            data: enrichedCampaigns,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: result.Count
            }
        });

    } catch (error) {
        console.error('❌ Error fetching campaigns:', error);
        return createResponse(500, { error: 'Failed to fetch campaigns' });
    }
}

async function createCampaign(campaignData, userContext) {
    try {
        // Validate required fields
        const requiredFields = ['title', 'code', 'type', 'discountType', 'discountValue'];
        for (const field of requiredFields) {
            if (!campaignData[field]) {
                return createResponse(400, { error: `Missing required field: ${field}` });
            }
        }

        // Generate campaign ID
        const campaignId = `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Prepare campaign item
        const campaignItem = {
            campaignId,
            title: campaignData.title,
            code: campaignData.code.toUpperCase(),
            type: campaignData.type,
            status: campaignData.status || 'active',
            discountType: campaignData.discountType,
            discountValue: campaignData.discountValue,
            startDate: campaignData.startDate || new Date().toISOString(),
            endDate: campaignData.endDate,
            usageLimit: campaignData.usageLimit || null,
            userLimit: campaignData.userLimit || 1,
            minimumOrderValue: campaignData.minimumOrderValue || 0,
            maximumDiscount: campaignData.maximumDiscount || null,
            applicableBusinesses: campaignData.applicableBusinesses || [],
            excludedBusinesses: campaignData.excludedBusinesses || [],
            usesAdvancedConditions: campaignData.usesAdvancedConditions || false,
            conditions: campaignData.conditions || [],
            createdAt: new Date().toISOString(),
            createdBy: userContext.userId,
            updatedAt: new Date().toISOString(),
            usageCount: 0
        };

        // Check if campaign code already exists
        const existingCampaign = await getCampaignByCode(campaignData.code.toUpperCase());
        if (existingCampaign) {
            return createResponse(409, { error: 'Campaign code already exists' });
        }

        // Save campaign
        await dynamoDB.send(new PutCommand({
            TableName: CAMPAIGNS_TABLE,
            Item: campaignItem
        }));

        // Save advanced conditions if provided
        if (campaignItem.usesAdvancedConditions && campaignItem.conditions.length > 0) {
            await saveCampaignConditions(campaignId, campaignItem.conditions);
        }

        // Initialize analytics
        await initializeCampaignAnalytics(campaignId);

        console.log(`✅ Campaign created: ${campaignId}`);
        return createResponse(201, {
            success: true,
            campaignId,
            campaign: campaignItem
        });

    } catch (error) {
        console.error('❌ Error creating campaign:', error);
        return createResponse(500, { error: 'Failed to create campaign' });
    }
}

async function getCampaign(campaignId, userContext) {
    try {
        const result = await dynamoDB.send(new GetCommand({
            TableName: CAMPAIGNS_TABLE,
            Key: { campaignId }
        }));

        if (!result.Item) {
            return createResponse(404, { error: 'Campaign not found' });
        }

        const campaign = result.Item;

        // Enrich with condition details
        if (campaign.usesAdvancedConditions) {
            campaign.conditionDetails = await getCampaignConditionDetails(campaignId);
        }

        // Add analytics summary
        campaign.analytics = await getCampaignAnalyticsSummary(campaignId);

        return createResponse(200, {
            success: true,
            data: campaign
        });

    } catch (error) {
        console.error('❌ Error fetching campaign:', error);
        return createResponse(500, { error: 'Failed to fetch campaign' });
    }
}

async function updateCampaign(campaignId, updateData, userContext) {
    try {
        // Get existing campaign
        const existing = await dynamoDB.send(new GetCommand({
            TableName: CAMPAIGNS_TABLE,
            Key: { campaignId }
        }));

        if (!existing.Item) {
            return createResponse(404, { error: 'Campaign not found' });
        }

        // Prepare update expression
        const updateExpression = [];
        const expressionAttributeNames = {};
        const expressionAttributeValues = {};

        Object.keys(updateData).forEach((key, index) => {
            if (key !== 'campaignId') {
                updateExpression.push(`#attr${index} = :val${index}`);
                expressionAttributeNames[`#attr${index}`] = key;
                expressionAttributeValues[`:val${index}`] = updateData[key];
            }
        });

        // Add updatedAt
        updateExpression.push(`updatedAt = :updatedAt`);
        expressionAttributeValues[':updatedAt'] = new Date().toISOString();

        await dynamoDB.send(new UpdateCommand({
            TableName: CAMPAIGNS_TABLE,
            Key: { campaignId },
            UpdateExpression: `SET ${updateExpression.join(', ')}`,
            ExpressionAttributeNames: expressionAttributeNames,
            ExpressionAttributeValues: expressionAttributeValues
        }));

        // Update conditions if provided
        if (updateData.conditions && updateData.usesAdvancedConditions) {
            await saveCampaignConditions(campaignId, updateData.conditions);
        }

        console.log(`✅ Campaign updated: ${campaignId}`);
        return createResponse(200, {
            success: true,
            message: 'Campaign updated successfully'
        });

    } catch (error) {
        console.error('❌ Error updating campaign:', error);
        return createResponse(500, { error: 'Failed to update campaign' });
    }
}

async function deleteCampaign(campaignId, userContext) {
    try {
        // Soft delete by setting status to 'deleted'
        await dynamoDB.update({
            TableName: CAMPAIGNS_TABLE,
            Key: { campaignId },
            UpdateExpression: 'SET #status = :status, updatedAt = :updatedAt',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: {
                ':status': 'deleted',
                ':updatedAt': new Date().toISOString()
            }
        }).promise();

        console.log(`✅ Campaign deleted: ${campaignId}`);
        return createResponse(200, {
            success: true,
            message: 'Campaign deleted successfully'
        });

    } catch (error) {
        console.error('❌ Error deleting campaign:', error);
        return createResponse(500, { error: 'Failed to delete campaign' });
    }
}

// ============================================
// CAMPAIGN ELIGIBILITY & APPLICATION
// ============================================

async function validateCampaignEligibility(campaignId, requestData, userContext) {
    try {
        const { userId, orderData } = requestData;

        // Get campaign details
        const campaign = await getCampaignDetails(campaignId);
        if (!campaign) {
            return createResponse(404, { error: 'Campaign not found' });
        }

        // Check basic eligibility
        const eligibilityResult = await checkCampaignEligibility(campaign, userId, orderData);

        return createResponse(200, {
            success: true,
            eligible: eligibilityResult.eligible,
            reasons: eligibilityResult.reasons,
            discount: eligibilityResult.discount
        });

    } catch (error) {
        console.error('❌ Error validating campaign eligibility:', error);
        return createResponse(500, { error: 'Failed to validate eligibility' });
    }
}

async function applyCampaign(campaignId, requestData, userContext) {
    try {
        const { userId, orderId, orderValue } = requestData;

        // Get campaign details
        const campaign = await getCampaignDetails(campaignId);
        if (!campaign) {
            return createResponse(404, { error: 'Campaign not found' });
        }

        // Validate eligibility
        const eligibilityResult = await checkCampaignEligibility(campaign, userId, { value: orderValue });
        if (!eligibilityResult.eligible) {
            return createResponse(400, {
                error: 'Not eligible for campaign',
                reasons: eligibilityResult.reasons
            });
        }

        // Apply campaign
        const applicationResult = await applyCampaignToOrder(campaign, userId, orderId, orderValue);

        // Track usage
        await trackCampaignUsage(campaignId, userId, orderId, applicationResult.discountAmount);

        // Update analytics
        await updateCampaignAnalytics(campaignId, applicationResult.discountAmount);

        return createResponse(200, {
            success: true,
            discountAmount: applicationResult.discountAmount,
            finalOrderValue: applicationResult.finalOrderValue,
            usageId: applicationResult.usageId
        });

    } catch (error) {
        console.error('❌ Error applying campaign:', error);
        return createResponse(500, { error: 'Failed to apply campaign' });
    }
}

async function getEligibleCampaigns(requestData, userContext) {
    try {
        const { userId, orderData } = requestData;

        // Get all active campaigns
        const campaigns = await getActiveCampaigns();

        // Check eligibility for each campaign
        const eligibleCampaigns = [];
        for (const campaign of campaigns) {
            const eligibilityResult = await checkCampaignEligibility(campaign, userId, orderData);
            if (eligibilityResult.eligible) {
                eligibleCampaigns.push({
                    ...campaign,
                    discount: eligibilityResult.discount
                });
            }
        }

        // Sort by discount value (highest first)
        eligibleCampaigns.sort((a, b) => b.discount.amount - a.discount.amount);

        return createResponse(200, {
            success: true,
            data: eligibleCampaigns
        });

    } catch (error) {
        console.error('❌ Error getting eligible campaigns:', error);
        return createResponse(500, { error: 'Failed to get eligible campaigns' });
    }
}

// ============================================
// ANALYTICS ENDPOINTS
// ============================================

async function getCampaignAnalytics(campaignId, queryParams, userContext) {
    try {
        const { startDate, endDate, granularity = 'daily' } = queryParams;

        const params = {
            TableName: ANALYTICS_TABLE,
            KeyConditionExpression: 'campaignId = :campaignId',
            ExpressionAttributeValues: {
                ':campaignId': campaignId
            }
        };

        if (startDate && endDate) {
            params.FilterExpression = '#date BETWEEN :startDate AND :endDate';
            params.ExpressionAttributeNames = { '#date': 'date' };
            params.ExpressionAttributeValues[':startDate'] = startDate;
            params.ExpressionAttributeValues[':endDate'] = endDate;
        }

        const result = await dynamoDB.query(params).promise();

        // Aggregate data based on granularity
        const analytics = aggregateAnalyticsData(result.Items, granularity);

        return createResponse(200, {
            success: true,
            data: analytics
        });

    } catch (error) {
        console.error('❌ Error fetching campaign analytics:', error);
        return createResponse(500, { error: 'Failed to fetch analytics' });
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function extractUserContext(event) {
    const claims = event.requestContext?.authorizer?.claims;
    return {
        userId: claims?.sub || 'anonymous',
        email: claims?.email,
        roles: claims?.['custom:roles']?.split(',') || []
    };
}

function createResponse(statusCode, body) {
    return {
        statusCode,
        headers,
        body: JSON.stringify(body)
    };
}

async function getCampaignByCode(code) {
    try {
        const params = {
            TableName: CAMPAIGNS_TABLE,
            IndexName: 'code-index',
            KeyConditionExpression: 'code = :code',
            ExpressionAttributeValues: {
                ':code': code
            }
        };

        const result = await dynamoDB.query(params).promise();
        return result.Items?.[0] || null;

    } catch (error) {
        console.error('❌ Error getting campaign by code:', error);
        return null;
    }
}

async function getCampaignDetails(campaignId) {
    try {
        const result = await dynamoDB.get({
            TableName: CAMPAIGNS_TABLE,
            Key: { campaignId }
        }).promise();

        const campaign = result.Item;
        if (!campaign) return null;

        // Enrich with conditions
        if (campaign.usesAdvancedConditions) {
            campaign.conditionDetails = await getCampaignConditionDetails(campaignId);
        }

        return campaign;

    } catch (error) {
        console.error('❌ Error getting campaign details:', error);
        return null;
    }
}

async function getCampaignConditionDetails(campaignId) {
    try {
        const result = await dynamoDB.query({
            TableName: CONDITIONS_TABLE,
            KeyConditionExpression: 'campaignId = :campaignId',
            ExpressionAttributeValues: {
                ':campaignId': campaignId
            }
        }).promise();

        return result.Items || [];

    } catch (error) {
        console.error('❌ Error getting campaign conditions:', error);
        return [];
    }
}

async function saveCampaignConditions(campaignId, conditions) {
    try {
        // Delete existing conditions
        const existing = await getCampaignConditionDetails(campaignId);
        for (const condition of existing) {
            await dynamoDB.delete({
                TableName: CONDITIONS_TABLE,
                Key: {
                    campaignId: condition.campaignId,
                    conditionId: condition.conditionId
                }
            }).promise();
        }

        // Save new conditions
        for (const condition of conditions) {
            const conditionItem = {
                campaignId,
                conditionId: `cond_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...condition,
                createdAt: new Date().toISOString()
            };

            await dynamoDB.put({
                TableName: CONDITIONS_TABLE,
                Item: conditionItem
            }).promise();
        }

    } catch (error) {
        console.error('❌ Error saving campaign conditions:', error);
        throw error;
    }
}

async function getActiveCampaigns() {
    try {
        const params = {
            TableName: CAMPAIGNS_TABLE,
            FilterExpression: '#status = :status',
            ExpressionAttributeNames: { '#status': 'status' },
            ExpressionAttributeValues: { ':status': 'active' }
        };

        const result = await dynamoDB.scan(params).promise();
        return result.Items || [];

    } catch (error) {
        console.error('❌ Error getting active campaigns:', error);
        return [];
    }
}

async function checkCampaignEligibility(campaign, userId, orderData) {
    try {
        // Implementation of sophisticated eligibility checking
        // This would include checking all campaign conditions
        
        const now = new Date();
        const startDate = new Date(campaign.startDate);
        const endDate = campaign.endDate ? new Date(campaign.endDate) : null;

        // Check date validity
        if (now < startDate || (endDate && now > endDate)) {
            return {
                eligible: false,
                reasons: ['Campaign not active'],
                discount: null
            };
        }

        // Check minimum order value
        if (orderData.value < campaign.minimumOrderValue) {
            return {
                eligible: false,
                reasons: ['Order value below minimum'],
                discount: null
            };
        }

        // Check usage limits (simplified)
        const userUsageCount = await getUserCampaignUsage(campaign.campaignId, userId);
        if (userUsageCount >= campaign.userLimit) {
            return {
                eligible: false,
                reasons: ['Usage limit exceeded'],
                discount: null
            };
        }

        // Calculate discount
        const discount = calculateDiscount(campaign, orderData.value);

        return {
            eligible: true,
            reasons: [],
            discount
        };

    } catch (error) {
        console.error('❌ Error checking campaign eligibility:', error);
        return {
            eligible: false,
            reasons: ['Error checking eligibility'],
            discount: null
        };
    }
}

function calculateDiscount(campaign, orderValue) {
    let discountAmount = 0;

    if (campaign.discountType === 'percentage') {
        discountAmount = orderValue * (campaign.discountValue / 100);
    } else if (campaign.discountType === 'fixed') {
        discountAmount = campaign.discountValue;
    }

    // Apply maximum discount cap
    if (campaign.maximumDiscount && discountAmount > campaign.maximumDiscount) {
        discountAmount = campaign.maximumDiscount;
    }

    return {
        type: campaign.discountType,
        value: campaign.discountValue,
        amount: discountAmount
    };
}

async function getUserCampaignUsage(campaignId, userId) {
    try {
        const result = await dynamoDB.query({
            TableName: USAGE_TABLE,
            IndexName: 'campaignId-userId-index',
            KeyConditionExpression: 'campaignId = :campaignId AND userId = :userId',
            ExpressionAttributeValues: {
                ':campaignId': campaignId,
                ':userId': userId
            }
        }).promise();

        return result.Items?.length || 0;

    } catch (error) {
        console.error('❌ Error getting user campaign usage:', error);
        return 0;
    }
}

async function applyCampaignToOrder(campaign, userId, orderId, orderValue) {
    const discount = calculateDiscount(campaign, orderValue);
    const finalOrderValue = orderValue - discount.amount;

    return {
        discountAmount: discount.amount,
        finalOrderValue,
        usageId: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
}

async function trackCampaignUsage(campaignId, userId, orderId, discountAmount) {
    try {
        const usageItem = {
            usageId: `usage_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            campaignId,
            userId,
            orderId,
            discountAmount,
            timestamp: new Date().toISOString(),
            date: new Date().toISOString().split('T')[0]
        };

        await dynamoDB.put({
            TableName: USAGE_TABLE,
            Item: usageItem
        }).promise();

    } catch (error) {
        console.error('❌ Error tracking campaign usage:', error);
    }
}

async function initializeCampaignAnalytics(campaignId) {
    try {
        const analyticsItem = {
            campaignId,
            date: new Date().toISOString().split('T')[0],
            views: 0,
            applications: 0,
            totalDiscount: 0,
            uniqueUsers: 0,
            conversionRate: 0
        };

        await dynamoDB.put({
            TableName: ANALYTICS_TABLE,
            Item: analyticsItem
        }).promise();

    } catch (error) {
        console.error('❌ Error initializing campaign analytics:', error);
    }
}

async function updateCampaignAnalytics(campaignId, discountAmount) {
    try {
        const today = new Date().toISOString().split('T')[0];

        await dynamoDB.update({
            TableName: ANALYTICS_TABLE,
            Key: { campaignId, date: today },
            UpdateExpression: 'SET applications = applications + :inc, totalDiscount = totalDiscount + :discount',
            ExpressionAttributeValues: {
                ':inc': 1,
                ':discount': discountAmount
            }
        }).promise();

    } catch (error) {
        console.error('❌ Error updating campaign analytics:', error);
    }
}

async function getCampaignAnalyticsSummary(campaignId) {
    try {
        const result = await dynamoDB.query({
            TableName: ANALYTICS_TABLE,
            KeyConditionExpression: 'campaignId = :campaignId',
            ExpressionAttributeValues: {
                ':campaignId': campaignId
            }
        }).promise();

        const analytics = result.Items || [];
        
        // Aggregate totals
        const summary = analytics.reduce((acc, item) => {
            acc.totalViews += item.views || 0;
            acc.totalApplications += item.applications || 0;
            acc.totalDiscount += item.totalDiscount || 0;
            return acc;
        }, { totalViews: 0, totalApplications: 0, totalDiscount: 0 });

        summary.conversionRate = summary.totalViews > 0 ? 
            (summary.totalApplications / summary.totalViews * 100).toFixed(2) : 0;

        return summary;

    } catch (error) {
        console.error('❌ Error getting campaign analytics summary:', error);
        return { totalViews: 0, totalApplications: 0, totalDiscount: 0, conversionRate: 0 };
    }
}

function aggregateAnalyticsData(items, granularity) {
    // Implementation for aggregating analytics data based on granularity
    // This would group data by day, week, month, etc.
    return items;
}
