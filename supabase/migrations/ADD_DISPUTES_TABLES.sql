-- Dispute Resolution Tables
-- Feature 2: PROMPT 2 - Dispute Resolution
-- Create disputes and dispute_messages tables

-- Main disputes table
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL, -- Reference to orders table
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  issue TEXT NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'escalated')),
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  evidence_urls TEXT[], -- Cloudinary URLs for customer evidence
  response TEXT, -- Partner's response
  resolution_type VARCHAR(50) CHECK (resolution_type IN ('full_refund', 'partial_refund', 'replacement', 'rejected')),
  refund_amount BIGINT, -- in paise
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Dispute chat messages (real-time)
CREATE TABLE IF NOT EXISTS dispute_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispute_id UUID NOT NULL REFERENCES disputes(id) ON DELETE CASCADE,
  sender_type VARCHAR(50) NOT NULL CHECK (sender_type IN ('customer', 'partner', 'admin')),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  attachments TEXT[], -- Cloudinary URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_disputes_partner ON disputes(partner_id);
CREATE INDEX IF NOT EXISTS idx_disputes_customer ON disputes(customer_id);
CREATE INDEX IF NOT EXISTS idx_disputes_order ON disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_reported ON disputes(reported_at DESC);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute ON dispute_messages(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_created ON dispute_messages(created_at ASC);

-- Enable RLS
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Partners can view own disputes"
  ON disputes FOR SELECT
  USING (partner_id = auth.uid());

CREATE POLICY "Customers can view own disputes"
  ON disputes FOR SELECT
  USING (customer_id = auth.uid());

CREATE POLICY "Partners can update own disputes"
  ON disputes FOR UPDATE
  USING (partner_id = auth.uid());

CREATE POLICY "Partners can view own dispute messages"
  ON dispute_messages FOR SELECT
  USING (
    dispute_id IN (
      SELECT id FROM disputes WHERE partner_id = auth.uid()
    )
  );

CREATE POLICY "Partners can send dispute messages"
  ON dispute_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    dispute_id IN (
      SELECT id FROM disputes WHERE partner_id = auth.uid()
    )
  );

CREATE POLICY "Customers can view own dispute messages"
  ON dispute_messages FOR SELECT
  USING (
    dispute_id IN (
      SELECT id FROM disputes WHERE customer_id = auth.uid()
    )
  );

-- Auto-escalate disputes after 48 hours
-- This would be handled by a Supabase Edge Function cron job

COMMENT ON TABLE disputes IS 'Customer disputes and resolution tracking';
COMMENT ON TABLE dispute_messages IS 'Real-time chat messages for disputes';
