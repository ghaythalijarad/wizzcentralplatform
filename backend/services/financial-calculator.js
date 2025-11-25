/**
 * Financial Calculator Service
 * Handles commission and delivery fee calculations
 */

class FinancialCalculator {
    /**
     * Calculate commission based on order data and active rules
     * @param {Object} orderData - Order information
     * @param {Array} rules - Array of commission rules
     * @returns {Object} Commission calculation result
     */
    calculateCommission(orderData, rules) {
        const { totalAmount, merchantId } = orderData; // removed merchantType usage (legacy fallback)
        if (!merchantId) {
            return { success: false, error: 'merchantId is required for commission calculation' };
        }
        const now = Date.now();
        const isActive = (r) => r.isActive === true || r.isActive === 'true';
        const inWindow = (r) => (!r.effectiveFrom || now >= r.effectiveFrom) && (!r.effectiveTo || now <= r.effectiveTo);
        // Only merchant-specific rules (legacy merchantType fallback removed)
        let applicableRules = (rules || []).filter(rule => {
            if (!isActive(rule)) return false;
            if (rule.merchantId !== merchantId) return false;
            if (!inWindow(rule)) return false;
            return true;
        });
        if (applicableRules.length === 0) {
            return { success: false, error: 'No commission rule found for merchant', merchantId };
        }
        applicableRules.sort((a, b) => (a.priority || 999) - (b.priority || 999));
        const selectedRule = applicableRules[0];
        const commissionAmount = this._calculateCommissionAmount(totalAmount, selectedRule);
        return {
            success: true,
            commission: {
                commissionAmount: Math.round(commissionAmount * 100) / 100,
                orderAmount: totalAmount,
                merchantReceives: Math.round((totalAmount - commissionAmount) * 100) / 100,
                appliedRate: selectedRule.rates,
                calculationType: selectedRule.ruleType
            },
            appliedRule: {
                ruleId: selectedRule.ruleId,
                ruleName: selectedRule.ruleName,
                priority: selectedRule.priority
            }
        };
    }
    
    /**
     * Calculate actual commission amount based on rule type
     * @private
     */
    _calculateCommissionAmount(amount, rule) {
        const { ruleType, rates } = rule;
        
        switch (ruleType) {
            case 'percentage':
                return amount * (rates.percentage / 100);
            
            case 'flat_fee':
                return rates.flatFee;
            
            case 'hybrid':
                const percentageAmount = amount * (rates.percentage / 100);
                return percentageAmount + rates.flatFee;
            
            case 'tiered':
                // Find applicable tier
                const tier = rates.tiers.find(t => {
                    const inRange = amount >= t.minValue;
                    const belowMax = t.maxValue === null || amount <= t.maxValue;
                    return inRange && belowMax;
                });
                
                if (tier) {
                    return amount * (tier.percentage / 100);
                }
                
                // Fallback to last tier if no match
                const lastTier = rates.tiers[rates.tiers.length - 1];
                return amount * (lastTier.percentage / 100);
            
            default:
                return 0;
        }
    }
    
    /**
     * Calculate delivery fee based on delivery data and rules
     * @param {Object} deliveryData - Delivery information
     * @param {Array} rules - Array of delivery fee rules
     * @returns {Object} Delivery fee calculation result
     */
    calculateDeliveryFee(deliveryData, rules) {
        const {
            distance = 0,
            orderValue = 0,
            regionId = 'all',
            serviceType = 'standard',
            fromLocation,
            toLocation
        } = deliveryData;
        
        // Filter applicable rules
        const applicableRules = rules.filter(rule => {
            // Handle both string ('true'/'false') and boolean formats
            const isActive = rule.isActive === true || rule.isActive === 'true';
            if (!isActive) return false;
            
            // Check region condition
            const regionMatch = 
                rule.conditions.regionId === 'all' || 
                rule.conditions.regionId === regionId;
            
            // Check service type condition
            const serviceTypeMatch = 
                !rule.conditions.serviceType || 
                rule.conditions.serviceType === serviceType;
            
            return regionMatch && serviceTypeMatch;
        });
        
        if (applicableRules.length === 0) {
            return {
                success: false,
                error: 'No applicable delivery fee rule found',
                distance,
                orderValue
            };
        }
        
        // Sort by priority
        applicableRules.sort((a, b) => a.priority - b.priority);
        
        // Apply the highest priority rule
        const selectedRule = applicableRules[0];
        let deliveryFee = this._calculateDeliveryFeeAmount(distance, orderValue, selectedRule);
        
        // Apply min/max caps
        const { rates } = selectedRule;
        if (rates.minimumFee && deliveryFee < rates.minimumFee) {
            deliveryFee = rates.minimumFee;
        }
        if (rates.maximumFee && deliveryFee > rates.maximumFee) {
            deliveryFee = rates.maximumFee;
        }
        
        // Check free delivery threshold
        if (rates.freeDeliveryThreshold && orderValue >= rates.freeDeliveryThreshold) {
            deliveryFee = 0;
        }
        
        return {
            success: true,
            deliveryFee: {
                deliveryFee: Math.round(deliveryFee * 100) / 100,
                baseFee: rates.baseFee || 0,
                distanceFee: Math.round((deliveryFee - (rates.baseFee || 0)) * 100) / 100,
                distance: distance,
                orderValue: orderValue,
                isFree: deliveryFee === 0 && orderValue >= rates.freeDeliveryThreshold
            },
            appliedRule: {
                ruleId: selectedRule.ruleId,
                ruleName: selectedRule.ruleName,
                ruleType: selectedRule.ruleType,
                priority: selectedRule.priority
            }
        };
    }
    
