import { useState, useEffect, useRef } from 'react';
import { notificationService } from '../services/notifications';

/**
 * Custom hook for managing push notifications
 * Handles registration, listeners, and notification actions
 */
export const useNotifications = (options = {}) => {
  const {
    onNotificationReceived,
    onNotificationResponse,
    autoRegister = true
  } = options;

  const [expoPushToken, setExpoPushToken] = useState(null);
  const [notification, setNotification] = useState(null);
  const [error, setError] = useState(null);
  const notificationRef = useRef();

  useEffect(() => {
    if (autoRegister) {
      registerForPushNotifications();
    }

    // Setup listeners
    notificationService.setupNotificationListeners(
      (notification) => {
        setNotification(notification);
        notificationRef.current = notification;
        if (onNotificationReceived) {
          onNotificationReceived(notification);
        }
      },
      (response) => {
        if (onNotificationResponse) {
          onNotificationResponse(response);
        }
      }
    );

    // Cleanup
    return () => {
      notificationService.removeNotificationListeners();
    };
  }, []);

  const registerForPushNotifications = async () => {
    try {
      const token = await notificationService.registerForPushNotifications();
      setExpoPushToken(token);
      return token;
    } catch (err) {
      console.error('Error registering for push notifications:', err);
      setError(err);
      return null;
    }
  };

  const scheduleNotification = async (title, body, data, trigger) => {
    try {
      const id = await notificationService.scheduleNotification(title, body, data, trigger);
      return id;
    } catch (err) {
      console.error('Error scheduling notification:', err);
      setError(err);
      return null;
    }
  };

  const cancelNotification = async (notificationId) => {
    try {
      return await notificationService.cancelNotification(notificationId);
    } catch (err) {
      console.error('Error canceling notification:', err);
      setError(err);
      return false;
    }
  };

  const clearBadge = async () => {
    try {
      return await notificationService.clearBadge();
    } catch (err) {
      console.error('Error clearing badge:', err);
      setError(err);
      return false;
    }
  };

  return {
    expoPushToken,
    notification,
    error,
    registerForPushNotifications,
    scheduleNotification,
    cancelNotification,
    clearBadge,
    notifyTicketUpdate: notificationService.notifyTicketUpdate.bind(notificationService),
    notifyTrainStatus: notificationService.notifyTrainStatus.bind(notificationService),
    notifyScheduleChange: notificationService.notifyScheduleChange.bind(notificationService)
  };
};

export default useNotifications;
