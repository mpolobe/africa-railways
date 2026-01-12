#!/usr/bin/env node

/**
 * Master Sync Script - Run All Syncs
 * 
 * Orchestrates all Airtable sync operations
 * Run: node scripts/airtable-sync/sync-all.js
 */

const logger = require('./logger');
const SyncMonitor = require('./monitor');

// Import sync modules
const { syncToAirtable: syncSchedules, fetchSchedules } = require('./sync-schedules');
const { syncToAirtable: syncBookings, fetchBookings } = require('./sync-bookings');
const { syncToAirtable: syncUSSD, fetchUSSDSessions } = require('./sync-ussd-sessions');
const { syncToAirtable: syncTransactions, fetchTransactions } = require('./sync-transactions');

const monitor = new SyncMonitor();

/**
 * Run a single sync with error handling and monitoring
 */
async function runSync(name, fetchFn, syncFn, options = {}) {
  const startTime = Date.now();
  logger.syncStart(name, options);
  
  try {
    // Fetch data
    const data = await fetchFn(options.since);
    
    if (data.length === 0) {
      logger.info(`No data to sync for ${name}`);
      monitor.recordSync(name, { success: true, synced: 0, errors: 0 });
      return { success: true, synced: 0, errors: 0 };
    }
    
    // Sync to Airtable
    const result = await syncFn(data);
    
    const duration = Date.now() - startTime;
    logger.syncComplete(name, { ...result, duration: `${duration}ms` });
    
    monitor.recordSync(name, { success: true, ...result });
    return { success: true, ...result };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.syncError(name, error);
    
    monitor.recordSync(name, { success: false, error: error.message, duration: `${duration}ms` });
    return { success: false, error: error.message };
  }
}

/**
 * Main function - run all syncs
 */
async function main() {
  console.log('');
  console.log('🚀 Starting Airtable Master Sync');
  console.log('═'.repeat(60));
  console.log('');
  
  const startTime = Date.now();
  const results = {};
  
  // Define sync jobs
  const syncJobs = [
    {
      name: 'schedules',
      fetchFn: fetchSchedules,
      syncFn: syncSchedules,
      options: {},
    },
    {
      name: 'bookings',
      fetchFn: fetchBookings,
      syncFn: syncBookings,
      options: { since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    },
    {
      name: 'ussd-sessions',
      fetchFn: fetchUSSDSessions,
      syncFn: syncUSSD,
      options: { since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    },
    {
      name: 'transactions',
      fetchFn: fetchTransactions,
      syncFn: syncTransactions,
      options: { since: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
    },
  ];
  
  // Run syncs sequentially
  for (const job of syncJobs) {
    console.log(`\n📊 Syncing ${job.name}...`);
    console.log('─'.repeat(60));
    
    const result = await runSync(job.name, job.fetchFn, job.syncFn, job.options);
    results[job.name] = result;
    
    // Wait between syncs to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Summary
  const totalDuration = Date.now() - startTime;
  console.log('');
  console.log('═'.repeat(60));
  console.log('📊 Sync Summary');
  console.log('═'.repeat(60));
  console.log('');
  
  let totalSynced = 0;
  let totalErrors = 0;
  let successCount = 0;
  let failureCount = 0;
  
  Object.keys(results).forEach(name => {
    const result = results[name];
    const icon = result.success ? '✅' : '❌';
    
    console.log(`${icon} ${name.toUpperCase()}`);
    if (result.success) {
      console.log(`   Synced: ${result.synced || 0} records`);
      console.log(`   Errors: ${result.errors || 0}`);
      totalSynced += result.synced || 0;
      totalErrors += result.errors || 0;
      successCount++;
    } else {
      console.log(`   Error: ${result.error}`);
      failureCount++;
    }
    console.log('');
  });
  
  console.log('─'.repeat(60));
  console.log(`Total Records Synced: ${totalSynced}`);
  console.log(`Total Errors: ${totalErrors}`);
  console.log(`Successful Syncs: ${successCount}/${syncJobs.length}`);
  console.log(`Failed Syncs: ${failureCount}/${syncJobs.length}`);
  console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log('═'.repeat(60));
  console.log('');
  
  // Exit with appropriate code
  process.exit(failureCount > 0 ? 1 : 0);
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    logger.error('Master sync failed', { error: error.message, stack: error.stack });
    process.exit(1);
  });
}

module.exports = { runSync };
