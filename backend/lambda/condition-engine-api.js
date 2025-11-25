/**
 * WizzCentral Campaign Condition Engine API
 * Advanced condition processing and evaluation
 * Author: WizzCentral Dev Team
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, QueryCommand, ScanCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

// Initialize AWS SDK v3 services
const ddbClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1'
});
const dynamoDB = DynamoDBDocumentClient.from(ddbClient);

// Table names
const CONDITIONS_TABLE = 'WizzCentral_Campaign_Conditions';
const USERS_TABLE = 'WizzUser_users_dev';
const TRANSACTIONS_TABLE = 'WizzUser_transactions_dev';
const BUSINESSES_TABLE = 'WhizzMerchants_Businesses';

// CORS headers
const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

exports.handler = async (event) => {
    console.log('🔧 Condition Engine Request:', JSON.stringify(event, null, 2));

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
        const body = event.body ? JSON.parse(event.body) : {};

        // Extract user context from JWT
        const userContext = extractUserContext(event);
        
        // Route to appropriate handler
        switch (true) {
            case path === '/conditions/evaluate' && httpMethod === 'POST':
                return await evaluateConditions(body, userContext);
                
            case path === '/conditions/validate' && httpMethod === 'POST':
                return await validateConditions(body, userContext);
                
            case path === '/conditions/{campaignId}' && httpMethod === 'GET':
                return await getCampaignConditions(pathParams.campaignId, userContext);
                
            case path === '/conditions/{campaignId}' && httpMethod === 'POST':
                return await saveCampaignConditions(pathParams.campaignId, body, userContext);
                
            case path === '/conditions/test' && httpMethod === 'POST':
                return await testConditions(body, userContext);
                
            default:
                return createResponse(404, { error: 'Route not found' });
        }
        
    } catch (error) {
        console.error('❌ Condition Engine Error:', error);
        return createResponse(500, { 
            error: 'Internal server error',
            message: error.message 
        });
    }
};

// ============================================
// CONDITION EVALUATION ENGINE
// ============================================

async function evaluateConditions(requestData, userContext) {
    try {
        const { campaignId, userId, orderData, conditions } = requestData;

        console.log(`🔍 Evaluating conditions for campaign: ${campaignId}, user: ${userId}`);

        // Get user profile and history
        const userProfile = await getUserProfile(userId);
        const userHistory = await getUserHistory(userId);
        const orderContext = await enrichOrderContext(orderData);

        // Initialize evaluation context
        const evaluationContext = {
            user: userProfile,
            history: userHistory,
            order: orderContext,
            timestamp: new Date().toISOString(),
            campaignId
        };

        // Get conditions to evaluate
        let conditionsToEvaluate = conditions;
        if (!conditionsToEvaluate && campaignId) {
            conditionsToEvaluate = await getCampaignConditionsList(campaignId);
        }

        if (!conditionsToEvaluate || conditionsToEvaluate.length === 0) {
            return createResponse(200, {
                success: true,
                result: true,
                message: 'No conditions to evaluate - default to eligible'
            });
        }

        // Evaluate each condition
        const evaluationResults = [];
        let overallResult = true;

        for (const condition of conditionsToEvaluate) {
            const result = await evaluateCondition(condition, evaluationContext);
            evaluationResults.push({
                conditionId: condition.conditionId || condition.id,
                type: condition.type,
                passed: result.passed,
                message: result.message,
                value: result.value,
                expected: result.expected
            });

            // For AND logic, all conditions must pass
            if (condition.logic === 'AND' || !condition.logic) {
                overallResult = overallResult && result.passed;
            }
        }

        console.log(`✅ Condition evaluation complete. Overall result: ${overallResult}`);

        return createResponse(200, {
            success: true,
            result: overallResult,
            details: evaluationResults,
            evaluationContext: {
                userId,
                campaignId,
                timestamp: evaluationContext.timestamp
            }
        });

    } catch (error) {
        console.error('❌ Error evaluating conditions:', error);
        return createResponse(500, { error: 'Failed to evaluate conditions' });
    }
}

async function evaluateCondition(condition, context) {
    try {
        console.log(`🔍 Evaluating condition: ${condition.type}`);

        switch (condition.type) {
            case 'userAttribute':
                return evaluateUserAttributeCondition(condition, context);
                
            case 'orderValue':
                return evaluateOrderValueCondition(condition, context);
                
            case 'orderHistory':
                return evaluateOrderHistoryCondition(condition, context);
                
            case 'timeBasedCondition':
                return evaluateTimeBasedCondition(condition, context);
                
            case 'locationCondition':
                return evaluateLocationCondition(condition, context);
                
            case 'businessCondition':
                return evaluateBusinessCondition(condition, context);
                
            case 'loyaltyCondition':
                return evaluateLoyaltyCondition(condition, context);
                
            case 'customCondition':
                return evaluateCustomCondition(condition, context);
                
            default:
                console.warn(`⚠️ Unknown condition type: ${condition.type}`);
                return {
                    passed: false,
                    message: `Unknown condition type: ${condition.type}`,
                    value: null,
                    expected: condition.value
                };
        }

    } catch (error) {
        console.error(`❌ Error evaluating condition ${condition.type}:`, error);
        return {
            passed: false,
            message: `Error evaluating condition: ${error.message}`,
            value: null,
            expected: condition.value
        };
    }
}

function evaluateUserAttributeCondition(condition, context) {
    const { field, operator, value } = condition;
    const userValue = getNestedValue(context.user, field);

    return evaluateComparison(userValue, operator, value, `User ${field}`);
}

function evaluateOrderValueCondition(condition, context) {
    const { field, operator, value } = condition;
    const orderValue = getNestedValue(context.order, field);

    return evaluateComparison(orderValue, operator, value, `Order ${field}`);
}

function evaluateOrderHistoryCondition(condition, context) {
    const { metric, operator, value, timeframe } = condition;
    
    // Filter transactions by timeframe
    const relevantTransactions = filterTransactionsByTimeframe(
        context.history.transactions || [], 
        timeframe
    );

    let actualValue;
    
    switch (metric) {
        case 'totalOrders':
            actualValue = relevantTransactions.length;
            break;
            
        case 'totalSpent':
            actualValue = relevantTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
            break;
            
        case 'averageOrderValue':
            if (relevantTransactions.length === 0) {
                actualValue = 0;
            } else {
                const total = relevantTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
                actualValue = total / relevantTransactions.length;
            }
            break;
            
        case 'daysAgoLastOrder':
            if (relevantTransactions.length === 0) {
                actualValue = Infinity;
            } else {
                const lastOrder = relevantTransactions.sort((a, b) => 
                    new Date(b.createdAt) - new Date(a.createdAt)
                )[0];
                const daysDiff = Math.floor(
                    (new Date() - new Date(lastOrder.createdAt)) / (1000 * 60 * 60 * 24)
                );
                actualValue = daysDiff;
            }
            break;
            
        default:
            actualValue = 0;
    }

    return evaluateComparison(actualValue, operator, value, `Order history ${metric}`);
}

function evaluateTimeBasedCondition(condition, context) {
    const now = new Date();
    const { timeType, operator, value } = condition;

    let actualValue;

    switch (timeType) {
        case 'hour':
            actualValue = now.getHours();
            break;
            
        case 'dayOfWeek':
            actualValue = now.getDay(); // 0-6, Sunday = 0
            break;
            
        case 'dayOfMonth':
            actualValue = now.getDate();
            break;
            
        case 'month':
            actualValue = now.getMonth() + 1; // 1-12
            break;
            
        case 'isWeekend':
            const day = now.getDay();
            actualValue = day === 0 || day === 6; // Sunday or Saturday
            break;
            
        default:
            actualValue = null;
    }

    return evaluateComparison(actualValue, operator, value, `Time condition ${timeType}`);
}

function evaluateLocationCondition(condition, context) {
    const { locationType, operator, value } = condition;
    const userLocation = context.user?.location || context.order?.location;

    if (!userLocation) {
        return {
            passed: false,
            message: 'No location data available',
            value: null,
            expected: value
        };
    }

    let actualValue;

    switch (locationType) {
        case 'city':
            actualValue = userLocation.city;
            break;
            
        case 'district':
            actualValue = userLocation.district;
            break;
            
        case 'coordinates':
            // For coordinate-based conditions, we'd need to calculate distance
            actualValue = userLocation.coordinates;
            break;
            
        default:
            actualValue = null;
    }

    return evaluateComparison(actualValue, operator, value, `Location ${locationType}`);
}

function evaluateBusinessCondition(condition, context) {
    const { businessField, operator, value } = condition;
    const businessValue = getNestedValue(context.order?.business, businessField);

    return evaluateComparison(businessValue, operator, value, `Business ${businessField}`);
}

function evaluateLoyaltyCondition(condition, context) {
    const { loyaltyMetric, operator, value } = condition;
    const loyaltyData = context.user?.loyalty || {};

    let actualValue;

    switch (loyaltyMetric) {
        case 'points':
            actualValue = loyaltyData.points || 0;
            break;
            
        case 'tier':
            actualValue = loyaltyData.tier || 'bronze';
            break;
            
        case 'membershipDays':
            if (loyaltyData.joinDate) {
                const joinDate = new Date(loyaltyData.joinDate);
                actualValue = Math.floor((new Date() - joinDate) / (1000 * 60 * 60 * 24));
            } else {
                actualValue = 0;
            }
            break;
            
        default:
            actualValue = 0;
    }

    return evaluateComparison(actualValue, operator, value, `Loyalty ${loyaltyMetric}`);
}

function evaluateCustomCondition(condition, context) {
    try {
        // For custom conditions, we'd execute custom logic
        // This is a simplified implementation
        const { customLogic, parameters } = condition;
        
        // Here you would implement custom business logic
        // For now, we'll return a basic evaluation
        
        return {
            passed: true,
            message: 'Custom condition evaluated',
            value: 'custom_result',
            expected: parameters?.expectedValue || 'any'
        };

    } catch (error) {
        return {
            passed: false,
            message: `Custom condition error: ${error.message}`,
            value: null,
            expected: condition.parameters?.expectedValue
        };
    }
}

function evaluateComparison(actualValue, operator, expectedValue, fieldDescription) {
    let passed = false;
    
    switch (operator) {
        case 'equals':
        case '==':
            passed = actualValue == expectedValue;
            break;
            
        case 'notEquals':
        case '!=':
            passed = actualValue != expectedValue;
            break;
            
        case 'greaterThan':
        case '>':
            passed = Number(actualValue) > Number(expectedValue);
            break;
            
        case 'lessThan':
        case '<':
            passed = Number(actualValue) < Number(expectedValue);
            break;
            
        case 'greaterThanOrEqual':
        case '>=':
            passed = Number(actualValue) >= Number(expectedValue);
            break;
            
        case 'lessThanOrEqual':
        case '<=':
            passed = Number(actualValue) <= Number(expectedValue);
            break;
            
        case 'contains':
            passed = String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());
            break;
            
        case 'notContains':
            passed = !String(actualValue).toLowerCase().includes(String(expectedValue).toLowerCase());
            break;
            
        case 'in':
            const expectedArray = Array.isArray(expectedValue) ? expectedValue : [expectedValue];
            passed = expectedArray.includes(actualValue);
            break;
            
        case 'notIn':
            const notInArray = Array.isArray(expectedValue) ? expectedValue : [expectedValue];
            passed = !notInArray.includes(actualValue);
            break;
            
        case 'exists':
            passed = actualValue !== null && actualValue !== undefined;
            break;
            
        case 'notExists':
            passed = actualValue === null || actualValue === undefined;
            break;
            
        default:
            passed = false;
    }

    return {
        passed,
        message: passed ? 
            `${fieldDescription} condition met` : 
            `${fieldDescription} condition not met`,
        value: actualValue,
        expected: expectedValue
    };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getNestedValue(obj, path) {
    if (!obj || !path) return null;
    
    return path.split('.').reduce((current, key) => {
        return current && current[key] !== undefined ? current[key] : null;
    }, obj);
}

function filterTransactionsByTimeframe(transactions, timeframe) {
    if (!timeframe) return transactions;
    
    const now = new Date();
    let cutoffDate;
    
    switch (timeframe) {
        case '7days':
            cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30days':
            cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '90days':
            cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case '1year':
            cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        default:
            return transactions;
    }
    
    return transactions.filter(t => new Date(t.createdAt) >= cutoffDate);
}

async function getUserProfile(userId) {
    try {
        const result = await dynamoDB.get({
            TableName: USERS_TABLE,
            Key: { userId }
        }).promise();
        
        return result.Item || {};
    } catch (error) {
        console.error('❌ Error fetching user profile:', error);
        return {};
    }
}

async function getUserHistory(userId) {
    try {
        const result = await dynamoDB.query({
            TableName: TRANSACTIONS_TABLE,
            IndexName: 'userId-index',
            KeyConditionExpression: 'userId = :userId',
            ExpressionAttributeValues: {
                ':userId': userId
            },
            ScanIndexForward: false, // Latest first
            Limit: 100 // Limit for performance
        }).promise();
        
        return {
            transactions: result.Items || []
        };
    } catch (error) {
        console.error('❌ Error fetching user history:', error);
        return { transactions: [] };
    }
}

async function enrichOrderContext(orderData) {
    try {
        if (!orderData || !orderData.businessId) {
            return orderData || {};
        }
        
        // Get business details
        const businessResult = await dynamoDB.get({
            TableName: BUSINESSES_TABLE,
            Key: { businessId: orderData.businessId }
        }).promise();
        
        return {
            ...orderData,
            business: businessResult.Item || {}
        };
    } catch (error) {
        console.error('❌ Error enriching order context:', error);
        return orderData || {};
    }
}

async function getCampaignConditionsList(campaignId) {
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

async function validateConditions(requestData, userContext) {
    try {
        const { conditions } = requestData;
        
        const validationResults = [];
        
        for (const condition of conditions) {
            const validation = validateConditionStructure(condition);
            validationResults.push({
                conditionId: condition.conditionId || condition.id,
                valid: validation.valid,
                errors: validation.errors
            });
        }
        
        const allValid = validationResults.every(r => r.valid);
        
        return createResponse(200, {
            success: true,
            valid: allValid,
            results: validationResults
        });
        
    } catch (error) {
        console.error('❌ Error validating conditions:', error);
        return createResponse(500, { error: 'Failed to validate conditions' });
    }
}

function validateConditionStructure(condition) {
    const errors = [];
    
    if (!condition.type) {
        errors.push('Condition type is required');
    }
    
    if (!condition.field && condition.type !== 'customCondition') {
        errors.push('Condition field is required');
    }
    
    if (!condition.operator && condition.type !== 'customCondition') {
        errors.push('Condition operator is required');
    }
    
    if (condition.value === undefined && condition.type !== 'customCondition') {
        errors.push('Condition value is required');
    }
    
    return {
        valid: errors.length === 0,
        errors
    };
}

async function getCampaignConditions(campaignId, userContext) {
    try {
        const conditions = await getCampaignConditionsList(campaignId);
        
        return createResponse(200, {
            success: true,
            data: conditions
        });
        
    } catch (error) {
        console.error('❌ Error getting campaign conditions:', error);
        return createResponse(500, { error: 'Failed to get campaign conditions' });
    }
}

async function saveCampaignConditions(campaignId, requestData, userContext) {
    try {
        const { conditions } = requestData;
        
        // Validate all conditions first
        for (const condition of conditions) {
            const validation = validateConditionStructure(condition);
            if (!validation.valid) {
                return createResponse(400, {
                    error: 'Invalid condition structure',
                    details: validation.errors
                });
            }
        }
        
        // Delete existing conditions
        const existing = await getCampaignConditionsList(campaignId);
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
                conditionId: condition.conditionId || `cond_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                ...condition,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            await dynamoDB.put({
                TableName: CONDITIONS_TABLE,
                Item: conditionItem
            }).promise();
        }
        
        return createResponse(200, {
            success: true,
            message: 'Conditions saved successfully'
        });
        
    } catch (error) {
        console.error('❌ Error saving campaign conditions:', error);
        return createResponse(500, { error: 'Failed to save campaign conditions' });
    }
}

async function testConditions(requestData, userContext) {
    try {
        const { conditions, testData } = requestData;
        
        // Create mock evaluation context
        const evaluationContext = {
            user: testData.user || {},
            history: testData.history || { transactions: [] },
            order: testData.order || {},
            timestamp: new Date().toISOString()
        };
        
        // Evaluate each condition
        const results = [];
        for (const condition of conditions) {
            const result = await evaluateCondition(condition, evaluationContext);
            results.push({
                conditionId: condition.conditionId || condition.id,
                type: condition.type,
                passed: result.passed,
                message: result.message,
                value: result.value,
                expected: result.expected
            });
        }
        
        const overallResult = results.every(r => r.passed);
        
        return createResponse(200, {
            success: true,
            result: overallResult,
            details: results
        });
        
    } catch (error) {
        console.error('❌ Error testing conditions:', error);
        return createResponse(500, { error: 'Failed to test conditions' });
    }
}

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
