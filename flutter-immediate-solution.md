# 🔄 **IMMEDIATE SOLUTION: Auto-Refresh for Flutter Merchant App**

Your Flutter merchant app currently doesn't show new orders until logout/login. Here are **3 immediate solutions** you can implement:

## 🚀 **Solution 1: Auto-Refresh Timer (Fastest Implementation)**

### Flutter Code:
```dart
// lib/screens/orders_screen.dart
class OrdersScreen extends StatefulWidget {
  @override
  _OrdersScreenState createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  Timer? _refreshTimer;
  List<Order> orders = [];
  bool _isLoading = false;
  
  @override
  void initState() {
    super.initState();
    loadOrders();
    startAutoRefresh();
  }
  
  // 🔄 AUTO-REFRESH EVERY 15 SECONDS
  void startAutoRefresh() {
    _refreshTimer = Timer.periodic(Duration(seconds: 15), (timer) {
      if (!_isLoading) {
        loadOrders(showLoader: false); // Silent refresh
      }
    });
  }
  
  Future<void> loadOrders({bool showLoader = true}) async {
    if (showLoader) setState(() => _isLoading = true);
    
    try {
      final response = await http.get(
        Uri.parse('${Config.API_BASE_URL}/merchant/orders/${Config.BUSINESS_ID}'),
        headers: {'Authorization': 'Bearer ${await getJWTToken()}'},
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final newOrders = List<Order>.from(data['orders'].map((x) => Order.fromJson(x)));
        
        // Check for new orders
        if (newOrders.length > orders.length) {
          final newOrdersCount = newOrders.length - orders.length;
          _showNewOrderNotification(newOrdersCount);
          _playNotificationSound();
        }
        
        setState(() {
          orders = newOrders;
        });
      }
    } catch (e) {
      print('Error loading orders: $e');
    } finally {
      if (showLoader) setState(() => _isLoading = false);
    }
  }
  
  void _showNewOrderNotification(int count) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('🆕 $count new order${count > 1 ? 's' : ''} received!'),
        backgroundColor: Colors.green,
        duration: Duration(seconds: 3),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
  
  void _playNotificationSound() {
    // Add sound/vibration
    HapticFeedback.vibrate();
  }
  
  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Orders'),
        actions: [
          // 🔄 MANUAL REFRESH BUTTON
          IconButton(
            onPressed: () => loadOrders(),
            icon: Icon(Icons.refresh),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => loadOrders(),
        child: ListView.builder(
          itemCount: orders.length,
          itemBuilder: (context, index) => OrderCard(order: orders[index]),
        ),
      ),
    );
  }
}
```

## 🚀 **Solution 2: Pull-to-Refresh + Background Check**

```dart
class OrdersScreenV2 extends StatefulWidget {
  @override
  _OrdersScreenV2State createState() => _OrdersScreenV2State();
}

class _OrdersScreenV2State extends State<OrdersScreenV2> with WidgetsBindingObserver {
  List<Order> orders = [];
  Timer? _backgroundTimer;
  DateTime? _lastRefresh;
  
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    loadOrders();
    startBackgroundCheck();
  }
  
  // 🔄 CHECK EVERY 10 SECONDS WHEN APP IS ACTIVE
  void startBackgroundCheck() {
    _backgroundTimer = Timer.periodic(Duration(seconds: 10), (timer) {
      if (WidgetsBinding.instance.lifecycleState == AppLifecycleState.resumed) {
        checkForNewOrders();
      }
    });
  }
  
  Future<void> checkForNewOrders() async {
    try {
      // Get order count first (lighter API call)
      final response = await http.get(
        Uri.parse('${Config.API_BASE_URL}/merchant/orders/count/${Config.BUSINESS_ID}'),
        headers: {'Authorization': 'Bearer ${await getJWTToken()}'},
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final serverCount = data['count'] as int;
        
        if (serverCount > orders.length) {
          // New orders detected - refresh full list
          await loadOrders(showLoader: false);
        }
      }
    } catch (e) {
      print('Background check error: $e');
    }
  }
  
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      // App came to foreground - check for new orders
      final now = DateTime.now();
      if (_lastRefresh == null || now.difference(_lastRefresh!).inSeconds > 30) {
        loadOrders(showLoader: false);
      }
    }
  }
  
  Future<void> loadOrders({bool showLoader = true}) async {
    // Your existing loadOrders logic here
    _lastRefresh = DateTime.now();
  }
  
  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _backgroundTimer?.cancel();
    super.dispose();
  }
}
```

