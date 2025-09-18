# Implementation Guide: Enhanced Targeting Criteria Integration

## Overview

This guide shows how to integrate the advanced targeting criteria specification into the existing WizzCentral campaign creation system. It builds upon the current unified platform discounts structure while adding sophisticated targeting capabilities.

## Frontend Implementation

### 1. Enhanced Campaign Creator Form

Update `campaign-creator.html` to include targeting criteria sections:

```html
<!-- Enhanced Campaign Creator Form -->
<div id="campaign-creator-form">
  <!-- Existing Basic Campaign Info -->
  <div class="form-section">
    <h3>Basic Campaign Information</h3>
    <div class="form-row">
      <label>Campaign Type:</label>
      <select id="campaignType" onchange="updateFormDefaults()">
        <option value="marketing">Marketing Campaign</option>
        <option value="loyalty">Loyalty Campaign</option>
        <option value="seasonal">Seasonal Campaign</option>
        <option value="acquisition">Customer Acquisition</option>
        <option value="retention">Customer Retention</option>
        <option value="flash">Flash Sale</option>
      </select>
    </div>
    <!-- ... existing fields ... -->
  </div>

  <!-- NEW: Customer Segment Targeting -->
  <div class="form-section" id="customer-targeting">
    <h3>Customer Segment Targeting</h3>
    <div class="targeting-option">
      <input type="checkbox" id="enable-customer-targeting" onchange="toggleCustomerTargeting()">
      <label for="enable-customer-targeting">Enable customer segment targeting</label>
    </div>
    
    <div id="customer-segments-container" style="display: none;">
      <div class="segment-builder">
        <h4>Target Segments</h4>
        <div id="segments-list">
          <!-- Dynamic segment items will be added here -->
        </div>
        <button type="button" onclick="addCustomerSegment()">+ Add Segment</button>
      </div>
      
      <!-- Segment Template -->
      <template id="segment-template">
        <div class="segment-item">
          <div class="segment-header">
            <input type="text" placeholder="Segment Name" class="segment-name">
            <button type="button" onclick="removeSegment(this)">Remove</button>
          </div>
          <div class="segment-criteria">
            <div class="criteria-row">
              <label>Minimum Orders:</label>
              <input type="number" class="min-orders" min="0">
            </div>
            <div class="criteria-row">
              <label>Minimum Spent (IQD):</label>
              <input type="number" class="min-spent" min="0">
            </div>
            <div class="criteria-row">
              <label>Loyalty Level:</label>
              <select class="loyalty-level">
                <option value="">Any</option>
                <option value="bronze">Bronze</option>
                <option value="silver">Silver</option>
                <option value="gold">Gold</option>
                <option value="platinum">Platinum</option>
              </select>
            </div>
            <div class="criteria-row">
              <label>Joined After:</label>
              <input type="date" class="join-date-after">
            </div>
            <div class="criteria-row">
              <label>Segment Weight (0-1):</label>
              <input type="number" class="segment-weight" min="0" max="1" step="0.1" value="1.0">
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>

  <!-- NEW: Restaurant Targeting -->
  <div class="form-section" id="restaurant-targeting">
    <h3>Restaurant Targeting</h3>
    <div class="targeting-option">
      <input type="checkbox" id="enable-restaurant-targeting" onchange="toggleRestaurantTargeting()">
      <label for="enable-restaurant-targeting">Enable restaurant targeting</label>
    </div>
    
    <div id="restaurant-targeting-container" style="display: none;">
      <div class="targeting-mode">
        <label>Targeting Mode:</label>
        <select id="restaurant-mode" onchange="updateRestaurantMode()">
          <option value="specific">Specific Restaurants</option>
          <option value="category">By Category</option>
          <option value="location">By Location/Zone</option>
          <option value="rating">By Rating</option>
        </select>
      </div>
      
      <!-- Specific Restaurants -->
      <div id="specific-restaurants" class="targeting-details">
        <div class="restaurant-search">
          <input type="text" id="restaurant-search" placeholder="Search restaurants...">
          <div id="restaurant-suggestions"></div>
        </div>
        <div id="selected-restaurants">
          <!-- Selected restaurants will appear here -->
        </div>
      </div>
      
      <!-- Category Targeting -->
      <div id="category-targeting" class="targeting-details" style="display: none;">
        <label>Restaurant Categories:</label>
        <div class="category-grid">
          <label><input type="checkbox" value="iraqi"> Iraqi Cuisine</label>
          <label><input type="checkbox" value="fast_food"> Fast Food</label>
          <label><input type="checkbox" value="pizza"> Pizza</label>
          <label><input type="checkbox" value="burgers"> Burgers</label>
          <label><input type="checkbox" value="traditional"> Traditional</label>
          <label><input type="checkbox" value="seafood"> Seafood</label>
          <label><input type="checkbox" value="desserts"> Desserts</label>
          <label><input type="checkbox" value="coffee"> Coffee & Drinks</label>
        </div>
      </div>
      
      <!-- Location Targeting -->
      <div id="location-targeting" class="targeting-details" style="display: none;">
        <label>Target Areas:</label>
        <div class="location-grid">
          <label><input type="checkbox" value="karrada"> Karrada</label>
          <label><input type="checkbox" value="mansour"> Mansour</label>
          <label><input type="checkbox" value="jadiriya"> Jadiriya</label>
          <label><input type="checkbox" value="sadr_city"> Sadr City</label>
          <label><input type="checkbox" value="kadhimiya"> Kadhimiya</label>
          <label><input type="checkbox" value="adhamiya"> Adhamiya</label>
        </div>
      </div>
      
      <!-- Rating Targeting -->
      <div id="rating-targeting" class="targeting-details" style="display: none;">
        <label>Minimum Rating:</label>
        <select id="min-rating">
          <option value="">Any Rating</option>
          <option value="3.0">3.0+ Stars</option>
          <option value="3.5">3.5+ Stars</option>
          <option value="4.0">4.0+ Stars</option>
          <option value="4.5">4.5+ Stars</option>
        </select>
      </div>
    </div>
  </div>

  <!-- NEW: Occasion Targeting -->
  <div class="form-section" id="occasion-targeting">
    <h3>Occasion & Time Targeting</h3>
    <div class="targeting-option">
      <input type="checkbox" id="enable-occasion-targeting" onchange="toggleOccasionTargeting()">
      <label for="enable-occasion-targeting">Enable occasion-based targeting</label>
    </div>
    
    <div id="occasion-targeting-container" style="display: none;">
      <div class="occasion-types">
        <label>Occasion Type:</label>
        <select id="occasion-type" onchange="updateOccasionFields()">
          <option value="special_event">Special Event</option>
          <option value="recurring">Recurring Schedule</option>
          <option value="religious">Religious Occasion</option>
          <option value="seasonal">Seasonal Event</option>
        </select>
      </div>
      
      <!-- Special Event Fields -->
      <div id="special-event-fields" class="occasion-details">
        <div class="form-row">
          <label>Event Name:</label>
          <input type="text" id="event-name" placeholder="e.g., New Year Celebration">
        </div>
        <div class="form-row">
          <label>Start Date:</label>
          <input type="date" id="event-start">
        </div>
        <div class="form-row">
          <label>End Date:</label>
          <input type="date" id="event-end">
        </div>
      </div>
      
      <!-- Recurring Schedule Fields -->
      <div id="recurring-fields" class="occasion-details" style="display: none;">
        <div class="form-row">
          <label>Days of Week:</label>
          <div class="day-selector">
            <label><input type="checkbox" value="0"> Sunday</label>
            <label><input type="checkbox" value="1"> Monday</label>
            <label><input type="checkbox" value="2"> Tuesday</label>
            <label><input type="checkbox" value="3"> Wednesday</label>
            <label><input type="checkbox" value="4"> Thursday</label>
            <label><input type="checkbox" value="5"> Friday</label>
            <label><input type="checkbox" value="6"> Saturday</label>
          </div>
        </div>
        <div class="form-row">
          <label>Time Range:</label>
          <input type="time" id="time-start"> to <input type="time" id="time-end">
        </div>
      </div>
      
      <!-- Religious Occasion Fields -->
      <div id="religious-fields" class="occasion-details" style="display: none;">
        <div class="form-row">
          <label>Religious Event:</label>
          <select id="religious-event">
            <option value="ramadan">Ramadan</option>
            <option value="eid_fitr">Eid al-Fitr</option>
            <option value="eid_adha">Eid al-Adha</option>
            <option value="ashura">Ashura</option>
            <option value="mawlid">Mawlid al-Nabi</option>
          </select>
        </div>
        <div class="form-row">
          <label>Meal Times:</label>
          <div class="meal-times">
            <label><input type="checkbox" value="iftar"> Iftar (18:00-21:00)</label>
            <label><input type="checkbox" value="suhoor"> Suhoor (02:00-05:00)</label>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- NEW: Targeting Logic Configuration -->
  <div class="form-section" id="targeting-logic">
    <h3>Targeting Logic</h3>
    <div class="form-row">
      <label>Logic Type:</label>
      <select id="targeting-logic-type">
        <option value="AND">AND (All criteria must match)</option>
        <option value="OR">OR (Any criteria can match)</option>
      </select>
    </div>
    <div class="form-row">
      <label>Priority:</label>
      <input type="number" id="campaign-priority" min="1" max="10" value="1">
      <small>Higher numbers = higher priority when multiple campaigns match</small>
    </div>
    <div class="form-row">
      <label>Fallback Behavior:</label>
      <select id="fallback-behavior">
        <option value="strict">Strict (no fallback)</option>
        <option value="extend_to_all">Extend to all customers if no matches</option>
      </select>
    </div>
  </div>

  <!-- Existing form sections continue... -->
</div>
```

