-- Sponsored Analytics Table
-- Feature 5: PROMPT 5 - Sponsored Listings
-- Track sponsored product performance and fees

CREATE TABLE IF NOT EXISTS sponsored_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL, -- Reference to partner_products
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0, -- Views in search/home
  clicks INTEGER DEFAULT 0, -- Item sheet opens
  orders INTEGER DEFAULT 0, -- Purchases while sponsored
  revenue BIGINT DEFAULT 0, -- in paise
  fee_charged BIGINT DEFAULT 0, -- in paise (5% of revenue)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, date) -- One record per product per day
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sponsored_analytics_product ON sponsored_analytics(product_id);
CREATE INDEX IF NOT EXISTS idx_sponsored_analytics_date ON sponsored_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_sponsored_analytics_product_date ON sponsored_analytics(product_id, date);

-- Enable RLS
ALTER TABLE sponsored_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Partners can view own product analytics"
  ON sponsored_analytics FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM partner_products WHERE partner_id = auth.uid()
    )
  );

CREATE POLICY "System can insert analytics"
  ON sponsored_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "System can update analytics"
  ON sponsored_analytics FOR UPDATE
  USING (true);

-- Function to calculate and charge daily sponsored fees
CREATE OR REPLACE FUNCTION charge_daily_sponsored_fees()
RETURNS void AS $$
DECLARE
  today DATE := CURRENT_DATE;
  yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
  sponsored_product RECORD;
  daily_revenue BIGINT;
  daily_fee BIGINT;
BEGIN
  -- Get all active sponsored products
  FOR sponsored_product IN
    SELECT id, partner_id, price
    FROM partner_products
    WHERE sponsored = TRUE
      AND sponsored_start_date <= today
      AND sponsored_end_date >= today
  LOOP
    -- Calculate revenue from yesterday
    SELECT COALESCE(SUM(oi.quantity * oi.price), 0) INTO daily_revenue
    FROM order_items oi
    JOIN orders o ON oi.order_id = o.id
    WHERE oi.product_id = sponsored_product.id
      AND DATE(o.created_at) = yesterday;
    
    -- Calculate 5% fee
    daily_fee := ROUND(daily_revenue * 0.05);
    
    -- Deduct from wallet (if function exists)
    -- This would call partner wallet deduction
    
    -- Log analytics
    INSERT INTO sponsored_analytics (product_id, date, revenue, fee_charged)
    VALUES (sponsored_product.id, yesterday, daily_revenue, daily_fee)
    ON CONFLICT (product_id, date) 
    DO UPDATE SET revenue = EXCLUDED.revenue, fee_charged = EXCLUDED.fee_charged;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE sponsored_analytics IS 'Daily analytics and fee tracking for sponsored products';
COMMENT ON FUNCTION charge_daily_sponsored_fees IS 'Cron job to calculate and charge daily sponsored fees';

