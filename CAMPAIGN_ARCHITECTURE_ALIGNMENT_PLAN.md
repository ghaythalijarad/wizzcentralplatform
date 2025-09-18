# 🏗️ WizzCentral Campaign Architecture Alignment Plan

## 📋 **Current State Analysis**

### **Existing Campaign System Issues**

The current WizzCentral campaign system has architectural misalignments that need to be addressed:

1. **Data Storage Inconsistency**
   - ❌ Campaigns stored in `WizzCentral_Platform_Discounts` table with `discountSource = "campaign"`
   - ❌ Single table approach limits scalability and performance
   - ❌ No proper separation of campaign metadata, conditions, and usage tracking

2. **Complex Frontend Condition Engine**
   - ❌ Heavy UI-based condition builder with modals and complex interactions
   - ❌ Frontend-side condition evaluation instead of backend logic
   - ❌ Condition storage mixed with campaign data

3. **Performance Limitations**
   - ❌ No GSI optimization for common queries
   - ❌ No Redis caching layer
   - ❌ Inefficient filtering and retrieval patterns

4. **Concurrency Issues**
   - ❌ No atomic usage counter updates
   - ❌ Race conditions in campaign redemption
   - ❌ No proper usage tracking separation

## 🎯 **Target Architecture Requirements**

### **3-Table DynamoDB Structure**

```
WizzCentral_Campaigns
├── campaignId (PK)
├── title, type, discountType, discountValue
├── startDate, endDate, status, isActive
├── usageLimit, targetRestaurants
├── createdBy, createdAt, updatedAt
└── GSI Fields: isActive, status, dateRange, targetRestaurants

WizzCentral_Campaign_Conditions  
├── campaignId (PK)
├── conditions (JSON array of rules)
├── conditionLogic (AND/OR)
└── createdAt, updatedAt

WizzCentral_Campaign_Usage
├── campaignId (PK)  
├── usage (current usage counter)
├── usageLimit, lastUsedAt
└── createdAt
```

### **API Endpoints**

- `POST /campaigns` → Create campaign (3-table structure)
- `GET /campaigns/active` → Fetch active campaigns (GSI optimized)
- `POST /campaigns/{id}/redeem` → Atomic usage tracking

### **Performance Requirements**

- Redis/ElastiCache for hot read performance
- GSI for efficient active campaign queries
- Backend condition evaluation (not in DynamoDB)
- Atomic usage counters with DynamoDB conditional updates

## 🔄 **Migration Plan**

### **Phase 1: Backend Data Model Migration**

#### **Step 1.1: Create New DynamoDB Tables**

```javascript
// New table creation script
const CAMPAIGNS_TABLE_SCHEMA = {
    TableName: 'WizzCentral_Campaigns',
    KeySchema: [
        { AttributeName: 'campaignId', KeyType: 'HASH' }
    ],
    AttributeDefinitions: [
        { AttributeName: 'campaignId', AttributeType: 'S' },
        { AttributeName: 'isActive', AttributeType: 'BOOL' },
        { AttributeName: 'status', AttributeType: 'S' },
        { AttributeName: 'startDate', AttributeType: 'S' }
    ],
    GlobalSecondaryIndexes: [
        {
            IndexName: 'ActiveCampaignsIndex',
            KeySchema: [
                { AttributeName: 'isActive', KeyType: 'HASH' },
                { AttributeName: 'startDate', KeyType: 'RANGE' }
            ]
        },
        {
            IndexName: 'StatusIndex', 
            KeySchema: [
                { AttributeName: 'status', KeyType: 'HASH' },
                { AttributeName: 'startDate', KeyType: 'RANGE' }
            ]
        }
    ]
};
```

#### **Step 1.2: Migrate Existing Campaign Data**