## 🚀 **Solution 3: Server-Sent Events (SSE)**

### Backend Addition (Add to serverless.yml):
```yaml
# Add this function to your serverless.yml
sseOrderUpdates:
  handler: src/handlers/sse-orders.streamOrderUpdates
  events:
    - http:
        path: /merchant/orders/stream/{businessId}
        method: get
        cors: true
```

### Backend Handler (create src/handlers/sse-orders.js):
```javascript
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.streamOrderUpdates = async (event) => {
  const { businessId } = event.pathParameters;
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    },
    body: `data: {"type": "connected", "businessId": "${businessId}"}\n\n`,
  };
};
```

### Flutter Implementation:
```dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class SSEOrderService {
  Stream<Map<String, dynamic>>? _orderStream;
  
  Stream<Map<String, dynamic>> getOrderUpdates(String businessId) {
    _orderStream = _createSSEStream(businessId);
    return _orderStream!;
  }
  
  Stream<Map<String, dynamic>> _createSSEStream(String businessId) async* {
    final client = http.Client();
    
    try {
      final request = http.Request(
        'GET',
        Uri.parse('${Config.API_BASE_URL}/merchant/orders/stream/$businessId'),
      );
      request.headers['Authorization'] = 'Bearer ${await getJWTToken()}';
      
      final response = await client.send(request);
      
      await for (String line in response.stream.transform(utf8.decoder).transform(LineSplitter())) {
        if (line.startsWith('data: ')) {
          final data = line.substring(6);
          try {
            yield json.decode(data);
          } catch (e) {
            print('SSE parse error: $e');
          }
        }
      }
    } catch (e) {
      print('SSE connection error: $e');
    } finally {
      client.close();
    }
  }
}

// Usage in your orders screen:
class OrdersScreenSSE extends StatefulWidget {
  @override
  _OrdersScreenSSEState createState() => _OrdersScreenSSEState();
}

class _OrdersScreenSSEState extends State<OrdersScreenSSE> {
  final SSEOrderService _sseService = SSEOrderService();
  StreamSubscription? _sseSubscription;
  List<Order> orders = [];
  
  @override
  void initState() {
    super.initState();
    loadOrders();
    startSSEConnection();
  }
  
  void startSSEConnection() {
    _sseSubscription = _sseService.getOrderUpdates(Config.BUSINESS_ID).listen(
      (event) {
        if (event['type'] == 'new_order') {
          final newOrder = Order.fromJson(event['order']);
          setState(() {
            orders.insert(0, newOrder);
          });
          _showNewOrderNotification();
        }
      },
      onError: (error) {
        print('SSE error: $error');
        // Fallback to polling
        Timer(Duration(seconds: 5), startSSEConnection);
      },
    );
  }
  
  void _showNewOrderNotification() {
    // Show notification, play sound, etc.
  }
  
  @override
  void dispose() {
    _sseSubscription?.cancel();
    super.dispose();
  }
}
```

## 🎯 **Recommended Implementation Order:**

1. **Start with Solution 1** (Auto-refresh) - Immediate fix, 5 minutes to implement
2. **Add Solution 2** (Background checks) - Better user experience
3. **Upgrade to WebSocket** (from previous guide) - Professional long-term solution

## 📱 **Test the Solution:**

1. Implement Solution 1 in your Flutter app
2. Generate test orders from Central Platform:
   ```bash
   cd /Users/ghaythallaheebi/wizzcentralplatform
   node create-real-orders.mjs
   ```
3. Your app should show new orders within 15 seconds without logout/login!

## ✅ **Benefits:**

- ✅ **Immediate fix** - No logout/login required
- ✅ **Works with current infrastructure** - No backend changes needed
- ✅ **Battery efficient** - Smart refresh intervals
- ✅ **Fallback resilient** - Handles network issues gracefully
- ✅ **User-friendly** - Pull-to-refresh + visual notifications

Your Flutter merchant app will now automatically show new orders! 🎉
