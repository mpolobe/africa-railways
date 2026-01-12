#!/usr/bin/env node

/**
 * Custom GPT Function Actions Wrapper
 * 
 * Provides secure API wrapper for ChatGPT to query Airtable
 * Deploy this as a serverless function or API endpoint
 */

import Airtable from 'airtable';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Airtable
const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_OPERATIONS_BASE_ID
);

/**
 * Authentication middleware
 */
function authenticate(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey || apiKey !== process.env.GPT_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  next();
}

/**
 * GET /schedules - Query train schedules
 */
app.get('/api/schedules', authenticate, async (req, res) => {
  try {
    const { from, to, date, maxRecords = 10 } = req.query;
    
    let filterFormula = '';
    const filters = [];
    
    if (from) filters.push(`{Departure Station} = '${from}'`);
    if (to) filters.push(`{Arrival Station} = '${to}'`);
    if (date) filters.push(`{Departure Time} >= '${date}'`);
    
    if (filters.length > 0) {
      filterFormula = `AND(${filters.join(', ')})`;
    }
    
    const records = await base('Schedules')
      .select({
        maxRecords: parseInt(maxRecords),
        filterByFormula: filterFormula,
        sort: [{ field: 'Departure Time', direction: 'asc' }],
      })
      .all();
    
    const schedules = records.map(record => ({
      id: record.id,
      ...record.fields,
    }));
    
    res.json({
      success: true,
      count: schedules.length,
      data: schedules,
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

/**
 * GET /next-train - Find next available train
 */
app.get('/api/next-train', authenticate, async (req, res) => {
  try {
    const { from, to } = req.query;
    
    if (!from || !to) {
      return res.status(400).json({ error: 'from and to parameters required' });
    }
    
    const now = new Date().toISOString();
    const filterFormula = `AND(
      {Departure Station} = '${from}',
      {Arrival Station} = '${to}',
      {Departure Time} >= '${now}',
      {Status} = 'Active'
    )`;
    
    const records = await base('Schedules')
      .select({
        maxRecords: 1,
        filterByFormula: filterFormula,
        sort: [{ field: 'Departure Time', direction: 'asc' }],
      })
      .all();
    
    if (records.length === 0) {
      return res.json({
        success: true,
        message: `No trains found from ${from} to ${to}`,
        data: null,
      });
    }
    
    const train = {
      id: records[0].id,
      ...records[0].fields,
    };
    
    res.json({
      success: true,
      message: `Next train from ${from} to ${to}`,
      data: train,
    });
  } catch (error) {
    console.error('Error finding next train:', error);
    res.status(500).json({ error: 'Failed to find next train' });
  }
});

/**
 * GET /delays - Get delayed trains
 */
app.get('/api/delays', authenticate, async (req, res) => {
  try {
    const { route, days = 7 } = req.query;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    let filterFormula = `AND(
      {Status} = 'Delayed',
      {Departure Time} >= '${startDate.toISOString()}'
    )`;
    
    if (route) {
      filterFormula = `AND(
        {Route} = '${route}',
        {Status} = 'Delayed',
        {Departure Time} >= '${startDate.toISOString()}'
      )`;
    }
    
    const records = await base('Schedules')
      .select({
        filterByFormula: filterFormula,
        sort: [{ field: 'Departure Time', direction: 'desc' }],
      })
      .all();
    
    const delays = records.map(record => ({
      id: record.id,
      ...record.fields,
    }));
    
    res.json({
      success: true,
      count: delays.length,
      period: `Last ${days} days`,
      data: delays,
    });
  } catch (error) {
    console.error('Error fetching delays:', error);
    res.status(500).json({ error: 'Failed to fetch delays' });
  }
});

/**
 * GET /bookings/stats - Get booking statistics
 */
app.get('/api/bookings/stats', authenticate, async (req, res) => {
  try {
    const { period = 'week' } = req.query;
    
    const startDate = new Date();
    if (period === 'week') startDate.setDate(startDate.getDate() - 7);
    else if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
    else if (period === 'day') startDate.setDate(startDate.getDate() - 1);
    
    const records = await base('Bookings')
      .select({
        filterByFormula: `{Booking Date} >= '${startDate.toISOString()}'`,
      })
      .all();
    
    const stats = {
      total: records.length,
      confirmed: records.filter(r => r.fields.Status === 'Confirmed').length,
      cancelled: records.filter(r => r.fields.Status === 'Cancelled').length,
      revenue: records.reduce((sum, r) => sum + (r.fields['Amount Paid'] || 0), 0),
      byClass: {
        economy: records.filter(r => r.fields.Class === 'Economy').length,
        business: records.filter(r => r.fields.Class === 'Business').length,
        first: records.filter(r => r.fields.Class === 'First').length,
      },
    };
    
    res.json({
      success: true,
      period,
      data: stats,
    });
  } catch (error) {
    console.error('Error fetching booking stats:', error);
    res.status(500).json({ error: 'Failed to fetch booking stats' });
  }
});

/**
 * GET /performance/weekly - Get weekly performance summary
 */
app.get('/api/performance/weekly', authenticate, async (req, res) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    // Fetch bookings
    const bookings = await base('Bookings')
      .select({
        filterByFormula: `{Booking Date} >= '${startDate.toISOString()}'`,
      })
      .all();
    
    // Fetch transactions
    const transactions = await base('Transactions')
      .select({
        filterByFormula: `{Timestamp} >= '${startDate.toISOString()}'`,
      })
      .all();
    
    const performance = {
      period: 'Last 7 days',
      bookings: {
        total: bookings.length,
        revenue: bookings.reduce((sum, r) => sum + (r.fields['Amount Paid'] || 0), 0),
      },
      transactions: {
        total: transactions.length,
        volume: transactions.reduce((sum, r) => sum + (r.fields['Amount (AFC)'] || 0), 0),
      },
      topRoutes: getTopRoutes(bookings),
    };
    
    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    console.error('Error fetching performance:', error);
    res.status(500).json({ error: 'Failed to fetch performance data' });
  }
});

/**
 * Helper: Get top routes from bookings
 */
function getTopRoutes(bookings) {
  const routeCounts = {};
  
  bookings.forEach(booking => {
    const route = booking.fields.Route || 'Unknown';
    routeCounts[route] = (routeCounts[route] || 0) + 1;
  });
  
  return Object.entries(routeCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([route, count]) => ({ route, bookings: count }));
}

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Root endpoint with API documentation
 */
app.get('/', (req, res) => {
  res.json({
    name: 'Africa Railways GPT Function Wrapper',
    version: '1.0.0',
    endpoints: {
      '/api/schedules': 'Query train schedules',
      '/api/next-train': 'Find next available train',
      '/api/delays': 'Get delayed trains',
      '/api/bookings/stats': 'Get booking statistics',
      '/api/performance/weekly': 'Get weekly performance summary',
    },
    authentication: 'Required: X-API-Key header',
  });
});

/**
 * Start server
 */
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 GPT Function Wrapper running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
  });
}

export default app;
