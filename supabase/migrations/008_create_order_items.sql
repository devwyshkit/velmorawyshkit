-- =====================================================
-- ORDER ITEMS
-- =====================================================

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES store_items(id),
  
  -- Product snapshot
  item_name VARCHAR(255) NOT NULL,
  item_image_url TEXT,
  
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  
  -- Variants
  selected_size VARCHAR(50),
  selected_color VARCHAR(50),
  
  -- Customization
  personalizations JSONB DEFAULT '[]'::jsonb,
  customization_notes TEXT,
  customization_files JSONB DEFAULT '[]'::jsonb,
  
  -- Design approval (for customizable items)
  design_status VARCHAR(20) CHECK (design_status IN ('pending', 'submitted', 'approved', 'rejected')),
  design_proof_url TEXT,
  design_approved_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view order items for their orders"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.customer_id = auth.uid() OR EXISTS (
        SELECT 1 FROM stores
        WHERE stores.id = orders.store_id
        AND stores.owner_id = auth.uid()
      ))
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_item_id ON order_items(item_id);

-- Add comment for tracking
COMMENT ON TABLE order_items IS 'Order line items. Created 2025-01-28.';

