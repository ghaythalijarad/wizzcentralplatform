# Advanced Targeting Criteria Specification for WizzCentral Platform

## Overview

This document defines the logical structure and consumption patterns for advanced targeting criteria (`targetSegments`, `targetRestaurants`, `occasions`) in the WizzCentral platform's enhanced campaign creation system. These criteria are stored in DynamoDB and consumed by customer-facing applications for precise campaign targeting.

## DynamoDB Storage Structure

### Primary Campaign Object

Campaigns are stored in the `WizzCentral_Platform_Discounts` table with the following targeting structure:

```javascript
{
  // Core Campaign Fields
  discountId: "campaign_1703875123456_abc123",
  campaignId: "campaign_1703875123456_abc123",
  campaignType: "loyalty", // Enhanced campaign type classification
  title: "Loyalty Rewards 2025",
  code: "LOYAL25",
  
  // Enhanced Targeting Criteria
  targetSegments: [
    {
      segmentId: "premium_customers",
      segmentName: "Premium Customers",
      criteria: {
        minOrderCount: 10,
        minSpentAmount: 500,
        joinDateBefore: "2024-01-01",
        loyaltyLevel: "gold"
      },
      weight: 1.0
    },
    {
      segmentId: "new_customers", 
      segmentName: "New Customers",
      criteria: {
        joinDateAfter: "2024-11-01",
        orderCount: { min: 0, max: 3 }
      },
      weight: 0.8
    }
  ],
  
  targetRestaurants: [
    {
      restaurantId: "rest_123",
      restaurantName: "Al-Baghdadia Restaurant",
      location: {
        city: "Baghdad",
        district: "Karrada",
        coordinates: { lat: 33.3085, lng: 44.3937 }
      },
      categories: ["iraqi", "traditional"],
      ratingMin: 4.0,
      isActive: true
    },
    {
      restaurantId: "rest_456", 
      restaurantName: "Fast Food Palace",
      location: {
        city: "Baghdad",
        district: "Mansour",
        coordinates: { lat: 33.3354, lng: 44.3412 }
      },
      categories: ["fast_food", "burgers"],
      deliveryZones: ["zone_1", "zone_3"],
      isActive: true
    }
  ],
  
  occasions: [
    {
      occasionId: "ramadan_2025",
      occasionName: "Ramadan Special",
      type: "religious",
      dateRange: {
        start: "2025-02-28",
        end: "2025-03-30"
      },
      timeConstraints: {
        iftar: { start: "18:00", end: "21:00" },
        suhoor: { start: "02:00", end: "05:00" }
      },
      regions: ["baghdad", "basra", "erbil"]
    },
    {
      occasionId: "weekend_deals",
      occasionName: "Weekend Family Deals", 
      type: "recurring",
      schedule: {
        dayOfWeek: [5, 6], // Friday, Saturday
        timeOfDay: { start: "12:00", end: "22:00" }
      },
      minPartySize: 3
    }
  ],
  
  // Additional Targeting Metadata
  targetingRules: {
    logic: "AND", // AND/OR logic between different targeting criteria
    inclusivity: "inclusive", // inclusive/exclusive targeting
    priority: 1, // Campaign priority for overlapping criteria
    fallbackBehavior: "extend_to_all" // What to do if no matches found
  }
}
```

## Customer Application Consumption Patterns

### 1. Customer Segment Targeting

Customer applications should evaluate `targetSegments` by checking user profiles against defined criteria:

#### Implementation Logic:
```javascript
function evaluateCustomerSegment(customer, targetSegments) {
  for (const segment of targetSegments) {
    let matches = true;
    const criteria = segment.criteria;
    
    // Check order count criteria
    if (criteria.minOrderCount && customer.orderCount < criteria.minOrderCount) {
      matches = false;
    }
    
    // Check spending criteria  
    if (criteria.minSpentAmount && customer.totalSpent < criteria.minSpentAmount) {
      matches = false;
    }
    
    // Check join date criteria
    if (criteria.joinDateBefore && new Date(customer.joinDate) > new Date(criteria.joinDateBefore)) {
      matches = false;
    }
    
    if (criteria.joinDateAfter && new Date(customer.joinDate) < new Date(criteria.joinDateAfter)) {
      matches = false;
    }
    
    // Check loyalty level
    if (criteria.loyaltyLevel && customer.loyaltyLevel !== criteria.loyaltyLevel) {
      matches = false;
    }
    
    // Check order count range
    if (criteria.orderCount) {
      if (criteria.orderCount.min && customer.orderCount < criteria.orderCount.min) matches = false;
      if (criteria.orderCount.max && customer.orderCount > criteria.orderCount.max) matches = false;
    }
    
    if (matches) {
      return { eligible: true, segment: segment.segmentName, weight: segment.weight };
    }
  }
  
  return { eligible: false };
}
```

