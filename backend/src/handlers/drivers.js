const { v4: uuidv4 } = require('uuid');
const database = require('../utils/database');
const responseHelper = require('../utils/response');
const { driverSchemas, validate } = require('../utils/validation');

const DRIVERS_TABLE = process.env.DRIVERS_TABLE;

// Get all drivers
exports.getDrivers = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    // Get query parameters for filtering
    const {
      status,
      vehicleType,
      search,
      limit = 50,
      lastKey
    } = event.queryStringParameters || {};

    let filters = {};
    if (status) filters.status = status;
    if (vehicleType) filters.vehicleType = vehicleType;

    // Get drivers from database
    let drivers = await database.scan(DRIVERS_TABLE, filters);

    // Apply search filter if provided
    if (search) {
      const searchLower = search.toLowerCase();
      drivers = drivers.filter(driver =>
        driver.name.toLowerCase().includes(searchLower) ||
        driver.email.toLowerCase().includes(searchLower) ||
        driver.id.toLowerCase().includes(searchLower) ||
        driver.vehiclePlate.toLowerCase().includes(searchLower)
      );
    }

    // Sort by creation date (newest first)
    drivers.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination if needed
    let paginatedDrivers = drivers;
    if (limit) {
      const limitNum = parseInt(limit);
      paginatedDrivers = drivers.slice(0, limitNum);
    }

    // Calculate statistics
    const stats = {
      total: drivers.length,
      online: drivers.filter(d => d.status === 'online').length,
      offline: drivers.filter(d => d.status === 'offline').length,
      delivering: drivers.filter(d => d.status === 'delivering').length,
      suspended: drivers.filter(d => d.status === 'suspended').length
    };

    return responseHelper.success({
      drivers: paginatedDrivers,
      stats,
      hasMore: drivers.length > (limit ? parseInt(limit) : 50)
    });

  } catch (error) {
    console.error('Get drivers error:', error);
    return responseHelper.serverError('Failed to get drivers');
  }
};

// Get single driver
exports.getDriver = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const { id } = event.pathParameters;

    if (!id) {
      return responseHelper.validation([
        { field: 'id', message: 'Driver ID is required' }
      ]);
    }

    // Get driver from database
    const driver = await database.getById(DRIVERS_TABLE, id);

    if (!driver) {
      return responseHelper.notFound('Driver not found');
    }

    return responseHelper.success({
      driver
    });

  } catch (error) {
    console.error('Get driver error:', error);
    return responseHelper.serverError('Failed to get driver');
  }
};

// Create new driver
exports.createDriver = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    // Get user context from authorizer
    const userContext = JSON.parse(event.requestContext.authorizer.stringKey);

    const body = JSON.parse(event.body);

    // Validate input
    const validator = validate(driverSchemas.create);
    const validation = validator(body);

    if (!validation.isValid) {
      return responseHelper.validation(validation.errors);
    }

    const driverData = validation.data;

    // Check if driver with this email already exists
    const existingDriver = await database.findByEmail(DRIVERS_TABLE, driverData.email);
    if (existingDriver) {
      return responseHelper.conflict('Driver with this email already exists');
    }

    // Create driver
    const driverId = uuidv4();
    const driver = {
      id: driverId,
      ...driverData,
      status: 'offline', // New drivers start offline
      rating: 5.0, // Start with perfect rating
      totalDeliveries: 0,
      totalEarnings: 0,
      completionRate: 0,
      currentLocation: null,
      documents: {
        driverLicense: null,
        vehicleRegistration: null,
        insurance: null,
        photo: null
      },
      verificationStatus: 'pending',
      lastSeen: null,
      createdBy: userContext.userId
    };

    const createdDriver = await database.create(DRIVERS_TABLE, driver);

    return responseHelper.success({
      driver: createdDriver,
      message: 'Driver created successfully'
    }, 201);

  } catch (error) {
    console.error('Create driver error:', error);
    return responseHelper.serverError('Failed to create driver');
  }
};

