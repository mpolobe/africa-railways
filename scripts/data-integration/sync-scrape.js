#!/usr/bin/env node

/**
 * Scenario B: Web Scraping Integration
 * 
 * Scrapes data from Africa Railways website when no API is available
 * Use when the railway website only has HTML pages
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import dotenv from 'dotenv';
import { upsertRecords } from './airtable.js';

dotenv.config();

const BASE_URL = process.env.AFRICA_RAIL_BASE_URL;
const TIMEOUT = parseInt(process.env.TIMEOUT_MS) || 30000;

// Configure axios
const client = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; AfricaRailwaysBot/1.0)',
  },
});

/**
 * Scrape schedules from website
 */
async function scrapeSchedules() {
  try {
    console.log('🕷️  Scraping schedules from website...');
    
    const response = await client.get('/schedules');
    const $ = cheerio.load(response.data);
    const schedules = [];

    // Example: Adjust selectors based on actual website structure
    $('.schedule-row').each((i, element) => {
      const $row = $(element);
      
      const schedule = {
        'Schedule ID': $row.find('.schedule-id').text().trim(),
        'Train': $row.find('.train-number').text().trim(),
        'Route': $row.find('.route-name').text().trim(),
        'Departure Station': $row.find('.departure-station').text().trim(),
        'Arrival Station': $row.find('.arrival-station').text().trim(),
        'Departure Time': $row.find('.departure-time').text().trim(),
        'Arrival Time': $row.find('.arrival-time').text().trim(),
        'Status': $row.find('.status').text().trim() || 'Active',
        'Ticket Price (Economy)': parseFloat($row.find('.price-economy').text().replace(/[^0-9.]/g, '') || 0),
        'Ticket Price (Business)': parseFloat($row.find('.price-business').text().replace(/[^0-9.]/g, '') || 0),
        'Ticket Price (First)': parseFloat($row.find('.price-first').text().replace(/[^0-9.]/g, '') || 0),
      };

      if (schedule['Schedule ID']) {
        schedules.push(schedule);
      }
    });

    console.log(`✅ Scraped ${schedules.length} schedules`);
    return schedules;
  } catch (error) {
    console.error('❌ Error scraping schedules:', error.message);
    return [];
  }
}

/**
 * Scrape stations from website
 */
async function scrapeStations() {
  try {
    console.log('🕷️  Scraping stations from website...');
    
    const response = await client.get('/stations');
    const $ = cheerio.load(response.data);
    const stations = [];

    // Example: Adjust selectors based on actual website structure
    $('.station-card').each((i, element) => {
      const $card = $(element);
      
      const station = {
        'Station ID': $card.find('.station-id').text().trim() || `STN-${i + 1}`,
        'Name': $card.find('.station-name').text().trim(),
        'City': $card.find('.station-city').text().trim(),
        'Country': $card.find('.station-country').text().trim(),
        'Type': $card.find('.station-type').text().trim() || 'Stop',
        'Status': $card.find('.station-status').text().trim() || 'Active',
      };

      if (station['Name']) {
        stations.push(station);
      }
    });

    console.log(`✅ Scraped ${stations.length} stations`);
    return stations;
  } catch (error) {
    console.error('❌ Error scraping stations:', error.message);
    return [];
  }
}

/**
 * Scrape train information from website
 */
async function scrapeTrains() {
  try {
    console.log('🕷️  Scraping trains from website...');
    
    const response = await client.get('/fleet');
    const $ = cheerio.load(response.data);
    const trains = [];

    // Example: Adjust selectors based on actual website structure
    $('.train-card').each((i, element) => {
      const $card = $(element);
      
      const train = {
        'Train ID': $card.find('.train-id').text().trim() || `TRN-${i + 1}`,
        'Type': $card.find('.train-type').text().trim() || 'Passenger',
        'Model': $card.find('.train-model').text().trim(),
        'Capacity (passengers)': parseInt($card.find('.train-capacity').text().replace(/[^0-9]/g, '') || 0),
        'Current Status': $card.find('.train-status').text().trim() || 'In Service',
      };

      if (train['Train ID']) {
        trains.push(train);
      }
    });

    console.log(`✅ Scraped ${trains.length} trains`);
    return trains;
  } catch (error) {
    console.error('❌ Error scraping trains:', error.message);
    return [];
  }
}

