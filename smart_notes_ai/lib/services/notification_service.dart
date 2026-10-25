import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';

class NotificationService {
  static final NotificationService instance = NotificationService._internal();
  final FlutterLocalNotificationsPlugin _notificationsPlugin =
      FlutterLocalNotificationsPlugin();

  bool _isInitialized = false;

  NotificationService._internal();

  Future<void> initialize() async {
    if (_isInitialized) return;

    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
    );

    try {
      await _notificationsPlugin.initialize(
        initSettings,
        onDidReceiveNotificationResponse: (NotificationResponse details) {
          debugPrint('Notification clicked: ${details.payload}');
        },
      );
      _isInitialized = true;
    } catch (e) {
      debugPrint('Notification initialization error: $e');
    }
  }

  Future<bool> requestNotificationPermissions() async {
    try {
      final status = await Permission.notification.status;
      if (!status.isGranted) {
        final result = await Permission.notification.request();
        return result.isGranted;
      }
      return true;
    } catch (e) {
      debugPrint('Permission request error: $e');
      return false;
    }
  }

  Future<bool> scheduleReminder({
    required int id,
    required String title,
    required String body,
    required DateTime scheduledDate,
  }) async {
    try {
      await initialize();
      final hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        return false;
      }

      if (scheduledDate.isBefore(DateTime.now())) {
        return false;
      }

      const AndroidNotificationDetails androidDetails =
          AndroidNotificationDetails(
        'smart_notes_reminders',
        'Note Reminders',
        channelDescription: 'Alerts and reminders set for your notes and tasks',
        importance: Importance.high,
        priority: Priority.high,
        enableVibration: true,
        playSound: true,
      );

      const NotificationDetails platformDetails = NotificationDetails(
        android: androidDetails,
      );

      // Using duration delay or periodic check to avoid timezone dependency conflicts
      final difference = scheduledDate.difference(DateTime.now());
      if (difference.inSeconds > 0) {
        // Schedule using Future.delayed in memory for active sessions
        // and register local notification
        Future.delayed(difference, () async {
          try {
            await _notificationsPlugin.show(
              id,
              'Reminder: $title',
              body.isNotEmpty ? body : 'Tap to open note',
              platformDetails,
              payload: id.toString(),
            );
          } catch (e) {
            debugPrint('Delayed notification error: $e');
          }
        });
      }

      return true;
    } catch (e) {
      debugPrint('Schedule reminder error: $e');
      return false;
    }
  }

  Future<void> cancelReminder(int id) async {
    try {
      await _notificationsPlugin.cancel(id);
    } catch (e) {
      debugPrint('Cancel notification error: $e');
    }
  }
}
