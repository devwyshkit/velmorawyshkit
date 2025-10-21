-- Campaign Management Tables
-- Feature 4: PROMPT 4 - Campaign Management
-- Create campaigns and campaign_analytics tables

-- Main campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('discount', 'free_addon', 'bundle')),
  discount_type VARCHAR(50) CHECK (discount_type IN ('percentage', 'flat')),
  discount_value INTEGER, -- Percentage or flat amount in paise
  products JSONB NOT NULL DEFAULT '[]', -- Array of product IDs
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  featured BOOLEAN DEFAULT FALSE,
  banner_url TEXT,
  terms TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'ended')),
  impressions INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,
  revenue BIGINT DEFAULT 0, -- in paise
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign analytics table (daily aggregation)
CREATE TABLE IF NOT EXISTS campaign_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,
  revenue BIGINT DEFAULT 0, -- in paise
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(campaign_id, date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_campaigns_partner ON campaigns(partner_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_featured ON campaigns(featured, status, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_campaign ON campaign_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_analytics_date ON campaign_analytics(date);

-- Enable RLS
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Partners can view own campaigns"
  ON campaigns FOR SELECT
  USING (partner_id = auth.uid());

CREATE POLICY "Partners can create campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (partner_id = auth.uid());

CREATE POLICY "Partners can update own campaigns"
  ON campaigns FOR UPDATE
  USING (partner_id = auth.uid());

CREATE POLICY "Partners can delete own campaigns"
  ON campaigns FOR DELETE
  USING (partner_id = auth.uid());

CREATE POLICY "Partners can view own analytics"
  ON campaign_analytics FOR SELECT
  USING (
    campaign_id IN (
      SELECT id FROM campaigns WHERE partner_id = auth.uid()
    )
  );

COMMENT ON TABLE campaigns IS 'Partner promotional campaigns with featured placement';
COMMENT ON TABLE campaign_analytics IS 'Daily campaign performance metrics';

