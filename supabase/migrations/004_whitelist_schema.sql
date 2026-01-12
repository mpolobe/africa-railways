-- =====================================================
-- Whitelist Schema Migration
-- =====================================================
-- Purpose: Set up whitelist table for IDO participants
-- Created: 2026-01-12
-- =====================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- WHITELIST TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS whitelist (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_address TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  telegram_handle TEXT,
  twitter_handle TEXT,
  investment_amount TEXT NOT NULL,
  referral_code TEXT,
  terms_accepted BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on wallet_address for faster lookups
CREATE INDEX IF NOT EXISTS idx_whitelist_wallet ON whitelist(wallet_address);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_whitelist_email ON whitelist(email);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_whitelist_status ON whitelist(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_whitelist_created_at ON whitelist(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS
ALTER TABLE whitelist ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert (public whitelist registration)
CREATE POLICY "Anyone can register for whitelist"
  ON whitelist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Users can read their own entries
CREATE POLICY "Users can read own whitelist entry"
  ON whitelist
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text OR wallet_address = auth.jwt()->>'wallet_address');

-- Policy: Admins can read all entries
CREATE POLICY "Admins can read all whitelist entries"
  ON whitelist
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Policy: Admins can update entries (approve/reject)
CREATE POLICY "Admins can update whitelist entries"
  ON whitelist
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_whitelist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER whitelist_updated_at
  BEFORE UPDATE ON whitelist
  FOR EACH ROW
  EXECUTE FUNCTION update_whitelist_updated_at();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE whitelist IS 'Stores IDO whitelist registrations';
COMMENT ON COLUMN whitelist.wallet_address IS 'User wallet address (Sui or EVM compatible)';
COMMENT ON COLUMN whitelist.email IS 'User email for notifications';
COMMENT ON COLUMN whitelist.investment_amount IS 'Intended investment amount range';
COMMENT ON COLUMN whitelist.status IS 'Approval status: pending, approved, rejected';