### 2. Enhanced JavaScript Form Handler

Update the campaign creation JavaScript to handle targeting criteria:

```javascript
// Enhanced Campaign Form Management
class EnhancedCampaignCreator {
  constructor() {
    this.restaurants = [];
    this.selectedRestaurants = [];
    this.loadRestaurants();
  }

  // Load restaurant data for targeting
  async loadRestaurants() {
    try {
      const response = await fetch('/api/restaurants');
      this.restaurants = await response.json();
    } catch (error) {
      console.error('Failed to load restaurants:', error);
      this.restaurants = []; // Fallback to empty array
    }
  }

  // Toggle customer segment targeting
  toggleCustomerTargeting() {
    const checkbox = document.getElementById('enable-customer-targeting');
    const container = document.getElementById('customer-segments-container');
    container.style.display = checkbox.checked ? 'block' : 'none';
  }

  // Add new customer segment
  addCustomerSegment() {
    const container = document.getElementById('segments-list');
    const template = document.getElementById('segment-template');
    const clone = template.content.cloneNode(true);
    
    // Generate unique ID for this segment
    const segmentId = 'segment_' + Date.now();
    clone.querySelector('.segment-item').setAttribute('data-segment-id', segmentId);
    
    container.appendChild(clone);
  }

  // Remove customer segment
  removeSegment(button) {
    const segmentItem = button.closest('.segment-item');
    segmentItem.remove();
  }

  // Toggle restaurant targeting
  toggleRestaurantTargeting() {
    const checkbox = document.getElementById('enable-restaurant-targeting');
    const container = document.getElementById('restaurant-targeting-container');
    container.style.display = checkbox.checked ? 'block' : 'none';
  }

  // Update restaurant targeting mode
  updateRestaurantMode() {
    const mode = document.getElementById('restaurant-mode').value;
    
    // Hide all targeting details
    document.querySelectorAll('.targeting-details').forEach(el => {
      el.style.display = 'none';
    });
    
    // Show relevant targeting section
    switch (mode) {
      case 'specific':
        document.getElementById('specific-restaurants').style.display = 'block';
        break;
      case 'category':
        document.getElementById('category-targeting').style.display = 'block';
        break;
      case 'location':
        document.getElementById('location-targeting').style.display = 'block';
        break;
      case 'rating':
        document.getElementById('rating-targeting').style.display = 'block';
        break;
    }
  }

  // Restaurant search functionality
  setupRestaurantSearch() {
    const searchInput = document.getElementById('restaurant-search');
    const suggestions = document.getElementById('restaurant-suggestions');
    
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      
      if (query.length < 2) {
        suggestions.innerHTML = '';
        return;
      }
      
      const matches = this.restaurants.filter(restaurant => 
        restaurant.name.toLowerCase().includes(query) ||
        restaurant.cuisine?.toLowerCase().includes(query)
      ).slice(0, 10);
      
      suggestions.innerHTML = matches.map(restaurant => `
        <div class="suggestion-item" onclick="campaignCreator.selectRestaurant('${restaurant.id}')">
          <div class="restaurant-name">${restaurant.name}</div>
          <div class="restaurant-details">${restaurant.cuisine} • ${restaurant.location}</div>
        </div>
      `).join('');
    });
  }

  // Select restaurant for targeting
  selectRestaurant(restaurantId) {
    const restaurant = this.restaurants.find(r => r.id === restaurantId);
    if (!restaurant || this.selectedRestaurants.some(r => r.id === restaurantId)) {
      return; // Already selected
    }
    
    this.selectedRestaurants.push(restaurant);
    this.updateSelectedRestaurantsDisplay();
    
    // Clear search
    document.getElementById('restaurant-search').value = '';
    document.getElementById('restaurant-suggestions').innerHTML = '';
  }

  // Update selected restaurants display
  updateSelectedRestaurantsDisplay() {
    const container = document.getElementById('selected-restaurants');
    container.innerHTML = this.selectedRestaurants.map(restaurant => `
      <div class="selected-restaurant" data-restaurant-id="${restaurant.id}">
        <span class="restaurant-name">${restaurant.name}</span>
        <span class="restaurant-location">${restaurant.location}</span>
        <button type="button" onclick="campaignCreator.removeRestaurant('${restaurant.id}')">×</button>
      </div>
    `).join('');
  }

  // Remove restaurant from selection
  removeRestaurant(restaurantId) {
    this.selectedRestaurants = this.selectedRestaurants.filter(r => r.id !== restaurantId);
    this.updateSelectedRestaurantsDisplay();
  }

  // Toggle occasion targeting
  toggleOccasionTargeting() {
    const checkbox = document.getElementById('enable-occasion-targeting');
    const container = document.getElementById('occasion-targeting-container');
    container.style.display = checkbox.checked ? 'block' : 'none';
  }

  // Update occasion fields based on type
  updateOccasionFields() {
    const type = document.getElementById('occasion-type').value;
    
    // Hide all occasion details
    document.querySelectorAll('.occasion-details').forEach(el => {
      el.style.display = 'none';
    });
    
    // Show relevant fields
    switch (type) {
      case 'special_event':
        document.getElementById('special-event-fields').style.display = 'block';
        break;
      case 'recurring':
        document.getElementById('recurring-fields').style.display = 'block';
        break;
      case 'religious':
        document.getElementById('religious-fields').style.display = 'block';
        break;
      case 'seasonal':
        document.getElementById('special-event-fields').style.display = 'block';
        break;
    }
  }

  // Collect targeting criteria from form
  collectTargetingCriteria() {
    const targeting = {
      targetSegments: [],
      targetRestaurants: [],
      occasions: [],
      targetingRules: {
        logic: document.getElementById('targeting-logic-type').value,
        priority: parseInt(document.getElementById('campaign-priority').value) || 1,
        fallbackBehavior: document.getElementById('fallback-behavior').value
      }
    };

    // Collect customer segments
    if (document.getElementById('enable-customer-targeting').checked) {
      const segments = document.querySelectorAll('.segment-item');
      segments.forEach(segment => {
        const segmentData = {
          segmentId: segment.getAttribute('data-segment-id'),
          segmentName: segment.querySelector('.segment-name').value,
          criteria: {},
          weight: parseFloat(segment.querySelector('.segment-weight').value) || 1.0
        };
        
        // Collect criteria
        const minOrders = segment.querySelector('.min-orders').value;
        if (minOrders) segmentData.criteria.minOrderCount = parseInt(minOrders);
        
        const minSpent = segment.querySelector('.min-spent').value;
        if (minSpent) segmentData.criteria.minSpentAmount = parseFloat(minSpent);
        
        const loyaltyLevel = segment.querySelector('.loyalty-level').value;
        if (loyaltyLevel) segmentData.criteria.loyaltyLevel = loyaltyLevel;
        
        const joinDate = segment.querySelector('.join-date-after').value;
        if (joinDate) segmentData.criteria.joinDateAfter = joinDate;
        
        if (segmentData.segmentName && Object.keys(segmentData.criteria).length > 0) {
          targeting.targetSegments.push(segmentData);
        }
      });
    }

    // Collect restaurant targeting
    if (document.getElementById('enable-restaurant-targeting').checked) {
      const mode = document.getElementById('restaurant-mode').value;
      
      switch (mode) {
        case 'specific':
          targeting.targetRestaurants = this.selectedRestaurants.map(restaurant => ({
            restaurantId: restaurant.id,
            restaurantName: restaurant.name,
            location: {
              city: restaurant.city || 'Baghdad',
              district: restaurant.district || '',
              coordinates: restaurant.coordinates || {}
            },
            categories: restaurant.categories || [],
            isActive: true
          }));
          break;
          
        case 'category':
          const selectedCategories = Array.from(document.querySelectorAll('#category-targeting input:checked'))
            .map(input => input.value);
          if (selectedCategories.length > 0) {
            targeting.targetRestaurants.push({
              restaurantId: 'category_filter',
              restaurantName: 'Category Filter',
              categories: selectedCategories,
              isActive: true
            });
          }
          break;
          
        case 'location':
          const selectedLocations = Array.from(document.querySelectorAll('#location-targeting input:checked'))
            .map(input => input.value);
          if (selectedLocations.length > 0) {
            targeting.targetRestaurants.push({
              restaurantId: 'location_filter',
              restaurantName: 'Location Filter',
              deliveryZones: selectedLocations,
              isActive: true
            });
          }
          break;
          
        case 'rating':
          const minRating = document.getElementById('min-rating').value;
          if (minRating) {
            targeting.targetRestaurants.push({
              restaurantId: 'rating_filter',
              restaurantName: 'Rating Filter',
              ratingMin: parseFloat(minRating),
              isActive: true
            });
          }
          break;
      }
    }

    // Collect occasion targeting
    if (document.getElementById('enable-occasion-targeting').checked) {
      const occasionType = document.getElementById('occasion-type').value;
      const occasion = {
        occasionId: 'occasion_' + Date.now(),
        type: occasionType
      };
      
      switch (occasionType) {
        case 'special_event':
        case 'seasonal':
          const eventName = document.getElementById('event-name').value;
          const startDate = document.getElementById('event-start').value;
          const endDate = document.getElementById('event-end').value;
          
          if (eventName && startDate && endDate) {
            occasion.occasionName = eventName;
            occasion.dateRange = { start: startDate, end: endDate };
            targeting.occasions.push(occasion);
          }
          break;
          
        case 'recurring':
          const selectedDays = Array.from(document.querySelectorAll('.day-selector input:checked'))
            .map(input => parseInt(input.value));
          const timeStart = document.getElementById('time-start').value;
          const timeEnd = document.getElementById('time-end').value;
          
          if (selectedDays.length > 0 && timeStart && timeEnd) {
            occasion.occasionName = 'Recurring Schedule';
            occasion.schedule = {
              dayOfWeek: selectedDays,
              timeOfDay: { start: timeStart, end: timeEnd }
            };
            targeting.occasions.push(occasion);
          }
          break;
          
        case 'religious':
          const religiousEvent = document.getElementById('religious-event').value;
          const selectedMeals = Array.from(document.querySelectorAll('.meal-times input:checked'))
            .map(input => input.value);
          
          if (religiousEvent) {
            occasion.occasionName = religiousEvent;
            if (selectedMeals.length > 0) {
              occasion.timeConstraints = {};
              selectedMeals.forEach(meal => {
                if (meal === 'iftar') {
                  occasion.timeConstraints.iftar = { start: '18:00', end: '21:00' };
                } else if (meal === 'suhoor') {
                  occasion.timeConstraints.suhoor = { start: '02:00', end: '05:00' };
                }
              });
            }
            targeting.occasions.push(occasion);
          }
          break;
      }
    }

    return targeting;
  }

  // Enhanced create campaign function
  async createCampaignWithTargeting() {
    try {
      // Collect basic campaign data (existing logic)
      const formData = new FormData(document.getElementById('campaign-creator-form'));
      const basicCampaignData = {
        title: formData.get('title'),
        code: formData.get('code'),
        campaignType: formData.get('campaignType'),
        discountType: formData.get('discountType'),
        discountValue: parseFloat(formData.get('discountValue')),
        description: formData.get('description'),
        minOrderValue: parseFloat(formData.get('minOrderValue')) || 0,
        usageLimit: parseInt(formData.get('usageLimit')) || 0,
        startDate: formData.get('startDate'),
        endDate: formData.get('endDate'),
        autoActivate: formData.get('autoActivate') === 'on'
      };
      
      // Collect targeting criteria
      const targetingCriteria = this.collectTargetingCriteria();
      
      // Merge campaign data with targeting
      const enhancedCampaignData = {
        ...basicCampaignData,
        ...targetingCriteria
      };
      
      console.log('Creating campaign with enhanced targeting:', enhancedCampaignData);
      
      // Call the enhanced create campaign API
      const result = await window.DataService.createCampaign(enhancedCampaignData);
      
      if (result.success) {
        alert('Campaign created successfully with advanced targeting!');
        location.reload(); // Refresh to show new campaign
      } else {
        alert('Failed to create campaign: ' + (result.error || 'Unknown error'));
      }
      
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Error creating campaign: ' + error.message);
    }
  }
}

// Initialize enhanced campaign creator
const campaignCreator = new EnhancedCampaignCreator();

// Update the existing create campaign button to use enhanced function
document.addEventListener('DOMContentLoaded', function() {
  const createButton = document.querySelector('#create-campaign-btn');
  if (createButton) {
    createButton.onclick = () => campaignCreator.createCampaignWithTargeting();
  }
  
  // Setup restaurant search
  campaignCreator.setupRestaurantSearch();
});
```

