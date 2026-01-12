#!/usr/bin/env node

/**
 * Scenario A: API Integration
 * 
 * Syncs data from Africa Railways API to Airtable
 * Use when the railway website has JSON/XML endpoints
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { upsertRecords, batchCreate } from './airtable.js';

dotenv.config();

const API_BASE_URL = process.env.AFRICA_RAIL_BASE_URL;
const API_KEY = process.env.AFRICA_RAIL_API_KEY;
const TIMEOUT = parseInt(process.env.TIMEOUT_MS) || 30000;

// Configure axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Authorization': `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  },
});

/**
 * Fetch schedules from API
 */
async function fetchSchedules() {
  try {
    console.log('📡 Fetching schedules from API...');
    
    const response = await api.get('/api/schedules');
    const schedules = response.data;

    console.log(`✅ Fetched ${schedules.length} schedules`);
    return schedules;
  } catch (error) {
    console.error('❌ Error fetching schedules:', error.message);
    return [];
  }
}

/**
 * Transform API data to Airtable format
 */
function transformSchedule(schedule) {
  return {
    'Schedule ID': schedule.id || schedule.schedule_id,
    'Train': schedule.train_id || schedule.train_number,
    'Route': schedule.route_name || schedule.line,
    'Departure Station': schedule.origin || schedule.from_station,
    'Arrival Station': schedule.destination || schedule.to_station,
    'Departure Time': schedule.departure_time,
    'Arrival Time': schedule.arrival_time,
    'Days of Operation': schedule.operating_days || [],
    'Status': schedule.status || 'Active',
    'Ticket Price (Economy)': parseFloat(schedule.price_economy || 0),
    'Ticket Price (Business)': parseFloat(schedule.price_business || 0),
    'Ticket Price (First)': parseFloat(schedule.price_first || 0),
  };
}

/**
 * Fetch bookings from API
 */
async function fetchBookings(since = null) {
  try {
    console.log('📡 Fetching bookings from API...');
    
    const params = since ? { since } : {};
    const response = await api.get('/api/bookings', { params });
    const bookings = response.data;

    console.log(`✅ Fetched ${bookings.length} bookings`);
    return bookings;
  } catch (error) {
    console.error('❌ Error fetching bookings:', error.message);
    return [];
  }
}

/**
 * Transform booking data to Airtable format
 */
function transformBooking(booking) {
  return {
    'Booking ID': booking.id || booking.booking_id,
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
  };
}

/**
 * Fetch stations from API
 */
async function fetchStations() {
  try {
    console.log('📡 Fetching stations from API...');
    
    const response = await api.get('/api/stations');
    const stations = response.data;

    console.log(`✅ Fetched ${stations.length} stations`);
    return stations;
  } catch (error) {
    console.error('❌ Error fetching stations:', error.message);
    return [];
  }
}

/**
 * Transform station data to Airtable format
 */
function transformStation(station) {
  return {
    'Station ID': station.id || station.station_id,
    'Name': station.name,
    'City': station.city,
    'Country': station.country,
    'Coordinates': station.coordinates || `${station.latitude},${station.longitude}`,
    'Type': station.type || 'Stop',
    'Facilities': station.facilities || [],
    'Platform Count': parseInt(station.platforms || 0),
    'Daily Capacity': parseInt(station.capacity || 0),
    'Status': station.status || 'Active',
  };
}

/**
 * Fetch trains from API
 */
async function fetchTrains() {
  try {
    console.log('📡 Fetching trains from API...');
    
    const response = await api.get('/api/trains');
    const trains = response.data;

    console.log(`✅ Fetched ${trains.length} trains`);
    return trains;
  } catch (error) {
    console.error('❌ Error fetching trains:', error.message);
    return [];
  }
}

/**
 * Transform train data to Airtable format
 */
function transformTrain(train) {
  return {
    'Train ID': train.id || train.train_id,
    'Type': train.type || 'Passenger',
    'Model': train.model || '',
    'Year': parseInt(train.year || new Date().getFullYear()),
    'Capacity (passengers)': parseInt(train.capacity || 0),
    'Current Status': train.status || 'In Service',
    'Fuel Type': train.fuel_type || 'Diesel',
    'Condition Score': parseInt(train.condition || 4),
  };
}

/**
 * Sync all data from API to Airtable
 */
async function syncAll() {
  console.log('🚀 Starting API sync...');
  console.log('═'.repeat(60));
  console.log('');

  const results = {
    schedules: { created: 0, updated: 0, errors: 0 },
    bookings: { created: 0, updated: 0, errors: 0 },
    stations: { created: 0, updated: 0, errors: 0 },
    trains: { created: 0, updated: 0, errors: 0 },
  };

  try {
    // Sync schedules
    console.log('\n📊 Syncing Schedules...');
    const schedules = await fetchSchedules();
    if (schedules.length > 0) {
      const transformed = schedules.map(transformSchedule);
      results.schedules = await upsertRecords('Schedules', transformed, 'Schedule ID');
      console.log(`✅ Schedules: ${results.schedules.created} created, ${results.schedules.updated} updated`);
    }

    // Sync bookings (last 24 hours)
    console.log('\n📊 Syncing Bookings...');
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const bookings = await fetchBookings(since);
    if (bookings.length > 0) {
      const transformed = bookings.map(transformBooking);
      results.bookings = await upsertRecords('Bookings', transformed, 'Booking ID');
      console.log(`✅ Bookings: ${results.bookings.created} created, ${results.bookings.updated} updated`);
    }

    // Sync stations
    console.log('\n📊 Syncing Stations...');
    const stations = await fetchStations();
    if (stations.length > 0) {
      const transformed = stations.map(transformStation);
      results.stations = await upsertRecords('Stations', transformed, 'Station ID');
      console.log(`✅ Stations: ${results.stations.created} created, ${results.stations.updated} updated`);
    }

    // Sync trains
    console.log('\n📊 Syncing Trains...');
    const trains = await fetchTrains();
    if (trains.length > 0) {
      const transformed = trains.map(transformTrain);
      results.trains = await upsertRecords('Trains / Rolling Stock', transformed, 'Train ID');
      console.log(`✅ Trains: ${results.trains.created} created, ${results.trains.updated} updated`);
    }

    console.log('');
    console.log('═'.repeat(60));
    console.log('✅ API sync completed successfully');
    console.log('');
    console.log('Summary:');
    console.log(`  Schedules: ${results.schedules.created + results.schedules.updated} synced`);
    console.log(`  Bookings: ${results.bookings.created + results.bookings.updated} synced`);
    console.log(`  Stations: ${results.stations.created + results.stations.updated} synced`);
    console.log(`  Trains: ${results.trains.created + results.trains.updated} synced`);
    console.log('');

    return results;
  } catch (error) {
    console.error('❌ Sync failed:', error.message);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  syncAll()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { syncAll, fetchSchedules, fetchBookings, fetchStations, fetchTrains };
