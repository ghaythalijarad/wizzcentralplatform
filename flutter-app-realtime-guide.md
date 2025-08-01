# 📱 Flutter Merchant App Real-Time Integration Guide

## 🚨 **Problem**: Orders only appear after logout/login

Your Flutter merchant app needs to implement real-time order detection. Here are the solutions:

## 🚀 **Solution 1: Auto-Refresh Timer (Quick Fix - 5 minutes)**

### Add to your main orders screen:

```dart
class OrdersScreen extends StatefulWidget {
  @override
  _OrdersScreenState createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  Timer? _refreshTimer;
  List<Order> orders = [];
  bool isLoading = false;
  
  @override
  void initState() {
    super.initState();
    loadOrders();
    startAutoRefresh();
  }
  
  void startAutoRefresh() {
    _refreshTimer = Timer.periodic(Duration(seconds: 20), (timer) {
      if (!isLoading) {
        loadOrdersSilently(); // Don't show loading indicator for auto-refresh
      }
    });
  }
  
  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }
  
  Future<void> loadOrders() async {
    setState(() => isLoading = true);
    await _fetchOrders();
    setState(() => isLoading = false);
  }
  
  Future<void> loadOrdersSilently() async {
    await _fetchOrders();
  }
  
  Future<void> _fetchOrders() async {
    try {
      final response = await http.get(
        Uri.parse('https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev/merchant/orders/7ccf646c-9594-48d4-8f63-c366d89257e5'),
        headers: {
          'Authorization': 'Bearer ${await getJWTToken()}',
          'Content-Type': 'application/json',
        },
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final newOrders = List<Order>.from(data['orders'].map((x) => Order.fromJson(x)));
        
        // Check for new orders and show notification
        final currentOrderIds = orders.map((o) => o.orderId).toSet();
        final newOrderIds = newOrders.map((o) => o.orderId).toSet();
        final newOrdersFound = newOrderIds.difference(currentOrderIds);
        
        if (newOrdersFound.isNotEmpty && orders.isNotEmpty) {
          // Show notification for new orders
          _showNewOrderNotification(newOrdersFound.length);
          _playOrderSound();
        }
        
        setState(() {
          orders = newOrders;
        });
      }
    } catch (e) {
      print('Error loading orders: $e');
    }
  }
  
  void _showNewOrderNotification(int count) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('🆕 $count new order(s) received!'),
        backgroundColor: Colors.green,
        action: SnackBarAction(
          label: 'VIEW',
          onPressed: () {
            // Scroll to top to show new orders
          },
        ),
      ),
    );
  }
  
  void _playOrderSound() {
    // Add audio notification
    // You can use audioplayers package
    // AudioPlayer().play(AssetSource('sounds/new_order.mp3'));
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Orders (${orders.length})'),
        actions: [
          IconButton(
            icon: Icon(Icons.refresh),
            onPressed: loadOrders,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: loadOrders,
        child: isLoading && orders.isEmpty
            ? Center(child: CircularProgressIndicator())
            : ListView.builder(
                itemCount: orders.length,
                itemBuilder: (context, index) {
                  return OrderCard(order: orders[index]);
                },
              ),
      ),
    );
  }
}
```

## 🔔 **Solution 2: Push Notifications (15 minutes)**

### Step 1: Add dependencies
```yaml
# pubspec.yaml
dependencies:
  firebase_messaging: ^14.7.10
  flutter_local_notifications: ^16.3.0
  audioplayers: ^5.2.1
```

