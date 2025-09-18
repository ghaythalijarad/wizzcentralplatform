# WizzCentral Campaign Architecture Explained

## Overview

The WizzCentral platform has a sophisticated multi-layered campaign system that supports different types of promotions, discounts, and targeting mechanisms. Here's a comprehensive breakdown of the architecture:

## 🗃️ Database Tables Structure

### 1. Core Campaign Tables

#### **`WizzCentral_Platform_Discounts`** 
- **Purpose**: Platform-wide discounts managed by WizzCentral
- **Used for**: Global promotions, platform-sponsored offers
- **Key Fields**:
  - `discountId` (Primary Key)
  - `title`, `code`, `discountType`, `discountValue`
  - `discountSource: "platform"`
  - `enhancedTargeting` (Enhanced targeting criteria)
  - `isActive`, `startDate`, `endDate`

#### **`WizzCentral_Campaigns`**
- **Purpose**: Special campaign types (first order, new customer, etc.)
- **Used for**: Sophisticated campaign logic with conditions
- **Key Fields**:
  - `campaignId` (Primary Key)
  - `title`, `code`, `type`, `description`
  - `targetRestaurants`, `targetSegments`, `occasions`
  - `conditions` (Array of condition objects)
  - `conditionLogic` (AND/OR)
  - `usesAdvancedConditions` (Boolean)

#### **`WizzCentral_Campaign_Conditions`** 
- **Purpose**: Detailed condition definitions for campaigns
- **Used for**: Condition engine integration
- **Key Fields**:
  - `conditionId` (Primary Key)
  - `campaignId` (Foreign Key)
  - `conditionType`, `parameters`
  - `operator`, `conditionOrder`

#### **`WizzCentral_Campaign_Usage`**
- **Purpose**: Track campaign usage and analytics
- **Used for**: Usage limits, redemption tracking
- **Key Fields**:
  - `usageId` (Primary Key)
  - `campaignId`, `customerId`
  - `usageDate`, `orderValue`
  - `discountApplied`

#### **`WhizzMerchants_Discounts`**
- **Purpose**: Merchant-specific discounts
- **Used for**: Restaurant/merchant-created promotions
- **Key Fields**:
  - `discountId` (Primary Key)
  - `merchantId` (Foreign Key)
  - `discountSource: "merchant"`
  - Similar discount fields as platform discounts

## 🏗️ Architecture Layers

### Layer 1: Data Access Layer
```
📁 frontend/data-service.js
├── Basic CRUD operations
├── Table mappings
├── Error handling with fallbacks
└── Client caching

📁 frontend/enhanced-campaign-data-service.js
├── Advanced campaign operations
├── Condition engine integration
├── Multi-table joins
└── Campaign analytics
```

### Layer 2: Business Logic Layer
```
📁 frontend/condition-engine.js
├── Campaign condition definitions
├── Customer profile evaluation
├── Order history analysis
└── Location/time-based conditions

📁 frontend/enhanced-targeting-validation.js
├── Targeting criteria validation
├── Customer eligibility evaluation
├── Runtime condition checking
└── Error handling
```

### Layer 3: User Interface Layer
```
📁 frontend/campaign-manager.js
├── Campaign CRUD operations
├── UI rendering logic
├── Form validation
└── State management

📁 frontend/enhanced-targeting-system.js
├── Advanced targeting UI
├── Dynamic form generation
├── Real-time validation
└── Preview functionality
```

### Layer 4: Integration Layer
```
📁 frontend/customer-app-integration-example.js
├── Customer eligibility evaluation
├── Real-time campaign filtering
├── Mobile/web app integration
└── Performance optimization
```

## 🎯 Campaign Types & Features

### 1. Platform Discounts
- **Scope**: Platform-wide
- **Management**: WizzCentral admin
- **Features**: 
  - Basic targeting
  - Enhanced targeting (new)
  - Global availability

### 2. Merchant Discounts  
- **Scope**: Merchant-specific
- **Management**: Individual merchants
- **Features**:
  - Restaurant-specific offers
  - Merchant branding
  - Local targeting

### 3. Special Campaigns
- **Scope**: Conditional/targeted
- **Management**: WizzCentral with advanced logic
- **Features**:
  - Condition engine integration
  - Customer behavior targeting
  - Complex eligibility rules

## 🔧 Condition Engine System

### Condition Categories

#### **Customer Conditions**
```javascript
// Examples from condition-engine.js
- new_customer: Zero completed orders
- recently_registered: Registered within X days  
- loyal_customer: High order frequency
- high_value_customer: Above average spending
- dormant_customer: No recent orders
```

#### **Order Conditions**
```javascript
- first_order: Customer's first order
- minimum_order_value: Order above threshold
- specific_items: Contains certain products
- order_frequency: Based on ordering patterns
```

#### **Location Conditions**
```javascript
- specific_restaurants: Target specific venues
- restaurant_category: By cuisine type
- delivery_zone: Geographic targeting
- new_restaurant: Recently added venues
```

#### **Time Conditions**
```javascript
- time_of_day: Hour-based targeting
- day_of_week: Weekday/weekend targeting
- special_occasions: Holiday/event based
- seasonal: Date range based
```

