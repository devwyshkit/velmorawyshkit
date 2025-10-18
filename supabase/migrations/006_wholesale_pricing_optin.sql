-- Migration 006: Wholesale Pricing & Partner Opt-In for Sourcing
-- Adds partner-controlled wholesale pricing and opt-in model for sourcing

-- Add sourcing-related columns to partner_products
ALTER TABLE partner_products
ADD COLUMN IF NOT EXISTS available_for_sourcing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS wholesale_price INTEGER,  -- in paise, partner-defined
ADD COLUMN IF NOT EXISTS sourcing_limit INTEGER DEFAULT NULL;  -- max units/month

-- Add comments for clarity
COMMENT ON COLUMN partner_products.available_for_sourcing IS 'Opt-in: Allow other partners to source this product for hampers';
COMMENT ON COLUMN partner_products.wholesale_price IS 'Partner-defined wholesale price (paise) for other partners';
COMMENT ON COLUMN partner_products.sourcing_limit IS 'Optional: Maximum units per month available for sourcing';

-- Add index for faster sourcing product searches
CREATE INDEX IF NOT EXISTS idx_partner_products_sourcing 
ON partner_products(available_for_sourcing, partner_id) 
WHERE available_for_sourcing = true;

-- Update RLS policy to allow partners to see sourcing-enabled products from other partners
CREATE POLICY "Partners can view sourcing-enabled products from others"
ON partner_products FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    partner_id IN (
      SELECT id FROM partner_profiles WHERE user_id = auth.uid()
    )
    OR available_for_sourcing = true
  )
);

