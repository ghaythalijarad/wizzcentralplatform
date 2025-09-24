/**
 * Commission and Delivery Fee Management System
 * Handles merchant commissions, delivery fee calculations, and financial reporting
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

// Configure AWS SDK
const ddbClient = new DynamoDBClient({
    region: process.env.AWS_REGION || 'us-east-1'
});
const dynamoDB = DynamoDBDocumentClient.from(ddbClient);

const COMMISSION_TABLE = 'WizzCentral_CommissionRules';
const DELIVERY_FEE_TABLE = 'WizzCentral_DeliveryFeeRules';
const FINANCIAL_REPORTS_TABLE = 'WizzCentral_FinancialReports';

/**
 * Commission Management
 */

// Commission rule types
const COMMISSION_TYPES = {
    PERCENTAGE: 'percentage',           // % of order value
    FLAT_FEE: 'flat_fee',              // Fixed amount per order
    TIERED: 'tiered',                  // Different rates based on order value/volume
    HYBRID: 'hybrid'                   // Combination of percentage + flat fee
};

// Commission calculation models
const COMMISSION_MODELS = {
    ORDER_VALUE: 'order_value',        // Based on order total
    NET_VALUE: 'net_value',            // Based on order total minus taxes/fees
    ITEM_COUNT: 'item_count',          // Based on number of items
    MONTHLY_VOLUME: 'monthly_volume'   // Based on merchant's monthly sales volume
};

