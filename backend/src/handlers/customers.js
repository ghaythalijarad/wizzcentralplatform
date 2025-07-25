const database = require('../utils/database');
const responseHelper = require('../utils/response');
const { customerSchemas, validate } = require('../utils/validation');

const CUSTOMERS_TABLE = process.env.CUSTOMERS_TABLE;
const ORDERS_TABLE = process.env.ORDERS_TABLE;

// Get all customers
exports.getCustomers = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    // Get query parameters for filtering
    const {
      segment,
      search,
      limit = 50,
      lastKey
    } = event.queryStringParameters || {};

    let filters = {};

    // Get customers from database
    let customers = await database.scan(CUSTOMERS_TABLE, filters);

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      customers = customers.filter(customer =>
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.id.toLowerCase().includes(searchLower)
      );
    }

    // Apply segment filter if provided
    if (segment) {
      customers = customers.filter(customer => {
        const totalSpent = customer.totalSpent || 0;
        const totalOrders = customer.totalOrders || 0;
        
        switch (segment) {
          case 'vip':
            return totalSpent > 500 || totalOrders > 20;
          case 'regular':
            return totalSpent >= 100 && totalSpent <= 500;
          case 'new':
            return totalOrders <= 3;
          default:
            return true;
        }
      });
    }

    // Sort by creation date (newest first)
    customers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination if needed
    let paginatedCustomers = customers;
    if (limit) {
      const limitNum = parseInt(limit);
      paginatedCustomers = customers.slice(0, limitNum);
    }

    // Calculate statistics
    const stats = {
      total: customers.length,
      vip: customers.filter(c => (c.totalSpent || 0) > 500 || (c.totalOrders || 0) > 20).length,
      regular: customers.filter(c => {
        const spent = c.totalSpent || 0;
        return spent >= 100 && spent <= 500;
      }).length,
      new: customers.filter(c => (c.totalOrders || 0) <= 3).length,
      totalRevenue: customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0)
    };

    return responseHelper.success({
      customers: paginatedCustomers,
      stats,
      hasMore: customers.length > (limit ? parseInt(limit) : 50)
    });

  } catch (error) {
    console.error('Get customers error:', error);
    return responseHelper.serverError('Failed to get customers');
  }
};

// Get single customer
exports.getCustomer = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const { id } = event.pathParameters;

    if (!id) {
      return responseHelper.validation([
        { field: 'id', message: 'Customer ID is required' }
      ]);
    }

    // Get customer from database
    const customer = await database.getById(CUSTOMERS_TABLE, id);

    if (!customer) {
      return responseHelper.notFound('Customer not found');
    }

    // Get customer's order history (in a real app, this would be optimized)
    try {
      const orders = await database.query(
        ORDERS_TABLE,
        'CustomerIndex',
        {
          expression: 'customerId = :customerId',
          values: { ':customerId': id }
        }
      );

      customer.orderHistory = orders.slice(0, 10); // Last 10 orders
      customer.totalOrders = orders.length;
      customer.totalSpent = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    } catch (orderError) {
      console.error('Error fetching customer orders:', orderError);
      customer.orderHistory = [];
      customer.totalOrders = 0;
      customer.totalSpent = 0;
    }

    return responseHelper.success({
      customer
    });

  } catch (error) {
    console.error('Get customer error:', error);
    return responseHelper.serverError('Failed to get customer');
  }
};

// Update customer
exports.updateCustomer = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const { id } = event.pathParameters;
    const body = JSON.parse(event.body);

    if (!id) {
      return responseHelper.validation([
        { field: 'id', message: 'Customer ID is required' }
      ]);
    }

    // Validate input
    const validator = validate(customerSchemas.update);
    const validation = validator(body);

    if (!validation.isValid) {
      return responseHelper.validation(validation.errors);
    }

    const updates = validation.data;

    // Check if customer exists
    const existingCustomer = await database.getById(CUSTOMERS_TABLE, id);
    if (!existingCustomer) {
      return responseHelper.notFound('Customer not found');
    }

    // Update customer
    const updatedCustomer = await database.update(CUSTOMERS_TABLE, id, updates);

    return responseHelper.success({
      customer: updatedCustomer,
      message: 'Customer updated successfully'
    });

  } catch (error) {
    console.error('Update customer error:', error);
    return responseHelper.serverError('Failed to update customer');
  }
};

// Get customer analytics
exports.getCustomerAnalytics = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const { id } = event.pathParameters;

    if (!id) {
      return responseHelper.validation([
        { field: 'id', message: 'Customer ID is required' }
      ]);
    }

    // Check if customer exists
    const customer = await database.getById(CUSTOMERS_TABLE, id);
    if (!customer) {
      return responseHelper.notFound('Customer not found');
    }

    // In a real implementation, you would calculate these from orders
    const analytics = {
      totalOrders: customer.totalOrders || 0,
      totalSpent: customer.totalSpent || 0,
      averageOrderValue: customer.totalOrders > 0 ? (customer.totalSpent / customer.totalOrders) : 0,
      favoriteRestaurants: [
        { name: 'Pizza Palace', orders: 8, spent: 240 },
        { name: 'Burger Hub', orders: 5, spent: 125 },
        { name: 'Sushi Express', orders: 3, spent: 90 }
      ],
      orderFrequency: 'Weekly', // Based on order patterns
      preferredCuisines: ['Italian', 'American', 'Asian'],
      orderTrends: Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        orders: Math.floor(Math.random() * 10),
        spent: Math.floor(Math.random() * 300)
      })),
      deliveryAddresses: customer.addresses || [],
      paymentMethods: customer.paymentMethods || []
    };

    return responseHelper.success({
      analytics
    });

  } catch (error) {
    console.error('Get customer analytics error:', error);
    return responseHelper.serverError('Failed to get customer analytics');
  }
};

// Export customer data (GDPR compliance)
exports.exportCustomerData = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const { id } = event.pathParameters;

    if (!id) {
      return responseHelper.validation([
        { field: 'id', message: 'Customer ID is required' }
      ]);
    }

    // Get customer data
    const customer = await database.getById(CUSTOMERS_TABLE, id);
    if (!customer) {
      return responseHelper.notFound('Customer not found');
    }

    // Get all customer orders
    let orders = [];
    try {
      orders = await database.query(
        ORDERS_TABLE,
        'CustomerIndex',
        {
          expression: 'customerId = :customerId',
          values: { ':customerId': id }
        }
      );
    } catch (orderError) {
      console.error('Error fetching customer orders for export:', orderError);
    }

    // Compile all customer data
    const exportData = {
      personalInformation: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        addresses: customer.addresses || [],
        preferences: customer.preferences || {}
      },
      orderHistory: orders,
      accountInformation: {
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt,
        totalOrders: orders.length,
        totalSpent: orders.reduce((sum, order) => sum + (order.total || 0), 0),
        loyaltyPoints: customer.loyaltyPoints || 0
      },
      exportedAt: new Date().toISOString()
    };

    return responseHelper.success({
      exportData,
      message: 'Customer data exported successfully'
    });

  } catch (error) {
    console.error('Export customer data error:', error);
    return responseHelper.serverError('Failed to export customer data');
  }
};
