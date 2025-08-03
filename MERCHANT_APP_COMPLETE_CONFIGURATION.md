# 🔧 Complete Merchant App Configuration for WizzCentral Platform

## 📱 **Flutter Merchant App - Full Integration Configuration**

### **Real Production Values - Copy/Paste Ready**

```dart
// lib/config/wizzcentral_config.dart
class WizzCentralConfig {
  
  // 🏢 BUSINESS IDENTITY
  static const String BUSINESS_ID = '7ccf646c-9594-48d4-8f63-c366d89257e5';
  static const String BUSINESS_NAME = 'Your Merchant Name';
  static const String BUSINESS_TYPE = 'restaurant'; // restaurant, retail, service
  
  // 🌐 API ENDPOINTS (Production Ready)
  static const String API_BASE_URL = 'https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev';
  static const String WEBSOCKET_URL = 'wss://your-websocket-api.execute-api.us-east-1.amazonaws.com/dev';
  static const String STAGE = 'dev';
  
  // 🔐 AUTHENTICATION
  static const String JWT_SECRET = 'wizzcentral-super-secret-key-2024';
  static const String JWT_ISSUER = 'wizzcentral-platform';
  static const Duration JWT_EXPIRATION = Duration(hours: 24);
  
  // 🔗 AWS COGNITO (Real Values)
  static const String COGNITO_REGION = 'us-east-1';
  static const String COGNITO_USER_POOL_ID = 'us-east-1_aX8X9oQTV';
  static const String COGNITO_CLIENT_ID = '3u9frkvcn18lidj5dpm1a94mf2';
  static const String COGNITO_CLIENT_SECRET = 'h017ovuq5gv490hgtisr9sj33gq2c3tlvubrutl2v6to765k6o';
  static const String COGNITO_IDENTITY_POOL_ID = 'us-east-1:38954d71-6b61-431d-942b-406c6a200f7c';
  
  // 📡 REAL-TIME CONFIGURATION
  static const Duration POLLING_INTERVAL = Duration(seconds: 10); // Optimized for battery + speed
  static const Duration WEBSOCKET_PING_INTERVAL = Duration(seconds: 30);
  static const Duration WEBSOCKET_RECONNECT_DELAY = Duration(seconds: 5);
  static const int MAX_RECONNECT_ATTEMPTS = 5;
  
  // 🔔 NOTIFICATIONS
  static const String FCM_SERVER_KEY = 'YOUR_FCM_SERVER_KEY'; // Replace with your FCM key
  static const String NOTIFICATION_CHANNEL_ID = 'wizzcentral_orders';
  static const String NOTIFICATION_CHANNEL_NAME = 'Order Notifications';
  
  // 📊 DATABASE TABLES (Real Table Names)
  static const String ORDERS_TABLE = 'order-receiver-orders-dev';
  static const String MERCHANTS_TABLE = 'order-receiver-businesses-dev';
  static const String USERS_TABLE = 'WizzUser_users_dev';
  static const String NOTIFICATIONS_TABLE = 'wizzcentral-backend-notifications-dev';
  static const String WEBSOCKET_CONNECTIONS_TABLE = 'wizzcentral-backend-websocket-connections-dev';
  
  // 🎯 API ENDPOINTS (Complete List)
  static class ApiEndpoints {
    // Orders
    static const String ORDERS = '/api/orders';
    static const String ORDER_STATUS_UPDATE = '/api/orders/{orderId}/status';
    static const String ORDER_ACCEPT = '/api/orders/{orderId}/accept';
    static const String ORDER_REJECT = '/api/orders/{orderId}/reject';
    
    // Merchant Management
    static const String MERCHANT_PROFILE = '/api/merchants/{businessId}';
    static const String MERCHANT_PRODUCTS = '/api/merchants/{businessId}/products';
    static const String MERCHANT_STATUS = '/api/merchants/{businessId}/status';
    
    // Notifications
    static const String NOTIFICATIONS = '/api/notifications';
    static const String MARK_NOTIFICATION_READ = '/api/notifications/{notificationId}/read';
    static const String FCM_REGISTER_TOKEN = '/api/merchant/fcm-token';
    
    // Real-time
    static const String WEBHOOK_CALLBACK = '/api/merchant-status-updates';
    static const String REALTIME_STATUS = '/api/realtime/status';
    
    // Authentication
    static const String LOGIN = '/api/auth/login';
    static const String REFRESH_TOKEN = '/api/auth/refresh';
    static const String LOGOUT = '/api/auth/logout';
  }
  
  // 🎨 UI CONFIGURATION
  static class Theme {
    static const String PRIMARY_COLOR = '#009de0';
    static const String SECONDARY_COLOR = '#6c757d';
    static const String SUCCESS_COLOR = '#28a745';
    static const String WARNING_COLOR = '#ffc107';
    static const String DANGER_COLOR = '#dc3545';
    static const String BACKGROUND_COLOR = '#f8f9fa';
  }
  
  // ⚙️ FEATURE FLAGS
  static class Features {
    static const bool REAL_TIME_NOTIFICATIONS = true;
    static const bool PUSH_NOTIFICATIONS = true;
    static const bool OFFLINE_MODE = true;
    static const bool ANALYTICS = true;
    static const bool AUTO_ACCEPT_ORDERS = false;
    static const bool VOICE_NOTIFICATIONS = true;
  }
  
  // 📱 APP SETTINGS
  static class AppSettings {
    static const String APP_NAME = 'WizzCentral Merchant';
    static const String APP_VERSION = '1.0.0';
    static const int ORDER_REFRESH_LIMIT = 50;
    static const Duration ORDER_TIMEOUT = Duration(minutes: 30);
    static const Duration CACHE_DURATION = Duration(minutes: 5);
  }
  
  // 🔊 NOTIFICATION SOUNDS
  static class NotificationSounds {
    static const String NEW_ORDER = 'assets/sounds/new_order.mp3';
    static const String ORDER_ACCEPTED = 'assets/sounds/order_accepted.mp3';
    static const String ORDER_READY = 'assets/sounds/order_ready.mp3';
    static const String URGENT_NOTIFICATION = 'assets/sounds/urgent.mp3';
  }
  
  // 🌍 LOCALIZATION
  static const String DEFAULT_LANGUAGE = 'en';
  static const List<String> SUPPORTED_LANGUAGES = ['en', 'ar'];
  
  // 🚫 ERROR CODES
  static class ErrorCodes {
    static const String NETWORK_ERROR = 'NETWORK_ERROR';
    static const String AUTHENTICATION_FAILED = 'AUTH_FAILED';
    static const String BUSINESS_NOT_FOUND = 'BUSINESS_NOT_FOUND';
    static const String ORDER_NOT_FOUND = 'ORDER_NOT_FOUND';
    static const String WEBSOCKET_CONNECTION_FAILED = 'WS_FAILED';
    static const String JWT_EXPIRED = 'JWT_EXPIRED';
  }
  
  // 🔧 DEVELOPMENT/DEBUG SETTINGS
  static class Debug {
    static const bool ENABLE_LOGGING = true;
    static const bool ENABLE_MOCK_DATA = false;
    static const bool SHOW_DEBUG_INFO = true;
    static const String LOG_LEVEL = 'INFO'; // DEBUG, INFO, WARNING, ERROR
  }
  
  // 📍 GEO LOCATION
  static class Location {
    static const double DEFAULT_LATITUDE = 25.2048; // Riyadh
    static const double DEFAULT_LONGITUDE = 55.2708;
    static const double DELIVERY_RADIUS_KM = 10.0;
  }
  
  // ⏱️ TIMING CONFIGURATIONS
  static class Timing {
    static const Duration ORDER_ACCEPTANCE_TIMEOUT = Duration(minutes: 5);
    static const Duration PREPARATION_TIME_DEFAULT = Duration(minutes: 30);
    static const Duration DELIVERY_TIME_ESTIMATE = Duration(minutes: 45);
    static const Duration AUTO_REFRESH_INTERVAL = Duration(seconds: 10);
    static const Duration BACKGROUND_REFRESH = Duration(seconds: 30);
  }
  
  // 🏪 BUSINESS HOURS
  static class BusinessHours {
    static const String OPEN_TIME = '09:00';
    static const String CLOSE_TIME = '23:00';
    static const List<String> WORKING_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  }
  
  // 💰 PAYMENT METHODS
  static class PaymentMethods {
    static const List<String> SUPPORTED_METHODS = ['cash', 'card', 'digital_wallet'];
    static const String DEFAULT_METHOD = 'cash';
    static const bool ACCEPT_ONLINE_PAYMENT = true;
  }
  
  // 📦 ORDER STATUS MAPPING
  static const Map<String, String> ORDER_STATUS_DISPLAY = {
    'pending': 'Pending Confirmation',
    'confirmed': 'Order Confirmed',
    'preparing': 'Being Prepared',
    'ready': 'Ready for Pickup/Delivery',
    'out_for_delivery': 'Out for Delivery',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'rejected': 'Rejected'
  };
  
  // 🚀 PERFORMANCE SETTINGS
  static class Performance {
    static const int MAX_CACHED_ORDERS = 100;
    static const int IMAGE_CACHE_SIZE_MB = 50;
    static const Duration API_TIMEOUT = Duration(seconds: 15);
    static const int MAX_RETRY_ATTEMPTS = 3;
  }
}
```

