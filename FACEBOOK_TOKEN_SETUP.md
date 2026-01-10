# Facebook Page Access Token Setup

## ⚠️ Current Status

**Page ID:** ✅ Configured (886983297839692)
**Access Token:** ❌ Invalid or incomplete

The token provided appears to be incomplete. Facebook Page Access Tokens are typically 100-200+ characters long and start with `EAA`.

## 🔑 How to Get a Valid Page Access Token

### Method 1: Graph API Explorer (Recommended for Testing)

1. **Go to Graph API Explorer**
   - Visit: [https://developers.facebook.com/tools/explorer/](https://developers.facebook.com/tools/explorer/)

2. **Select Your App**
   - In the top dropdown, select your Facebook App
   - If you don't have an app, create one at [developers.facebook.com](https://developers.facebook.com/)

3. **Get Page Access Token**
   - Click "Get Token" button
   - Select "Get Page Access Token"
   - Choose the **afrcsentinel** page (ID: 886983297839692)
   - Grant these permissions:
     - ✅ `pages_manage_posts`
     - ✅ `pages_read_engagement`
   - Click "Generate Access Token"

4. **Copy the Token**
   - The token will appear in the "Access Token" field
   - It should look like: `EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - Copy the ENTIRE token (100-200+ characters)

### Method 2: Facebook Business Manager (For Production)

1. **Go to Business Settings**
   - Visit: [https://business.facebook.com/settings](https://business.facebook.com/settings)

2. **Create System User**
   - Go to **Users** → **System Users**
   - Click "Add" to create a new system user
   - Name it "Sentinel Dashboard"

3. **Assign Page Access**
   - Select the system user
   - Click "Add Assets"
   - Select **Pages**
   - Choose **afrcsentinel** page
   - Grant "Manage Page" permission

4. **Generate Token**
   - Click "Generate New Token"
   - Select the **afrcsentinel** page
   - Choose permissions:
     - ✅ `pages_manage_posts`
     - ✅ `pages_read_engagement`
   - Set token to **Never Expire** (for production)
   - Copy the token

## 📝 Update Configuration

Once you have the correct token:

### Option 1: Using Setup Script
```bash
./setup-facebook.sh
```

### Option 2: Manual Configuration

Edit `backend/.env`:
```bash
FACEBOOK_PAGE_ID=886983297839692
FACEBOOK_PAGE_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Option 3: Environment Variables
```bash
export FACEBOOK_PAGE_ID=886983297839692
export FACEBOOK_PAGE_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## ✅ Verify Configuration

Test the token:
```bash
curl -X GET "https://graph.facebook.com/v18.0/me?access_token=YOUR_TOKEN_HERE"
```

Expected response:
```json
{
  "name": "AFRC Sentinel",
  "id": "886983297839692"
}
```

## 🧪 Test Posting

Once configured, test posting:
```bash
curl -X POST http://localhost:8080/api/facebook/share \
  -H "Content-Type: application/json" \
  -d '{
    "post_id": "test-1",
    "message": "Test post from Sentinel Dashboard"
  }'
```

Expected response:
```json
{
  "success": true,
  "facebook_id": "886983297839692_123456789",
  "message": "Successfully posted to facebook.com/afrcsentinel"
}
```

## 🔒 Security Notes

1. **Never commit tokens to Git**
   - The `.env` file is in `.gitignore`
   - Never hardcode tokens in code

2. **Use long-lived tokens for production**
   - Short-lived tokens expire in 1-2 hours
   - Long-lived tokens last 60 days
   - Never-expiring tokens are best for production

3. **Rotate tokens regularly**
   - Even never-expiring tokens should be rotated every 60-90 days
   - Keep backup tokens in case of issues

## 📱 Token Types

### Short-Lived User Access Token
- **Lifetime:** 1-2 hours
- **Use:** Testing only
- **Get from:** Graph API Explorer

### Long-Lived User Access Token
- **Lifetime:** 60 days
- **Use:** Development
- **Get from:** Exchange short-lived token

### Page Access Token
- **Lifetime:** Same as user token
- **Use:** Posting to pages
- **Get from:** Graph API Explorer or Business Manager

### Never-Expiring Page Access Token
- **Lifetime:** Never expires
- **Use:** Production
- **Get from:** Business Manager System User

## 🆘 Troubleshooting

### Error: "Invalid OAuth access token"
**Cause:** Token is invalid, expired, or incomplete
**Solution:** Generate a new token using Graph API Explorer

### Error: "Cannot parse access token"
**Cause:** Token format is incorrect
**Solution:** Ensure token starts with `EAA` and is 100+ characters

### Error: "Permissions error"
**Cause:** Token doesn't have required permissions
**Solution:** Regenerate token with `pages_manage_posts` permission

### Token expires quickly
**Cause:** Using short-lived token
**Solution:** Generate long-lived or never-expiring token

## 📚 Additional Resources

- [Facebook Access Tokens](https://developers.facebook.com/docs/facebook-login/guides/access-tokens)
- [Page Access Tokens](https://developers.facebook.com/docs/pages/access-tokens)
- [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
- [Business Manager](https://business.facebook.com/)

## ✉️ Need Help?

If you're still having issues:
1. Check the token format (should start with `EAA`)
2. Verify token length (100-200+ characters)
3. Test token with Graph API Explorer
4. Check token permissions
5. Generate a fresh token

---

**Current Configuration:**
- Page ID: ✅ 886983297839692
- Access Token: ❌ Needs valid token

**Next Step:** Get a valid Page Access Token from Graph API Explorer
