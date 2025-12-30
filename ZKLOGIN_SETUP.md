# zkLogin OTP Authentication Setup

This document explains how to use the new zkLogin authentication system with OTP (One-Time Password) for Africa Railways.

## Overview

The zkLogin authentication system provides:
- **Phone number-based authentication** using SMS OTP
- **Dual OTP providers**: Africa's Talking (primary) + Twilio (fallback)
- **Automatic failover** if primary provider fails
- **Sui blockchain integration** for wallet address generation
- **Session management** with persistent storage

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    User Interface                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Login      │  │   Signup     │  │   Protected  │      │
│  │   Screen     │  │   Screen     │  │   Routes     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  ZkLoginContext                              │
│  - User state management                                     │
│  - Session persistence                                       │
│  - Authentication methods                                    │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    OTP Service                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Africa's    │  │   Twilio     │  │  OTP         │      │
│  │  Talking     │  │   (Fallback) │  │  Validation  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## Files Added

### 1. `SmartphoneApp/lib/otpService.ts`
OTP service with dual provider support:
- Sends SMS via Africa's Talking (primary)
- Falls back to Twilio if primary fails
- Validates OTP codes
- Manages OTP expiration and attempts

### 2. `SmartphoneApp/contexts/ZkLoginContext.tsx`
Authentication context providing:
- User state management
- OTP sending/verification methods
- Session persistence
- Sui address generation

### 3. `SmartphoneApp/screens/auth/ZkLogin.tsx`
Login screen with:
- Phone number input
- OTP verification
- Error handling
- Resend functionality

### 4. `SmartphoneApp/screens/auth/ZkSignup.tsx`
Signup screen with:
- User details collection (name, country)
- Phone number verification
- Account creation

## Installation

### Step 1: Install Dependencies

The authentication system uses existing dependencies. Verify they're installed:

```bash
cd SmartphoneApp
npm install
```

### Step 2: Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Add your API credentials:

```env
# Africa's Talking (Primary)
VITE_AFRICAS_TALKING_API_KEY=your_api_key_here
VITE_AFRICAS_TALKING_USERNAME=your_username_here

# Twilio (Fallback - Optional but recommended)
VITE_TWILIO_ACCOUNT_SID=your_account_sid_here
VITE_TWILIO_AUTH_TOKEN=your_auth_token_here
VITE_TWILIO_PHONE_NUMBER=+1234567890
```

### Step 3: Get API Credentials

#### Africa's Talking

