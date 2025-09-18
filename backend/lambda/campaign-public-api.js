/**
 * WizzCentral Campaign Public API
 * Public endpoints for customer applications (no authentication required)
 * Author: WizzCentral Dev Team
 */

const AWS = require('aws-sdk');

// Initialize AWS services
const dynamoDB = new AWS.DynamoDB.DocumentClient();

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
    console.log('🌐 Public Campaign API Request:', JSON.stringify(event, null, 2));

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
        const body = event.body ? JSON.parse(event.body) : {};

        // Rate limiting check (basic implementation)
        const clientIP = event.requestContext?.identity?.sourceIp;
        const rateLimitResult = await checkRateLimit(clientIP);
        if (!rateLimitResult.allowed) {
            return createResponse(429, { 
                error: 'Rate limit exceeded',
                retryAfter: rateLimitResult.retryAfter 
            });
        }
        
        // Route to appropriate handler
        switch (true) {
            case path === '/public/campaigns/validate' && httpMethod === 'POST':
                return await validateCampaignPublic(body);
                
            case path === '/public/campaigns/apply' && httpMethod === 'POST':
                return await applyCampaignPublic(body);
                
            case path === '/public/campaigns/eligible' && httpMethod === 'POST':
                return await getEligibleCampaignsPublic(body);
                
            default:
                return createResponse(404, { error: 'Public API route not found' });
        }
        
    } catch (error) {
        console.error('❌ Public Campaign API Error:', error);
        return createResponse(500, { 
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' ? error.message : 'Service temporarily unavailable'
        });
    }
};

// ============================================
// PUBLIC API ENDPOINTS
// ============================================

async function validateCampaignPublic(requestData) {
    try {
        const { campaignCode, userId, orderData, apiKey } = requestData;

        // Validate API key (basic validation)
        if (!isValidApiKey(apiKey)) {
            return createResponse(401, { error: 'Invalid API key' });
        }

        // Validate required fields
        if (!campaignCode || !userId || !orderData) {
            return createResponse(400, { 
                error: 'Missing required fields: campaignCode, userId, orderData' 
            });
        }

        // Get campaign by code
        const campaign = await getCampaignByCode(campaignCode.toUpperCase());
        if (!campaign) {
            return createResponse(404, { error: 'Campaign not found' });
        }

        // Check if campaign is active
        if (campaign.status !== 'active') {
            return createResponse(400, { 
                error: 'Campaign is not active',
                status: campaign.status 
            });
        }

        // Check campaign validity period
        const now = new Date();
        const startDate = new Date(campaign.startDate);
        const endDate = campaign.endDate ? new Date(campaign.endDate) : null;

        if (now < startDate) {
            return createResponse(400, { 
                error: 'Campaign has not started yet',
                startDate: campaign.startDate 
            });
        }

        if (endDate && now > endDate) {
            return createResponse(400, { 
                error: 'Campaign has expired',
                endDate: campaign.endDate 
            });
        }

        // Check eligibility
        const eligibilityResult = await checkCampaignEligibility(campaign, userId, orderData);

        // Track validation attempt (for analytics)
        await trackCampaignView(campaign.campaignId, userId);

        return createResponse(200, {
            success: true,
            eligible: eligibilityResult.eligible,
            campaign: {
                id: campaign.campaignId,
                title: campaign.title,
                code: campaign.code,
                type: campaign.type,
                discountType: campaign.discountType,
                discountValue: campaign.discountValue,
                minimumOrderValue: campaign.minimumOrderValue,
                maximumDiscount: campaign.maximumDiscount
            },
            eligibility: {
                eligible: eligibilityResult.eligible,
                reasons: eligibilityResult.reasons,
                discount: eligibilityResult.discount
            }
        });

    } catch (error) {
        console.error('❌ Error validating campaign (public):', error);
        return createResponse(500, { error: 'Failed to validate campaign' });
    }
}

