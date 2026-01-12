#!/usr/bin/env node

/**
 * Airtable Sync Script - Bookings
 * 
 * Syncs booking/ticketing data from backend API to Airtable
 * Run: node scripts/airtable-sync/sync-bookings.js
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
 * Fetch bookings from backend API
 * @param {string} since - ISO date string to fetch bookings since
 */
async function fetchBookings(since = null) {
  try {
    const sinceParam = since ? `?since=${since}` : '';
    console.log('📡 Fetching bookings from backend API...');
    
    const response = await fetch(`${BACKEND_API_URL}/api/bookings${sinceParam}`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log(`✅ Fetched ${data.length} bookings`);
    return data;
  } catch (error) {
    console.error('❌ Error fetching bookings:', error.message);
    throw error;
  }
}

/**
 * Transform backend booking data to Airtable format
 */
function transformBooking(booking) {
  return {
    fields: {
      'Booking ID': booking.booking_id || booking.id,
      'Passenger Name': booking.passenger_name || booking.name,
      'Passenger Phone': booking.phone || booking.phone_number,
      'Passenger Email': booking.email || '',
      'Wallet Address': booking.wallet_address || '',
      'Class': booking.class || booking.ticket_class || 'Economy',
      'Seat Number': booking.seat_number || booking.seat,
      'Booking Date': booking.created_at || booking.booking_date,
      'Travel Date': booking.travel_date || booking.departure_date,
      'Payment Method': booking.payment_method || 'AFC',
      'Amount Paid': parseFloat(booking.amount || booking.total_price || 0),
      'Status': booking.status || 'Confirmed',
      'AFRC Rewards': parseFloat(booking.rewards_earned || 0),
      'Booking Source': booking.source || booking.channel || 'Web',
    }
  };
}

/**
 * Sync bookings to Airtable in batches
 */
async function syncToAirtable(bookings) {
  try {
    console.log('📤 Syncing bookings to Airtable...');
    
    const batchSize = 10;
    let synced = 0;
    let errors = 0;
    
    for (let i = 0; i < bookings.length; i += batchSize) {
      const batch = bookings.slice(i, i + batchSize);
      const records = batch.map(transformBooking);
      
      try {
        await base('Bookings').create(records, { typecast: true });
        synced += batch.length;
        console.log(`✅ Synced batch ${Math.floor(i / batchSize) + 1}: ${synced}/${bookings.length} records`);
        
        // Rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (error) {
        errors += batch.length;
        console.error(`❌ Error syncing batch ${Math.floor(i / batchSize) + 1}:`, error.message);
      }
    }
    
    console.log(`✅ Sync complete: ${synced}/${bookings.length} records synced, ${errors} errors`);
    return { synced, errors };
  } catch (error) {
    console.error('❌ Error syncing to Airtable:', error.message);
    throw error;
  }
}

/**
 * Get last sync timestamp from Airtable
 */
async function getLastSyncTime() {
  try {
    const records = await base('Bookings')
      .select({
        maxRecords: 1,
        sort: [{ field: 'Booking Date', direction: 'desc' }]
      })
      .firstPage();
    
    if (records.length > 0) {
      return records[0].get('Booking Date');
    }
    return null;
  } catch (error) {
    console.warn('⚠️  Could not get last sync time:', error.message);
    return null;
  }
}

/**
 * Main sync function
 */
async function main() {
  console.log('🚀 Starting bookings sync...');
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
    
    // Get last sync time for incremental sync
    const lastSync = await getLastSyncTime();
    if (lastSync) {
      console.log(`📅 Last sync: ${lastSync}`);
      console.log('🔄 Performing incremental sync...');
    } else {
      console.log('🔄 Performing full sync...');
    }
    console.log('');
    
    // Fetch and sync
    const bookings = await fetchBookings(lastSync);
    
    if (bookings.length === 0) {
      console.log('⚠️  No new bookings to sync');
      return;
    }
    
    const result = await syncToAirtable(bookings);
    
    console.log('');
    console.log('✅ Bookings sync completed successfully');
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

module.exports = { fetchBookings, syncToAirtable, getLastSyncTime };
