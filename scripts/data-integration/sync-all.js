#!/usr/bin/env node

/**
 * Unified Data Integration Pipeline
 * 
 * Website → Airtable → Africoin → AI Intelligence
 * Supports both API and web scraping
 */

import dotenv from 'dotenv';
import { fetchSchedules, transformScheduleForAirtable } from './fetchSchedules.js';
import { upsertRecords } from './airtable.js';

dotenv.config();

/**
 * Sync schedules using web scraping
 */
async function syncSchedules() {
  try {
    console.log('📊 Syncing Schedules...');
    
    // Fetch from website
    const schedules = await fetchSchedules();
    console.log(`✅ Fetched ${schedules.length} schedules from website`);
    
    if (schedules.length === 0) {
      console.log('⚠️  No schedules found');
      return { created: 0, updated: 0, errors: 0 };
    }
    
    // Transform for Airtable
    const transformed = schedules.map(transformScheduleForAirtable);
    
    // Upsert to Airtable
    const results = await upsertRecords('Schedules', transformed, 'Schedule ID');
    
    console.log(`✅ Schedules: ${results.created} created, ${results.updated} updated`);
    return results;
  } catch (error) {
    console.error('❌ Error syncing schedules:', error.message);
    return { created: 0, updated: 0, errors: 1 };
  }
}

/**
 * Send data to Africoin backend
 */
async function syncToAfricoin(data) {
  try {
    const AFRICOIN_API_URL = process.env.AFRICOIN_API_URL;
    const AFRICOIN_API_KEY = process.env.AFRICOIN_API_KEY;
    
    if (!AFRICOIN_API_URL || !AFRICOIN_API_KEY) {
      console.log('⚠️  Africoin API not configured, skipping...');
      return;
    }
    
    console.log('💰 Syncing to Africoin backend...');
    
    const axios = (await import('axios')).default;
    
    await axios.post(`${AFRICOIN_API_URL}/api/railway-data`, data, {
      headers: {
        'Authorization': `Bearer ${AFRICOIN_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('✅ Data synced to Africoin');
  } catch (error) {
    console.error('❌ Error syncing to Africoin:', error.message);
  }
}

/**
 * Process with AI Intelligence
 */
async function processWithAI(data) {
  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    
    if (!OPENAI_API_KEY) {
      console.log('⚠️  OpenAI API not configured, skipping AI processing...');
      return;
    }
    
    console.log('🤖 Processing with AI Intelligence...');
    
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
    
    // Analyze schedule patterns
    const analysis = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an AI analyst for railway operations. Analyze schedule data and provide insights.',
        },
        {
          role: 'user',
          content: `Analyze these railway schedules and provide insights:\n\n${JSON.stringify(data, null, 2)}`,
        },
      ],
      max_tokens: 500,
    });
    
    const insights = analysis.choices[0].message.content;
    console.log('\n🧠 AI Insights:');
    console.log(insights);
    console.log('');
    
    return insights;
  } catch (error) {
    console.error('❌ Error processing with AI:', error.message);
  }
}

/**
 * Main integration pipeline
 */
async function main() {
  console.log('🚀 Africa Railways Data Integration Pipeline');
  console.log('═'.repeat(60));
  console.log('Website → Airtable → Africoin → AI Intelligence');
  console.log('═'.repeat(60));
  console.log('');
  
  try {
    // Step 1: Scrape website and sync to Airtable
    const scheduleResults = await syncSchedules();
    
    // Step 2: Sync to Africoin backend
    await syncToAfricoin({
      type: 'schedules',
      count: scheduleResults.created + scheduleResults.updated,
      timestamp: new Date().toISOString(),
    });
    
    // Step 3: Process with AI
    const schedules = await fetchSchedules();
    await processWithAI(schedules.slice(0, 10)); // Analyze first 10 schedules
    
    console.log('═'.repeat(60));
    console.log('✅ Integration pipeline completed successfully');
    console.log('');
    console.log('Summary:');
    console.log(`  Schedules synced: ${scheduleResults.created + scheduleResults.updated}`);
    console.log(`  Africoin: ${process.env.AFRICOIN_API_URL ? 'Synced' : 'Skipped'}`);
    console.log(`  AI Processing: ${process.env.OPENAI_API_KEY ? 'Completed' : 'Skipped'}`);
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Integration pipeline failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { syncSchedules, syncToAfricoin, processWithAI };
