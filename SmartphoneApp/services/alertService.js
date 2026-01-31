/**
 * Alert Service
 * Delay notifications, disruption alerts, and service updates
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getActiveTrains, TRAIN_STATUS } from './realTimeTrainService';

const KEYS = {
  ALERTS: 'service_alerts',
  SUBSCRIPTIONS: 'alert_subscriptions',
  ALERT_HISTORY: 'alert_history',
  PREFERENCES: 'alert_preferences',
};

// Alert types
export const ALERT_TYPES = {
  DELAY: 'delay',
  CANCELLATION: 'cancellation',
  DISRUPTION: 'disruption',
  MAINTENANCE: 'maintenance',
  WEATHER: 'weather',
  SECURITY: 'security',
  SERVICE_UPDATE: 'service_update',
  PROMOTION: 'promotion',
};

// Alert severity levels
export const ALERT_SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
};

// Default alert preferences
const DEFAULT_PREFERENCES = {
  enablePushNotifications: true,
  enableSMS: false,
  enableEmail: false,
  alertTypes: {
    [ALERT_TYPES.DELAY]: true,
    [ALERT_TYPES.CANCELLATION]: true,
    [ALERT_TYPES.DISRUPTION]: true,
    [ALERT_TYPES.MAINTENANCE]: true,
    [ALERT_TYPES.WEATHER]: true,
    [ALERT_TYPES.SECURITY]: true,
    [ALERT_TYPES.SERVICE_UPDATE]: true,
    [ALERT_TYPES.PROMOTION]: false,
  },
  minDelay: 5, // Only alert for delays > 5 minutes
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00',
  },
};

// Simulated active alerts (in production, these come from backend)
const MOCK_ALERTS = [
  {
    id: 'alert-1',
    type: ALERT_TYPES.DELAY,
    severity: ALERT_SEVERITY.WARNING,
    title: 'TAZARA Express Delayed',
    message: 'Train TA201 from Dar es Salaam is running 25 minutes late due to signal maintenance at Mlimba.',
    affectedRoutes: ['tazara-express'],
    affectedStations: ['Dar es Salaam', 'Mlimba', 'Makambako'],
    startTime: new Date(Date.now() - 30 * 60000).toISOString(),
    estimatedEndTime: new Date(Date.now() + 60 * 60000).toISOString(),
    isActive: true,
    createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
  },
  {
    id: 'alert-2',
    type: ALERT_TYPES.MAINTENANCE,
    severity: ALERT_SEVERITY.INFO,
    title: 'Scheduled Track Maintenance',
    message: 'Track maintenance scheduled between Kasama and Mpika on Saturday 8:00 AM - 2:00 PM. Expect 30-minute delays.',
    affectedRoutes: ['tazara-express'],
    affectedStations: ['Kasama', 'Mpika'],
    startTime: new Date(Date.now() + 2 * 24 * 60 * 60000).toISOString(),
    estimatedEndTime: new Date(Date.now() + 2 * 24 * 60 * 60000 + 6 * 60 * 60000).toISOString(),
    isActive: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60000).toISOString(),
  },
  {
    id: 'alert-3',
    type: ALERT_TYPES.SERVICE_UPDATE,
    severity: ALERT_SEVERITY.INFO,
    title: 'New Express Service',
    message: 'Starting next month: New direct express service between Nairobi and Mombasa with only 2 stops. Journey time reduced to 3.5 hours.',
    affectedRoutes: ['madaraka-express'],
    affectedStations: ['Nairobi Terminus', 'Mombasa Terminus'],
    startTime: new Date(Date.now() + 30 * 24 * 60 * 60000).toISOString(),
    isActive: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(),
  },
];

/**
 * Get all active alerts
 */
export const getActiveAlerts = async () => {
  // In production, fetch from backend API
  // For now, combine mock alerts with real-time delay detection
  
  const alerts = [...MOCK_ALERTS];
  
  // Add real-time delay alerts from train tracking
  const trains = getActiveTrains();
  const delayedTrains = trains.filter(t => t.currentStatus === TRAIN_STATUS.DELAYED);
  
  delayedTrains.forEach(train => {
    const existingAlert = alerts.find(a => 
      a.type === ALERT_TYPES.DELAY && 
      a.affectedRoutes.includes(train.routeId)
    );
    
    if (!existingAlert && train.delayMinutes >= 5) {
      alerts.push({
        id: `delay-${train.id}`,
        type: ALERT_TYPES.DELAY,
        severity: train.delayMinutes > 30 ? ALERT_SEVERITY.CRITICAL : ALERT_SEVERITY.WARNING,
        title: `${train.route.name} Delayed`,
        message: `Train ${train.trainNumber} is running ${train.delayMinutes} minutes late. Reason: ${train.delayReason || 'Operational delay'}`,
        affectedRoutes: [train.routeId],
        affectedStations: train.route.stops.map(s => s.name),
        trainNumber: train.trainNumber,
        delayMinutes: train.delayMinutes,
        isActive: true,
        createdAt: train.lastUpdated,
      });
    }
  });
  
  return alerts.filter(a => a.isActive);
};

