const database = require('../utils/database');
const responseHelper = require('../utils/response');

const MERCHANTS_TABLE = process.env.MERCHANTS_TABLE;
const DRIVERS_TABLE = process.env.DRIVERS_TABLE;
const CUSTOMERS_TABLE = process.env.CUSTOMERS_TABLE;
const ORDERS_TABLE = process.env.ORDERS_TABLE;
const SUPPORT_TICKETS_TABLE = process.env.SUPPORT_TICKETS_TABLE;

// Get dashboard statistics
exports.getDashboardStats = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    // Get current date info
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Fetch data from all tables concurrently
    const [merchants, drivers, customers, orders, supportTickets] = await Promise.all([
      database.scan(MERCHANTS_TABLE).catch(() => []),
      database.scan(DRIVERS_TABLE).catch(() => []),
      database.scan(CUSTOMERS_TABLE).catch(() => []),
      database.scan(ORDERS_TABLE).catch(() => []),
      database.scan(SUPPORT_TICKETS_TABLE).catch(() => [])
    ]);

    // Calculate merchant statistics
    const merchantStats = {
      total: merchants.length,
      verified: merchants.filter(m => m.status === 'verified').length,
      pending: merchants.filter(m => m.status === 'pending').length,
      suspended: merchants.filter(m => m.status === 'suspended').length,
      underReview: merchants.filter(m => m.status === 'under-review').length
    };

    // Calculate driver statistics
    const driverStats = {
      total: drivers.length,
      online: drivers.filter(d => d.status === 'online').length,
      offline: drivers.filter(d => d.status === 'offline').length,
      delivering: drivers.filter(d => d.status === 'delivering').length,
      suspended: drivers.filter(d => d.status === 'suspended').length
    };

    // Calculate customer statistics
    const customerStats = {
      total: customers.length,
      vip: customers.filter(c => (c.totalSpent || 0) > 500).length,
      regular: customers.filter(c => {
        const spent = c.totalSpent || 0;
        return spent >= 100 && spent <= 500;
      }).length,
      new: customers.filter(c => (c.totalOrders || 0) <= 3).length
    };

    // Calculate order statistics
    const todayOrders = orders.filter(o => o.createdAt?.startsWith(today));
    const thisMonthOrders = orders.filter(o => o.createdAt?.startsWith(thisMonth));
    
    const orderStats = {
      total: orders.length,
      today: todayOrders.length,
      thisMonth: thisMonthOrders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    };

    // Calculate revenue statistics
    const todayRevenue = todayOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const thisMonthRevenue = thisMonthOrders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

    const revenueStats = {
      total: totalRevenue,
      today: todayRevenue,
      thisMonth: thisMonthRevenue,
      averageOrderValue: orders.length > 0 ? totalRevenue / orders.length : 0
    };

    // Calculate support statistics
    const supportStats = {
      total: supportTickets.length,
      open: supportTickets.filter(t => t.status === 'open').length,
      inProgress: supportTickets.filter(t => t.status === 'in_progress').length,
      resolved: supportTickets.filter(t => t.status === 'resolved').length,
      closed: supportTickets.filter(t => t.status === 'closed').length,
      high: supportTickets.filter(t => t.priority === 'high').length,
      urgent: supportTickets.filter(t => t.priority === 'urgent').length
    };

    // Generate recent activities (mock data for demo)
    const recentActivities = [
      {
        id: '1',
        type: 'order',
        message: 'New order received from Pizza Palace',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
        priority: 'medium'
      },
      {
        id: '2',
        type: 'merchant',
        message: 'Merchant "Burger Hub" status changed to verified',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 minutes ago
        priority: 'low'
      },
      {
        id: '3',
        type: 'driver',
        message: 'Driver John Doe went online',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
        priority: 'low'
      },
      {
        id: '4',
        type: 'support',
        message: 'High priority support ticket created',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 minutes ago
        priority: 'high'
      }
    ];

    // Calculate weekly trends (mock data for demo)
    const weeklyTrends = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
      return {
        date: date.toISOString().split('T')[0],
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()],
        orders: Math.floor(Math.random() * 100) + 20,
        revenue: Math.floor(Math.random() * 5000) + 1000,
        customers: Math.floor(Math.random() * 50) + 10
      };
    });

    // Top performing merchants (based on mock data)
    const topMerchants = merchants
      .filter(m => m.status === 'verified')
      .map(m => ({
        id: m.id,
        name: m.name,
        category: m.category,
        rating: m.rating || 4.5,
        totalOrders: Math.floor(Math.random() * 500) + 50,
        revenue: Math.floor(Math.random() * 10000) + 2000
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const dashboardData = {
      overview: {
        merchants: merchantStats,
        drivers: driverStats,
        customers: customerStats,
        orders: orderStats,
        revenue: revenueStats,
        support: supportStats
      },
      recentActivities,
      weeklyTrends,
      topMerchants,
      generatedAt: now.toISOString()
    };

    return responseHelper.success(dashboardData);

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    return responseHelper.serverError('Failed to get dashboard statistics');
  }
};

// Get merchant analytics
exports.getMerchantAnalytics = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const { period = '30d' } = event.queryStringParameters || {};

    // Get merchants
    const merchants = await database.scan(MERCHANTS_TABLE);

    // Calculate analytics based on period
    const analytics = {
      totalMerchants: merchants.length,
      verifiedMerchants: merchants.filter(m => m.status === 'verified').length,
      pendingApplications: merchants.filter(m => m.status === 'pending').length,
      averageRating: merchants.reduce((sum, m) => sum + (m.rating || 0), 0) / merchants.length,
      categoryDistribution: {},
      statusDistribution: {},
      newMerchantsThisMonth: 0,
      topPerformers: []
    };

    // Calculate category distribution
    merchants.forEach(merchant => {
      analytics.categoryDistribution[merchant.category] = 
        (analytics.categoryDistribution[merchant.category] || 0) + 1;
    });

    // Calculate status distribution
    merchants.forEach(merchant => {
      analytics.statusDistribution[merchant.status] = 
        (analytics.statusDistribution[merchant.status] || 0) + 1;
    });

    // Calculate new merchants this month
    const thisMonth = new Date().toISOString().substring(0, 7);
    analytics.newMerchantsThisMonth = merchants.filter(m => 
      m.createdAt && m.createdAt.startsWith(thisMonth)
    ).length;

    return responseHelper.success({
      analytics,
      period
    });

  } catch (error) {
    console.error('Get merchant analytics error:', error);
    return responseHelper.serverError('Failed to get merchant analytics');
  }
};

