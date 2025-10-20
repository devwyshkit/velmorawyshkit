-- Create Banners and Occasions Tables
-- For Customer UI home page carousel and occasion cards
-- Run this BEFORE ADD_TEST_DATA_WITH_IMAGES.sql

-- ============================================
-- 1. BANNERS TABLE (Home Carousel)
-- ============================================

CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  cta_text TEXT, -- Call-to-action button text
  cta_link TEXT, -- Link for CTA button
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active banners ordered by display_order
CREATE INDEX IF NOT EXISTS idx_banners_active_order 
ON banners(is_active, display_order) 
WHERE is_active = true;

-- ============================================
-- 2. OCCASIONS TABLE (Occasion Cards Grid)
-- ============================================

CREATE TABLE IF NOT EXISTS occasions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_emoji TEXT, -- e.g., 🪔 for Diwali
  image_url TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for active occasions ordered by display_order
CREATE INDEX IF NOT EXISTS idx_occasions_active_order 
ON occasions(is_active, display_order) 
WHERE is_active = true;

-- Index for slug lookups
CREATE INDEX IF NOT EXISTS idx_occasions_slug 
ON occasions(slug);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Banners and Occasions tables created successfully!';
  RAISE NOTICE 'Tables:';
  RAISE NOTICE '- banners (for home carousel)';
  RAISE NOTICE '- occasions (for occasion cards)';
END $$;

-- Add bulk_pricing column to partner_products table
-- For Feature 1: Bulk Pricing Tiers (PROMPT 1)

ALTER TABLE public.partner_products 
ADD COLUMN IF NOT EXISTS bulk_pricing JSONB DEFAULT NULL;

-- Add index for bulk pricing queries
CREATE INDEX IF NOT EXISTS idx_partner_products_bulk_pricing 
ON public.partner_products USING gin(bulk_pricing) 
WHERE bulk_pricing IS NOT NULL;

-- Verify column added
DO $$
BEGIN
  RAISE NOTICE '✅ bulk_pricing column added to partner_products';
  RAISE NOTICE 'Products can now have tiered pricing for bulk orders';
END $$;

-- Example bulk_pricing structure:
-- [
--   {"minQty": 10, "maxQty": 49, "price": 140000, "discountPercent": 7},
--   {"minQty": 50, "maxQty": 99, "price": 130000, "discountPercent": 13},
--   {"minQty": 100, "price": 120000, "discountPercent": 20}
-- ]

-- Migration: Add Sponsored Listing Fields to partner_products
-- Feature: PROMPT 5 - Sponsored Listings
-- Description: Adds columns for sponsored product placement with duration tracking

-- Add sponsored fields to partner_products table
ALTER TABLE partner_products
ADD COLUMN IF NOT EXISTS sponsored BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sponsored_start_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sponsored_end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sponsored_fee_percent DECIMAL(5,4) DEFAULT 0.05;

-- Create index for sponsored products (for faster queries in customer UI)
CREATE INDEX IF NOT EXISTS idx_partner_products_sponsored 
ON partner_products(sponsored, sponsored_start_date, sponsored_end_date) 
WHERE sponsored = TRUE;

-- Create sponsored_analytics table for tracking performance
CREATE TABLE IF NOT EXISTS sponsored_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES partner_products(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  orders INTEGER DEFAULT 0,
  revenue INTEGER DEFAULT 0, -- in paise
  fee_charged INTEGER DEFAULT 0, -- in paise
  ctr DECIMAL(5,2) DEFAULT 0, -- Click-through rate
  roi DECIMAL(5,2) DEFAULT 0, -- Return on investment
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, date)
);

-- Create index for analytics queries
CREATE INDEX IF NOT EXISTS idx_sponsored_analytics_product_date 
ON sponsored_analytics(product_id, date DESC);

-- Add comment for documentation
COMMENT ON COLUMN partner_products.sponsored IS 'Whether product is currently sponsored';
COMMENT ON COLUMN partner_products.sponsored_start_date IS 'Start date of sponsorship period';
COMMENT ON COLUMN partner_products.sponsored_end_date IS 'End date of sponsorship period';
COMMENT ON COLUMN partner_products.sponsored_fee_percent IS 'Fee percentage charged per sale (default 5%)';
COMMENT ON TABLE sponsored_analytics IS 'Tracks daily performance metrics for sponsored products';

-- Sample data for testing (optional - remove for production)
-- Update a test product to be sponsored
-- UPDATE partner_products 
-- SET sponsored = TRUE,
--     sponsored_start_date = NOW(),
--     sponsored_end_date = NOW() + INTERVAL '7 days'
-- WHERE id = (SELECT id FROM partner_products LIMIT 1);

-- Migration: Add Sourcing Limits to partner_products
-- Feature: PROMPT 11 - Sourcing Limits
-- Description: Adds columns for monthly sourcing caps and usage tracking

-- Add sourcing limit fields to partner_products table
ALTER TABLE partner_products
ADD COLUMN IF NOT EXISTS sourcing_available BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sourcing_limit_monthly INTEGER,
ADD COLUMN IF NOT EXISTS sourcing_limit_enabled BOOLEAN DEFAULT FALSE;

