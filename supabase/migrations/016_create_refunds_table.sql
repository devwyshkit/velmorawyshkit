-- =====================================================
-- REFUNDS
-- Track all refund transactions
-- =====================================================

CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links
  order_id UUID NOT NULL REFERENCES orders(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  return_id UUID REFERENCES returns(id), -- Optional: if refund is from return
  
  -- Amount
  amount INTEGER NOT NULL, -- in paise
  
  -- Status
  status VARCHAR(50) DEFAULT 'initiated' CHECK (status IN (
    'initiated', 'processing', 'completed', 'failed'
  )),
  
  -- Payment details
  payment_method VARCHAR(50) NOT NULL,
  transaction_id VARCHAR(255),
  original_payment_id VARCHAR(255), -- Reference to original payment
  
  -- Reason
  reason VARCHAR(50), -- cancelled, returned, quality_issue, etc.
  notes TEXT,
  
  -- Timestamps
  initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);
CREATE INDEX IF NOT EXISTS idx_refunds_initiated_at ON refunds(initiated_at DESC);

-- RLS
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own refunds"
  ON refunds FOR SELECT
  USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE refunds IS 'All refund transactions. Tracks initiation, processing, and completion.';

