-- =====================================================
-- ORDER STATUS HISTORY
-- Track all order status changes for auditing
-- =====================================================

CREATE TABLE IF NOT EXISTS order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Status change
  from_status VARCHAR(50),
  to_status VARCHAR(50) NOT NULL,
  
  -- Context
  changed_by_type VARCHAR(50), -- 'user', 'vendor', 'system', 'admin', 'delivery_partner'
  changed_by_id UUID,
  
  -- Details
  notes TEXT,
  metadata JSONB,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_status ON order_status_history(to_status);
CREATE INDEX IF NOT EXISTS idx_order_status_history_created_at ON order_status_history(created_at DESC);

-- RLS
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view status history for their orders"
  ON order_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_status_history.order_id
      AND orders.customer_id = auth.uid()
    )
  );

CREATE POLICY "Vendors can view status history for their store orders"
  ON order_status_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN stores ON orders.store_id = stores.id
      WHERE orders.id = order_status_history.order_id
      AND stores.owner_id = auth.uid()
    )
  );

-- Trigger to automatically log status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO order_status_history (
      order_id,
      from_status,
      to_status,
      changed_by_type,
      changed_by_id,
      created_at
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      'system',
      NULL,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER log_order_status_change_trigger
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION log_order_status_change();

-- Add comment
COMMENT ON TABLE order_status_history IS 'Audit trail of all order status changes. Auto-populated by trigger.';