1. Sign up at [https://account.africastalking.com/](https://account.africastalking.com/)
2. Go to Dashboard → Settings → API Key
3. Copy your API Key and Username
4. Add credits for SMS (minimum $1)

#### Twilio (Optional Fallback)

1. Sign up at [https://www.twilio.com/](https://www.twilio.com/)
2. Go to Console → Account Info
3. Copy Account SID and Auth Token
4. Get a phone number from Console → Phone Numbers
5. Add credits for SMS

### Step 4: Update App.js

Wrap your app with the ZkLoginProvider:

```javascript
import { ZkLoginProvider } from './contexts/ZkLoginContext';

export default function App() {
  return (
    <ZkLoginProvider>
      {/* Your existing app structure */}
    </ZkLoginProvider>
  );
}
```

### Step 5: Add Routes

Add authentication routes to your navigation:

```javascript
import ZkLogin from './screens/auth/ZkLogin';
import ZkSignup from './screens/auth/ZkSignup';

// In your navigator
<Stack.Screen name="ZkLogin" component={ZkLogin} />
<Stack.Screen name="ZkSignup" component={ZkSignup} />
```

## Usage

### In Your Components

```typescript
import { useZkLogin } from '../contexts/ZkLoginContext';

function MyComponent() {
  const { user, logout } = useZkLogin();

  if (user) {
    return (
      <View>
        <Text>Logged in as: {user.phoneNumber}</Text>
        <Text>Sui Address: {user.suiAddress}</Text>
        <Button title="Logout" onPress={logout} />
      </View>
    );
  }

  return <Button title="Login" onPress={() => navigation.navigate('ZkLogin')} />;
}
```

### Protected Screens

```typescript
import { useZkLogin } from '../contexts/ZkLoginContext';
import { useEffect } from 'react';

function ProtectedScreen({ navigation }) {
  const { user, loading } = useZkLogin();

  useEffect(() => {
    if (!loading && !user) {
      navigation.replace('ZkLogin');
    }
  }, [user, loading]);

  if (loading) return <LoadingScreen />;
  if (!user) return null;

  return <YourProtectedContent />;
}
```

## Authentication Flow

### Login Flow

1. User enters phone number
2. System validates format (+254712345678)
3. OTP sent via Africa's Talking
4. If Africa's Talking fails, tries Twilio
5. User enters 6-digit code
6. System verifies code (max 3 attempts, 10 min expiry)
7. Session created with Sui address
8. User redirected to app

### Signup Flow

1. User enters name, country, phone number
2. System validates all fields
3. OTP sent (same as login)
4. User verifies OTP
5. Account created with user info
6. Session created
7. User redirected to app

## OTP Provider Logic

```
User requests OTP
       │
       ▼
Try Africa's Talking
       │
   ┌───┴───┐
   │       │
Success  Failure
   │       │
   │       ▼
   │  Try Twilio
   │       │
   │   ┌───┴───┐
   │   │       │
   │ Success Failure
   │   │       │
   └───┴───────┘
       │
       ▼
  OTP Sent
```

## Security Features

- ✅ E.164 phone number validation
- ✅ OTP expiration (10 minutes)
- ✅ Rate limiting (3 attempts per OTP)
- ✅ Automatic session cleanup
- ✅ Secure credential storage
- ✅ No OTP storage in AsyncStorage

## Testing

### Development Mode

For testing, you can use a bypass code:

```typescript
// In ZkLoginContext.tsx
const DEV_MODE = __DEV__;

if (DEV_MODE && code === '123456') {
  return { valid: true };
}
```

### Test Phone Numbers

Africa's Talking provides test numbers:
- Test number: `+254711082XXX`
- Always receives OTP successfully

## Troubleshooting

### OTP Not Sending

**Issue:** "OTP service unavailable"

**Solutions:**
1. Check API credentials in `.env.local`
2. Verify Africa's Talking account has credits
3. Check phone number format (+254712345678)
4. Review console logs for errors

### Invalid Phone Number

**Issue:** "Invalid phone number format"

**Solution:** Use E.164 format:
- ✅ Correct: `+254712345678`
- ❌ Wrong: `0712345678`, `254712345678`

### OTP Expired

**Issue:** "OTP has expired"

**Solution:** OTPs expire after 10 minutes. Request a new code.

### Too Many Attempts

**Issue:** "Too many failed attempts"

**Solution:** After 3 wrong attempts, request a new OTP.

### Provider Failures

**Issue:** Both providers failing

**Solutions:**
1. Check internet connection
2. Verify API credentials are correct
3. Check provider service status
4. Ensure phone number is valid

## Integration with Existing Auth

If you have existing authentication, you can:

1. **Migrate users**: Add phone numbers to existing accounts
2. **Dual auth**: Support both old and new methods
3. **Gradual rollout**: Enable zkLogin for new users first

Example migration:

```typescript
// Link existing user to zkLogin
const linkAccount = async (existingUserId, phoneNumber) => {
  const { user } = await verifyOTP(phoneNumber, otp);
  
  // Update existing user record
  await updateUser(existingUserId, {
    phoneNumber: user.phoneNumber,
    suiAddress: user.suiAddress
  });
};
```

## Production Checklist

- [ ] API credentials configured in production environment
- [ ] Both OTP providers have sufficient credits
- [ ] Phone number validation tested with various formats
- [ ] Session management tested (login/logout)
- [ ] Error handling verified for all failure scenarios
- [ ] Rate limiting tested
- [ ] Security review completed
- [ ] User data privacy compliance verified

## API Reference

### useZkLogin Hook

```typescript
const {
  user,              // Current user or null
  loading,           // Loading state
  sendOTP,           // (phoneNumber: string) => Promise<{success, error?}>
  verifyOTP,         // (phoneNumber: string, code: string) => Promise<{success, error?}>
  resendOTP,         // (phoneNumber: string) => Promise<{success, error?}>
  logout             // () => void
} = useZkLogin();
```

### User Object

```typescript
interface ZkLoginUser {
  id: string;           // Unique user ID
  phoneNumber: string;  // E.164 format
  suiAddress?: string;  // Sui blockchain address
  createdAt: string;    // ISO timestamp
}
```

## Support

For issues or questions:
- Check console logs for detailed error messages
- Review Africa's Talking docs: https://developers.africastalking.com/
- Review Twilio docs: https://www.twilio.com/docs/
- Contact: support@africarailways.com

## License

Same as Africa Railways project.
