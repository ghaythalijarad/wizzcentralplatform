# Customer App API Integration Guide

## Overview

This guide provides all the necessary information for integrating your customer-facing Flutter app with the WizzCentral Platform backend.

## Base Configuration

### API Base URL

```
https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev
```

### Authentication

The platform uses AWS Cognito for authentication. All protected endpoints require a valid JWT token in the Authorization header.

## Authentication Endpoints

### 1. User Registration

**Endpoint:** `POST /auth/register`
**Description:** Register a new customer account
**Headers:**

```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "role": "customer"
}
```

**Response (Success - 200):**

```json
{
  "message": "User registered successfully",
  "user": {
    "userId": "uuid-here",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "role": "customer"
  }
}
```

### 2. User Login

**Endpoint:** `POST /auth/login`
**Description:** Authenticate user and get tokens
**Headers:**

```json
{
  "Content-Type": "application/json"
}
```

**Request Body:**

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

**Response (Success - 200):**

```json
{
  "tokens": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "idToken": "eyJhbGciOiJSUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIs..."
  },
  "user": {
    "userId": "uuid-here",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "role": "customer"
  }
}
```

### 3. Token Refresh

**Endpoint:** `POST /auth/refresh`
**Description:** Refresh expired access token
**Request Body:**

```json
{
  "refreshToken": "eyJhbGciOiJSUzI1NiIs...",
  "email": "john.doe@example.com"
}
```

**Response (Success - 200):**

```json
{
  "message": "Token refreshed successfully",
  "tokens": {
    "accessToken": "eyJhbGciOiJSUzI1NiIs...",
    "idToken": "eyJhbGciOiJSUzI1NiIs..."
  }
}
```

## Merchant Discovery Endpoints

### 4. Get All Merchants

**Endpoint:** `GET /merchants`
**Description:** Get all published/active merchants
**Headers:**

```json
{
  "Content-Type": "application/json"
}
```

**Response (Success - 200):**

```json
{
  "merchants": [
    {
      "businessId": "7ccf646c-9594-48d4-8f63-c366d89257e5",
      "name": "Pizza Palace",
      "description": "Best pizza in town",
      "category": "restaurant",
      "subcategory": "pizza",
      "address": {
        "street": "123 Main St",
        "city": "New York",
        "state": "NY",
        "zipCode": "10001"
      },
      "phone": "+1234567890",
      "email": "contact@pizzapalace.com",
      "isPublished": true,
      "isActive": true,
      "rating": 4.5,
      "deliveryFee": 3.99,
      "minimumOrder": 15.00,
      "estimatedDeliveryTime": "30-45 mins"
    }
  ]
}
```

### 5. Get Merchant Details

**Endpoint:** `GET /merchants/{businessId}`
**Description:** Get detailed information about a specific merchant
**Path Parameters:**

- `businessId`: The unique identifier of the merchant
**Response (Success - 200):**

```json
{
  "merchant": {
    "businessId": "7ccf646c-9594-48d4-8f63-c366d89257e5",
    "name": "Pizza Palace",
    "description": "Best pizza in town",
    "category": "restaurant",
    "subcategory": "pizza",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001"
    },
    "phone": "+1234567890",
    "email": "contact@pizzapalace.com",
    "isPublished": true,
    "isActive": true,
    "rating": 4.5,
    "deliveryFee": 3.99,
    "minimumOrder": 15.00,
    "estimatedDeliveryTime": "30-45 mins",
    "hours": {
      "monday": "10:00-22:00",
      "tuesday": "10:00-22:00",
      "wednesday": "10:00-22:00",
      "thursday": "10:00-22:00",
      "friday": "10:00-23:00",
      "saturday": "10:00-23:00",
      "sunday": "11:00-21:00"
    }
  }
}
```

### 6. Get Merchant Products/Menu

**Endpoint:** `GET /merchants/{businessId}/products`
**Description:** Get all products/menu items for a specific merchant
**Path Parameters:**

- `businessId`: The unique identifier of the merchant
**Response (Success - 200):**

