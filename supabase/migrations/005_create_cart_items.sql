-- =====================================================
-- CART ITEMS
-- =====================================================

-- Cart items
CREATE TABLE IF NOT EXISTS cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES store_items(id) ON DELETE CASCADE,
  
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  
  -- Selected variants
  selected_size VARCHAR(50),
  selected_color VARCHAR(50),
  
  -- Personalizations
  personalizations JSONB DEFAULT '[]'::jsonb,
  customization_notes TEXT,
  
  -- Pricing snapshot
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, item_id, selected_size, selected_color)
);

-- RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cart"
  ON cart_items FOR ALL
  USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_store_id ON cart_items(store_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_item_id ON cart_items(item_id);

-- Trigger for updated_at
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for tracking
COMMENT ON TABLE cart_items IS 'Shopping cart items. Created 2025-01-28.';

