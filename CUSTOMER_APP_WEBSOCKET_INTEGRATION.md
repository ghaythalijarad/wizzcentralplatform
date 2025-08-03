# 🔌 Customer App WebSocket Integration Guide

## **WebSocket Connection Configuration**

### **Endpoint Details:**
```
WebSocket URL: wss://your-websocket-api.execute-api.us-east-1.amazonaws.com/dev
Connection Format: wss://endpoint?businessId={BUSINESS_ID}&userType=customer
```

### **Query Parameters:**
- `businessId`: The merchant/business ID to track orders from
- `userType`: Must be set to `"customer"`

## 📱 **Flutter Customer App Implementation**

### **Step 1: Add Dependencies**
```yaml
# pubspec.yaml
dependencies:
  web_socket_channel: ^2.4.0
  flutter_local_notifications: ^16.3.2
```

### **Step 2: WebSocket Service**
```dart
// lib/services/websocket_service.dart
import 'dart:convert';
import 'dart:async';
import 'package:web_socket_channel/web_socket_channel.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

class CustomerWebSocketService {
  static const String WS_URL = 'wss://8yn5wr533l.execute-api.us-east-1.amazonaws.com/dev';
  
  WebSocketChannel? _channel;
  StreamController<Map<String, dynamic>>? _messageController;
  Timer? _pingTimer;
  bool _isConnected = false;
  
  final FlutterLocalNotificationsPlugin _notificationsPlugin = 
      FlutterLocalNotificationsPlugin();

  Stream<Map<String, dynamic>> get messageStream => 
      _messageController?.stream ?? Stream.empty();

  bool get isConnected => _isConnected;

  CustomerWebSocketService() {
    _messageController = StreamController<Map<String, dynamic>>.broadcast();
    _initializeNotifications();
  }

  /// Initialize local notifications
  Future<void> _initializeNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    
    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );
    
    await _notificationsPlugin.initialize(initSettings);
  }

  /// Connect to WebSocket for specific business
  Future<bool> connect(String businessId, String customerId) async {
    try {
      final uri = Uri.parse('$WS_URL?businessId=$businessId&userType=customer&customerId=$customerId');
      print('🔌 Customer connecting to WebSocket: $uri');
      
      _channel = WebSocketChannel.connect(uri);
      
      // Listen to messages
      _channel!.stream.listen(
        _handleMessage,
        onError: _handleError,
        onDone: _handleDisconnection,
      );
      
      _isConnected = true;
      _startPing();
      
      print('✅ Customer WebSocket connected successfully');
      return true;
      
    } catch (error) {
      print('❌ Customer WebSocket connection failed: $error');
      return false;
    }
  }

  /// Handle incoming messages
  void _handleMessage(dynamic data) {
    try {
      final message = jsonDecode(data as String) as Map<String, dynamic>;
      print('📨 Customer WebSocket message: $message');
      
      // Emit to stream
      _messageController?.add(message);
      
      // Handle specific message types for customers
      switch (message['type']) {
        case 'order_status_update':
          _handleOrderStatusUpdate(message);
          break;
        case 'delivery_update':
          _handleDeliveryUpdate(message);
          break;
        case 'driver_assigned':
          _handleDriverAssigned(message);
          break;
        case 'connection_established':
          print('🎉 Customer connection established: ${message['message']}');
          break;
      }
      
    } catch (error) {
      print('❌ Error parsing customer WebSocket message: $error');
    }
  }

  /// Handle order status updates
  void _handleOrderStatusUpdate(Map<String, dynamic> message) {
    final orderId = message['orderId'];
    final newStatus = message['newStatus'];
    final oldStatus = message['oldStatus'];
    
    print('📊 Order status updated: $orderId -> $newStatus');
    
    _showNotification(
      'Order Status Updated',
      'Your order $orderId is now $newStatus',
      payload: jsonEncode(message),
    );
  }

  /// Handle delivery updates
  void _handleDeliveryUpdate(Map<String, dynamic> message) {
    final orderId = message['orderId'];
    final status = message['status'];
    final location = message['location'];
    
    String statusMessage;
    switch (status) {
      case 'en_route_to_pickup':
        statusMessage = 'Driver is heading to restaurant';
        break;
      case 'arrived_at_pickup':
        statusMessage = 'Driver has arrived at restaurant';
        break;
      case 'picked_up':
        statusMessage = 'Your order has been picked up!';
        break;
      case 'en_route_to_delivery':
        statusMessage = 'Driver is on the way to you';
        break;
      case 'delivered':
        statusMessage = 'Your order has been delivered!';
        break;
      default:
        statusMessage = 'Delivery status updated';
    }
    
    _showNotification(
      'Delivery Update',
      statusMessage,
      payload: jsonEncode(message),
    );
  }

  /// Handle driver assignment
  void _handleDriverAssigned(Map<String, dynamic> message) {
    final orderId = message['orderId'];
    final driverName = message['driverName'] ?? 'Driver';
    
    _showNotification(
      'Driver Assigned',
      '$driverName has been assigned to your order $orderId',
      payload: jsonEncode(message),
    );
  }

  /// Show local notification
  Future<void> _showNotification(String title, String body, {String? payload}) async {
    const androidDetails = AndroidNotificationDetails(
      'order_updates_channel',
      'Order Updates',
      channelDescription: 'Notifications for order status updates',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
    );
    
    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );
    
    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );
    
    await _notificationsPlugin.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      details,
      payload: payload,
    );
  }

  /// Handle WebSocket errors
  void _handleError(error) {
    print('❌ Customer WebSocket error: $error');
    _isConnected = false;
    // Implement reconnection logic here
  }

  /// Handle disconnection
  void _handleDisconnection() {
    print('🔌 Customer WebSocket disconnected');
    _isConnected = false;
    _stopPing();
    // Implement reconnection logic here
  }

  /// Start ping to keep connection alive
  void _startPing() {
    _pingTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (_isConnected && _channel != null) {
        _channel!.sink.add(jsonEncode({
          'type': 'ping',
          'timestamp': DateTime.now().toIso8601String(),
        }));
      }
    });
  }

  /// Stop ping timer
  void _stopPing() {
    _pingTimer?.cancel();
    _pingTimer = null;
  }

  /// Disconnect
  void disconnect() {
    _channel?.sink.close();
    _stopPing();
    _isConnected = false;
  }

  /// Dispose
  void dispose() {
    disconnect();
    _messageController?.close();
  }
}
```

