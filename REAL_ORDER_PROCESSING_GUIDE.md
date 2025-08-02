# Real Customer Order Processing - Updated API Guide

## 🚀 Platform Transition: From Test Simulators to Real Customer Orders

**Important Update:** The platform now processes real orders from customers through your friend's Flutter app, replacing all test order simulators.

## New Customer Order Endpoints

### 1. Process Real Customer Order

**Endpoint:** `POST /customer/orders`
**Description:** Process a real order from the customer app
**Headers:**

```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer eyJhbGciOiJSUzI1NiIs..."
}
```

**Request Body:**

```json
{
  "customerId": "customer-uuid",
  "businessId": "7ccf646c-9594-48d4-8f63-c366d89257e5",
  "customerName": "John Doe",
  "customerPhone": "+1234567890",
  "customerEmail": "john.doe@example.com",
  "items": [
    {
      "productId": "prod-123",
      "name": "Margherita Pizza",
      "price": 16.99,
      "quantity": 1,
      "specialInstructions": "Extra cheese"
    }
  ],
  "deliveryAddress": {
    "street": "456 Oak Ave",
    "city": "New York",
    "state": "NY",
    "zipCode": "10002",
    "coordinates": {
      "latitude": 40.7589,
      "longitude": -73.9851
    },
    "instructions": "Ring doorbell twice"
  },
  "paymentMethod": "card",
  "notes": "Please deliver quickly"
}
```

**Response (Success - 201):**

```json
{
  "success": true,
  "orderId": "order-uuid",
  "orderNumber": "WZ123456",
  "status": "pending",
  "totalAmount": 22.66,
  "estimatedDeliveryTime": "2024-01-15T19:30:00Z",
  "message": "Order placed successfully and sent to merchant"
}
```

### 2. Get Customer Order History

**Endpoint:** `GET /customer/{customerId}/orders`
**Description:** Get order history for a customer
**Headers:**

```json
{
  "Authorization": "Bearer eyJhbGciOiJSUzI1NiIs..."
}
```

**Response (Success - 200):**

```json
{
  "orders": [
    {
      "orderId": "order-uuid",
      "status": "delivered",
      "totalAmount": 22.66,
      "merchantName": "Pizza Palace",
      "createdAt": "2024-01-15T18:45:00Z"
    }
  ],
  "count": 5,
  "lastEvaluatedKey": null
}
```

### 3. Get Real-time Order Status

**Endpoint:** `GET /customer/orders/{orderId}/status`
**Description:** Get current status of an order
**Headers:**

```json
{
  "Authorization": "Bearer eyJhbGciOiJSUzI1NiIs..."
}
```

**Response (Success - 200):**

```json
{
  "orderId": "order-uuid",
  "status": "out_for_delivery",
  "estimatedDeliveryTime": "2024-01-15T19:30:00Z",
  "driverInfo": {
    "driverId": "driver-uuid",
    "driverName": "John Driver",
    "driverPhone": "+1987654321"
  },
  "lastUpdate": "2024-01-15T19:15:00Z"
}
```

## Order Processing Flow

```
Customer App → Central Platform → Merchant Backend → Merchant Flutter App
     ↓              ↓                    ↓                    ↓
1. Places Order → 2. Validates → 3. Forwards Order → 4. Shows Notification
                       ↓
                 5. Stores in DB
                       ↓
                 6. Sends Real-time Updates
```

### Key Features of Real Order Processing

1. **Order Validation:** Validates customer, merchant, and order data
2. **Automatic Calculations:** Calculates tax, delivery fees, and totals
3. **Database Storage:** Stores complete order in Central Platform
4. **Merchant Forwarding:** Sends order to merchant backend system
5. **Real-time Notifications:** Notifies merchant app instantly
6. **Status Tracking:** Tracks order through all stages

## Order Tracking for Customers

### Order Status Progression

1. `pending` - Order placed, sent to merchant
2. `confirmed` - Merchant accepted the order
3. `preparing` - Order is being prepared
4. `ready_for_pickup` - Order ready, waiting for driver
5. `picked_up` - Driver picked up the order
6. `out_for_delivery` - Order is on the way to customer
7. `delivered` - Order delivered successfully
8. `cancelled` - Order was cancelled

## Real-time Updates

Customers receive instant updates via WebSocket:

```json
{
  "type": "order_status_update",
  "data": {
    "orderId": "order-uuid",
    "status": "preparing",
    "estimatedDeliveryTime": "2024-01-15T19:30:00Z",
    "message": "Your order is being prepared by Pizza Palace"
  }
}
```

## Flutter Implementation Example

```dart
class RealOrderService {
  static const String baseUrl = 'https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev';
  
  Future<Map<String, dynamic>> placeOrder(Map<String, dynamic> orderData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/customer/orders'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $_accessToken',
      },
      body: json.encode(orderData),
    );

    if (response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to place order');
    }
  }

  Future<List<dynamic>> getOrderHistory(String customerId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/customer/$customerId/orders'),
      headers: {
        'Authorization': 'Bearer $_accessToken',
      },
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['orders'];
    } else {
      throw Exception('Failed to load order history');
    }
  }
}
```

## Deprecated: Test Order Simulators

The following test scripts are now **deprecated** and should not be used:

- ❌ `create-more-test-orders.mjs`
- ❌ `create-new-test-orders.mjs`
- ❌ `single-order-now.mjs`
- ❌ `quick-test-orders.mjs`

**Use real customer orders from the Flutter app instead!**

## Benefits of Real Order Processing

1. **Authentic Data:** Real customer information and preferences
2. **Proper Validation:** Validates all order components
3. **Payment Integration:** Ready for real payment processing
4. **Customer Experience:** Full order tracking and updates
5. **Merchant Workflow:** Natural merchant app workflow
6. **Driver Assignment:** Real driver assignment and tracking
7. **Analytics:** Accurate business analytics and reporting

## Next Steps

1. ✅ Deploy the updated backend with real order processing
2. ✅ Your friend implements order creation in customer app
3. ✅ Test real order flow end-to-end
4. ⏳ Add payment processing integration
5. ⏳ Implement driver assignment system
6. ⏳ Add customer reviews and ratings

---

**The platform is now ready for real customer orders!** 🎉
