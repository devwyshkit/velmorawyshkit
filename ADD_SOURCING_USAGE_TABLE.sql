-- Sourcing Usage Table
-- Feature 11: PROMPT 11 - Sourcing Limits
-- Track monthly sourcing usage per product per reseller

CREATE TABLE IF NOT EXISTS sourcing_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL, -- Reference to partner_products
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Reseller who sourced
  month VARCHAR(7) NOT NULL, -- YYYY-MM format
  units_sourced INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, partner_id, month) -- One record per product per reseller per month
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sourcing_usage_product ON sourcing_usage(product_id);
CREATE INDEX IF NOT EXISTS idx_sourcing_usage_partner ON sourcing_usage(partner_id);
CREATE INDEX IF NOT EXISTS idx_sourcing_usage_month ON sourcing_usage(month);
CREATE INDEX IF NOT EXISTS idx_sourcing_usage_product_month ON sourcing_usage(product_id, month);

-- Enable RLS
ALTER TABLE sourcing_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Partners can view sourcing usage for their products"
  ON sourcing_usage FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM partner_products WHERE partner_id = auth.uid()
    )
  );

CREATE POLICY "System can track sourcing usage"
  ON sourcing_usage FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update sourcing usage"
  ON sourcing_usage FOR UPDATE
  USING (true);

-- Function to reset sourcing usage monthly (called by cron)
CREATE OR REPLACE FUNCTION reset_monthly_sourcing_limits()
RETURNS void AS $$
DECLARE
  today DATE := CURRENT_DATE;
BEGIN
  -- Only run on 1st of month
  IF extract(day from today) = 1 THEN
    -- Re-enable sourcing for products that hit limit last month
    UPDATE partner_products
    SET sourcing_available = TRUE
    WHERE sourcing_limit_enabled = TRUE
      AND sourcing_available = FALSE;
    
    -- Note: We don't delete old sourcing_usage records for historical tracking
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE sourcing_usage IS 'Monthly sourcing usage tracking per product per reseller';
COMMENT ON FUNCTION reset_monthly_sourcing_limits IS 'Cron job to reset sourcing limits on 1st of each month';