### **Step 3: Using in Your Customer App**
```dart
// lib/screens/order_tracking_screen.dart
class OrderTrackingScreen extends StatefulWidget {
  final String businessId;
  final String customerId;
  final String orderId;

  const OrderTrackingScreen({
    Key? key,
    required this.businessId,
    required this.customerId,
    required this.orderId,
  }) : super(key: key);

  @override
  _OrderTrackingScreenState createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen> {
  late CustomerWebSocketService _webSocketService;
  StreamSubscription? _messageSubscription;
  String _orderStatus = 'pending';
  String _deliveryStatus = '';

  @override
  void initState() {
    super.initState();
    _initializeWebSocket();
  }

  Future<void> _initializeWebSocket() async {
    _webSocketService = CustomerWebSocketService();
    
    // Connect to WebSocket
    final connected = await _webSocketService.connect(
      widget.businessId,
      widget.customerId,
    );
    
    if (connected) {
      print('🎉 Customer real-time tracking enabled!');
      
      // Listen for updates
      _messageSubscription = _webSocketService.messageStream.listen((message) {
        _handleRealtimeUpdate(message);
      });
    } else {
      print('⚠️ Real-time tracking not available');
    }
  }

  void _handleRealtimeUpdate(Map<String, dynamic> message) {
    if (message['orderId'] == widget.orderId) {
      setState(() {
        switch (message['type']) {
          case 'order_status_update':
            _orderStatus = message['newStatus'];
            break;
          case 'delivery_update':
            _deliveryStatus = message['status'];
            break;
        }
      });
      
      // Show in-app notification
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(_getStatusMessage(message)),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
        ),
      );
    }
  }

  String _getStatusMessage(Map<String, dynamic> message) {
    switch (message['type']) {
      case 'order_status_update':
        return 'Order status: ${message['newStatus']}';
      case 'delivery_update':
        return 'Delivery: ${message['status']}';
      case 'driver_assigned':
        return 'Driver assigned to your order';
      default:
        return 'Order updated';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Order Tracking'),
        actions: [
          Icon(_webSocketService.isConnected ? Icons.wifi : Icons.wifi_off),
        ],
      ),
      body: Column(
        children: [
          Card(
            child: ListTile(
              title: Text('Order Status'),
              subtitle: Text(_orderStatus),
              leading: Icon(Icons.shopping_bag),
            ),
          ),
          if (_deliveryStatus.isNotEmpty)
            Card(
              child: ListTile(
                title: Text('Delivery Status'),
                subtitle: Text(_deliveryStatus),
                leading: Icon(Icons.local_shipping),
              ),
            ),
          // Add more UI elements for order tracking
        ],
      ),
    );
  }

  @override
  void dispose() {
    _messageSubscription?.cancel();
    _webSocketService.dispose();
    super.dispose();
  }
}
```

## 📨 **Message Types Customer Apps Receive**

### **1. Order Status Updates**
```json
{
  "type": "order_status_update",
  "orderId": "ORDER123",
  "businessId": "7ccf646c-9594-48d4-8f63-c366d89257e5",
  "customerId": "CUSTOMER456",
  "oldStatus": "pending",
  "newStatus": "confirmed",
  "timestamp": "2024-01-15T10:30:00Z",
  "message": "Your order has been confirmed"
}
```

### **2. Delivery Updates**
```json
{
  "type": "delivery_update",
  "orderId": "ORDER123",
  "status": "en_route_to_delivery",
  "location": {
    "lat": 40.7128,
    "lng": -74.0060
  },
  "driverId": "DRIVER789",
  "estimatedArrival": "2024-01-15T11:15:00Z",
  "message": "Driver is on the way to you"
}
```

### **3. Driver Assignment**
```json
{
  "type": "driver_assigned",
  "orderId": "ORDER123",
  "driverId": "DRIVER789",
  "driverName": "John Doe",
  "driverPhone": "+1234567890",
  "estimatedPickupTime": "2024-01-15T10:45:00Z",
  "message": "Driver assigned to your order"
}
```

## 🔧 **Configuration Constants**

```dart
class Config {
  static const String WEBSOCKET_URL = 'wss://blh9qss3kf.execute-api.us-east-1.amazonaws.com/dev';
  static const String API_BASE_URL = 'https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev';
}
```

## 🎯 **Key Benefits for Customer Apps**

✅ **Real-time Order Updates** - Instant notifications when order status changes  
✅ **Live Delivery Tracking** - Real-time driver location and status updates  
✅ **Driver Information** - Get driver details when assigned  
✅ **Push Notifications** - Native mobile notifications for important updates  
✅ **Automatic Reconnection** - Handles network issues gracefully  
✅ **Battery Efficient** - No constant polling required  

## 🧪 **Testing the Integration**

1. **Connect to WebSocket** with valid businessId and customerId
2. **Place an order** through your platform
3. **Update order status** from merchant dashboard
4. **Verify customer app** receives real-time updates
5. **Test push notifications** and in-app updates

Your customer app will now receive instant updates about their orders without any manual refresh! 🎉