/**
 * Scrape news/updates from website
 */
async function scrapeNews() {
  try {
    console.log('🕷️  Scraping news from website...');
    
    const response = await client.get('/news');
    const $ = cheerio.load(response.data);
    const news = [];

    $('.news-item').each((i, element) => {
      const $item = $(element);
      
      const newsItem = {
        'Title': $item.find('.news-title').text().trim(),
        'Date': $item.find('.news-date').text().trim(),
        'Content': $item.find('.news-content').text().trim(),
        'Category': $item.find('.news-category').text().trim() || 'General',
        'URL': $item.find('a').attr('href'),
      };

      if (newsItem['Title']) {
        news.push(newsItem);
      }
    });

    console.log(`✅ Scraped ${news.length} news items`);
    return news;
  } catch (error) {
    console.error('❌ Error scraping news:', error.message);
    return [];
  }
}

/**
 * Generic scraper for custom pages
 */
async function scrapePage(url, selectors) {
  try {
    console.log(`🕷️  Scraping ${url}...`);
    
    const response = await client.get(url);
    const $ = cheerio.load(response.data);
    const data = [];

    $(selectors.container).each((i, element) => {
      const $el = $(element);
      const item = {};

      Object.keys(selectors.fields).forEach(field => {
        const selector = selectors.fields[field];
        item[field] = $el.find(selector).text().trim();
      });

      data.push(item);
    });

    console.log(`✅ Scraped ${data.length} items from ${url}`);
    return data;
  } catch (error) {
    console.error(`❌ Error scraping ${url}:`, error.message);
    return [];
  }
}

/**
 * Sync all scraped data to Airtable
 */
async function syncAll() {
  console.log('🚀 Starting web scraping sync...');
  console.log('═'.repeat(60));
  console.log('');

  const results = {
    schedules: { created: 0, updated: 0, errors: 0 },
    stations: { created: 0, updated: 0, errors: 0 },
    trains: { created: 0, updated: 0, errors: 0 },
  };

  try {
    // Scrape and sync schedules
    console.log('\n📊 Scraping Schedules...');
    const schedules = await scrapeSchedules();
    if (schedules.length > 0) {
      results.schedules = await upsertRecords('Schedules', schedules, 'Schedule ID');
      console.log(`✅ Schedules: ${results.schedules.created} created, ${results.schedules.updated} updated`);
    }

    // Scrape and sync stations
    console.log('\n📊 Scraping Stations...');
    const stations = await scrapeStations();
    if (stations.length > 0) {
      results.stations = await upsertRecords('Stations', stations, 'Station ID');
      console.log(`✅ Stations: ${results.stations.created} created, ${results.stations.updated} updated`);
    }

    // Scrape and sync trains
    console.log('\n📊 Scraping Trains...');
    const trains = await scrapeTrains();
    if (trains.length > 0) {
      results.trains = await upsertRecords('Trains / Rolling Stock', trains, 'Train ID');
      console.log(`✅ Trains: ${results.trains.created} created, ${results.trains.updated} updated`);
    }

    console.log('');
    console.log('═'.repeat(60));
    console.log('✅ Web scraping sync completed successfully');
    console.log('');
    console.log('Summary:');
    console.log(`  Schedules: ${results.schedules.created + results.schedules.updated} synced`);
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

export { 
  syncAll, 
  scrapeSchedules, 
  scrapeStations, 
  scrapeTrains, 
  scrapeNews,
  scrapePage 
};
