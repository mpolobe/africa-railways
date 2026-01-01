# 🔒 OCC Security Implementation Guide

## Overview

Secure the Operation Control Centre (OCC) portal at www.africarailways.com using Alchemy Account Kit with phone-based OTP authentication.

## Architecture: Two-Gate Authentication

### Gate 1: Identity Verification (OTP)
- User proves identity via SMS OTP
- Handled by existing `otpService.ts` (Africa's Talking + Twilio)
- Validates staff phone number

### Gate 2: Blockchain Wallet (Alchemy)
- Upon successful OTP, Alchemy creates Smart Contract Account (SCA)
- Phone number maps to persistent blockchain wallet
- All OCC actions cryptographically signed

## Benefits for Railway Operations

### 1. Gas Sponsorship
- Alchemy Gas Manager pays for staff transactions
- Staff never need crypto or gas tokens
- Seamless UX for train management

### 2. Immutable Audit Logs
- Every OCC action signed by staff's private key
- Permanent, unalterable record of commands
- Full accountability for train operations

### 3. Role-Based Access Control (RBAC)
- Supabase RLS enforces permissions
- Station Master in Lusaka cannot control trains in Kapiri-Mposhi
- Fine-grained access control

## Implementation Components

### 1. AlchemyAuthContext
- Replaces ZkLoginContext with Alchemy integration
- Manages authentication state
- Handles OTP → Wallet mapping

### 2. RequireOCCAuth Guard
- Protects sensitive OCC routes
- Redirects unauthenticated users
- Preserves intended destination

### 3. Staff Login Flow
- Enter phone number
- Receive OTP via SMS
- Verify OTP
- Alchemy creates/retrieves SCA
- Access granted to OCC

### 4. Master Admin Account
- Email: admin@africarailways.com
- Automated password email via Resend/SendGrid
- Full system access and staff management

## Security Features

### Phone-Based Identity
- Phone number as cryptographic identity
- No passwords to remember or leak
- SMS OTP for verification

### Smart Contract Accounts
- Each staff member has unique SCA
- Private keys secured by Alchemy
- Hardware-level security

### Row-Level Security
- Supabase RLS enforces data access
- Staff can only access authorized data
- Real-time permission checks

### Vertex AI Monitoring
- Monitors login patterns
- Detects unusual locations
- Triggers re-verification if needed

## Database Schema

```sql
-- Profiles table with roles and status
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  phone_number TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'staff' CHECK (role IN ('admin', 'station_master', 'operator', 'staff')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended')),
  sui_address TEXT,
  alchemy_account TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Set master admin
INSERT INTO profiles (email, phone_number, role, status)
VALUES ('admin@africarailways.com', '+260XXXXXXXXX', 'admin', 'approved')
ON CONFLICT (email) DO UPDATE SET role = 'admin', status = 'approved';

-- RLS policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Staff can only see their own profile
CREATE POLICY "Staff can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Admins can see all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Train operations table with location-based access
CREATE TABLE IF NOT EXISTS train_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  train_id TEXT NOT NULL,
  station_code TEXT NOT NULL,
  operator_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  signature TEXT NOT NULL
);

ALTER TABLE train_operations ENABLE ROW LEVEL SECURITY;

-- Station masters can only manage trains at their station
CREATE POLICY "Station-based access"
  ON train_operations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      JOIN staff_stations ss ON p.id = ss.staff_id
      WHERE p.id = auth.uid()
      AND ss.station_code = train_operations.station_code
    )
  );
```

## Environment Variables

### OCC Portal (.env.production)
```bash
# Alchemy Account Kit
VITE_ALCHEMY_API_KEY=your_alchemy_api_key
VITE_ALCHEMY_GAS_MANAGER_POLICY_ID=your_gas_policy_id
VITE_ALCHEMY_CHAIN=polygon-amoy  # or polygon-mainnet

# OTP Providers (existing)
VITE_AFRICAS_TALKING_API_KEY=your_at_key
VITE_AFRICAS_TALKING_USERNAME=your_at_username
VITE_TWILIO_ACCOUNT_SID=your_twilio_sid
VITE_TWILIO_AUTH_TOKEN=your_twilio_token
VITE_TWILIO_PHONE_NUMBER=your_twilio_number

# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key

# Email Provider (for admin notifications)
RESEND_API_KEY=your_resend_key
SENDGRID_API_KEY=your_sendgrid_key

# OCC Security
OCC_RESTRICTED_ACCESS=true
STAFF_WHITELIST_ONLY=true
REQUIRE_LOCATION_VERIFICATION=true
```

## File Structure

```
africa-railways/
├── apps/
│   └── occ-portal/                    # New OCC web app
│       ├── src/
│       │   ├── contexts/
│       │   │   └── AlchemyAuthContext.tsx
│       │   ├── components/
│       │   │   ├── auth/
│       │   │   │   ├── RequireOCCAuth.tsx
│       │   │   │   ├── StaffLogin.tsx
│       │   │   │   └── OTPVerification.tsx
│       │   │   └── occ/
│       │   │       ├── TrainControl.tsx
│       │   │       ├── StationMonitor.tsx
│       │   │       └── AuditLog.tsx
│       │   ├── lib/
│       │   │   ├── otpService.ts      # Copied from SmartphoneApp
│       │   │   ├── alchemyClient.ts
│       │   │   └── supabaseClient.ts
│       │   └── pages/
│       │       ├── Login.tsx
│       │       ├── Dashboard.tsx
│       │       └── Admin.tsx
│       ├── .env.example
│       └── package.json
├── scripts/
│   ├── secure_occ_env.sh
│   └── setup_master_admin.sh
└── supabase/
    └── migrations/
        └── 001_occ_security.sql
```

## Implementation Steps

### Step 1: Install Dependencies
```bash
cd apps/occ-portal
npm install @account-kit/react @account-kit/core @supabase/supabase-js
```

### Step 2: Configure Alchemy
1. Go to: https://dashboard.alchemy.com/
2. Create new app: "Africa Railways OCC"
3. Enable Account Kit
4. Configure Gas Manager policy
5. Copy API key and Policy ID

### Step 3: Set Up Supabase
1. Run database migrations
2. Configure RLS policies
3. Set up master admin account
4. Create staff whitelist

### Step 4: Deploy OCC Portal
1. Build production bundle
2. Deploy to www.africarailways.com/occ
3. Configure environment variables
4. Test authentication flow

## Security Hardening Script

See: `scripts/secure_occ_env.sh`

## Testing Checklist

- [ ] OTP sends successfully via Africa's Talking
- [ ] OTP fallback to Twilio works
- [ ] OTP verification succeeds
- [ ] Alchemy creates SCA on first login
- [ ] Alchemy retrieves existing SCA on subsequent logins
- [ ] RequireOCCAuth blocks unauthenticated access
- [ ] RLS policies enforce station-based access
- [ ] Gas Manager sponsors transactions
- [ ] Audit logs record all actions
- [ ] Master admin can manage staff
- [ ] Location verification triggers when needed

## Monitoring

### Alchemy Dashboard
- Monitor SCA creation
- Track gas sponsorship usage
- View transaction history

### Supabase Dashboard
- Monitor authentication events
- Check RLS policy effectiveness
- Review audit logs

### Vertex AI
- Analyze login patterns
- Detect anomalies
- Trigger security alerts

## Next Steps

1. ✅ Review existing OTP implementation
2. ✅ Check OCC portal structure
3. ⏳ Implement AlchemyAuthContext
4. ⏳ Create RequireOCCAuth guard
5. ⏳ Set up Supabase schema
6. ⏳ Configure Alchemy Gas Manager
7. ⏳ Deploy and test

## Support

- **Alchemy Docs**: https://docs.alchemy.com/docs/account-kit-overview
- **Supabase Auth**: https://supabase.com/docs/guides/auth
- **OTP Service**: See `SmartphoneApp/lib/otpService.ts`

---

**Status**: Implementation Ready
**Priority**: High - Critical Infrastructure
**Owner**: OCC Security Team