-- Create sourcing_usage table for tracking monthly usage
CREATE TABLE IF NOT EXISTS sourcing_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES partner_products(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL, -- Reseller who sourced
  month VARCHAR(7) NOT NULL, -- YYYY-MM format
  units_sourced INTEGER DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, partner_id, month)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_products_sourcing 
ON partner_products(sourcing_available, sourcing_limit_enabled) 
WHERE sourcing_available = TRUE;

CREATE INDEX IF NOT EXISTS idx_sourcing_usage_product_month 
ON sourcing_usage(product_id, month);

CREATE INDEX IF NOT EXISTS idx_sourcing_usage_partner_month 
ON sourcing_usage(partner_id, month);

-- Add comments for documentation
COMMENT ON COLUMN partner_products.sourcing_available IS 'Whether product is available for resellers to source';
COMMENT ON COLUMN partner_products.sourcing_limit_monthly IS 'Maximum units that can be sourced per month (NULL = unlimited)';
COMMENT ON COLUMN partner_products.sourcing_limit_enabled IS 'Whether monthly sourcing limit is active';
COMMENT ON TABLE sourcing_usage IS 'Tracks monthly sourcing usage per product per reseller';

-- Note: Auto-disable sourcing when stock = 0 is handled in application logic
-- Note: Monthly reset cron job (sourcing-reset edge function) re-enables products on 1st of month

-- Migration: Add FSSAI Certificate Field to partner_profiles
-- Feature: Conditional FSSAI for Food & Beverage partners
-- Description: Adds FSSAI certificate storage for food-related businesses

-- Add FSSAI fields to partner_profiles table (or partners table depending on schema)
-- Note: Adjust table name based on your actual schema
DO $$ 
BEGIN
  -- Try adding to partner_profiles first
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_profiles') THEN
    ALTER TABLE partner_profiles
    ADD COLUMN IF NOT EXISTS fssai_number VARCHAR(14),
    ADD COLUMN IF NOT EXISTS fssai_document_url TEXT,
    ADD COLUMN IF NOT EXISTS fssai_verified BOOLEAN DEFAULT FALSE;
    
    COMMENT ON COLUMN partner_profiles.fssai_number IS 'FSSAI License Number (14 digits, required for food category)';
    COMMENT ON COLUMN partner_profiles.fssai_document_url IS 'Cloudinary URL of uploaded FSSAI certificate';
    COMMENT ON COLUMN partner_profiles.fssai_verified IS 'Whether FSSAI certificate has been verified by admin';
  END IF;
  
  -- Fallback: Try adding to partners table if partner_profiles doesn't exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partners') THEN
    ALTER TABLE partners
    ADD COLUMN IF NOT EXISTS fssai_number VARCHAR(14),
    ADD COLUMN IF NOT EXISTS fssai_document_url TEXT,
    ADD COLUMN IF NOT EXISTS fssai_verified BOOLEAN DEFAULT FALSE;
    
    COMMENT ON COLUMN partners.fssai_number IS 'FSSAI License Number (14 digits, required for food category)';
    COMMENT ON COLUMN partners.fssai_document_url IS 'Cloudinary URL of uploaded FSSAI certificate';
    COMMENT ON COLUMN partners.fssai_verified IS 'Whether FSSAI certificate has been verified by admin';
  END IF;
END $$;

-- Validation constraint (14 digits only)
-- Note: This is a check constraint, adjust table name as needed
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partner_profiles') THEN
    -- Add constraint only if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_fssai_format' AND conrelid = 'partner_profiles'::regclass) THEN
      ALTER TABLE partner_profiles
      ADD CONSTRAINT chk_fssai_format 
      CHECK (fssai_number IS NULL OR fssai_number ~ '^[0-9]{14}$');
    END IF;
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'partners') THEN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_fssai_format' AND conrelid = 'partners'::regclass) THEN
      ALTER TABLE partners
      ADD CONSTRAINT chk_fssai_format 
      CHECK (fssai_number IS NULL OR fssai_number ~ '^[0-9]{14}$');
    END IF;
  END IF;
END $$;

-- Note: FSSAI is conditionally required based on category
-- Validation logic is in frontend: Step2KYC.tsx (lines 48, 170-210)
-- Categories requiring FSSAI: ['food', 'perishables', 'beverages', 'Food & Beverages']

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

-- Reviews & Ratings Tables
-- Feature 9: PROMPT 9 - Ratings & Reviews Management
-- Create reviews, review_responses, and review_flags tables

-- Main reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID NOT NULL, -- Reference to orders table
  product_id UUID, -- Optional: specific product review
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  photos TEXT[], -- Array of Cloudinary URLs
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partner responses to reviews
CREATE TABLE IF NOT EXISTS review_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response TEXT NOT NULL CHECK (char_length(response) <= 500), -- Max 500 chars
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  edited_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(review_id) -- Only one response per review
);