## Backend Data Service Updates

### Enhanced createCampaign Function

The existing `createCampaign` function in `data-service.js` already supports the targeting fields. Here's how to ensure proper handling:

```javascript
// Enhanced createCampaign function (update to existing)
async function createCampaign(campaignData) {
    console.log('INFO: Creating campaign with enhanced targeting criteria...');
    const startTime = Date.now();
    
    try {
        const client = await getClientSafe();
        if (!client) {
            console.warn('No DynamoDB client available for campaign creation');
            return { success: false, error: 'No DynamoDB client available' };
        }

        const campaignId = campaignData.discountId || campaignData.campaignId || `campaign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const timestamp = new Date().toISOString();
        
        // Normalize discount type
        const normalizedType = (campaignData.type === 'fixed_amount' || campaignData.discountType === 'fixed_amount') ? 'fixed' : 
                               (campaignData.discountType || campaignData.type || 'percentage');
        
        // Create enhanced campaign object with targeting criteria
        const campaign = {
            // Existing fields...
            discountId: campaignId,
            campaignId,
            title: campaignData.title || '',
            code: campaignData.code || '',
            type: normalizedType,
            discountType: normalizedType,
            campaignType: campaignData.campaignType || 'marketing',
            value: parseFloat(campaignData.discountValue || campaignData.value) || 0,
            discountValue: parseFloat(campaignData.discountValue || campaignData.value) || 0,
            
            // Enhanced targeting criteria with validation
            targetSegments: validateTargetSegments(campaignData.targetSegments || []),
            targetRestaurants: validateTargetRestaurants(campaignData.targetRestaurants || []),
            occasions: validateOccasions(campaignData.occasions || []),
            
            // Targeting rules with defaults
            targetingRules: {
                logic: campaignData.targetingRules?.logic || 'AND',
                priority: parseInt(campaignData.targetingRules?.priority) || 1,
                fallbackBehavior: campaignData.targetingRules?.fallbackBehavior || 'strict',
                inclusivity: campaignData.targetingRules?.inclusivity || 'inclusive'
            },
            
            // Rest of the existing fields...
            discountSource: 'campaign',
            status: campaignData.status || 'active',
            isActive: campaignData.isActive !== false,
            usage: 0,
            usageLimit: parseInt(campaignData.usageLimit) || 0,
            minOrderValue: parseFloat(campaignData.minOrderValue) || 0,
            startDate: campaignData.startDate || '',
            endDate: campaignData.endDate || '',
            createdAt: timestamp,
            updatedAt: timestamp,
            createdBy: 'central-platform'
        };

        const params = {
            TableName: TABLES.platformDiscounts,
            Item: campaign
        };

        await client.put(params).promise();
        const duration = Date.now() - startTime;
        
        console.log(`✅ Enhanced campaign created successfully: ${campaignId} (${duration}ms)`);
        console.log(`  - Targeting segments: ${campaign.targetSegments.length}`);
        console.log(`  - Targeting restaurants: ${campaign.targetRestaurants.length}`);
        console.log(`  - Occasions: ${campaign.occasions.length}`);
        
        return { success: true, discountId: campaignId, campaignId };
        
    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`ERROR: Enhanced campaign creation failed after ${duration}ms:`, error?.message || error);
        return { success: false, error: `Create campaign failed: ${error?.message || error}` };
    }
}

