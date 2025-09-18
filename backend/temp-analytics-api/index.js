/**
 * WizzCentral Campaign Analytics API
 * Advanced analytics and reporting for campaigns
 * Author: WizzCentral Dev Team
 */

const AWS = require('aws-sdk');

// Initialize AWS services
const dynamoDB = new AWS.DynamoDB.DocumentClient();

// Table names
const CAMPAIGNS_TABLE = 'WizzCentral_Campaigns';
const USAGE_TABLE = 'WizzCentral_Campaign_Usage';
const ANALYTICS_TABLE = 'WizzCentral_Campaign_Analytics';

// CORS headers
const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

exports.handler = async (event) => {
    console.log('📊 Analytics API Request:', JSON.stringify(event, null, 2));

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

        // Extract user context from JWT
        const userContext = extractUserContext(event);
        
        // Route to appropriate handler
        switch (true) {
            case path === '/analytics/dashboard' && httpMethod === 'GET':
                return await getDashboardAnalytics(queryParams, userContext);
                
            case path === '/analytics/campaigns/{campaignId}' && httpMethod === 'GET':
                return await getCampaignDetailedAnalytics(pathParams.campaignId, queryParams, userContext);
                
            case path === '/analytics/performance' && httpMethod === 'GET':
                return await getPerformanceMetrics(queryParams, userContext);
                
            case path === '/analytics/trends' && httpMethod === 'GET':
                return await getTrendAnalytics(queryParams, userContext);
                
            case path === '/analytics/export' && httpMethod === 'GET':
                return await exportAnalytics(queryParams, userContext);
                
            case path === '/analytics/realtime' && httpMethod === 'GET':
                return await getRealtimeMetrics(queryParams, userContext);
                
            default:
                return createResponse(404, { error: 'Analytics route not found' });
        }
        
    } catch (error) {
        console.error('❌ Analytics API Error:', error);
        return createResponse(500, { 
            error: 'Internal server error',
            message: error.message 
        });
    }
};

// ============================================
// ANALYTICS ENDPOINTS
// ============================================

async function getDashboardAnalytics(queryParams, userContext) {
    try {
        const { period = '30days', timezone = 'Asia/Baghdad' } = queryParams;
        
        // Get overview metrics
        const overview = await getOverviewMetrics(period);
        
        // Get top performing campaigns
        const topCampaigns = await getTopPerformingCampaigns(period, 10);
        
        // Get usage trends
        const usageTrends = await getUsageTrends(period);
        
        // Get conversion metrics
        const conversionMetrics = await getConversionMetrics(period);
        
        return createResponse(200, {
            success: true,
            data: {
                overview,
                topCampaigns,
                usageTrends,
                conversionMetrics,
                generatedAt: new Date().toISOString(),
                period
            }
        });

    } catch (error) {
        console.error('❌ Error getting dashboard analytics:', error);
        return createResponse(500, { error: 'Failed to get dashboard analytics' });
    }
}