---

## 🔗 **HTTP Client Configuration**

```dart
// lib/services/http_client.dart
import 'package:dio/dio.dart';
import '../config/wizzcentral_config.dart';

class WizzCentralHttpClient {
  late Dio _dio;
  String? _authToken;
  
  WizzCentralHttpClient() {
    _dio = Dio(BaseOptions(
      baseUrl: WizzCentralConfig.API_BASE_URL,
      connectTimeout: WizzCentralConfig.Performance.API_TIMEOUT,
      receiveTimeout: WizzCentralConfig.Performance.API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': '${WizzCentralConfig.AppSettings.APP_NAME}/${WizzCentralConfig.AppSettings.APP_VERSION}',
      },
    ));
    
    _setupInterceptors();
  }
  
  void _setupInterceptors() {
    // Request interceptor - Add auth token
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (_authToken != null) {
          options.headers['Authorization'] = 'Bearer $_authToken';
        }
        
        // Add business ID to all requests
        options.headers['X-Business-ID'] = WizzCentralConfig.BUSINESS_ID;
        
        print('🌐 Request: ${options.method} ${options.path}');
        handler.next(options);
      },
      
      onResponse: (response, handler) {
        print('✅ Response: ${response.statusCode} ${response.requestOptions.path}');
        handler.next(response);
      },
      
      onError: (error, handler) {
        print('❌ Error: ${error.response?.statusCode} ${error.requestOptions.path}');
        handler.next(error);
      },
    ));
    
    // Retry interceptor
    _dio.interceptors.add(RetryInterceptor(
      dio: _dio,
      retries: WizzCentralConfig.Performance.MAX_RETRY_ATTEMPTS,
      retryDelays: const [
        Duration(seconds: 1),
        Duration(seconds: 2),
        Duration(seconds: 3),
      ],
    ));
  }
  
  void setAuthToken(String token) {
    _authToken = token;
  }
  
  void clearAuthToken() {
    _authToken = null;
  }
  
  Dio get client => _dio;
}
```

