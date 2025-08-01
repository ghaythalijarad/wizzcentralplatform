# Central Platform Integration Guide
## Merchant App Backend Integration

### 🎯 Overview
This guide provides all the information needed for your Central Platform to integrate with the Merchant App backend for real-time order management within your ecosystem.

### 🚀 Live Endpoints
**Base URL:** `https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev`

## 📡 Core Integration Endpoints

### 1. **Send Orders to Merchant** (PRIMARY INTEGRATION)
```
POST /webhooks/orders
Content-Type: application/json
Authorization: Bearer {jwt_token}

{
  "orderId": "order_12345",
  "businessId": "business_67890",
  "customerId": "customer_11111",
  "customerName": "John Doe",
  "customerPhone": "+1234567890",
  "deliveryAddress": {
    "street": "123 Main St",
    "city": "City",
    "zipCode": "12345",
    "coordinates": {
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  },
  "items": [
    {
      "productId": "prod_123",
      "name": "Pizza Margherita",
      "quantity": 2,
      "price": 15.99,
      "specialInstructions": "Extra cheese"
    }
  ],
  "totalAmount": 31.98,
  "notes": "Ring doorbell twice",
  "estimatedDeliveryTime": "2025-01-15T14:30:00Z",
  "centralPlatformCallback": "https://your-platform.com/api/merchant-status-updates"
}
```

**Response:**
```json
{
  "success": true,
  "orderId": "order_12345",
  "status": "pending",
  "message": "Order received and sent to merchant",
  "timestamp": "2025-01-15T13:00:00Z"
}
```

### 2. **Health Check**
```
GET /health
```

### 3. **Get Merchant Orders** (for debugging)
```
GET /merchant/orders/{businessId}
```

## 🔄 Order Status Flow

### Status Updates From Merchant → Your Platform
When merchants take action, the merchant backend will send status updates to your platform:

**Your Platform Webhook Endpoint (you need to implement):**
```
POST https://your-platform.com/api/merchant-status-updates
Content-Type: application/json

{
  "orderId": "order_12345",
  "businessId": "business_67890",
  "status": "accepted", // accepted, rejected, preparing, ready, completed
  "estimatedCompletionTime": "2025-01-15T14:15:00Z", // for accepted orders
  "rejectionReason": "Out of ingredients", // for rejected orders
  "timestamp": "2025-01-15T13:05:00Z",
  "merchantNotes": "Order will be ready in 15 minutes"
}
```

### Order Status Values:
- `pending` - Order received, waiting for merchant response
- `accepted` - Merchant accepted, preparing food
- `rejected` - Merchant rejected order
- `preparing` - Food is being prepared
- `ready` - Food ready for pickup/delivery
- `picked_up` - Driver picked up the order
- `completed` - Order delivered to customer

## 🔐 Authentication

**JWT Token Required:** Include in Authorization header
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

The token should contain:
- `businessId` - For order routing
- `userId` - For audit trails
- Standard JWT claims (iss, exp, iat)

## 🎯 Implementation Steps for Your Central Platform

### Step 1: Create Webhook Endpoint
```javascript
// Your platform webhook endpoint
app.post('/api/merchant-status-updates', async (req, res) => {
  const { orderId, businessId, status, estimatedCompletionTime, rejectionReason } = req.body;
  
  try {
    // Update order status in your database
    await updateOrderStatus(orderId, status, {
      estimatedCompletionTime,
      rejectionReason,
      timestamp: new Date()
    });
    
    // Notify customer app about status change
    await notifyCustomer(orderId, status);
    
    // If accepted, notify driver app
    if (status === 'accepted') {
      await notifyDrivers(orderId, businessId);
    }
    
    res.json({ success: true, received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Processing failed' });
  }
});
```

