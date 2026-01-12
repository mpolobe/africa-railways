#!/usr/bin/env node

/**
 * ChatGPT Analytics Integration
 * 
 * Uses OpenAI API to analyze Airtable data and provide insights
 * Run: node scripts/airtable-sync/chatgpt-analytics.js
 */

const Airtable = require('airtable');
const fetch = require('node-fetch');
const logger = require('./logger');

// Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_OPERATIONS_BASE_ID;

// Initialize Airtable
const base = new Airtable({ apiKey: AIRTABLE_API_KEY }).base(AIRTABLE_BASE_ID);

/**
 * Fetch data from Airtable
 */
async function fetchAirtableData(tableName, options = {}) {
  try {
    const records = await base(tableName)
      .select({
        maxRecords: options.maxRecords || 100,
        sort: options.sort || [],
        filterByFormula: options.filter || '',
      })
      .all();
    
    return records.map(record => ({
      id: record.id,
      ...record.fields,
    }));
  } catch (error) {
    logger.error(`Failed to fetch data from ${tableName}`, { error: error.message });
    throw error;
  }
}

/**
 * Call OpenAI ChatGPT API
 */
async function callChatGPT(prompt, context = '') {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an AI analyst for Africa Railways. Analyze operational data and provide actionable insights. Be specific, data-driven, and focus on practical recommendations.',
          },
          {
            role: 'user',
            content: context ? `Context:\n${context}\n\nQuestion: ${prompt}` : prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    logger.error('ChatGPT API call failed', { error: error.message });
    throw error;
  }
}

/**
 * Analyze bookings data
 */
async function analyzeBookings() {
  console.log('📊 Analyzing Bookings Data...\n');
  
  // Fetch recent bookings
  const bookings = await fetchAirtableData('Bookings', {
    maxRecords: 100,
    sort: [{ field: 'Booking Date', direction: 'desc' }],
  });
  
  // Prepare context
  const context = `
Bookings Data Summary:
- Total bookings: ${bookings.length}
- Date range: ${bookings[bookings.length - 1]?.['Booking Date']} to ${bookings[0]?.['Booking Date']}
- Classes: ${[...new Set(bookings.map(b => b.Class))].join(', ')}
- Payment methods: ${[...new Set(bookings.map(b => b['Payment Method']))].join(', ')}

Sample data:
${JSON.stringify(bookings.slice(0, 10), null, 2)}
`;
  
  const prompt = `
Analyze this bookings data and provide:
1. Key trends and patterns
2. Peak booking times
3. Most popular routes/classes
4. Revenue optimization opportunities
5. Actionable recommendations
`;
  
  const analysis = await callChatGPT(prompt, context);
  
  console.log('🤖 ChatGPT Analysis:\n');
  console.log(analysis);
  console.log('\n' + '═'.repeat(60) + '\n');
  
  return analysis;
}

/**
 * Predict maintenance needs
 */
async function predictMaintenance() {
  console.log('🔧 Predicting Maintenance Needs...\n');
  
  // This would fetch from Infrastructure base
  // For now, using a sample prompt
  
  const prompt = `
Based on typical railway operations, what are the key indicators that a train needs maintenance?
Provide a checklist for predictive maintenance monitoring.
`;
  
  const prediction = await callChatGPT(prompt);
  
  console.log('🤖 ChatGPT Prediction:\n');
  console.log(prediction);
  console.log('\n' + '═'.repeat(60) + '\n');
  
  return prediction;
}

/**
 * Analyze USSD session data
 */
async function analyzeUSSDSessions() {
  console.log('📱 Analyzing USSD Sessions...\n');
  
  const sessions = await fetchAirtableData('USSD Sessions', {
    maxRecords: 100,
    sort: [{ field: 'Start Time', direction: 'desc' }],
  });
  
  const context = `
USSD Sessions Data:
- Total sessions: ${sessions.length}
- Completed: ${sessions.filter(s => s.Status === 'Completed').length}
- Abandoned: ${sessions.filter(s => s.Status === 'Abandoned').length}
- Average duration: ${(sessions.reduce((sum, s) => sum + (s['Duration (seconds)'] || 0), 0) / sessions.length).toFixed(2)}s

Sample data:
${JSON.stringify(sessions.slice(0, 10), null, 2)}
`;
  
  const prompt = `
Analyze this USSD session data and provide:
1. User behavior patterns
2. Common drop-off points
3. UX improvement suggestions
4. Cost optimization opportunities
`;
  
  const analysis = await callChatGPT(prompt, context);
  
  console.log('🤖 ChatGPT Analysis:\n');
  console.log(analysis);
  console.log('\n' + '═'.repeat(60) + '\n');
  
  return analysis;
}

/**
 * Generate daily report
 */
async function generateDailyReport() {
  console.log('📋 Generating Daily Operations Report...\n');
  
  const bookings = await fetchAirtableData('Bookings', {
    maxRecords: 50,
    sort: [{ field: 'Booking Date', direction: 'desc' }],
  });
  
  const transactions = await fetchAirtableData('Transactions', {
    maxRecords: 50,
    sort: [{ field: 'Timestamp', direction: 'desc' }],
  });
  
  const context = `
Daily Operations Summary:
- Bookings today: ${bookings.filter(b => new Date(b['Booking Date']).toDateString() === new Date().toDateString()).length}
- Total revenue: $${transactions.reduce((sum, t) => sum + (t['Amount (USD)'] || 0), 0).toFixed(2)}
- Transactions: ${transactions.length}
`;
  
  const prompt = `
Generate a concise daily operations report with:
1. Key metrics summary
2. Notable events or anomalies
3. Action items for operations team
4. Recommendations for tomorrow
`;
  
  const report = await callChatGPT(prompt, context);
  
  console.log('🤖 Daily Report:\n');
  console.log(report);
  console.log('\n' + '═'.repeat(60) + '\n');
  
  return report;
}

/**
 * Main function
 */
async function main() {
  console.log('🚀 ChatGPT Analytics for Africa Railways');
  console.log('═'.repeat(60));
  console.log('');
  
  try {
    // Validate environment variables
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is required');
    }
    if (!AIRTABLE_API_KEY) {
      throw new Error('AIRTABLE_API_KEY environment variable is required');
    }
    if (!AIRTABLE_BASE_ID) {
      throw new Error('AIRTABLE_OPERATIONS_BASE_ID environment variable is required');
    }
    
    const command = process.argv[2];
    
    switch (command) {
      case 'bookings':
        await analyzeBookings();
        break;
      case 'maintenance':
        await predictMaintenance();
        break;
      case 'ussd':
        await analyzeUSSDSessions();
        break;
      case 'report':
        await generateDailyReport();
        break;
      case 'all':
        await analyzeBookings();
        await analyzeUSSDSessions();
        await generateDailyReport();
        break;
      default:
        console.log('Usage: node chatgpt-analytics.js [command]');
        console.log('');
        console.log('Commands:');
        console.log('  bookings     - Analyze booking trends');
        console.log('  maintenance  - Predict maintenance needs');
        console.log('  ussd         - Analyze USSD session data');
        console.log('  report       - Generate daily operations report');
        console.log('  all          - Run all analyses');
        console.log('');
        process.exit(1);
    }
    
    console.log('✅ Analysis complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
    logger.error('ChatGPT analytics failed', { error: error.message });
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzeBookings,
  predictMaintenance,
  analyzeUSSDSessions,
  generateDailyReport,
};
