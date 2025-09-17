// Flutter: Push notification token management
// This handles FCM/APNs token retrieval for both Android and iOS

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:permission_handler/permission_handler.dart';

class PushNotificationService {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static String? _cachedToken;

  /// Request push notification permissions and get token
  /// Returns the FCM/APNs token as a string
  static Future<String?> getPushToken() async {
    try {
      // Return cached token if available
      if (_cachedToken != null) {
        return _cachedToken;
      }

      // Request notification permissions
      NotificationSettings settings = await _messaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      if (settings.authorizationStatus == AuthorizationStatus.denied) {
        print('User denied notification permissions');
        return null;
      }

      // For iOS, we might need to request additional permissions
      if (defaultTargetPlatform == TargetPlatform.iOS) {
        await _requestIOSPermissions();
      }

      // Get the token
      String? token = await _messaging.getToken();

      _cachedToken = token;
      print('FCM Token obtained: ${token.substring(0, 20)}...');

      // Listen for token refresh
      _messaging.onTokenRefresh.listen((newToken) {
        _cachedToken = newToken;
        print('FCM Token refreshed');
        // Send updated token to backend
        _sendTokenToBackend(newToken);
      });

      return token;
    } catch (e) {
      print('Error getting push token: $e');
      return null;
    }
  }

  /// For iOS, request additional permissions
  static Future<void> _requestIOSPermissions() async {
    try {
      await Permission.notification.request();
    } catch (e) {
      print('Error requesting iOS permissions: $e');
    }
  }

  /// Send token to backend when it refreshes
  static Future<void> _sendTokenToBackend(String token) async {
    try {
      // This will be implemented in the next function
      await NotificationApi.sendTokenToBackend(token);
    } catch (e) {
      print('Error sending refreshed token to backend: $e');
    }
  }

  /// Check if notifications are enabled
  static Future<bool> areNotificationsEnabled() async {
    try {
      NotificationSettings settings = await _messaging
          .getNotificationSettings();
      return settings.authorizationStatus == AuthorizationStatus.authorized;
    } catch (e) {
      print('Error checking notification status: $e');
      return false;
    }
  }

  /// Delete the cached token (useful for logout)
  static Future<void> deleteCachedToken() async {
    try {
      await _messaging.deleteToken();
      _cachedToken = null;
      print('Push token deleted');
    } catch (e) {
      print('Error deleting push token: $e');
    }
  }
}