### Step 2: Initialize Firebase
```dart
// main.dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // Initialize FCM
  FirebaseMessaging messaging = FirebaseMessaging.instance;
  
  // Request permission
  NotificationSettings settings = await messaging.requestPermission(
    alert: true,
    announcement: false,
    badge: true,
    carPlay: false,
    criticalAlert: false,
    provisional: false,
    sound: true,
  );

  if (settings.authorizationStatus == AuthorizationStatus.authorized) {
    print('User granted permission');
    
    // Get FCM token
    String? token = await messaging.getToken();
    print('FCM Token: $token');
    
    // Send token to your backend
    await registerFCMToken(token);
    
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    
    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  }
  
  runApp(MyApp());
}

Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('Handling background message: ${message.messageId}');
}

void _handleForegroundMessage(RemoteMessage message) {
  print('Got a message in foreground!');
  print('Message data: ${message.data}');

  if (message.data['type'] == 'new_order') {
    // Show local notification
    _showLocalNotification(message);
    
    // Play sound
    AudioPlayer().play(AssetSource('sounds/new_order.mp3'));
    
    // Refresh orders if on orders screen
    if (ordersScreenKey.currentState != null) {
      ordersScreenKey.currentState!.loadOrders();
    }
  }
}

Future<void> registerFCMToken(String? token) async {
  if (token != null) {
    try {
      await http.post(
        Uri.parse('https://9lqviiloy8.execute-api.us-east-1.amazonaws.com/dev/api/merchant/fcm-token'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${await getJWTToken()}',
        },
        body: json.encode({
          'businessId': '7ccf646c-9594-48d4-8f63-c366d89257e5',
          'fcmToken': token,
          'platform': Platform.isIOS ? 'ios' : 'android',
        }),
      );
    } catch (e) {
      print('Error registering FCM token: $e');
    }
  }
}
```

## 🔧 **Solution 3: Polling with Smart Intervals (10 minutes)**

```dart
class SmartOrderPoller {
  Timer? _timer;
  int _pollInterval = 15; // Start with 15 seconds
  final int _maxInterval = 60; // Max 1 minute
  final int _minInterval = 10; // Min 10 seconds
  
  void startPolling(Function onNewOrders) {
    _timer?.cancel();
    _timer = Timer.periodic(Duration(seconds: _pollInterval), (timer) async {
      final hasNewOrders = await checkForNewOrders();
      
      if (hasNewOrders) {
        onNewOrders();
        _decreaseInterval(); // Poll more frequently when active
      } else {
        _increaseInterval(); // Poll less frequently when quiet
      }
    });
  }
  
  void _decreaseInterval() {
    if (_pollInterval > _minInterval) {
      _pollInterval = (_pollInterval * 0.8).round();
      _restartTimer();
    }
  }
  
  void _increaseInterval() {
    if (_pollInterval < _maxInterval) {
      _pollInterval = (_pollInterval * 1.2).round();
      _restartTimer();
    }
  }
  
  void _restartTimer() {
    _timer?.cancel();
    startPolling(_lastCallback);
  }
  
  void stop() {
    _timer?.cancel();
  }
}
```

## 🎯 **Recommended Implementation Order**

1. **Start with Solution 1** (Auto-refresh) - Get it working in 5 minutes
2. **Add Solution 2** (Push notifications) - For production-ready experience  
3. **Enhance with Solution 3** (Smart polling) - For optimization

## 🧪 **Testing**

1. Implement auto-refresh with 15-second interval
2. Open your Flutter app
3. Generate test order from Central Platform: 
   ```bash
   cd /Users/ghaythallaheebi/wizzcentralplatform
   node create-real-orders.mjs
   ```
4. Wait 15 seconds - new order should appear automatically!

## 🔍 **Debugging**

Add this to check if polling is working:

```dart
Future<void> _fetchOrders() async {
  print('🔄 Polling for orders at ${DateTime.now()}');
  
  try {
    final response = await http.get(
      Uri.parse('https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev/merchant/orders/7ccf646c-9594-48d4-8f63-c366d89257e5'),
      headers: {
        'Authorization': 'Bearer ${await getJWTToken()}',
        'Content-Type': 'application/json',
      },
    );
    
    print('📡 API Response: ${response.statusCode}');
    print('📦 Orders found: ${json.decode(response.body)['orders']?.length ?? 0}');
    
    // ... rest of your logic
  } catch (e) {
    print('❌ Error: $e');
  }
}
```

## 🎉 **Result**

After implementing auto-refresh, your merchant app will:
- ✅ Automatically detect new orders every 15-20 seconds
- ✅ Show notification when new orders arrive
- ✅ Play sound alerts
- ✅ Update UI without requiring logout/login
- ✅ Work reliably with your current backend setup