#### Customer Profile Requirements:
- `orderCount`: Total number of completed orders
- `totalSpent`: Lifetime spending amount
- `joinDate`: Account creation date
- `loyaltyLevel`: Current loyalty tier
- `lastOrderDate`: Most recent order date

### 2. Restaurant Targeting

Restaurant-based targeting filters campaigns based on merchant and location criteria:

#### Implementation Logic:
```javascript
function evaluateRestaurantTargeting(restaurantId, targetRestaurants, userLocation) {
  // If no restaurant targeting specified, campaign applies to all restaurants
  if (!targetRestaurants || targetRestaurants.length === 0) {
    return { eligible: true, reason: "universal" };
  }
  
  for (const targetRestaurant of targetRestaurants) {
    // Direct restaurant match
    if (targetRestaurant.restaurantId === restaurantId) {
      return { eligible: true, restaurant: targetRestaurant.restaurantName };
    }
    
    // Category-based matching (for chain restaurants)
    if (targetRestaurant.categories && restaurant.categories) {
      const hasMatchingCategory = targetRestaurant.categories.some(cat => 
        restaurant.categories.includes(cat)
      );
      if (hasMatchingCategory) {
        return { eligible: true, reason: "category_match", categories: targetRestaurant.categories };
      }
    }
    
    // Location-based matching (delivery zones)
    if (targetRestaurant.deliveryZones && userLocation.zone) {
      if (targetRestaurant.deliveryZones.includes(userLocation.zone)) {
        return { eligible: true, reason: "delivery_zone", zone: userLocation.zone };
      }
    }
    
    // Rating criteria
    if (targetRestaurant.ratingMin && restaurant.rating < targetRestaurant.ratingMin) {
      continue; // Skip this restaurant target
    }
  }
  
  return { eligible: false };
}
```

#### Restaurant Data Requirements:
- `restaurantId`: Unique restaurant identifier
- `categories`: Array of restaurant category tags
- `rating`: Current average rating
- `location.zone`: Delivery zone identifier
- `isActive`: Restaurant operational status

### 3. Occasion-Based Targeting

Occasion targeting applies time-sensitive and event-based campaign restrictions:

#### Implementation Logic:
```javascript
function evaluateOccasionTargeting(occasions, currentDateTime, userContext) {
  // If no occasion targeting, campaign is always available
  if (!occasions || occasions.length === 0) {
    return { eligible: true, reason: "no_occasion_restrictions" };
  }
  
  const now = new Date(currentDateTime);
  const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
  const currentTime = now.toTimeString().substr(0, 5); // HH:MM format
  
  for (const occasion of occasions) {
    let occasionMatches = true;
    
    // Check date range for special occasions
    if (occasion.dateRange) {
      const startDate = new Date(occasion.dateRange.start);
      const endDate = new Date(occasion.dateRange.end);
      
      if (now < startDate || now > endDate) {
        occasionMatches = false;
      }
    }
    
    // Check recurring schedule (e.g., weekends)
    if (occasion.schedule) {
      if (occasion.schedule.dayOfWeek && !occasion.schedule.dayOfWeek.includes(currentDay)) {
        occasionMatches = false;
      }
      
      if (occasion.schedule.timeOfDay) {
        if (currentTime < occasion.schedule.timeOfDay.start || 
            currentTime > occasion.schedule.timeOfDay.end) {
          occasionMatches = false;
        }
      }
    }
    
    // Check specific time constraints (e.g., Iftar times)
    if (occasion.timeConstraints && userContext.mealType) {
      const constraint = occasion.timeConstraints[userContext.mealType];
      if (constraint && (currentTime < constraint.start || currentTime > constraint.end)) {
        occasionMatches = false;
      }
    }
    
    // Check regional restrictions
    if (occasion.regions && userContext.region) {
      if (!occasion.regions.includes(userContext.region)) {
        occasionMatches = false;
      }
    }
    
    // Check party size requirements
    if (occasion.minPartySize && userContext.partySize < occasion.minPartySize) {
      occasionMatches = false;
    }
    
    if (occasionMatches) {
      return { 
        eligible: true, 
        occasion: occasion.occasionName, 
        type: occasion.type 
      };
    }
  }
  
  return { eligible: false };
}
```

#### User Context Requirements:
- `currentDateTime`: Current timestamp
- `region`: User's geographic region
- `mealType`: Current meal context (iftar, suhoor, lunch, dinner)
- `partySize`: Number of people in the order

