-- Migration: Add Zoho Books, Zoho Sign, and IDfy integration fields
-- Purpose: Enable commission invoicing, digital contracts, and automated KYC
-- Author: Wyshkit Platform
-- Date: 2025-10-20

-- ============================================
-- 1. PAYOUTS TABLE (Zoho Books Integration)
-- ============================================
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partner_profiles(id) ON DELETE CASCADE NOT NULL,
  month VARCHAR(7) NOT NULL, -- YYYY-MM format
  
  -- Revenue & Commission
  total_revenue BIGINT NOT NULL, -- in paise
  commission_percent DECIMAL(5,2) NOT NULL,
  commission_amount BIGINT NOT NULL, -- in paise
  
  -- Zoho Books Integration
  zoho_invoice_id TEXT,
  zoho_invoice_url TEXT,
  zoho_payment_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'invoiced', 'paid', 'failed')),
  paid_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(partner_id, month)
);

-- Index for partner payouts
CREATE INDEX IF NOT EXISTS idx_payouts_partner_month 
ON payouts(partner_id, month DESC);

-- Index for pending payouts
CREATE INDEX IF NOT EXISTS idx_payouts_status 
ON payouts(status, created_at DESC) 
WHERE status IN ('pending', 'invoiced');

COMMENT ON TABLE payouts IS 'Monthly commission payouts to partners with Zoho Books integration';
COMMENT ON COLUMN payouts.zoho_invoice_id IS 'Invoice ID from Zoho Books API';
COMMENT ON COLUMN payouts.zoho_invoice_url IS 'URL to view invoice in Zoho Books';

-- ============================================
-- 2. CONTRACT FIELDS (Zoho Sign Integration)
-- ============================================

ALTER TABLE partner_profiles
ADD COLUMN IF NOT EXISTS contract_signed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS contract_signed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS contract_document_url TEXT,
ADD COLUMN IF NOT EXISTS zoho_request_id TEXT,
ADD COLUMN IF NOT EXISTS contract_status TEXT DEFAULT 'pending' CHECK (contract_status IN ('pending', 'sent', 'signed', 'declined', 'expired'));

COMMENT ON COLUMN partner_profiles.contract_signed IS 'Whether partnership agreement is signed via Zoho Sign';
COMMENT ON COLUMN partner_profiles.zoho_request_id IS 'Zoho Sign request ID for tracking signature status';

-- ============================================
-- 3. KYC VERIFICATION FIELDS (IDfy Integration)
-- ============================================

ALTER TABLE partner_profiles
ADD COLUMN IF NOT EXISTS pan_verification_id TEXT,
ADD COLUMN IF NOT EXISTS gst_verification_id TEXT,
ADD COLUMN IF NOT EXISTS bank_verification_id TEXT,
ADD COLUMN IF NOT EXISTS fssai_verification_id TEXT,
ADD COLUMN IF NOT EXISTS idfy_total_cost INTEGER DEFAULT 0, -- in rupees
ADD COLUMN IF NOT EXISTS auto_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS verification_completed_at TIMESTAMPTZ;

COMMENT ON COLUMN partner_profiles.pan_verification_id IS 'IDfy verification ID for PAN card (₹10 per check)';
COMMENT ON COLUMN partner_profiles.gst_verification_id IS 'IDfy verification ID for GST number (₹15 per check)';
COMMENT ON COLUMN partner_profiles.bank_verification_id IS 'IDfy verification ID for bank account (₹10 per check)';
COMMENT ON COLUMN partner_profiles.fssai_verification_id IS 'IDfy verification ID for FSSAI license (₹15 per check, food vendors only)';
COMMENT ON COLUMN partner_profiles.idfy_total_cost IS 'Total cost spent on IDfy verifications';
COMMENT ON COLUMN partner_profiles.auto_verified IS 'Whether all KYC checks passed automatically via IDfy';

-- ============================================
-- 4. SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Zoho & IDfy integration fields added successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Added:';
  RAISE NOTICE '- payouts table for monthly commission tracking';
  RAISE NOTICE '- contract_* fields for Zoho Sign integration';
  RAISE NOTICE '- *_verification_id fields for IDfy KYC';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Integrate Zoho Books API for invoice generation';
  RAISE NOTICE '2. Integrate Zoho Sign API for digital contracts';
  RAISE NOTICE '3. Integrate IDfy API for automated KYC';
  RAISE NOTICE '4. Build Earnings page with invoice display';
  RAISE NOTICE '5. Enhance Onboarding with verification workflow';
END $$;

