// WizzCentral Platform - Centralized Data Service
// Professional data access layer for DynamoDB operations

class WizzDataService {
    constructor() {
        this.dynamodbClient = null;
        this.isInitialized = false;
        this.initializationPromise = null;
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
        
        // Table configurations
        this.tables = {
            USERS: 'WizzUser_users_dev',
            BUSINESSES: 'order-receiver-businesses-dev',
            DISCOUNTS: 'order-receiver-discounts-dev',
            ORDERS: 'orders-dev',
            DRIVERS: 'drivers-dev',
            PROMOTIONS: 'promotions-dev',
            SUPPORT_TICKETS: 'support-tickets-dev'
        };
    }

    // Singleton pattern - ensure only one instance
    static getInstance() {
        if (!WizzDataService.instance) {
            WizzDataService.instance = new WizzDataService();
        }
        return WizzDataService.instance;
    }

    // Initialize AWS SDK and DynamoDB client (called once)
    async initialize() {
        if (this.isInitialized) {
            return this.dynamodbClient;
        }

        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this._performInitialization();
        return this.initializationPromise;
    }

    async _performInitialization() {
        try {
            console.log('Initializing WizzDataService...');

            // Check dependencies
            if (typeof AWS === 'undefined') {
                throw new Error('AWS SDK not loaded. Ensure AWS CDN script is included.');
            }

            if (!window.WIZZCENTRAL_CONFIG) {
                throw new Error('App configuration not loaded. Ensure config.js is loaded.');
            }

            const { COGNITO_REGION, COGNITO_IDENTITY_POOL_ID } = window.WIZZCENTRAL_CONFIG;

            // Configure AWS
            AWS.config.update({ 
                region: COGNITO_REGION,
                maxRetries: 3,
                retryDelayOptions: {
                    customBackoff: (retryCount) => Math.pow(2, retryCount) * 100
                }
            });

            // Set up credentials (unauthenticated for now)
            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: COGNITO_IDENTITY_POOL_ID,
            });

            await AWS.config.credentials.refreshPromise();
            
            this.dynamodbClient = new AWS.DynamoDB.DocumentClient({
                convertEmptyValues: true,
                removeUndefinedValues: true
            });

            this.isInitialized = true;
            console.log('WizzDataService initialized successfully');
            
