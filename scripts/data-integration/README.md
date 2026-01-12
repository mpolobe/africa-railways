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
nano .env
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

### 3. Run Integration

```bash
# Scenario A: API Integration
npm run sync:api

# Scenario B: Web Scraping
npm run sync:scrape

# Unified Pipeline (Website → Airtable → Africoin → AI)
npm run sync:all
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
    │  sync-api.js │        │sync-scrape.js│
    │  (axios)     │        │  (cheerio)   │
    └──────┬───────┘        └──────┬───────┘
           │                        │
           └────────────┬───────────┘
                        │
                        ▼
                ┌───────────────┐
                │  airtable.js  │
                │  (upsert)     │
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

## Scenario A: API Integration

Use when the railway website provides JSON/XML endpoints.

### Features
- Fetch data from REST APIs
- Transform JSON to Airtable format
- Incremental sync (only new data)
- Batch processing with rate limiting

### Endpoints Supported
- `/api/schedules` - Train schedules
- `/api/bookings` - Ticket bookings
- `/api/stations` - Station information
- `/api/trains` - Train fleet data

### Usage

```bash
node sync-api.js
```

### Example API Response

```json
{
  "schedules": [
    {
      "id": "SCH-001",
      "train_id": "TRN-001",
      "origin": "Dar es Salaam",
      "destination": "Kapiri Mposhi",
      "departure_time": "2026-01-15T08:00:00Z",
      "arrival_time": "2026-01-15T20:00:00Z",
      "price_economy": 50,
      "price_business": 120,
      "status": "Active"
    }
  ]
}
```

## Scenario B: Web Scraping

Use when the railway website only has HTML pages.

### Features
- Scrape data using Cheerio
- Customizable CSS selectors
- Generic scraper for any page
- News and updates scraping

### Pages Supported
- `/train-schedules` - Train schedules
- `/stations` - Station list
- `/fleet` - Train fleet
- `/news` - News and updates

### Usage

```bash
node sync-scrape.js
```

### Customizing Selectors

Edit `fetchSchedules.js` to match your website's HTML structure:

```javascript
$('.schedule-row').each((_, el) => {
  schedules.push({
    trainNumber: $(el).find('.train-no').text().trim(),
    origin: $(el).find('.origin').text().trim(),
    destination: $(el).find('.destination').text().trim(),
    departureTime: $(el).find('.departure').text().trim(),
    arrivalTime: $(el).find('.arrival').text().trim(),
  });
});
```

### Finding Selectors

1. Open the website in Chrome/Firefox
2. Right-click on the data you want → "Inspect"
3. Find the CSS class or ID
4. Update the selector in the script

Example HTML:
```html
<div class="schedule-row">
  <span class="train-no">TRN-001</span>
  <span class="origin">Dar es Salaam</span>
  <span class="destination">Kapiri Mposhi</span>
  <span class="departure">08:00</span>
  <span class="arrival">20:00</span>
</div>
```

## Airtable Client

The `airtable.js` module provides:

### Upsert Records
Update if exists, create if not:
```javascript
import { upsertRecords } from './airtable.js';

const results = await upsertRecords('Schedules', records, 'Schedule ID');
// Returns: { created: 5, updated: 3, errors: 0 }
```

### Batch Create
Create multiple records efficiently:
```javascript
import { batchCreate } from './airtable.js';

const created = await batchCreate('Schedules', records);
```

### Query Records
Fetch data with filters:
```javascript
import { queryRecords } from './airtable.js';

const schedules = await queryRecords('Schedules', {
  maxRecords: 100,
  filter: '{Status} = "Active"',
  sort: [{ field: 'Departure Time', direction: 'asc' }],
});
```

## Unified Pipeline

The `sync-all.js` script runs the complete pipeline:

1. **Scrape Website** → Fetch schedules using `fetchSchedules()`
2. **Sync to Airtable** → Upsert records with `upsertRecords()`
3. **Sync to Africoin** → Send data to Africoin backend
4. **AI Processing** → Analyze with ChatGPT

```bash
npm run sync:all
```

Output:
```
🚀 Africa Railways Data Integration Pipeline
════════════════════════════════════════════════════════════
Website → Airtable → Africoin → AI Intelligence
════════════════════════════════════════════════════════════

📊 Syncing Schedules...
✅ Fetched 25 schedules from website
✅ Schedules: 5 created, 20 updated

💰 Syncing to Africoin backend...
✅ Data synced to Africoin

🤖 Processing with AI Intelligence...

