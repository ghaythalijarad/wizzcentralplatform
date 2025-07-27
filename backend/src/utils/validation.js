const Joi = require('joi');

// User validation schemas
const userSchemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])')).required()
      .messages({
        'string.pattern.base': 'Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character'
      }),
    role: Joi.string().valid('admin', 'manager', 'support').default('manager')
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(100),
    email: Joi.string().email(),
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/),
    avatar: Joi.string().uri()
  }).min(1)
};

// Merchant validation schemas
const merchantSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().min(1).required(),
    category: Joi.string().valid('restaurant', 'grocery', 'pharmacy', 'retail', 'electronics', 'clothing', 'beauty', 'books', 'sports', 'home', 'automotive', 'other').required(),
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
      country: Joi.string().default('US')
    }).required(),
    businessHours: Joi.object({
      monday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() }),
      tuesday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() }),
      wednesday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() }),
      thursday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() }),
      friday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() }),
      saturday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() }),
      sunday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() })
    }),
    website: Joi.string().uri(),
    commission: Joi.number().min(0).max(100),
    description: Joi.string().max(500)
  }),

  update: Joi.object({
    businessName: Joi.string().min(2).max(100),
    name: Joi.string().min(2).max(100), // Keep both for backwards compatibility
    email: Joi.string().email(),
    phoneNumber: Joi.string().min(1),
    phone: Joi.string().min(1), // Keep both for backwards compatibility
    businessType: Joi.string().valid('restaurant', 'store', 'cafe', 'cloudkitchen', 'pharmacy', 'retail'),
    category: Joi.string().valid('restaurant', 'grocery', 'pharmacy', 'retail', 'electronics', 'clothing', 'beauty', 'books', 'sports', 'home', 'automotive', 'other'), // Keep for backwards compatibility
    ownerName: Joi.string().min(2).max(100),
    street: Joi.string(),
    city: Joi.string(),
    district: Joi.string(),
    country: Joi.string(),
    address: Joi.object({
      street: Joi.string(),
      city: Joi.string(),
      state: Joi.string(),
      zipCode: Joi.string(),
      country: Joi.string()
    }),
    businessHours: Joi.object({
      monday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() }),
      tuesday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() }),
      wednesday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() }),
      thursday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() }),
      friday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() }),
      saturday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() }),
      sunday: Joi.object({ open: Joi.string(), close: Joi.string(), closed: Joi.boolean() })
    }),
    website: Joi.string().uri(),
    commission: Joi.number().min(0).max(100),
    description: Joi.string().max(500),
    updatedAt: Joi.string().isoDate()
  }).min(1),

  updateStatus: Joi.object({
    action: Joi.string().valid('approve', 'reject', 'suspend', 'review', 'reactivate').required(),
    reason: Joi.string().min(10).max(500).required(),
    sendEmail: Joi.boolean().default(true)
  })
};

// Driver validation schemas
const driverSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    email: Joi.string().email().required(),
    phone: Joi.string().min(1).required(),
    licenseNumber: Joi.string().required(),
    vehicleType: Joi.string().valid('bike', 'scooter', 'motorcycle', 'car').required(),
    vehicleModel: Joi.string().required(),
    vehiclePlate: Joi.string().required(),
    address: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
      country: Joi.string().default('US')
    }).required(),
    emergencyContact: Joi.object({
      name: Joi.string().required(),
      phone: Joi.string().min(1).required(),
      relationship: Joi.string().required()
    }).required()
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100),
    phone: Joi.string().min(1),
    vehicleType: Joi.string().valid('bike', 'scooter', 'motorcycle', 'car'),
    vehicleModel: Joi.string(),
    vehiclePlate: Joi.string(),
    address: Joi.object({
      street: Joi.string(),
      city: Joi.string(),
      state: Joi.string(),
      zipCode: Joi.string(),
      country: Joi.string()
    }),
    emergencyContact: Joi.object({
      name: Joi.string(),
      phone: Joi.string().min(1),
      relationship: Joi.string()
    }),
    status: Joi.string().valid('active', 'inactive', 'pending', 'approved', 'rejected')
  }).min(1)
};

