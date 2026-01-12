#!/usr/bin/env node

/**
 * Railway Assistant - Natural Language Query Interface
 * 
 * Provides natural language interface for railway operations
 * Run: node scripts/airtable-sync/railway-assistant.js
 */

import OpenAI from 'openai';
import Airtable from 'airtable';
import dotenv from 'dotenv';

dotenv.config();

// Initialize clients
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY });
const base = airtable.base(process.env.AIRTABLE_OPERATIONS_BASE_ID);

/**
 * Query train schedules from Airtable
 */
async function querySchedules(filters = {}) {
  try {
    const { from, to, date } = filters;
    
    let filterFormula = '';
    const conditions = [];
    
    if (from) conditions.push(`{Departure Station} = '${from}'`);
    if (to) conditions.push(`{Arrival Station} = '${to}'`);
    if (date) conditions.push(`{Departure Time} >= '${date}'`);
    
    if (conditions.length > 0) {
      filterFormula = conditions.length === 1 
        ? conditions[0] 
        : `AND(${conditions.join(', ')})`;
    }
    
    const records = await base('Schedules')
      .select({
        maxRecords: 10,
        filterByFormula: filterFormula || '{Status} = "Active"',
        sort: [{ field: 'Departure Time', direction: 'asc' }],
      })
      .all();
    
    return records.map(record => ({
      id: record.id,
      train: record.get('Train'),
      route: record.get('Route'),
      from: record.get('Departure Station'),
      to: record.get('Arrival Station'),
      departure: record.get('Departure Time'),
      arrival: record.get('Arrival Time'),
      status: record.get('Status'),
      priceEconomy: record.get('Ticket Price (Economy)'),
      priceBusiness: record.get('Ticket Price (Business)'),
      priceFirst: record.get('Ticket Price (First)'),
    }));
  } catch (error) {
    console.error('Error querying schedules:', error.message);
    return [];
  }
}

/**
 * Find next available train
 */
async function findNextTrain(destination) {
  const now = new Date().toISOString();
  
  const schedules = await querySchedules({
    to: destination,
    date: now,
  });
  
  return schedules.length > 0 ? schedules[0] : null;
}

/**
 * Format schedule for display
 */
function formatSchedule(schedule) {
  if (!schedule) return 'No trains found.';
  
  const departure = new Date(schedule.departure);
  const arrival = new Date(schedule.arrival);
  
  return `
🚂 Train: ${schedule.train}
📍 Route: ${schedule.from} → ${schedule.to}
🕐 Departure: ${departure.toLocaleString()}
🕑 Arrival: ${arrival.toLocaleString()}
💰 Prices:
   - Economy: $${schedule.priceEconomy}
   - Business: $${schedule.priceBusiness}
   - First Class: $${schedule.priceFirst}
✅ Status: ${schedule.status}
  `.trim();
}

/**
 * Process natural language query with ChatGPT
 */
async function processQuery(userQuery) {
  try {
    console.log(`\n🤖 Processing query: "${userQuery}"\n`);
    
    // Use ChatGPT to understand the query and extract parameters
    const completion = await openai.chat.completions.create({
      model: 'gpt-4', // ✅ Correct model name
      messages: [
        {
          role: 'system',
          content: `You assist with queries over rail schedules for Africa Railways.
          
Extract the following information from user queries:
- destination: The station they want to travel to
- origin: The station they're traveling from (if mentioned)
- date: When they want to travel (if mentioned)

Respond in JSON format:
{
  "destination": "station name or null",
  "origin": "station name or null",
  "date": "ISO date or null",
  "intent": "find_train|check_schedule|book_ticket|other"
}`,
        },
        {
          role: 'user',
          content: userQuery,
        },
      ],
      response_format: { type: 'json_object' },
    });
    
    const extracted = JSON.parse(completion.choices[0].message.content);
    console.log('📊 Extracted parameters:', extracted);
    
    // Query the database based on extracted parameters
    let result;
    
    if (extracted.intent === 'find_train' && extracted.destination) {
      const train = await findNextTrain(extracted.destination);
      result = formatSchedule(train);
    } else if (extracted.intent === 'check_schedule') {
      const schedules = await querySchedules({
        from: extracted.origin,
        to: extracted.destination,
        date: extracted.date,
      });
      
      if (schedules.length === 0) {
        result = 'No trains found matching your criteria.';
      } else {
        result = `Found ${schedules.length} train(s):\n\n` + 
          schedules.map((s, i) => `${i + 1}. ${formatSchedule(s)}`).join('\n\n');
      }
    } else {
      result = 'I can help you find trains and check schedules. Please specify a destination.';
    }
    
    // Generate natural language response
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful railway assistant. Provide friendly, concise responses based on the schedule data provided.',
        },
        {
          role: 'user',
          content: `User asked: "${userQuery}"\n\nSchedule data:\n${result}\n\nProvide a natural, helpful response.`,
        },
      ],
    });
    
    return response.choices[0].message.content;
    
  } catch (error) {
    console.error('❌ Error processing query:', error.message);
    return 'Sorry, I encountered an error processing your request. Please try again.';
  }
}

