-- Returns & Refunds Tables
-- Feature 3: PROMPT 3 - Returns & Refunds
-- Create returns and return_events tables

-- Main returns table
CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL, -- Reference to orders table
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('wrong_item', 'damaged', 'not_as_described', 'changed_mind', 'other')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'pickup_scheduled', 'item_received', 'qc_done', 'refunded')),
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  pickup_scheduled_at TIMESTAMP WITH TIME ZONE,
  pickup_time_slot VARCHAR(50), -- 'morning', 'afternoon', 'evening'
  qc_status VARCHAR(50) CHECK (qc_status IN ('good', 'damaged', 'mismatch')),
  qc_notes TEXT,
  refund_amount BIGINT, -- in paise
  refund_status VARCHAR(50) CHECK (refund_status IN ('pending', 'processing', 'completed')),
  photos TEXT[], -- Customer evidence
  qc_photos TEXT[], -- Partner QC photos
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Return events timeline
CREATE TABLE IF NOT EXISTS return_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('requested', 'approved', 'rejected', 'pickup_scheduled', 'item_received', 'qc_done', 'refunded')),
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_returns_partner ON returns(partner_id);
CREATE INDEX IF NOT EXISTS idx_returns_customer ON returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_returns_order ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_returns_status ON returns(status);
CREATE INDEX IF NOT EXISTS idx_returns_requested ON returns(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_return_events_return ON return_events(return_id);
CREATE INDEX IF NOT EXISTS idx_return_events_created ON return_events(created_at ASC);

-- Enable RLS
ALTER TABLE returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE return_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Partners can view own returns"
  ON returns FOR SELECT
  USING (partner_id = auth.uid());

CREATE POLICY "Customers can view own returns"
  ON returns FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Partners can update own returns"
  ON returns FOR UPDATE
  USING (partner_id = auth.uid());

CREATE POLICY "Customers can request returns"
  ON returns FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Partners can view return events"
  ON return_events FOR SELECT
  USING (
    return_id IN (
      SELECT id FROM returns WHERE partner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone involved can create events"
  ON return_events FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Auto-reject returns after 7 days
-- This would be handled by a Supabase Edge Function cron job

COMMENT ON TABLE returns IS 'Customer return requests with pickup and QC workflow';
COMMENT ON TABLE return_events IS 'Timeline of return status changes';
