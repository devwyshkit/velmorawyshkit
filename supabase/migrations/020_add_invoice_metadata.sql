-- Add Refrens invoice tracking to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refrens_invoice_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS refrens_invoice_url TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_generated_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_orders_refrens_invoice ON orders(refrens_invoice_id);

COMMENT ON COLUMN orders.refrens_invoice_id IS 'Refrens API invoice ID (_id from response)';
COMMENT ON COLUMN orders.refrens_invoice_url IS 'Public PDF link from Refrens (share.pdf)';
COMMENT ON COLUMN orders.invoice_generated_at IS 'Timestamp when invoice was generated via Refrens';

