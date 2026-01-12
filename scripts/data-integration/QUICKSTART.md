# Quick Start Guide - Data Integration

Get your data integration running in 5 minutes.

## Step 1: Install (1 minute)

```bash
cd scripts/data-integration
npm install
```

## Step 2: Configure (2 minutes)

Create `.env` file:

```bash
# Airtable (Required)
AIRTABLE_API_KEY=your_airtable_api_key
AIRTABLE_BASE_ID=your_base_id

# Africa Railways Website (Required)
AFRICA_RAIL_BASE_URL=https://www.africarailways.com

# Optional: Africoin Backend
AFRICOIN_API_URL=https://africoin-wallet.vercel.app
AFRICOIN_API_KEY=your_africoin_api_key

# Optional: AI Intelligence
OPENAI_API_KEY=your_openai_api_key

# Save Method (simple|batch|upsert)
SAVE_METHOD=batch
```

### Get Airtable Credentials

1. Go to [airtable.com/account](https://airtable.com/account)
2. Generate API key
3. Get Base ID from your base's API documentation

## Step 3: Run (1 minute)

```bash
npm start
```

Expected output:
```
🚀 Africa Railways Data Integration
════════════════════════════════════════════════════════════

📡 Fetching schedules from website...
✅ Fetched 25 schedules

📊 Sample schedule:
{
  "trainNumber": "TRN-001",
  "origin": "Dar es Salaam",
  "destination": "Kapiri Mposhi",
  "departureTime": "08:00",
  "arrivalTime": "20:00"
}

💾 Saving to Airtable...
✅ Saved 25 schedules to Airtable

💰 Syncing to Africoin backend...
✅ Synced to Africoin

🤖 Analyzing with AI...

🧠 AI Insights:
1. Peak travel times are 08:00-10:00 and 17:00-19:00
2. Dar es Salaam - Kapiri Mposhi route has highest demand
3. Recommend adding capacity during peak hours

════════════════════════════════════════════════════════════
✅ Integration completed successfully

Summary:
  Schedules processed: 25
  Saved to Airtable: ✅
  Africoin sync: ✅
  AI analysis: ✅
```

## Step 4: Verify (1 minute)

1. Open your Airtable base
2. Check the "Rail Schedules" table
3. You should see your data!

## Customization

### Change CSS Selectors

Edit `fetchSchedules.js` to match your website:

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

### Change Save Method

In `.env`:
```bash
# Simple: One record at a time
SAVE_METHOD=simple

# Batch: 10 records at a time (recommended)
SAVE_METHOD=batch

# Upsert: Update if exists, create if not
SAVE_METHOD=upsert
```

## Scheduling

### Run Every 15 Minutes

**Using Cron:**
```bash
crontab -e
# Add this line:
*/15 * * * * cd /path/to/scripts/data-integration && npm start
```

**Using PM2:**
```bash
pm2 start index.js --cron "*/15 * * * *"
pm2 save
```

## Troubleshooting

### "No schedules found"

**Check:**
1. Is the website URL correct?
2. Do the CSS selectors match the HTML?
3. Is the website accessible?

**Debug:**
```bash
# Test the scraper
node fetchSchedules.js
```

### "AIRTABLE_API_KEY not found"

**Solution:**
```bash
# Create .env file
echo "AIRTABLE_API_KEY=your_key" > .env
echo "AIRTABLE_BASE_ID=your_base_id" >> .env
```

### "Cannot find module"

**Solution:**
```bash
npm install
```

## Next Steps

1. ✅ Set up scheduling (cron or PM2)
2. ✅ Monitor logs regularly
3. ✅ Add more data sources
4. ✅ Enable AI analysis
5. ✅ Connect to Africoin backend

## Support

- Full documentation: `README.md`
- Airtable docs: https://airtable.com/developers
- Cheerio docs: https://cheerio.js.org

---

**Total Setup Time:** 5 minutes  
**Difficulty:** Beginner  
**Prerequisites:** Node.js, Airtable account
