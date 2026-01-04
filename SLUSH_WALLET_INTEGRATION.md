# Slush Wallet Integration Guide

## Overview
This document describes the Slush Wallet integration for the ARail investor portal, specifically addressing the wallet connection and redirection flow.

## Integration Flow

### 1. Initial Connection Request
When a user on mobile/tablet clicks "Connect Wallet", they are redirected to Slush.app:

```
https://my.slush.app/connect?return=<encoded_url>&app=arail
```

**Parameters:**
- `return`: URL-encoded return address (e.g., `https://www.africarailways.com/investor`)
- `app`: Application identifier (`arail`)

### 2. Slush Connection Process
The user connects their wallet on the Slush platform (my.slush.app).

### 3. Return Redirect
After successful connection, Slush should redirect back to the return URL with wallet information:

```
https://www.africarailways.com/investor?address=<wallet_address>&wallet=Slush&connected=true
```

**Expected Return Parameters:**

#### Primary Parameters (Preferred)
- `address`: The connected wallet address (e.g., `0x1234567890abcdef...`)
- `wallet`: Wallet provider name (e.g., `Slush`)
- `connected`: Connection status (`true` or `false`)

#### Alternative Parameters (Also Supported)
- `walletAddress` or `account`: Alternative names for `address`
- `success` or `status`: Alternative names for `connected`

#### Error Handling
If connection fails, Slush should return:
```
https://www.africarailways.com/investor?connected=false&error=<error_message>
```

## Implementation Details

### Automatic Connection Handling
The investor portal automatically detects and handles wallet connections through:

1. **URL Parameter Detection**: Checks for wallet address in URL on page load
2. **Session Persistence**: Stores wallet connection in localStorage (24-hour expiry)
3. **Auto-Reconnect**: Automatically restores wallet connection on page reload

### Files Modified
- `js/wallet-detector.js`: Core wallet detection and connection logic
- `investor.html`: React component with auto-connect on mount

### Key Features

#### Session Management
```javascript
// Sessions are stored in localStorage with key: 'arail_wallet_session'
{
    address: "0x123...",
    wallet: "Slush",
    timestamp: 1704362721747  // Unix timestamp
}
```

#### Session Expiry
- Sessions expire after 24 hours
- Expired sessions are automatically cleared

#### URL Cleanup
After extracting wallet information, URL parameters are removed for better UX:
```
Before: https://www.africarailways.com/investor?address=0x123...&connected=true
After:  https://www.africarailways.com/investor
```

## Testing the Integration

### Manual Testing on Mobile/Tablet
1. Open `https://www.africarailways.com/investor` on mobile/tablet
2. Click "Connect SUI Wallet"
3. Confirm redirect to Slush
4. Connect wallet on Slush platform
5. Verify redirect back to investor page
6. Confirm wallet shows as connected with address displayed

### Expected Behaviors
- ✅ Wallet address displays in header when connected
- ✅ Connection persists across page reloads (24 hours)
- ✅ "Disconnect" button appears when wallet is connected
- ✅ Investment calculator becomes enabled when wallet is connected

### Testing URL Parameters Manually
For testing without Slush, append URL parameters:
```
https://www.africarailways.com/investor?address=0x1234567890abcdef&wallet=Slush&connected=true
```

The page should:
1. Parse the parameters
2. Save the session
3. Show wallet as connected
4. Remove parameters from URL

## Troubleshooting

### Issue: Wallet doesn't connect after returning from Slush
**Possible causes:**
1. Slush is not passing the correct URL parameters
2. Return URL encoding issue
3. CORS or redirect issues

**Debug steps:**
1. Check browser console for logs
2. Verify URL parameters on return
3. Check localStorage for `arail_wallet_session`
4. Verify no JavaScript errors in console

### Issue: Session doesn't persist
**Possible causes:**
1. localStorage is disabled/blocked
2. Private/incognito mode
3. Session expired (>24 hours old)

**Debug steps:**
1. Check browser localStorage settings
2. Verify localStorage access in console
3. Check session timestamp

### Issue: Wrong wallet address displayed
**Possible causes:**
1. Cached/stale session
2. Multiple wallet connections

**Solution:**
1. Click "Disconnect" button
2. Clear localStorage manually
3. Reconnect wallet

## Security Considerations

1. **Session Storage**: Wallet addresses are stored in localStorage (not sensitive data)
2. **No Private Keys**: Private keys are NEVER stored or transmitted
3. **Session Expiry**: 24-hour automatic expiry prevents stale sessions
4. **URL Cleanup**: Parameters removed from URL to prevent sharing sensitive links

## Slush Integration Requirements

### For Slush Team
To complete this integration, Slush.app needs to:

1. Accept the `return` URL parameter on `/connect` endpoint
2. Store the return URL during authentication
3. Redirect to return URL with wallet information after successful connection:
   ```
   {returnUrl}?address={walletAddress}&wallet=Slush&connected=true
   ```
4. Handle error cases with:
   ```
   {returnUrl}?connected=false&error={errorMessage}
   ```

### Example Implementation
```javascript
// After successful wallet connection on Slush
const returnUrl = getStoredReturnUrl(); // e.g., https://www.africarailways.com/investor
const walletAddress = getConnectedWalletAddress(); // e.g., 0x123...

// Build redirect URL
const redirectUrl = new URL(returnUrl);
redirectUrl.searchParams.set('address', walletAddress);
redirectUrl.searchParams.set('wallet', 'Slush');
redirectUrl.searchParams.set('connected', 'true');

// Redirect
window.location.href = redirectUrl.toString();
```

## Future Enhancements

1. **Deep Linking**: Support mobile app deep links
2. **QR Code**: Generate QR code for desktop → mobile wallet connection
3. **Multi-Wallet**: Support connecting multiple wallets simultaneously
4. **Web3 Standard**: Implement standard Web3 provider interface
5. **Session Refresh**: Add ability to extend session without reconnecting

## Support

For integration issues, contact:
- ARail Development Team
- Slush Wallet Support: support@slush.app

## Version History

- v1.0 (2026-01-04): Initial implementation with URL parameter handling and session persistence
