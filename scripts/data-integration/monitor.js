#!/usr/bin/env node

/**
 * Monitoring Script for Data Integration Pipeline
 * 
 * Provides:
 * - Health status checks
 * - Sync history tracking
 * - Alert thresholds
 * - Performance metrics
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGS_DIR = path.join(__dirname, 'logs');
const STATE_FILE = path.join(__dirname, '.sync-state.json');

/**
 * Alert thresholds
 */
const THRESHOLDS = {
  maxSyncAge: 60 * 60 * 1000, // 1 hour
  maxErrorRate: 0.1, // 10%
  maxConsecutiveFailures: 3,
  minRecordsPerSync: 1,
};

/**
 * Load sync state
 */
function loadState() {
  try {
    if (fs.existsSync(STATE_FILE)) {
      return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    }
  } catch (error) {
    console.error('Error loading state:', error.message);
  }
  
  return {
    lastSync: null,
    lastSuccess: null,
    lastFailure: null,
    consecutiveFailures: 0,
    totalSyncs: 0,
    totalSuccesses: 0,
    totalFailures: 0,
    history: [],
  };
}

/**
 * Save sync state
 */
function saveState(state) {
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
  } catch (error) {
    console.error('Error saving state:', error.message);
  }
}

/**
 * Record sync result
 */
export function recordSync(result) {
  const state = loadState();
  
  const syncRecord = {
    timestamp: new Date().toISOString(),
    success: result.success,
    duration: result.duration,
    records: result.records || 0,
    errors: result.errors || [],
  };
  
  state.lastSync = syncRecord.timestamp;
  state.totalSyncs++;
  
  if (result.success) {
    state.lastSuccess = syncRecord.timestamp;
    state.totalSuccesses++;
    state.consecutiveFailures = 0;
  } else {
    state.lastFailure = syncRecord.timestamp;
    state.totalFailures++;
    state.consecutiveFailures++;
  }
  
  // Keep last 100 records
  state.history.unshift(syncRecord);
  state.history = state.history.slice(0, 100);
  
  saveState(state);
  
  // Check for alerts
  checkAlerts(state);
  
  return state;
}

/**
 * Check alert conditions
 */
function checkAlerts(state) {
  const alerts = [];
  
  // Check consecutive failures
  if (state.consecutiveFailures >= THRESHOLDS.maxConsecutiveFailures) {
    alerts.push({
      level: 'critical',
      message: `${state.consecutiveFailures} consecutive sync failures`,
    });
  }
  
  // Check error rate
  if (state.totalSyncs > 10) {
    const errorRate = state.totalFailures / state.totalSyncs;
    if (errorRate > THRESHOLDS.maxErrorRate) {
      alerts.push({
        level: 'warning',
        message: `High error rate: ${(errorRate * 100).toFixed(1)}%`,
      });
    }
  }
  
  // Check sync age
  if (state.lastSuccess) {
    const age = Date.now() - new Date(state.lastSuccess).getTime();
    if (age > THRESHOLDS.maxSyncAge) {
      alerts.push({
        level: 'warning',
        message: `Last successful sync was ${Math.round(age / 60000)} minutes ago`,
      });
    }
  }
  
  // Log alerts
  if (alerts.length > 0) {
    console.log('\n--- ALERTS ---');
    alerts.forEach(alert => {
      const icon = alert.level === 'critical' ? '[!]' : '[*]';
      console.log(`${icon} ${alert.level.toUpperCase()}: ${alert.message}`);
    });
    console.log('--------------\n');
  }
  
  return alerts;
}

/**
 * Get health status
 */
export function getHealthStatus() {
  const state = loadState();
  
  const status = {
    healthy: true,
    checks: [],
    state,
  };
  
  // Check 1: Recent sync
  const lastSyncAge = state.lastSync 
    ? Date.now() - new Date(state.lastSync).getTime()
    : Infinity;
  
  status.checks.push({
    name: 'recent_sync',
    passed: lastSyncAge < THRESHOLDS.maxSyncAge,
    message: state.lastSync 
      ? `Last sync: ${Math.round(lastSyncAge / 60000)} minutes ago`
      : 'No syncs recorded',
  });
  
  // Check 2: Consecutive failures
  status.checks.push({
    name: 'consecutive_failures',
    passed: state.consecutiveFailures < THRESHOLDS.maxConsecutiveFailures,
    message: `Consecutive failures: ${state.consecutiveFailures}`,
  });
  
  // Check 3: Error rate
  const errorRate = state.totalSyncs > 0 
    ? state.totalFailures / state.totalSyncs 
    : 0;
  
  status.checks.push({
    name: 'error_rate',
    passed: errorRate <= THRESHOLDS.maxErrorRate,
    message: `Error rate: ${(errorRate * 100).toFixed(1)}%`,
  });
  
  // Overall health
  status.healthy = status.checks.every(c => c.passed);
  
  return status;
}

