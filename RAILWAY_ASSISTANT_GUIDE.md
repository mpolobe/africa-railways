# Railway Assistant - Natural Language Query Interface

## Overview

The Railway Assistant provides a natural language interface for querying train schedules and railway operations using ChatGPT.

## Correct Model Usage

**✅ Correct Models:**
- `gpt-4` - Most capable, best for complex queries
- `gpt-4-turbo` - Faster, cost-effective
- `gpt-3.5-turbo` - Fast and affordable

**❌ Incorrect Models:**
- `gpt-4.1` - Does not exist
- `gpt-5.2` - Does not exist
- `gpt-5-nano` - Does not exist

## Installation

```bash
cd scripts/airtable-sync
npm install openai airtable dotenv readline
```

## Configuration

Ensure your `.env` file has:
```bash
OPENAI_API_KEY=your_openai_key
AIRTABLE_API_KEY=your_airtable_key
AIRTABLE_OPERATIONS_BASE_ID=your_base_id
```

## Usage

### Interactive Mode

Start an interactive chat session:
```bash
npm run railway:assistant
# or
node scripts/airtable-sync/railway-assistant.js interactive
```

Example session:
```
🚂 Africa Railways Assistant
════════════════════════════════════════════════════════════
Ask me about train schedules!
Examples:
  - "When is the next train to Dar es Salaam?"
  - "Show me trains from Lusaka to Kapiri Mposhi"
  - "What trains are available tomorrow?"

Type "exit" to quit
════════════════════════════════════════════════════════════

You: When is the next train to Dar es Salaam?

🤖 Processing query: "When is the next train to Dar es Salaam?"

📊 Extracted parameters: {
  destination: "Dar es Salaam",
  origin: null,
  date: null,
  intent: "find_train"
}