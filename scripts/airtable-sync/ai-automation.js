#!/usr/bin/env node

/**
 * AI Automation for Airtable Records
 * 
 * Automatically processes new records with AI:
 * - Summarize incident reports
 * - Classify maintenance logs
 * - Draft status updates
 * 
 * Run: node scripts/airtable-sync/ai-automation.js
 */

import Airtable from 'airtable';
import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const airtable = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Summarize incident report using AI
 */
async function summarizeIncident(incidentRecord) {
  const { Description, Type, Severity, Location } = incidentRecord.fields;
  
  const prompt = `Summarize this railway incident report in 2-3 sentences:

Type: ${Type}
Severity: ${Severity}
Location: ${Location}
Description: ${Description}

Provide a clear, concise summary suitable for stakeholder updates.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are an AI assistant that summarizes railway incident reports clearly and professionally.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 150,
  });

  return response.choices[0].message.content;
}

/**
 * Classify maintenance log using AI
 */
async function classifyMaintenanceLog(logRecord) {
  const { Description, 'Asset Type': assetType } = logRecord.fields;
  
  const prompt = `Classify this maintenance log into one of these categories:
- Routine: Regular scheduled maintenance
- Emergency: Urgent repair needed
- Preventive: Proactive maintenance to prevent issues
- Upgrade: System improvement or enhancement

Asset Type: ${assetType}
Description: ${Description}

Respond with only the category name.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are an AI assistant that classifies railway maintenance logs accurately.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 20,
    temperature: 0.3, // Lower temperature for more consistent classification
  });

  return response.choices[0].message.content.trim();
}

/**
 * Draft status update for stakeholders
 */
async function draftStatusUpdate(records, period = 'weekly') {
  const summary = {
    incidents: records.incidents?.length || 0,
    maintenance: records.maintenance?.length || 0,
    bookings: records.bookings?.length || 0,
    revenue: records.revenue || 0,
  };
  
  const prompt = `Draft a ${period} status update for railway stakeholders based on this data:

Incidents: ${summary.incidents}
Maintenance Activities: ${summary.maintenance}
Bookings: ${summary.bookings}
Revenue: $${summary.revenue}

Write a professional, concise update (3-4 paragraphs) highlighting key metrics and any notable events.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [
      {
        role: 'system',
        content: 'You are an AI assistant that drafts professional status updates for railway executives.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 400,
  });

  return response.choices[0].message.content;
}

/**
 * Process new incident reports
 */
async function processNewIncidents(baseId) {
  console.log('📋 Processing new incident reports...\n');
  
  const base = airtable.base(baseId);
  
  try {
    // Fetch unprocessed incidents
    const records = await base('Incidents')
      .select({
        filterByFormula: "NOT({AI Summary})",
        maxRecords: 10,
      })
      .all();
    
    console.log(`Found ${records.length} unprocessed incidents`);
    
    for (const record of records) {
      console.log(`Processing incident: ${record.id}`);
      
      // Generate AI summary
      const summary = await summarizeIncident(record);
      
      // Update record with summary
      await base('Incidents').update(record.id, {
        'AI Summary': summary,
        'Processed At': new Date().toISOString(),
      });
      
      console.log(`✅ Summarized: ${summary.substring(0, 60)}...`);
    }
    
    console.log(`\n✅ Processed ${records.length} incidents\n`);
  } catch (error) {
    console.error('❌ Error processing incidents:', error.message);
  }
}

/**
 * Process maintenance logs
 */
async function processMaintenanceLogs(baseId) {
  console.log('🔧 Processing maintenance logs...\n');
  
  const base = airtable.base(baseId);
  
  try {
    // Fetch unclassified logs
    const records = await base('Maintenance Logs')
      .select({
        filterByFormula: "NOT({AI Classification})",
        maxRecords: 10,
      })
      .all();
    
    console.log(`Found ${records.length} unclassified logs`);
    
    for (const record of records) {
      console.log(`Classifying log: ${record.id}`);
      
      // Generate AI classification
      const classification = await classifyMaintenanceLog(record);
      
      // Update record with classification
      await base('Maintenance Logs').update(record.id, {
        'AI Classification': classification,
        'Type': classification, // Also update the Type field
        'Processed At': new Date().toISOString(),
      });
      
      console.log(`✅ Classified as: ${classification}`);
    }
    
    console.log(`\n✅ Processed ${records.length} maintenance logs\n`);
  } catch (error) {
    console.error('❌ Error processing maintenance logs:', error.message);
  }
}

/**
 * Generate weekly status update
 */
async function generateWeeklyUpdate(baseId) {
  console.log('📊 Generating weekly status update...\n');
  
  const base = airtable.base(baseId);
  
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    
    // Fetch data from last week
    const [incidents, maintenance, bookings] = await Promise.all([
      base('Incidents')
        .select({
          filterByFormula: `{Date/Time} >= '${startDate.toISOString()}'`,
        })
        .all(),
      base('Maintenance Logs')
        .select({
          filterByFormula: `{Date} >= '${startDate.toISOString()}'`,
        })
        .all(),
      base('Bookings')
        .select({
          filterByFormula: `{Booking Date} >= '${startDate.toISOString()}'`,
        })
        .all(),
    ]);
    
    const revenue = bookings.reduce((sum, r) => sum + (r.fields['Amount Paid'] || 0), 0);
    
    const records = {
      incidents,
      maintenance,
      bookings,
      revenue,
    };
    
    // Generate status update
    const update = await draftStatusUpdate(records, 'weekly');
    
    console.log('📝 Weekly Status Update:\n');
    console.log('─'.repeat(60));
    console.log(update);
    console.log('─'.repeat(60));
    console.log('');
    
    // Save to file
    const fs = await import('fs');
    const path = await import('path');
    const filename = `status-update-${new Date().toISOString().split('T')[0]}.txt`;
    const filepath = path.join(process.cwd(), 'logs', filename);
    
    fs.writeFileSync(filepath, update);
    console.log(`✅ Saved to: ${filepath}\n`);
    
    return update;
  } catch (error) {
    console.error('❌ Error generating status update:', error.message);
  }
}

/**
 * Main automation loop
 */
async function runAutomation() {
  console.log('🤖 AI Automation for Airtable');
  console.log('═'.repeat(60));
  console.log('');
  
  const baseId = process.env.AIRTABLE_SENTINEL_BASE_ID || process.env.AIRTABLE_OPERATIONS_BASE_ID;
  
  if (!baseId) {
    console.error('❌ No Airtable base ID configured');
    process.exit(1);
  }
  
  const command = process.argv[2];
  
  try {
    switch (command) {
      case 'incidents':
        await processNewIncidents(baseId);
        break;
      case 'maintenance':
        await processMaintenanceLogs(baseId);
        break;
      case 'status':
        await generateWeeklyUpdate(baseId);
        break;
      case 'all':
        await processNewIncidents(baseId);
        await processMaintenanceLogs(baseId);
        await generateWeeklyUpdate(baseId);
        break;
      default:
        console.log('Usage: node ai-automation.js [command]');
        console.log('');
        console.log('Commands:');
        console.log('  incidents    - Summarize new incident reports');
        console.log('  maintenance  - Classify maintenance logs');
        console.log('  status       - Generate weekly status update');
        console.log('  all          - Run all automations');
        console.log('');
        process.exit(1);
    }
    
    console.log('✅ Automation complete');
  } catch (error) {
    console.error('❌ Automation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAutomation();
}

export {
  summarizeIncident,
  classifyMaintenanceLog,
  draftStatusUpdate,
  processNewIncidents,
  processMaintenanceLogs,
  generateWeeklyUpdate,
};
