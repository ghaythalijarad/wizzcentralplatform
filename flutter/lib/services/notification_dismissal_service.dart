// Flutter: Dismiss floating notification cards
// This handles dismissing promotion cards and preventing them from showing again

import 'dart:convert';

import 'package:shared_preferences/shared_preferences.dart';

class NotificationDismissalService {
  static const String _dismissedKey = 'dismissed_notifications';
  static const String _dismissedPromotionsKey = 'dismissed_promotions';
  static const String _dismissalTimestampsKey = 'dismissal_timestamps';

  /// Dismiss a notification by its ID
  static Future<void> dismissNotification(String notificationId) async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();

      // Get current dismissed notifications
      List<String> dismissedIds = prefs.getStringList(_dismissedKey) ?? [];

      // Add new ID if not already present
      if (!dismissedIds.contains(notificationId)) {
        dismissedIds.add(notificationId);
        await prefs.setStringList(_dismissedKey, dismissedIds);

        // Store dismissal timestamp
        await _storeDismissalTimestamp(notificationId);

        print('Dismissed notification: $notificationId');
      }
    } catch (e) {
      print('Error dismissing notification: $e');
    }
  }

  /// Dismiss a promotion by its ID
  static Future<void> dismissPromotion(String promotionId) async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();

      // Get current dismissed promotions
      List<String> dismissedPromotions =
          prefs.getStringList(_dismissedPromotionsKey) ?? [];

      // Add new promotion ID if not already present
      if (!dismissedPromotions.contains(promotionId)) {
        dismissedPromotions.add(promotionId);
        await prefs.setStringList(_dismissedPromotionsKey, dismissedPromotions);

        // Store dismissal timestamp
        await _storeDismissalTimestamp(promotionId);

        print('Dismissed promotion: $promotionId');
      }
    } catch (e) {
      print('Error dismissing promotion: $e');
    }
  }

  /// Check if a notification has been dismissed
  static Future<bool> isNotificationDismissed(String notificationId) async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      List<String> dismissedIds = prefs.getStringList(_dismissedKey) ?? [];
      return dismissedIds.contains(notificationId);
    } catch (e) {
      print('Error checking notification dismissal: $e');
      return false;
    }
  }

  /// Check if a promotion has been dismissed
  static Future<bool> isPromotionDismissed(String promotionId) async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      List<String> dismissedPromotions =
          prefs.getStringList(_dismissedPromotionsKey) ?? [];
      return dismissedPromotions.contains(promotionId);
    } catch (e) {
      print('Error checking promotion dismissal: $e');
      return false;
    }
  }

  /// Store dismissal timestamp for analytics
  static Future<void> _storeDismissalTimestamp(String id) async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      String? timestampsJson = prefs.getString(_dismissalTimestampsKey);

      Map<String, dynamic> timestamps = {};
      timestamps = json.decode(timestampsJson);

      timestamps[id] = DateTime.now().toIso8601String();

      await prefs.setString(_dismissalTimestampsKey, json.encode(timestamps));
    } catch (e) {
      print('Error storing dismissal timestamp: $e');
    }
  }

  /// Get dismissal timestamp for a specific ID
  static Future<DateTime?> getDismissalTimestamp(String id) async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      String? timestampsJson = prefs.getString(_dismissalTimestampsKey);

      Map<String, dynamic> timestamps = json.decode(timestampsJson);
      String? timestampStr = timestamps[id];

      if (timestampStr != null) {
        return DateTime.parse(timestampStr);
      }

      return null;
    } catch (e) {
      print('Error getting dismissal timestamp: $e');
      return null;
    }
  }

  /// Clear old dismissed notifications (older than 30 days)
  static Future<void> clearOldDismissals() async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      String? timestampsJson = prefs.getString(_dismissalTimestampsKey);

      Map<String, dynamic> timestamps = json.decode(timestampsJson);
      DateTime cutoffDate = DateTime.now().subtract(Duration(days: 30));

      List<String> idsToRemove = [];

      timestamps.forEach((id, timestampStr) {
        try {
          DateTime dismissalTime = DateTime.parse(timestampStr);
          if (dismissalTime.isBefore(cutoffDate)) {
            idsToRemove.add(id);
          }
        } catch (e) {
          // Invalid timestamp, mark for removal
          idsToRemove.add(id);
        }
      });

      // Remove old dismissals
      for (String id in idsToRemove) {
        timestamps.remove(id);

        // Also remove from dismissed lists
        List<String> dismissedNotifications =
            prefs.getStringList(_dismissedKey) ?? [];
        List<String> dismissedPromotions =
            prefs.getStringList(_dismissedPromotionsKey) ?? [];

        dismissedNotifications.remove(id);
        dismissedPromotions.remove(id);

        await prefs.setStringList(_dismissedKey, dismissedNotifications);
        await prefs.setStringList(_dismissedPromotionsKey, dismissedPromotions);
      }

      // Update timestamps
      await prefs.setString(_dismissalTimestampsKey, json.encode(timestamps));

      print('Cleared ${idsToRemove.length} old dismissals');
    } catch (e) {
      print('Error clearing old dismissals: $e');
    }
  }

  /// Get all dismissed notification IDs
  static Future<List<String>> getDismissedNotifications() async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      return prefs.getStringList(_dismissedKey) ?? [];
    } catch (e) {
      print('Error getting dismissed notifications: $e');
      return [];
    }
  }

  /// Get all dismissed promotion IDs
  static Future<List<String>> getDismissedPromotions() async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      return prefs.getStringList(_dismissedPromotionsKey) ?? [];
    } catch (e) {
      print('Error getting dismissed promotions: $e');
      return [];
    }
  }

  /// Clear all dismissed notifications (for testing or reset)
  static Future<void> clearAllDismissals() async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();
      await prefs.remove(_dismissedKey);
      await prefs.remove(_dismissedPromotionsKey);
      await prefs.remove(_dismissalTimestampsKey);
      print('Cleared all dismissals');
    } catch (e) {
      print('Error clearing all dismissals: $e');
    }
  }

  /// Undismiss a notification (for testing or user preference)
  static Future<void> undismissNotification(String notificationId) async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();

      List<String> dismissedIds = prefs.getStringList(_dismissedKey) ?? [];
      dismissedIds.remove(notificationId);
      await prefs.setStringList(_dismissedKey, dismissedIds);

      // Remove timestamp
      String? timestampsJson = prefs.getString(_dismissalTimestampsKey);
      Map<String, dynamic> timestamps = json.decode(timestampsJson);
      timestamps.remove(notificationId);
      await prefs.setString(_dismissalTimestampsKey, json.encode(timestamps));

      print('Undismissed notification: $notificationId');
    } catch (e) {
      print('Error undismissing notification: $e');
    }
  }

  /// Get dismissal statistics for analytics
  static Future<Map<String, dynamic>> getDismissalStats() async {
    try {
      SharedPreferences prefs = await SharedPreferences.getInstance();

      List<String> dismissedNotifications =
          prefs.getStringList(_dismissedKey) ?? [];
      List<String> dismissedPromotions =
          prefs.getStringList(_dismissedPromotionsKey) ?? [];

      String? timestampsJson = prefs.getString(_dismissalTimestampsKey);
      Map<String, dynamic> timestamps = {};
      timestamps = json.decode(timestampsJson);

      return {
        'totalDismissedNotifications': dismissedNotifications.length,
        'totalDismissedPromotions': dismissedPromotions.length,
        'dismissalsToday': _countDismissalsInPeriod(
          timestamps,
          DateTime.now().subtract(Duration(days: 1)),
        ),
        'dismissalsThisWeek': _countDismissalsInPeriod(
          timestamps,
          DateTime.now().subtract(Duration(days: 7)),
        ),
        'dismissalsThisMonth': _countDismissalsInPeriod(
          timestamps,
          DateTime.now().subtract(Duration(days: 30)),
        ),
      };
    } catch (e) {
      print('Error getting dismissal stats: $e');
      return {
        'totalDismissedNotifications': 0,
        'totalDismissedPromotions': 0,
        'dismissalsToday': 0,
        'dismissalsThisWeek': 0,
        'dismissalsThisMonth': 0,
      };
    }
  }

  /// Count dismissals in a specific time period
  static int _countDismissalsInPeriod(
    Map<String, dynamic> timestamps,
    DateTime since,
  ) {
    int count = 0;

    timestamps.forEach((id, timestampStr) {
      try {
        DateTime dismissalTime = DateTime.parse(timestampStr);
        if (dismissalTime.isAfter(since)) {
          count++;
        }
      } catch (e) {
        // Ignore invalid timestamps
      }
    });

    return count;
  }
}
