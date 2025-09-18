# Enhanced Targeting System Documentation

## Overview

The Enhanced Targeting System for WizzCentral provides sophisticated campaign targeting capabilities that go beyond basic demographic targeting. This system allows marketers to create highly targeted campaigns based on customer behavior, restaurant characteristics, and occasion-based triggers.

## Architecture

### Core Components

1. **Enhanced Targeting Manager** (`enhanced-targeting-system.js`)
   - Frontend UI management for targeting configuration
   - Dynamic form generation and validation
   - Real-time targeting preview

2. **Targeting Validation System** (`enhanced-targeting-validation.js`)
   - Server-side validation of targeting criteria
   - Runtime eligibility evaluation
   - Type-safe validation rules

3. **Campaign Manager Integration** (`campaign-manager.js`)
   - Enhanced campaign data collection
   - Backward compatibility with existing campaigns
   - Improved campaign display formatting

4. **Customer App Integration** (`customer-app-integration-example.js`)
   - Reference implementation for mobile/web apps
   - Real-time campaign eligibility evaluation
   - Caching and performance optimization

### Data Structure

Enhanced targeting data is stored in the existing `WizzCentral_Platform_Discounts` DynamoDB table under the `enhancedTargeting` field:

```json
{
  "enhancedTargeting": {
    "customerSegments": {
      "enabled": true,
      "predefinedSegments": ["new", "vip", "returning"],
      "customCriteria": [
        {
          "field": "orderCount",
          "operator": "greater_than",
          "value": 5,
          "dataType": "number"
        }
      ],
      "logic": "AND"
    },
    "restaurantTargeting": {
      "enabled": true,
      "mode": "specific",
      "specificRestaurants": ["rest_123", "rest_456"],
      "categories": [],
      "locations": [],
      "ratingOperator": "",
      "ratingValue": 0
    },
    "occasions": {
      "enabled": true,
      "specialEvents": [
        {
          "name": "New Year Sale",
          "startDate": "2024-01-01T00:00:00Z",
          "endDate": "2024-01-02T23:59:59Z"
        }
      ],
      "recurringSchedules": [
        {
          "name": "Weekend Special",
          "daysOfWeek": [0, 6],
          "timeRange": {
            "start": "18:00",
            "end": "22:00"
          }
        }
      ],
      "religiousOccasions": []
    }
  }
}
```

## Features

### 1. Customer Segment Targeting

#### Predefined Segments
- **New Customers**: Users who joined recently or have made few orders
- **VIP Customers**: High-value customers based on spending or loyalty
- **Returning Customers**: Users with established order history
- **Inactive Customers**: Users who haven't ordered recently

#### Custom Criteria
Advanced behavioral targeting based on:

- **Order Count**: Number of orders placed (`orderCount`)
- **Total Spent**: Lifetime spending amount (`totalSpent`)
- **Loyalty Level**: Customer tier (bronze, silver, gold, platinum)
- **Join Date**: Account creation date
- **Last Order Date**: Most recent order timestamp
- **Average Order Value**: Mean order amount

#### Operators
- **Numeric**: `equals`, `greater_than`, `less_than`, `greater_equal`, `less_equal`
- **String**: `equals`, `contains`, `starts_with`, `ends_with`
- **Date**: `equals`, `after`, `before`, `on_or_after`, `on_or_before`

#### Logic Combinations
- **AND**: All criteria must be met
- **OR**: Any criteria can be met

### 2. Restaurant Targeting

#### Targeting Modes

##### Specific Restaurants
Target individual restaurants by ID:
```json
{
  "mode": "specific",
  "specificRestaurants": ["rest_123", "rest_456", "rest_789"]
}
```

##### Category-Based
Target restaurants by cuisine or category:
```json
{
  "mode": "category",
  "categories": ["fast_food", "casual_dining", "fine_dining"]
}
```