```javascript
// Migration script to move campaigns from platform discounts to new structure
async function migrateCampaignData() {
    // 1. Query existing campaigns from WizzCentral_Platform_Discounts
    const existingCampaigns = await queryItems({
        TableName: 'WizzCentral_Platform_Discounts',
        FilterExpression: 'discountSource = :source',
        ExpressionAttributeValues: { ':source': 'campaign' }
    });
    
    // 2. Transform and insert into new 3-table structure
    for (const campaign of existingCampaigns) {
        const campaignId = campaign.discountId;
        
        // Core campaign data
        await putItem({
            TableName: 'WizzCentral_Campaigns',
            Item: {
                campaignId,
                title: campaign.title,
                type: campaign.campaignType || campaign.type,
                discountType: campaign.discountType,
                discountValue: campaign.discountValue,
                startDate: campaign.startDate,
                endDate: campaign.endDate,
                status: campaign.isActive ? 'active' : 'inactive',
                isActive: campaign.isActive,
                usageLimit: campaign.usageLimit || 1000,
                targetRestaurants: campaign.targetRestaurants || []
            }
        });
        
        // Conditions (if any)
        if (campaign.conditions) {
            await putItem({
                TableName: 'WizzCentral_Campaign_Conditions',
                Item: {
                    campaignId,
                    conditions: campaign.conditions,
                    conditionLogic: campaign.conditionLogic || 'AND'
                }
            });
        }
        
        // Usage tracking
        await putItem({
            TableName: 'WizzCentral_Campaign_Usage',
            Item: {
                campaignId,
                usage: campaign.usage || 0,
                usageLimit: campaign.usageLimit || 1000,
                lastUsedAt: campaign.lastUsedAt || null
            }
        });
    }
}
```

### **Phase 2: Backend API Refactoring**

#### **Step 2.1: New Campaign Management APIs**

**✅ REPLACE:** Complex frontend data service with proper backend APIs

**❌ REMOVE:**

- `createCampaign()` in `data-service.js` (frontend)
- Platform discounts table campaign logic
- Frontend condition evaluation

**➕ ADD:**

```javascript
// /backend/lambda/campaign-management.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand, QueryCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

/**
 * POST /campaigns - Create campaign with 3-table structure
 */
exports.createCampaign = async (event) => {
    const campaignData = JSON.parse(event.body);
    const campaignId = `camp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 1. Validate input
    const validation = validateCampaignData(campaignData);
    if (!validation.isValid) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: validation.errors })
        };
    }
    
    // 2. Store in 3 tables
    await Promise.all([
        // Core campaign
        dynamoDB.send(new PutCommand({
            TableName: 'WizzCentral_Campaigns',
            Item: {
                campaignId,
                title: campaignData.title,
                type: campaignData.type,
                discountType: campaignData.discountType,
                discountValue: campaignData.discountValue,
                startDate: campaignData.startDate,
                endDate: campaignData.endDate,
                status: campaignData.autoActivate ? 'active' : 'draft',
                isActive: campaignData.autoActivate || false,
                usageLimit: campaignData.usageLimit || 1000,
                targetRestaurants: campaignData.targetRestaurants || []
            }
        })),
        
        // Conditions
        campaignData.conditions && dynamoDB.send(new PutCommand({
            TableName: 'WizzCentral_Campaign_Conditions',
            Item: {
                campaignId,
                conditions: campaignData.conditions,
                conditionLogic: campaignData.conditionLogic || 'AND'
            }
        })),
        
        // Usage tracking
        dynamoDB.send(new PutCommand({
            TableName: 'WizzCentral_Campaign_Usage',
            Item: {
                campaignId,
                usage: 0,
                usageLimit: campaignData.usageLimit || 1000,
                lastUsedAt: null
            }
        }))
    ]);
    
    return {
        statusCode: 201,
        body: JSON.stringify({ 
            success: true, 
            campaignId,
            message: 'Campaign created successfully' 
        })
    };
};

/**
 * GET /campaigns/active - Optimized active campaign retrieval
 */
exports.getActiveCampaigns = async (event) => {
    const now = new Date().toISOString();
    
    // Use GSI for efficient querying
    const result = await dynamoDB.send(new QueryCommand({
        TableName: 'WizzCentral_Campaigns',
        IndexName: 'ActiveCampaignsIndex',
        KeyConditionExpression: 'isActive = :active',
        FilterExpression: '#status = :status AND startDate <= :now AND endDate >= :now',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: {
            ':active': true,
            ':status': 'active', 
            ':now': now
        }
    }));
    
    // TODO: Add Redis caching here
    
    return {
        statusCode: 200,
        body: JSON.stringify({
            campaigns: result.Items || [],
            count: result.Count
        })
    };
};

/**
 * POST /campaigns/{id}/redeem - Atomic usage tracking
 */
