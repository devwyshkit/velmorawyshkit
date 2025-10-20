-- Migration: Add Returns & Refunds Tables
-- Feature: PROMPT 3 - Returns & Refunds
-- Description: 7-day return policy with pickup scheduling and QC

-- Returns Table
CREATE TABLE IF NOT EXISTS returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  partner_id UUID NOT NULL,
  reason VARCHAR(50) NOT NULL, -- wrong_item, damaged, not_as_described, changed_mind, other
  status VARCHAR(30) DEFAULT 'pending', -- pending, approved, rejected, pickup_scheduled, item_received, qc_done, refunded
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  pickup_scheduled_at TIMESTAMP WITH TIME ZONE,
  qc_status VARCHAR(20), -- good, damaged, mismatch
  refund_amount INTEGER, -- in paise
  refund_status VARCHAR(20), -- pending, processing, completed
  photos TEXT[], -- Customer evidence
  qc_photos TEXT[], -- Partner QC photos
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Return Events Table (timeline tracking)
CREATE TABLE IF NOT EXISTS return_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  return_id UUID NOT NULL REFERENCES returns(id) ON DELETE CASCADE,
  event_type VARCHAR(30) NOT NULL, -- requested, approved, rejected, pickup_scheduled, item_received, qc_done, refunded
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_returns_partner ON returns(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_returns_customer ON returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_returns_order ON returns(order_id);
CREATE INDEX IF NOT EXISTS idx_return_events_return ON return_events(return_id, created_at DESC);

-- Comments
COMMENT ON TABLE returns IS 'Customer return requests with 7-day policy';
COMMENT ON TABLE return_events IS 'Timeline of return workflow events';
COMMENT ON COLUMN returns.status IS 'Workflow: pending → approved → pickup_scheduled → item_received → qc_done → refunded';