            return this.dynamodbClient;
        } catch (error) {
            console.error('Failed to initialize WizzDataService:', error);
            this.isInitialized = false;
            this.initializationPromise = null;
            throw error;
        }
    }

    // Generic cache management
    _getCacheKey(operation, tableName, params = {}) {
        return `${operation}:${tableName}:${JSON.stringify(params)}`;
    }

    _getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        this.cache.delete(key);
        return null;
    }

    _setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    // Generic DynamoDB operations
    async scan(tableName, params = {}, useCache = true) {
        await this.initialize();
        
        const cacheKey = this._getCacheKey('scan', tableName, params);
        
        if (useCache) {
            const cached = this._getFromCache(cacheKey);
            if (cached) {
                console.log(`Cache hit for scan ${tableName}`);
                return cached;
            }
        }

        try {
            console.log('Executing DynamoDB scan on table:', tableName);
            console.log('Scan params:', { TableName: tableName, ...params });
            
            const result = await this.dynamodbClient.scan({
                TableName: tableName,
                ...params
            }).promise();

            console.log('DynamoDB scan successful:', result);
            console.log('Items returned:', result.Items ? result.Items.length : 0);

            if (useCache) {
                this._setCache(cacheKey, result);
            }

            return result;
        } catch (error) {
            console.error(`Error scanning ${tableName}:`, error);
            console.error('Error details:', error.code, error.message);
            throw error;
        }
    }

    async query(tableName, params = {}, useCache = true) {
        await this.initialize();
        
        const cacheKey = this._getCacheKey('query', tableName, params);
        
        if (useCache) {
            const cached = this._getFromCache(cacheKey);
            if (cached) {
                console.log(`Cache hit for query ${tableName}`);
                return cached;
            }
        }

        try {
            const result = await this.dynamodbClient.query({
                TableName: tableName,
                ...params
            }).promise();

            if (useCache) {
                this._setCache(cacheKey, result);
            }

            return result;
        } catch (error) {
            console.error(`Error querying ${tableName}:`, error);
            throw error;
        }
    }

    async get(tableName, key) {
        await this.initialize();

        try {
            const result = await this.dynamodbClient.get({
                TableName: tableName,
                Key: key
            }).promise();

            return result;
        } catch (error) {
            console.error(`Error getting item from ${tableName}:`, error);
            throw error;
        }
    }

    async put(tableName, item) {
        await this.initialize();
        
        // Clear cache for this table
        this.clearTableCache(tableName);

        try {
            const result = await this.dynamodbClient.put({
                TableName: tableName,
                Item: item
            }).promise();

            return result;
        } catch (error) {
            console.error(`Error putting item to ${tableName}:`, error);
            throw error;
        }
    }

    async update(tableName, key, updateExpression, expressionAttributeValues, expressionAttributeNames = {}) {
        await this.initialize();
        
        // Clear cache for this table
        this.clearTableCache(tableName);

        try {
            const params = {
                TableName: tableName,
                Key: key,
                UpdateExpression: updateExpression,
                ExpressionAttributeValues: expressionAttributeValues,
                ReturnValues: 'ALL_NEW'
            };

            if (Object.keys(expressionAttributeNames).length > 0) {
                params.ExpressionAttributeNames = expressionAttributeNames;
            }

            const result = await this.dynamodbClient.update(params).promise();
            return result;
        } catch (error) {
            console.error(`Error updating item in ${tableName}:`, error);
            throw error;
        }
    }

    async delete(tableName, key) {
        await this.initialize();
        
        // Clear cache for this table
        this.clearTableCache(tableName);

        try {
            const result = await this.dynamodbClient.delete({
                TableName: tableName,
                Key: key
            }).promise();

            return result;
        } catch (error) {
            console.error(`Error deleting item from ${tableName}:`, error);
            throw error;
        }
    }

    // Specialized methods for common operations
    async getUsers(useCache = true) {
        console.log('DataService.getUsers called');
        try {
            console.log('Scanning table:', this.tables.USERS);
            const result = await this.scan(this.tables.USERS, {}, useCache);
            console.log('Scan result:', result);
            console.log('Items found:', result.Items ? result.Items.length : 0);
            
            if (result.Items && result.Items.length > 0) {
                console.log('First item:', result.Items[0]);
            }
            
            const mappedUsers = (result.Items || []).map(this._mapUserItem);
            console.log('Mapped users:', mappedUsers);
            return mappedUsers;
        } catch (error) {
            console.error('Error in getUsers:', error);
            throw error;
        }
    }

    async getBusinesses(useCache = true) {
        const result = await this.scan(this.tables.BUSINESSES, {}, useCache);
        return (result.Items || []).map(this._mapBusinessItem);
    }

    async getRecentBusinesses(limit = 5) {
        const result = await this.scan(this.tables.BUSINESSES);
        const items = result.Items || [];
        
        // Sort by creation date descending and take the most recent
        return items
            .sort((a, b) => new Date(b.createdAt || b.registrationDate) - new Date(a.createdAt || a.registrationDate))
            .slice(0, limit)
            .map(this._mapBusinessItem);
    }

    async updateUserStatus(userId, isActive) {
        return this.update(
            this.tables.USERS,
            { userId },
            'SET isActive = :status',
            { ':status': isActive }
        );
    }

    // Data mapping functions
    _mapUserItem(item) {
        console.log('Mapping user item:', item);
        
        return {
            id: item.userId,
            name: item.name || 'N/A',
            email: item.email || 'N/A', 
            phone: item.phone || 'N/A',
            status: item.isActive ? 'active' : 'inactive',
            totalOrders: 0, // We don't have this data in the users table
            totalSpent: 0, // We don't have this data in the users table
            lastOrder: item.lastLoginAt || item.createdAt || 'Never',
            segment: this._determineSegment(item),
            avatar: `https://i.pravatar.cc/40?u=${item.userId}`,
            joinDate: item.createdAt,
            addresses: item.addresses || [],
            isActive: !!item.isActive,
            gender: item.gender,
            countryCode: item.countryCode,
            preferredLanguage: item.preferredLanguage || 'en',
            cognitoUsername: item.cognitoUsername,
            marketingConsent: item.marketingConsent,
            privacyAccepted: item.privacyAccepted,
            termsAccepted: item.termsAccepted,
            updatedAt: item.updatedAt
        };
    }

    _determineSegment(user) {
        // Since we don't have order data, determine segment based on available info
        if (user.name && user.email) {
            return 'regular';
        } else if (user.phone && !user.email) {
            return 'new';
        } else {
            return 'new';
        }
    }

    _mapBusinessItem(item) {
        return {
            id: item.businessId || item.id,
            name: item.businessName || item.name || 'Unnamed Business',
            email: item.email || 'N/A',
            phone: item.phone || 'N/A',
            category: item.category || 'General',
            status: item.status || 'pending',
            owner: item.owner || item.ownerName || 'N/A',
            address: item.address || 'N/A',
            joinDate: item.createdAt || item.registrationDate,
            avatar: item.avatar || item.logoUrl,
            revenue: item.totalRevenue || 0,
            orders: item.totalOrders || 0,
            rating: item.averageRating || 0
        };
    }

    // Merchant Discounts methods
    async getMerchantDiscounts(useCache = true) {
        const result = await this.scan(this.tables.DISCOUNTS, {}, useCache);
        return (result.Items || []).map(this._mapDiscountItem);
    }

    async getActiveDiscounts(useCache = true) {
        const allDiscounts = await this.getMerchantDiscounts(useCache);
        return allDiscounts.filter(discount => discount.status === 'active');
    }

    async getDiscountsByBusiness(businessId, useCache = true) {
        const allDiscounts = await this.getMerchantDiscounts(useCache);
        return allDiscounts.filter(discount => discount.businessId === businessId);
    }

    _mapDiscountItem(item) {
        return {
            id: item.discountId || item.id,
            businessId: item.businessId,
            title: item.title || 'Unnamed Discount',
            description: item.description || '',
            type: item.type || 'percentage', // percentage, fixed, etc.
            value: item.value || 0,
            status: item.status || 'active',
            applicability: item.applicability || 'all', // all, specificItems, category
            minimumOrderAmount: item.minimum_order_amount || 0,
            usageCount: item.usage_count || 0,
            usageLimit: item.usage_limit || null,
            validFrom: item.valid_from,
            validTo: item.valid_to,
            createdAt: item.created_at,
            updatedAt: item.updated_at,
            conditionalRule: item.conditional_rule,
            conditionalParameters: item.conditional_parameters || {},
            applicableItemIds: item.applicable_item_ids || [],
            applicableCategoryIds: item.applicable_category_ids || []
        };
    }

    // Cache management
    clearCache() {
        this.cache.clear();
        console.log('Data service cache cleared');
    }

    clearTableCache(tableName) {
        const keysToDelete = [];
        for (const [key] of this.cache) {
            if (key.includes(tableName)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
        console.log(`Cache cleared for table: ${tableName}`);
    }

    // Statistics helpers
    async getTableStats(tableName) {
        const result = await this.scan(tableName, { Select: 'COUNT' }, false);
        return result.Count || 0;
    }

    async getAllStats() {
        try {
            const [usersCount, businessesCount] = await Promise.all([
                this.getTableStats(this.tables.USERS),
                this.getTableStats(this.tables.BUSINESSES)
            ]);

            return {
                users: usersCount,
                businesses: businessesCount,
                lastUpdated: new Date().toISOString()
            };
        } catch (error) {
            console.error('Error getting statistics:', error);
            return {
                users: 0,
                businesses: 0,
                lastUpdated: new Date().toISOString()
            };
        }
    }

    // Health check
    async healthCheck() {
        try {
            await this.initialize();
            // Test a simple operation
            await this.getTableStats(this.tables.USERS);
            return { status: 'healthy', timestamp: new Date().toISOString() };
        } catch (error) {
            return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
        }
    }
}

// Export singleton instance
window.dataService = WizzDataService.getInstance();

// Export for modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WizzDataService;
}

console.log('WizzDataService loaded');
