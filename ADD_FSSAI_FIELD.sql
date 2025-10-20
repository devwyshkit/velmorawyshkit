-- Migration: Add FSSAI Certificate Field to partner_profiles
-- Feature: Conditional FSSAI for Food & Beverage partners
-- Description: Adds FSSAI certificate storage for food-related businesses

-- Add FSSAI fields to partner_profiles table (or partners table depending on schema)
-- Note: Adjust table name based on your actual schema
DO $$ 
BEGIN
  -- Try adding to partner_profiles first
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_profiles') THEN
    ALTER TABLE partner_profiles
    ADD COLUMN IF NOT EXISTS fssai_number VARCHAR(14),
    ADD COLUMN IF NOT EXISTS fssai_document_url TEXT,
    ADD COLUMN IF NOT EXISTS fssai_verified BOOLEAN DEFAULT FALSE;
    
    COMMENT ON COLUMN partner_profiles.fssai_number IS 'FSSAI License Number (14 digits, required for food category)';
    COMMENT ON COLUMN partner_profiles.fssai_document_url IS 'Cloudinary URL of uploaded FSSAI certificate';
    COMMENT ON COLUMN partner_profiles.fssai_verified IS 'Whether FSSAI certificate has been verified by admin';
  END IF;
  
  -- Fallback: Try adding to partners table if partner_profiles doesn't exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partners') THEN
    ALTER TABLE partners
    ADD COLUMN IF NOT EXISTS fssai_number VARCHAR(14),
    ADD COLUMN IF NOT EXISTS fssai_document_url TEXT,
    ADD COLUMN IF NOT EXISTS fssai_verified BOOLEAN DEFAULT FALSE;
    
    COMMENT ON COLUMN partners.fssai_number IS 'FSSAI License Number (14 digits, required for food category)';
    COMMENT ON COLUMN partners.fssai_document_url IS 'Cloudinary URL of uploaded FSSAI certificate';
    COMMENT ON COLUMN partners.fssai_verified IS 'Whether FSSAI certificate has been verified by admin';
  END IF;
END $$;

-- Validation constraint (14 digits only)
-- Note: This is a check constraint, adjust table name as needed
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_profiles') THEN
    ALTER TABLE partner_profiles
    ADD CONSTRAINT IF NOT EXISTS chk_fssai_format 
    CHECK (fssai_number IS NULL OR fssai_number ~ '^[0-9]{14}$');
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partners') THEN
    ALTER TABLE partners
    ADD CONSTRAINT IF NOT EXISTS chk_fssai_format 
    CHECK (fssai_number IS NULL OR fssai_number ~ '^[0-9]{14}$');
  END IF;
END $$;

-- Note: FSSAI is conditionally required based on category
-- Validation logic is in frontend: Step2KYC.tsx (lines 48, 170-210)
-- Categories requiring FSSAI: ['food', 'perishables', 'beverages', 'Food & Beverages']