// Get driver analytics
exports.getDriverAnalytics = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const { period = '30d' } = event.queryStringParameters || {};

    // Get drivers
    const drivers = await database.scan(DRIVERS_TABLE);

    const analytics = {
      totalDrivers: drivers.length,
      onlineDrivers: drivers.filter(d => d.status === 'online').length,
      deliveringDrivers: drivers.filter(d => d.status === 'delivering').length,
      averageRating: drivers.reduce((sum, d) => sum + (d.rating || 0), 0) / drivers.length,
      vehicleTypeDistribution: {},
      statusDistribution: {},
      newDriversThisMonth: 0,
      topPerformers: []
    };

    // Calculate vehicle type distribution
    drivers.forEach(driver => {
      analytics.vehicleTypeDistribution[driver.vehicleType] = 
        (analytics.vehicleTypeDistribution[driver.vehicleType] || 0) + 1;
    });

    // Calculate status distribution
    drivers.forEach(driver => {
      analytics.statusDistribution[driver.status] = 
        (analytics.statusDistribution[driver.status] || 0) + 1;
    });

    // Calculate new drivers this month
    const thisMonth = new Date().toISOString().substring(0, 7);
    analytics.newDriversThisMonth = drivers.filter(d => 
      d.createdAt && d.createdAt.startsWith(thisMonth)
    ).length;

    return responseHelper.success({
      analytics,
      period
    });

  } catch (error) {
    console.error('Get driver analytics error:', error);
    return responseHelper.serverError('Failed to get driver analytics');
  }
};

// Get customer analytics
exports.getCustomerAnalytics = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const { period = '30d' } = event.queryStringParameters || {};

    // Get customers
    const customers = await database.scan(CUSTOMERS_TABLE);

    const analytics = {
      totalCustomers: customers.length,
      vipCustomers: customers.filter(c => (c.totalSpent || 0) > 500).length,
      newCustomers: customers.filter(c => (c.totalOrders || 0) <= 3).length,
      totalLifetimeValue: customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
      averageOrderValue: 0,
      customerSegmentation: {
        vip: customers.filter(c => (c.totalSpent || 0) > 500).length,
        regular: customers.filter(c => {
          const spent = c.totalSpent || 0;
          return spent >= 100 && spent <= 500;
        }).length,
        new: customers.filter(c => (c.totalOrders || 0) <= 3).length
      },
      newCustomersThisMonth: 0,
      retentionRate: 85.5 // Mock data
    };

    // Calculate new customers this month
    const thisMonth = new Date().toISOString().substring(0, 7);
    analytics.newCustomersThisMonth = customers.filter(c => 
      c.createdAt && c.createdAt.startsWith(thisMonth)
    ).length;

    return responseHelper.success({
      analytics,
      period
    });

  } catch (error) {
    console.error('Get customer analytics error:', error);
    return responseHelper.serverError('Failed to get customer analytics');
  }
};
