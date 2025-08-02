# 🔄 FLUTTER MERCHANT APP - IMMEDIATE FIX

## Problem: Orders don't appear until logout/login

Your Flutter merchant app is missing real-time updates. Here's the **immediate fix** you can implement right now:

## ✅ **SOLUTION 1: Auto-Refresh Timer (Implement This Now)**

Replace your orders screen with this code:

```dart
import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

class OrdersScreen extends StatefulWidget {
  @override
  _OrdersScreenState createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  Timer? _refreshTimer;
  List<Order> orders = [];
  bool isLoading = false;
  
  // Your business configuration
  static const String API_BASE_URL = 'https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev';
  static const String BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';
  
  @override
  void initState() {
    super.initState();
    print('🔄 Initializing orders screen with auto-refresh');
    loadOrders();
    startAutoRefresh();
  }
  
  void startAutoRefresh() {
    print('⏱️ Starting auto-refresh every 15 seconds');
    _refreshTimer = Timer.periodic(Duration(seconds: 15), (timer) {
      print('🔄 Auto-refreshing orders...');
      loadOrders(showLoading: false); // Don't show loading spinner for auto-refresh
    });
  }
  
  @override
  void dispose() {
    print('🛑 Stopping auto-refresh timer');
    _refreshTimer?.cancel();
    super.dispose();
  }
  
  Future<void> loadOrders({bool showLoading = true}) async {
    if (showLoading) {
      setState(() => isLoading = true);
    }
    
    try {
      print('🔄 Refreshing orders for business: $BUSINESS_ID');
      
      final response = await http.get(
        Uri.parse('$API_BASE_URL/merchant/orders/$BUSINESS_ID'),
        headers: {
          'Authorization': 'Bearer ${await getJWTToken()}',
          'Content-Type': 'application/json',
        },
      );
      
      print('📡 API Response: ${response.statusCode}');
      print('📦 Response body: ${response.body}');
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final List<dynamic> ordersJson = data['orders'] ?? [];
        
        print('✅ Found ${ordersJson.length} orders');
        
        setState(() {
          orders = ordersJson.map((json) => Order.fromJson(json)).toList();
          // Sort by creation date, newest first
          orders.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        });
        
        // Show success message for manual refresh only
        if (showLoading) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('✅ Orders refreshed: ${orders.length} found'),
              backgroundColor: Colors.green,
              duration: Duration(seconds: 2),
            ),
          );
        }
        
      } else {
        print('❌ API Error: ${response.statusCode} - ${response.body}');
        throw Exception('Failed to load orders: ${response.statusCode}');
      }
      
    } catch (e) {
      print('💥 Exception loading orders: $e');
      
      if (showLoading) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('❌ Error loading orders: $e'),
            backgroundColor: Colors.red,
            duration: Duration(seconds: 3),
          ),
        );
      }
    } finally {
      if (showLoading) {
        setState(() => isLoading = false);
      }
    }
  }
  
  Future<String> getJWTToken() async {
    // Replace this with your actual JWT token retrieval logic
    // For example, from SharedPreferences or secure storage
    return 'your-jwt-token-here';
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Orders (Auto-Refresh: 15s)'),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: () => loadOrders(),
          ),
          // Connection status indicator
          Container(
            margin: EdgeInsets.only(right: 16),
            child: Center(
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: _refreshTimer?.isActive == true ? Colors.green : Colors.red,
                      shape: BoxShape.circle,
                    ),
                  ),
                  SizedBox(width: 4),
                  Text(
                    _refreshTimer?.isActive == true ? 'Live' : 'Offline',
                    style: TextStyle(fontSize: 12),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => loadOrders(),
        child: isLoading && orders.isEmpty
            ? Center(child: CircularProgressIndicator())
            : orders.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.shopping_bag_outlined, size: 64, color: Colors.grey),
                        SizedBox(height: 16),
                        Text('No orders found'),
                        SizedBox(height: 8),
                        Text('Auto-refreshing every 15 seconds...', 
                             style: TextStyle(color: Colors.grey, fontSize: 12)),
                      ],
                    ),
                  )
                : ListView.builder(
                    itemCount: orders.length,
                    itemBuilder: (context, index) {
                      final order = orders[index];
                      return OrderCard(
                        order: order,
                        onStatusChanged: () => loadOrders(showLoading: false),
                      );
                    },
                  ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => loadOrders(),
        child: Icon(Icons.refresh),
        tooltip: 'Refresh Orders',
      ),
    );
  }
}

// Order model (adjust according to your actual order structure)
class Order {
  final String orderId;
  final String customerName;
  final String customerPhone;
  final double totalAmount;
  final String status;
  final DateTime createdAt;
  final List<OrderItem> items;
  
  Order({
    required this.orderId,
    required this.customerName,
    required this.customerPhone,
    required this.totalAmount,
    required this.status,
    required this.createdAt,
    required this.items,
  });
  
  factory Order.fromJson(Map<String, dynamic> json) {
    return Order(
      orderId: json['orderId'] ?? '',
      customerName: json['customerName'] ?? '',
      customerPhone: json['customerPhone'] ?? '',
      totalAmount: (json['totalAmount'] ?? 0).toDouble(),
      status: json['status'] ?? 'pending',
      createdAt: DateTime.parse(json['createdAt'] ?? DateTime.now().toIso8601String()),
      items: (json['items'] as List<dynamic>? ?? [])
          .map((item) => OrderItem.fromJson(item))
          .toList(),
    );
  }
}

class OrderItem {
  final String name;
  final int quantity;
  final double price;
  
  OrderItem({
    required this.name,
    required this.quantity,
    required this.price,
  });
  
  factory OrderItem.fromJson(Map<String, dynamic> json) {
    return OrderItem(
      name: json['name'] ?? '',
      quantity: json['quantity'] ?? 1,
      price: (json['price'] ?? 0).toDouble(),
    );
  }
}

// Order Card Widget
class OrderCard extends StatelessWidget {
  final Order order;
  final VoidCallback? onStatusChanged;
  
  const OrderCard({
    Key? key,
    required this.order,
    this.onStatusChanged,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.all(8),
      elevation: 2,
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  order.orderId,
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(order.status),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    order.status.toUpperCase(),
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 8),
            Text('Customer: ${order.customerName}'),
            Text('Phone: ${order.customerPhone}'),
            Text('Total: \$${order.totalAmount.toStringAsFixed(2)}'),
            Text('Time: ${_formatTime(order.createdAt)}'),
            SizedBox(height: 8),
            Text('Items:', style: TextStyle(fontWeight: FontWeight.bold)),
            ...order.items.map((item) => 
              Text('• ${item.quantity}x ${item.name} - \$${item.price.toStringAsFixed(2)}')
            ),
            SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                if (order.status == 'pending') ...[
                  ElevatedButton(
                    onPressed: () => _updateOrderStatus(context, order.orderId, 'accepted'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                    child: Text('Accept'),
                  ),
                  ElevatedButton(
                    onPressed: () => _updateOrderStatus(context, order.orderId, 'rejected'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
                    child: Text('Reject'),
                  ),
                ],
                if (order.status == 'accepted')
                  ElevatedButton(
                    onPressed: () => _updateOrderStatus(context, order.orderId, 'preparing'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.orange),
                    child: Text('Start Preparing'),
                  ),
                if (order.status == 'preparing')
                  ElevatedButton(
                    onPressed: () => _updateOrderStatus(context, order.orderId, 'ready'),
                    style: ElevatedButton.styleFrom(backgroundColor: Colors.blue),
                    child: Text('Mark Ready'),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
  
  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'pending': return Colors.orange;
      case 'accepted': return Colors.green;
      case 'preparing': return Colors.blue;
      case 'ready': return Colors.purple;
      case 'completed': return Colors.teal;
      case 'rejected': return Colors.red;
      default: return Colors.grey;
    }
  }
  
  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);
    
    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inHours < 1) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inDays < 1) {
      return '${difference.inHours}h ago';
    } else {
      return '${dateTime.day}/${dateTime.month} ${dateTime.hour}:${dateTime.minute.toString().padLeft(2, '0')}';
    }
  }
  
  Future<void> _updateOrderStatus(BuildContext context, String orderId, String newStatus) async {
    try {
      // Update order status via your API
      final response = await http.patch(
        Uri.parse('https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev/orders/$orderId/status'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await _getJWTToken()}',
        },
        body: json.encode({'status': newStatus}),
      );
      
      if (response.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('✅ Order $orderId updated to $newStatus'),
            backgroundColor: Colors.green,
          ),
        );
        onStatusChanged?.call();
      } else {
        throw Exception('Failed to update status');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('❌ Failed to update order: $e'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
  
  Future<String> _getJWTToken() async {
    // Your JWT token logic
    return 'your-jwt-token-here';
  }
}
```