/**
 * Get alerts for a specific route
 */
export const getAlertsForRoute = async (routeId) => {
  const alerts = await getActiveAlerts();
  return alerts.filter(a => a.affectedRoutes.includes(routeId));
};

/**
 * Get alerts for a specific station
 */
export const getAlertsForStation = async (stationName) => {
  const alerts = await getActiveAlerts();
  return alerts.filter(a => 
    a.affectedStations.some(s => 
      s.toLowerCase().includes(stationName.toLowerCase())
    )
  );
};

/**
 * Get alerts by type
 */
export const getAlertsByType = async (type) => {
  const alerts = await getActiveAlerts();
  return alerts.filter(a => a.type === type);
};

/**
 * Get alerts by severity
 */
export const getAlertsBySeverity = async (severity) => {
  const alerts = await getActiveAlerts();
  return alerts.filter(a => a.severity === severity);
};

/**
 * Subscribe to alerts for a route
 */
export const subscribeToRoute = async (routeId) => {
  try {
    const data = await AsyncStorage.getItem(KEYS.SUBSCRIPTIONS);
    const subscriptions = data ? JSON.parse(data) : { routes: [], stations: [] };
    
    if (!subscriptions.routes.includes(routeId)) {
      subscriptions.routes.push(routeId);
      await AsyncStorage.setItem(KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
    }
    
    return subscriptions;
  } catch (error) {
    console.error('Failed to subscribe to route:', error);
    throw error;
  }
};

/**
 * Subscribe to alerts for a station
 */
export const subscribeToStation = async (stationName) => {
  try {
    const data = await AsyncStorage.getItem(KEYS.SUBSCRIPTIONS);
    const subscriptions = data ? JSON.parse(data) : { routes: [], stations: [] };
    
    if (!subscriptions.stations.includes(stationName)) {
      subscriptions.stations.push(stationName);
      await AsyncStorage.setItem(KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
    }
    
    return subscriptions;
  } catch (error) {
    console.error('Failed to subscribe to station:', error);
    throw error;
  }
};

/**
 * Unsubscribe from route alerts
 */
export const unsubscribeFromRoute = async (routeId) => {
  try {
    const data = await AsyncStorage.getItem(KEYS.SUBSCRIPTIONS);
    const subscriptions = data ? JSON.parse(data) : { routes: [], stations: [] };
    
    subscriptions.routes = subscriptions.routes.filter(r => r !== routeId);
    await AsyncStorage.setItem(KEYS.SUBSCRIPTIONS, JSON.stringify(subscriptions));
    
    return subscriptions;
  } catch (error) {
    console.error('Failed to unsubscribe from route:', error);
    throw error;
  }
};

/**
 * Get user's subscriptions
 */
export const getSubscriptions = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.SUBSCRIPTIONS);
    return data ? JSON.parse(data) : { routes: [], stations: [] };
  } catch (error) {
    console.error('Failed to get subscriptions:', error);
    return { routes: [], stations: [] };
  }
};

/**
 * Get alerts for user's subscribed routes/stations
 */
export const getSubscribedAlerts = async () => {
  const subscriptions = await getSubscriptions();
  const allAlerts = await getActiveAlerts();
  
  return allAlerts.filter(alert => {
    const matchesRoute = alert.affectedRoutes.some(r => subscriptions.routes.includes(r));
    const matchesStation = alert.affectedStations.some(s => 
      subscriptions.stations.some(sub => 
        s.toLowerCase().includes(sub.toLowerCase())
      )
    );
    return matchesRoute || matchesStation;
  });
};

/**
 * Get alert preferences
 */
export const getAlertPreferences = async () => {
  try {
    const data = await AsyncStorage.getItem(KEYS.PREFERENCES);
    return data ? JSON.parse(data) : DEFAULT_PREFERENCES;
  } catch (error) {
    console.error('Failed to get alert preferences:', error);
    return DEFAULT_PREFERENCES;
  }
};