/**
 * Get sync history
 */
export function getSyncHistory(limit = 10) {
  const state = loadState();
  return state.history.slice(0, limit);
}

/**
 * Get performance metrics
 */
export function getMetrics() {
  const state = loadState();
  
  const recentSyncs = state.history.slice(0, 20);
  
  const metrics = {
    totalSyncs: state.totalSyncs,
    successRate: state.totalSyncs > 0 
      ? ((state.totalSuccesses / state.totalSyncs) * 100).toFixed(1) + '%'
      : 'N/A',
    averageDuration: recentSyncs.length > 0
      ? Math.round(recentSyncs.reduce((sum, s) => sum + (s.duration || 0), 0) / recentSyncs.length)
      : 0,
    averageRecords: recentSyncs.length > 0
      ? Math.round(recentSyncs.reduce((sum, s) => sum + (s.records || 0), 0) / recentSyncs.length)
      : 0,
    lastSync: state.lastSync,
    lastSuccess: state.lastSuccess,
    consecutiveFailures: state.consecutiveFailures,
  };
  
  return metrics;
}

/**
 * Print health report
 */
export function printHealthReport() {
  const health = getHealthStatus();
  const metrics = getMetrics();
  const history = getSyncHistory(5);
  
  console.log('');
  console.log('Africa Railways Data Integration - Health Report');
  console.log('='.repeat(55));
  console.log('');
  
  // Overall status
  const statusIcon = health.healthy ? '[OK]' : '[!!]';
  console.log(`Status: ${statusIcon} ${health.healthy ? 'Healthy' : 'Unhealthy'}`);
  console.log('');
  
  // Health checks
  console.log('Health Checks:');
  health.checks.forEach(check => {
    const icon = check.passed ? '[OK]' : '[!!]';
    console.log(`  ${icon} ${check.name}: ${check.message}`);
  });
  console.log('');
  
  // Metrics
  console.log('Metrics:');
  console.log(`  Total Syncs: ${metrics.totalSyncs}`);
  console.log(`  Success Rate: ${metrics.successRate}`);
  console.log(`  Avg Duration: ${metrics.averageDuration}ms`);
  console.log(`  Avg Records: ${metrics.averageRecords}`);
  console.log(`  Last Sync: ${metrics.lastSync || 'Never'}`);
  console.log(`  Last Success: ${metrics.lastSuccess || 'Never'}`);
  console.log('');
  
  // Recent history
  if (history.length > 0) {
    console.log('Recent Syncs:');
    history.forEach(sync => {
      const icon = sync.success ? '[OK]' : '[!!]';
      const time = new Date(sync.timestamp).toLocaleString();
      console.log(`  ${icon} ${time} - ${sync.records} records, ${sync.duration}ms`);
    });
    console.log('');
  }
  
  // Alerts
  const alerts = checkAlerts(health.state);
  if (alerts.length > 0) {
    console.log('Active Alerts:');
    alerts.forEach(alert => {
      console.log(`  [${alert.level.toUpperCase()}] ${alert.message}`);
    });
    console.log('');
  }
  
  console.log('='.repeat(55));
  console.log('');
  
  return health;
}

/**
 * Export health status as JSON
 */
export function exportHealthJSON() {
  return {
    timestamp: new Date().toISOString(),
    health: getHealthStatus(),
    metrics: getMetrics(),
    history: getSyncHistory(10),
  };
}

/**
 * Reset state (for testing)
 */
export function resetState() {
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE);
  }
  console.log('State reset');
}

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.includes('--json')) {
    console.log(JSON.stringify(exportHealthJSON(), null, 2));
  } else if (args.includes('--reset')) {
    resetState();
  } else {
    printHealthReport();
  }
}

export default {
  recordSync,
  getHealthStatus,
  getSyncHistory,
  getMetrics,
  printHealthReport,
  exportHealthJSON,
  resetState,
};
