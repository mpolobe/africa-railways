# Airtable Sync Scripts

Automated data synchronization between Africa Railways backend systems and Airtable Operational Control Plane.

## Overview

These scripts sync operational data from various backend APIs to Airtable bases for analytics, reporting, and AI-powered insights via ChatGPT.

## Architecture

```
Backend APIs → Sync Scripts → Airtable → ChatGPT Analytics
```

## Prerequisites

1. **Node.js** v16 or higher
2. **Airtable Account** with API access
3. **Environment Variables** configured

## Installation

```bash
cd scripts/airtable-sync
npm install
```

## Configuration

### 1. Set Up Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
# Airtable
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_INFRASTRUCTURE_BASE_ID=your_infrastructure_base_id
AIRTABLE_OPERATIONS_BASE_ID=your_operations_base_id
AIRTABLE_SENTINEL_BASE_ID=your_sentinel_base_id
AIRTABLE_FINANCIAL_BASE_ID=your_financial_base_id

# Backend API
RAILWAYS_API_URL=https://africa-railways.vercel.app
RAILWAYS_API_KEY=your_api_key

# Logging
LOG_LEVEL=info
```

### 2. Get Airtable Credentials

1. Go to [Airtable Account](https://airtable.com/account)
2. Generate an API key
3. Get Base IDs from each base's API documentation

## Available Sync Scripts

### 1. Schedules Sync
Syncs train schedules from backend to Airtable.

```bash
npm run sync:schedules
# or
node sync-schedules.js
```

**Data Synced:**
- Train schedules
- Routes and timings
- Pricing information
- Operating days

### 2. Bookings Sync
Syncs ticket bookings and passenger data.

```bash
npm run sync:bookings
# or
node sync-bookings.js
```

**Data Synced:**
- Booking details
- Passenger information
- Payment data
- AFRC rewards

**Features:**
- Incremental sync (only new bookings)
- Automatic deduplication

### 3. USSD Sessions Sync
Syncs USSD gateway session data for analytics.

```bash
npm run sync:ussd
# or
node sync-ussd-sessions.js
```

**Data Synced:**
- Session details
- User navigation paths
- Completion rates
- Provider costs

**Analytics Included:**
- Completion rate
- Average session duration
- Total SMS costs

### 4. Transactions Sync
Syncs blockchain transaction data (Sui/Polygon).

```bash
npm run sync:transactions
# or
node sync-transactions.js
```

**Data Synced:**
- Transaction hashes
- Wallet addresses
- AFC/USD amounts
- Gas fees

**Analytics Included:**
- Total volume
- Transaction distribution by blockchain
- Average transaction size

### 5. Sync All
Run all sync scripts sequentially.

```bash
npm run sync:all
```

## Scheduling

### Using Cron (Linux/Mac)

Edit crontab:
```bash
crontab -e
```

Add sync schedules:
```cron
# Schedules - Every 6 hours
0 */6 * * * cd /path/to/africa-railways/scripts/airtable-sync && npm run sync:schedules

# Bookings - Every 15 minutes
*/15 * * * * cd /path/to/africa-railways/scripts/airtable-sync && npm run sync:bookings

# USSD Sessions - Every 30 minutes
*/30 * * * * cd /path/to/africa-railways/scripts/airtable-sync && npm run sync:ussd

# Transactions - Every 10 minutes
*/10 * * * * cd /path/to/africa-railways/scripts/airtable-sync && npm run sync:transactions
```

### Using PM2 (Recommended)

Install PM2:
```bash
npm install -g pm2
```

Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [
    {
      name: 'airtable-sync-bookings',
      script: './sync-bookings.js',
      cron_restart: '*/15 * * * *',
      autorestart: false,
    },
    {
      name: 'airtable-sync-transactions',
      script: './sync-transactions.js',
      cron_restart: '*/10 * * * *',
      autorestart: false,
    },
    // Add more sync jobs...
  ],
};
```

Start with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Using GitHub Actions

Create `.github/workflows/airtable-sync.yml`:
```yaml
name: Airtable Sync

on:
  schedule:
    - cron: '*/15 * * * *'  # Every 15 minutes
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd scripts/airtable-sync
          npm install
      - name: Run sync
        env:
          AIRTABLE_API_KEY: ${{ secrets.AIRTABLE_API_KEY }}
          AIRTABLE_OPERATIONS_BASE_ID: ${{ secrets.AIRTABLE_OPERATIONS_BASE_ID }}
          RAILWAYS_API_URL: ${{ secrets.RAILWAYS_API_URL }}
        run: |
          cd scripts/airtable-sync
          npm run sync:bookings
```

