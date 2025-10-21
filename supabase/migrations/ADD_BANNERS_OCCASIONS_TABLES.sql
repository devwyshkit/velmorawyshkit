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

