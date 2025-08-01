# 🔄 FLUTTER MERCHANT APP REAL-TIME FIXES

## Issue: New orders don't appear until logout/login

Your merchant app is missing real-time notifications. Orders are being sent successfully to your backend, but the Flutter app doesn't know about them until manual refresh.

## 🚀 **Solution 1: Auto-Refresh Timer (Quick Fix)**

Add this to your Flutter app's order management screen:

```dart
class OrdersScreen extends StatefulWidget {
  @override
  _OrdersScreenState createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> {
  Timer? _refreshTimer;
  List<Order> orders = [];
  
  @override
  void initState() {
    super.initState();
    loadOrders();
    startAutoRefresh();
  }
  
  void startAutoRefresh() {
    _refreshTimer = Timer.periodic(Duration(seconds: 15), (timer) {
      loadOrders(); // Refresh orders every 15 seconds
    });
  }
  
  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }
  
  Future<void> loadOrders() async {
    try {
      final response = await http.get(
        Uri.parse('${Config.API_BASE_URL}/merchant/orders/${Config.BUSINESS_ID}'),
        headers: {'Authorization': 'Bearer ${await getJWTToken()}'},
      );
      
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        setState(() {
          orders = List<Order>.from(data['orders'].map((x) => Order.fromJson(x)));
        });
      }
    } catch (e) {
      print('Error loading orders: $e');
    }
  }
}
```

## 🚀 **Solution 2: Pull-to-Refresh (Better UX)**

```dart
RefreshIndicator(
  onRefresh: loadOrders,
  child: ListView.builder(
    itemCount: orders.length,
    itemBuilder: (context, index) => OrderCard(order: orders[index]),
  ),
)
```

## 🚀 **Solution 3: Push Notifications (Best Solution)**

### Step 1: Add Firebase to your Flutter app
```yaml
# pubspec.yaml
dependencies:
  firebase_messaging: ^14.7.10
  flutter_local_notifications: ^16.3.0
```

### Step 2: Initialize FCM
```dart
// main.dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  
  // Initialize notifications
  FirebaseMessaging messaging = FirebaseMessaging.instance;
  await messaging.requestPermission();
  
  // Get FCM token and send to your backend
  String? token = await messaging.getToken();
  await registerFCMToken(token);
  
  runApp(MyApp());
}

Future<void> registerFCMToken(String? token) async {
  if (token != null) {
    await http.post(
      Uri.parse('${Config.API_BASE_URL}/merchant/fcm-token'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ${await getJWTToken()}',
      },
      body: json.encode({
        'businessId': Config.BUSINESS_ID,
        'fcmToken': token,
        'platform': Platform.isIOS ? 'ios' : 'android',
      }),
    );
  }
}
```

### Step 3: Handle incoming notifications
```dart
// Listen for new orders
FirebaseMessaging.onMessage.listen((RemoteMessage message) {
  if (message.data['type'] == 'new_order') {
    // Show local notification
    showOrderNotification(message.data);
    // Refresh orders list
    loadOrders();
  }
});
```

## 🔧 **Solution 4: WebSocket Connection (Real-time)**

```dart
import 'package:web_socket_channel/web_socket_channel.dart';

class OrdersWebSocket {
  WebSocketChannel? _channel;
  
  void connect() {
    _channel = WebSocketChannel.connect(
      Uri.parse('wss://your-websocket-url/merchant/${Config.BUSINESS_ID}')
    );
    
    _channel!.stream.listen((data) {
      final message = json.decode(data);
      if (message['type'] == 'new_order') {
        // Handle new order
        onNewOrder(Order.fromJson(message['order']));
      }
    });
  }
  
  void onNewOrder(Order order) {
    // Add to orders list and refresh UI
    orders.insert(0, order);
    setState(() {});
    
    // Show notification
    showOrderNotification(order);
  }
}
```

## 🎯 **Recommended Approach**

1. **Immediate Fix**: Implement Solution 1 (Auto-refresh every 15-30 seconds)
2. **Short-term**: Add Solution 2 (Pull-to-refresh) for better UX
3. **Long-term**: Implement Solution 3 (Push notifications) for best user experience

## 📱 **Testing the Fix**

After implementing auto-refresh:

1. Generate new test orders using the Central Platform
2. Wait 15-30 seconds (based on your refresh interval)
3. New orders should appear automatically without logout/login

## 🔍 **Debugging**

If orders still don't appear, check:

1. **API Endpoint**: Ensure your app calls the correct endpoint
2. **Business ID**: Verify you're using the correct business ID: `7ccf646c-9594-48d4-8f63-c366d89257e5`
3. **JWT Token**: Make sure authentication is working
4. **Error Logging**: Add console logs to see any API errors

```dart
Future<void> loadOrders() async {
  try {
    print('🔄 Refreshing orders for business: ${Config.BUSINESS_ID}');
    
    final response = await http.get(
      Uri.parse('${Config.API_BASE_URL}/merchant/orders/${Config.BUSINESS_ID}'),
      headers: {'Authorization': 'Bearer ${await getJWTToken()}'},
    );
    
    print('📡 API Response: ${response.statusCode}');
    print('📦 Response body: ${response.body}');
    
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      print('✅ Found ${data['orders']?.length ?? 0} orders');
      
      setState(() {
        orders = List<Order>.from(data['orders'].map((x) => Order.fromJson(x)));
      });
    } else {
      print('❌ API Error: ${response.statusCode} - ${response.body}');
    }
  } catch (e) {
    print('💥 Exception loading orders: $e');
  }
}
```

## 🚀 **Quick Test**

Run this in your Central Platform to generate a test order:

```bash
cd /Users/ghaythallaheebi/wizzcentralplatform
node create-real-orders.mjs
```

Then check if it appears in your Flutter app within 15-30 seconds.
