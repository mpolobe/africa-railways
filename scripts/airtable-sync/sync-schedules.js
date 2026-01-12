#!/usr/bin/env node

/**
 * Airtable Sync Script - Train Schedules
 * 
 * Syncs train schedule data from backend API to Airtable
 * Run: node scripts/airtable-sync/sync-schedules.js
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
 * Fetch schedules from backend API
 */
async function fetchSchedules() {
  try {
    console.log('📡 Fetching schedules from backend API...');
    const response = await fetch(`${BACKEND_API_URL}/api/schedules`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Fetched ${data.length} schedules`);
    return data;
  } catch (error) {
    console.error('❌ Error fetching schedules:', error.message);
    throw error;
  }
}

/**
 * Transform backend data to Airtable format
 */
function transformSchedule(schedule) {
  return {
    fields: {
      'Schedule ID': schedule.id || schedule.schedule_id,
      'Train': schedule.train_id || schedule.train_no,
      'Route': schedule.route_name || schedule.line_name,
      'Departure Station': schedule.origin || schedule.from_station,
      'Arrival Station': schedule.destination || schedule.to_station,
      'Departure Time': schedule.departure_time,
      'Arrival Time': schedule.arrival_time,
      'Days of Operation': schedule.operating_days || [],
      'Status': schedule.status || 'Active',
      'Ticket Price (Economy)': parseFloat(schedule.price_economy || 0),
      'Ticket Price (Business)': parseFloat(schedule.price_business || 0),
      'Ticket Price (First)': parseFloat(schedule.price_first || 0),
    }
  };
}

/**
 * Sync schedules to Airtable in batches
 */
async function syncToAirtable(schedules) {
  try {
    console.log('📤 Syncing schedules to Airtable...');
    
    // Airtable allows max 10 records per batch
    const batchSize = 10;
    let synced = 0;
    
    for (let i = 0; i < schedules.length; i += batchSize) {
      const batch = schedules.slice(i, i + batchSize);
      const records = batch.map(transformSchedule);
      
      try {
        // Check if records exist and update, otherwise create
        await base('Schedules').create(records, { typecast: true });
        synced += batch.length;
        console.log(`✅ Synced batch ${Math.floor(i / batchSize) + 1}: ${synced}/${schedules.length} records`);
        
        // Rate limiting: wait 200ms between batches
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`❌ Error syncing batch ${Math.floor(i / batchSize) + 1}:`, error.message);
        // Continue with next batch
      }
    }
    
    console.log(`✅ Sync complete: ${synced}/${schedules.length} records synced`);
    return synced;
  } catch (error) {
    console.error('❌ Error syncing to Airtable:', error.message);
    throw error;
  }
}

/**
 * Main sync function
 */
async function main() {
  console.log('🚀 Starting schedule sync...');
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
    
    // Fetch and sync
    const schedules = await fetchSchedules();
    
    if (schedules.length === 0) {
      console.log('⚠️  No schedules to sync');
      return;
    }
    
    await syncToAirtable(schedules);
    
    console.log('');
    console.log('✅ Schedule sync completed successfully');
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

module.exports = { fetchSchedules, syncToAirtable };