// Customer validation schemas
const customerSchemas = {
  update: Joi.object({
    name: Joi.string().min(2).max(100),
    phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/),
    address: Joi.object({
      street: Joi.string(),
      city: Joi.string(),
      state: Joi.string(),
      zipCode: Joi.string(),
      country: Joi.string()
    }),
    preferences: Joi.object({
      cuisine: Joi.array().items(Joi.string()),
      dietaryRestrictions: Joi.array().items(Joi.string()),
      maxDeliveryTime: Joi.number().min(15).max(120)
    })
  }).min(1)
};

// Order validation schemas
const orderSchemas = {
  create: Joi.object({
    customerId: Joi.string().required(),
    merchantId: Joi.string().required(),
    items: Joi.array().items(
      Joi.object({
        id: Joi.string().required(),
        name: Joi.string().required(),
        price: Joi.number().positive().required(),
        quantity: Joi.number().integer().min(1).required(),
        modifiers: Joi.array().items(
          Joi.object({
            name: Joi.string().required(),
            price: Joi.number().min(0).required()
          })
        )
      })
    ).min(1).required(),
    deliveryAddress: Joi.object({
      street: Joi.string().required(),
      city: Joi.string().required(),
      state: Joi.string().required(),
      zipCode: Joi.string().required(),
      country: Joi.string().default('US'),
      instructions: Joi.string().max(200)
    }).required(),
    paymentMethod: Joi.string().valid('credit_card', 'debit_card', 'paypal', 'cash').required(),
    promotionCode: Joi.string(),
    notes: Joi.string().max(200)
  }),

  updateStatus: Joi.object({
    status: Joi.string().valid('confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled').required(),
    notes: Joi.string().max(200)
  })
};

// Promotion validation schemas
const promotionSchemas = {
  create: Joi.object({
    name: Joi.string().min(2).max(100).required(),
    code: Joi.string().alphanum().min(3).max(20).required(),
    type: Joi.string().valid('percentage', 'fixed_amount', 'free_delivery').required(),
    value: Joi.number().positive().required(),
    minOrderAmount: Joi.number().min(0),
    maxDiscount: Joi.number().positive(),
    startDate: Joi.date().iso().required(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate')).required(),
    usageLimit: Joi.number().integer().min(1),
    userUsageLimit: Joi.number().integer().min(1),
    applicableTo: Joi.string().valid('all', 'specific_merchants', 'specific_categories').default('all'),
    merchantIds: Joi.array().items(Joi.string()),
    categories: Joi.array().items(Joi.string()),
    description: Joi.string().max(200),
    terms: Joi.string().max(500)
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(100),
    type: Joi.string().valid('percentage', 'fixed_amount', 'free_delivery'),
    value: Joi.number().positive(),
    minOrderAmount: Joi.number().min(0),
    maxDiscount: Joi.number().positive(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso(),
    usageLimit: Joi.number().integer().min(1),
    userUsageLimit: Joi.number().integer().min(1),
    status: Joi.string().valid('active', 'inactive', 'expired'),
    description: Joi.string().max(200),
    terms: Joi.string().max(500)
  }).min(1)
};

// Support ticket validation schemas
const supportSchemas = {
  create: Joi.object({
    subject: Joi.string().min(5).max(100).required(),
    message: Joi.string().min(10).max(1000).required(),
    category: Joi.string().valid('technical', 'billing', 'account', 'orders', 'general').required(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
    customerId: Joi.string(),
    merchantId: Joi.string(),
    driverId: Joi.string(),
    orderId: Joi.string()
  }),

  update: Joi.object({
    status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed'),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
    assignedTo: Joi.string(),
    resolution: Joi.string().max(1000)
  }).min(1),

  reply: Joi.object({
    message: Joi.string().min(1).max(1000).required(),
    isInternal: Joi.boolean().default(false)
  })
};

// Validation middleware
const validate = (schema) => {
  return (data) => {
    const { error, value } = schema.validate(data, { abortEarly: false });
    if (error) {
      const details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      return { isValid: false, errors: details };
    }
    return { isValid: true, data: value };
  };
};

// Direct validation function used by handlers
const validateInput = (data, schema) => {
  const { error, value } = schema.validate(data, { abortEarly: false });
  if (error) {
    const details = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message
    }));
    return { isValid: false, errors: details };
  }
  return { isValid: true, data: value };
};

module.exports = {
  userSchemas,
  merchantSchemas,
  driverSchemas,
  customerSchemas,
  orderSchemas,
  promotionSchemas,
  supportSchemas,
  validate,
  validateInput
};
