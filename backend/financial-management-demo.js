#!/usr/bin/env node
/**
 * Financial Management System Demo
 * Demonstrates commission calculation, delivery fee calculation, and reporting
 */

const fs = require('fs');
const path = require('path');

// Demo data
const demoOrders = [
    {
        orderId: "ORDER_001",
        merchantId: "MERCHANT_RESTAURANT_001",
        merchantType: "restaurant",
        totalAmount: 28000,
        itemCount: 4,
        regionId: "REG_IQ_BGD",
        deliveryDistance: 3.2,
        orderTime: "2025-09-19T12:30:00Z", // Peak hour
        weather: "clear"
    },
    {
        orderId: "ORDER_002",
        merchantId: "MERCHANT_PREMIUM_001",
        merchantType: "premium",
        totalAmount: 65000,
        itemCount: 8,
        regionId: "REG_IQ_BSR",
        deliveryDistance: 7.5,
        orderTime: "2025-09-19T15:45:00Z", // Non-peak
        weather: "rain"
    },
    {
        orderId: "ORDER_003",
        merchantId: "MERCHANT_NEW_001",
        merchantType: "new",
        totalAmount: 15000,
        itemCount: 2,
        regionId: "REG_IQ_ERB",
        deliveryDistance: 2.1,
        orderTime: "2025-09-19T20:15:00Z", // Peak hour
        weather: "clear"
    }
];

const API_BASE_URL = 'http://localhost:3000';

