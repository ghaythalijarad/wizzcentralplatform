# 🚀 CRITICAL MERCHANT APP INTEGRATION GUIDE
## Essential Information for Central Platform ↔ Merchant App Communication

---

## 🎯 **LIVE SYSTEM ENDPOINTS**

### **Central Platform (Your System)**
- **Base URL:** `https://9lqviiloy8.execute-api.us-east-1.amazonaws.com/dev`
- **Status:** ✅ DEPLOYED & ACTIVE

### **Merchant Backend (Target System)**
- **Base URL:** `https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev`
- **Status:** ✅ READY FOR INTEGRATION

---

## 🔐 **AUTHENTICATION REQUIREMENTS**

### **JWT Token Configuration**
```javascript
// Token must include these claims:
{
  "businessId": "MER001",           // Merchant identifier
  "userId": "admin_user_123",       // User making the request
  "iss": "wizzcentral-platform",    // Issuer
  "exp": 1735689600,                // Expiration timestamp
  "iat": 1735603200                 // Issued at timestamp
}

// Secret Key (keep secure)
JWT_SECRET: "wizzcentral-super-secret-key-2024"
```

### **Authorization Header Format**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 📡 **PRIMARY INTEGRATION ENDPOINTS**

### 1. **SEND ORDER TO MERCHANT** (Critical)
```http
POST https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev/webhooks/orders
Content-Type: application/json
Authorization: Bearer {jwt_token}
```

**Payload Structure:**
```json
{
  "orderId": "ORD_2025_001",
  "businessId": "MER001",
  "customerId": "CUST001",
  "customerName": "John Doe",
  "customerPhone": "+1234567890",
  "deliveryAddress": {
    "street": "123 Main Street",
    "city": "New York",
    "zipCode": "10001",
    "coordinates": {
      "latitude": 40.7128,
      "longitude": -74.0060
    }
  },
  "items": [
    {
      "productId": "PROD_123",
      "name": "Margherita Pizza",
      "quantity": 2,
      "price": 15.99,
      "specialInstructions": "Extra cheese, no olives"
    },
    {
      "productId": "PROD_456", 
      "name": "Caesar Salad",
      "quantity": 1,
      "price": 8.99,
      "specialInstructions": "Dressing on the side"
    }
  ],
  "totalAmount": 40.97,
  "notes": "Please ring doorbell twice",
  "estimatedDeliveryTime": "2025-08-01T14:30:00Z",
  "centralPlatformCallback": "https://9lqviiloy8.execute-api.us-east-1.amazonaws.com/dev/api/merchant-status-updates"
}
```

### 2. **RECEIVE STATUS UPDATES** (Critical)
**Your Central Platform MUST implement this webhook:**
```http
POST https://9lqviiloy8.execute-api.us-east-1.amazonaws.com/dev/api/merchant-status-updates
Content-Type: application/json
```

**Status Update Payload from Merchant:**
```json
{
  "orderId": "ORD_2025_001",
  "businessId": "MER001",
  "status": "accepted",
  "estimatedCompletionTime": "2025-08-01T14:15:00Z",
  "rejectionReason": null,
  "timestamp": "2025-08-01T13:05:00Z",
  "merchantNotes": "Order will be ready in 15 minutes"
}
```

---

## 🔄 **ORDER STATUS FLOW**

### **Status Progression:**
1. `pending` → Order sent to merchant, awaiting response
2. `accepted` → Merchant confirmed, preparing food
3. `preparing` → Food being prepared
4. `ready` → Ready for pickup/delivery
5. `picked_up` → Driver collected order
6. `out_for_delivery` → En route to customer
7. `delivered` → Successfully delivered
8. `cancelled` → Order cancelled

### **Alternative Flows:**
- `rejected` → Merchant declined order (include rejectionReason)

---

## 🛠 **MERCHANT APP IMPLEMENTATION REQUIREMENTS**