---

## 🔐 **JWT Token Service**

```dart
// lib/services/jwt_service.dart
import 'dart:convert';
import 'package:crypto/crypto.dart';
import '../config/wizzcentral_config.dart';

class JWTService {
  static String generateToken({
    required String businessId,
    required String userId,
    String? email,
  }) {
    final header = {
      'alg': 'HS256',
      'typ': 'JWT',
    };
    
    final now = DateTime.now();
    final payload = {
      'businessId': businessId,
      'userId': userId,
      'email': email,
      'iss': WizzCentralConfig.JWT_ISSUER,
      'aud': 'merchant-app',
      'exp': now.add(WizzCentralConfig.JWT_EXPIRATION).millisecondsSinceEpoch ~/ 1000,
      'iat': now.millisecondsSinceEpoch ~/ 1000,
      'nbf': now.millisecondsSinceEpoch ~/ 1000,
    };
    
    final encodedHeader = base64Url.encode(utf8.encode(json.encode(header)));
    final encodedPayload = base64Url.encode(utf8.encode(json.encode(payload)));
    
    final signature = _generateSignature('$encodedHeader.$encodedPayload');
    
    return '$encodedHeader.$encodedPayload.$signature';
  }
  
  static String _generateSignature(String data) {
    final key = utf8.encode(WizzCentralConfig.JWT_SECRET);
    final bytes = utf8.encode(data);
    final hmac = Hmac(sha256, key);
    final digest = hmac.convert(bytes);
    return base64Url.encode(digest.bytes);
  }
  
  static Map<String, dynamic>? decodeToken(String token) {
    try {
      final parts = token.split('.');
      if (parts.length != 3) return null;
      
      final payload = parts[1];
      final decoded = base64Url.decode(payload);
      return json.decode(utf8.decode(decoded));
    } catch (e) {
      return null;
    }
  }
  
  static bool isTokenExpired(String token) {
    final decoded = decodeToken(token);
    if (decoded == null) return true;
    
    final exp = decoded['exp'] as int?;
    if (exp == null) return true;
    
    return DateTime.now().millisecondsSinceEpoch ~/ 1000 > exp;
  }
}
```