```json
{
  "products": [
    {
      "productId": "prod-123",
      "businessId": "7ccf646c-9594-48d4-8f63-c366d89257e5",
      "name": "Margherita Pizza",
      "description": "Fresh tomatoes, mozzarella, basil",
      "price": 16.99,
      "category": "pizza",
      "imageUrl": "https://example.com/margherita.jpg",
      "isAvailable": true,
      "options": [
        {
          "name": "Size",
          "type": "single",
          "required": true,
          "choices": [
            {"name": "Small", "price": 0},
            {"name": "Medium", "price": 3.00},
            {"name": "Large", "price": 6.00}
          ]
        }
      ]
    }
  ]
}
```

## Order Management Endpoints

### 7. Create Order (Real Customer Orders)

**Endpoint:** `POST /customer/orders`
**Description:** Create a new order from the customer app (replaces test simulators)
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
  "merchantId": "7ccf646c-9594-48d4-8f63-c366d89257e5",
  "items": [
    {
      "name": "Margherita Pizza",
      "price": 16.99,
      "quantity": 1,
      "options": ["Medium"]
    }
  ],
  "deliveryAddress": {
    "street": "456 Oak Ave",
    "city": "New York",
    "state": "NY",
    "zipCode": "10002",
    "coordinates": {
      "lat": 40.7589,
      "lng": -73.9851
    }
  },
  "paymentMethod": "card",
  "specialInstructions": "Ring doorbell twice"
}
```

**Response (Success - 201):**

```json
{
  "orderId": "order-uuid",
  "orderNumber": "WZ123456",
  "status": "pending",
  "subtotal": 16.99,
  "deliveryFee": 3.99,
  "tax": 1.68,
  "total": 22.66,
  "estimatedDeliveryTime": "2024-01-15T19:30:00Z",
  "createdAt": "2024-01-15T18:45:00Z"
}
```

### 8. Get Customer Orders

**Endpoint:** `GET /customers/{customerId}/orders`
**Description:** Get order history for a specific customer
**Headers:**

```json
{
  "Authorization": "Bearer eyJhbGciOiJSUzI1NiIs..."
}
```

**Query Parameters:**

- `limit`: Number of orders to return (default: 20)
- `lastEvaluatedKey`: For pagination
**Response (Success - 200):**

```json
{
  "orders": [
    {
      "orderId": "order-uuid",
      "orderNumber": "WZ123456",
      "merchantId": "7ccf646c-9594-48d4-8f63-c366d89257e5",
      "merchantName": "Pizza Palace",
      "status": "delivered",
      "items": [...],
      "total": 22.66,
      "createdAt": "2024-01-15T18:45:00Z",
      "deliveredAt": "2024-01-15T19:25:00Z"
    }
  ],
  "count": 1,
  "lastEvaluatedKey": null
}
```

### 9. Get Order Details

**Endpoint:** `GET /orders/{orderId}`
**Description:** Get detailed information about a specific order
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
  "orderNumber": "WZ123456",
  "customerId": "customer-uuid",
  "merchantId": "7ccf646c-9594-48d4-8f63-c366d89257e5",
  "status": "out_for_delivery",
  "items": [...],
  "deliveryAddress": {...},
  "subtotal": 16.99,
  "deliveryFee": 3.99,
  "tax": 1.68,
  "total": 22.66,
  "paymentMethod": "card",
  "specialInstructions": "Ring doorbell twice",
  "estimatedDeliveryTime": "2024-01-15T19:30:00Z",
  "createdAt": "2024-01-15T18:45:00Z",
  "updatedAt": "2024-01-15T19:15:00Z",
  "driverId": "driver-uuid",
  "driverName": "John Driver",
  "driverPhone": "+1987654321"
}
```

### 10. Cancel Order

