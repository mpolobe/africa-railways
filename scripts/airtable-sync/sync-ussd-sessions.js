#!/usr/bin/env node

/**
 * Airtable Sync Script - USSD Sessions
 * 
 * Syncs USSD gateway session data to Airtable for analytics
 * Run: node scripts/airtable-sync/sync-ussd-sessions.js
 */

const Airtable = require('airtable');
const fetch = require('node-fetch');

// Configuration
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_OPERATIONS_BASE_ID;
const BACKEND_API_URL = process.env.RAILWAYS_API_URL || 'https://africa-railways.vercel.app';

// Initialize Airtable
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

/**
 * Fetch USSD sessions from backend
 */
async function fetchUSSDSessions(since = null) {
  try {
    const sinceParam = since ? `?since=${since}` : '';
    console.log('📡 Fetching USSD sessions from backend...');
    
    const response = await fetch(`${BACKEND_API_URL}/api/ussd/sessions${sinceParam}`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Fetched ${data.length} USSD sessions`);
    return data;
  } catch (error) {
    console.error('❌ Error fetching USSD sessions:', error.message);
    throw error;
  }
}

/**
 * Transform USSD session data to Airtable format
 */
function transformSession(session) {
  const duration = session.end_time && session.start_time
    ? Math.floor((new Date(session.end_time) - new Date(session.start_time)) / 1000)
    : 0;
  
  return {
    fields: {
      'Session ID': session.session_id || session.id,
      'Phone Number': session.phone_number || session.msisdn,
      'Start Time': session.start_time || session.created_at,
      'End Time': session.end_time || null,
      'Duration (seconds)': duration,
      'Menu Path': session.menu_path || session.navigation_path || '',
      'Action Completed': session.action || session.outcome || 'None',
      'Provider': session.provider || 'Africa\'s Talking',
      'Cost (USD)': parseFloat(session.cost || 0),
      'Status': session.status || (session.end_time ? 'Completed' : 'Active'),
    }
  };
}

/**
 * Sync USSD sessions to Airtable
 */
async function syncToAirtable(sessions) {
  try {
    console.log('📤 Syncing USSD sessions to Airtable...');
    
    const batchSize = 10;
    let synced = 0;
    let errors = 0;
    
    for (let i = 0; i < sessions.length; i += batchSize) {
      const batch = sessions.slice(i, i + batchSize);
      const records = batch.map(transformSession);
      
      try {
        await base('USSD Sessions').create(records, { typecast: true });
        synced += batch.length;
        console.log(`✅ Synced batch ${Math.floor(i / batchSize) + 1}: ${synced}/${sessions.length} records`);
        
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        errors += batch.length;
        console.error(`❌ Error syncing batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      }
    }
    
    console.log(`✅ Sync complete: ${synced}/${sessions.length} records synced, ${errors} errors`);
    return { synced, errors };
  } catch (error) {
    console.error('❌ Error syncing to Airtable:', error.message);
    throw error;
  }
}

/**
 * Calculate USSD analytics
 */
function calculateAnalytics(sessions) {
  const total = sessions.length;
  const completed = sessions.filter(s => s.status === 'Completed' || s.end_time).length;
  const abandoned = total - completed;
  const avgDuration = sessions.reduce((sum, s) => {
    const duration = s.end_time && s.start_time
      ? (new Date(s.end_time) - new Date(s.start_time)) / 1000
      : 0;
    return sum + duration;
  }, 0) / total;
  
  const totalCost = sessions.reduce((sum, s) => sum + parseFloat(s.cost || 0), 0);
  
  return {
    total,
    completed,
    abandoned,
    completionRate: ((completed / total) * 100).toFixed(2),
    avgDuration: avgDuration.toFixed(2),
    totalCost: totalCost.toFixed(4),
  };
}

/**
 * Main sync function
 */
async function main() {
  console.log('🚀 Starting USSD sessions sync...');
  console.log(`📍 Backend API: ${BACKEND_API_URL}`);
  console.log(`📍 Airtable Base: ${AIRTABLE_BASE_ID}`);
  console.log('');
  
  try {
    // Validate environment variables
    if (!AIRTABLE_API_KEY) {
      throw new Error('AIRTABLE_API_KEY environment variable is required');
    }
    if (!AIRTABLE_BASE_ID) {
      throw new Error('AIRTABLE_OPERATIONS_BASE_ID environment variable is required');
    }
    
    // Fetch sessions from last 24 hours by default
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    console.log(`📅 Fetching sessions since: ${since}`);
    console.log('');
    
    const sessions = await fetchUSSDSessions(since);
    
    if (sessions.length === 0) {
      console.log('⚠️  No USSD sessions to sync');
      return;
    }
    
    // Calculate analytics
    const analytics = calculateAnalytics(sessions);
    console.log('📊 Session Analytics:');
    console.log(`   Total: ${analytics.total}`);
    console.log(`   Completed: ${analytics.completed}`);
    console.log(`   Abandoned: ${analytics.abandoned}`);
    console.log(`   Completion Rate: ${analytics.completionRate}%`);
    console.log(`   Avg Duration: ${analytics.avgDuration}s`);
    console.log(`   Total Cost: $${analytics.totalCost}`);
    console.log('');
    
    const result = await syncToAirtable(sessions);
    
    console.log('');
    console.log('✅ USSD sessions sync completed successfully');
    console.log(`📊 Stats: ${result.synced} synced, ${result.errors} errors`);
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Sync failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { fetchUSSDSessions, syncToAirtable, calculateAnalytics };
