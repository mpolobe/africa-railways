#!/usr/bin/env node

/**
 * Unified Data Pipeline
 * 
 * Orchestrates: Website → Airtable → Africoin Backend → AI Intelligence
 * 
 * Supports:
 * - API integration (Scenario A)
 * - Web scraping (Scenario B)
 * - Batch processing with rate limiting
 * - Error recovery and retry logic
 * - Monitoring and health checks
 */

import dotenv from 'dotenv';
import { EventEmitter } from 'events';

dotenv.config();

// Pipeline event emitter for monitoring
const pipelineEvents = new EventEmitter();

/**
 * Pipeline configuration
 */
const CONFIG = {
  // Airtable settings
  airtable: {
    batchSize: 10,
    rateLimit: 200, // ms between batches
  },
  
  // Africoin backend settings
  africoin: {
    apiUrl: process.env.AFRICOIN_API_URL,
    apiKey: process.env.AFRICOIN_API_KEY,
    timeout: 30000,
  },
  
  // AI settings
  ai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-4',
    maxTokens: 500,
  },
  
  // Pipeline settings
  pipeline: {
    retryAttempts: 3,
    retryDelay: 2000,
    enableAI: process.env.ENABLE_AI_ANALYSIS !== 'false',
    enableAfricoin: process.env.ENABLE_AFRICOIN_SYNC !== 'false',
  },
};

/**
 * Pipeline step result
 */
class StepResult {
  constructor(name, success, data = null, error = null) {
    this.name = name;
    this.success = success;
    this.data = data;
    this.error = error;
    this.timestamp = new Date().toISOString();
    this.duration = 0;
  }
}

/**
 * Pipeline execution context
 */
class PipelineContext {
  constructor() {
    this.startTime = Date.now();
    this.steps = [];
    this.data = {};
    this.errors = [];
  }

  addStep(result) {
    this.steps.push(result);
    if (!result.success) {
      this.errors.push({ step: result.name, error: result.error });
    }
  }

  setData(key, value) {
    this.data[key] = value;
  }

  getData(key) {
    return this.data[key];
  }

  getSummary() {
    return {
      duration: Date.now() - this.startTime,
      totalSteps: this.steps.length,
      successfulSteps: this.steps.filter(s => s.success).length,
      failedSteps: this.steps.filter(s => !s.success).length,
      errors: this.errors,
      data: this.data,
    };
  }
}

/**
 * Step 1: Fetch data from source (API or scraping)
 */
async function fetchData(ctx, options = {}) {
  const startTime = Date.now();
  const stepName = 'fetch_data';
  
  pipelineEvents.emit('step:start', stepName);
  
  try {
    let data = { schedules: [], stations: [], trains: [] };
    
    const source = options.source || process.env.DATA_SOURCE || 'scrape';
    
    if (source === 'api') {
      // Scenario A: API integration
      const { syncFromAPI } = await import('./sync-api.js');
      data = await syncFromAPI();
    } else {
      // Scenario B: Web scraping
      const { scrapeSchedules, scrapeStations, transformSchedule, transformStation } = await import('./scraper.js');
      
      const rawSchedules = await scrapeSchedules(options.scrapeSource || 'generic');
      const rawStations = await scrapeStations(options.scrapeSource || 'generic');
      
      data.schedules = rawSchedules.map(s => transformSchedule(s, options.scrapeSource));
      data.stations = rawStations.map(s => transformStation(s, options.scrapeSource));
    }
    
    ctx.setData('rawData', data);
    
    const result = new StepResult(stepName, true, {
      schedules: data.schedules.length,
      stations: data.stations.length,
      trains: data.trains?.length || 0,
    });
    result.duration = Date.now() - startTime;
    
    pipelineEvents.emit('step:complete', stepName, result);
    return result;
  } catch (error) {
    const result = new StepResult(stepName, false, null, error.message);
    result.duration = Date.now() - startTime;
    pipelineEvents.emit('step:error', stepName, error);
    return result;
  }
}

/**
 * Step 2: Save to Airtable
 */