**Endpoint:** `POST /orders/{orderId}/cancel`
**Description:** Cancel an existing order
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
  "reason": "Changed my mind"
}
```

**Response (Success - 200):**

```json
{
  "orderId": "order-uuid",
  "status": "cancelled",
  "cancellationReason": "Changed my mind",
  "message": "Order cancelled successfully"
}
```

## Real-time Updates (WebSocket)

### WebSocket Connection

**URL:** `wss://websocket-api-id.execute-api.us-east-1.amazonaws.com/dev`

### Connection Authentication

Include the JWT token in the connection query parameters:

```
wss://websocket-api-id.execute-api.us-east-1.amazonaws.com/dev?token=eyJhbGciOiJSUzI1NiIs...
```

### Message Types

The customer app will receive real-time updates for:

1. **Order Status Updates**

```json
{
  "type": "order_status_update",
  "data": {
    "orderId": "order-uuid",
    "status": "preparing",
    "estimatedDeliveryTime": "2024-01-15T19:30:00Z",
    "message": "Your order is being prepared"
  }
}
```

2. **Driver Assignment**

```json
{
  "type": "driver_assigned",
  "data": {
    "orderId": "order-uuid",
    "driverId": "driver-uuid",
    "driverName": "John Driver",
    "driverPhone": "+1987654321",
    "driverLocation": {
      "lat": 40.7589,
      "lng": -73.9851
    }
  }
}
```

3. **Delivery Updates**

```json
{
  "type": "delivery_update",
  "data": {
    "orderId": "order-uuid",
    "driverLocation": {
      "lat": 40.7589,
      "lng": -73.9851
    },
    "estimatedArrival": "5 minutes"
  }
}
```

## Error Handling

### Common Error Responses

**400 - Bad Request:**

```json
{
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ]
}
```

**401 - Unauthorized:**

```json
{
  "message": "Invalid or expired token"
}
```

**404 - Not Found:**

```json
{
  "message": "Resource not found"
}
```

**500 - Internal Server Error:**

```json
{
  "message": "Internal server error"
}
```

## Order Status Flow

The order progresses through these statuses:

1. `pending` - Order placed, waiting for merchant confirmation
2. `confirmed` - Merchant accepted the order
3. `preparing` - Order is being prepared
4. `ready_for_pickup` - Order ready, waiting for driver
5. `picked_up` - Driver picked up the order
6. `out_for_delivery` - Order is on the way
7. `delivered` - Order delivered successfully
8. `cancelled` - Order was cancelled

## Implementation Tips

### 1. Token Management

- Store tokens securely using Flutter's secure storage
- Implement automatic token refresh
- Handle token expiration gracefully

### 2. Real-time Updates

- Implement WebSocket connection with reconnection logic
- Handle connection drops and restore state
- Show real-time order tracking to customers

### 3. Order Flow

- Validate minimum order amounts before placing orders
- Calculate totals including tax and delivery fees
- Handle payment processing integration

### 4. Error Handling

- Implement retry mechanisms for network failures
- Show user-friendly error messages
- Log errors for debugging

## Example Flutter HTTP Client

```dart
import 'package:http/http.dart' as http;
import 'dart:convert';

class WizzCentralApiClient {
  static const String baseUrl = 'https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev';
  String? _accessToken;

  void setAccessToken(String token) {
    _accessToken = token;
  }

  Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    if (_accessToken != null) 'Authorization': 'Bearer $_accessToken',
  };

  Future<List<dynamic>> getMerchants() async {
    final response = await http.get(
      Uri.parse('$baseUrl/merchants'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return data['merchants'];
    } else {
      throw Exception('Failed to load merchants');
    }
  }

  Future<Map<String, dynamic>> createOrder(Map<String, dynamic> orderData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/orders'),
      headers: _headers,
      body: json.encode(orderData),
    );

    if (response.statusCode == 201) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to create order');
    }
  }
}
```

## Testing

You can test the API endpoints using:

- Postman collection (can be provided)
- curl commands
- Your Flutter app's HTTP client

## Support

For any questions or issues with the API integration, please contact the development team or create an issue in the project repository.

---

**Last Updated:** January 2024
**API Version:** 1.0
**Environment:** Development