async function makeAPICall(endpoint, method = 'GET', data = null) {
    const url = `${API_BASE_URL}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (data) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        return await response.json();
    } catch (error) {
        console.error(`❌ API call failed: ${endpoint}`, error);
        return { success: false, error: error.message };
    }
}

async function demonstrateCommissionCalculation() {
    console.log('💸 Commission Calculation Demonstration');
    console.log('═'.repeat(50));
    
    for (const order of demoOrders) {
        console.log(`\n📦 Order: ${order.orderId}`);
        console.log(`   Merchant: ${order.merchantType} (${order.merchantId})`);
        console.log(`   Amount: ${order.totalAmount.toLocaleString()} IQD`);
        console.log(`   Items: ${order.itemCount}`);
        
        const result = await makeAPICall('/api/commissions/calculate', 'POST', {
            orderData: order,
            merchantId: order.merchantId
        });
        
        if (result.success) {
            const commission = result.data.commission;
            console.log(`   ✅ Commission: ${commission.commissionAmount.toLocaleString()} IQD`);
            console.log(`   📊 Rate: ${commission.appliedRate.percentage || 0}% ${commission.appliedRate.flatFee ? `+ ${commission.appliedRate.flatFee} IQD` : ''}`);
            console.log(`   📋 Rule: ${result.data.appliedRule.ruleName}`);
        } else {
            console.log(`   ❌ Failed: ${result.error}`);
        }
    }
}

async function demonstrateDeliveryFeeCalculation() {
    console.log('\n\n🚚 Delivery Fee Calculation Demonstration');
    console.log('═'.repeat(50));
    
    for (const order of demoOrders) {
        console.log(`\n📦 Order: ${order.orderId}`);
        console.log(`   Region: ${order.regionId}`);
        console.log(`   Distance: ${order.deliveryDistance} km`);
        console.log(`   Time: ${new Date(order.orderTime).toLocaleString()}`);
        console.log(`   Weather: ${order.weather}`);
        
        const deliveryData = {
            distanceKm: order.deliveryDistance,
            orderValue: order.totalAmount,
            deliveryTime: order.orderTime,
            weather: order.weather
        };
        
        const result = await makeAPICall('/api/delivery-fees/calculate', 'POST', {
            deliveryData,
            regionId: order.regionId
        });
        
        if (result.success) {
            const fee = result.data.deliveryFee;
            console.log(`   ✅ Delivery Fee: ${fee.deliveryFee.toLocaleString()} IQD`);
            console.log(`   📊 Base Fee: ${fee.baseFee.toLocaleString()} IQD`);
            console.log(`   📋 Rule: ${result.data.appliedRule.ruleName}`);
            if (fee.freeDeliveryApplied) {
                console.log(`   🎁 Free delivery applied!`);
            }
        } else {
            console.log(`   ❌ Failed: ${result.error}`);
        }
    }
}

async function demonstrateRuleManagement() {
    console.log('\n\n⚙️ Rule Management Demonstration');
    console.log('═'.repeat(50));
    
    // Get current commission rules
    const commissionRules = await makeAPICall('/api/commissions');
    if (commissionRules.success) {
        console.log(`\n📋 Commission Rules (${commissionRules.data.total} total, ${commissionRules.data.active} active):`);
        commissionRules.data.rules.forEach(rule => {
            const status = rule.isActive ? '✅ Active' : '❌ Inactive';
            const rate = rule.rates.percentage ? `${rule.rates.percentage}%` : `${rule.rates.flatFee} IQD`;
            console.log(`   ${status} | ${rule.ruleName} | ${rule.ruleType} | ${rate}`);
        });
    }
    
    // Get delivery fee rules
    const deliveryRules = await makeAPICall('/api/delivery-fees');
    if (deliveryRules.success) {
        console.log(`\n📋 Delivery Fee Rules (${deliveryRules.data.total} total, ${deliveryRules.data.active} active):`);
        deliveryRules.data.rules.forEach(rule => {
            const status = rule.isActive ? '✅ Active' : '❌ Inactive';
            const region = rule.conditions.regionId === 'all' ? 'All Regions' : rule.conditions.regionId;
            console.log(`   ${status} | ${rule.ruleName} | ${rule.ruleType} | ${region}`);
        });
    }
}

async function demonstrateFinancialReporting() {
    console.log('\n\n📊 Financial Reporting Demonstration');
    console.log('═'.repeat(50));
    
    const startDate = '2025-09-01';
    const endDate = '2025-09-19';
    
    // Generate summary report
    const summaryReport = await makeAPICall(`/api/financial-reports/summary?startDate=${startDate}&endDate=${endDate}`);
    if (summaryReport.success) {
        console.log(`\n📈 Financial Summary (${startDate} to ${endDate}):`);
        const summary = summaryReport.data.summary;
        console.log(`   💰 Total Revenue: ${summary.totalRevenue.toLocaleString()} IQD`);
        console.log(`   💸 Total Commissions: ${summary.totalCommissions.toLocaleString()} IQD`);
        console.log(`   🚚 Total Delivery Fees: ${summary.totalDeliveryFees.toLocaleString()} IQD`);
        console.log(`   📊 Commission Rate: ${summary.commissionsPercentage}%`);
    }
    
    // Test creating a new rule
    console.log('\n🆕 Creating New Commission Rule:');
    const newRule = await makeAPICall('/api/commissions', 'POST', {
        ruleName: 'Demo High-Volume Merchant',
        ruleType: 'tiered',
        rates: {
            tiers: [
                { minValue: 0, maxValue: 50000000, percentage: 10.0 },
                { minValue: 50000000, maxValue: null, percentage: 7.5 }
            ],
            currency: 'IQD'
        },
        conditions: {
            merchantType: 'high-volume',
            regionId: 'all'
        },
        isActive: true,
        priority: 5
    });
    
    if (newRule.success) {
        console.log(`   ✅ Created: ${newRule.data.ruleName} (ID: ${newRule.data.ruleId})`);
    } else {
        console.log(`   ❌ Failed: ${newRule.error}`);
    }
}

async function demonstrateBestPractices() {
    console.log('\n\n🏆 Best Practices for Commission & Delivery Fee Management');
    console.log('═'.repeat(60));
    
    console.log('\n💸 Commission Best Practices:');
    console.log('   1. Tiered Structure: Lower rates for high-volume merchants');
    console.log('   2. New Merchant Incentives: Reduced rates for first 90 days');
    console.log('   3. Category-Based Rates: Different rates by merchant type');
    console.log('   4. Volume Discounts: Monthly volume-based adjustments');
    console.log('   5. Hybrid Models: Combine percentage + flat fee when appropriate');
    
    console.log('\n🚚 Delivery Fee Best Practices:');
    console.log('   1. Distance-Based Pricing: Fair pricing based on actual distance');
    console.log('   2. Zone-Based Urban Pricing: Efficient pricing for city centers');
    console.log('   3. Peak Hour Multipliers: Higher fees during busy periods');
    console.log('   4. Weather Adjustments: Compensate drivers for difficult conditions');
    console.log('   5. Free Delivery Thresholds: Encourage larger order values');
    console.log('   6. Regional Variations: Adapt to local market conditions');
    
    console.log('\n📊 Financial Reporting Best Practices:');
    console.log('   1. Real-Time Calculations: Immediate commission/fee computation');
    console.log('   2. Historical Analysis: Track trends and performance over time');
    console.log('   3. Merchant Transparency: Clear breakdown of all charges');
    console.log('   4. Automated Reconciliation: Match calculated vs actual charges');
    console.log('   5. Configurable Rules: Easy adjustment without code changes');
    
    console.log('\n🔧 Implementation Benefits:');
    console.log('   ✅ Transparent pricing for all stakeholders');
    console.log('   ✅ Automated financial calculations reduce errors');
    console.log('   ✅ Flexible rules accommodate business growth');
    console.log('   ✅ Real-time reporting for better decision making');
    console.log('   ✅ Scalable architecture for high transaction volumes');
}

async function generateFinancialSummary() {
    console.log('\n\n📋 Financial Management System Summary');
    console.log('═'.repeat(50));
    
    const settings = await makeAPICall('/api/financial-settings');
    if (settings.success) {
        const data = settings.data;
        console.log(`\n📊 System Overview:`);
        console.log(`   Commission Rules: ${data.commissions.totalRules} (${data.commissions.activeRules} active)`);
        console.log(`   Default Commission Rate: ${data.commissions.defaultRate}`);
        console.log(`   Delivery Fee Rules: ${data.deliveryFees.totalRules} (${data.deliveryFees.activeRules} active)`);
        console.log(`   Average Delivery Fee: ${data.deliveryFees.averageFee}`);
        console.log(`   Available Reports: ${data.reports.availableTypes.join(', ')}`);
    }
    
    console.log('\n🌐 Access Points:');
    console.log(`   💻 Web Interface: http://localhost:3000/financial-management.html`);
    console.log(`   🔧 API Endpoints: http://localhost:3000/api/commissions`);
    console.log(`   📊 Reports: http://localhost:3000/api/financial-reports`);
    console.log(`   ⚙️  Settings: http://localhost:3000/api/financial-settings`);
}

async function main() {
    console.log('🏦 WizzCentral Financial Management System Demo');
    console.log('💰 Commission & Delivery Fee Management');
    console.log('═'.repeat(60));
    console.log('');
    
    try {
        await demonstrateCommissionCalculation();
        await demonstrateDeliveryFeeCalculation();
        await demonstrateRuleManagement();
        await demonstrateFinancialReporting();
        await demonstrateBestPractices();
        await generateFinancialSummary();
        
        console.log('\n🎉 Demo completed successfully!');
        console.log('💡 The financial management system is now fully operational.');
        
    } catch (error) {
        console.error('❌ Demo failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { main };