async function saveToAirtable(ctx, options = {}) {
  const startTime = Date.now();
  const stepName = 'save_airtable';
  
  pipelineEvents.emit('step:start', stepName);
  
  try {
    const { upsertRecords, batchCreate } = await import('./airtable.js');
    const data = ctx.getData('rawData');
    
    if (!data) {
      throw new Error('No data to save');
    }
    
    const results = {
      schedules: { created: 0, updated: 0, errors: 0 },
      stations: { created: 0, updated: 0, errors: 0 },
    };
    
    // Save schedules
    if (data.schedules.length > 0) {
      console.log(`  Saving ${data.schedules.length} schedules to Airtable...`);
      
      if (options.upsert !== false) {
        results.schedules = await upsertRecords('Schedules', data.schedules, 'Schedule ID');
      } else {
        const created = await batchCreate('Schedules', data.schedules.map(s => ({ fields: s })));
        results.schedules.created = created.length;
      }
    }
    
    // Save stations
    if (data.stations.length > 0) {
      console.log(`  Saving ${data.stations.length} stations to Airtable...`);
      
      if (options.upsert !== false) {
        results.stations = await upsertRecords('Stations', data.stations, 'Station ID');
      } else {
        const created = await batchCreate('Stations', data.stations.map(s => ({ fields: s })));
        results.stations.created = created.length;
      }
    }
    
    ctx.setData('airtableResults', results);
    
    const result = new StepResult(stepName, true, results);
    result.duration = Date.now() - startTime;
    
    pipelineEvents.emit('step:complete', stepName, result);
    return result;
  } catch (error) {
    const result = new StepResult(stepName, false, null, error.message);
    result.duration = Date.now() - startTime;
    pipelineEvents.emit('step:error', stepName, error);
    return result;
  }
}

/**
 * Step 3: Sync to Africoin backend
 */
async function syncToAfricoin(ctx, options = {}) {
  const startTime = Date.now();
  const stepName = 'sync_africoin';
  
  if (!CONFIG.pipeline.enableAfricoin || !CONFIG.africoin.apiUrl) {
    return new StepResult(stepName, true, { skipped: true, reason: 'Africoin sync disabled or not configured' });
  }
  
  pipelineEvents.emit('step:start', stepName);
  
  try {
    const axios = (await import('axios')).default;
    const data = ctx.getData('rawData');
    const airtableResults = ctx.getData('airtableResults');
    
    const payload = {
      type: 'railway_data_sync',
      timestamp: new Date().toISOString(),
      source: options.source || 'pipeline',
      data: {
        schedules: data.schedules,
        stations: data.stations,
      },
      stats: {
        schedulesCount: data.schedules.length,
        stationsCount: data.stations.length,
        airtableSync: airtableResults,
      },
    };
    
    console.log(`  Syncing to Africoin backend...`);
    
    const response = await axios.post(
      `${CONFIG.africoin.apiUrl}/api/railway-data`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${CONFIG.africoin.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: CONFIG.africoin.timeout,
      }
    );
    
    ctx.setData('africoinResponse', response.data);
    
    const result = new StepResult(stepName, true, { status: response.status, data: response.data });
    result.duration = Date.now() - startTime;
    
    pipelineEvents.emit('step:complete', stepName, result);
    return result;
  } catch (error) {
    const result = new StepResult(stepName, false, null, error.message);
    result.duration = Date.now() - startTime;
    pipelineEvents.emit('step:error', stepName, error);
    return result;
  }
}

/**
 * Step 4: AI Analysis
 */
async function analyzeWithAI(ctx, options = {}) {
  const startTime = Date.now();
  const stepName = 'ai_analysis';
  
  if (!CONFIG.pipeline.enableAI || !CONFIG.ai.apiKey) {
    return new StepResult(stepName, true, { skipped: true, reason: 'AI analysis disabled or not configured' });
  }
  
  pipelineEvents.emit('step:start', stepName);
  
  try {
    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey: CONFIG.ai.apiKey });
    
    const data = ctx.getData('rawData');
    const airtableResults = ctx.getData('airtableResults');
    
    // Prepare analysis prompt
    const analysisPrompt = `
Analyze this railway data sync and provide operational insights:

Schedules synced: ${data.schedules.length}
Stations synced: ${data.stations.length}

Sample schedules:
${JSON.stringify(data.schedules.slice(0, 5), null, 2)}

Provide:
1. Data quality assessment
2. Operational patterns observed
3. Recommendations for improvement
4. Any anomalies detected

Keep response concise and actionable.
`;
    
    console.log(`  Running AI analysis...`);
    
    const completion = await openai.chat.completions.create({
      model: CONFIG.ai.model,
      messages: [
        {
          role: 'system',
          content: 'You are an AI analyst for railway operations. Provide brief, actionable insights.',
        },
        {
          role: 'user',
          content: analysisPrompt,
        },
      ],
      max_tokens: CONFIG.ai.maxTokens,
    });
    
    const insights = completion.choices[0].message.content;
    ctx.setData('aiInsights', insights);
    
    const result = new StepResult(stepName, true, { insights });
    result.duration = Date.now() - startTime;
    
    pipelineEvents.emit('step:complete', stepName, result);
    return result;
  } catch (error) {
    const result = new StepResult(stepName, false, null, error.message);
    result.duration = Date.now() - startTime;
    pipelineEvents.emit('step:error', stepName, error);
    return result;
  }
}

/**
 * Run the complete pipeline
 */