### Enhanced Targeting Structure
```javascript
{
  "enhancedTargeting": {
    "customerSegments": {
      "enabled": true,
      "predefinedSegments": ["new", "vip"],
      "customCriteria": [
        {
          "field": "orderCount",
          "operator": "greater_than", 
          "value": 5
        }
      ],
      "logic": "AND"
    },
    "restaurantTargeting": {
      "enabled": true,
      "mode": "specific", // specific|category|location|rating
      "specificRestaurants": ["rest_123"],
      "categories": ["fast_food"],
      "locations": [{"city": "Baghdad"}],
      "ratingOperator": "greater_equal",
      "ratingValue": 4.0
    },
    "occasions": {
      "enabled": true,
      "specialEvents": [{
        "name": "Ramadan Special",
        "startDate": "2025-02-28",
        "endDate": "2025-03-30"
      }],
      "recurringSchedules": [{
        "name": "Weekend Deal",
        "daysOfWeek": [5, 6],
        "timeRange": {"start": "18:00", "end": "22:00"}
      }]
    }
  }
}
```

## 🔄 Data Flow Architecture

### Campaign Creation Flow
```
1. User Input (UI) 
   ↓
2. Campaign Manager (Validation)
   ↓  
3. Enhanced Data Service (Business Logic)
   ↓
4. Condition Engine (Rule Processing)
   ↓
5. DynamoDB Tables (Data Persistence)
   ├── WizzCentral_Campaigns
   ├── WizzCentral_Campaign_Conditions  
   └── WizzCentral_Campaign_Usage
```

### Customer Eligibility Flow
```
1. Customer Action (Order/Browse)
   ↓
2. Campaign Evaluator (Real-time)
   ↓
3. Condition Engine (Rule Evaluation)
   ↓
4. Database Queries (Customer/Order Data)
   ↓
5. Eligibility Result (Show/Hide Campaigns)
```

## 📊 Campaign Display & Management

### Unified Promotions Interface
The promotions page (`/pages/promotions.html`) displays all campaign types:

- **Platform Discounts**: Green "PLATFORM" badge
- **Merchant Discounts**: Gray "MERCHANT" badge  
- **Special Campaigns**: Condition count display

### Campaign Targeting Display
```javascript
// From campaign-manager.js formatCampaignTargetEnhanced()
function formatCampaignTargetEnhanced(campaign) {
  if (campaign.enhancedTargeting) {
    // Show enhanced targeting summary
    return "2 segments, 3 restaurants, 1 occasion";
  }
  // Fallback to legacy formatting
  return formatCampaignTarget(campaign);
}
```

## 🚀 Performance Optimizations

### Caching Strategy
```javascript
// Client-side caching (5 minute TTL)
const campaignCache = {
  byType: new Map(),
  byRestaurant: new Map(), 
  byTimeRange: new Map()
};
```

### Database Indexing
```javascript
// Recommended GSIs for campaign tables
- campaignType-status-index: Filter active campaigns
- targetRestaurants-index: Restaurant-specific lookup
- occasions-dateRange-index: Time-based queries
```

## 🔗 Integration Points

### Mobile/Web App Integration
```javascript
// Customer-facing evaluation
const evaluator = new CustomerCampaignEvaluator({
  baseUrl: 'https://api.wizzcentral.com',
  apiKey: 'your-api-key'
});

const eligibleCampaigns = await evaluator.getEligibleCampaigns(
  customerData, 
  contextData
);
```

### Backend API Integration
```javascript
// Order validation endpoint
POST /api/orders/validate-campaign
{
  "customerId": "cust_123",
  "restaurantId": "rest_456", 
  "campaignCode": "LOYAL25",
  "orderDetails": {...}
}
```

## 🧪 Testing Infrastructure

### Test Coverage
- **Unit Tests**: `enhanced-targeting-tests.js`
- **Integration Tests**: `condition-engine-integration-tests.js`
- **E2E Tests**: `campaign-condition-engine-test-suite.js`
- **Performance Tests**: Built-in performance suite

### Debug Tools
- **Debug Creator**: `/debug-platform-creator.html`
- **Debug Viewer**: `/debug-promotions.html`
- **E2E Tester**: `/e2e-test.html`

## 📈 Analytics & Monitoring

### Usage Tracking
```javascript
// Campaign usage analytics
- Redemption rates
- Customer segment performance
- Restaurant-specific metrics
- Time-based analysis
```

### Performance Metrics
```javascript
// System performance monitoring
- Condition evaluation speed
- Database query performance  
- Cache hit rates
- Error rates
```

## 🔮 Future Enhancements

### Planned Features
1. **ML-Based Targeting**: Predictive customer segmentation
2. **Real-time Analytics**: Live campaign performance dashboards
3. **A/B Testing**: Built-in campaign testing framework
4. **Advanced Geofencing**: GPS-based location targeting
5. **Behavioral Triggers**: Event-driven campaign activation

### Scalability Considerations
1. **Microservices**: Split campaign engine into separate services
2. **Event Streaming**: Real-time campaign updates via Kinesis
3. **CDN Integration**: Cache campaigns closer to customers
4. **API Gateway**: Rate limiting and authentication
5. **Auto-scaling**: Dynamic capacity based on load

## 📋 Summary

The WizzCentral campaign architecture is a sophisticated system that supports:

✅ **Multiple Campaign Types**: Platform, merchant, and special campaigns  
✅ **Advanced Targeting**: Customer, restaurant, and occasion-based  
✅ **Condition Engine**: Flexible rule evaluation system  
✅ **Real-time Evaluation**: Fast customer eligibility checking  
✅ **Unified Management**: Single interface for all campaign types  
✅ **Performance Optimized**: Caching and indexing strategies  
✅ **Mobile Integration**: Customer app consumption patterns  
✅ **Analytics Ready**: Usage tracking and performance monitoring  

This architecture provides a solid foundation for sophisticated marketing campaigns while maintaining performance and scalability for the WizzCentral platform.

---
*Last updated: September 18, 2025*
*Status: PRODUCTION READY* 🎯