## Complete Campaign Eligibility Evaluation

### Master Evaluation Function:
```javascript
function evaluateCampaignEligibility(campaign, customer, restaurant, userContext) {
  const results = {
    eligible: false,
    reasons: [],
    weights: [],
    restrictions: []
  };
  
  // 1. Evaluate customer segment targeting
  const segmentResult = evaluateCustomerSegment(customer, campaign.targetSegments);
  if (campaign.targetSegments?.length > 0 && !segmentResult.eligible) {
    results.restrictions.push('customer_segment_mismatch');
    if (campaign.targetingRules?.logic === 'AND') {
      return results; // Early exit if AND logic and segment fails
    }
  } else if (segmentResult.eligible) {
    results.reasons.push(`segment: ${segmentResult.segment}`);
    results.weights.push(segmentResult.weight);
  }
  
  // 2. Evaluate restaurant targeting
  const restaurantResult = evaluateRestaurantTargeting(
    restaurant.id, campaign.targetRestaurants, userContext.location
  );
  if (campaign.targetRestaurants?.length > 0 && !restaurantResult.eligible) {
    results.restrictions.push('restaurant_mismatch');
    if (campaign.targetingRules?.logic === 'AND') {
      return results;
    }
  } else if (restaurantResult.eligible) {
    results.reasons.push(`restaurant: ${restaurantResult.reason}`);
  }
  
  // 3. Evaluate occasion targeting
  const occasionResult = evaluateOccasionTargeting(
    campaign.occasions, userContext.currentDateTime, userContext
  );
  if (campaign.occasions?.length > 0 && !occasionResult.eligible) {
    results.restrictions.push('occasion_mismatch');
    if (campaign.targetingRules?.logic === 'AND') {
      return results;
    }
  } else if (occasionResult.eligible) {
    results.reasons.push(`occasion: ${occasionResult.occasion}`);
  }
  
  // 4. Apply targeting logic
  const hasTargeting = (campaign.targetSegments?.length > 0) || 
                       (campaign.targetRestaurants?.length > 0) || 
                       (campaign.occasions?.length > 0);
  
  if (!hasTargeting) {
    // Universal campaign
    results.eligible = true;
    results.reasons.push('universal_campaign');
  } else if (campaign.targetingRules?.logic === 'OR') {
    // OR logic: eligible if ANY criteria matches
    results.eligible = results.reasons.length > 0;
  } else {
    // AND logic (default): eligible if ALL specified criteria match
    const requiredMatches = [
      campaign.targetSegments?.length > 0 ? 'segment' : null,
      campaign.targetRestaurants?.length > 0 ? 'restaurant' : null, 
      campaign.occasions?.length > 0 ? 'occasion' : null
    ].filter(Boolean);
    
    const actualMatches = results.reasons.map(r => r.split(':')[0]);
    results.eligible = requiredMatches.every(req => 
      actualMatches.includes(req)
    );
  }
  
  // 5. Apply fallback behavior
  if (!results.eligible && campaign.targetingRules?.fallbackBehavior === 'extend_to_all') {
    results.eligible = true;
    results.reasons.push('fallback_extension');
  }
  
  return results;
}
```

## Performance Optimization Guidelines

### 1. DynamoDB Query Optimization
- **Index Strategy**: Create GSIs on frequently queried targeting fields:
  - `campaignType-status-index`: For filtering active campaigns by type
  - `targetRestaurants-index`: For restaurant-specific campaign lookup
  - `occasions-dateRange-index`: For time-sensitive campaign queries

### 2. Caching Strategy
```javascript
// Cache frequently accessed campaigns by type and restaurant
const campaignCache = {
  byType: new Map(), // campaignType -> campaigns[]
  byRestaurant: new Map(), // restaurantId -> campaigns[]
  byTimeRange: new Map() // dateRange -> campaigns[]
};

// Cache invalidation on campaign updates
function invalidateCampaignCache(campaignId, campaignType, targetRestaurants) {
  campaignCache.byType.delete(campaignType);
  targetRestaurants?.forEach(rest => {
    campaignCache.byRestaurant.delete(rest.restaurantId);
  });
  // Clear time-based cache
  campaignCache.byTimeRange.clear();
}
```

### 3. Client-Side Filtering
```javascript
// Pre-filter campaigns based on basic criteria before detailed evaluation
function preFilterCampaigns(campaigns, basicContext) {
  return campaigns.filter(campaign => {
    // Quick status check
    if (!campaign.isActive) return false;
    
    // Quick date range check
    if (campaign.validFrom && new Date() < new Date(campaign.validFrom)) return false;
    if (campaign.validTo && new Date() > new Date(campaign.validTo)) return false;
    
    // Quick usage limit check
    if (campaign.usageLimit > 0 && campaign.usage >= campaign.usageLimit) return false;
    
    return true;
  });
}
```

