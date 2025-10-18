-- Migration 007: Two-Step Shipping Architecture for Hampers
-- Supports: Vendor → Curator → Customer flow for sourced components

-- Drop existing status constraint and add new statuses for hamper sourcing
ALTER TABLE partner_orders
DROP CONSTRAINT IF EXISTS partner_orders_status_check;

ALTER TABLE partner_orders
ADD CONSTRAINT partner_orders_status_check
CHECK (status IN (
  'pending',               -- Initial order state
  'awaiting_sourcing',     -- Waiting for sourced components to arrive at curator
  'sourcing_in_transit',   -- Components being shipped to curator
  'ready_to_assemble',     -- All components arrived, ready to build hamper
  'assembling',            -- Curator is assembling the hamper
  'preparing',             -- Standard preparation (non-hamper orders)
  'ready',                 -- Ready for final shipping to customer
  'dispatched',            -- Shipped to customer
  'completed',             -- Delivered and confirmed
  'cancelled'              -- Cancelled by customer or partner
));

-- Add fields to support sourcing sub-orders
ALTER TABLE partner_orders
ADD COLUMN IF NOT EXISTS parent_order_id UUID REFERENCES partner_orders(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS is_sourcing_order BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS ship_to_partner_id UUID REFERENCES partner_profiles(id),  -- For sourcing: ship to curator
ADD COLUMN IF NOT EXISTS ship_to_address JSONB,  -- Address details for sourcing shipment
ADD COLUMN IF NOT EXISTS sourcing_eta DATE,  -- Estimated arrival at curator
ADD COLUMN IF NOT EXISTS components_status JSONB DEFAULT '[]'::jsonb;  -- Track individual component statuses

-- Add index for querying sourcing sub-orders
CREATE INDEX IF NOT EXISTS idx_partner_orders_parent 
ON partner_orders(parent_order_id)
WHERE parent_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_partner_orders_sourcing 
ON partner_orders(is_sourcing_order, status)
WHERE is_sourcing_order = true;

-- Create shipments tracking table for two-step shipping
CREATE TABLE IF NOT EXISTS order_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES partner_orders(id) ON DELETE CASCADE NOT NULL,
  shipment_type TEXT NOT NULL CHECK (shipment_type IN ('sourcing', 'final')),
  
  -- Shipping details
  from_partner_id UUID REFERENCES partner_profiles(id),  -- Vendor
  to_partner_id UUID REFERENCES partner_profiles(id),    -- For sourcing leg: curator
  to_customer_address JSONB,  -- For final leg: customer address
  
  -- Tracking information
  tracking_number TEXT,
  carrier TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed')),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  eta DATE,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for shipment queries
CREATE INDEX IF NOT EXISTS idx_order_shipments_order 
ON order_shipments(order_id);

CREATE INDEX IF NOT EXISTS idx_order_shipments_type_status 
ON order_shipments(shipment_type, status);

CREATE INDEX IF NOT EXISTS idx_order_shipments_from_partner 
ON order_shipments(from_partner_id);

CREATE INDEX IF NOT EXISTS idx_order_shipments_to_partner 
ON order_shipments(to_partner_id);

-- Enable RLS on order_shipments
ALTER TABLE order_shipments ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Partners can view shipments they're involved in
CREATE POLICY "Partners can view their shipments"
ON order_shipments FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND (
    from_partner_id IN (SELECT id FROM partner_profiles WHERE user_id = auth.uid())
    OR to_partner_id IN (SELECT id FROM partner_profiles WHERE user_id = auth.uid())
  )
);

-- RLS Policy: Partners can create and update their shipments
CREATE POLICY "Partners can manage their shipments"
ON order_shipments FOR ALL
USING (
  auth.uid() IS NOT NULL
  AND from_partner_id IN (SELECT id FROM partner_profiles WHERE user_id = auth.uid())
);

-- Add comments for documentation
COMMENT ON TABLE order_shipments IS 'Tracks two-step shipping: sourcing (vendor→curator) and final (curator→customer)';
COMMENT ON COLUMN partner_orders.parent_order_id IS 'For sourcing sub-orders: references the main hamper order';
COMMENT ON COLUMN partner_orders.is_sourcing_order IS 'True if this is a sourcing order (vendor→curator)';
COMMENT ON COLUMN partner_orders.ship_to_partner_id IS 'For sourcing: the curator partner receiving components';
COMMENT ON COLUMN partner_orders.components_status IS 'Array of component statuses for hamper assembly tracking';

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_order_shipments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER order_shipments_updated_at
BEFORE UPDATE ON order_shipments
FOR EACH ROW
EXECUTE FUNCTION update_order_shipments_updated_at();

