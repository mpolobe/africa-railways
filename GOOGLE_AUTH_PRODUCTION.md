# Google OAuth Production Implementation

This document describes the production Google OAuth implementation for Africa Railways.

## Overview

The authentication system uses **Supabase OAuth** for production Google/Facebook/Apple sign-in, matching the implementation in `mpolobe/scroll-waitlist-exchange-1`.

## Configuration

### 1. Set Supabase Anon Key

Edit `js/config.js` and set your Supabase anon key:

```javascript
window.SUPABASE_ANON_KEY = 'your-supabase-anon-key-here';
```

Get this from: Supabase Dashboard > Project Settings > API > anon public

### 2. Configure OAuth Providers in Supabase

In Supabase Dashboard > Authentication > Providers:

#### Google OAuth
1. Enable Google provider
2. Add your Google OAuth credentials:
   - Client ID: From Google Cloud Console
   - Client Secret: From Google Cloud Console
3. Add authorized redirect URIs in Google Cloud Console:
   - `https://llvprbmrnjvamjzavmhg.supabase.co/auth/v1/callback`

#### Facebook OAuth
1. Enable Facebook provider
2. Add your Facebook App credentials:
   - App ID: From Facebook Developers
   - App Secret: From Facebook Developers
3. Add redirect URI in Facebook App settings:
   - `https://llvprbmrnjvamjzavmhg.supabase.co/auth/v1/callback`

#### Apple OAuth
1. Enable Apple provider
2. Add your Apple credentials:
   - Service ID
   - Team ID
   - Key ID
   - Private Key

### 3. Configure Redirect URLs

In Supabase Dashboard > Authentication > URL Configuration > Redirect URLs, add:
- `https://africarailways.com/auth-callback.html`
- `https://www.africarailways.com/auth-callback.html`
- `http://localhost:3000/auth-callback.html` (for development)

## Files Modified

| File | Changes |
|------|---------|
| `js/config.js` | New - Configuration file for Supabase credentials |
| `js/supabase-auth.js` | New - Shared Supabase auth module |
| `auth-callback.html` | New - OAuth callback handler |
| `index.html` | Updated - Uses Supabase OAuth instead of demo popups |
| `occ-login.html` | Updated - Uses Supabase OAuth |
| `developer-login.html` | Updated - Uses Supabase OAuth |
| `.env.example` | Updated - Added Supabase configuration notes |

## How It Works

1. User clicks "Sign in with Google"
2. `supabaseClient.auth.signInWithOAuth()` redirects to Google
3. User authenticates with Google
4. Google redirects back to Supabase
5. Supabase redirects to `/auth-callback.html`
6. Callback page extracts session and creates wallet
7. User is redirected to their intended destination

## SmartphoneApp

The SmartphoneApp (`SmartphoneApp/contexts/AuthContext.tsx`) already uses Supabase OAuth and requires no changes. It uses the same Supabase project.

## Testing

1. Set `SUPABASE_ANON_KEY` in `js/config.js`
2. Open the site in a browser
3. Click "Sign in with Google"
4. Complete Google authentication
5. Verify redirect back to the site with session

## Security Notes

- The Supabase anon key is safe to expose in client-side code
- It only allows authenticated operations
- Row Level Security (RLS) in Supabase protects data
- OAuth tokens are stored in localStorage/sessionStorage