##### Location-Based
Target restaurants in specific geographic areas:
```json
{
  "mode": "location",
  "locations": [
    {
      "type": "radius",
      "center": {
        "latitude": 40.7128,
        "longitude": -74.0060
      },
      "radius": 5,
      "unit": "km"
    }
  ]
}
```

##### Rating-Based
Target restaurants based on customer ratings:
```json
{
  "mode": "rating",
  "ratingOperator": "greater_equal",
  "ratingValue": 4.5
}
```

### 3. Occasion-Based Targeting

#### Special Events
One-time events with specific date ranges:
```json
{
  "specialEvents": [
    {
      "name": "Black Friday Sale",
      "startDate": "2024-11-29T00:00:00Z",
      "endDate": "2024-11-30T23:59:59Z"
    }
  ]
}
```

#### Recurring Schedules
Repeated targeting based on time patterns:
```json
{
  "recurringSchedules": [
    {
      "name": "Happy Hour",
      "daysOfWeek": [1, 2, 3, 4, 5],
      "timeRange": {
        "start": "15:00",
        "end": "18:00"
      }
    }
  ]
}
```

#### Religious Occasions
Cultural and religious event targeting:
```json
{
  "religiousOccasions": [
    {
      "name": "Ramadan",
      "dates": ["2024-03-10", "2024-04-09"],
      "timeConstraints": {
        "start": "18:00",
        "end": "06:00"
      }
    }
  ]
}
```

## Implementation Guide

### 1. Backend Integration

#### Campaign Creation
```javascript
// In your campaign creation function
async function createCampaign(campaignData) {
    // Validate enhanced targeting if present
    if (campaignData.enhancedTargeting) {
        const validator = new CampaignTargetingValidator();
        const validation = validator.validateTargeting(campaignData.enhancedTargeting);
        
        if (!validation.isValid) {
            throw new Error(`Invalid targeting: ${validation.errors.join(', ')}`);
        }
    }
    
    // Save to DynamoDB
    const params = {
        TableName: 'WizzCentral_Platform_Discounts',
        Item: {
            id: campaignData.id,
            // ... other campaign fields
            enhancedTargeting: campaignData.enhancedTargeting
        }
    };
    
    await dynamodb.put(params).promise();
}
```

#### Real-time Eligibility Checking
```javascript
// In your order processing or campaign display logic
async function getEligibleCampaigns(customerId, restaurantId) {
    // Get customer data
    const customer = await getCustomerData(customerId);
    
    // Get active campaigns
    const campaigns = await getActiveCampaigns();
    
    // Evaluate eligibility
    const evaluator = new CampaignEligibilityEvaluator();
    const eligibleCampaigns = [];
    
    for (const campaign of campaigns) {
        const context = {
            restaurantId: restaurantId,
            orderTime: new Date().toISOString()
        };
        
        const result = evaluator.evaluateCustomerEligibility(
            campaign.enhancedTargeting || {}, 
            customer, 
            context
        );
        
        if (result.eligible) {
            eligibleCampaigns.push(campaign);
        }
    }
    
    return eligibleCampaigns;
}
```

### 2. Frontend Integration

#### HTML Setup
```html
<!-- Include the enhanced targeting scripts -->
<script src="../enhanced-targeting-validation.js"></script>
<script src="../enhanced-targeting-system.js"></script>
<script src="../campaign-manager.js"></script>

<!-- Add targeting container to your campaign form -->
<div id="enhancedTargetingContainer">
    <label>
        <input type="checkbox" id="enableEnhancedTargeting">
        Enable Enhanced Targeting
    </label>
    <div id="enhancedTargetingUI" style="display: none;"></div>
</div>
```

#### JavaScript Initialization
```javascript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize enhanced targeting manager
    const enhancedTargetingManager = new EnhancedTargetingManager('enhancedTargetingUI');
    
    // Handle toggle
    document.getElementById('enableEnhancedTargeting').addEventListener('change', function() {
        if (this.checked) {
            document.getElementById('enhancedTargetingUI').style.display = 'block';
            enhancedTargetingManager.render();
        } else {
            document.getElementById('enhancedTargetingUI').style.display = 'none';
        }
    });
    
    // Store reference for form submission
    window.enhancedTargetingManager = enhancedTargetingManager;
});
```

