-- =====================================================
-- RETURNS
-- =====================================================

-- Returns
CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_number VARCHAR(50) UNIQUE NOT NULL,
  
  order_id UUID NOT NULL REFERENCES orders(id),
  customer_id UUID NOT NULL REFERENCES auth.users(id),
  store_id UUID NOT NULL REFERENCES stores(id),
  
  reason VARCHAR(100) NOT NULL,
  description TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'approved', 'rejected', 'picked_up', 'refunded'
  )),
  
  refund_amount DECIMAL(10, 2),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- RLS
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can manage own returns"
  ON returns FOR ALL
  USING (auth.uid() = customer_id);

CREATE POLICY "Store owners can view store returns"
  ON returns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stores
      WHERE stores.id = returns.store_id
      AND stores.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all returns"
  ON returns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_returns_order_id ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_customer_id ON returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_returns_store_id ON returns(store_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);

-- Trigger for updated_at
CREATE TRIGGER update_returns_updated_at
  BEFORE UPDATE ON returns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment for tracking
COMMENT ON TABLE returns IS 'Return/refund requests. Created 2025-01-28.';