-- Flagged reviews for moderation
CREATE TABLE IF NOT EXISTS review_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  review_id UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason VARCHAR(50) NOT NULL CHECK (reason IN ('spam', 'offensive', 'fake', 'off_topic')),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_partner ON reviews(partner_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer ON reviews(customer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_order ON reviews(order_id);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_review_responses_review ON review_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_review_flags_status ON review_flags(status);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_flags ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view reviews"
  ON reviews FOR SELECT
  USING (true);

CREATE POLICY "Customers can create reviews"
  ON reviews FOR INSERT
  WITH CHECK (customer_id = auth.uid());

CREATE POLICY "Partners can view reviews for their products"
  ON reviews FOR SELECT
  USING (partner_id = auth.uid());

CREATE POLICY "Partners can respond to their reviews"
  ON review_responses FOR INSERT
  WITH CHECK (
    review_id IN (
      SELECT id FROM reviews WHERE partner_id = auth.uid()
    )
  );

CREATE POLICY "Partners can view own responses"
  ON review_responses FOR SELECT
  USING (partner_id = auth.uid());

CREATE POLICY "Partners can update own responses"
  ON review_responses FOR UPDATE
  USING (partner_id = auth.uid());

CREATE POLICY "Partners can flag reviews"
  ON review_flags FOR INSERT
  WITH CHECK (partner_id = auth.uid());

COMMENT ON TABLE reviews IS 'Customer reviews and ratings for partners/products';
COMMENT ON TABLE review_responses IS 'Partner responses to customer reviews';
COMMENT ON TABLE review_flags IS 'Flagged reviews for admin moderation';
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

-- Referral Program Tables
-- Feature 7: PROMPT 7 - Referral Program
-- Create partner_referrals and referral_codes tables

-- Referral codes (one per partner)
CREATE TABLE IF NOT EXISTS referral_codes (
  code VARCHAR(50) PRIMARY KEY,
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  uses_count INTEGER DEFAULT 0,
  max_uses INTEGER, -- Optional limit
  UNIQUE(partner_id) -- One code per partner
);

-- Referral tracking
CREATE TABLE IF NOT EXISTS partner_referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Partner who referred
  referee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- New partner who signed up
  referee_email VARCHAR(255), -- Email before signup complete
  code VARCHAR(50) NOT NULL REFERENCES referral_codes(code),
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'complete', 'rejected')),
  orders_completed INTEGER DEFAULT 0,
  reward_amount INTEGER DEFAULT 500, -- ₹500 for both
  completed_at TIMESTAMP WITH TIME ZONE,
  signup_ip VARCHAR(45), -- For fraud detection
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referral_codes_partner ON referral_codes(partner_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON partner_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee ON partner_referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON partner_referrals(code);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON partner_referrals(status);

-- Enable RLS
ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_referrals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Partners can view own referral code"
  ON referral_codes FOR SELECT
  USING (partner_id = auth.uid());

CREATE POLICY "Anyone can view codes for signup"
  ON referral_codes FOR SELECT
  USING (true);

CREATE POLICY "Partners can create own code"
  ON referral_codes FOR INSERT
  WITH CHECK (partner_id = auth.uid());

CREATE POLICY "Partners can view own referrals"
  ON partner_referrals FOR SELECT
  USING (referrer_id = auth.uid());

CREATE POLICY "Referees can view own referral record"
  ON partner_referrals FOR SELECT
  USING (referee_id = auth.uid());

CREATE POLICY "System can create referrals"
  ON partner_referrals FOR INSERT
  WITH CHECK (true); -- Created during signup

CREATE POLICY "System can update referrals"
  ON partner_referrals FOR UPDATE
  USING (true); -- Updated by cron job

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code(partner_name TEXT)
RETURNS TEXT AS $$
DECLARE
  code_prefix TEXT;
  year_suffix TEXT;
  final_code TEXT;
BEGIN
  -- Extract first 4 letters of partner name, uppercase
  code_prefix := upper(regexp_replace(partner_name, '[^a-zA-Z]', '', 'g'));
  code_prefix := substring(code_prefix, 1, 4);
  
  -- Add year
  year_suffix := extract(year from now())::TEXT;
  
  -- Combine: GIFT-ABCD-2025
  final_code := 'GIFT-' || code_prefix || '-' || year_suffix;
  
  RETURN final_code;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE referral_codes IS 'Partner referral codes for signup tracking';
COMMENT ON TABLE partner_referrals IS 'Referral tracking with reward automation';
-- Help Center & Support Tables
-- Feature 12: PROMPT 12 - Help Center/Support
-- Create help_articles, support_tickets, and ticket_messages tables

-- Help articles (CMS content)
CREATE TABLE IF NOT EXISTS help_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL, -- Markdown content
  category VARCHAR(100) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  views INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published BOOLEAN DEFAULT TRUE
);

-- Support tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_number VARCHAR(20) UNIQUE NOT NULL, -- e.g., TKT-12345
  partner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID, -- Admin/support agent
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket messages (real-time chat)
CREATE TABLE IF NOT EXISTS ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  sender_type VARCHAR(20) NOT NULL CHECK (sender_type IN ('partner', 'agent')),
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  sender_name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  attachments TEXT[], -- Cloudinary URLs
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Full-text search for articles
CREATE INDEX IF NOT EXISTS idx_help_articles_fts ON help_articles USING GIN(to_tsvector('english', title || ' ' || content));
CREATE INDEX IF NOT EXISTS idx_help_articles_category ON help_articles(category);
CREATE INDEX IF NOT EXISTS idx_help_articles_published ON help_articles(published);

