-- =====================================================
-- ADD INVOICE FIELDS TO ORDERS
-- Invoice and estimate fields for business orders
-- =====================================================

-- Add invoice fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_business_order BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gstin_verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS estimate_url TEXT;

-- Add design files to order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS design_files JSONB DEFAULT '[]'::jsonb;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_orders_business ON orders(is_business_order);
CREATE INDEX IF NOT EXISTS idx_orders_invoice_number ON orders(invoice_number);

-- Comments
COMMENT ON COLUMN orders.is_business_order IS 'Whether this is a business order (has GSTIN)';
COMMENT ON COLUMN orders.gstin_verified_at IS 'Timestamp when GSTIN was verified via IDfy';
COMMENT ON COLUMN orders.invoice_number IS 'Invoice number from Refrens';
COMMENT ON COLUMN orders.invoice_url IS 'PDF URL from Refrens for invoice';
COMMENT ON COLUMN orders.estimate_url IS 'PDF URL from Refrens for estimate';
COMMENT ON COLUMN order_items.design_files IS 'Array of Supabase Storage URLs for uploaded design files';

