#!/usr/bin/env node

/**
 * Airtable Sync Monitor
 * 
 * Monitors sync job health and sends alerts
 * Run: node scripts/airtable-sync/monitor.js
 */

const fs = require('fs');
const path = require('path');
const logger = require('./logger');

class SyncMonitor {
  constructor() {
    this.metricsFile = path.join(__dirname, '../../logs/airtable-sync/metrics.json');
    this.alertThresholds = {
      errorRate: 0.1, // 10% error rate
      syncDelay: 3600000, // 1 hour in ms
      consecutiveFailures: 3,
    };
  }

  /**
   * Load metrics from file
   */
  loadMetrics() {
    try {
      if (fs.existsSync(this.metricsFile)) {
        const data = fs.readFileSync(this.metricsFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      logger.error('Failed to load metrics', { error: error.message });
    }
    return {};
  }

  /**
   * Save metrics to file
   */
  saveMetrics(metrics) {
    try {
      const dir = path.dirname(this.metricsFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.metricsFile, JSON.stringify(metrics, null, 2));
    } catch (error) {
      logger.error('Failed to save metrics', { error: error.message });
    }
  }

  /**
   * Record sync result
   */
  recordSync(syncType, result) {
    const metrics = this.loadMetrics();
    
    if (!metrics[syncType]) {
      metrics[syncType] = {
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        lastSuccess: null,
        lastFailure: null,
        consecutiveFailures: 0,
        totalRecordsSynced: 0,
        totalErrors: 0,
      };
    }
    
    const syncMetrics = metrics[syncType];
    syncMetrics.totalRuns++;
    
    if (result.success) {
      syncMetrics.successfulRuns++;
      syncMetrics.lastSuccess = new Date().toISOString();
      syncMetrics.consecutiveFailures = 0;
      syncMetrics.totalRecordsSynced += result.synced || 0;
    } else {
      syncMetrics.failedRuns++;
      syncMetrics.lastFailure = new Date().toISOString();
      syncMetrics.consecutiveFailures++;
    }
    
    syncMetrics.totalErrors += result.errors || 0;
    
    this.saveMetrics(metrics);
    this.checkAlerts(syncType, syncMetrics);
    
    return syncMetrics;
  }

  /**
   * Check if alerts should be triggered
   */
  checkAlerts(syncType, metrics) {
    const alerts = [];
    
    // Check error rate
    if (metrics.totalRuns > 0) {
      const errorRate = metrics.failedRuns / metrics.totalRuns;
      if (errorRate > this.alertThresholds.errorRate) {
        alerts.push({
          type: 'HIGH_ERROR_RATE',
          severity: 'warning',
          message: `${syncType} has high error rate: ${(errorRate * 100).toFixed(1)}%`,
          metrics: { errorRate, totalRuns: metrics.totalRuns, failedRuns: metrics.failedRuns },
        });
      }
    }
    
    // Check sync delay
    if (metrics.lastSuccess) {
      const timeSinceLastSuccess = Date.now() - new Date(metrics.lastSuccess).getTime();
      if (timeSinceLastSuccess > this.alertThresholds.syncDelay) {
        alerts.push({
          type: 'SYNC_DELAY',
          severity: 'warning',
          message: `${syncType} hasn't synced successfully in ${Math.floor(timeSinceLastSuccess / 60000)} minutes`,
          metrics: { lastSuccess: metrics.lastSuccess, delayMinutes: Math.floor(timeSinceLastSuccess / 60000) },
        });
      }
    }
    
    // Check consecutive failures
    if (metrics.consecutiveFailures >= this.alertThresholds.consecutiveFailures) {
      alerts.push({
        type: 'CONSECUTIVE_FAILURES',
        severity: 'critical',
        message: `${syncType} has failed ${metrics.consecutiveFailures} times in a row`,
        metrics: { consecutiveFailures: metrics.consecutiveFailures, lastFailure: metrics.lastFailure },
      });
    }
    
    // Send alerts
    alerts.forEach(alert => this.sendAlert(alert));
    
    return alerts;
  }

  /**
   * Send alert (log for now, can be extended to email/Slack/etc)
   */
  sendAlert(alert) {
    const logLevel = alert.severity === 'critical' ? 'error' : 'warn';
    logger[logLevel](`ALERT: ${alert.message}`, {
      type: alert.type,
      severity: alert.severity,
      metrics: alert.metrics,
    });
  }

  /**
   * Get sync health status
   */
  getHealthStatus() {
    const metrics = this.loadMetrics();
    const health = {};
    
    Object.keys(metrics).forEach(syncType => {
      const m = metrics[syncType];
      const successRate = m.totalRuns > 0 ? (m.successfulRuns / m.totalRuns) * 100 : 0;
      const timeSinceLastSuccess = m.lastSuccess 
        ? Date.now() - new Date(m.lastSuccess).getTime()
        : null;
      
      health[syncType] = {
        status: this.determineStatus(m, timeSinceLastSuccess),
        successRate: successRate.toFixed(1) + '%',
        totalRuns: m.totalRuns,
        consecutiveFailures: m.consecutiveFailures,
        lastSuccess: m.lastSuccess,
        lastFailure: m.lastFailure,
        totalRecordsSynced: m.totalRecordsSynced,
      };
    });
    
    return health;
  }

  /**
   * Determine sync status
   */
  determineStatus(metrics, timeSinceLastSuccess) {
    if (metrics.consecutiveFailures >= this.alertThresholds.consecutiveFailures) {
      return 'critical';
    }
    if (timeSinceLastSuccess && timeSinceLastSuccess > this.alertThresholds.syncDelay) {
      return 'warning';
    }
    if (metrics.totalRuns > 0 && metrics.failedRuns / metrics.totalRuns > this.alertThresholds.errorRate) {
      return 'warning';
    }
    return 'healthy';
  }

  /**
   * Generate health report
   */
  generateReport() {
    const health = this.getHealthStatus();
    
    console.log('\n📊 Airtable Sync Health Report');
    console.log('═'.repeat(60));
    console.log('');
    
    Object.keys(health).forEach(syncType => {
      const status = health[syncType];
      const statusIcon = {
        healthy: '✅',
        warning: '⚠️',
        critical: '❌',
      }[status.status];
      
      console.log(`${statusIcon} ${syncType.toUpperCase()}`);
      console.log(`   Status: ${status.status}`);
      console.log(`   Success Rate: ${status.successRate}`);
      console.log(`   Total Runs: ${status.totalRuns}`);
      console.log(`   Records Synced: ${status.totalRecordsSynced}`);
      console.log(`   Last Success: ${status.lastSuccess || 'Never'}`);
      if (status.consecutiveFailures > 0) {
        console.log(`   ⚠️  Consecutive Failures: ${status.consecutiveFailures}`);
      }
      console.log('');
    });
    
    console.log('═'.repeat(60));
  }
}

// CLI interface
if (require.main === module) {
  const monitor = new SyncMonitor();
  const command = process.argv[2];
  
  switch (command) {
    case 'report':
      monitor.generateReport();
      break;
    case 'health':
      console.log(JSON.stringify(monitor.getHealthStatus(), null, 2));
      break;
    default:
      console.log('Usage: node monitor.js [report|health]');
      console.log('  report - Generate human-readable health report');
      console.log('  health - Output health status as JSON');
  }
}

module.exports = SyncMonitor;
