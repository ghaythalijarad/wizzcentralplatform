// Lightweight Data Service wrapper around AWSUtils with safe fallbacks.
// Provides a consistent API used by dashboard and promotions pages without forcing redirects.

(function () {
    console.log('Loading data-service.js...');

    const TABLES = {
        businesses: 'WhizzMerchants_Businesses',
        discounts: 'WhizzMerchants_Discounts',
        drivers: 'WhizzDrivers_dev',
        orders: 'WizzUser_transactions_dev', // Using transactions as proxy for orders
        customers: 'WizzUser_users_dev',
        supportTickets: 'wizzcentral-backend-support-tickets-dev' // Using the proper support tickets table
    };

    async function getClientSafe() {
        try {
            if (!window.AWSUtils) throw new Error('AWSUtils missing');
            await AWSUtils.initialize();
            const client = await AWSUtils.getDynamoDBClient();
            if (!client) throw new Error('DynamoDB client unavailable');
            return client;
        } catch (e) {
            console.warn('data-service getClientSafe():', e?.message || e);
            return null;
        }
    }

    async function scan(tableName, params = {}) {
        const client = await getClientSafe();
        if (!client) {
            return { Items: [], Count: 0 };
        }
        const req = {
            TableName: tableName,
            ...params,
        };
        try {
            const res = await client.scan(req).promise();
            return res || { Items: [], Count: 0 };
        } catch (e) {
            console.error('data-service scan error:', e);
            return { Items: [], Count: 0 };
        }
    }

    async function getRecentBusinesses(limit = 5) {
        // Try DynamoDB; if unavailable, return demo data instead of failing
        const res = await scan(TABLES.businesses, { Limit: 50 });
        let items = Array.isArray(res.Items) ? res.Items : [];

        // Normalize and sort by joinDate desc when available
        items = items.map(b => ({
            name: b.name || b.businessName || 'Business',
            joinDate: b.joinDate || b.createdAt || b.updatedAt || null,
        }));

        items.sort((a, b) => new Date(b.joinDate || 0) - new Date(a.joinDate || 0));

        if (items.length === 0) {
            // Fallback demo data
            const now = Date.now();
            items = [1, 2, 3, 4, 5].map(i => ({
                name: `Demo Business ${i}`,
                joinDate: new Date(now - i * 86400000).toISOString()
            }));
        }

        return items.slice(0, limit);
    }

    async function getMerchantDiscounts(forceFresh = false) {
        const res = await scan(TABLES.discounts, { Limit: 100 });
        const items = Array.isArray(res.Items) ? res.Items : [];
        return items;
    }

    async function getBusinesses(forceFresh = false) {
        const res = await scan(TABLES.businesses, { Limit: 100 });
        const items = Array.isArray(res.Items) ? res.Items : [];
        return items;
    }

    // Added: Fetch drivers from DynamoDB (WhizzDrivers_dev)
    async function getDrivers(limit = 100) {
        const res = await scan(TABLES.drivers, { Limit: limit });
        const items = Array.isArray(res.Items) ? res.Items : [];
        return items;
    }

    async function getOrders(limit = 100) {
        const res = await scan(TABLES.orders, { Limit: limit });
        const items = Array.isArray(res.Items) ? res.Items : [];
        return items;
    }

    async function getCustomers(limit = 100) {
        const res = await scan(TABLES.customers, { Limit: limit });
        const items = Array.isArray(res.Items) ? res.Items : [];
        return items;
    }

    async function getSupportTickets(limit = 100) {
        const res = await scan(TABLES.supportTickets, { Limit: limit });
        const items = Array.isArray(res.Items) ? res.Items : [];
        return items;
    }

    async function putItem(tableName, item) {
        const client = await getClientSafe();
        if (!client) {
            console.warn('DynamoDB client unavailable, cannot save item');
            return false;
        }
        const params = {
            TableName: tableName,
            Item: item
        };
        try {
            await client.putItem(params).promise();
            return true;
        } catch (e) {
            console.error('data-service putItem error:', e);
            return false;
        }
    }

    async function createSupportTicket(ticketData) {
        // Generate a unique ticket ID
        const ticketId = 'TKT-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        
        const item = {
            ticketId: { S: ticketId },
            customerEmail: { S: ticketData.customerEmail || '' },
            customerName: { S: ticketData.customerName || 'Unknown Customer' },
            subject: { S: ticketData.subject || '' },
            description: { S: ticketData.description || '' },
            category: { S: ticketData.category || 'general' },
            priority: { S: ticketData.priority || 'medium' },
            status: { S: ticketData.status || 'open' },
            assignedTo: { S: ticketData.assignedTo || 'Unassigned' },
            createdAt: { S: new Date().toISOString() },
            updatedAt: { S: new Date().toISOString() }
        };

        const success = await putItem(TABLES.supportTickets, item);
        if (success) {
            console.log('✅ Support ticket created successfully:', ticketId);
            return {
                id: ticketId,
                ticketId: ticketId,
                customerEmail: ticketData.customerEmail,
                customerName: ticketData.customerName,
                subject: ticketData.subject,
                description: ticketData.description,
                category: ticketData.category,
                priority: ticketData.priority,
                status: ticketData.status || 'open',
                assignedTo: ticketData.assignedTo || 'Unassigned',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
        } else {
            console.error('❌ Failed to create support ticket');
            return null;
        }
    }

    window.dataService = {
        initialize: async () => {
            // Do not redirect here; rely on AWSUtils behavior
            await getClientSafe();
            return true;
        },
        scan,
        getRecentBusinesses,
        getMerchantDiscounts,
        getBusinesses,
        getDrivers,
        getOrders,
        getCustomers,
        getSupportTickets,
        createSupportTicket,
    };

    console.log('data-service.js ready');
})();
