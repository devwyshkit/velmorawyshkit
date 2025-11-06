-- =====================================================
-- PAYMENT TRANSACTIONS
-- Track all payment attempts and transactions
-- =====================================================

CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Payment details
  gateway VARCHAR(50) NOT NULL DEFAULT 'razorpay',
  gateway_transaction_id VARCHAR(200) NOT NULL,
  gateway_order_id VARCHAR(200),
  
  -- Amount
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  
  -- Payment method
  payment_method VARCHAR(50), -- 'card', 'upi', 'netbanking', 'wallet', etc.
  payment_method_details JSONB, -- Card last 4, UPI ID, etc.
  
  -- Status
  status VARCHAR(30) NOT NULL CHECK (status IN (
    'pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded'
  )),
  
  -- Timestamps
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  authorized_at TIMESTAMP WITH TIME ZONE,
  captured_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  failure_reason TEXT,
  gateway_response JSONB,
  metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Refunds
CREATE TABLE IF NOT EXISTS payment_refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- References
  transaction_id UUID NOT NULL REFERENCES payment_transactions(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  
  -- Refund details
  gateway_refund_id VARCHAR(200) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  
  -- Status
  status VARCHAR(30) NOT NULL CHECK (status IN ('pending', 'processed', 'failed')),
  
  -- Reason
  reason TEXT NOT NULL,
  
  -- Timestamps
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  failure_reason TEXT,
  gateway_response JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_gateway_id ON payment_transactions(gateway_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_transaction ON payment_refunds(transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_refunds_order ON payment_refunds(order_id);

-- RLS
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment transactions"
  ON payment_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payment_transactions.order_id
      AND orders.customer_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own refunds"
  ON payment_refunds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payment_refunds.order_id
      AND orders.customer_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all transactions"
  ON payment_transactions FOR SELECT
  USING (is_admin_user(auth.uid()));

CREATE POLICY "Admins can view all refunds"
  ON payment_refunds FOR SELECT
  USING (is_admin_user(auth.uid()));

-- Triggers
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_refunds_updated_at
  BEFORE UPDATE ON payment_refunds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE payment_transactions IS 'All payment attempts and transactions from payment gateways';
COMMENT ON TABLE payment_refunds IS 'Payment refund tracking';