### **1. Order Reception Handler**
```javascript
// Merchant app must implement this endpoint
app.post('/webhooks/orders', authenticateJWT, async (req, res) => {
  const order = req.body;
  
  try {
    // Store order in merchant database
    await storeIncomingOrder(order);
    
    // Notify merchant staff (push notification, sound, etc.)
    await notifyMerchantStaff(order);
    
    // Respond immediately
    res.json({
      success: true,
      orderId: order.orderId,
      status: "pending",
      message: "Order received successfully",
      timestamp: new Date().toISOString()
    });
    
    // Process order asynchronously
    processOrderAsync(order);
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### **2. Status Update Sender**
```javascript
// When merchant takes action, send status to Central Platform
async function updateOrderStatus(orderId, newStatus, additionalData = {}) {
  const statusUpdate = {
    orderId,
    businessId: getCurrentBusinessId(),
    status: newStatus,
    timestamp: new Date().toISOString(),
    ...additionalData
  };
  
  try {
    const response = await fetch(
      'https://9lqviiloy8.execute-api.us-east-1.amazonaws.com/dev/api/merchant-status-updates',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getJWTToken()}`
        },
        body: JSON.stringify(statusUpdate)
      }
    );
    
    if (!response.ok) {
      throw new Error(`Status update failed: ${response.statusText}`);
    }
    
    console.log('Status update sent successfully');
  } catch (error) {
    console.error('Failed to send status update:', error);
    // Implement retry logic
    scheduleStatusUpdateRetry(statusUpdate);
  }
}
```

---

## 🔧 **CONFIGURATION VARIABLES**

### **Environment Variables for Merchant App:**
```bash
# Central Platform Communication
CENTRAL_PLATFORM_BASE_URL=https://9lqviiloy8.execute-api.us-east-1.amazonaws.com/dev
CENTRAL_PLATFORM_WEBHOOK_ENDPOINT=/api/merchant-status-updates

# JWT Configuration
JWT_SECRET=wizzcentral-super-secret-key-2024
JWT_ISSUER=wizzcentral-platform
JWT_EXPIRATION=24h

# Business Configuration
BUSINESS_ID=MER001  # Unique identifier for this merchant
WEBHOOK_SECRET=webhook_secret_key_here

# Optional: Rate Limiting
MAX_ORDERS_PER_MINUTE=60
ORDER_TIMEOUT_MINUTES=30
```

---

## 🚨 **CRITICAL INTEGRATION POINTS**

### **1. Order Acknowledgment (IMMEDIATE)**
- Merchant app MUST respond within 5 seconds
- Response indicates successful receipt, not acceptance
- Actual acceptance/rejection sent via separate status update

### **2. Status Updates (REAL-TIME)**
- Send status updates immediately when actions occur
- Include estimated completion times for accepted orders
- Include rejection reasons for declined orders

### **3. Error Handling**
- Implement exponential backoff for failed API calls
- Queue status updates if Central Platform is temporarily unavailable
- Log all communication attempts for debugging

### **4. Data Validation**
- Validate all incoming order data
- Sanitize customer information
- Verify price calculations

---

## 🧪 **TESTING ENDPOINTS**

### **Health Check:**
```http
GET https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev/health
```

### **Test Order Creation:**
```http
POST https://9lqviiloy8.execute-api.us-east-1.amazonaws.com/dev/api/send-order-to-merchant
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "orderId": "TEST_ORDER_001",
  "merchantId": "MER001"
}
```

---

## 📱 **MERCHANT APP UI REQUIREMENTS**

### **Order Display Must Include:**
- Order ID (prominently displayed)
- Customer information (name, phone)
- Delivery address
- Item details with quantities and special instructions
- Total amount
- Estimated delivery time
- Action buttons: Accept, Reject, Mark Ready, etc.

### **Status Management:**
- Clear buttons for each status transition
- Confirmation dialogs for critical actions
- Real-time status synchronization display
- Order history and status logs

---

## 🔒 **SECURITY CONSIDERATIONS**

### **1. JWT Token Management**
- Tokens expire after 24 hours
- Refresh tokens before expiration
- Store securely (never in plain text)

### **2. Data Protection**
- Encrypt customer PII in database
- Use HTTPS for all communications
- Sanitize all inputs

### **3. Rate Limiting**
- Respect API rate limits
- Implement circuit breakers
- Queue requests during high load

---

## 📞 **SUPPORT & TROUBLESHOOTING**

### **Common Integration Issues:**
1. **401 Unauthorized:** Check JWT token validity and format
2. **400 Bad Request:** Validate payload structure against schema
3. **500 Internal Error:** Check Central Platform logs, implement retry
4. **Timeout Errors:** Increase timeout values, check network connectivity

### **Debugging Tools:**
- Monitor network requests in browser dev tools
- Check server logs for API responses
- Use webhook testing tools (ngrok, Postman)
- Validate JWT tokens at jwt.io

### **Contact Information:**
- Technical Issues: Log in Central Platform admin dashboard
- Integration Support: Check CENTRAL_PLATFORM_INTEGRATION_GUIDE.md
- Emergency: Monitor system health endpoints

---

## ✅ **INTEGRATION CHECKLIST**

- [ ] Merchant app can receive POST requests at `/webhooks/orders`
- [ ] JWT authentication implemented and working
- [ ] Order storage and merchant notification system ready
- [ ] Status update sender function implemented
- [ ] Error handling and retry logic in place
- [ ] Environment variables configured
- [ ] Testing with sample orders successful
- [ ] UI for order management completed
- [ ] Security measures implemented
- [ ] Monitoring and logging enabled

---

**🎯 PRIORITY:** Implement the order reception endpoint first, then status updates. Test with small orders before going live!