/**
 * Interactive mode
 */
async function interactiveMode() {
  console.log('🚂 Africa Railways Assistant');
  console.log('═'.repeat(60));
  console.log('Ask me about train schedules!');
  console.log('Examples:');
  console.log('  - "When is the next train to Dar es Salaam?"');
  console.log('  - "Show me trains from Lusaka to Kapiri Mposhi"');
  console.log('  - "What trains are available tomorrow?"');
  console.log('');
  console.log('Type "exit" to quit');
  console.log('═'.repeat(60));
  console.log('');
  
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  
  const askQuestion = () => {
    rl.question('You: ', async (query) => {
      if (query.toLowerCase() === 'exit') {
        console.log('\nGoodbye! 👋\n');
        rl.close();
        process.exit(0);
      }
      
      if (!query.trim()) {
        askQuestion();
        return;
      }
      
      const response = await processQuery(query);
      console.log(`\nAssistant: ${response}\n`);
      
      askQuestion();
    });
  };
  
  askQuestion();
}

/**
 * Single query mode
 */
async function singleQuery(query) {
  console.log('🚂 Africa Railways Assistant');
  console.log('═'.repeat(60));
  console.log('');
  
  const response = await processQuery(query);
  console.log(`Assistant: ${response}\n`);
  console.log('═'.repeat(60));
  console.log('');
}

/**
 * Example queries
 */
async function runExamples() {
  console.log('🚂 Africa Railways Assistant - Example Queries');
  console.log('═'.repeat(60));
  console.log('');
  
  const examples = [
    'When is the next train to Dar es Salaam?',
    'Show me trains from Lusaka to Ndola',
    'What trains are available today?',
  ];
  
  for (const example of examples) {
    console.log(`\n📝 Example: "${example}"\n`);
    const response = await processQuery(example);
    console.log(`💬 Response: ${response}\n`);
    console.log('─'.repeat(60));
  }
  
  console.log('\n✅ Examples complete\n');
}

/**
 * Main function
 */
async function main() {
  // Validate environment variables
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment');
    process.exit(1);
  }
  
  if (!process.env.AIRTABLE_API_KEY) {
    console.error('❌ AIRTABLE_API_KEY not found in environment');
    process.exit(1);
  }
  
  if (!process.env.AIRTABLE_OPERATIONS_BASE_ID) {
    console.error('❌ AIRTABLE_OPERATIONS_BASE_ID not found in environment');
    process.exit(1);
  }
  
  const mode = process.argv[2];
  const query = process.argv.slice(3).join(' ');
  
  switch (mode) {
    case 'interactive':
    case 'i':
      await interactiveMode();
      break;
    case 'query':
    case 'q':
      if (!query) {
        console.error('❌ Please provide a query');
        console.error('Usage: node railway-assistant.js query "your question"');
        process.exit(1);
      }
      await singleQuery(query);
      break;
    case 'examples':
    case 'e':
      await runExamples();
      break;
    default:
      console.log('Usage:');
      console.log('  node railway-assistant.js interactive    # Interactive mode');
      console.log('  node railway-assistant.js query "..."    # Single query');
      console.log('  node railway-assistant.js examples       # Run examples');
      console.log('');
      process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  });
}

export { processQuery, querySchedules, findNextTrain };