🧠 AI Insights:
Analysis of the railway schedules shows:
1. Peak travel times are 08:00-10:00 and 17:00-19:00
2. Dar es Salaam - Kapiri Mposhi route has highest demand
3. Recommend adding capacity during peak hours

════════════════════════════════════════════════════════════
✅ Integration pipeline completed successfully

Summary:
  Schedules synced: 25
  Africoin: Synced
  AI Processing: Completed
```

## Scheduling

### Using Cron (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Run every 15 minutes
*/15 * * * * cd /path/to/scripts/data-integration && npm run sync:all

# Run daily at 2 AM
0 2 * * * cd /path/to/scripts/data-integration && npm run sync:all
```

### Using PM2

```bash
# Install PM2
npm install -g pm2

# Start with cron
pm2 start sync-all.js --cron "*/15 * * * *"

# Save configuration
pm2 save
pm2 startup
```

### Using Node-Cron

Create `scheduler.js`:
```javascript
import cron from 'node-cron';
import { syncAll } from './sync-all.js';

// Run every 15 minutes
cron.schedule('*/15 * * * *', async () => {
  console.log('Running scheduled sync...');
  await syncAll();
});

console.log('Scheduler started');
```

Run:
```bash
node scheduler.js
```

## Error Handling

### Automatic Retries

The integration includes automatic retry logic:
```javascript
const MAX_RETRIES = 3;
let retries = 0;

while (retries < MAX_RETRIES) {
  try {
    await syncSchedules();
    break;
  } catch (error) {
    retries++;
    console.log(`Retry ${retries}/${MAX_RETRIES}...`);
    await sleep(1000 * retries); // Exponential backoff
  }
}
```

### Rate Limiting

Respects Airtable's rate limits:
```javascript
// 200ms delay between batches
await new Promise(resolve => setTimeout(resolve, 200));
```

### Timeout Configuration

Set in `.env`:
```bash
TIMEOUT_MS=30000  # 30 seconds
```

## Monitoring

### View Logs

```bash
# Real-time logs
tail -f logs/integration.log

# Last 100 lines
tail -n 100 logs/integration.log

# Search for errors
grep "ERROR" logs/integration.log
```

### Health Check

Create `monitor.js`:
```javascript
import { queryRecords } from './airtable.js';

async function checkHealth() {
  const schedules = await queryRecords('Schedules', { maxRecords: 1 });
  
  if (schedules.length > 0) {
    console.log('✅ Integration healthy');
    console.log(`Last sync: ${schedules[0]['Departure Time']}`);
  } else {
    console.log('❌ No data found');
  }
}

checkHealth();
```

## Troubleshooting

### "AIRTABLE_API_KEY not found"

**Solution:** Create `.env` file with your API key:
```bash
echo "AIRTABLE_API_KEY=your_key" > .env
```

### "Cannot find module 'cheerio'"

**Solution:** Install dependencies:
```bash
npm install
```

### "No schedules found"

**Solution:** Check CSS selectors match your website:
1. Inspect the website HTML
2. Update selectors in `fetchSchedules.js`
3. Test with: `node fetchSchedules.js`

### "Rate limit exceeded"

**Solution:** Increase delay between batches:
```javascript
await new Promise(resolve => setTimeout(resolve, 500)); // 500ms
```

## Best Practices

### 1. Test Before Production

```bash
# Test with small dataset
node sync-all.js

# Check Airtable for data
# Verify no duplicates
```

### 2. Monitor Sync Health

```bash
# Set up alerts for failures
# Check logs daily
# Monitor Airtable record counts
```

### 3. Backup Data

```bash
# Export Airtable data regularly
# Keep backup of .env file (securely)
```

### 4. Optimize Performance

```bash
# Use incremental sync (only new data)
# Batch operations (10 records at a time)
# Cache frequently accessed data
```

## Security

### API Keys

- ✅ Store in `.env` file
- ✅ Add `.env` to `.gitignore`
- ❌ Never commit API keys to git
- ❌ Never share keys in chat/messages

### Rate Limiting

- Respect Airtable's 5 requests/second limit
- Use 200ms delay between batches
- Implement exponential backoff for retries

### Data Validation

- Validate data before syncing
- Check for required fields
- Handle missing data gracefully

## Support

For issues or questions:
- Check logs in `logs/integration.log`
- Review Airtable API docs: https://airtable.com/developers
- Review Cheerio docs: https://cheerio.js.org
- Contact the development team

## License

MIT
