-- =====================================================
-- DELIVERY SLOTS
-- Time slot availability for orders
-- =====================================================

CREATE TABLE IF NOT EXISTS delivery_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Store reference (NULL = platform-wide)
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  
  -- Slot details
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  
  -- Availability
  max_orders INTEGER NOT NULL DEFAULT 10,
  current_bookings INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT true,
  
  -- Delivery type
  delivery_type VARCHAR(30) DEFAULT 'home' CHECK (delivery_type IN ('home', 'pickup', 'express')),
  
  -- Cost
  delivery_fee DECIMAL(10, 2) DEFAULT 0,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Booking reference
-- Note: Order already has delivery_slot field, this is supplementary info

-- Indexes
CREATE INDEX IF NOT EXISTS idx_delivery_slots_store ON delivery_slots(store_id);
CREATE INDEX IF NOT EXISTS idx_delivery_slots_date ON delivery_slots(date);
CREATE INDEX IF NOT EXISTS idx_delivery_slots_available ON delivery_slots(is_available, date);

-- RLS
ALTER TABLE delivery_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available slots"
  ON delivery_slots FOR SELECT
  USING (is_available = true AND date >= CURRENT_DATE);

CREATE POLICY "Admins can manage slots"
  ON delivery_slots FOR ALL
  USING (is_admin_user(auth.uid()));

CREATE POLICY "Vendors can manage own slots"
  ON delivery_slots FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = delivery_slots.store_id
      AND stores.owner_id = auth.uid()
    )
    OR delivery_slots.store_id IS NULL
  );

-- Trigger
CREATE TRIGGER update_delivery_slots_updated_at
  BEFORE UPDATE ON delivery_slots
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comment
COMMENT ON TABLE delivery_slots IS 'Available delivery time slots for orders';

