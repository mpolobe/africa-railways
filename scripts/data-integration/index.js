#!/usr/bin/env node

/**
 * Main Integration Script
 * 
 * Complete pipeline: Fetch → Transform → Save → Sync
 * Website → Airtable → Africoin → AI
 */

import dotenv from 'dotenv';
import { fetchSchedules } from './fetchSchedules.js';
import { saveSchedules, saveSchedulesBatch, saveSchedulesUpsert } from './saveToAirtable.js';

dotenv.config();

/**
 * Main integration function
 */
async function main() {
  console.log('🚀 Africa Railways Data Integration');
  console.log('═'.repeat(60));
  console.log('');
  
  try {
    // Step 1: Fetch schedules from website
    console.log('📡 Fetching schedules from website...');
    const schedules = await fetchSchedules();
    console.log(`✅ Fetched ${schedules.length} schedules`);
    console.log('');
    
    if (schedules.length === 0) {
      console.log('⚠️  No schedules found. Exiting.');
      process.exit(0);
    }
    
    // Display sample data
    console.log('📊 Sample schedule:');
    console.log(JSON.stringify(schedules[0], null, 2));
    console.log('');
    
    // Step 2: Save to Airtable
    console.log('💾 Saving to Airtable...');
    
    const saveMethod = process.env.SAVE_METHOD || 'batch';
    
    switch (saveMethod) {
      case 'simple':
        await saveSchedules(schedules);
        break;
      case 'batch':
        await saveSchedulesBatch(schedules);
        break;
      case 'upsert':
        await saveSchedulesUpsert(schedules);
        break;
      default:
        await saveSchedulesBatch(schedules);
    }
    
    console.log(`✅ Saved ${schedules.length} schedules to Airtable`);
    console.log('');
    
    // Step 3: Sync to Africoin (optional)
    if (process.env.AFRICOIN_API_URL && process.env.AFRICOIN_API_KEY) {
      console.log('💰 Syncing to Africoin backend...');
      
      const axios = (await import('axios')).default;
      
      await axios.post(
        `${process.env.AFRICOIN_API_URL}/api/railway-data`,
        {
          type: 'schedules',
          count: schedules.length,
          data: schedules,
          timestamp: new Date().toISOString(),
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.AFRICOIN_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('✅ Synced to Africoin');
      console.log('');
    }
    
    // Step 4: AI Analysis (optional)
    if (process.env.OPENAI_API_KEY) {
      console.log('🤖 Analyzing with AI...');
      
      const OpenAI = (await import('openai')).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const analysis = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an AI analyst for railway operations. Provide brief insights.',
          },
          {
            role: 'user',
            content: `Analyze these ${schedules.length} railway schedules and provide 3 key insights:\n\n${JSON.stringify(schedules.slice(0, 5), null, 2)}`,
          },
        ],
        max_tokens: 300,
      });
      
      console.log('\n🧠 AI Insights:');
      console.log(analysis.choices[0].message.content);
      console.log('');
    }
    
    // Summary
    console.log('═'.repeat(60));
    console.log('✅ Integration completed successfully');
    console.log('');
    console.log('Summary:');
    console.log(`  Schedules processed: ${schedules.length}`);
    console.log(`  Saved to Airtable: ✅`);
    console.log(`  Africoin sync: ${process.env.AFRICOIN_API_URL ? '✅' : '⏭️  Skipped'}`);
    console.log(`  AI analysis: ${process.env.OPENAI_API_KEY ? '✅' : '⏭️  Skipped'}`);
    console.log('');
    
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ Integration failed:', error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    console.error('');
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default main;