// Validation functions for targeting criteria
function validateTargetSegments(segments) {
    if (!Array.isArray(segments)) return [];
    
    return segments.filter(segment => {
        // Validate segment structure
        if (!segment.segmentId || !segment.segmentName) return false;
        if (!segment.criteria || typeof segment.criteria !== 'object') return false;
        
        // Validate criteria values
        const criteria = segment.criteria;
        if (criteria.minOrderCount && (isNaN(criteria.minOrderCount) || criteria.minOrderCount < 0)) return false;
        if (criteria.minSpentAmount && (isNaN(criteria.minSpentAmount) || criteria.minSpentAmount < 0)) return false;
        
        return true;
    }).map(segment => ({
        ...segment,
        weight: parseFloat(segment.weight) || 1.0 // Ensure weight is a number
    }));
}

function validateTargetRestaurants(restaurants) {
    if (!Array.isArray(restaurants)) return [];
    
    return restaurants.filter(restaurant => {
        // Basic validation
        if (!restaurant.restaurantId) return false;
        
        // Validate coordinates if present
        if (restaurant.location?.coordinates) {
            const coords = restaurant.location.coordinates;
            if (coords.lat && (isNaN(coords.lat) || coords.lat < -90 || coords.lat > 90)) return false;
            if (coords.lng && (isNaN(coords.lng) || coords.lng < -180 || coords.lng > 180)) return false;
        }
        
        // Validate rating if present
        if (restaurant.ratingMin && (isNaN(restaurant.ratingMin) || restaurant.ratingMin < 0 || restaurant.ratingMin > 5)) return false;
        
        return true;
    });
}

