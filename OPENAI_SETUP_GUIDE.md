# OpenAI API Setup Guide - Africa Railways

Get started with OpenAI API integration in minutes, securely.

## Prerequisites

- OpenAI account ([sign up here](https://platform.openai.com/signup))
- Node.js installed
- Command line access

## Step 1: Get Your API Key (2 minutes)

### 1.1 Create OpenAI Account
1. Go to [https://platform.openai.com/signup](https://platform.openai.com/signup)
2. Sign up with email or Google/Microsoft account
3. Verify your email

### 1.2 Add Payment Method
1. Go to [Settings → Billing](https://platform.openai.com/account/billing)
2. Add a payment method
3. Set usage limits (recommended: $10-50/month to start)

### 1.3 Generate API Key
1. Go to [API Keys](https://platform.openai.com/api-keys)
2. Click **"Create new secret key"**
3. Name it: `Africa Railways - Development`
4. **Copy the key immediately** (you won't see it again)
5. Store it securely (see Step 2)

## Step 2: Store API Key Securely (1 minute)

### ⚠️ NEVER:
- ❌ Commit API keys to git
- ❌ Share keys in chat/messages
- ❌ Hardcode keys in source code
- ❌ Post keys in documentation

### ✅ ALWAYS:
- ✅ Store in `.env` file (gitignored)
- ✅ Use environment variables
- ✅ Rotate keys regularly
- ✅ Set usage limits

### Add to .env File

```bash
# Navigate to project root
cd /workspaces/africa-railways

# Add your API key to .env
echo "OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY_HERE" >> .env

# Verify it's gitignored
grep "^\.env$" .gitignore
```

## Step 3: Install Dependencies (1 minute)

```bash
cd scripts/airtable-sync
npm install openai
```

## Step 4: Test Your API Key (2 minutes)

### Option A: Using curl (Quick Test)

```bash
# Load environment variables
export $(cat .env | xargs)

# Test API call
curl https://api.openai.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {
        "role": "user",
        "content": "Say hello in one sentence"
      }
    ],
    "max_tokens": 50
  }'
```

Expected response:
```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-3.5-turbo",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I assist you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 12,
    "completion_tokens": 9,
    "total_tokens": 21
  }
}
```

### Option B: Using Node.js Test Script

I'll create a test script for you:

```bash
node scripts/openai-test.js
```

## Step 5: Understand Pricing

### GPT-3.5 Turbo (Recommended for Testing)
- **Input:** $0.50 / 1M tokens (~$0.0005 per 1K tokens)
- **Output:** $1.50 / 1M tokens (~$0.0015 per 1K tokens)
- **Speed:** Fast
- **Use case:** Most operations, testing

### GPT-4 Turbo
- **Input:** $10.00 / 1M tokens (~$0.01 per 1K tokens)
- **Output:** $30.00 / 1M tokens (~$0.03 per 1K tokens)
- **Speed:** Slower
- **Use case:** Complex analysis, high-quality outputs

### GPT-4o (Optimized)
- **Input:** $2.50 / 1M tokens (~$0.0025 per 1K tokens)
- **Output:** $10.00 / 1M tokens (~$0.01 per 1K tokens)
- **Speed:** Fast
- **Use case:** Balance of quality and cost

### Example Costs
- Simple query (100 tokens): ~$0.0002 (GPT-3.5)
- Analysis (1000 tokens): ~$0.002 (GPT-3.5)
- Daily report (5000 tokens): ~$0.01 (GPT-3.5)

## Available Models

### Chat Models (Recommended)
- `gpt-4o` - Latest, optimized
- `gpt-4-turbo` - High quality
- `gpt-4` - Most capable
- `gpt-3.5-turbo` - Fast and affordable

### Legacy Models (Not Recommended)
- `text-davinci-003` - Deprecated
- `gpt-3` - Deprecated

## Common API Endpoints

### 1. Chat Completions (Main Endpoint)
```
POST https://api.openai.com/v1/chat/completions
```

### 2. Embeddings (For Search/Similarity)
```
POST https://api.openai.com/v1/embeddings
```

### 3. Images (DALL-E)
```
POST https://api.openai.com/v1/images/generations
```

### 4. Audio (Whisper)
```
POST https://api.openai.com/v1/audio/transcriptions
```

## Best Practices

### 1. Set Usage Limits
- Go to [Billing → Usage Limits](https://platform.openai.com/account/limits)
- Set monthly budget (e.g., $50)
- Enable email alerts at 75% and 90%

### 2. Monitor Usage
- Check [Usage Dashboard](https://platform.openai.com/usage)
- Review daily/monthly costs
- Track token consumption

### 3. Optimize Costs
- Use `gpt-3.5-turbo` for simple tasks
- Set `max_tokens` to limit response length
- Cache responses when possible
- Use streaming for long responses

### 4. Error Handling
- Implement retry logic with exponential backoff
- Handle rate limits (429 errors)
- Validate responses
- Log errors for debugging

## Security Checklist

- [ ] API key stored in `.env` file
- [ ] `.env` is in `.gitignore`
- [ ] Usage limits configured
- [ ] Billing alerts enabled
- [ ] API key has descriptive name
- [ ] Regular key rotation scheduled
- [ ] No keys in git history

## Troubleshooting

### "Invalid API key"
- Check key is correct (starts with `sk-proj-` or `sk-`)
- Verify no extra spaces or newlines
- Ensure key hasn't been revoked

### "Rate limit exceeded"
- Wait and retry with exponential backoff
- Upgrade to higher tier plan
- Reduce request frequency

### "Insufficient quota"
- Add payment method
- Check billing settings
- Verify usage limits

### "Model not found"
- Use valid model name (e.g., `gpt-3.5-turbo`)
- Check model availability in your region
- Verify account has access to model

## Next Steps

1. ✅ Test basic API call
2. ✅ Run ChatGPT analytics script
3. ✅ Integrate with Airtable data
4. ✅ Set up automated reports
5. ✅ Monitor usage and costs

## Resources

- **API Documentation:** https://platform.openai.com/docs/api-reference
- **Pricing:** https://openai.com/pricing
- **Usage Dashboard:** https://platform.openai.com/usage
- **Community Forum:** https://community.openai.com
- **Status Page:** https://status.openai.com

## Support

For issues:
- Check OpenAI status page
- Review API documentation
- Search community forum
- Contact OpenAI support

---

**Estimated Setup Time:** 5 minutes  
**Cost to Test:** ~$0.01  
**Difficulty:** Beginner
