/**
 * AlertBanner Component
 * Displays delay and disruption alerts
 */

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { 
  getActiveAlerts, 
  getAlertSummary, 
  formatAlert, 
  dismissAlert,
  ALERT_SEVERITY,
  ALERT_TYPES 
} from '../services/alertService';

const AlertBanner = ({ 
  routeId = null, 
  stationName = null, 
  maxAlerts = 3,
  onAlertPress,
  showDismiss = true,
}) => {
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = useState([]);

  useEffect(() => {
    loadAlerts();
  }, [routeId, stationName]);

  const loadAlerts = async () => {
    try {
      let alertList = await getActiveAlerts();
      
      // Filter by route if specified
      if (routeId) {
        alertList = alertList.filter(a => a.affectedRoutes.includes(routeId));
      }
      
      // Filter by station if specified
      if (stationName) {
        alertList = alertList.filter(a => 
          a.affectedStations.some(s => 
            s.toLowerCase().includes(stationName.toLowerCase())
          )
        );
      }
      
      // Format alerts and limit
      const formattedAlerts = alertList
        .filter(a => !dismissedIds.includes(a.id))
        .map(formatAlert)
        .slice(0, maxAlerts);
      
      setAlerts(formattedAlerts);
      
      const alertSummary = await getAlertSummary();
      setSummary(alertSummary);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (alertId) => {
    await dismissAlert(alertId);
    setDismissedIds([...dismissedIds, alertId]);
    setAlerts(alerts.filter(a => a.id !== alertId));
  };

  if (loading || alerts.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Summary header if multiple alerts */}
      {summary && summary.totalAlerts > maxAlerts && (
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryText}>
            {summary.totalAlerts} active alerts
          </Text>
          {summary.hasCritical && (
            <View style={styles.criticalBadge}>
              <Text style={styles.criticalText}>{summary.criticalCount} Critical</Text>
            </View>
          )}
        </View>
      )}

      {/* Alert list */}
      <ScrollView 
        horizontal={alerts.length > 1}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={alerts.length > 1 ? styles.scrollContent : null}
      >
        {alerts.map((alert) => (
          <TouchableOpacity
            key={alert.id}
            style={[
              styles.alertCard,
              { borderLeftColor: alert.color },
              alerts.length > 1 && styles.alertCardHorizontal,
            ]}
            onPress={() => onAlertPress?.(alert)}
            activeOpacity={0.8}
          >
            <View style={styles.alertHeader}>
              <Text style={styles.alertIcon}>{alert.icon}</Text>
              <View style={styles.alertTitleContainer}>
                <Text style={styles.alertTitle} numberOfLines={1}>
                  {alert.title}
                </Text>
                <Text style={styles.alertTime}>{alert.timeAgo}</Text>
              </View>
              {showDismiss && (
                <TouchableOpacity
                  style={styles.dismissButton}
                  onPress={() => handleDismiss(alert.id)}
                >
                  <Text style={styles.dismissText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <Text style={styles.alertMessage} numberOfLines={2}>
              {alert.message}
            </Text>

            {/* Delay specific info */}
            {alert.type === ALERT_TYPES.DELAY && alert.delayMinutes && (
              <View style={styles.delayInfo}>
                <Text style={styles.delayMinutes}>
                  +{alert.delayMinutes} min delay
                </Text>
              </View>
            )}

            {/* Severity indicator */}
            <View style={[styles.severityBadge, { backgroundColor: alert.color }]}>
              <Text style={styles.severityText}>
                {alert.severity.toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// Compact version for headers
export const AlertBadge = ({ onPress }) => {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    const data = await getAlertSummary();
    setSummary(data);
  };

  if (!summary || !summary.hasAlerts) {
    return null;
  }

  return (
    <TouchableOpacity style={styles.badge} onPress={onPress}>
      <Text style={styles.badgeIcon}>
        {summary.hasCritical ? '🔴' : '🟡'}
      </Text>
      <Text style={styles.badgeCount}>{summary.unreadCount}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 12,
    color: '#64748B',
  },
  criticalBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  criticalText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  alertCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    borderLeftWidth: 4,
  },
  alertCardHorizontal: {
    width: 280,
    marginHorizontal: 4,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  alertIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  alertTitleContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F1F5F9',
  },
  alertTime: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  dismissButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 18,
    color: '#94A3B8',
    lineHeight: 20,
  },
  alertMessage: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 8,
  },
  delayInfo: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  delayMinutes: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  severityBadge: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  severityText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Badge styles
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  badgeCount: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#F1F5F9',
  },
});

export default AlertBanner;
