-- Migration: Create Partner Badges Table
-- Description: Loyalty badge system for partner gamification

-- Partner Badges Table
CREATE TABLE IF NOT EXISTS partner_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partner_profiles(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL, -- new_star, rising_seller, top_performer, quick_shipper, trusted_partner
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(partner_id, badge_type) -- Partner can only earn each badge once
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_badges_partner ON partner_badges(partner_id, earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_partner_badges_type ON partner_badges(badge_type);

-- Comments
COMMENT ON TABLE partner_badges IS 'Partner loyalty badges for gamification';
COMMENT ON COLUMN partner_badges.badge_type IS 'Type of badge: new_star, rising_seller, top_performer, quick_shipper, trusted_partner';

-- Function to auto-award badges based on partner metrics
CREATE OR REPLACE FUNCTION check_and_award_badges()
RETURNS TRIGGER AS $$
DECLARE
  partner_metrics RECORD;
BEGIN
  -- Get partner metrics
  SELECT 
    total_orders,
    rating,
    95.0 as on_time_rate -- TODO: Calculate from orders table
  INTO partner_metrics
  FROM partner_profiles
  WHERE id = NEW.id;

  -- Check New Star (5+ orders, 4.5+ rating)
  IF partner_metrics.total_orders >= 5 AND partner_metrics.rating >= 4.5 THEN
    INSERT INTO partner_badges (partner_id, badge_type)
    VALUES (NEW.id, 'new_star')
    ON CONFLICT (partner_id, badge_type) DO NOTHING;
  END IF;

  -- Check Rising Seller (50+ orders, 4.7+ rating)
  IF partner_metrics.total_orders >= 50 AND partner_metrics.rating >= 4.7 THEN
    INSERT INTO partner_badges (partner_id, badge_type)
    VALUES (NEW.id, 'rising_seller')
    ON CONFLICT (partner_id, badge_type) DO NOTHING;
  END IF;

  -- Check Top Performer (200+ orders, 4.8+ rating)
  IF partner_metrics.total_orders >= 200 AND partner_metrics.rating >= 4.8 THEN
    INSERT INTO partner_badges (partner_id, badge_type)
    VALUES (NEW.id, 'top_performer')
    ON CONFLICT (partner_id, badge_type) DO NOTHING;
  END IF;

  -- Check Quick Shipper (30+ orders, 95%+ on-time)
  IF partner_metrics.total_orders >= 30 AND partner_metrics.on_time_rate >= 95 THEN
    INSERT INTO partner_badges (partner_id, badge_type)
    VALUES (NEW.id, 'quick_shipper')
    ON CONFLICT (partner_id, badge_type) DO NOTHING;
  END IF;

  -- Check Trusted Partner (1000+ orders, 4.9+ rating, 98%+ on-time)
  IF partner_metrics.total_orders >= 1000 AND partner_metrics.rating >= 4.9 AND partner_metrics.on_time_rate >= 98 THEN
    INSERT INTO partner_badges (partner_id, badge_type)
    VALUES (NEW.id, 'trusted_partner')
    ON CONFLICT (partner_id, badge_type) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check badges when partner_profiles is updated
DROP TRIGGER IF EXISTS check_badges_on_update ON partner_profiles;
CREATE TRIGGER check_badges_on_update
  AFTER UPDATE ON partner_profiles
  FOR EACH ROW
  WHEN (OLD.total_orders IS DISTINCT FROM NEW.total_orders OR OLD.rating IS DISTINCT FROM NEW.rating)
  EXECUTE FUNCTION check_and_award_badges();

-- Success message
SELECT 'Partner badges table created successfully! Badges will be auto-awarded based on performance.' AS status;