-- Ticket indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_partner ON support_tickets(partner_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created ON ticket_messages(created_at ASC);

-- Enable RLS
ALTER TABLE help_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view published articles"
  ON help_articles FOR SELECT
  USING (published = TRUE);

CREATE POLICY "Partners can view own tickets"
  ON support_tickets FOR SELECT
  USING (partner_id = auth.uid());

CREATE POLICY "Partners can create tickets"
  ON support_tickets FOR INSERT
  WITH CHECK (partner_id = auth.uid());

CREATE POLICY "Partners can view own ticket messages"
  ON ticket_messages FOR SELECT
  USING (
    ticket_id IN (
      SELECT id FROM support_tickets WHERE partner_id = auth.uid()
    )
  );

CREATE POLICY "Partners can send messages"
  ON ticket_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    ticket_id IN (
      SELECT id FROM support_tickets WHERE partner_id = auth.uid()
    )
  );

-- Seed help articles
INSERT INTO help_articles (title, content, category, tags) VALUES
('How to add products', '# Adding Products\n\nTo add a product to your catalog:\n\n1. Navigate to **Products** page\n2. Click **Add Product** button\n3. Fill in basic information\n4. Upload product images\n5. Set pricing and stock\n6. Configure bulk pricing tiers (optional)\n7. Enable customization add-ons (optional)\n8. Click **Create Product**\n\nYour product will be visible to customers immediately after creation.', 'Products & Pricing', ARRAY['products', 'getting started']),
('Setting up bulk pricing', '# Bulk Pricing\n\nBulk pricing allows you to offer discounts for larger quantity orders.\n\n## How to Set Up:\n\n1. Open product form\n2. Expand **Bulk Pricing Tiers** accordion\n3. Click **Add Tier**\n4. Enter minimum quantity and discounted price\n5. Add up to 5 tiers\n6. Save product\n\n## Example:\n- Tier 1: 10-49 units at ₹1,300 (13% off)\n- Tier 2: 50-99 units at ₹1,200 (20% off)\n- Tier 3: 100+ units at ₹1,100 (27% off)', 'Products & Pricing', ARRAY['bulk pricing', 'discounts']),
('Understanding commission structure', '# Commission Structure\n\nWyshkit uses a tiered commission model:\n\n- **Standard Partners:** 20% commission\n- **Premium Partners:** 15% commission (with Premium badge)\n- **Top Sellers:** 15% commission\n\n## How Commissions Work:\n\n1. Customer pays full price (₹2,499)\n2. Platform fee deducted (₹500 @ 20%)\n3. You receive payout (₹1,999)\n\n## Reducing Your Commission:\n\nEarn the **Premium Partner** badge by:\n- Completing 50+ orders\n- Maintaining 4.8+ rating\n- Generating ₹5L+ revenue\n\nThis automatically reduces your commission to 15%.', 'Payments & Payouts', ARRAY['commission', 'payments'])
ON CONFLICT DO NOTHING;

COMMENT ON TABLE badge_definitions IS 'Static badge configuration';
COMMENT ON TABLE partner_badges IS 'Partner achievement badges';
COMMENT ON TABLE help_articles IS 'Searchable help articles with markdown content';
COMMENT ON TABLE support_tickets IS 'Partner support tickets';
COMMENT ON TABLE ticket_messages IS 'Real-time support chat messages';
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

-- Wyshkit Test Data with Realistic Images
-- Run this AFTER all 13 migrations are complete
-- Last Updated: October 20, 2025

-- ============================================
-- 1. BANNER IMAGES (Home Carousel)
-- ============================================

-- Using high-quality free stock images from Unsplash/Pexels (replace with your CDN URLs)
INSERT INTO banners (id, title, subtitle, image_url, cta_text, cta_link, is_active, display_order, created_at) VALUES
  (
    gen_random_uuid(),
    'Diwali Gifting Made Easy',
    'Premium hampers starting at ₹499',
    'https://images.unsplash.com/photo-1603910234550-7f2c0b5d9a5a?w=1200&h=400&fit=crop', -- Diwali diyas
    'Shop Now',
    '/customer/occasions/diwali',
    true,
    1,
    NOW()
  ),
  (
    gen_random_uuid(),
    'Corporate Gifts That Impress',
    'Bulk orders with custom branding',
    'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=1200&h=400&fit=crop', -- Gift boxes
    'Explore',
    '/customer/occasions/corporate',
    true,
    2,
    NOW()
  ),
  (
    gen_random_uuid(),
    'Wedding Season Specials',
    'Personalized gifts for your loved ones',
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=400&fit=crop', -- Wedding decor
    'View Collection',
    '/customer/occasions/wedding',
    true,
    3,
    NOW()
  ),
  (
    gen_random_uuid(),
    'Birthday Surprises Delivered',
    'Same-day delivery available',
    'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=1200&h=400&fit=crop', -- Birthday celebration
    'Browse Gifts',
    '/customer/occasions/birthday',
    true,
    4,
    NOW()
  );

-- ============================================
-- 2. OCCASION CARDS (Customer Home Grid)
-- ============================================