export async function runPipeline(options = {}) {
  const ctx = new PipelineContext();
  
  console.log('');
  console.log('Africa Railways Data Pipeline');
  console.log('='.repeat(50));
  console.log('Website -> Airtable -> Africoin -> AI');
  console.log('='.repeat(50));
  console.log('');
  
  pipelineEvents.emit('pipeline:start', ctx);
  
  // Step 1: Fetch data
  console.log('[1/4] Fetching data from source...');
  const fetchResult = await fetchData(ctx, options);
  ctx.addStep(fetchResult);
  
  if (!fetchResult.success) {
    console.log(`  FAILED: ${fetchResult.error}`);
    if (!options.continueOnError) {
      return ctx.getSummary();
    }
  } else {
    console.log(`  OK: ${fetchResult.data.schedules} schedules, ${fetchResult.data.stations} stations`);
  }
  
  // Step 2: Save to Airtable
  console.log('\n[2/4] Saving to Airtable...');
  const airtableResult = await saveToAirtable(ctx, options);
  ctx.addStep(airtableResult);
  
  if (!airtableResult.success) {
    console.log(`  FAILED: ${airtableResult.error}`);
    if (!options.continueOnError) {
      return ctx.getSummary();
    }
  } else {
    const r = airtableResult.data;
    console.log(`  OK: Schedules (${r.schedules.created} new, ${r.schedules.updated} updated)`);
    console.log(`      Stations (${r.stations.created} new, ${r.stations.updated} updated)`);
  }
  
  // Step 3: Sync to Africoin
  console.log('\n[3/4] Syncing to Africoin backend...');
  const africoinResult = await syncToAfricoin(ctx, options);
  ctx.addStep(africoinResult);
  
  if (africoinResult.data?.skipped) {
    console.log(`  SKIPPED: ${africoinResult.data.reason}`);
  } else if (!africoinResult.success) {
    console.log(`  FAILED: ${africoinResult.error}`);
  } else {
    console.log(`  OK: Data synced to Africoin`);
  }
  
  // Step 4: AI Analysis
  console.log('\n[4/4] Running AI analysis...');
  const aiResult = await analyzeWithAI(ctx, options);
  ctx.addStep(aiResult);
  
  if (aiResult.data?.skipped) {
    console.log(`  SKIPPED: ${aiResult.data.reason}`);
  } else if (!aiResult.success) {
    console.log(`  FAILED: ${aiResult.error}`);
  } else {
    console.log(`  OK: Analysis complete`);
    if (options.showInsights && aiResult.data?.insights) {
      console.log('\n--- AI Insights ---');
      console.log(aiResult.data.insights);
      console.log('-------------------');
    }
  }
  
  // Summary
  const summary = ctx.getSummary();
  
  console.log('');
  console.log('='.repeat(50));
  console.log('Pipeline Summary');
  console.log('='.repeat(50));
  console.log(`Duration: ${summary.duration}ms`);
  console.log(`Steps: ${summary.successfulSteps}/${summary.totalSteps} successful`);
  
  if (summary.errors.length > 0) {
    console.log(`Errors: ${summary.errors.length}`);
    summary.errors.forEach(e => console.log(`  - ${e.step}: ${e.error}`));
  }
  
  console.log('');
  
  pipelineEvents.emit('pipeline:complete', summary);
  
  return summary;
}

/**
 * Run pipeline with scheduling
 */
export async function runScheduledPipeline(cronExpression, options = {}) {
  const cron = (await import('node-cron')).default;
  
  console.log(`Scheduling pipeline with cron: ${cronExpression}`);
  
  cron.schedule(cronExpression, async () => {
    console.log(`\n[${new Date().toISOString()}] Running scheduled pipeline...`);
    await runPipeline(options);
  });
  
  console.log('Pipeline scheduler started. Press Ctrl+C to stop.');
}

// Event handlers for monitoring
pipelineEvents.on('step:start', (step) => {
  // Can be used for external monitoring
});

pipelineEvents.on('step:complete', (step, result) => {
  // Can be used for external monitoring
});

pipelineEvents.on('step:error', (step, error) => {
  // Can be used for alerting
});

// CLI execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const options = {
    source: args.includes('--api') ? 'api' : 'scrape',
    scrapeSource: args.find(a => a.startsWith('--source='))?.split('=')[1] || 'generic',
    showInsights: args.includes('--insights'),
    continueOnError: args.includes('--continue'),
  };
  
  if (args.includes('--schedule')) {
    const cron = args.find(a => a.startsWith('--cron='))?.split('=')[1] || '0 */6 * * *';
    runScheduledPipeline(cron, options);
  } else {
    runPipeline(options)
      .then(summary => {
        process.exit(summary.failedSteps > 0 ? 1 : 0);
      })
      .catch(error => {
        console.error('Pipeline failed:', error.message);
        process.exit(1);
      });
  }
}

export { pipelineEvents, PipelineContext, StepResult };
export default runPipeline;