#### Form Submission
```javascript
function handleCampaignSubmit(event) {
    event.preventDefault();
    
    // Collect enhanced targeting data
    const enhancedTargeting = window.enhancedTargetingManager ? 
        window.enhancedTargetingManager.getTargetingData() : null;
    
    const campaignData = {
        // ... other form fields
        enhancedTargeting: enhancedTargeting
    };
    
    // Submit campaign
    createCampaign(campaignData);
}
```

### 3. Customer App Integration

#### Mobile App (React Native)
```javascript
import { CustomerCampaignEvaluator } from './customer-app-integration-example.js';

class CampaignService {
    constructor() {
        this.evaluator = new CustomerCampaignEvaluator({
            baseUrl: 'https://your-api.com',
            apiKey: 'your-api-key'
        });
    }
    
    async loadCampaignsForUser(userId, restaurantId) {
        const customerData = await this.getCustomerProfile(userId);
        const context = { restaurantId };
        
        return await this.evaluator.getEligibleCampaigns(customerData, context);
    }
}
```

#### Web App (React)
```jsx
import React, { useState, useEffect } from 'react';
import { CustomerCampaignEvaluator } from './customer-app-integration-example.js';

function CampaignList({ userId, restaurantId }) {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const evaluator = new CustomerCampaignEvaluator({
            baseUrl: process.env.REACT_APP_API_URL,
            apiKey: process.env.REACT_APP_API_KEY
        });
        
        evaluator.getEligibleCampaigns(
            { customerId: userId },
            { restaurantId }
        ).then(setCampaigns)
          .finally(() => setLoading(false));
    }, [userId, restaurantId]);
    
    if (loading) return <div>Loading campaigns...</div>;
    
    return (
        <div>
            {campaigns.map(campaign => (
                <CampaignCard key={campaign.id} campaign={campaign} />
            ))}
        </div>
    );
}
```

## Performance Considerations

### 1. Caching Strategy

#### Client-Side Caching
- Cache customer segments for 5 minutes
- Cache restaurant data for 30 minutes
- Cache active campaigns for 2 minutes

#### Server-Side Caching
- Use Redis for frequently accessed customer data
- Cache targeting evaluation results
- Implement cache invalidation on data updates

### 2. Database Optimization

#### DynamoDB Indexing
```javascript
// Create GSI for efficient campaign queries
const campaignsByStatusIndex = {
    IndexName: 'status-startDate-index',
    KeySchema: [
        { AttributeName: 'status', KeyType: 'HASH' },
        { AttributeName: 'startDate', KeyType: 'RANGE' }
    ],
    Projection: { ProjectionType: 'ALL' }
};
```

#### Query Optimization
```javascript
// Efficient active campaign retrieval
const params = {
    TableName: 'WizzCentral_Platform_Discounts',
    IndexName: 'status-startDate-index',
    KeyConditionExpression: '#status = :status AND #startDate <= :now',
    FilterExpression: '#endDate >= :now',
    ExpressionAttributeNames: {
        '#status': 'status',
        '#startDate': 'startDate',
        '#endDate': 'endDate'
    },
    ExpressionAttributeValues: {
        ':status': 'active',
        ':now': new Date().toISOString()
    }
};
```

### 3. Scalability

#### Batch Processing
- Process campaign eligibility in batches
- Use parallel evaluation for multiple campaigns
- Implement circuit breakers for external API calls

#### Monitoring
- Track evaluation performance metrics
- Monitor cache hit rates
- Alert on high error rates

## Testing

### 1. Unit Tests
The system includes comprehensive tests in `enhanced-targeting-tests.js`:

```javascript
// Run all tests
const testSuite = new EnhancedTargetingTestSuite();
await testSuite.runAllTests();

// Run performance tests
const performanceTests = new PerformanceTestSuite();
await performanceTests.runPerformanceTests();
```

