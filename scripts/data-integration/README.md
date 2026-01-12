# Africa Railways Data Integration

Production-ready data integration pipeline: **Website → Airtable → Africoin → AI Intelligence**

## Overview

This integration system supports two scenarios:
- **Scenario A:** Railway website has an API (JSON/XML endpoints)
- **Scenario B:** Railway website only has HTML pages (web scraping)

## Quick Start

### 1. Installation

```bash
cd scripts/data-integration
npm install
```

### 2. Configuration

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Required variables:
```bash
# Airtable
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_base_id

# Africa Railways Website
AFRICA_RAIL_BASE_URL=https://www.africarailways.com

# Optional: Africoin Backend
AFRICOIN_API_URL=https://africoin-wallet.vercel.app
AFRICOIN_API_KEY=your_africoin_api_key

# Optional: AI Intelligence
OPENAI_API_KEY=your_openai_api_key
```

### 3. Deploy

```bash
npm run deploy
```

This validates your environment, tests connections, and generates deployment configs.

### 4. Run Pipeline

```bash
# Run once
npm run pipeline

# Run with AI insights
npm run pipeline:insights

# Run on schedule (every 6 hours)
npm run pipeline:schedule
```

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│           Africa Railways Website                        │
│  ┌──────────────┐         ┌──────────────┐             │
│  │  API Endpoints│         │  HTML Pages  │             │
│  │  (Scenario A) │         │  (Scenario B)│             │
│  └───────┬──────┘         └───────┬──────┘             │
└──────────┼────────────────────────┼─────────────────────┘
           │                        │
           ▼                        ▼
    ┌──────────────┐        ┌──────────────┐
    │  sync-api.js │        │  scraper.js  │
    │  (axios)     │        │  (cheerio)   │
    └──────┬───────┘        └──────┬───────┘
           │                        │
           └────────────┬───────────┘
                        │
                        ▼
                ┌───────────────┐
                │  pipeline.js  │
                │  (orchestrator)│
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │   Airtable    │
                │   Database    │
                └───────┬───────┘
                        │
           ┌────────────┴────────────┐
           │                         │
           ▼                         ▼
    ┌──────────────┐         ┌──────────────┐
    │   Africoin   │         │   ChatGPT    │
    │   Backend    │         │ AI Analysis  │
    └──────────────┘         └──────────────┘
```

## Available Commands

### Pipeline Commands

| Command | Description |
|---------|-------------|
| `npm run pipeline` | Run full pipeline once |
| `npm run pipeline:schedule` | Run pipeline on schedule |
| `npm run pipeline:api` | Use API integration (Scenario A) |
| `npm run pipeline:insights` | Show AI insights after sync |

### Scraping Commands

| Command | Description |
|---------|-------------|
| `npm run scrape` | Scrape from generic source |
| `npm run scrape:all` | Scrape from all configured sources |
| `npm run scrape:tazara` | Scrape TAZARA railway |
| `npm run scrape:kenya` | Scrape Kenya Railways |

### Sync Commands

| Command | Description |
|---------|-------------|
| `npm run sync` | Run basic sync |
| `npm run sync:api` | Sync via API |
| `npm run sync:scrape` | Sync via scraping |
| `npm run sync:all` | Sync all data types |

### Monitoring Commands

| Command | Description |
|---------|-------------|
| `npm run deploy` | Run deployment checks |
| `npm run monitor` | View health report |
| `npm run health` | Get health status as JSON |

## Pipeline Steps

The unified pipeline (`pipeline.js`) executes these steps:

1. **Fetch Data** - Scrape website or call API
2. **Save to Airtable** - Upsert records with deduplication
3. **Sync to Africoin** - Send data to Africoin backend
4. **AI Analysis** - Generate insights with ChatGPT

Example output:
```
Africa Railways Data Pipeline
==================================================
Website -> Airtable -> Africoin -> AI
==================================================

[1/4] Fetching data from source...
  OK: 25 schedules, 12 stations

[2/4] Saving to Airtable...
  OK: Schedules (5 new, 20 updated)
      Stations (2 new, 10 updated)

[3/4] Syncing to Africoin backend...
  OK: Data synced to Africoin

[4/4] Running AI analysis...
  OK: Analysis complete

==================================================
Pipeline Summary
==================================================
Duration: 4523ms
Steps: 4/4 successful
```

## Web Scraping (Scenario B)

The `scraper.js` module supports multiple railway websites:

### Configured Sources

| Source | Website | Data Types |
|--------|---------|------------|
| `tazara` | tazarasite.com | Schedules, Stations |
| `kenya` | metrokenya.co.ke | Schedules |
| `southafrica` | shosholozameyl.co.za | Schedules |
| `generic` | Configurable | Schedules, Stations |

### Custom Scraping

```javascript
import { scrapeCustom } from './scraper.js';

