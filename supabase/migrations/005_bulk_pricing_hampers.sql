-- Migration 005: Add Bulk Pricing Support to Partner Products
-- Enables tiered pricing for B2B/corporate gifting (Swiggy/Zomato pattern)

-- Add bulk pricing columns
ALTER TABLE partner_products
ADD COLUMN IF NOT EXISTS bulk_pricing_tiers JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS min_order_qty INTEGER DEFAULT 1 CHECK (min_order_qty > 0);

-- Example bulk_pricing_tiers structure:
-- [
--   {"min_qty": 1, "max_qty": 49, "price_per_unit": 149900},
--   {"min_qty": 50, "max_qty": 99, "price_per_unit": 139900},
--   {"min_qty": 100, "max_qty": null, "price_per_unit": 129900}
-- ]

-- Add comments for documentation
COMMENT ON COLUMN partner_products.bulk_pricing_tiers IS 'Tiered pricing array: [{min_qty, max_qty, price_per_unit in paise}]. Used for bulk/corporate orders.';
COMMENT ON COLUMN partner_products.min_order_qty IS 'Minimum order quantity required. Default 1 for retail, higher for bulk-only items.';

-- Create index for products with bulk pricing
CREATE INDEX IF NOT EXISTS idx_partner_products_bulk_pricing 
ON partner_products((bulk_pricing_tiers::text)) 
WHERE bulk_pricing_tiers != '[]'::jsonb;

-- Update trigger to maintain updated_at
CREATE OR REPLACE FUNCTION update_partner_products_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_partner_products_timestamp ON partner_products;
CREATE TRIGGER update_partner_products_timestamp
  BEFORE UPDATE ON partner_products
  FOR EACH ROW
  EXECUTE FUNCTION update_partner_products_timestamp();

