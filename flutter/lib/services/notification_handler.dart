// Flutter: Handle incoming push notifications
// This listens for push notifications and shows them as floating card overlays

import 'dart:convert';

import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class NotificationHandler {
  static final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  static OverlayEntry? _currentOverlay;
  static BuildContext? _appContext;

  /// Initialize notification handling
  static Future<void> initialize(BuildContext context) async {
    _appContext = context;

    // Handle notification when app is in foreground
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handle notification when app is opened from notification
    FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

    // Handle notification when app is launched from terminated state
    FirebaseMessaging.getInitialMessage().then((message) {
      if (message != null) {
        _handleNotificationTap(message);
      }
    });

    // Handle background messages
    FirebaseMessaging.onBackgroundMessage(_handleBackgroundMessage);
  }

  /// Handle notification when app is in foreground
  static void _handleForegroundMessage(RemoteMessage message) {
    print('Received foreground message: ${message.messageId}');

    // Check if notification is dismissed
    if (_isNotificationDismissed(message.data['promotionId'])) {
      print('Notification already dismissed');
      return;
    }

    // Show floating card overlay
    _showFloatingNotification(message);
  }

  /// Handle notification tap (app opened from notification)
  static void _handleNotificationTap(RemoteMessage message) {
    print('Notification tapped: ${message.messageId}');

    // Navigate to appropriate screen based on notification type
    String? notificationType = message.data['type'];

    switch (notificationType) {
      case 'new_promotion':
        _navigateToPromotions(message.data);
        break;
      case 'new_order':
        _navigateToOrders(message.data);
        break;
      case 'regional_promotion':
        _navigateToRegionalPromotions(message.data);
        break;
      default:
        _navigateToHome();
    }
  }

  /// Show floating notification card overlay
  static void _showFloatingNotification(RemoteMessage message) {
    if (_appContext == null) return;

    // Remove existing overlay if present
    _removeCurrentOverlay();

    _currentOverlay = OverlayEntry(
      builder: (context) => FloatingNotificationCard(
        message: message,
        onTap: () {
          _removeCurrentOverlay();
          _handleNotificationTap(message);
        },
        onDismiss: () {
          _dismissNotification(message.data['promotionId']);
          _removeCurrentOverlay();
        },
      ),
    );

    Overlay.of(_appContext!).insert(_currentOverlay!);

    // Auto-dismiss after 10 seconds
    Future.delayed(Duration(seconds: 10), () {
      _removeCurrentOverlay();
    });
  }

  /// Remove current overlay
  static void _removeCurrentOverlay() {
    if (_currentOverlay != null) {
      _currentOverlay!.remove();
      _currentOverlay = null;
    }
  }

  /// Check if notification is already dismissed
  static bool _isNotificationDismissed(String? promotionId) {
    if (promotionId == null) return false;

    try {
      // This would be synchronous in real implementation
      // For now, return false
      return false;
    } catch (e) {
      return false;
    }
  }

  /// Dismiss notification and save to preferences
  static Future<void> _dismissNotification(String? promotionId) async {
    if (promotionId == null) return;

    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      List<String> dismissedIds =
          prefs.getStringList('dismissed_notifications') ?? [];

      if (!dismissedIds.contains(promotionId)) {
        dismissedIds.add(promotionId);
        await prefs.setStringList('dismissed_notifications', dismissedIds);
      }

      print('Dismissed notification: $promotionId');
    } catch (e) {
      print('Error dismissing notification: $e');
    }
  }

  /// Navigation methods
  static void _navigateToPromotions(Map<String, dynamic> data) {
    if (_appContext != null) {
      Navigator.of(_appContext!).pushNamed('/promotions', arguments: data);
    }
  }

  static void _navigateToOrders(Map<String, dynamic> data) {
    if (_appContext != null) {
      Navigator.of(_appContext!).pushNamed('/orders', arguments: data);
    }
  }

  static void _navigateToRegionalPromotions(Map<String, dynamic> data) {
    if (_appContext != null) {
      Navigator.of(
        _appContext!,
      ).pushNamed('/regional-promotions', arguments: data);
    }
  }

  static void _navigateToHome() {
    if (_appContext != null) {
      Navigator.of(
        _appContext!,
      ).pushNamedAndRemoveUntil('/home', (route) => false);
    }
  }
}

/// Background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> _handleBackgroundMessage(RemoteMessage message) async {
  print('Received background message: ${message.messageId}');

  // Handle background message processing here
  // This could include updating local data, logging analytics, etc.

  // Store notification for later display if needed
  SharedPreferences prefs = await SharedPreferences.getInstance();
  List<String> backgroundMessages =
      prefs.getStringList('background_messages') ?? [];

  Map<String, dynamic> messageData = {
    'messageId': message.messageId,
    'title': message.notification?.title,
    'body': message.notification?.body,
    'data': message.data,
    'receivedAt': DateTime.now().toIso8601String(),
  };

  backgroundMessages.add(json.encode(messageData));

  // Keep only last 50 background messages
  if (backgroundMessages.length > 50) {
    backgroundMessages = backgroundMessages.sublist(
      backgroundMessages.length - 50,
    );
  }

  await prefs.setStringList('background_messages', backgroundMessages);
}

/// Floating notification card widget
class FloatingNotificationCard extends StatelessWidget {
  final RemoteMessage message;
  final VoidCallback onTap;
  final VoidCallback onDismiss;

  const FloatingNotificationCard({
    Key? key,
    required this.message,
    required this.onTap,
    required this.onDismiss,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: MediaQuery.of(context).padding.top + 10,
      left: 16,
      right: 16,
      child: Material(
        elevation: 8,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                _getNotificationColor(message.data['type']),
                _getNotificationColor(message.data['type']).withOpacity(0.8),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(12),
          ),
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Row(
                children: [
                  // Notification icon
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(24),
                    ),
                    child: Icon(
                      _getNotificationIcon(message.data['type']),
                      color: Colors.white,
                      size: 24,
                    ),
                  ),
                  SizedBox(width: 12),

                  // Notification content
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          message.notification?.title ?? 'Notification',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        SizedBox(height: 4),
                        Text(
                          message.notification?.body ?? '',
                          style: TextStyle(
                            color: Colors.white.withOpacity(0.9),
                            fontSize: 14,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (message.data['discount'] != null) ...[
                          SizedBox(height: 8),
                          Container(
                            padding: EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.2),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              '${message.data['discount']} OFF',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),

                  // Dismiss button
                  IconButton(
                    onPressed: onDismiss,
                    icon: Icon(
                      Icons.close,
                      color: Colors.white.withOpacity(0.8),
                      size: 20,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Color _getNotificationColor(String? type) {
    switch (type) {
      case 'new_promotion':
      case 'regional_promotion':
        return Colors.orange;
      case 'new_order':
        return Colors.green;
      case 'urgent':
        return Colors.red;
      default:
        return Colors.blue;
    }
  }

  IconData _getNotificationIcon(String? type) {
    switch (type) {
      case 'new_promotion':
      case 'regional_promotion':
        return Icons.local_offer;
      case 'new_order':
        return Icons.shopping_cart;
      case 'urgent':
        return Icons.priority_high;
      default:
        return Icons.notifications;
    }
  }
}