### Step 2: Send Orders to Merchant
```javascript
// When customer places order
async function sendOrderToMerchant(order) {
  const merchantPayload = {
    orderId: order.id,
    businessId: order.restaurantId,
    customerId: order.customerId,
    customerName: order.customer.name,
    customerPhone: order.customer.phone,
    deliveryAddress: order.deliveryAddress,
    items: order.items,
    totalAmount: order.total,
    notes: order.specialInstructions,
    estimatedDeliveryTime: order.requestedDeliveryTime,
    centralPlatformCallback: 'https://your-platform.com/api/merchant-status-updates'
  };
  
  try {
    const response = await fetch('https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev/webhooks/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${jwtToken}`
      },
      body: JSON.stringify(merchantPayload)
    });
    
    const result = await response.json();
    console.log('Order sent to merchant:', result);
    
    return result;
  } catch (error) {
    console.error('Failed to send order to merchant:', error);
    throw error;
  }
}
```

### Step 3: Handle Webhook Responses
```javascript
// Implement retry logic for failed webhooks
async function handleOrderStatusUpdate(webhookData) {
  const { orderId, status } = webhookData;
  
  switch (status) {
    case 'accepted':
      // Order accepted - notify customer and drivers
      await notifyCustomer(orderId, 'Your order has been accepted!');
      await assignDriver(orderId);
      break;
      
    case 'rejected':
      // Order rejected - notify customer and offer alternatives
      await notifyCustomer(orderId, `Order rejected: ${webhookData.rejectionReason}`);
      await offerAlternatives(orderId);
      break;
      
    case 'ready':
      // Food ready - notify driver for pickup
      await notifyDriverForPickup(orderId);
      break;
      
    case 'completed':
      // Order completed - final notifications and cleanup
      await notifyCustomer(orderId, 'Order delivered successfully!');
      await finalizeOrder(orderId);
      break;
  }
}
```

## 🧪 Testing

### Test Order Payload:
```bash
curl -X POST https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev/webhooks/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "orderId": "test_order_001",
    "businessId": "test_business_001",
    "customerId": "test_customer_001",
    "customerName": "Test Customer",
    "customerPhone": "+1234567890",
    "deliveryAddress": {
      "street": "123 Test St",
      "city": "Test City",
      "zipCode": "12345"
    },
    "items": [
      {
        "productId": "test_product",
        "name": "Test Pizza",
        "quantity": 1,
        "price": 19.99
      }
    ],
    "totalAmount": 19.99,
    "centralPlatformCallback": "https://your-platform.com/webhook"
  }'
```

## 🚨 Error Handling

### Common Error Responses:
```json
{
  "success": false,
  "error": "INVALID_BUSINESS_ID",
  "message": "Business not found or inactive",
  "timestamp": "2025-01-15T13:00:00Z"
}
```

### Error Codes:
- `INVALID_BUSINESS_ID` - Business doesn't exist
- `INVALID_ORDER_DATA` - Missing required fields
- `AUTHENTICATION_FAILED` - Invalid JWT token
- `DUPLICATE_ORDER` - Order ID already exists

## 📊 Monitoring

### Webhook Delivery Status:
The merchant backend will retry failed webhook calls to your platform:
- **Retry intervals:** 1min, 5min, 15min, 30min, 1hr
- **Max retries:** 5 attempts
- **Timeout:** 30 seconds per attempt

### Health Monitoring:
```bash
curl https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev/health
```

## 🔧 Production Considerations

1. **Rate Limiting:** 1000 requests/minute per business
2. **Webhook Timeouts:** Your webhook endpoint should respond within 30 seconds
3. **Idempotency:** Handle duplicate webhook deliveries gracefully
4. **Security:** Validate JWT tokens and implement IP whitelisting if needed
5. **Monitoring:** Set up alerts for failed webhook deliveries

## 📞 Support

For integration support and troubleshooting:
- **CloudWatch Logs:** Available for debugging failed requests
- **Health Check:** Monitor endpoint availability
- **Error Tracking:** All errors are logged with correlation IDs

---

**Status:** ✅ Production Ready
**Last Updated:** January 2025
**API Version:** v1.0