INSERT INTO occasions (id, name, slug, description, icon_emoji, image_url, is_active, display_order, created_at) VALUES
  (
    gen_random_uuid(),
    'Diwali',
    'diwali',
    'Festival of Lights celebration gifts',
    '🪔',
    'https://images.unsplash.com/photo-1603910234550-7f2c0b5d9a5a?w=400&h=300&fit=crop',
    true,
    1,
    NOW()
  ),
  (
    gen_random_uuid(),
    'Birthday',
    'birthday',
    'Make their special day memorable',
    '🎂',
    'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=400&h=300&fit=crop',
    true,
    2,
    NOW()
  ),
  (
    gen_random_uuid(),
    'Corporate',
    'corporate',
    'Professional gifts for business',
    '💼',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop',
    true,
    3,
    NOW()
  ),
  (
    gen_random_uuid(),
    'Wedding',
    'wedding',
    'Celebrate love and new beginnings',
    '💍',
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
    true,
    4,
    NOW()
  ),
  (
    gen_random_uuid(),
    'Anniversary',
    'anniversary',
    'Thoughtful gifts for milestones',
    '💐',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=300&fit=crop',
    true,
    5,
    NOW()
  ),
  (
    gen_random_uuid(),
    'Housewarming',
    'housewarming',
    'Bless their new home',
    '🏡',
    'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400&h=300&fit=crop',
    true,
    6,
    NOW()
  ),
  (
    gen_random_uuid(),
    'Thank You',
    'thank-you',
    'Express gratitude with gifts',
    '🙏',
    'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=400&h=300&fit=crop',
    true,
    7,
    NOW()
  ),
  (
    gen_random_uuid(),
    'Get Well Soon',
    'get-well-soon',
    'Send care and healing wishes',
    '🌻',
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=300&fit=crop',
    true,
    8,
    NOW()
  );

-- ============================================
-- 3. TEST PARTNERS (2 Partners)
-- ============================================

-- Partner 1: GiftCraft (Premium Hampers)
INSERT INTO partner_profiles (
  id,
  business_name,
  email,
  phone,
  gstin,
  pan,
  bank_account_number,
  bank_ifsc,
  bank_account_holder_name,
  business_address,
  onboarding_status,
  kyc_status,
  commission_percent,
  is_active,
  created_at
) VALUES (
  'f892886a-beb7-4f7f-a5f3-c6ac26892b71',
  'GiftCraft Premium',
  'partner@giftcraft.com',
  '+919876543210',
  '27AABCU9603R1ZM',
  'AABCU9603R',
  '1234567890',
  'HDFC0001234',
  'GiftCraft Premium Pvt Ltd',
  '123, MG Road, Bangalore - 560001',
  'approved',
  'verified',
  20.00, -- 20% commission
  true,
  NOW()
);

-- Partner 2: BoatAudio (Electronics - for sourcing test)
INSERT INTO partner_profiles (
  id,
  business_name,
  email,
  phone,
  gstin,
  pan,
  bank_account_number,
  bank_ifsc,
  bank_account_holder_name,
  business_address,
  onboarding_status,
  kyc_status,
  commission_percent,
  is_active,
  created_at
) VALUES (
  'ff63c864-c2f4-4323-aac8-5224576531b6',
  'Boat Audio India',
  'partner@boat.com',
  '+919876543211',
  '27AABCU9603R1ZN',
  'AABCU9603S',
  '9876543210',
  'ICICI0001234',
  'Boat Audio India Pvt Ltd',
  '456, Tech Park, Delhi - 110001',
  'approved',
  'verified',
  15.00, -- 15% premium partner commission
  true,
  NOW()
);

-- ============================================
-- 4. SAMPLE PRODUCTS (10 Products with Features)
-- ============================================

-- Product 1: Diwali Premium Hamper (GiftCraft)
INSERT INTO partner_products (
  id,
  partner_id,
  name,
  description,
  short_desc,
  price, -- in paise
  stock,
  images,
  is_customizable,
  add_ons,
  bulk_pricing,
  sponsored,
  sponsored_start_date,
  sponsored_end_date,
  sourcing_available,
  sourcing_limit_monthly,
  sourcing_limit_enabled,
  category,
  estimated_delivery_days,
  is_active,
  rating,
  rating_count,
  created_at
) VALUES (
  gen_random_uuid(),
  'f892886a-beb7-4f7f-a5f3-c6ac26892b71',
  'Diwali Premium Hamper',
  'Curated selection of premium dry fruits, handmade chocolates, decorative diyas, and a personalized greeting card. Perfect for corporate gifting or family celebrations. Each item is carefully sourced and packaged in an elegant reusable box.',
  'Premium dry fruits, chocolates & diyas in elegant packaging',
  249900, -- ₹2,499
  150,
  ARRAY[
    'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1603910234550-7f2c0b5d9a5a?w=600&h=600&fit=crop'
  ],
  true, -- Customizable
  '[
    {"id": "addon-1", "name": "Company Logo Print", "price": 20000, "moq": 50, "requiresProof": true, "description": "Upload logo PNG/SVG (max 5MB)"},
    {"id": "addon-2", "name": "Premium Gift Wrapping", "price": 15000, "moq": 1, "requiresProof": false, "description": "Luxury velvet wrapping with ribbon"},
    {"id": "addon-3", "name": "Personalized Greeting Card", "price": 5000, "moq": 1, "requiresProof": true, "description": "Custom message (max 100 chars)"}
  ]'::jsonb,
  '[
    {"minQty": 10, "price": 239900, "discountPercent": 4},
    {"minQty": 25, "price": 224900, "discountPercent": 10},
    {"minQty": 50, "price": 212400, "discountPercent": 15}
  ]'::jsonb, -- Bulk pricing tiers
  true, -- Sponsored
  NOW(),
  NOW() + INTERVAL '30 days',
  false, -- Not for sourcing (final product)
  NULL,
  false,
  'Hampers',
  '3-5 days',
  true,
  4.8,
  234,
  NOW()
);

