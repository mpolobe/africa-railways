# Supabase Whitelist Setup Guide

## Overview
This guide explains how to set up the Supabase database for the IDO whitelist functionality.

## Prerequisites
- Supabase account ([sign up here](https://supabase.com))
- Project created in Supabase

## Step 1: Run the Migration

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `supabase/migrations/004_whitelist_schema.sql`
4. Paste and run the SQL script

This will create:
- `whitelist` table with all necessary columns
- Indexes for performance
- Row Level Security (RLS) policies
- Triggers for automatic timestamp updates

## Step 2: Get Your Supabase Credentials

1. Go to **Project Settings** → **API**
2. Copy the following values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJ...`)
   - **service_role key** (for admin operations)

## Step 3: Configure the Whitelist Page

1. Open `whitelist.html`
2. Find the Supabase initialization section (around line 340)
3. Replace the placeholder values:

```javascript
const SUPABASE_URL = 'https://your-project.supabase.co'; // Replace with your URL
const SUPABASE_ANON_KEY = 'your-anon-key'; // Replace with your anon key
```

**For production**, use environment variables or a config file instead of hardcoding.

## Step 4: Test the Integration

1. Open [https://www.africarailways.com/whitelist](https://www.africarailways.com/whitelist)
2. Connect your MetaMask wallet
3. Fill out the form
4. Submit

## Step 5: Verify Data in Supabase

1. Go to **Table Editor** in Supabase
2. Select the `whitelist` table
3. You should see your test entry

## Database Schema

### Whitelist Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key (auto-generated) |
| `wallet_address` | TEXT | User's wallet address (unique) |
| `email` | TEXT | User's email |
| `telegram_handle` | TEXT | Optional Telegram handle |
| `twitter_handle` | TEXT | Optional Twitter handle |
| `investment_amount` | TEXT | Investment range selection |
| `referral_code` | TEXT | Optional referral code |
| `terms_accepted` | BOOLEAN | Terms acceptance flag |
| `status` | TEXT | pending/approved/rejected |
| `created_at` | TIMESTAMP | Registration timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

## Security Features

### Row Level Security (RLS)

The table has RLS enabled with the following policies:

1. **Public Registration**: Anyone can insert new entries
2. **User Read**: Users can read their own entries
3. **Admin Read**: Admins can read all entries
4. **Admin Update**: Admins can approve/reject entries

### Duplicate Prevention

The `wallet_address` column has a UNIQUE constraint to prevent duplicate registrations.

## Admin Operations

To view and manage whitelist entries, admins can:

1. Use the Supabase dashboard Table Editor
2. Create an admin panel (future enhancement)
3. Use the Supabase API with service role key

### Example: Approve a Whitelist Entry

```javascript
const { data, error } = await supabase
  .from('whitelist')
  .update({ status: 'approved' })
  .eq('wallet_address', '0x...');
```

## Environment Variables

Add these to your `.env` file:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Troubleshooting

### Error: "Failed to submit registration"
- Check browser console for detailed error
- Verify Supabase URL and anon key are correct
- Ensure RLS policies are properly configured

### Error: "This wallet address is already registered"
- The wallet address is already in the database
- This is expected behavior to prevent duplicates

### Error: "Missing Supabase configuration"
- Ensure you've replaced the placeholder values in `whitelist.html`
- Check that the Supabase SDK is loaded (check browser console)

## Next Steps

1. **Email Notifications**: Set up Supabase Edge Functions to send confirmation emails
2. **Admin Dashboard**: Create an admin interface to manage whitelist entries
3. **Analytics**: Track registration metrics and conversion rates
4. **Export**: Add functionality to export whitelist data for IDO platform

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review the migration file: `supabase/migrations/004_whitelist_schema.sql`
- Contact the development team
