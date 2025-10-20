-- Referral Program Tables
-- Feature 7: PROMPT 7 - Referral Program
-- Create partner_referrals and referral_codes tables

-- Referral codes (one per partner)
CREATE TABLE IF NOT EXISTS referral_codes (
  code VARCHAR(50) PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uses_count INTEGER DEFAULT 0,
  max_uses INTEGER, -- Optional limit
  UNIQUE(partner_id) -- One code per partner
);

-- Referral tracking
CREATE TABLE IF NOT EXISTS partner_referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Partner who referred
  referee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- New partner who signed up
  referee_email VARCHAR(255), -- Email before signup complete
  code VARCHAR(50) NOT NULL REFERENCES referral_codes(code),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'complete', 'rejected')),
  orders_completed INTEGER DEFAULT 0,
  reward_amount INTEGER DEFAULT 500, -- ₹500 for both
  completed_at TIMESTAMP WITH TIME ZONE,
  signup_ip VARCHAR(45), -- For fraud detection
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referral_codes_partner ON referral_codes(partner_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON partner_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON partner_referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON partner_referrals(code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON partner_referrals(status);

-- Enable RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Partners can view own referral code"
  ON referral_codes FOR SELECT
  USING (partner_id = auth.uid());

CREATE POLICY "Anyone can view codes for signup"
  ON referral_codes FOR SELECT
  USING (true);

CREATE POLICY "Partners can create own code"
  ON referral_codes FOR INSERT
  WITH CHECK (partner_id = auth.uid());

CREATE POLICY "Partners can view own referrals"
  ON partner_referrals FOR SELECT
  USING (referrer_id = auth.uid());

CREATE POLICY "Referees can view own referral record"
  ON partner_referrals FOR SELECT
  USING (referee_id = auth.uid());

CREATE POLICY "System can create referrals"
  ON partner_referrals FOR INSERT
  WITH CHECK (true); -- Created during signup

CREATE POLICY "System can update referrals"
  ON partner_referrals FOR UPDATE
  USING (true); -- Updated by cron job

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code(partner_name TEXT)
RETURNS TEXT AS $$
DECLARE
  code_prefix TEXT;
  year_suffix TEXT;
  final_code TEXT;
BEGIN
  -- Extract first 4 letters of partner name, uppercase
  code_prefix := upper(regexp_replace(partner_name, '[^a-zA-Z]', '', 'g'));
  code_prefix := substring(code_prefix, 1, 4);
  
  -- Add year
  year_suffix := extract(year from now())::TEXT;
  
  -- Combine: GIFT-ABCD-2025
  final_code := 'GIFT-' || code_prefix || '-' || year_suffix;
  
  RETURN final_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE referral_codes IS 'Partner referral codes for signup tracking';
COMMENT ON TABLE partner_referrals IS 'Referral tracking with reward automation';