exports.redeemCampaign = async (event) => {
    const { campaignId } = event.pathParameters;
    const { userId, orderTotal } = JSON.parse(event.body);
    
    try {
        // 1. Get campaign and conditions
        const [campaign, conditions] = await Promise.all([
            getCampaign(campaignId),
            getCampaignConditions(campaignId)
        ]);
        
        // 2. Evaluate conditions in backend
        const isEligible = await evaluateConditions(conditions, { userId, orderTotal });
        if (!isEligible) {
            return {
                statusCode: 403,
                body: JSON.stringify({ error: 'User not eligible for campaign' })
            };
        }
        
        // 3. Atomic usage increment with condition
        const result = await dynamoDB.send(new UpdateCommand({
            TableName: 'WizzCentral_Campaign_Usage',
            Key: { campaignId },
            UpdateExpression: 'SET usage = usage + :inc, lastUsedAt = :now',
            ConditionExpression: 'usage < usageLimit',
            ExpressionAttributeValues: {
                ':inc': 1,
                ':now': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        }));
        
        return {
            statusCode: 200,
            body: JSON.stringify({
                success: true,
                usage: result.Attributes.usage,
                usageLimit: result.Attributes.usageLimit
            })
        };
        
    } catch (error) {
        if (error.name === 'ConditionalCheckFailedException') {
            return {
                statusCode: 409,
                body: JSON.stringify({ error: 'Campaign usage limit exceeded' })
            };
        }
        throw error;
    }
};

/**
 * Backend condition evaluation (not in DynamoDB)
 */
async function evaluateConditions(conditions, userData) {
    if (!conditions || conditions.length === 0) return true;
    
    // Get user profile and order history from appropriate services
    const userProfile = await getUserProfile(userData.userId);
    const orderHistory = await getOrderHistory(userData.userId);
    
    return conditions.every(condition => {
        const { field, operator, value } = condition;
        
        let actualValue;
        if (field.startsWith('user.')) {
            actualValue = userProfile[field.replace('user.', '')];
        } else if (field.startsWith('order.')) {
            actualValue = userData[field.replace('order.', '')];
        } else if (field.startsWith('history.')) {
            // Complex history-based conditions
            actualValue = evaluateHistoryCondition(field, orderHistory);
        }
        
        switch (operator) {
            case 'equals': return actualValue === value;
            case 'greaterThan': return Number(actualValue) > Number(value);
            case 'lessThan': return Number(actualValue) < Number(value);
            case 'contains': return String(actualValue).includes(String(value));
            default: return false;
        }
    });
}
```

### **Phase 3: Frontend Simplification**

#### **Step 3.1: Simplify Campaign Form**

**❌ REMOVE:**

- Complex condition engine UI (`condition-config-ui.js`)
- Modal-based condition builder
- Frontend condition evaluation
- Duplicate targeting sections

**✅ REPLACE:**

```html
<!-- Simplified campaign form aligned with 3-table structure -->
<form id="createCampaignForm">
    <!-- Core Campaign Data -->
    <div class="form-section">
        <h3>📊 Campaign Details</h3>
        
        <div class="form-row">
            <div class="form-group">
                <label>Campaign Title *</label>
                <input type="text" id="campaignTitle" required>
            </div>
            <div class="form-group">
                <label>Campaign Type *</label>
                <select id="campaignType" required>
                    <option value="loyalty">🎯 Loyalty Campaign</option>
                    <option value="acquisition">🆕 Customer Acquisition</option>
                    <option value="retention">🔄 Customer Retention</option>
                    <option value="seasonal">🎄 Seasonal Campaign</option>
                    <option value="flash">⚡ Flash Sale</option>
                </select>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Discount Type *</label>
                <select id="discountType" required>
                    <option value="percentage">Percentage Discount</option>
                    <option value="fixed">Fixed Amount Discount</option>
                </select>
            </div>
            <div class="form-group">
                <label>Discount Value *</label>
                <input type="number" id="discountValue" required min="0" step="0.01">
            </div>
        </div>
    </div>
    
    <!-- Target Restaurants (GSI field) -->
    <div class="form-section">
        <h3>🎯 Target Restaurants</h3>
        <select id="targetRestaurants" multiple>
            <!-- Populated from WhizzMerchants_Businesses -->
        </select>
        <small>Hold Ctrl/Cmd to select multiple restaurants</small>
    </div>
    
    <!-- Simplified JSON-Based Conditions -->
    <div class="form-section">
        <h3>📋 Campaign Rules</h3>
        <div id="conditionsBuilder">
            <div class="condition-rule">
                <select class="condition-field">
                    <option value="user.isActive">User Active</option>
                    <option value="user.marketingConsent">Marketing Consent</option>
                    <option value="user.loyaltyTier">Loyalty Tier</option>
                    <option value="order.total">Order Total</option>
                    <option value="history.orderCount">Previous Orders</option>
                </select>
                
                <select class="condition-operator">
                    <option value="equals">Equals</option>
                    <option value="greaterThan">Greater Than</option>
                    <option value="lessThan">Less Than</option>
                    <option value="contains">Contains</option>
                </select>
                
                <input type="text" class="condition-value" placeholder="Value">
                
                <button type="button" class="remove-condition">❌</button>
            </div>
        </div>
        <button type="button" id="addCondition">➕ Add Rule</button>
    </div>
    
    <!-- Campaign Schedule -->
    <div class="form-section">
        <h3>📅 Schedule & Limits</h3>
        <div class="form-row">
            <div class="form-group">
                <label>Start Date *</label>
                <input type="datetime-local" id="startDate" required>
            </div>
            <div class="form-group">
                <label>End Date *</label>
                <input type="datetime-local" id="endDate" required>
            </div>
        </div>
        
        <div class="form-row">
            <div class="form-group">
                <label>Usage Limit *</label>
                <input type="number" id="usageLimit" required min="1" value="1000">
            </div>
            <div class="form-group">
                <label>Auto-Activate</label>
                <input type="checkbox" id="autoActivate" checked>
            </div>
        </div>
    </div>
    
    <div class="form-actions">
        <button type="reset" class="btn-secondary">Clear</button>
        <button type="submit" class="btn-primary">Create Campaign</button>
    </div>
</form>
```

#### **Step 3.2: Simplified Frontend JavaScript**

**❌ REMOVE:**

- Complex `campaign-manager.js` (4000+ lines)
- Condition UI components
- Frontend targeting logic

**✅ REPLACE:**

```javascript
// /frontend/campaign-manager-simple.js
class CampaignManager {
    constructor() {
        this.conditions = [];
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.loadRestaurants();
    }
    
    bindEvents() {
        // Form submission
        document.getElementById('createCampaignForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
        
        // Add condition rule
        document.getElementById('addCondition')?.addEventListener('click', () => {
            this.addConditionRule();
        });
    }
    
    async loadRestaurants() {
        try {
            const response = await fetch('/api/businesses');
            const businesses = await response.json();
            
            const select = document.getElementById('targetRestaurants');
            select.innerHTML = businesses
                .filter(b => b.businessType === 'restaurant')
                .map(r => `<option value="${r.businessId}">${r.businessName}</option>`)
                .join('');
        } catch (error) {
            console.error('Error loading restaurants:', error);
        }
    }
    
    addConditionRule() {
        const builder = document.getElementById('conditionsBuilder');
        const ruleDiv = document.createElement('div');
        ruleDiv.className = 'condition-rule';
        ruleDiv.innerHTML = `
            <select class="condition-field">
                <option value="user.isActive">User Active</option>
                <option value="user.marketingConsent">Marketing Consent</option>
                <option value="order.total">Order Total</option>
                <option value="history.orderCount">Previous Orders</option>
            </select>
            <select class="condition-operator">
                <option value="equals">Equals</option>
                <option value="greaterThan">Greater Than</option>
                <option value="lessThan">Less Than</option>
            </select>
            <input type="text" class="condition-value" placeholder="Value">
            <button type="button" onclick="this.parentElement.remove()">❌</button>
        `;
        builder.appendChild(ruleDiv);
    }
    
    collectConditions() {
        return Array.from(document.querySelectorAll('.condition-rule')).map(rule => ({
            field: rule.querySelector('.condition-field').value,
            operator: rule.querySelector('.condition-operator').value,
            value: rule.querySelector('.condition-value').value
        })).filter(c => c.field && c.operator && c.value);
    }
    
    async handleSubmit() {
        const campaignData = {
            title: document.getElementById('campaignTitle').value,
            type: document.getElementById('campaignType').value,
            discountType: document.getElementById('discountType').value,
            discountValue: parseFloat(document.getElementById('discountValue').value),
            startDate: document.getElementById('startDate').value,
            endDate: document.getElementById('endDate').value,
            usageLimit: parseInt(document.getElementById('usageLimit').value),
            autoActivate: document.getElementById('autoActivate').checked,
            targetRestaurants: Array.from(document.getElementById('targetRestaurants').selectedOptions)
                .map(o => o.value),
            conditions: this.collectConditions(),
            conditionLogic: 'AND'
        };
        
        try {
            const response = await fetch('/api/campaigns', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(campaignData)
            });
            
            const result = await response.json();
            
            if (result.success) {
                alert('Campaign created successfully!');
                document.getElementById('createCampaignForm').reset();
                this.loadCampaigns();
            } else {
                alert('Error: ' + result.error);
            }
        } catch (error) {
            console.error('Error creating campaign:', error);
            alert('Error creating campaign. Please try again.');
        }
    }
    
    async loadCampaigns() {
        // Fetch and display campaigns from new API
        try {
            const response = await fetch('/api/campaigns/active');
            const { campaigns } = await response.json();
            this.renderCampaignsTable(campaigns);
        } catch (error) {
            console.error('Error loading campaigns:', error);
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new CampaignManager();
});
```

### **Phase 4: Performance Optimization**

#### **Step 4.1: Redis Cache Integration**

```javascript
// Cache active campaigns for performance
const redis = require('redis');
const client = redis.createClient();

async function getCachedActiveCampaigns() {
    const cacheKey = 'active_campaigns';
    const cached = await client.get(cacheKey);
    
    if (cached) {
        return JSON.parse(cached);
    }
    
    // Fetch from DynamoDB
    const campaigns = await getActiveCampaignsFromDB();
    
    // Cache for 5 minutes
    await client.setex(cacheKey, 300, JSON.stringify(campaigns));
    
    return campaigns;
}
```

#### **Step 4.2: GSI Optimization**

```javascript
// Optimized queries using GSI
const getActiveRestaurantCampaigns = async (restaurantId) => {
    return await dynamoDB.send(new QueryCommand({
        TableName: 'WizzCentral_Campaigns',
        IndexName: 'RestaurantTargetingIndex',
        KeyConditionExpression: 'targetRestaurants = :restaurantId AND isActive = :active',
        ExpressionAttributeValues: {
            ':restaurantId': restaurantId,
            ':active': true
        }
    }));
};
```

## 📅 **Implementation Timeline**

### **Week 1: Backend Infrastructure**

- [ ] Create new DynamoDB tables with GSIs
- [ ] Implement campaign management Lambda functions
- [ ] Set up API Gateway endpoints
- [ ] Create data migration script

### **Week 2: Frontend Simplification**

- [ ] Remove complex condition engine UI
- [ ] Implement simplified campaign form
- [ ] Create new campaign manager with API integration
- [ ] Update campaign display and management

### **Week 3: Testing & Migration**

- [ ] Test new API endpoints thoroughly
- [ ] Run data migration script
- [ ] Validate campaign creation and redemption flows
- [ ] Performance testing with Redis cache

### **Week 4: Production Deployment**

- [ ] Deploy backend Lambda functions
- [ ] Deploy frontend changes
- [ ] Switch traffic to new system
- [ ] Monitor and optimize performance

## 🎯 **Expected Benefits**

### **Performance Improvements**

- ✅ **10x faster queries** with GSI optimization
- ✅ **Sub-100ms response times** with Redis caching
- ✅ **Atomic operations** prevent race conditions
- ✅ **Horizontal scalability** with proper table design

### **Development Experience**

- ✅ **Simplified frontend** reduces complexity by 80%
- ✅ **Backend condition logic** is more maintainable
- ✅ **Clear separation of concerns** between tables
- ✅ **Easier testing** with simplified components

### **Business Value**

- ✅ **Better campaign performance** tracking
- ✅ **Real-time usage analytics**
- ✅ **Flexible condition engine** for complex targeting
- ✅ **Reliable redemption** without double-spending

## 🚨 **Risk Mitigation**

### **Data Migration Risks**

- **Risk**: Data loss during migration
- **Mitigation**: Run migration in staging first, keep backups, implement rollback plan

### **Downtime Risks**

- **Risk**: Service interruption during deployment
- **Mitigation**: Blue-green deployment, feature flags, gradual traffic migration

### **Performance Risks**

- **Risk**: New system slower than expected
- **Mitigation**: Comprehensive load testing, Redis monitoring, DynamoDB capacity planning

## ✅ **Success Criteria**

1. **Campaign creation time** < 2 seconds
2. **Active campaign queries** < 100ms with caching
3. **Zero data loss** during migration
4. **100% backward compatibility** for existing campaigns
5. **Simplified frontend** reduces code complexity by 75%

---

**This alignment plan transforms the WizzCentral campaign system into a scalable, maintainable, and high-performance architecture that follows industry best practices for campaign management platforms.**