// Default commission rules
const defaultCommissionRules = [
    {
        ruleId: 'COMM_DEFAULT',
        ruleName: 'Default Commission Rule',
        ruleType: COMMISSION_TYPES.PERCENTAGE,
        calculationModel: COMMISSION_MODELS.ORDER_VALUE,
        isActive: true,
        priority: 100,
        conditions: {
            merchantType: 'all',
            regionId: 'all',
            minimumOrderValue: 0,
            maximumOrderValue: null
        },
        rates: {
            percentage: 15.0,
            flatFee: 0,
            currency: 'IQD'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        ruleId: 'COMM_PREMIUM_MERCHANT',
        ruleName: 'Premium Merchant Commission',
        ruleType: COMMISSION_TYPES.TIERED,
        calculationModel: COMMISSION_MODELS.MONTHLY_VOLUME,
        isActive: true,
        priority: 1,
        conditions: {
            merchantType: 'premium',
            regionId: 'all',
            minimumMonthlyVolume: 5000000 // 5M IQD
        },
        rates: {
            tiers: [
                { minValue: 0, maxValue: 10000000, percentage: 12.0 },      // 0-10M: 12%
                { minValue: 10000000, maxValue: 50000000, percentage: 10.0 }, // 10M-50M: 10%
                { minValue: 50000000, maxValue: null, percentage: 8.0 }      // 50M+: 8%
            ],
            currency: 'IQD'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        ruleId: 'COMM_NEW_MERCHANT',
        ruleName: 'New Merchant Promotion',
        ruleType: COMMISSION_TYPES.HYBRID,
        calculationModel: COMMISSION_MODELS.ORDER_VALUE,
        isActive: true,
        priority: 5,
        conditions: {
            merchantType: 'new',
            regionId: 'all',
            validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
            maxOrdersApplicable: 100
        },
        rates: {
            percentage: 8.0,
            flatFee: 500,
            currency: 'IQD'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

/**
 * Delivery Fee Management
 */

// Delivery fee calculation types
const DELIVERY_FEE_TYPES = {
    FLAT: 'flat',                      // Fixed fee per delivery
    DISTANCE_BASED: 'distance_based',   // Based on delivery distance
    ZONE_BASED: 'zone_based',          // Based on delivery zones
    TIME_BASED: 'time_based',          // Based on delivery time (peak hours)
    DYNAMIC: 'dynamic'                 // AI-based dynamic pricing
};

// Delivery fee factors
const DELIVERY_FEE_FACTORS = {
    DISTANCE: 'distance',
    TIME_OF_DAY: 'time_of_day',
    WEATHER: 'weather',
    DEMAND: 'demand',
    TRAFFIC: 'traffic',
    VEHICLE_TYPE: 'vehicle_type'
};

// Default delivery fee rules
const defaultDeliveryFeeRules = [
    {
        ruleId: 'DELIV_BAGHDAD_STANDARD',
        ruleName: 'Baghdad Standard Delivery',
        ruleType: DELIVERY_FEE_TYPES.DISTANCE_BASED,
        isActive: true,
        priority: 10,
        conditions: {
            regionId: 'REG_IQ_BGD',
            serviceType: 'standard',
            timeWindow: 'all'
        },
        rates: {
            baseFee: 2000, // Base fee in IQD
            perKmRate: 250, // Additional cost per km
            minimumFee: 1500,
            maximumFee: 8000,
            freeDeliveryThreshold: 25000, // Free delivery for orders above 25K IQD
            currency: 'IQD'
        },
        factors: [
            {
                factor: DELIVERY_FEE_FACTORS.TIME_OF_DAY,
                peakHours: ['12:00-14:00', '19:00-22:00'],
                peakMultiplier: 1.3
            },
            {
                factor: DELIVERY_FEE_FACTORS.WEATHER,
                conditions: ['rain', 'storm'],
                weatherMultiplier: 1.5
            }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        ruleId: 'DELIV_BASRA_ZONE',
        ruleName: 'Basra Zone-Based Delivery',
        ruleType: DELIVERY_FEE_TYPES.ZONE_BASED,
        isActive: true,
        priority: 10,
        conditions: {
            regionId: 'REG_IQ_BSR',
            serviceType: 'standard'
        },
        rates: {
            zones: [
                { zoneId: 'ZONE_1', name: 'City Center', fee: 2500, radius: 5000 },
                { zoneId: 'ZONE_2', name: 'Suburban', fee: 3500, radius: 15000 },
                { zoneId: 'ZONE_3', name: 'Outskirts', fee: 5000, radius: 30000 }
            ],
            freeDeliveryThreshold: 30000,
            currency: 'IQD'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        ruleId: 'DELIV_EXPRESS',
        ruleName: 'Express Delivery Premium',
        ruleType: DELIVERY_FEE_TYPES.FLAT,
        isActive: true,
        priority: 1,
        conditions: {
            regionId: 'all',
            serviceType: 'express',
            maxDeliveryTime: 30 // 30 minutes
        },
        rates: {
            baseFee: 5000,
            minimumFee: 5000,
            currency: 'IQD'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

/**
 * Financial Calculation Functions
 */

class CommissionCalculator {
    static calculateCommission(orderData, commissionRule) {
        const { ruleType, rates, calculationModel } = commissionRule;
        let baseValue;

        // Determine base value for calculation
        switch (calculationModel) {
            case COMMISSION_MODELS.ORDER_VALUE:
                baseValue = orderData.totalAmount;
                break;
            case COMMISSION_MODELS.NET_VALUE:
                baseValue = orderData.totalAmount - (orderData.taxes || 0) - (orderData.deliveryFee || 0);
                break;
            case COMMISSION_MODELS.ITEM_COUNT:
                baseValue = orderData.itemCount || 1;
                break;
            default:
                baseValue = orderData.totalAmount;
        }

        let commission = 0;

        switch (ruleType) {
            case COMMISSION_TYPES.PERCENTAGE:
                commission = (baseValue * rates.percentage) / 100;
                break;

            case COMMISSION_TYPES.FLAT_FEE:
                commission = rates.flatFee;
                break;

            case COMMISSION_TYPES.TIERED:
                commission = this.calculateTieredCommission(baseValue, rates.tiers);
                break;

            case COMMISSION_TYPES.HYBRID:
                commission = (baseValue * rates.percentage) / 100 + rates.flatFee;
                break;

            default:
                commission = 0;
        }

        return {
            commissionAmount: Math.round(commission),
            ruleId: commissionRule.ruleId,
            calculationModel,
            baseValue,
            appliedRate: rates
        };
    }

    static calculateTieredCommission(value, tiers) {
        for (const tier of tiers) {
            if (value >= tier.minValue && (tier.maxValue === null || value <= tier.maxValue)) {
                return (value * tier.percentage) / 100;
            }
        }
        return 0;
    }
}

class DeliveryFeeCalculator {
    static calculateDeliveryFee(deliveryData, feeRule) {
        const { ruleType, rates, factors } = feeRule;
        let baseFee = 0;

        switch (ruleType) {
            case DELIVERY_FEE_TYPES.FLAT:
                baseFee = rates.baseFee;
                break;

            case DELIVERY_FEE_TYPES.DISTANCE_BASED:
                baseFee = rates.baseFee + (deliveryData.distanceKm * rates.perKmRate);
                break;

            case DELIVERY_FEE_TYPES.ZONE_BASED:
                const zone = this.findDeliveryZone(deliveryData.distanceKm, rates.zones);
                baseFee = zone ? zone.fee : rates.zones[rates.zones.length - 1].fee;
                break;

            case DELIVERY_FEE_TYPES.TIME_BASED:
                baseFee = this.calculateTimeBased(deliveryData, rates);
                break;

            default:
                baseFee = rates.baseFee || 2000;
        }

        // Apply factors (peak hours, weather, etc.)
        let finalFee = this.applyFactors(baseFee, deliveryData, factors);

        // Apply min/max constraints
        if (rates.minimumFee) finalFee = Math.max(finalFee, rates.minimumFee);
        if (rates.maximumFee) finalFee = Math.min(finalFee, rates.maximumFee);

        // Check for free delivery threshold
        if (rates.freeDeliveryThreshold && deliveryData.orderValue >= rates.freeDeliveryThreshold) {
            finalFee = 0;
        }

        return {
            deliveryFee: Math.round(finalFee),
            ruleId: feeRule.ruleId,
            baseFee: Math.round(baseFee),
            appliedFactors: factors,
            freeDeliveryApplied: finalFee === 0 && rates.freeDeliveryThreshold
        };
    }

    static findDeliveryZone(distance, zones) {
        return zones.find(zone => distance <= zone.radius);
    }

    static applyFactors(baseFee, deliveryData, factors) {
        let multiplier = 1;

        if (!factors) return baseFee;

        factors.forEach(factor => {
            switch (factor.factor) {
                case DELIVERY_FEE_FACTORS.TIME_OF_DAY:
                    if (this.isInPeakHours(deliveryData.deliveryTime, factor.peakHours)) {
                        multiplier *= factor.peakMultiplier;
                    }
                    break;
                case DELIVERY_FEE_FACTORS.WEATHER:
                    if (factor.conditions.includes(deliveryData.weather)) {
                        multiplier *= factor.weatherMultiplier;
                    }
                    break;
            }
        });

        return baseFee * multiplier;
    }

    static isInPeakHours(currentTime, peakHours) {
        const currentHour = new Date(currentTime).getHours();
        return peakHours.some(range => {
            const [start, end] = range.split('-').map(time => parseInt(time.split(':')[0]));
            return currentHour >= start && currentHour <= end;
        });
    }
}

/**
 * Financial Reporting Functions
 */

class FinancialReportGenerator {
    static async generateMerchantCommissionReport(merchantId, startDate, endDate) {
        // This would integrate with order data to calculate actual commissions
        return {
            merchantId,
            period: { startDate, endDate },
            totalOrders: 0,
            totalRevenue: 0,
            totalCommissions: 0,
            averageCommissionRate: 0,
            commissionsBreakdown: [],
            generatedAt: new Date().toISOString()
        };
    }

    static async generateDeliveryFeeReport(regionId, startDate, endDate) {
        return {
            regionId,
            period: { startDate, endDate },
            totalDeliveries: 0,
            totalDeliveryFees: 0,
            averageDeliveryFee: 0,
            feeBreakdown: [],
            generatedAt: new Date().toISOString()
        };
    }

    static async generateFinancialSummary(startDate, endDate) {
        return {
            period: { startDate, endDate },
            summary: {
                totalRevenue: 0,
                totalCommissions: 0,
                totalDeliveryFees: 0,
                netRevenue: 0,
                commissionsPercentage: 0
            },
            trends: [],
            generatedAt: new Date().toISOString()
        };
    }
}

module.exports = {
    COMMISSION_TYPES,
    COMMISSION_MODELS,
    DELIVERY_FEE_TYPES,
    DELIVERY_FEE_FACTORS,
    defaultCommissionRules,
    defaultDeliveryFeeRules,
    CommissionCalculator,
    DeliveryFeeCalculator,
    FinancialReportGenerator,
    COMMISSION_TABLE,
    DELIVERY_FEE_TABLE,
    FINANCIAL_REPORTS_TABLE
};
