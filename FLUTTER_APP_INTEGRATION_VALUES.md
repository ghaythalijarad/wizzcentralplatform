# 📱 MERCHANT APP INTEGRATION LOGIC & VALUES
## Complete Guide for Proper Flutter App Integration

---

## 🔄 **ORDER FLOW LOGIC**

### **Step 1: Customer Places Order**
Customer App → Central Platform → **Merchant App**

### **Step 2: Order Processing Flow**
```
1. Customer places order in Customer App
2. Central Platform receives order 
3. Central Platform sends order to YOUR Merchant App via webhook
4. YOUR Merchant App receives order and responds
5. YOUR Merchant App updates order status
6. Status updates flow back to Central Platform
7. Central Platform notifies Customer & Driver Apps
```

---

## 🎯 **CRITICAL VALUES FOR YOUR FLUTTER APP**

### **API Endpoints Your App Should Use:**
```dart
class ApiConfig {
  static const String baseUrl = 'https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev';
  
  // Your app reads orders from this endpoint
  static const String getOrdersEndpoint = '/merchant/orders/{businessId}';
  
  // Your app updates order status via these endpoints
  static const String acceptOrderEndpoint = '/merchant/order/{orderId}/accept';
  static const String rejectOrderEndpoint = '/merchant/order/{orderId}/reject';
  static const String updateStatusEndpoint = '/merchant/order/{orderId}/status';
  
  // Webhook endpoint that receives new orders (handled by backend)
  static const String webhookEndpoint = '/webhooks/orders';
}
```

### **Business ID to Use:**
```dart
class BusinessConfig {
  static const String businessId = 'MER001'; // This is YOUR merchant ID
  static const String businessName = 'Test Restaurant';
}
```

### **Order Status Values:**
```dart
enum OrderStatus {
  pending,     // Initial status when order arrives
  accepted,    // Merchant confirmed the order
  rejected,    // Merchant declined the order  
  preparing,   // Food is being prepared
  ready,       // Order ready for pickup/delivery
  picked_up,   // Driver collected the order
  out_for_delivery, // Driver is delivering
  delivered,   // Order completed
  cancelled    // Order cancelled
}
```

---

## 📋 **EXACT ORDER DATA STRUCTURE**

When your app fetches orders from the API, you'll receive this exact structure:

```dart
class Order {
  final String orderId;           // e.g., "ORD_1754059199118"
  final String customerId;        // e.g., "CUST001"
  final String customerName;      // e.g., "John Doe"
  final String customerPhone;     // e.g., "+1234567890"
  final String businessId;        // Always "MER001" for your app
  final double totalAmount;       // e.g., 37.96
  final String status;            // e.g., "pending"
  final String notes;             // e.g., "Please call when arrived"
  final DateTime createdAt;       // When order was placed
  final DateTime updatedAt;       // Last status update
  final DeliveryAddress deliveryAddress;
  final List<OrderItem> items;

  // Constructor and fromJson methods...
}

class DeliveryAddress {
  final String street;           // e.g., "123 Main Street"
  final String city;             // e.g., "New York"
  final String zipCode;          // e.g., "10001"
  final String? instructions;   // e.g., "Ring doorbell twice"
  final Coordinates? coordinates;
}

class Coordinates {
  final double latitude;         // e.g., 40.7128
  final double longitude;        // e.g., -74.0060
}

class OrderItem {
  final String productId;        // e.g., "PIZZA_001"
  final String name;             // e.g., "Margherita Pizza"
  final int quantity;            // e.g., 2
  final double price;            // e.g., 15.99
  final String? specialInstructions; // e.g., "Extra cheese, no olives"
}
```

---

## 🔧 **FLUTTER APP IMPLEMENTATION**

### **1. API Service Class:**
```dart
class MerchantApiService {
  static const String _baseUrl = 'https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev';
  static const String _businessId = 'MER001';

  // Fetch orders for your merchant
  Future<List<Order>> fetchOrders() async {
    final response = await http.get(
      Uri.parse('$_baseUrl/merchant/orders/$_businessId'),
      headers: {'Content-Type': 'application/json'},
    );

    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      final List<dynamic> ordersJson = data['orders'];
      return ordersJson.map((json) => Order.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load orders');
    }
  }

  // Accept an order
  Future<void> acceptOrder(String orderId, int estimatedMinutes) async {
    final response = await http.put(
      Uri.parse('$_baseUrl/merchant/order/$orderId/accept'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'estimatedCompletionTime': DateTime.now()
            .add(Duration(minutes: estimatedMinutes))
            .toIso8601String(),
      }),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to accept order');
    }
  }

  // Reject an order
  Future<void> rejectOrder(String orderId, String reason) async {
    final response = await http.put(
      Uri.parse('$_baseUrl/merchant/order/$orderId/reject'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'rejectionReason': reason}),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to reject order');
    }
  }

  // Update order status
  Future<void> updateOrderStatus(String orderId, String status) async {
    final response = await http.put(
      Uri.parse('$_baseUrl/merchant/order/$orderId/status'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'status': status}),
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to update order status');
    }
  }
}
```