-- Product 2: Boat Rockerz 450 (Boat Audio) - For sourcing
INSERT INTO partner_products (
  id,
  partner_id,
  name,
  description,
  short_desc,
  price,
  stock,
  images,
  is_customizable,
  add_ons,
  bulk_pricing,
  sponsored,
  sourcing_available,
  sourcing_limit_monthly,
  sourcing_limit_enabled,
  category,
  estimated_delivery_days,
  is_active,
  rating,
  rating_count,
  created_at
) VALUES (
  gen_random_uuid(),
  'ff63c864-c2f4-4323-aac8-5224576531b6',
  'Boat Rockerz 450 Bluetooth Headphones',
  'Premium wireless headphones with 15-hour battery life, immersive audio, and ergonomic design. Perfect for corporate gifts or personal use. Includes 1-year warranty.',
  'Wireless headphones with 15hr battery & premium sound',
  149900, -- ₹1,499
  5000,
  ARRAY[
    'https://images.unsplash.com/photo-1545127398-14699f92334b?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop'
  ],
  true,
  '[
    {"id": "addon-boat-1", "name": "Engraving (Company Name)", "price": 20000, "moq": 50, "requiresProof": true, "description": "Laser engraving on headband"}
  ]'::jsonb,
  '[
    {"minQty": 50, "price": 139900, "discountPercent": 7},
    {"minQty": 100, "price": 129900, "discountPercent": 13},
    {"minQty": 200, "price": 119900, "discountPercent": 20}
  ]'::jsonb,
  false, -- Not sponsored
  true, -- Available for sourcing (other partners can include in hampers)
  100, -- Max 100 units/month for sourcing
  true,
  'Electronics',
  '1-2 days',
  true,
  4.6,
  1842,
  NOW()
);

-- Product 3: Birthday Special Gift Box (GiftCraft)
INSERT INTO partner_products (
  id,
  partner_id,
  name,
  description,
  short_desc,
  price,
  stock,
  images,
  is_customizable,
  add_ons,
  category,
  estimated_delivery_days,
  is_active,
  rating,
  rating_count,
  created_at
) VALUES (
  gen_random_uuid(),
  'f892886a-beb7-4f7f-a5f3-c6ac26892b71',
  'Birthday Celebration Box',
  'Surprise your loved ones with this delightful birthday gift box containing handmade chocolates, aromatic candles, mini succulent plant, and a happy birthday balloon. Includes space for personalized message.',
  'Chocolates, candles, plant & balloon in festive packaging',
  99900, -- ₹999
  200,
  ARRAY[
    'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&h=600&fit=crop'
  ],
  true,
  '[
    {"id": "addon-bday-1", "name": "Birthday Greeting Card", "price": 5000, "moq": 1, "requiresProof": false, "description": "Pre-printed happy birthday card"}
  ]'::jsonb,
  'Birthday',
  '2-3 days',
  true,
  4.7,
  567,
  NOW()
);

-- Product 4: Corporate Executive Pen Set (GiftCraft) - Bestseller
INSERT INTO partner_products (
  id,
  partner_id,
  name,
  description,
  short_desc,
  price,
  stock,
  images,
  is_customizable,
  add_ons,
  bulk_pricing,
  category,
  estimated_delivery_days,
  is_active,
  rating,
  rating_count,
  tags,
  created_at
) VALUES (
  gen_random_uuid(),
  'f892886a-beb7-4f7f-a5f3-c6ac26892b71',
  'Executive Pen Set - Parker Premium',
  'Elegant Parker ballpoint and fountain pen set in premium leatherette box. Ideal for corporate gifting to employees, clients, or executives. Can be personalized with name engraving.',
  'Parker premium pen set in leatherette box',
  349900, -- ₹3,499
  80,
  ARRAY[
    'https://images.unsplash.com/photo-1565837137-a3e2f8e97e08?w=600&h=600&fit=crop'
  ],
  true,
  '[
    {"id": "addon-pen-1", "name": "Name Engraving", "price": 30000, "moq": 10, "requiresProof": true, "description": "Engraved on pen cap (max 20 chars)"}
  ]'::jsonb,
  '[
    {"minQty": 10, "price": 329900, "discountPercent": 6},
    {"minQty": 25, "price": 314900, "discountPercent": 10}
  ]'::jsonb,
  'Corporate',
  '3-4 days',
  true,
  4.9,
  892,
  ARRAY['bestseller'],
  NOW()
);