async function getCampaignDetailedAnalytics(campaignId, queryParams, userContext) {
    try {
        const { startDate, endDate, granularity = 'daily' } = queryParams;
        
        // Get campaign basic info
        const campaign = await getCampaignInfo(campaignId);
        if (!campaign) {
            return createResponse(404, { error: 'Campaign not found' });
        }
        
        // Get detailed metrics
        const metrics = await getCampaignMetrics(campaignId, startDate, endDate);
        
        // Get usage breakdown
        const usageBreakdown = await getCampaignUsageBreakdown(campaignId, startDate, endDate);
        
        // Get time series data
        const timeSeries = await getCampaignTimeSeries(campaignId, startDate, endDate, granularity);
        
        // Get user segments
        const userSegments = await getCampaignUserSegments(campaignId, startDate, endDate);
        
        return createResponse(200, {
            success: true,
            data: {
                campaign: {
                    id: campaign.campaignId,
                    title: campaign.title,
                    type: campaign.type,
                    status: campaign.status
                },
                metrics,
                usageBreakdown,
                timeSeries,
                userSegments,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error getting campaign analytics:', error);
        return createResponse(500, { error: 'Failed to get campaign analytics' });
    }
}

async function getPerformanceMetrics(queryParams, userContext) {
    try {
        const { period = '30days', sortBy = 'usage', limit = 50 } = queryParams;
        
        // Get all active campaigns
        const campaigns = await getActiveCampaigns();
        
        // Calculate performance metrics for each campaign
        const performanceData = [];
        
        for (const campaign of campaigns) {
            const metrics = await getCampaignPerformanceMetrics(campaign.campaignId, period);
            performanceData.push({
                campaignId: campaign.campaignId,
                title: campaign.title,
                type: campaign.type,
                ...metrics
            });
        }
        
        // Sort by specified metric
        performanceData.sort((a, b) => {
            switch (sortBy) {
                case 'usage':
                    return b.totalUsage - a.totalUsage;
                case 'revenue':
                    return b.totalRevenue - a.totalRevenue;
                case 'conversion':
                    return b.conversionRate - a.conversionRate;
                case 'roi':
                    return b.roi - a.roi;
                default:
                    return b.totalUsage - a.totalUsage;
            }
        });
        
        // Limit results
        const limitedResults = performanceData.slice(0, parseInt(limit));
        
        return createResponse(200, {
            success: true,
            data: limitedResults,
            metadata: {
                totalCampaigns: campaigns.length,
                period,
                sortBy,
                generatedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('❌ Error getting performance metrics:', error);
        return createResponse(500, { error: 'Failed to get performance metrics' });
    }
}

async function getTrendAnalytics(queryParams, userContext) {
    try {
        const { period = '30days', metric = 'usage', granularity = 'daily' } = queryParams;
        
        // Get trend data for the specified metric
        const trendData = await getTrendData(metric, period, granularity);
        
        // Calculate trend indicators
        const trendIndicators = calculateTrendIndicators(trendData);
        
        // Get comparative data (previous period)
        const previousPeriod = getPreviousPeriod(period);
        const previousData = await getTrendData(metric, previousPeriod, granularity);
        const comparison = calculatePeriodComparison(trendData, previousData);
        
        return createResponse(200, {
            success: true,
            data: {
                current: trendData,
                previous: previousData,
                indicators: trendIndicators,
                comparison,
                metadata: {
                    metric,
                    period,
                    granularity,
                    generatedAt: new Date().toISOString()
                }
            }
        });

    } catch (error) {
        console.error('❌ Error getting trend analytics:', error);
        return createResponse(500, { error: 'Failed to get trend analytics' });
    }
}

async function exportAnalytics(queryParams, userContext) {
    try {
        const { 
            campaignIds, 
            startDate, 
            endDate, 
            format = 'csv',
            includeDetails = 'true'
        } = queryParams;
        
        // Parse campaign IDs
        const campaigns = campaignIds ? campaignIds.split(',') : [];
        
        // Generate export data
        const exportData = await generateExportData(campaigns, startDate, endDate, includeDetails === 'true');
        
        // Format data based on requested format
        let formattedData;
        let contentType;
        
        switch (format.toLowerCase()) {
            case 'csv':
                formattedData = formatAsCSV(exportData);
                contentType = 'text/csv';
                break;
            case 'json':
                formattedData = JSON.stringify(exportData, null, 2);
                contentType = 'application/json';
                break;
            case 'excel':
                // For Excel format, you'd typically use a library like xlsx
                formattedData = JSON.stringify(exportData, null, 2);
                contentType = 'application/json';
                break;
            default:
                formattedData = JSON.stringify(exportData, null, 2);
                contentType = 'application/json';
        }
        
        return {
            statusCode: 200,
            headers: {
                ...headers,
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="campaign_analytics_${new Date().toISOString().split('T')[0]}.${format}"`
            },
            body: formattedData
        };

    } catch (error) {
        console.error('❌ Error exporting analytics:', error);
        return createResponse(500, { error: 'Failed to export analytics' });
    }
}

async function getRealtimeMetrics(queryParams, userContext) {
    try {
        const { campaignIds } = queryParams;
        
        // Get real-time metrics for specified campaigns or all active campaigns
        const campaigns = campaignIds ? 
            campaignIds.split(',') : 
            (await getActiveCampaigns()).map(c => c.campaignId);
        
        const realtimeData = [];
        
        for (const campaignId of campaigns) {
            const metrics = await getRealtimeCampaignMetrics(campaignId);
            realtimeData.push(metrics);
        }
        
        return createResponse(200, {
            success: true,
            data: realtimeData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Error getting realtime metrics:', error);
        return createResponse(500, { error: 'Failed to get realtime metrics' });
    }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getOverviewMetrics(period) {
    try {
        const dateRange = getPeriodDateRange(period);
        
        // Get total campaigns
        const totalCampaigns = await getTotalActiveCampaigns();
        
        // Get usage metrics
        const usageMetrics = await getUsageMetrics(dateRange.start, dateRange.end);
        
        // Get revenue metrics
        const revenueMetrics = await getRevenueMetrics(dateRange.start, dateRange.end);
        
        return {
            totalActiveCampaigns: totalCampaigns,
            totalUsages: usageMetrics.total,
            totalDiscount: usageMetrics.totalDiscount,
            averageDiscount: usageMetrics.averageDiscount,
            totalRevenue: revenueMetrics.total,
            conversionRate: usageMetrics.conversionRate,
            period
        };

    } catch (error) {
        console.error('❌ Error getting overview metrics:', error);
        return {};
    }
}

async function getTopPerformingCampaigns(period, limit) {
    try {
        const dateRange = getPeriodDateRange(period);
        
        // Query usage data for the period
        const params = {
            TableName: USAGE_TABLE,
            FilterExpression: '#timestamp BETWEEN :start AND :end',
            ExpressionAttributeNames: {
                '#timestamp': 'timestamp'
            },
            ExpressionAttributeValues: {
                ':start': dateRange.start,
                ':end': dateRange.end
            }
        };
        
        const result = await dynamoDB.scan(params).promise();
        const usageData = result.Items || [];
        
        // Group by campaign
        const campaignUsage = {};
        for (const usage of usageData) {
            if (!campaignUsage[usage.campaignId]) {
                campaignUsage[usage.campaignId] = {
                    campaignId: usage.campaignId,
                    usageCount: 0,
                    totalDiscount: 0
                };
            }
            campaignUsage[usage.campaignId].usageCount++;
            campaignUsage[usage.campaignId].totalDiscount += usage.discountAmount || 0;
        }
        
        // Get campaign details and sort
        const campaignList = Object.values(campaignUsage);
        campaignList.sort((a, b) => b.usageCount - a.usageCount);
        
        // Enrich with campaign details
        const enrichedCampaigns = [];
        for (const campaign of campaignList.slice(0, limit)) {
            const details = await getCampaignInfo(campaign.campaignId);
            if (details) {
                enrichedCampaigns.push({
                    ...campaign,
                    title: details.title,
                    type: details.type
                });
            }
        }
        
        return enrichedCampaigns;

    } catch (error) {
        console.error('❌ Error getting top performing campaigns:', error);
        return [];
    }
}

async function getCampaignInfo(campaignId) {
    try {
        const result = await dynamoDB.get({
            TableName: CAMPAIGNS_TABLE,
            Key: { campaignId }
        }).promise();
        
        return result.Item;

    } catch (error) {
        console.error('❌ Error getting campaign info:', error);
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

function getPeriodDateRange(period) {
    const now = new Date();
    let start;
    
    switch (period) {
        case '7days':
            start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
        case '30days':
            start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
        case '90days':
            start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
        case '1year':
            start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
        default:
            start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    return {
        start: start.toISOString(),
        end: now.toISOString()
    };
}

async function getTotalActiveCampaigns() {
    try {
        const campaigns = await getActiveCampaigns();
        return campaigns.length;
    } catch (error) {
        return 0;
    }
}

async function getUsageMetrics(startDate, endDate) {
    try {
        const params = {
            TableName: USAGE_TABLE,
            FilterExpression: '#timestamp BETWEEN :start AND :end',
            ExpressionAttributeNames: {
                '#timestamp': 'timestamp'
            },
            ExpressionAttributeValues: {
                ':start': startDate,
                ':end': endDate
            }
        };
        
        const result = await dynamoDB.scan(params).promise();
        const usages = result.Items || [];
        
        const total = usages.length;
        const totalDiscount = usages.reduce((sum, usage) => sum + (usage.discountAmount || 0), 0);
        const averageDiscount = total > 0 ? totalDiscount / total : 0;
        
        return {
            total,
            totalDiscount,
            averageDiscount,
            conversionRate: 0 // Would calculate based on views vs applications
        };

    } catch (error) {
        console.error('❌ Error getting usage metrics:', error);
        return { total: 0, totalDiscount: 0, averageDiscount: 0, conversionRate: 0 };
    }
}

async function getRevenueMetrics(startDate, endDate) {
    // This would integrate with order/revenue data
    return { total: 0 };
}

function formatAsCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
        Object.values(row).map(value => 
            typeof value === 'string' ? `"${value}"` : value
        ).join(',')
    );
    
    return [headers, ...rows].join('\n');
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

// Additional helper functions would be implemented here for:
// - getCampaignMetrics
// - getCampaignUsageBreakdown
// - getCampaignTimeSeries
// - getCampaignUserSegments
// - getCampaignPerformanceMetrics
// - getTrendData
// - calculateTrendIndicators
// - calculatePeriodComparison
// - generateExportData
// - getRealtimeCampaignMetrics
