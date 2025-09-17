// Flutter: Send token to backend API
// This handles sending the FCM/APNs token along with user role to the backend

import 'dart:convert';

import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../services/push_notification_service.dart';

class NotificationApi {
  static const String baseUrl =
      'https://qaetu0jvgi.execute-api.us-east-1.amazonaws.com/prod'; // Production API Gateway

  /// Send FCM/APNs token along with user role to backend
  /// Returns true if successful, false otherwise
  static Future<bool> sendTokenToBackend(String? token) async {
    try {
      if (token == null) {
        print('No token to send to backend');
        return false;
      }

      // Get user data from SharedPreferences
      SharedPreferences prefs = await SharedPreferences.getInstance();
      String? userId = prefs.getString('user_id');
      String? userRole = prefs.getString(
        'user_role',
      ); // driver, customer, merchant
      String? userRegion = prefs.getString('user_region') ?? 'Baghdad';
      String? appVersion = prefs.getString('app_version') ?? '1.0.0';

      // Determine platform
      String platform = 'android';
      if (Theme.of(context).platform == TargetPlatform.iOS) {
        platform = 'ios';
      }

      // Prepare request data
      Map<String, dynamic> requestData = {
        'deviceToken': token,
        'userId': userId,
        'role': userRole,
        'platform': platform,
        'region': userRegion,
        'appVersion': appVersion,
        'timestamp': DateTime.now().toIso8601String(),
      };

      // Send POST request to backend
      final response = await http
          .post(
            Uri.parse('$baseUrl/register-device'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ${await _getAuthToken()}',
            },
            body: json.encode(requestData),
          )
          .timeout(Duration(seconds: 10));

      if (response.statusCode == 200) {
        Map<String, dynamic> responseData = json.decode(response.body);
        if (responseData['success'] == true) {
          // Store the endpoint ID for future use
          String? endpointId = responseData['endpointId'];
          if (endpointId != null) {
            await prefs.setString('push_endpoint_id', endpointId);
          }

          // Mark token as registered
          await prefs.setBool('token_registered', true);
          await prefs.setString('registered_token', token);

          print('Successfully registered device token with backend');
          return true;
        }
      }

      print(
        'Failed to register device token: ${response.statusCode} ${response.body}',
      );
      return false;
    } catch (e) {
      print('Error sending token to backend: $e');
      return false;
    }
  }

  /// Register device token with user role
  /// This is a convenience method that gets the token and sends it
  static Future<bool> registerDeviceWithBackend(String userRole) async {
    try {
      // Store user role
      SharedPreferences prefs = await SharedPreferences.getInstance();
      await prefs.setString('user_role', userRole);

      // Get push token
      String? token = await PushNotificationService.getPushToken();

      if (token == null) {
        print('Could not get push token');
        return false;
      }

      // Send to backend
      return await sendTokenToBackend(token);
    } catch (e) {
      print('Error registering device with backend: $e');
      return false;
    }
  }

  /// Update user region in backend
  static Future<bool> updateUserRegion(String newRegion) async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      String? token = prefs.getString('registered_token');

      // Update region in SharedPreferences
      await prefs.setString('user_region', newRegion);

      // Re-register with new region
      return await sendTokenToBackend(token);
    } catch (e) {
      print('Error updating user region: $e');
      return false;
    }
  }

  /// Check if device token is registered
  static Future<bool> isTokenRegistered() async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      return prefs.getBool('token_registered') ?? false;
    } catch (e) {
      print('Error checking token registration status: $e');
      return false;
    }
  }

  /// Unregister device token (for logout)
  static Future<bool> unregisterDevice() async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      String? endpointId = prefs.getString('push_endpoint_id');

      // Send unregister request to backend
      final response = await http
          .delete(
            Uri.parse('$baseUrl/unregister-device'),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ${await _getAuthToken()}',
            },
            body: json.encode({'endpointId': endpointId}),
          )
          .timeout(Duration(seconds: 10));

      if (response.statusCode == 200) {
        print('Successfully unregistered device from backend');
      }

      // Clear local data
      await prefs.remove('token_registered');
      await prefs.remove('registered_token');
      await prefs.remove('push_endpoint_id');

      // Delete FCM token
      await PushNotificationService.deleteCachedToken();

      return true;
    } catch (e) {
      print('Error unregistering device: $e');
      return false;
    }
  }

  /// Get authentication token for API requests
  static Future<String> _getAuthToken() async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      return prefs.getString('auth_token') ?? '';
    } catch (e) {
      print('Error getting auth token: $e');
      return '';
    }
  }

  /// Test connection to backend
  static Future<bool> testBackendConnection() async {
    try {
      final response = await http
          .get(
            Uri.parse('$baseUrl/health'),
            headers: {'Content-Type': 'application/json'},
          )
          .timeout(Duration(seconds: 5));

      return response.statusCode == 200;
    } catch (e) {
      print('Backend connection test failed: $e');
      return false;
    }
  }
}