// Update driver
exports.updateDriver = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const { id } = event.pathParameters;
    const body = JSON.parse(event.body);

    if (!id) {
      return responseHelper.validation([
        { field: 'id', message: 'Driver ID is required' }
      ]);
    }

    // Validate input
    const validator = validate(driverSchemas.update);
    const validation = validator(body);

    if (!validation.isValid) {
      return responseHelper.validation(validation.errors);
    }

    const updates = validation.data;

    // Check if driver exists
    const existingDriver = await database.getById(DRIVERS_TABLE, id);
    if (!existingDriver) {
      return responseHelper.notFound('Driver not found');
    }

    // If email is being updated, check if new email already exists
    if (updates.email && updates.email !== existingDriver.email) {
      const emailExists = await database.findByEmail(DRIVERS_TABLE, updates.email);
      if (emailExists) {
        return responseHelper.conflict('Email already in use by another driver');
      }
    }

    // Update driver
    const updatedDriver = await database.update(DRIVERS_TABLE, id, updates);

    return responseHelper.success({
      driver: updatedDriver,
      message: 'Driver updated successfully'
    });

  } catch (error) {
    console.error('Update driver error:', error);
    return responseHelper.serverError('Failed to update driver');
  }
};

// Update driver status
exports.updateDriverStatus = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const { id } = event.pathParameters;
    const body = JSON.parse(event.body);
    const { status, location } = body;

    if (!id) {
      return responseHelper.validation([
        { field: 'id', message: 'Driver ID is required' }
      ]);
    }

    if (!status || !['online', 'offline', 'delivering', 'suspended'].includes(status)) {
      return responseHelper.validation([
        { field: 'status', message: 'Valid status is required (online, offline, delivering, suspended)' }
      ]);
    }

    // Check if driver exists
    const driver = await database.getById(DRIVERS_TABLE, id);
    if (!driver) {
      return responseHelper.notFound('Driver not found');
    }

    // Prepare update data
    const updateData = {
      status,
      lastSeen: new Date().toISOString()
    };

    // Update location if provided (for online/delivering status)
    if (location && ['online', 'delivering'].includes(status)) {
      updateData.currentLocation = location;
    }

    // Update driver status
    const updatedDriver = await database.update(DRIVERS_TABLE, id, updateData);

    return responseHelper.success({
      driver: updatedDriver,
      message: `Driver status updated to ${status}`
    });

  } catch (error) {
    console.error('Update driver status error:', error);
    return responseHelper.serverError('Failed to update driver status');
  }
};

// Get driver performance metrics
exports.getDriverMetrics = async (event) => {
  try {
    // Handle CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return responseHelper.cors();
    }

    const { id } = event.pathParameters;

    if (!id) {
      return responseHelper.validation([
        { field: 'id', message: 'Driver ID is required' }
      ]);
    }

    // Check if driver exists
    const driver = await database.getById(DRIVERS_TABLE, id);
    if (!driver) {
      return responseHelper.notFound('Driver not found');
    }

    // In a real implementation, you would calculate these from orders
    const metrics = {
      totalDeliveries: driver.totalDeliveries || 0,
      totalEarnings: driver.totalEarnings || 0,
      rating: driver.rating || 5.0,
      completionRate: driver.completionRate || 100,
      averageDeliveryTime: 25, // minutes
      onTimeDeliveryRate: 95, // percentage
      dailyStats: {
        deliveries: Math.floor(Math.random() * 20),
        earnings: Math.floor(Math.random() * 300),
        hoursWorked: Math.floor(Math.random() * 8) + 1,
        averageRating: (Math.random() * 2 + 4).toFixed(1)
      },
      weeklyStats: Array.from({ length: 7 }, (_, i) => ({
        day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
        deliveries: Math.floor(Math.random() * 15),
        earnings: Math.floor(Math.random() * 200)
      }))
    };

    return responseHelper.success({
      metrics
    });

  } catch (error) {
    console.error('Get driver metrics error:', error);
    return responseHelper.serverError('Failed to get driver metrics');
  }
};