## Monitoring

### Health Check

Generate a health report:
```bash
node monitor.js report
```

Output:
```
📊 Airtable Sync Health Report
════════════════════════════════════════════════════════════
✅ BOOKINGS
   Status: healthy
   Success Rate: 98.5%
   Total Runs: 200
   Records Synced: 15,432
   Last Success: 2026-01-12T16:45:00.000Z

⚠️  TRANSACTIONS
   Status: warning
   Success Rate: 85.2%
   Total Runs: 150
   Records Synced: 8,921
   Last Success: 2026-01-12T15:30:00.000Z
   ⚠️  Consecutive Failures: 2
════════════════════════════════════════════════════════════
```

### Get Health Status (JSON)

```bash
node monitor.js health
```

### View Logs

Logs are stored in `logs/airtable-sync/`:
```bash
tail -f logs/airtable-sync/sync-2026-01-12.log
```

## Error Handling

### Automatic Retries

Scripts automatically retry failed requests with exponential backoff:
- 3 retry attempts
- 1 second initial delay
- Exponential backoff multiplier

### Rate Limiting

- Batch size: 10 records (Airtable limit)
- 200ms delay between batches
- Respects Airtable API rate limits (5 requests/second)

### Error Logging

All errors are logged with:
- Timestamp
- Error message
- Stack trace
- Request context

## Troubleshooting

### "AIRTABLE_API_KEY environment variable is required"

**Solution:** Set the environment variable:
```bash
export AIRTABLE_API_KEY=your_key
```

### "API request failed: 401 Unauthorized"

**Solution:** Check your Airtable API key is valid and has access to the base.

### "API request failed: 422 Unprocessable Entity"

**Solution:** Check field mappings in `config.js`. Ensure Airtable table structure matches the expected schema.

### High Error Rate

**Solution:**
1. Check backend API availability
2. Verify Airtable base structure
3. Review field mappings in `config.js`
4. Check logs for specific errors

### Sync Delay

**Solution:**
1. Check cron job is running
2. Verify backend API is responding
3. Check system resources
4. Review logs for errors

## Best Practices

### 1. Incremental Sync

Use `since` parameter to sync only new data:
```javascript
const lastSync = await getLastSyncTime();
const data = await fetchBookings(lastSync);
```

### 2. Batch Processing

Always batch requests to respect Airtable limits:
```javascript
const batchSize = 10;
for (let i = 0; i < data.length; i += batchSize) {
  const batch = data.slice(i, i + batchSize);
  await syncBatch(batch);
  await sleep(200); // Rate limiting
}
```

### 3. Error Recovery

Implement graceful error handling:
```javascript
try {
  await syncBatch(batch);
} catch (error) {
  logger.error('Batch sync failed', { error, batch });
  // Continue with next batch
}
```

### 4. Monitoring

Set up alerts for:
- High error rates (>10%)
- Sync delays (>1 hour)
- Consecutive failures (>3)

## ChatGPT Integration

Once data is in Airtable, use ChatGPT for:

### 1. Predictive Analytics

```
Analyze the last 30 days of booking data and predict next week's demand.
```

### 2. Operational Insights

```
Identify trains with highest maintenance costs and suggest optimization strategies.
```

### 3. Customer Behavior

```
What are the most popular routes and travel times? Suggest schedule optimizations.
```

### 4. Financial Analysis

```
Calculate revenue per kilometer for each rail line and identify underperforming routes.
```

## API Reference

### fetchBookings(since)

Fetch bookings from backend API.

**Parameters:**
- `since` (string, optional): ISO date string to fetch bookings since

**Returns:** Promise<Array<Booking>>

### syncToAirtable(records)

Sync records to Airtable in batches.

**Parameters:**
- `records` (Array): Records to sync

**Returns:** Promise<{synced: number, errors: number}>

### getLastSyncTime()

Get timestamp of last successful sync.

**Returns:** Promise<string|null>

## Support

For issues or questions:
- Check logs in `logs/airtable-sync/`
- Review [Airtable API documentation](https://airtable.com/developers/web/api/introduction)
- Contact the development team

## License

MIT