const data = await scrapeCustom(
  'https://example.com/schedules',
  '.schedule-row',
  {
    trainNumber: '.train-no',
    origin: '.from',
    destination: '.to',
    departureTime: '.depart',
  }
);
```

### Adding New Sources

Edit `scraper.js` and add to `SCRAPER_CONFIGS`:

```javascript
const SCRAPER_CONFIGS = {
  // ... existing configs
  
  newrailway: {
    baseURL: 'https://newrailway.com',
    schedules: {
      path: '/timetable',
      container: '.timetable-row',
      fields: {
        trainNumber: '.train-id',
        origin: '.from-station',
        destination: '.to-station',
        departureTime: '.departure',
        arrivalTime: '.arrival',
      },
    },
  },
};
```

## Monitoring

### Health Report

```bash
npm run monitor
```

Output:
```
Africa Railways Data Integration - Health Report
=======================================================

Status: [OK] Healthy

Health Checks:
  [OK] recent_sync: Last sync: 15 minutes ago
  [OK] consecutive_failures: Consecutive failures: 0
  [OK] error_rate: Error rate: 2.5%

Metrics:
  Total Syncs: 156
  Success Rate: 97.5%
  Avg Duration: 3245ms
  Avg Records: 28
  Last Sync: 2026-01-12T18:30:00.000Z
  Last Success: 2026-01-12T18:30:00.000Z

Recent Syncs:
  [OK] 1/12/2026, 6:30:00 PM - 28 records, 3245ms
  [OK] 1/12/2026, 12:30:00 PM - 25 records, 2987ms
  [OK] 1/12/2026, 6:30:00 AM - 30 records, 3512ms
```

### Alert Thresholds

| Metric | Threshold | Level |
|--------|-----------|-------|
| Consecutive Failures | >= 3 | Critical |
| Error Rate | > 10% | Warning |
| Sync Age | > 1 hour | Warning |

### JSON Health Export

```bash
npm run health > health.json
```

## Deployment

### PM2 (Recommended)

```bash
# Deploy generates ecosystem.config.cjs
npm run deploy

# Start with PM2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

### Systemd

```bash
# Deploy generates service file
npm run deploy

# Install service
sudo cp africa-railways-pipeline.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable africa-railways-pipeline
sudo systemctl start africa-railways-pipeline
```

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "pipeline:schedule"]
```

## Airtable Client

The `airtable.js` module provides:

### Upsert Records
```javascript
import { upsertRecords } from './airtable.js';

const results = await upsertRecords('Schedules', records, 'Schedule ID');
// Returns: { created: 5, updated: 3, errors: 0 }
```

### Batch Create
```javascript
import { batchCreate } from './airtable.js';

const created = await batchCreate('Schedules', records);
```

### Query Records
```javascript
import { queryRecords } from './airtable.js';

const schedules = await queryRecords('Schedules', {
  maxRecords: 100,
  filter: '{Status} = "Active"',
  sort: [{ field: 'Departure Time', direction: 'asc' }],
});
```

## Error Handling

### Automatic Retries

All HTTP requests include retry logic with exponential backoff:
- 3 retry attempts
- 2 second initial delay
- Doubles on each retry

### Rate Limiting

Respects Airtable's limits:
- 5 requests/second
- 10 records per batch
- 200ms delay between batches

### Continue on Error

```bash
# Continue pipeline even if a step fails
node pipeline.js --continue
```

## Security

### API Keys

- Store in `.env` file
- Add `.env` to `.gitignore`
- Never commit keys to git

### Environment Variables

```bash
# Required
AIRTABLE_API_KEY=key_xxxxx
AIRTABLE_BASE_ID=app_xxxxx

# Optional
AFRICA_RAIL_BASE_URL=https://...
AFRICOIN_API_URL=https://...
AFRICOIN_API_KEY=xxx
OPENAI_API_KEY=sk-xxx

# Feature flags
ENABLE_AI_ANALYSIS=true
ENABLE_AFRICOIN_SYNC=true
```

## Troubleshooting

### "AIRTABLE_API_KEY not found"

Create `.env` file:
```bash
echo "AIRTABLE_API_KEY=your_key" > .env
echo "AIRTABLE_BASE_ID=your_base" >> .env
```

### "No schedules found"

1. Check CSS selectors match website HTML
2. Inspect website structure
3. Update selectors in `scraper.js`
4. Test: `npm run scrape`

### "Rate limit exceeded"

Increase delay in `airtable.js`:
```javascript
await new Promise(resolve => setTimeout(resolve, 500));
```

### Connection Errors

Run deployment check:
```bash
npm run deploy
```

## Files

| File | Purpose |
|------|---------|
| `pipeline.js` | Main orchestrator |
| `scraper.js` | Web scraping module |
| `airtable.js` | Airtable client |
| `monitor.js` | Health monitoring |
| `deploy.js` | Deployment checks |
| `sync-api.js` | API integration |
| `sync-scrape.js` | Scraping integration |
| `sync-all.js` | Legacy unified sync |

## License

MIT
