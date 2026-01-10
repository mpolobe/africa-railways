# Facebook Integration - Quick Start

## 🚀 Quick Setup (5 Minutes)

### Step 1: Get Facebook Credentials

1. **Get Page ID:**
   - Go to [facebook.com/afrcsentinel](https://facebook.com/afrcsentinel)
   - Click **About** → **Page Transparency**
   - Copy the **Page ID**

2. **Get Page Access Token:**
   - Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
   - Click "Get Token" → "Get Page Access Token"
   - Select **afrcsentinel** page
   - Grant permissions: `pages_manage_posts`, `pages_read_engagement`
   - Copy the token

### Step 2: Configure Backend

Run the setup script:
```bash
./setup-facebook.sh
```

Or manually add to `backend/.env`:
```bash
FACEBOOK_PAGE_ID=your_page_id_here
FACEBOOK_PAGE_ACCESS_TOKEN=your_token_here
```

### Step 3: Test

```bash
# Start backend
cd backend
./bin/backend

# Test in another terminal
curl http://localhost:8080/api/facebook/status
```

Expected output:
```json
{"configured":true,"page_id":"123456789012345"}
```

### Step 4: Use

1. Open `sentinel-dashboard.html`
2. Create a post in newsfeed
3. Click "📘 Share to Facebook"
4. Check [facebook.com/afrcsentinel](https://facebook.com/afrcsentinel)

## ✅ That's It!

Your posts will now appear on Facebook with automatic hashtags:
- #AfricaRailways
- #Sentinel
- #RailwaySafety

## 🔧 Troubleshooting

**Error: "Facebook credentials not configured"**
→ Set environment variables in `backend/.env`

**Error: "Invalid OAuth access token"**
→ Generate a new page access token

**Posts not appearing**
→ Check page is published (not draft)

## 📚 Full Documentation

See `FACEBOOK_INTEGRATION_GUIDE.md` for:
- Detailed setup instructions
- Security best practices
- Advanced features
- API reference

## 🎯 Quick Commands

```bash
# Setup
./setup-facebook.sh

# Test
curl http://localhost:8080/api/facebook/status

# Share a post
curl -X POST http://localhost:8080/api/facebook/share \
  -H "Content-Type: application/json" \
  -d '{"post_id":"1","message":"Test post"}'
```

## 📱 Production Deployment

Add environment variables to your hosting platform:

**Railway:**
```bash
railway variables set FACEBOOK_PAGE_ID=your_id
railway variables set FACEBOOK_PAGE_ACCESS_TOKEN=your_token
```

**Vercel:**
```bash
vercel env add FACEBOOK_PAGE_ID
vercel env add FACEBOOK_PAGE_ACCESS_TOKEN
```

**Heroku:**
```bash
heroku config:set FACEBOOK_PAGE_ID=your_id
heroku config:set FACEBOOK_PAGE_ACCESS_TOKEN=your_token
```

---

**Need Help?** See `FACEBOOK_INTEGRATION_GUIDE.md` for detailed instructions.