    /**
     * Calculate delivery fee amount based on rule type
     * @private
     */
    _calculateDeliveryFeeAmount(distance, orderValue, rule) {
        const { ruleType, rates } = rule;
        
        switch (ruleType) {
            case 'flat':
                return rates.baseFee || 0;
            
            case 'distance_based':
                const baseFee = rates.baseFee || 0;
                const distanceFee = distance * (rates.perKmRate || 0);
                return baseFee + distanceFee;
            
            case 'zone_based':
                // For zone-based, we'd need zone lookup
                // For now, return base fee as fallback
                return rates.baseFee || 0;
            
            case 'time_based':
                // Time-based would consider rush hours, etc.
                // For now, use base fee
                return rates.baseFee || 0;
            
            default:
                return rates.baseFee || 0;
        }
    }
    
    /**
     * Generate financial report for a date range
     * @param {Array} transactions - Transaction records
     * @param {String} reportType - Type of report
     * @returns {Object} Report data
     */
    generateReport(transactions, reportType, startDate, endDate) {
        const filteredTransactions = transactions.filter(t => {
            const txDate = new Date(t.createdAt);
            const start = new Date(startDate);
            const end = new Date(endDate);
            return txDate >= start && txDate <= end;
        });
        
        switch (reportType) {
            case 'summary':
                return this._generateSummaryReport(filteredTransactions, startDate, endDate);
            
            case 'commission':
                return this._generateCommissionReport(filteredTransactions, startDate, endDate);
            
            case 'delivery-fees':
                return this._generateDeliveryFeesReport(filteredTransactions, startDate, endDate);
            
            default:
                return { success: false, error: 'Invalid report type' };
        }
    }
    
    _generateSummaryReport(transactions, startDate, endDate) {
        const commissionTxs = transactions.filter(t => t.transactionType === 'commission');
        const deliveryTxs = transactions.filter(t => t.transactionType === 'delivery_fee');
        
        const totalCommissions = commissionTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalDeliveryFees = deliveryTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalRevenue = totalCommissions + totalDeliveryFees;
        
        const totalOrderValue = commissionTxs.reduce((sum, t) => 
            sum + (t.calculationDetails?.orderAmount || 0), 0
        );
        
        return {
            success: true,
            data: {
                period: { startDate, endDate },
                generatedAt: new Date().toISOString(),
                summary: {
                    totalRevenue: Math.round(totalRevenue * 100) / 100,
                    totalCommissions: Math.round(totalCommissions * 100) / 100,
                    totalDeliveryFees: Math.round(totalDeliveryFees * 100) / 100,
                    totalOrders: commissionTxs.length,
                    totalDeliveries: deliveryTxs.length,
                    totalOrderValue: Math.round(totalOrderValue * 100) / 100,
                    commissionsPercentage: totalOrderValue > 0 
                        ? Math.round((totalCommissions / totalOrderValue) * 10000) / 100 
                        : 0
                }
            }
        };
    }
    
    _generateCommissionReport(transactions, startDate, endDate) {
        const commissionTxs = transactions.filter(t => t.transactionType === 'commission');
        
        const totalOrders = commissionTxs.length;
        const totalCommissions = commissionTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalOrderValue = commissionTxs.reduce((sum, t) => 
            sum + (t.calculationDetails?.orderAmount || 0), 0
        );
        
        const averageCommissionRate = totalOrderValue > 0 
            ? (totalCommissions / totalOrderValue) * 100 
            : 0;
        
        return {
            success: true,
            data: {
                period: { startDate, endDate },
                generatedAt: new Date().toISOString(),
                totalOrders,
                totalCommissions: Math.round(totalCommissions * 100) / 100,
                totalOrderValue: Math.round(totalOrderValue * 100) / 100,
                averageCommissionRate: Math.round(averageCommissionRate * 100) / 100,
                averageCommissionPerOrder: totalOrders > 0 
                    ? Math.round((totalCommissions / totalOrders) * 100) / 100 
                    : 0
            }
        };
    }
    
    _generateDeliveryFeesReport(transactions, startDate, endDate) {
        const deliveryTxs = transactions.filter(t => t.transactionType === 'delivery_fee');
        
        const totalDeliveries = deliveryTxs.length;
        const totalDeliveryFees = deliveryTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
        const totalDistance = deliveryTxs.reduce((sum, t) => 
            sum + (t.calculationDetails?.distance || 0), 0
        );
        
        return {
            success: true,
            data: {
                period: { startDate, endDate },
                generatedAt: new Date().toISOString(),
                totalDeliveries,
                totalDeliveryFees: Math.round(totalDeliveryFees * 100) / 100,
                totalDistance: Math.round(totalDistance * 100) / 100,
                averageDeliveryFee: totalDeliveries > 0 
                    ? Math.round((totalDeliveryFees / totalDeliveries) * 100) / 100 
                    : 0,
                averageFeePerKm: totalDistance > 0 
                    ? Math.round((totalDeliveryFees / totalDistance) * 100) / 100 
                    : 0
            }
        };
    }
}

module.exports = FinancialCalculator;
