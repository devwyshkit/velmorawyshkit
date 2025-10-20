-- Migration: Add Referral Program Tables
-- Feature: PROMPT 7 - Referral Program
-- Description: Partner-to-partner referral system with ₹500 rewards

-- Partner Referrals Table
CREATE TABLE IF NOT EXISTS partner_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL, -- Partner who referred
  referee_id UUID NOT NULL, -- New partner who signed up
  code VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, complete, rejected
  orders_completed INTEGER DEFAULT 0,
  reward_amount INTEGER DEFAULT 50000, -- ₹500 in paise
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(referee_id) -- One referral per referee
);

-- Referral Codes Table
CREATE TABLE IF NOT EXISTS referral_codes (
  code VARCHAR(50) PRIMARY KEY,
  partner_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uses_count INTEGER DEFAULT 0,
  max_uses INTEGER -- NULL = unlimited
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_referrals_referrer ON partner_referrals(referrer_id, status);
CREATE INDEX IF NOT EXISTS idx_partner_referrals_referee ON partner_referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referral_codes_partner ON referral_codes(partner_id);

-- Comments
COMMENT ON TABLE partner_referrals IS 'Tracks partner referrals and rewards';
COMMENT ON TABLE referral_codes IS 'Unique referral codes per partner';
COMMENT ON COLUMN partner_referrals.status IS 'pending: 0-4 orders, in_progress: KYC done, complete: 5+ orders';

