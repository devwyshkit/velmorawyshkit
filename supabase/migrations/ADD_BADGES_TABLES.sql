-- Loyalty Badges Tables
-- Feature 6: PROMPT 6 - Loyalty Badges
-- Create partner_badges and badge_definitions tables

-- Badge definitions (static configuration)
CREATE TABLE IF NOT EXISTS badge_definitions (
  type VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50) NOT NULL, -- Lucide icon name
  color VARCHAR(7) NOT NULL, -- Hex color
  criteria JSONB NOT NULL DEFAULT '{}', -- {orders: 50, revenue: 50000000, rating: 4.8}
  benefits TEXT[] NOT NULL DEFAULT '{}', -- Array of benefit strings
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner earned badges
CREATE TABLE IF NOT EXISTS partner_badges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type VARCHAR(50) NOT NULL REFERENCES badge_definitions(type),
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  criteria_met JSONB NOT NULL DEFAULT '{}', -- Snapshot of partner stats when earned
  revoked_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(partner_id, badge_type) -- One badge per partner per type
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_badges_partner ON partner_badges(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_badges_type ON partner_badges(badge_type);
CREATE INDEX IF NOT EXISTS idx_partner_badges_earned ON partner_badges(earned_at DESC);

-- Enable RLS
ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view badge definitions"
  ON badge_definitions FOR SELECT
  USING (true);

CREATE POLICY "Partners can view own badges"
  ON partner_badges FOR SELECT
  USING (partner_id = auth.uid());

CREATE POLICY "Anyone can view partner badges (for customer UI)"
  ON partner_badges FOR SELECT
  USING (true); -- Needed for customer UI to show badges

-- Insert badge definitions
INSERT INTO badge_definitions (type, name, description, icon, color, criteria, benefits) VALUES
('verified_seller', 'Verified Seller', 'All KYC complete, 30+ days active', 'Shield', '#10B981', '{}', ARRAY['Trust badge on listings', 'Platform verification']),
('premium_partner', 'Premium Partner', '50+ orders, ₹5L+ revenue, 4.8+ rating', 'Trophy', '#FFD700', '{"orders": 50, "revenue": 50000000, "rating": 4.8}', ARRAY['15% commission (vs 20% default)', 'Priority support', 'Featured placement']),
('five_star', '5-Star Partner', '100+ orders, 4.9+ rating', 'Star', '#3B82F6', '{"orders": 100, "rating": 4.9}', ARRAY['Top Partners carousel', 'Trust badge on listings']),
('fast_fulfillment', 'Fast Fulfillment', '95%+ on-time delivery (last 100 orders)', 'Zap', '#F59E0B', '{"orders": 100, "onTimePercent": 95}', ARRAY['Lightning Fast badge', 'Priority in search']),
('corporate_expert', 'Corporate Expert', '20+ bulk orders (50+ units each)', 'Briefcase', '#8B5CF6', '{"bulkOrders": 20}', ARRAY['B2B dashboard access', 'Bulk pricing tools']),
('customization_pro', 'Customization Pro', '50+ custom orders with branding', 'Palette', '#EC4899', '{"customOrders": 50}', ARRAY['Featured in Custom Gifts', 'Design consultation badge']),
('top_seller', 'Top Seller', 'Top 10% revenue in category (monthly)', 'Award', '#EF4444', '{"revenue": 10000000}', ARRAY['Category homepage feature', 'Marketing support'])
ON CONFLICT (type) DO NOTHING;

COMMENT ON TABLE badge_definitions IS 'Static badge configuration and criteria';
COMMENT ON TABLE partner_badges IS 'Partner achievement badges earned through performance';