function validateOccasions(occasions) {
    if (!Array.isArray(occasions)) return [];
    
    return occasions.filter(occasion => {
        // Validate basic structure
        if (!occasion.occasionId || !occasion.type) return false;
        
        // Validate date ranges
        if (occasion.dateRange) {
            const start = new Date(occasion.dateRange.start);
            const end = new Date(occasion.dateRange.end);
            if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) return false;
        }
        
        // Validate recurring schedule
        if (occasion.schedule?.dayOfWeek) {
            const days = occasion.schedule.dayOfWeek;
            if (!Array.isArray(days) || days.some(day => day < 0 || day > 6)) return false;
        }
        
        return true;
    });
}
```

## Campaign Retrieval with Targeting

### Enhanced getCampaigns Function

Update the campaign retrieval to include targeting criteria:

```javascript
// Enhanced getCampaigns function
async function getCampaigns() {
    console.log('INFO: Getting campaigns with enhanced targeting criteria...');
    try {
        const client = await getClientSafe();
        if (!client) {
            console.warn('No DynamoDB client available for campaigns');
            return [];
        }

        const params = {
            TableName: TABLES.platformDiscounts,
            FilterExpression: 'discountSource = :source',
            ExpressionAttributeValues: {
                ':source': 'campaign'
            }
        };

        const result = await client.scan(params).promise();
        console.log(`✅ Retrieved ${result.Items?.length || 0} campaigns with targeting criteria`);
        
        return (result.Items || []).map(item => ({
            // Basic campaign info
            id: item.campaignId || item.discountId,
            campaignId: item.campaignId || item.discountId,
            title: item.title || '',
            code: item.code || '',
            campaignType: item.campaignType || 'marketing',
            discountType: item.discountType || 'percentage',
            discountValue: item.discountValue || 0,
            status: item.status || 'draft',
            isActive: item.isActive || false,
            
            // Enhanced targeting criteria
            targetSegments: item.targetSegments || [],
            targetRestaurants: item.targetRestaurants || [],
            occasions: item.occasions || [],
            targetingRules: item.targetingRules || {
                logic: 'AND',
                priority: 1,
                fallbackBehavior: 'strict'
            },
            
            // Usage and constraints
            usage: item.usage || 0,
            usageLimit: item.usageLimit || 0,
            minOrderValue: item.minOrderValue || 0,
            
            // Dates
            startDate: item.startDate || '',
            endDate: item.endDate || '',
            createdAt: item.createdAt || '',
            updatedAt: item.updatedAt || '',
            
            // Computed targeting summary for display
            targetingSummary: generateTargetingSummary(item)
        }));
    } catch (error) {
        console.error('Error getting campaigns:', error);
        return [];
    }
}