-- Product 5: Wedding Trousseau Hamper (GiftCraft) - Trending
INSERT INTO partner_products (
  id,
  partner_id,
  name,
  description,
  short_desc,
  price,
  stock,
  images,
  is_customizable,
  category,
  estimated_delivery_days,
  is_active,
  rating,
  rating_count,
  tags,
  created_at
) VALUES (
  gen_random_uuid(),
  'f892886a-beb7-4f7f-a5f3-c6ac26892b71',
  'Wedding Trousseau Hamper',
  'Luxurious wedding gift hamper with premium dry fruits, silver-plated items, decorative candles, and traditional sweets. Perfect for blessing the newlyweds.',
  'Premium dry fruits, silver items & traditional sweets',
  549900, -- ₹5,499
  50,
  ARRAY[
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&h=600&fit=crop'
  ],
  false,
  'Wedding',
  '5-7 days',
  true,
  4.8,
  345,
  ARRAY['trending'],
  NOW()
);

-- Product 6: Thank You Gift Box (GiftCraft)
INSERT INTO partner_products (
  id,
  partner_id,
  name,
  description,
  short_desc,
  price,
  stock,
  images,
  is_customizable,
  add_ons,
  category,
  estimated_delivery_days,
  is_active,
  rating,
  rating_count,
  created_at
) VALUES (
  gen_random_uuid(),
  'f892886a-beb7-4f7f-a5f3-c6ac26892b71',
  'Gratitude Gift Box',
  'Express your appreciation with this thoughtfully curated thank you gift box. Contains premium chocolates, aromatic tea, handmade soap, and a "Thank You" card.',
  'Chocolates, tea, soap & thank you card',
  79900, -- ₹799
  180,
  ARRAY[
    'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=600&h=600&fit=crop'
  ],
  true,
  '[
    {"id": "addon-ty-1", "name": "Personalized Note", "price": 3000, "moq": 1, "requiresProof": true, "description": "Custom thank you message (max 50 chars)"}
  ]'::jsonb,
  'Thank You',
  '2-3 days',
  true,
  4.6,
  234,
  NOW()
);

-- Product 7: Boat Smartwatch (Boat Audio) - For sourcing
INSERT INTO partner_products (
  id,
  partner_id,
  name,
  description,
  short_desc,
  price,
  stock,
  images,
  is_customizable,
  sourcing_available,
  sourcing_limit_monthly,
  sourcing_limit_enabled,
  category,
  estimated_delivery_days,
  is_active,
  rating,
  rating_count,
  created_at
) VALUES (
  gen_random_uuid(),
  'ff63c864-c2f4-4323-aac8-5224576531b6',
  'Boat Storm Smartwatch',
  'Feature-packed smartwatch with fitness tracking, heart rate monitor, 7-day battery life, and premium metal strap. Perfect for tech-savvy gift recipients.',
  'Fitness smartwatch with 7-day battery',
  299900, -- ₹2,999
  3000,
  ARRAY[
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop'
  ],
  false,
  true,
  50, -- Max 50 units/month for sourcing
  true,
  'Electronics',
  '1-2 days',
  true,
  4.5,
  1234,
  NOW()
);

-- Product 8: Anniversary Gift Hamper (GiftCraft)
INSERT INTO partner_products (
  id,
  partner_id,
  name,
  description,
  short_desc,
  price,
  stock,
  images,
  is_customizable,
  add_ons,
  category,
  estimated_delivery_days,
  is_active,
  rating,
  rating_count,
  created_at
) VALUES (
  gen_random_uuid(),
  'f892886a-beb7-4f7f-a5f3-c6ac26892b71',
  'Anniversary Romance Hamper',
  'Celebrate love with this romantic anniversary hamper. Includes premium chocolates, scented candles, rose petals, and a beautiful photo frame.',
  'Chocolates, candles, rose petals & photo frame',
  179900, -- ₹1,799
  120,
  ARRAY[
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&h=600&fit=crop'
  ],
  true,
  '[
    {"id": "addon-ann-1", "name": "Anniversary Card", "price": 5000, "moq": 1, "requiresProof": false, "description": "Pre-printed anniversary wishes"}
  ]'::jsonb,
  'Anniversary',
  '2-3 days',
  true,
  4.7,
  456,
  NOW()
);

-- Product 9: Housewarming Essentials (GiftCraft)
INSERT INTO partner_products (
  id,
  partner_id,
  name,
  description,
  short_desc,
  price,
  stock,
  images,
  is_customizable,
  category,
  estimated_delivery_days,
  is_active,
  rating,
  rating_count,
  created_at
) VALUES (
  gen_random_uuid(),
  'f892886a-beb7-4f7f-a5f3-c6ac26892b71',
  'Housewarming Essentials Box',
  'Bless the new home with this practical and thoughtful gift box. Contains decorative items, kitchen essentials, and traditional good luck charms.',
  'Decorative items, kitchen essentials & good luck charms',
  129900, -- ₹1,299
  90,
  ARRAY[
    'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=600&h=600&fit=crop'
  ],
  false,
  'Housewarming',
  '3-4 days',
  true,
  4.6,
  234,
  NOW()
);

