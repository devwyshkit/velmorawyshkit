-- Add missing fields to orders table to support Checkout.tsx
ALTER TABLE orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS campaign_discount DECIMAL(10, 2);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_instructions TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_time_slot VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS contactless_delivery BOOLEAN DEFAULT false;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gstin VARCHAR(15);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_id VARCHAR(100);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled_date DATE;

-- Make store_id and customer_id nullable for guest checkout
ALTER TABLE orders ALTER COLUMN store_id DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN customer_id DROP NOT NULL;
ALTER TABLE orders ALTER COLUMN delivery_address DROP NOT NULL;

COMMENT ON COLUMN orders.items IS 'Legacy JSONB items array for backward compatibility';
COMMENT ON COLUMN orders.gstin IS 'GSTIN for business orders (optional)';
COMMENT ON COLUMN orders.campaign_discount IS 'Campaign discount amount';
COMMENT ON COLUMN orders.contactless_delivery IS 'Contactless delivery preference';