### 2. Integration Tests
- Test campaign creation with enhanced targeting
- Verify eligibility evaluation accuracy
- Test customer app integration

### 3. Load Tests
- Evaluate system performance under load
- Test concurrent campaign evaluations
- Verify caching effectiveness

## Migration Guide

### From Basic to Enhanced Targeting

1. **Backward Compatibility**: Existing campaigns continue to work unchanged
2. **Gradual Migration**: Enable enhanced targeting on new campaigns first
3. **Data Migration**: Convert existing targeting to enhanced format:

```javascript
function migrateBasicToEnhanced(basicCampaign) {
    const enhanced = {};
    
    // Migrate restaurant targeting
    if (basicCampaign.targetRestaurants) {
        enhanced.restaurantTargeting = {
            enabled: true,
            mode: 'specific',
            specificRestaurants: basicCampaign.targetRestaurants
        };
    }
    
    // Migrate customer segments
    if (basicCampaign.targetSegments) {
        enhanced.customerSegments = {
            enabled: true,
            predefinedSegments: basicCampaign.targetSegments,
            logic: 'OR'
        };
    }
    
    return enhanced;
}
```

## API Reference

### CampaignTargetingValidator

#### Methods
- `validateTargeting(targeting)`: Validate complete targeting configuration
- `validateCustomerSegments(segments)`: Validate customer segment targeting
- `validateRestaurantTargeting(restaurants)`: Validate restaurant targeting
- `validateOccasions(occasions)`: Validate occasion-based targeting

### CampaignEligibilityEvaluator

#### Methods
- `evaluateCustomerEligibility(targeting, customer, context)`: Check customer eligibility
- `evaluateCustomerSegments(segments, customer)`: Evaluate segment criteria
- `evaluateRestaurantTargeting(restaurants, context)`: Check restaurant targeting
- `evaluateOccasions(occasions, context)`: Evaluate occasion targeting

### EnhancedTargetingManager

#### Methods
- `render()`: Render the targeting UI
- `getTargetingData()`: Get current targeting configuration
- `setTargetingData(data)`: Set targeting configuration
- `validate()`: Validate current configuration

## Troubleshooting

### Common Issues

1. **Targeting Not Working**
   - Check that `enhancedTargeting` is enabled in campaign data
   - Verify targeting criteria are properly formatted
   - Ensure customer data includes required fields

2. **Performance Issues**
   - Enable caching for frequently accessed data
   - Optimize database queries with proper indexing
   - Consider async evaluation for non-critical paths

3. **Validation Errors**
   - Check field types match expected data types
   - Verify operator compatibility with field types
   - Ensure required fields are present

### Debug Mode

Enable debug logging:
```javascript
// Set debug mode for detailed logging
window.ENHANCED_TARGETING_DEBUG = true;
```

### Error Handling

Implement proper error handling:
```javascript
try {
    const result = evaluator.evaluateCustomerEligibility(targeting, customer, context);
    // Handle result
} catch (error) {
    console.error('Targeting evaluation failed:', error);
    // Fallback to basic targeting or default behavior
}
```

## Security Considerations

1. **Data Privacy**: Customer data used for targeting should be handled according to privacy policies
2. **Access Control**: Ensure only authorized users can modify targeting criteria
3. **Input Validation**: All targeting inputs should be validated server-side
4. **Audit Logging**: Log targeting configuration changes for compliance

## Future Enhancements

1. **ML-Based Targeting**: Use machine learning for predictive customer segmentation
2. **Real-time Analytics**: Show targeting effectiveness metrics
3. **A/B Testing**: Built-in A/B testing for targeting strategies
4. **Advanced Geofencing**: More sophisticated location-based targeting
5. **Behavioral Triggers**: Event-based targeting (cart abandonment, etc.)

## Support

For technical support or questions about the enhanced targeting system:
- Review this documentation
- Check the test suite for examples
- Examine the integration examples
- Contact the development team

---

*Last updated: January 2024*
