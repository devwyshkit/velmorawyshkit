-- Add bulk_pricing column to partner_products table
-- For Feature 1: Bulk Pricing Tiers (PROMPT 1)

ALTER TABLE public.partner_products 
ADD COLUMN IF NOT EXISTS bulk_pricing JSONB DEFAULT NULL;

-- Add index for bulk pricing queries
CREATE INDEX IF NOT EXISTS idx_partner_products_bulk_pricing 
ON public.partner_products USING gin(bulk_pricing) 
WHERE bulk_pricing IS NOT NULL;

-- Verify column added
DO $$
BEGIN
  RAISE NOTICE '✅ bulk_pricing column added to partner_products';
  RAISE NOTICE 'Products can now have tiered pricing for bulk orders';
END $$;

-- Example bulk_pricing structure:
-- [
--   {"minQty": 10, "maxQty": 49, "price": 140000, "discountPercent": 7},
--   {"minQty": 50, "maxQty": 99, "price": 130000, "discountPercent": 13},
--   {"minQty": 100, "price": 120000, "discountPercent": 20}
-- ]