/**
 * Update alert preferences
 */
export const updateAlertPreferences = async (preferences) => {
  try {
    const current = await getAlertPreferences();
    const updated = { ...current, ...preferences };
    await AsyncStorage.setItem(KEYS.PREFERENCES, JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.error('Failed to update alert preferences:', error);
    throw error;
  }
};

/**
 * Mark alert as read
 */
export const markAlertAsRead = async (alertId) => {
  try {
    const data = await AsyncStorage.getItem(KEYS.ALERT_HISTORY);
    const history = data ? JSON.parse(data) : { read: [], dismissed: [] };
    
    if (!history.read.includes(alertId)) {
      history.read.push(alertId);
      await AsyncStorage.setItem(KEYS.ALERT_HISTORY, JSON.stringify(history));
    }
    
    return history;
  } catch (error) {
    console.error('Failed to mark alert as read:', error);
  }
};

/**
 * Dismiss alert
 */
export const dismissAlert = async (alertId) => {
  try {
    const data = await AsyncStorage.getItem(KEYS.ALERT_HISTORY);
    const history = data ? JSON.parse(data) : { read: [], dismissed: [] };
    
    if (!history.dismissed.includes(alertId)) {
      history.dismissed.push(alertId);
      await AsyncStorage.setItem(KEYS.ALERT_HISTORY, JSON.stringify(history));
    }
    
    return history;
  } catch (error) {
    console.error('Failed to dismiss alert:', error);
  }
};

/**
 * Get unread alert count
 */
export const getUnreadAlertCount = async () => {
  const alerts = await getActiveAlerts();
  const data = await AsyncStorage.getItem(KEYS.ALERT_HISTORY);
  const history = data ? JSON.parse(data) : { read: [], dismissed: [] };
  
  const unread = alerts.filter(a => 
    !history.read.includes(a.id) && !history.dismissed.includes(a.id)
  );
  
  return unread.length;
};

/**
 * Get alert summary for display
 */
export const getAlertSummary = async () => {
  const alerts = await getActiveAlerts();
  const unreadCount = await getUnreadAlertCount();
  
  const criticalCount = alerts.filter(a => a.severity === ALERT_SEVERITY.CRITICAL).length;
  const warningCount = alerts.filter(a => a.severity === ALERT_SEVERITY.WARNING).length;
  const delayCount = alerts.filter(a => a.type === ALERT_TYPES.DELAY).length;
  
  return {
    totalAlerts: alerts.length,
    unreadCount,
    criticalCount,
    warningCount,
    delayCount,
    hasAlerts: alerts.length > 0,
    hasCritical: criticalCount > 0,
    latestAlert: alerts[0] || null,
  };
};

/**
 * Format alert for display
 */
export const formatAlert = (alert) => {
  const severityColors = {
    [ALERT_SEVERITY.INFO]: '#3B82F6',
    [ALERT_SEVERITY.WARNING]: '#F59E0B',
    [ALERT_SEVERITY.CRITICAL]: '#EF4444',
  };
  
  const typeIcons = {
    [ALERT_TYPES.DELAY]: '⏱️',
    [ALERT_TYPES.CANCELLATION]: '❌',
    [ALERT_TYPES.DISRUPTION]: '⚠️',
    [ALERT_TYPES.MAINTENANCE]: '🔧',
    [ALERT_TYPES.WEATHER]: '🌧️',
    [ALERT_TYPES.SECURITY]: '🔒',
    [ALERT_TYPES.SERVICE_UPDATE]: '📢',
    [ALERT_TYPES.PROMOTION]: '🎉',
  };
  
  return {
    ...alert,
    color: severityColors[alert.severity] || severityColors[ALERT_SEVERITY.INFO],
    icon: typeIcons[alert.type] || '📢',
    timeAgo: getTimeAgo(new Date(alert.createdAt)),
  };
};

/**
 * Helper: Get time ago string
 */
const getTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  if (seconds < 60) return 'Just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
};

export default {
  ALERT_TYPES,
  ALERT_SEVERITY,
  getActiveAlerts,
  getAlertsForRoute,
  getAlertsForStation,
  getAlertsByType,
  getAlertsBySeverity,
  subscribeToRoute,
  subscribeToStation,
  unsubscribeFromRoute,
  getSubscriptions,
  getSubscribedAlerts,
  getAlertPreferences,
  updateAlertPreferences,
  markAlertAsRead,
  dismissAlert,
  getUnreadAlertCount,
  getAlertSummary,
  formatAlert,
};