// Generate targeting summary for display
function generateTargetingSummary(campaign) {
    const summary = [];
    
    if (campaign.targetSegments?.length > 0) {
        summary.push(`${campaign.targetSegments.length} customer segment(s)`);
    }
    
    if (campaign.targetRestaurants?.length > 0) {
        summary.push(`${campaign.targetRestaurants.length} restaurant(s)`);
    }
    
    if (campaign.occasions?.length > 0) {
        summary.push(`${campaign.occasions.length} occasion(s)`);
    }
    
    if (summary.length === 0) {
        return 'Universal (all customers)';
    }
    
    const logic = campaign.targetingRules?.logic || 'AND';
    return summary.join(` ${logic} `);
}
```

## Frontend Display Updates

### Enhanced Campaign List View

Update the campaign list to show targeting information:

```javascript
// Enhanced display functions
function displayCampaigns(campaigns) {
    const container = document.getElementById('campaigns-list');
    if (!container || !campaigns) return;
    
    container.innerHTML = campaigns.map(campaign => `
        <div class="campaign-item" data-campaign-id="${campaign.id}">
            <div class="campaign-header">
                <h3>${campaign.title}</h3>
                <div class="campaign-badges">
                    <span class="badge badge-${campaign.campaignType}">${campaign.campaignType}</span>
                    <span class="badge badge-${campaign.status}">${campaign.status}</span>
                </div>
            </div>
            
            <div class="campaign-details">
                <div class="detail-row">
                    <span class="label">Code:</span>
                    <span class="value">${campaign.code}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Discount:</span>
                    <span class="value">${campaign.discountValue}${campaign.discountType === 'percentage' ? '%' : ' IQD'}</span>
                </div>
                <div class="detail-row">
                    <span class="label">Usage:</span>
                    <span class="value">${campaign.usage}/${campaign.usageLimit || '∞'}</span>
                </div>
            </div>
            
            <div class="targeting-summary">
                <div class="targeting-header">
                    <i class="icon-target"></i>
                    <span>Targeting:</span>
                </div>
                <div class="targeting-details">${campaign.targetingSummary}</div>
                ${generateTargetingDetails(campaign)}
            </div>
            
            <div class="campaign-actions">
                <button onclick="editCampaign('${campaign.id}')" class="btn btn-secondary">Edit</button>
                <button onclick="viewCampaignTargeting('${campaign.id}')" class="btn btn-info">View Targeting</button>
                <button onclick="toggleCampaignStatus('${campaign.id}')" class="btn btn-${campaign.isActive ? 'warning' : 'success'}">
                    ${campaign.isActive ? 'Deactivate' : 'Activate'}
                </button>
            </div>
        </div>
    `).join('');
}