### **2. Real-time Order Updates:**
```dart
class OrdersProvider extends ChangeNotifier {
  List<Order> _orders = [];
  Timer? _refreshTimer;

  List<Order> get orders => _orders;
  List<Order> get pendingOrders => _orders.where((o) => o.status == 'pending').toList();
  List<Order> get activeOrders => _orders.where((o) => ['accepted', 'preparing', 'ready'].contains(o.status)).toList();

  void startAutoRefresh() {
    _refreshTimer = Timer.periodic(Duration(seconds: 10), (_) {
      fetchOrders(); // Refresh every 10 seconds to get new orders
    });
  }

  void stopAutoRefresh() {
    _refreshTimer?.cancel();
  }

  Future<void> fetchOrders() async {
    try {
      _orders = await MerchantApiService().fetchOrders();
      notifyListeners();
    } catch (e) {
      // Handle error
    }
  }
}
```

### **3. Order Card Widget:**
```dart
class OrderCard extends StatelessWidget {
  final Order order;
  
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Order Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text('Order #${order.orderId}', style: TextStyle(fontWeight: FontWeight.bold)),
                StatusChip(status: order.status),
              ],
            ),
            SizedBox(height: 8),
            
            // Customer Info
            Text('Customer: ${order.customerName}'),
            Text('Phone: ${order.customerPhone}'),
            Text('Total: \$${order.totalAmount.toStringAsFixed(2)}'),
            SizedBox(height: 8),
            
            // Items
            Text('Items:', style: TextStyle(fontWeight: FontWeight.bold)),
            ...order.items.map((item) => 
              Text('${item.quantity}x ${item.name} - \$${item.price}')
            ),
            SizedBox(height: 8),
            
            // Delivery Address
            Text('Delivery: ${order.deliveryAddress.street}, ${order.deliveryAddress.city}'),
            if (order.notes.isNotEmpty)
              Text('Notes: ${order.notes}'),
            SizedBox(height: 16),
            
            // Action Buttons
            if (order.status == 'pending') ...[
              Row(
                children: [
                  ElevatedButton(
                    onPressed: () => _acceptOrder(order.orderId),
                    child: Text('Accept'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                  ),
                  SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: () => _rejectOrder(order.orderId),
                    child: Text('Reject'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                  ),
                ],
              ),
            ] else if (order.status == 'accepted') ...[
              ElevatedButton(
                onPressed: () => _updateStatus(order.orderId, 'preparing'),
                child: Text('Start Preparing'),
              ),
            ] else if (order.status == 'preparing') ...[
              ElevatedButton(
                onPressed: () => _updateStatus(order.orderId, 'ready'),
                child: Text('Mark Ready'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
```

---

## 📊 **CURRENT LIVE ORDERS IN YOUR APP**

Your app should currently show these **3 real orders**:

### **Order 1: ORD_1754059199118**
- Customer: John Doe (+1234567890)
- Items: 2x Margherita Pizza, 2x Coca Cola
- Total: $37.96
- Status: pending
- Address: 123 Main Street, New York 10001

### **Order 2: ORD_1754059201603**  
- Customer: Jane Smith (+1987654321)
- Items: 1x Deluxe Burger, 1x French Fries
- Total: $21.98
- Status: pending
- Address: 123 Main Street, New York 10001

### **Order 3: TEST_DIRECT_001**
- Customer: Test Customer
- Items: 1x Test Item
- Total: $10.99
- Status: pending

---

## 🔍 **DEBUGGING YOUR FLUTTER APP**

### **Check if your app is fetching correctly:**
```dart
void debugApiCall() async {
  try {
    final response = await http.get(
      Uri.parse('https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev/merchant/orders/MER001'),
    );
    print('API Response Status: ${response.statusCode}');
    print('API Response Body: ${response.body}');
  } catch (e) {
    print('API Error: $e');
  }
}
```

### **Common Issues to Check:**
1. **Internet permissions** in `android/app/src/main/AndroidManifest.xml`:
   ```xml
   <uses-permission android:name="android.permission.INTERNET" />
   ```

2. **HTTP Security** in `ios/Runner/Info.plist`:
   ```xml
   <key>NSAppTransportSecurity</key>
   <dict>
     <key>NSAllowsArbitraryLoads</key>
     <true/>
   </dict>
   ```

3. **Business ID**: Make sure you're using `"MER001"` exactly

4. **Auto-refresh**: Implement periodic refresh to see new orders

---

## ✅ **VERIFICATION CHECKLIST**

- [ ] API base URL: `https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev`
- [ ] Business ID: `MER001`
- [ ] Orders endpoint: `/merchant/orders/MER001`
- [ ] App shows 3 pending orders
- [ ] Accept/Reject buttons work
- [ ] Status updates work
- [ ] Auto-refresh enabled

**If your app shows these 3 orders, the integration is working perfectly!** 🎉
