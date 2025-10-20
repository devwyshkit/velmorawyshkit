-- Add tables for Features 6 & 7: Sponsored Listings + Loyalty Badges

-- =====================================
-- FEATURE 6: SPONSORED LISTINGS
-- =====================================

-- Add sponsored columns to partner_products
ALTER TABLE public.partner_products 
ADD COLUMN IF NOT EXISTS sponsored BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sponsored_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sponsored_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS sponsored_fee_percent NUMERIC DEFAULT 0.05;

-- Sponsored analytics table
CREATE TABLE IF NOT EXISTS public.sponsored_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.partner_products(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,
  revenue BIGINT DEFAULT 0,
  fee_charged INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, date)
);

-- Indexes for sponsored
CREATE INDEX IF NOT EXISTS idx_partner_products_sponsored ON public.partner_products(sponsored) WHERE sponsored = true;
CREATE INDEX IF NOT EXISTS idx_sponsored_analytics_product ON public.sponsored_analytics(product_id);

-- =====================================
-- FEATURE 7: LOYALTY BADGES
-- =====================================

-- Partner badges table
CREATE TABLE IF NOT EXISTS public.partner_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  criteria_met JSONB, -- Snapshot of partner metrics when badge was earned
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(partner_id, badge_type) -- One of each badge type per partner
);

-- Badge definitions (static reference data)
CREATE TABLE IF NOT EXISTS public.badge_definitions (
  type TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  criteria JSONB NOT NULL,
  benefits TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for badges
CREATE INDEX IF NOT EXISTS idx_partner_badges_partner ON public.partner_badges(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_badges_type ON public.partner_badges(badge_type);

-- RLS Policies
ALTER TABLE public.sponsored_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badge_definitions ENABLE ROW LEVEL SECURITY;

-- Partners can read their own sponsored analytics
CREATE POLICY "Partners can read own sponsored analytics" ON public.sponsored_analytics
  FOR SELECT USING (
    product_id IN (
      SELECT id FROM public.partner_products WHERE partner_id = auth.uid()
    )
  );

-- Partners can read their own badges
CREATE POLICY "Partners can read own badges" ON public.partner_badges
  FOR SELECT USING (partner_id = auth.uid());

-- Everyone can read badge definitions
CREATE POLICY "Anyone can read badge definitions" ON public.badge_definitions
  FOR SELECT USING (true);

-- Seed badge definitions
INSERT INTO public.badge_definitions (type, name, description, icon, color, criteria, benefits)
VALUES
  ('premium_partner', 'Premium Partner', '50+ orders, ₹5L+ revenue, 4.8+ rating', 'Trophy', '#FFD700', 
   '{"orders": 50, "revenue": 50000000, "rating": 4.8}'::jsonb,
   ARRAY['15% commission', 'Priority support', 'Featured placement']),
  
  ('five_star', '5-Star Partner', '100+ orders, 4.9+ rating', 'Star', '#3B82F6',
   '{"orders": 100, "rating": 4.9}'::jsonb,
   ARRAY['Top Partners carousel', 'Trust badge']),
  
  ('fast_fulfillment', 'Fast Fulfillment', '95%+ on-time delivery', 'Zap', '#10B981',
   '{"onTimePercent": 95, "orders": 100}'::jsonb,
   ARRAY['Lightning Fast badge', 'Priority search']),
  
  ('corporate_expert', 'Corporate Expert', '20+ bulk orders (50+ units)', 'Briefcase', '#8B5CF6',
   '{"bulkOrders": 20}'::jsonb,
   ARRAY['B2B dashboard', 'Corporate leads']),
  
  ('customization_pro', 'Customization Pro', '50+ custom orders', 'Palette', '#F59E0B',
   '{"customOrders": 50}'::jsonb,
   ARRAY['Custom Gifts featured', 'Design tools']),
  
  ('verified_seller', 'Verified Seller', '30+ days active, KYC complete', 'CheckCircle', '#06B6D4',
   '{"activeDays": 30}'::jsonb,
   ARRAY['Trust badge', 'Higher ranking'])
ON CONFLICT (type) DO NOTHING;

-- Verify
DO $$
BEGIN
  RAISE NOTICE '✅ Sponsored & Badges tables created:';
  RAISE NOTICE '  - partner_products.sponsored columns added';
  RAISE NOTICE '  - sponsored_analytics table (with RLS)';
  RAISE NOTICE '  - partner_badges table (with RLS)';
  RAISE NOTICE '  - badge_definitions seeded (6 badges)';
  RAISE NOTICE '  - Indexes created';
END $$;