## Integration Examples

### Mobile App Integration
```javascript
// Example: Getting eligible campaigns for checkout
async function getEligibleCampaigns(customerId, restaurantId, orderValue) {
  // 1. Get customer profile
  const customer = await getCustomerProfile(customerId);
  
  // 2. Get restaurant details
  const restaurant = await getRestaurantDetails(restaurantId);
  
  // 3. Build user context
  const userContext = {
    currentDateTime: new Date().toISOString(),
    location: customer.location,
    region: customer.region,
    partySize: getCartItemCount(),
    mealType: determineMealType()
  };
  
  // 4. Get active campaigns
  const activeCampaigns = await getCampaignsFromCache(restaurantId);
  
  // 5. Evaluate eligibility
  const eligibleCampaigns = activeCampaigns
    .map(campaign => ({
      ...campaign,
      eligibility: evaluateCampaignEligibility(campaign, customer, restaurant, userContext)
    }))
    .filter(c => c.eligibility.eligible)
    .sort((a, b) => {
      // Sort by priority and discount value
      return (b.targetingRules?.priority || 0) - (a.targetingRules?.priority || 0) ||
             b.discountValue - a.discountValue;
    });
  
  return eligibleCampaigns;
}
```

### Backend API Integration
```javascript
// Example: Campaign validation at order placement
app.post('/api/orders/validate-campaign', async (req, res) => {
  const { customerId, restaurantId, campaignCode, orderDetails } = req.body;
  
  try {
    // Get campaign by code
    const campaign = await getCampaignByCode(campaignCode);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    // Build evaluation context
    const customer = await getCustomerProfile(customerId);
    const restaurant = await getRestaurantDetails(restaurantId);
    const userContext = buildUserContext(req, orderDetails);
    
    // Evaluate eligibility
    const eligibility = evaluateCampaignEligibility(campaign, customer, restaurant, userContext);
    
    if (!eligibility.eligible) {
      return res.status(400).json({
        error: 'Campaign not applicable',
        reasons: eligibility.restrictions
      });
    }
    
    // Calculate discount
    const discount = calculateDiscount(campaign, orderDetails.subtotal);
    
    res.json({
      valid: true,
      campaign: campaign.title,
      discount: discount,
      reasons: eligibility.reasons
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Campaign validation failed' });
  }
});
```

## Testing and Validation

### Unit Test Examples
```javascript
describe('Campaign Targeting Evaluation', () => {
  test('evaluates customer segment targeting correctly', () => {
    const customer = {
      orderCount: 15,
      totalSpent: 750,
      joinDate: '2023-06-01',
      loyaltyLevel: 'gold'
    };
    
    const targetSegments = [{
      segmentId: 'premium_customers',
      criteria: { minOrderCount: 10, minSpentAmount: 500, loyaltyLevel: 'gold' },
      weight: 1.0
    }];
    
    const result = evaluateCustomerSegment(customer, targetSegments);
    expect(result.eligible).toBe(true);
    expect(result.segment).toBe('Premium Customers');
  });
  
  test('handles occasion-based time restrictions', () => {
    const occasions = [{
      occasionId: 'weekend_deals',
      schedule: { dayOfWeek: [5, 6], timeOfDay: { start: '12:00', end: '22:00' } }
    }];
    
    // Test Friday at 15:00
    const fridayAfternoon = new Date('2025-01-03T15:00:00');
    const result = evaluateOccasionTargeting(occasions, fridayAfternoon, {});
    expect(result.eligible).toBe(true);
    
    // Test Monday at 15:00
    const mondayAfternoon = new Date('2025-01-06T15:00:00');
    const mondayResult = evaluateOccasionTargeting(occasions, mondayAfternoon, {});
    expect(mondayResult.eligible).toBe(false);
  });
});
```

## Summary

This specification provides a comprehensive framework for:

1. **Structured Storage**: Clear DynamoDB schema for complex targeting criteria
2. **Logical Evaluation**: Step-by-step algorithms for customer applications to evaluate campaign eligibility
3. **Performance Optimization**: Caching and indexing strategies for scalable implementation
4. **Flexible Targeting**: Support for AND/OR logic, fallback behaviors, and weighted criteria
5. **Real-world Integration**: Practical examples for mobile apps and backend APIs

The targeting system enables sophisticated campaign personalization while maintaining clear, logical consumption patterns for customer-facing applications.
