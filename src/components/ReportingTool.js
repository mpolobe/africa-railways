import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator } from 'react-native';

/**
 * ReportingTool Component
 * 
 * Connects Railway Nodes (Lusaka/Nairobi) to the dashboard
 * Fetches sensor data, ticket sales, and network metrics
 */
const ReportingTool = () => {
  const [reports, setReports] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch reports from Sovereign Engine
  const fetchReports = async () => {
    try {
      setError(null);
      
      // Connect to Sovereign Engine (Go Backend)
      const response = await fetch('https://api.africarailways.com/api/reports');
      
      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }
      
      const data = await response.json();
      setReports(data);
      setLoading(false);
      setRefreshing(false);
    } catch (err) {
      console.error("Reporting Tool Error:", err);
      setError(err.message);
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReports();
    
    // Poll every 10 seconds
    const interval = setInterval(fetchReports, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchReports();
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFB800" />
        <Text style={styles.loadingText}>Loading railway network data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>⚠️ Connection Error</Text>
        <Text style={styles.errorMessage}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>🚂 Railway Node Activity Report</Text>
      
      {reports.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No reports available</Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.reportRow}>
              <View style={styles.reportHeader}>
                <Text style={styles.location}>📍 {item.node_location}</Text>
                <Text style={item.status === 'Online' ? styles.online : styles.offline}>
                  {item.status === 'Online' ? '● Online' : '○ Offline'}
                </Text>
              </View>
              
              <View style={styles.reportStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Tickets Minted</Text>
                  <Text style={styles.statValue}>{item.ticket_count}</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Revenue (AFRC)</Text>
                  <Text style={styles.statValue}>{item.revenue?.toLocaleString() || 0}</Text>
                </View>
                
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Active Sensors</Text>
                  <Text style={styles.statValue}>{item.sensor_count || 0}</Text>
                </View>
              </View>
              
              {item.last_activity && (
                <Text style={styles.lastActivity}>
                  Last activity: {new Date(item.last_activity).toLocaleString()}
                </Text>
              )}
            </View>
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFB800"
            />
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#0a0e1a' 
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0a0e1a',
    padding: 20
  },
  header: { 
    fontSize: 24, 
    fontWeight: 'bold', 
    marginBottom: 20,
    color: '#FFB800'
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#aaa'
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4444',
    marginBottom: 10
  },
  errorMessage: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center'
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic'
  },
  reportRow: { 
    padding: 20, 
    backgroundColor: '#16203a', 
    borderRadius: 12, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333'
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333'
  },
  location: { 
    fontWeight: 'bold', 
    fontSize: 18,
    color: '#fff'
  },
  online: { 
    color: '#00FF88',
    fontWeight: '600',
    fontSize: 14
  },
  offline: { 
    color: '#FF4444',
    fontWeight: '600',
    fontSize: 14
  },
  reportStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 5,
    letterSpacing: 0.5
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#00D4FF'
  },
  lastActivity: {
    fontSize: 12,
    color: '#666',
    marginTop: 10,
    fontStyle: 'italic'
  }
});

export default ReportingTool;