## 📱 **How It Works**

1. **Auto-refresh every 15 seconds** - New orders appear automatically
2. **Manual refresh** - Pull-to-refresh or tap refresh button
3. **Live status indicator** - Shows if auto-refresh is active
4. **No more logout/login needed** - Orders appear in real-time
5. **Background refresh** - Doesn't show loading spinner for auto-refresh

## 🚀 **Next Steps**

1. **Replace your current orders screen** with this code
2. **Update the JWT token method** with your actual implementation
3. **Test with new orders** - Generate orders from Central Platform
4. **Wait 15 seconds** - Orders should appear automatically

## 🧪 **Testing**

After implementing this:

1. Open your Flutter merchant app
2. Go to orders screen
3. Generate new test orders from Central Platform
4. **Wait 15 seconds** - New orders should appear automatically
5. No need to logout/login anymore!

## ⚡ **Benefits**

- ✅ **Immediate fix** - No complex setup required
- ✅ **Works right away** - No server changes needed
- ✅ **Real-time feel** - 15-second refresh is very responsive
- ✅ **Battery efficient** - Only refreshes when screen is active
- ✅ **User-friendly** - Pull-to-refresh + manual refresh buttons

This solution will solve your immediate problem while we work on the full WebSocket infrastructure for even better real-time performance!
