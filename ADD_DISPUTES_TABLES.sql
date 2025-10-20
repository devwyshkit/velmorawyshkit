-- Migration: Add Dispute Resolution Tables
-- Feature: PROMPT 2 - Dispute Resolution
-- Description: Customer complaint handling with 48-hour resolution

-- Disputes Table
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  partner_id UUID NOT NULL,
  issue TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'open', -- open, resolved, escalated
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  evidence_urls TEXT[], -- Customer evidence (Cloudinary URLs)
  response TEXT, -- Partner response
  resolution_type VARCHAR(30), -- full_refund, partial_refund, replacement, rejected
  refund_amount INTEGER, -- in paise
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dispute Messages Table (for real-time chat)
CREATE TABLE IF NOT EXISTS dispute_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL, -- customer, partner, admin
  message TEXT NOT NULL,
  attachments TEXT[], -- Cloudinary URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_disputes_partner ON disputes(partner_id, status);
CREATE INDEX IF NOT EXISTS idx_disputes_customer ON disputes(customer_id);
CREATE INDEX IF NOT EXISTS idx_disputes_order ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute ON dispute_messages(dispute_id, created_at DESC);

-- Comments
COMMENT ON TABLE disputes IS 'Customer complaints and partner resolutions';
COMMENT ON TABLE dispute_messages IS 'Real-time chat thread for disputes';
COMMENT ON COLUMN disputes.status IS 'open: needs resolution, resolved: closed, escalated: admin review';