// Web version export for dashboard
export const ReportingToolWeb = () => {
  const [nodeData, setNodeData] = useState({
    lusaka: { status: 'loading', tickets: 0, sensors: [], revenue: 0 },
    nairobi: { status: 'loading', tickets: 0, sensors: [], revenue: 0 }
  });
  
  const [metrics, setMetrics] = useState({
    totalTickets: 0,
    totalRevenue: 0,
    activeNodes: 0,
    networkHealth: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data from backend API
  useEffect(() => {
    const fetchNodeData = async () => {
      try {
        setLoading(true);
        
        // Fetch from backend health endpoint
        const response = await fetch('/api/stats');
        
        if (!response.ok) {
          throw new Error('Failed to fetch node data');
        }
        
        const data = await response.json();
        
        // Update node data
        setNodeData({
          lusaka: {
            status: 'active',
            tickets: data.lusaka_tickets || 0,
            sensors: data.lusaka_sensors || [],
            revenue: data.lusaka_revenue || 0
          },
          nairobi: {
            status: 'active',
            tickets: data.nairobi_tickets || 0,
            sensors: data.nairobi_sensors || [],
            revenue: data.nairobi_revenue || 0
          }
        });
        
        // Calculate metrics
        const totalTickets = (data.lusaka_tickets || 0) + (data.nairobi_tickets || 0);
        const totalRevenue = (data.lusaka_revenue || 0) + (data.nairobi_revenue || 0);
        const activeNodes = 2; // Lusaka + Nairobi
        const networkHealth = data.sms_sent > 0 
          ? ((data.sms_sent - data.sms_failed) / data.sms_sent * 100).toFixed(1)
          : 100;
        
        setMetrics({
          totalTickets,
          totalRevenue,
          activeNodes,
          networkHealth
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching node data:', err);
        setError(err.message);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchNodeData();
    
    // Poll every 5 seconds
    const interval = setInterval(fetchNodeData, 5000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="reporting-tool loading">
        <div className="spinner"></div>
        <p>Loading railway network data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reporting-tool error">
        <h3>⚠️ Connection Error</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className="reporting-tool">
      {/* Network Overview */}
      <section className="network-overview">
        <h2>🌍 Network Overview</h2>
        <div className="metrics-grid">
          <MetricCard 
            icon="🎫"
            label="Total Tickets"
            value={metrics.totalTickets}
            trend="+12%"
          />
          <MetricCard 
            icon="💰"
            label="Revenue (AFRC)"
            value={metrics.totalRevenue.toLocaleString()}
            trend="+8%"
          />
          <MetricCard 
            icon="🚉"
            label="Active Nodes"
            value={metrics.activeNodes}
            status="operational"
          />
          <MetricCard 
            icon="📊"
            label="Network Health"
            value={`${metrics.networkHealth}%`}
            status={metrics.networkHealth > 95 ? 'excellent' : 'good'}
          />
        </div>
      </section>

      {/* Railway Nodes */}
      <section className="railway-nodes">
        <h2>🚂 Railway Nodes</h2>
        <div className="nodes-grid">
          <NodeCard 
            name="Lusaka Hub"
            country="Zambia"
            status={nodeData.lusaka.status}
            tickets={nodeData.lusaka.tickets}
            revenue={nodeData.lusaka.revenue}
            sensors={nodeData.lusaka.sensors}
          />
          <NodeCard 
            name="Nairobi Hub"
            country="Kenya"
            status={nodeData.nairobi.status}
            tickets={nodeData.nairobi.tickets}
            revenue={nodeData.nairobi.revenue}
            sensors={nodeData.nairobi.sensors}
          />
        </div>
      </section>

      {/* Real-time Activity */}
      <section className="activity-feed">
        <h2>📡 Real-time Activity</h2>
        <ActivityFeed />
      </section>
    </div>
  );
};

// Metric Card Component
const MetricCard = ({ icon, label, value, trend, status }) => (
  <div className="metric-card">
    <div className="metric-icon">{icon}</div>
    <div className="metric-content">
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
      {trend && <span className="metric-trend positive">{trend}</span>}
      {status && <span className={`metric-status ${status}`}>{status}</span>}
    </div>
  </div>
);

// Node Card Component
const NodeCard = ({ name, country, status, tickets, revenue, sensors }) => (
  <div className={`node-card ${status}`}>
    <div className="node-header">
      <h3>{name}</h3>
      <span className="node-country">{country}</span>
      <span className={`node-status ${status}`}>
        {status === 'active' ? '● Online' : '○ Offline'}
      </span>
    </div>
    
    <div className="node-stats">
      <div className="stat">
        <span className="stat-label">Tickets Sold</span>
        <span className="stat-value">{tickets}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Revenue (AFRC)</span>
        <span className="stat-value">{revenue.toLocaleString()}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Active Sensors</span>
        <span className="stat-value">{sensors.length}</span>
      </div>
    </div>
    
    {sensors.length > 0 && (
      <div className="node-sensors">
        <h4>Sensor Status</h4>
        <ul>
          {sensors.map((sensor, idx) => (
            <li key={idx}>
              <span className="sensor-name">{sensor.name}</span>
              <span className={`sensor-status ${sensor.status}`}>
                {sensor.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    )}
  </div>
);

// Activity Feed Component
const ActivityFeed = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch('/api/events');
        if (response.ok) {
          const data = await response.json();
          setActivities(data.slice(0, 10)); // Last 10 events
        }
      } catch (err) {
        console.error('Error fetching activities:', err);
      }
    };

    fetchActivities();
    const interval = setInterval(fetchActivities, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="activity-list">
      {activities.length === 0 ? (
        <p className="no-activity">No recent activity</p>
      ) : (
        activities.map((activity, idx) => (
          <div key={idx} className="activity-item">
            <span className="activity-time">
              {new Date(activity.timestamp).toLocaleTimeString()}
            </span>
            <span className="activity-message">{activity.message}</span>
          </div>
        ))
      )}
    </div>
  );
};

export default ReportingTool;
