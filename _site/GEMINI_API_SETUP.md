# Gemini API Setup Guide

Quick reference for configuring Google Gemini AI in Africa Railways projects.

## API Key Details

**Project:** AfriCoin-Sovereign-Key  
**Project Number:** 5780586642  
**API Key:** `AIzaSyAqJaTc_LubzhXsohzA8Qi4PyQ-LtNPrhc`

⚠️ **Security:** This key is for the Africa Railways and Africoin projects. Keep it secure and never commit to public repositories.

---

## Quick Setup

### Automated Setup (Recommended)

```bash
# Set Codemagic API token
export CODEMAGIC_API_TOKEN="your_token_here"

# Run setup script
./setup-gemini-api.sh
```

This will add `GEMINI_API_KEY` to:
- Codemagic environment groups (web_credentials, railways_credentials, africoin_credentials)
- GitHub repository secrets
- Local environment (if needed)

### Manual Setup

**Codemagic:**
1. Go to https://codemagic.io/apps/69502eb9a1902c6825c51679/settings
2. Navigate to Environment variables
3. Add to these groups:
   - `web_credentials`
   - `railways_credentials`
   - `africoin_credentials`
4. Variable name: `GEMINI_API_KEY`
5. Value: `AIzaSyAqJaTc_LubzhXsohzA8Qi4PyQ-LtNPrhc`
6. Mark as secure: ✅

**GitHub:**
1. Go to https://github.com/mpolobe/africa-railways/settings/secrets/actions
2. Add repository secret:
   - Name: `GEMINI_API_KEY`
   - Value: `AIzaSyAqJaTc_LubzhXsohzA8Qi4PyQ-LtNPrhc`

**Local Development:**
```bash
# Add to .env.local (not committed)
echo "GEMINI_API_KEY=AIzaSyAqJaTc_LubzhXsohzA8Qi4PyQ-LtNPrhc" >> .env.local
```

---

## Features Enabled

### Africa Railways Mobile App
- AI-powered customer support chatbot
- Natural language ticket booking
- Route recommendations
- Travel assistance
- Multi-language support

### Web Dashboard
- AI assistant for operations
- Predictive analytics
- Automated reporting
- Customer inquiry handling

### Models Used
- **Primary:** `gemini-pro` - Text generation and chat
- **Alternative:** `gemini-3-flash-preview` - Faster responses

---

## Usage Examples

### In React Native (SmartphoneApp)

```typescript
// services/geminiService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

export async function sendChatMessage(message: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const result = await model.generateContent(message);
  return result.response.text();
}
```

### In Web App (Vite/React)

```typescript
// lib/geminiService.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(API_KEY);

export async function chat(prompt: string) {
  const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

---

## Testing

### Test API Connection

```bash
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=AIzaSyAqJaTc_LubzhXsohzA8Qi4PyQ-LtNPrhc" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{
        "text": "Hello, how can you help with railway bookings?"
      }]
    }]
  }'
```

### Test in App

**Mobile App:**
1. Run: `npm run mobile:start`
2. Open app
3. Navigate to AI Assistant
4. Send test message

**Web App:**
1. Run: `npm run dev`
2. Open browser
3. Click AI chatbot icon
4. Send test message

---

## Quota and Limits

**Free Tier:**
- 60 requests per minute
- 1,500 requests per day
- 1 million tokens per month

**Current Usage:**
- Monitor at: https://console.cloud.google.com/apis/dashboard?project=5780586642

**If Limits Exceeded:**
1. Upgrade to paid tier
2. Implement request caching
3. Add rate limiting
4. Use batch requests

---

## Security Best Practices

### DO ✅
- Store API key in environment variables
- Use Codemagic/GitHub secrets for CI/CD
- Mark as secure in Codemagic
- Rotate key if exposed
- Monitor usage regularly

### DON'T ❌
- Commit API key to Git
- Share key in plain text
- Use in client-side code (web apps)
- Log API key in console
- Use same key across unrelated projects

### Key Rotation

If key is compromised:

1. **Generate new key:**
   - Go to https://console.cloud.google.com/apis/credentials?project=5780586642
   - Create new API key
   - Restrict to Generative Language API

2. **Update everywhere:**
   ```bash
   # Update in script
   vim setup-gemini-api.sh
   # Run setup again
   ./setup-gemini-api.sh
   ```

3. **Delete old key:**
   - Remove from Google Cloud Console
   - Verify no services using it

---

## Troubleshooting

### Error: "API key not valid"
**Solution:** Verify key is correct and API is enabled
```bash
# Check API status
gcloud services list --enabled --project=5780586642 | grep generativelanguage
```

### Error: "Quota exceeded"
**Solution:** Check usage and upgrade if needed
- Dashboard: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas?project=5780586642

### Error: "Model not found"
**Solution:** Use correct model name
- Valid: `gemini-pro`, `gemini-pro-vision`
- Invalid: `gemini-3-flash-preview` (check availability)

### Chatbot not responding
**Solution:** Check environment variable is set
```bash
# In mobile app
echo $GEMINI_API_KEY

# In web app (browser console)
console.log(import.meta.env.VITE_GEMINI_API_KEY)
```

---

## Resources

### Documentation
- [Gemini API Docs](https://ai.google.dev/docs)
- [Google AI Studio](https://aistudio.google.com/)
- [API Reference](https://ai.google.dev/api/rest)

### Project Links
- [Google Cloud Console](https://console.cloud.google.com/apis/dashboard?project=5780586642)
- [API Credentials](https://console.cloud.google.com/apis/credentials?project=5780586642)
- [Quota Management](https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas?project=5780586642)

### Related Files
- `setup-gemini-api.sh` - Automated setup script
- `SmartphoneApp/services/geminiService.ts` - Mobile implementation
- `codemagic.yaml` - CI/CD configuration

---

## Summary

✅ **API Key:** `AIzaSyAqJaTc_LubzhXsohzA8Qi4PyQ-LtNPrhc`  
✅ **Project:** AfriCoin-Sovereign-Key (5780586642)  
✅ **Setup Script:** `./setup-gemini-api.sh`  
✅ **Models:** gemini-pro, gemini-pro-vision  
✅ **Features:** AI chatbot, customer support, booking assistance

**Next Steps:**
1. Run `./setup-gemini-api.sh` to configure credentials
2. Test API connection
3. Deploy and test in app
4. Monitor usage and quota

---

**Last Updated:** December 28, 2024  
**Status:** Ready for deployment
