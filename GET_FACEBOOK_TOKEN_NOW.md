# Get Facebook Token - Step by Step (2 Minutes)

## 🚀 Quick Steps to Get Your Token RIGHT NOW

### Step 1: Open Graph API Explorer
Click this link: [https://developers.facebook.com/tools/explorer/](https://developers.facebook.com/tools/explorer/)

### Step 2: Login
- Login with your Facebook account that manages the **afrcsentinel** page

### Step 3: Get Token
1. Look for the "Get Token" button (blue button near the top)
2. Click it
3. Select **"Get Page Access Token"**
4. A popup will appear showing your pages

### Step 4: Select Your Page
- Find and select **"AFRC Sentinel"** or the page with ID **886983297839692**
- Check these permissions:
  - ✅ pages_manage_posts
  - ✅ pages_read_engagement
- Click "Generate Access Token"

### Step 5: Copy the Token
- The token will appear in the "Access Token" field at the top
- It will look like this:
  ```
  EAABsbCS1iHgBO7jZCZBqhZCiVwvZCxKLmn8ZAjZBZCqZCZCZBqhZCiVwvZCxKLmn8ZAjZBZCqZCZCZBqhZCiVwvZCxKLmn8ZAjZBZCqZCZCZBqhZCiVwvZCxKLmn8ZAjZBZCqZC
  ```
- **Copy the ENTIRE token** (it's very long, 100-200+ characters)

### Step 6: Send Me the Token
Once you have it, just paste it here and I'll configure everything!

## ❓ Don't Have Access to Graph API Explorer?

### Alternative: Get Token from Facebook Business Manager

1. Go to: [https://business.facebook.com/settings/system-users](https://business.facebook.com/settings/system-users)
2. Create a new System User called "Sentinel Dashboard"
3. Add the **afrcsentinel** page to this user
4. Generate a token with "Manage Page" permission
5. Copy the token

## 🔍 What the Token Should Look Like

**CORRECT Token Format:**
```
EAABsbCS1iHgBO7jZCZBqhZCiVwvZCxKLmn8ZAjZBZCqZCZCZBqhZCiVwvZCxKLmn8ZAjZBZCqZCZCZBqhZCiVwvZCxKLmn8ZAjZBZCqZCZCZBqhZCiVwvZCxKLmn8ZAjZBZCqZC
```
- Starts with: `EAA`
- Length: 100-200+ characters
- Contains: Letters, numbers, and sometimes special characters

**INCORRECT Token (what you provided):**
```
8e4c69517ff9fd2eda621363af2cc701
```
- Only 32 characters
- Doesn't start with `EAA`
- This looks like an MD5 hash, not a Facebook token

## 🆘 Still Having Issues?

### Option 1: Share Your Screen
If you can share your screen, I can guide you through getting the token.

### Option 2: Check Your Facebook App
- Do you have a Facebook App created?
- Is the app connected to the **afrcsentinel** page?
- Do you have admin access to the page?

### Option 3: Create a New Facebook App
If you don't have an app yet:
1. Go to [https://developers.facebook.com/apps/](https://developers.facebook.com/apps/)
2. Click "Create App"
3. Select "Business" type
4. Name it "Sentinel Dashboard"
5. Then follow the steps above to get the token

## 📞 Need Help?

I'm here to help! Once you get the token (starting with `EAA` and 100+ characters), just paste it and I'll:
1. ✅ Configure the backend
2. ✅ Test the integration
3. ✅ Make a test post to facebook.com/afrcsentinel
4. ✅ Verify everything works

---

**Current Status:**
- Page ID: ✅ 886983297839692 (correct)
- Token: ❌ Invalid format (needs EAA... token)

**Next Step:** Get the correct token from Graph API Explorer
