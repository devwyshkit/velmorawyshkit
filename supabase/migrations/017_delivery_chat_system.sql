-- =====================================================
-- DELIVERY PARTNERS & ORDER MESSAGES
-- =====================================================

-- Delivery Partners
CREATE TABLE IF NOT EXISTS delivery_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(15) NOT NULL,
  email VARCHAR(255),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_available BOOLEAN DEFAULT true,
  
  -- Stats
  rating DECIMAL(2, 1) DEFAULT 0.0,
  total_ratings INTEGER DEFAULT 0,
  total_deliveries INTEGER DEFAULT 0,
  
  -- Current location (for live tracking)
  current_latitude DECIMAL(10, 8),
  current_longitude DECIMAL(11, 8),
  last_location_update TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_delivery_partners_is_active ON delivery_partners(is_active);
CREATE INDEX IF NOT EXISTS idx_delivery_partners_is_available ON delivery_partners(is_available);

-- RLS
ALTER TABLE delivery_partners ENABLE ROW LEVEL SECURITY;

-- Order Messages (Chat with delivery partner)
CREATE TABLE IF NOT EXISTS order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Participants
  sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('user', 'delivery_partner', 'system')),
  sender_id UUID NOT NULL,
  
  -- Message
  message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'location')),
  message_content TEXT NOT NULL,
  metadata JSONB, -- {image_url, location_lat, location_lng}
  
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_messages_order_id ON order_messages(order_id);
CREATE INDEX IF NOT EXISTS idx_order_messages_created_at ON order_messages(created_at DESC);

-- RLS
ALTER TABLE order_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view order messages for their orders"
  ON order_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_messages.order_id
      AND orders.customer_id = auth.uid()
    ) OR sender_id = auth.uid()
  );

-- Add comments
COMMENT ON TABLE delivery_partners IS 'Delivery partners for order fulfillment';
COMMENT ON TABLE order_messages IS 'In-app chat between customers and delivery partners';