function generateTargetingDetails(campaign) {
    let details = '';
    
    if (campaign.targetSegments?.length > 0) {
        details += `
            <div class="targeting-detail">
                <strong>Customer Segments:</strong>
                <ul>
                    ${campaign.targetSegments.map(segment => `
                        <li>${segment.segmentName} (weight: ${segment.weight})</li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    if (campaign.targetRestaurants?.length > 0) {
        details += `
            <div class="targeting-detail">
                <strong>Restaurants:</strong>
                <ul>
                    ${campaign.targetRestaurants.map(restaurant => `
                        <li>${restaurant.restaurantName}</li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    if (campaign.occasions?.length > 0) {
        details += `
            <div class="targeting-detail">
                <strong>Occasions:</strong>
                <ul>
                    ${campaign.occasions.map(occasion => `
                        <li>${occasion.occasionName} (${occasion.type})</li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    return details ? `<div class="targeting-expanded" style="display: none;">${details}</div>` : '';
}

// View detailed targeting information
function viewCampaignTargeting(campaignId) {
    // Implement detailed targeting view modal
    const campaign = campaigns.find(c => c.id === campaignId);
    if (!campaign) return;
    
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content targeting-modal">
            <div class="modal-header">
                <h2>Targeting Details: ${campaign.title}</h2>
                <button onclick="this.closest('.modal-overlay').remove()" class="close-btn">×</button>
            </div>
            <div class="modal-body">
                ${generateDetailedTargetingView(campaign)}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function generateDetailedTargetingView(campaign) {
    // Generate comprehensive targeting view with all criteria details
    // This would show the full targeting specification in a readable format
    // ... implementation details ...
}
```

## API Integration Points

### Customer Application Integration

For customer-facing applications to consume the targeting criteria:

```javascript
// Customer application integration example
class CampaignTargetingService {
    constructor(apiBaseUrl) {
        this.apiBaseUrl = apiBaseUrl;
    }
    
    // Get eligible campaigns for a customer
    async getEligibleCampaigns(customerId, restaurantId, orderContext) {
        const response = await fetch(`${this.apiBaseUrl}/campaigns/eligible`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                customerId,
                restaurantId,
                orderContext: {
                    orderValue: orderContext.subtotal,
                    currentDateTime: new Date().toISOString(),
                    location: orderContext.deliveryLocation,
                    partySize: orderContext.itemCount
                }
            })
        });
        
        return await response.json();
    }
    
    // Validate campaign eligibility
    async validateCampaign(campaignCode, customerId, restaurantId, orderContext) {
        const response = await fetch(`${this.apiBaseUrl}/campaigns/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                campaignCode,
                customerId,
                restaurantId,
                orderContext
            })
        });
        
        return await response.json();
    }
}
```

## Summary

This implementation guide provides:

1. **Enhanced Frontend Forms**: Advanced UI components for configuring targeting criteria
2. **Backend Integration**: Updates to the existing data service to handle complex targeting
3. **Validation Logic**: Comprehensive validation for all targeting criteria types
4. **Display Enhancements**: Improved campaign list views showing targeting summaries
5. **API Integration**: Examples for customer application consumption

The implementation builds upon the existing campaign type enhancement while adding sophisticated targeting capabilities that integrate seamlessly with the current WizzCentral platform architecture.