-- Product 10: Get Well Soon Care Package (GiftCraft)
INSERT INTO partner_products (
  id,
  partner_id,
  name,
  description,
  short_desc,
  price,
  stock,
  images,
  is_customizable,
  category,
  estimated_delivery_days,
  is_active,
  rating,
  rating_count,
  created_at
) VALUES (
  gen_random_uuid(),
  'f892886a-beb7-4f7f-a5f3-c6ac26892b71',
  'Get Well Soon Care Package',
  'Send healing wishes with this thoughtful care package. Includes healthy snacks, herbal tea, cozy socks, and an uplifting book.',
  'Healthy snacks, herbal tea, socks & uplifting book',
  89900, -- ₹899
  150,
  ARRAY[
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600&h=600&fit=crop'
  ],
  false,
  'Get Well Soon',
  '1-2 days',
  true,
  4.7,
  189,
  NOW()
);

-- ============================================
-- 5. SAMPLE CAMPAIGNS (2 Active Campaigns)
-- ============================================

INSERT INTO campaigns (
  id,
  partner_id,
  name,
  type,
  discount_type,
  discount_value,
  products,
  start_date,
  end_date,
  featured,
  banner_url,
  terms,
  status,
  impressions,
  orders,
  revenue,
  created_at
) VALUES
  (
    gen_random_uuid(),
    'f892886a-beb7-4f7f-a5f3-c6ac26892b71',
    'Diwali Mega Sale',
    'discount',
    'percentage',
    10,
    ARRAY(SELECT id FROM partner_products WHERE partner_id = 'f892886a-beb7-4f7f-a5f3-c6ac26892b71' LIMIT 3)::text[],
    NOW(),
    NOW() + INTERVAL '15 days',
    true, -- Featured
    'https://images.unsplash.com/photo-1603910234550-7f2c0b5d9a5a?w=1200&h=400&fit=crop',
    'Valid for orders above ₹1,000. Not applicable with other offers.',
    'active',
    15420,
    234,
    58760000, -- ₹587,600 in paise
    NOW()
  ),
  (
    gen_random_uuid(),
    'ff63c864-c2f4-4323-aac8-5224576531b6',
    'Tech Gifts Bonanza',
    'discount',
    'flat',
    50000, -- ₹500 off
    ARRAY(SELECT id FROM partner_products WHERE partner_id = 'ff63c864-c2f4-4323-aac8-5224576531b6' LIMIT 2)::text[],
    NOW(),
    NOW() + INTERVAL '10 days',
    false,
    NULL,
    'Flat ₹500 off on purchases above ₹2,000',
    'active',
    8920,
    145,
    43450000, -- ₹434,500
    NOW()
  );

-- ============================================
-- 6. SAMPLE REVIEWS (5 Reviews)
-- ============================================

INSERT INTO reviews (
  id,
  partner_id,
  customer_id,
  order_id,
  product_id,
  rating,
  comment,
  helpful_count,
  created_at
) VALUES
  (
    gen_random_uuid(),
    'f892886a-beb7-4f7f-a5f3-c6ac26892b71',
    'b4ce1d82-a2d5-4949-bf16-9134aaaaa7c6',
    'order-test-001',
    (SELECT id FROM partner_products WHERE name = 'Diwali Premium Hamper' LIMIT 1),
    5,
    'Absolutely loved the Diwali hamper! The packaging was premium and all items were of excellent quality. Highly recommend for corporate gifting.',
    23,
    NOW() - INTERVAL '5 days'
  ),
  (
    gen_random_uuid(),
    'ff63c864-c2f4-4323-aac8-5224576531b6',
    'b4ce1d82-a2d5-4949-bf16-9134aaaaa7c6',
    'order-test-002',
    (SELECT id FROM partner_products WHERE name = 'Boat Rockerz 450 Bluetooth Headphones' LIMIT 1),
    4,
    'Great sound quality and battery life. The engraving for company logo came out perfect. Slightly delayed delivery though.',
    15,
    NOW() - INTERVAL '3 days'
  ),
  (
    gen_random_uuid(),
    'f892886a-beb7-4f7f-a5f3-c6ac26892b71',
    'b4ce1d82-a2d5-4949-bf16-9134aaaaa7c6',
    'order-test-003',
    (SELECT id FROM partner_products WHERE name = 'Birthday Celebration Box' LIMIT 1),
    5,
    'Perfect birthday surprise! My sister loved every item in the box. The personalized card was a nice touch.',
    8,
    NOW() - INTERVAL '1 day'
  );

-- ============================================
-- 7. SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Test data added successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '- 4 Banner images (carousel)';
  RAISE NOTICE '- 8 Occasion cards';
  RAISE NOTICE '- 2 Test partners (GiftCraft, Boat Audio)';
  RAISE NOTICE '- 10 Sample products (with all features: bulk pricing, add-ons, sponsored, sourcing)';
  RAISE NOTICE '- 2 Active campaigns';
  RAISE NOTICE '- 3 Customer reviews';
  RAISE NOTICE '';
  RAISE NOTICE '🔑 Test Credentials:';
  RAISE NOTICE 'Partner 1: partner@giftcraft.com (password: set in Supabase Auth)';
  RAISE NOTICE 'Partner 2: partner@boat.com (password: set in Supabase Auth)';
  RAISE NOTICE '';
  RAISE NOTICE '🌐 Browse products at: http://localhost:8080/customer/home';
END $$;

