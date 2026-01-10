# Facebook Integration Guide

## Overview
This guide explains how to set up Facebook integration to automatically share newsfeed posts to facebook.com/afrcsentinel.

## Features
- ✅ Share newsfeed posts directly to Facebook page
- ✅ Automatic hashtag addition (#AfricaRailways #Sentinel #RailwaySafety)
- ✅ Secure token management (backend-only)
- ✅ One-click sharing from dashboard

## Setup Steps

### 1. Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click "My Apps" → "Create App"
3. Select "Business" as app type
4. Fill in app details:
   - **App Name:** Africa Railways Sentinel
   - **App Contact Email:** ben.mpolokoso@gmail.com
   - **Business Account:** Select your business account

### 2. Configure Facebook App

1. In your app dashboard, go to **Settings** → **Basic**
2. Note down your **App ID** and **App Secret**
3. Add **App Domains:** `africarailways.com`, `dashboard.africarailways.com`
4. Add **Privacy Policy URL:** `https://africarailways.com/privacy`
5. Add **Terms of Service URL:** `https://africarailways.com/terms`

### 3. Add Facebook Login

1. Go to **Products** → Add **Facebook Login**
2. Configure OAuth Redirect URIs:
   - `https://dashboard.africarailways.com/`
   - `http://localhost:8080/` (for testing)

### 4. Get Page Access Token

#### Option A: Using Graph API Explorer (Recommended for Testing)

1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from dropdown
3. Click "Get Token" → "Get Page Access Token"
4. Select the **afrcsentinel** page
5. Grant permissions:
   - `pages_manage_posts`
   - `pages_read_engagement`
6. Copy the **Page Access Token**

#### Option B: Using Facebook Business Manager (Production)

1. Go to [Facebook Business Manager](https://business.facebook.com/)
2. Navigate to **Business Settings** → **System Users**
3. Create a new system user: "Sentinel Dashboard"
4. Assign the user to your page with these permissions:
   - Manage Page
   - Create Content
5. Generate a **Page Access Token**
6. **Important:** Make this token **never expire** for production

### 5. Get Page ID

1. Go to your Facebook page: [facebook.com/afrcsentinel](https://facebook.com/afrcsentinel)
2. Click **About** → **Page Transparency**
3. Copy the **Page ID** (numeric ID)

Or use Graph API Explorer:
```
GET /me/accounts
```
Find your page in the response and copy the `id` field.

### 6. Configure Backend Environment Variables

Add these to your backend environment:

```bash
# Facebook Integration
FACEBOOK_PAGE_ID=your_page_id_here
FACEBOOK_PAGE_ACCESS_TOKEN=your_page_access_token_here
```

#### For Local Development
Create `.env` file in `backend/` directory:
```bash
FACEBOOK_PAGE_ID=123456789012345
FACEBOOK_PAGE_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### For Production (Railway/Vercel/etc)
Add environment variables in your hosting platform:
```bash
FACEBOOK_PAGE_ID=123456789012345
FACEBOOK_PAGE_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 7. Update Frontend Configuration

Edit `sentinel-dashboard.html` and update the Facebook App ID:

```javascript
FB.init({
    appId      : 'YOUR_FACEBOOK_APP_ID', // Replace with your App ID
    cookie     : true,
    xfbml      : true,
    version    : 'v18.0'
});
```

## Testing

### 1. Test Backend API

```bash
# Start backend
cd backend
export FACEBOOK_PAGE_ID=your_page_id
export FACEBOOK_PAGE_ACCESS_TOKEN=your_token
./bin/backend
```

### 2. Test Facebook Status Endpoint

```bash
curl http://localhost:8080/api/facebook/status
```

Expected response:
```json
{
  "configured": true,
  "page_id": "123456789012345"
}
```

### 3. Test Sharing

```bash
curl -X POST http://localhost:8080/api/facebook/share \
  -H "Content-Type: application/json" \
  -d '{
    "post_id": "1",
    "message": "Test post from Sentinel Dashboard"
  }'
```

Expected response:
```json
{
  "success": true,
  "facebook_id": "123456789012345_987654321098765",
  "message": "Successfully posted to facebook.com/afrcsentinel"
}
```

### 4. Test from Dashboard

1. Open `sentinel-dashboard.html`
2. Create a new post in the newsfeed
3. Click "📘 Share to Facebook" button
4. Confirm the share dialog
5. Check facebook.com/afrcsentinel for the post

## Security Best Practices

### 1. Never Expose Tokens in Frontend
✅ **DO:** Store tokens in backend environment variables
❌ **DON'T:** Hardcode tokens in JavaScript

### 2. Use Long-Lived Tokens
For production, generate a **never-expiring** page access token:
```bash
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=SHORT_LIVED_TOKEN"
```

### 3. Rotate Tokens Regularly
Even with never-expiring tokens, rotate them every 60-90 days.

### 4. Monitor API Usage
Check Facebook's [App Dashboard](https://developers.facebook.com/apps/) for:
- API call limits
- Error rates
- Security alerts

## Troubleshooting

### Error: "Invalid OAuth access token"
**Solution:** Token expired or invalid. Generate a new page access token.

### Error: "Permissions error"
**Solution:** Ensure the token has `pages_manage_posts` permission.

### Error: "Page not found"
**Solution:** Verify the `FACEBOOK_PAGE_ID` is correct.

### Error: "Facebook credentials not configured"
**Solution:** Set `FACEBOOK_PAGE_ID` and `FACEBOOK_PAGE_ACCESS_TOKEN` environment variables.

### Posts not appearing on Facebook
**Solution:** 
1. Check if page is published (not in draft mode)
2. Verify token permissions
3. Check Facebook API rate limits

## API Endpoints

### Share Post to Facebook
```
POST /api/facebook/share
Content-Type: application/json

{
  "post_id": "1",
  "message": "Post content here"
}
```

Response:
```json
{
  "success": true,
  "facebook_id": "123456789012345_987654321098765",
  "message": "Successfully posted to facebook.com/afrcsentinel"
}
```

### Check Facebook Status
```
GET /api/facebook/status
```

Response:
```json
{
  "configured": true,
  "page_id": "123456789012345"
}
```

## Usage

### From Dashboard

1. **Create a post** in the newsfeed
2. **Click** the "📘 Share to Facebook" button
3. **Confirm** the share dialog
4. **Success!** Post appears on facebook.com/afrcsentinel

### Automatic Hashtags

All posts shared to Facebook automatically include:
- `#AfricaRailways`
- `#Sentinel`
- `#RailwaySafety`

### Post Format

```
[Original post content]

#AfricaRailways #Sentinel #RailwaySafety
```

## Advanced Features

### 1. Schedule Posts

To schedule posts for later:
```javascript
FB.api(
  `/${pageId}/feed`,
  'POST',
  {
    message: message,
    published: false,
    scheduled_publish_time: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    access_token: pageAccessToken
  }
);
```

### 2. Add Images

To share posts with images:
```javascript
FB.api(
  `/${pageId}/photos`,
  'POST',
  {
    url: imageUrl,
    caption: message,
    access_token: pageAccessToken
  }
);
```

### 3. Add Links

To share posts with link previews:
```javascript
FB.api(
  `/${pageId}/feed`,
  'POST',
  {
    message: message,
    link: 'https://africarailways.com',
    access_token: pageAccessToken
  }
);
```

## Monitoring

### Check Post Performance

```bash
curl "https://graph.facebook.com/v18.0/{post_id}?fields=likes.summary(true),comments.summary(true),shares&access_token={page_access_token}"
```

### Get Page Insights

```bash
curl "https://graph.facebook.com/v18.0/{page_id}/insights?metric=page_impressions,page_engaged_users&access_token={page_access_token}"
```

## Rate Limits

Facebook API has rate limits:
- **200 calls per hour** per user
- **4800 calls per day** per app

For high-volume posting, consider:
1. Batching requests
2. Implementing retry logic
3. Caching responses

## Compliance

### Facebook Platform Policies
Ensure compliance with:
- [Facebook Platform Terms](https://developers.facebook.com/terms)
- [Facebook Community Standards](https://www.facebook.com/communitystandards)
- [Page Publishing Guidelines](https://www.facebook.com/policies/pages_groups_events/)

### Data Privacy
- Don't share user data without consent
- Follow GDPR/data protection laws
- Include privacy policy link

## Support

### Facebook Developer Support
- [Developer Community](https://developers.facebook.com/community/)
- [Bug Reports](https://developers.facebook.com/support/bugs/)
- [Documentation](https://developers.facebook.com/docs/)

### Internal Support
- Check backend logs: `./bin/backend`
- Check browser console for errors
- Test with Graph API Explorer

## Summary

✅ **Setup Complete When:**
- Facebook App created
- Page Access Token generated
- Environment variables configured
- Backend API tested
- Dashboard sharing works

✅ **Ready to Use:**
- Share newsfeed posts to facebook.com/afrcsentinel
- Automatic hashtag addition
- Secure token management
- One-click sharing

---

**Last Updated:** 2026-01-10
**Version:** 1.0.0
**Status:** 🟢 Ready for Production