async function applyCampaignPublic(requestData) {
    try {
        const { campaignCode, userId, orderId, orderValue, apiKey } = requestData;

        // Validate API key
        if (!isValidApiKey(apiKey)) {
            return createResponse(401, { error: 'Invalid API key' });
        }

        // Validate required fields
        if (!campaignCode || !userId || !orderId || !orderValue) {
            return createResponse(400, { 
                error: 'Missing required fields: campaignCode, userId, orderId, orderValue' 
            });
        }

        // Get campaign by code
        const campaign = await getCampaignByCode(campaignCode.toUpperCase());
        if (!campaign) {
            return createResponse(404, { error: 'Campaign not found' });
        }

        // Check if campaign is active and valid
        const validationResult = await validateCampaignForApplication(campaign);
        if (!validationResult.valid) {
            return createResponse(400, { 
                error: validationResult.reason,
                details: validationResult.details 
            });
        }

        // Check if order already has this campaign applied
        const existingUsage = await checkExistingUsage(campaign.campaignId, orderId);
        if (existingUsage) {
            return createResponse(409, { 
                error: 'Campaign already applied to this order',
                usageId: existingUsage.usageId 
            });
        }

        // Check eligibility
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
        await trackCampaignUsage(campaign.campaignId, userId, orderId, applicationResult.discountAmount);

        // Update campaign usage count
        await updateCampaignUsageCount(campaign.campaignId);

        // Update analytics
        await updateCampaignAnalytics(campaign.campaignId, applicationResult.discountAmount);

        return createResponse(200, {
            success: true,
            application: {
                usageId: applicationResult.usageId,
                campaignId: campaign.campaignId,
                campaignCode: campaign.code,
                discountAmount: applicationResult.discountAmount,
                discountType: campaign.discountType,
                originalOrderValue: orderValue,
                finalOrderValue: applicationResult.finalOrderValue,
                appliedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error applying campaign (public):', error);
        return createResponse(500, { error: 'Failed to apply campaign' });
    }
}

async function getEligibleCampaignsPublic(requestData) {
    try {
        const { userId, orderData, businessId, apiKey } = requestData;

        // Validate API key
        if (!isValidApiKey(apiKey)) {
            return createResponse(401, { error: 'Invalid API key' });
        }

        // Validate required fields
        if (!userId || !orderData) {
            return createResponse(400, { 
                error: 'Missing required fields: userId, orderData' 
            });
        }

        // Get all active campaigns
        const activeCampaigns = await getActiveCampaigns();

        // Filter campaigns applicable to this business (if specified)
        let applicableCampaigns = activeCampaigns;
        if (businessId) {
            applicableCampaigns = activeCampaigns.filter(campaign => {
                // Check if campaign applies to this business
                if (campaign.applicableBusinesses && campaign.applicableBusinesses.length > 0) {
                    return campaign.applicableBusinesses.includes(businessId);
                }
                // Check if business is excluded
                if (campaign.excludedBusinesses && campaign.excludedBusinesses.length > 0) {
                    return !campaign.excludedBusinesses.includes(businessId);
                }
                return true; // Apply to all businesses if no restrictions
            });
        }

        // Check eligibility for each campaign
        const eligibleCampaigns = [];
        const ineligibleCampaigns = [];

        for (const campaign of applicableCampaigns) {
            try {
                const eligibilityResult = await checkCampaignEligibility(campaign, userId, orderData);
                
                const campaignInfo = {
                    id: campaign.campaignId,
                    code: campaign.code,
                    title: campaign.title,
                    type: campaign.type,
                    discountType: campaign.discountType,
                    discountValue: campaign.discountValue,
                    minimumOrderValue: campaign.minimumOrderValue,
                    maximumDiscount: campaign.maximumDiscount,
                    description: campaign.description
                };

                if (eligibilityResult.eligible) {
                    eligibleCampaigns.push({
                        ...campaignInfo,
                        discount: eligibilityResult.discount,
                        estimatedSavings: eligibilityResult.discount?.amount || 0
                    });
                } else {
                    ineligibleCampaigns.push({
                        ...campaignInfo,
                        ineligibilityReasons: eligibilityResult.reasons
                    });
                }

                // Track campaign view for analytics
                await trackCampaignView(campaign.campaignId, userId);

            } catch (error) {
                console.error(`❌ Error checking eligibility for campaign ${campaign.campaignId}:`, error);
                // Continue with other campaigns
            }
        }

        // Sort eligible campaigns by savings amount (highest first)
        eligibleCampaigns.sort((a, b) => b.estimatedSavings - a.estimatedSavings);

        return createResponse(200, {
            success: true,
            eligible: eligibleCampaigns,
            ineligible: ineligibleCampaigns,
            summary: {
                totalCampaigns: activeCampaigns.length,
                applicableCampaigns: applicableCampaigns.length,
                eligibleCampaigns: eligibleCampaigns.length,
                maxPotentialSavings: eligibleCampaigns.length > 0 ? 
                    Math.max(...eligibleCampaigns.map(c => c.estimatedSavings)) : 0
            }
        });

    } catch (error) {
        console.error('❌ Error getting eligible campaigns (public):', error);
        return createResponse(500, { error: 'Failed to get eligible campaigns' });
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function isValidApiKey(apiKey) {
    // Basic API key validation
    // In production, this would check against a database or configuration
    const validApiKeys = [
        'wizzcentral_mobile_app_v1',
        'wizzcentral_web_app_v1',
        'merchant_app_integration_v1'
    ];
    
    return validApiKeys.includes(apiKey);
}

async function checkRateLimit(clientIP) {
    // Basic rate limiting implementation
    // In production, this would use Redis or DynamoDB for tracking
    
    // For now, allow all requests
    return { allowed: true };
}

async function getCampaignByCode(code) {
    try {
        const params = {
            TableName: CAMPAIGNS_TABLE,
            FilterExpression: 'code = :code',
            ExpressionAttributeValues: {
                ':code': code
            }
        };

        const result = await dynamoDB.scan(params).promise();
        return result.Items?.[0] || null;

    } catch (error) {
        console.error('❌ Error getting campaign by code:', error);
        return null;
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

async function validateCampaignForApplication(campaign) {
    const now = new Date();
    const startDate = new Date(campaign.startDate);
    const endDate = campaign.endDate ? new Date(campaign.endDate) : null;

    if (campaign.status !== 'active') {
        return {
            valid: false,
            reason: 'Campaign is not active',
            details: { status: campaign.status }
        };
    }

    if (now < startDate) {
        return {
            valid: false,
            reason: 'Campaign has not started yet',
            details: { startDate: campaign.startDate }
        };
    }

    if (endDate && now > endDate) {
        return {
            valid: false,
            reason: 'Campaign has expired',
            details: { endDate: campaign.endDate }
        };
    }

    // Check usage limits
    if (campaign.usageLimit) {
        const currentUsage = await getCampaignTotalUsage(campaign.campaignId);
        if (currentUsage >= campaign.usageLimit) {
            return {
                valid: false,
                reason: 'Campaign usage limit reached',
                details: { usageLimit: campaign.usageLimit, currentUsage }
            };
        }
    }

    return { valid: true };
}

async function checkExistingUsage(campaignId, orderId) {
    try {
        const params = {
            TableName: USAGE_TABLE,
            FilterExpression: 'campaignId = :campaignId AND orderId = :orderId',
            ExpressionAttributeValues: {
                ':campaignId': campaignId,
                ':orderId': orderId
            }
        };

        const result = await dynamoDB.scan(params).promise();
        return result.Items?.[0] || null;

    } catch (error) {
        console.error('❌ Error checking existing usage:', error);
        return null;
    }
}

async function checkCampaignEligibility(campaign, userId, orderData) {
    try {
        // Basic eligibility checks
        const now = new Date();
        const startDate = new Date(campaign.startDate);
        const endDate = campaign.endDate ? new Date(campaign.endDate) : null;

        // Check date validity
        if (now < startDate || (endDate && now > endDate)) {
            return {
                eligible: false,
                reasons: ['Campaign not active in current time period'],
                discount: null
            };
        }

        // Check minimum order value
        if (orderData.value < campaign.minimumOrderValue) {
            return {
                eligible: false,
                reasons: [`Order value must be at least ${campaign.minimumOrderValue}`],
                discount: null
            };
        }

        // Check user usage limits
        const userUsageCount = await getUserCampaignUsage(campaign.campaignId, userId);
        if (userUsageCount >= campaign.userLimit) {
            return {
                eligible: false,
                reasons: ['User has reached usage limit for this campaign'],
                discount: null
            };
        }

        // Calculate discount
        const discount = calculateDiscount(campaign, orderData.value);

        // Advanced condition checking (if campaign uses advanced conditions)
        if (campaign.usesAdvancedConditions) {
            const conditionResult = await evaluateAdvancedConditions(campaign.campaignId, userId, orderData);
            if (!conditionResult.passed) {
                return {
                    eligible: false,
                    reasons: conditionResult.reasons || ['Advanced conditions not met'],
                    discount: null
                };
            }
        }

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
            date: new Date().toISOString().split('T')[0],
            source: 'public_api'
        };

        await dynamoDB.put({
            TableName: USAGE_TABLE,
            Item: usageItem
        }).promise();

    } catch (error) {
        console.error('❌ Error tracking campaign usage:', error);
    }
}

async function trackCampaignView(campaignId, userId) {
    try {
        // Track campaign view for analytics
        const today = new Date().toISOString().split('T')[0];

        await dynamoDB.update({
            TableName: ANALYTICS_TABLE,
            Key: { campaignId, date: today },
            UpdateExpression: 'SET views = if_not_exists(views, :zero) + :inc',
            ExpressionAttributeValues: {
                ':inc': 1,
                ':zero': 0
            }
        }).promise();

    } catch (error) {
        console.error('❌ Error tracking campaign view:', error);
    }
}

async function updateCampaignUsageCount(campaignId) {
    try {
        await dynamoDB.update({
            TableName: CAMPAIGNS_TABLE,
            Key: { campaignId },
            UpdateExpression: 'SET usageCount = if_not_exists(usageCount, :zero) + :inc',
            ExpressionAttributeValues: {
                ':inc': 1,
                ':zero': 0
            }
        }).promise();

    } catch (error) {
        console.error('❌ Error updating campaign usage count:', error);
    }
}

async function updateCampaignAnalytics(campaignId, discountAmount) {
    try {
        const today = new Date().toISOString().split('T')[0];

        await dynamoDB.update({
            TableName: ANALYTICS_TABLE,
            Key: { campaignId, date: today },
            UpdateExpression: 'SET applications = if_not_exists(applications, :zero) + :inc, totalDiscount = if_not_exists(totalDiscount, :zero) + :discount',
            ExpressionAttributeValues: {
                ':inc': 1,
                ':zero': 0,
                ':discount': discountAmount
            }
        }).promise();

    } catch (error) {
        console.error('❌ Error updating campaign analytics:', error);
    }
}

async function getUserCampaignUsage(campaignId, userId) {
    try {
        const params = {
            TableName: USAGE_TABLE,
            FilterExpression: 'campaignId = :campaignId AND userId = :userId',
            ExpressionAttributeValues: {
                ':campaignId': campaignId,
                ':userId': userId
            }
        };

        const result = await dynamoDB.scan(params).promise();
        return result.Items?.length || 0;

    } catch (error) {
        console.error('❌ Error getting user campaign usage:', error);
        return 0;
    }
}

async function getCampaignTotalUsage(campaignId) {
    try {
        const params = {
            TableName: USAGE_TABLE,
            FilterExpression: 'campaignId = :campaignId',
            ExpressionAttributeValues: {
                ':campaignId': campaignId
            }
        };

        const result = await dynamoDB.scan(params).promise();
        return result.Items?.length || 0;

    } catch (error) {
        console.error('❌ Error getting campaign total usage:', error);
        return 0;
    }
}

async function evaluateAdvancedConditions(campaignId, userId, orderData) {
    try {
        // This would integrate with the condition engine
        // For now, return a simple result
        return { passed: true, reasons: [] };

    } catch (error) {
        console.error('❌ Error evaluating advanced conditions:', error);
        return { passed: false, reasons: ['Error evaluating conditions'] };
    }
}

function createResponse(statusCode, body) {
    return {
        statusCode,
        headers,
        body: JSON.stringify(body)
    };
}