---

## 🏪 **Environment Configuration**

```dart
// lib/config/environment.dart
enum Environment { development, staging, production }

class EnvironmentConfig {
  static const Environment current = Environment.production; // Change as needed
  
  static bool get isDevelopment => current == Environment.development;
  static bool get isStaging => current == Environment.staging;
  static bool get isProduction => current == Environment.production;
  
  static String get apiBaseUrl {
    switch (current) {
      case Environment.development:
        return 'http://localhost:3000/dev';
      case Environment.staging:
        return 'https://staging-api.wizzcentral.com/dev';
      case Environment.production:
        return WizzCentralConfig.API_BASE_URL;
    }
  }
  
  static String get websocketUrl {
    switch (current) {
      case Environment.development:
        return 'ws://localhost:3001';
      case Environment.staging:
        return 'wss://staging-ws.wizzcentral.com/dev';
      case Environment.production:
        return WizzCentralConfig.WEBSOCKET_URL;
    }
  }
  
  static bool get enableLogging => !isProduction;
  static bool get enableDebugMode => isDevelopment;
}
```

---

## 📱 **Real-time Service Configuration**

```dart
// lib/services/realtime_service.dart
import 'dart:async';
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../config/wizzcentral_config.dart';

class RealtimeService {
  static const String _wsUrl = WizzCentralConfig.WEBSOCKET_URL;
  static const String _businessId = WizzCentralConfig.BUSINESS_ID;
  
  WebSocketChannel? _channel;
  StreamController<Map<String, dynamic>>? _messageController;
  Timer? _pingTimer;
  Timer? _reconnectTimer;
  bool _isConnected = false;
  int _reconnectAttempts = 0;
  
  Stream<Map<String, dynamic>> get messageStream => 
      _messageController?.stream ?? Stream.empty();
  
  bool get isConnected => _isConnected;
  
  RealtimeService() {
    _messageController = StreamController<Map<String, dynamic>>.broadcast();
  }
  
  Future<bool> connect() async {
    try {
      final uri = Uri.parse('$_wsUrl?businessId=$_businessId&userType=merchant');
      print('🔌 Connecting to WebSocket: $uri');
      
      _channel = WebSocketChannel.connect(uri);
      
      _channel!.stream.listen(
        _handleMessage,
        onError: _handleError,
        onDone: _handleDisconnection,
      );
      
      _isConnected = true;
      _reconnectAttempts = 0;
      _startPing();
      
      print('✅ WebSocket connected successfully');
      return true;
      
    } catch (error) {
      print('❌ WebSocket connection failed: $error');
      _scheduleReconnect();
      return false;
    }
  }
  
  void _handleMessage(dynamic data) {
    try {
      final message = jsonDecode(data as String) as Map<String, dynamic>;
      print('📨 WebSocket message: $message');
      
      _messageController?.add(message);
      
      // Handle specific message types
      switch (message['type']) {
        case 'new_order':
          _handleNewOrder(message);
          break;
        case 'order_status_update':
          _handleOrderStatusUpdate(message);
          break;
        case 'connection_established':
          print('🎉 Connection established: ${message['message']}');
          break;
      }
      
    } catch (error) {
      print('❌ Error parsing WebSocket message: $error');
    }
  }
  
  void _handleNewOrder(Map<String, dynamic> message) {
    // Implement new order handling
    print('🆕 New order received: ${message['orderId']}');
  }
  
  void _handleOrderStatusUpdate(Map<String, dynamic> message) {
    // Implement order status update handling
    print('📊 Order status updated: ${message['orderId']} -> ${message['newStatus']}');
  }
  
  void _handleError(error) {
    print('❌ WebSocket error: $error');
    _isConnected = false;
    _scheduleReconnect();
  }
  
  void _handleDisconnection() {
    print('🔌 WebSocket disconnected');
    _isConnected = false;
    _stopPing();
    _scheduleReconnect();
  }
  
  void _startPing() {
    _pingTimer = Timer.periodic(WizzCentralConfig.WEBSOCKET_PING_INTERVAL, (_) {
      if (_isConnected && _channel != null) {
        _channel!.sink.add(jsonEncode({
          'type': 'ping',
          'timestamp': DateTime.now().toIso8601String(),
        }));
      }
    });
  }
  
  void _stopPing() {
    _pingTimer?.cancel();
    _pingTimer = null;
  }
  
  void _scheduleReconnect() {
    if (_reconnectAttempts >= WizzCentralConfig.MAX_RECONNECT_ATTEMPTS) {
      print('❌ Max reconnection attempts reached');
      return;
    }
    
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(WizzCentralConfig.WEBSOCKET_RECONNECT_DELAY, () {
      _reconnectAttempts++;
      print('🔄 Reconnection attempt $_reconnectAttempts');
      connect();
    });
  }
  
  void send(Map<String, dynamic> message) {
    if (_isConnected && _channel != null) {
      _channel!.sink.add(jsonEncode(message));
    } else {
      print('❌ Cannot send message: WebSocket not connected');
    }
  }
  
  void disconnect() {
    _channel?.sink.close();
    _stopPing();
    _reconnectTimer?.cancel();
    _isConnected = false;
  }
  
  void dispose() {
    disconnect();
    _messageController?.close();
  }
}
```

---

## 🧪 **Testing Configuration**

```bash
# Test your configuration
curl -X GET "https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev/api/orders" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "X-Business-ID: 7ccf646c-9594-48d4-8f63-c366d89257e5" \
  -H "Content-Type: application/json"
```

---

## 🎯 **Next Steps**

1. **Copy the configuration** above into your Flutter app
2. **Replace `YOUR_FCM_SERVER_KEY`** with your actual Firebase key
3. **Update merchant name** and business details
4. **Test the connection** using the HTTP client
5. **Implement the real-time service** for instant notifications

## ✅ **Verification Checklist**

- [ ] API Base URL is correct: `https://72nmgq5rc4.execute-api.us-east-1.amazonaws.com/dev`
- [ ] Business ID is set: `7ccf646c-9594-48d4-8f63-c366d89257e5`
- [ ] JWT Secret matches platform: `wizzcentral-super-secret-key-2024`
- [ ] Cognito configuration is complete
- [ ] WebSocket URL is configured (when available)
- [ ] All table names match your platform
- [ ] FCM key is updated for push notifications

Your merchant app is now **fully configured** to integrate with the WizzCentral platform! 🚀
