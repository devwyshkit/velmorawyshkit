-- Add stock alert columns to partner_products table
-- For Feature 3: Stock Alerts (PROMPT 10)

ALTER TABLE public.partner_products 
ADD COLUMN IF NOT EXISTS stock_alert_threshold INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS sourcing_available BOOLEAN DEFAULT true;

-- Add index for stock alert queries
CREATE INDEX IF NOT EXISTS idx_partner_products_low_stock 
ON public.partner_products (stock) 
WHERE stock < stock_alert_threshold;

-- Verify columns added
DO $$
BEGIN
  RAISE NOTICE '✅ Stock alert columns added to partner_products';
  RAISE NOTICE '  - stock_alert_threshold (default: 50)';
  RAISE NOTICE '  - sourcing_available (default: true)';
  RAISE NOTICE '  - Index created for low stock queries';
END $$;

-- Update existing products to have default threshold
UPDATE public.partner_products 
SET stock_alert_threshold = 50 
WHERE stock_alert_threshold IS NULL;

UPDATE public.partner_products 
SET sourcing_available = true 
WHERE sourcing_available IS NULL;

