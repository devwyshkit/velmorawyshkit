-- Wyshkit Database Schema
-- Initial migration for customer platform
-- Date: 2025-10-16

-- ============================================================================
-- 1. PROFILES TABLE (extends Supabase auth.users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- ============================================================================
-- 2. PARTNERS TABLE (Vendors/Stores)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  image TEXT,
  rating DECIMAL(3,2) DEFAULT 4.50 CHECK (rating >= 0 AND rating <= 5),
  delivery TEXT DEFAULT '1-2 days',
  badge TEXT CHECK (badge IN ('bestseller', 'trending')),
  category TEXT,
  tagline TEXT,
  rating_count INTEGER DEFAULT 0,
  sponsored BOOLEAN DEFAULT false,
  location TEXT DEFAULT 'Bangalore',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public read)
CREATE POLICY "Partners are publicly readable" 
  ON public.partners FOR SELECT 
  USING (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_partners_rating ON public.partners(rating DESC);
CREATE INDEX IF NOT EXISTS idx_partners_location ON public.partners(location);

-- ============================================================================
-- 3. ITEMS TABLE (Products/Gifts)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  short_desc TEXT,
  image TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  price INTEGER NOT NULL CHECK (price > 0),
  rating DECIMAL(3,2) DEFAULT 4.50 CHECK (rating >= 0 AND rating <= 5),
  rating_count INTEGER DEFAULT 0,
  badge TEXT CHECK (badge IN ('bestseller', 'trending')),
  sponsored BOOLEAN DEFAULT false,
  specs JSONB DEFAULT '{}'::jsonb,
  add_ons JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public read)
CREATE POLICY "Items are publicly readable" 
  ON public.items FOR SELECT 
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_items_partner_id ON public.items(partner_id);
CREATE INDEX IF NOT EXISTS idx_items_rating ON public.items(rating DESC);

-- ============================================================================
-- 4. CART_ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  product_name TEXT,
  price INTEGER,
  quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
  image TEXT,
  add_ons JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Enable RLS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users manage own cart)
CREATE POLICY "Users can view own cart" 
  ON public.cart_items FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items" 
  ON public.cart_items FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart items" 
  ON public.cart_items FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items" 
  ON public.cart_items FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_cart_items_user_id ON public.cart_items(user_id);

-- ============================================================================
-- 5. WISHLIST_ITEMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Enable RLS
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies (users manage own wishlist)
CREATE POLICY "Users can view own wishlist" 
  ON public.wishlist_items FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own wishlist items" 
  ON public.wishlist_items FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishlist items" 
  ON public.wishlist_items FOR DELETE 
  USING (auth.uid() = user_id);

-- Create index
CREATE INDEX IF NOT EXISTS idx_wishlist_items_user_id ON public.wishlist_items(user_id);

-- ============================================================================
-- 6. SEED DATA - Partners
-- ============================================================================

INSERT INTO public.partners (id, name, image, rating, delivery, badge, category, tagline, rating_count, sponsored, location) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Premium Gifts Co', 'https://picsum.photos/seed/partner1/400/400', 4.50, '1-2 days', NULL, 'Tech Gifts', 'Premium tech accessories', 234, true, 'Bangalore'),
  ('00000000-0000-0000-0000-000000000002', 'Artisan Hampers', 'https://picsum.photos/seed/partner2/400/400', 4.70, '2-3 days', 'trending', 'Gourmet', 'Curated gift hampers', 189, false, 'Mumbai'),
  ('00000000-0000-0000-0000-000000000003', 'Sweet Delights', 'https://picsum.photos/seed/partner3/400/400', 4.60, '1-2 days', NULL, 'Chocolates', 'Artisan chocolates & sweets', 156, false, 'Delhi'),
  ('00000000-0000-0000-0000-000000000004', 'Custom Crafts', 'https://picsum.photos/seed/partner4/400/400', 4.80, '3-5 days', 'bestseller', 'Personalized', 'Custom-made gifts', 312, false, 'Pune'),
  ('00000000-0000-0000-0000-000000000005', 'Gourmet Treats', 'https://picsum.photos/seed/partner5/400/400', 4.40, '1-2 days', NULL, 'Food & Beverage', 'International gourmet items', 98, false, 'Bangalore'),
  ('00000000-0000-0000-0000-000000000006', 'Luxury Hampers', 'https://picsum.photos/seed/partner6/400/400', 4.90, '2-3 days', 'trending', 'Premium', 'Luxury gift collections', 276, false, 'Hyderabad')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 7. SEED DATA - Items
-- ============================================================================

INSERT INTO public.items (id, partner_id, name, description, short_desc, image, images, price, rating, rating_count, badge, sponsored, specs) VALUES
  (
    '00000000-0000-0000-0001-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'Premium Gift Hamper',
    'Curated selection of premium items including gourmet treats, artisan chocolates, and luxury accessories. Perfect for any special occasion.',
    'Premium treats & chocolates for special occasions – ideal for corporate gifting and celebrations',
    'https://picsum.photos/seed/item1/400/400',
    '["https://picsum.photos/seed/item1a/400/400", "https://picsum.photos/seed/item1b/400/400", "https://picsum.photos/seed/item1c/400/400"]'::jsonb,
    2499,
    4.60,
    234,
    NULL,
    true,
    '{"weight": "2.5 kg", "dimensions": "30cm x 20cm x 15cm", "materials": "Premium packaging with satin finish"}'::jsonb
  ),
  (
    '00000000-0000-0000-0001-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'Artisan Chocolate Box',
    'Hand-crafted chocolates made with premium Belgian cocoa. Delightful flavors that melt in your mouth.',
    'Belgian chocolates perfect for sweet lovers – handcrafted with premium ingredients',
    'https://picsum.photos/seed/item2/400/400',
    '["https://picsum.photos/seed/item2a/400/400", "https://picsum.photos/seed/item2b/400/400"]'::jsonb,
    1299,
    4.80,
    189,
    'trending',
    false,
    '{}'::jsonb
  ),
  (
    '00000000-0000-0000-0001-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'Custom Photo Frame',
    'Personalized photo frame with custom engraving. Perfect for capturing special memories.',
    'Personalized frame for cherished memories – custom engraving available',
    'https://picsum.photos/seed/item3/400/400',
    '[]'::jsonb,
    899,
    4.50,
    98,
    NULL,
    false,
    '{}'::jsonb
  ),
  (
    '00000000-0000-0000-0001-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'Luxury Perfume Set',
    'Premium fragrance collection from renowned brands. Elegant packaging for gifting.',
    'Premium fragrances in elegant packaging – perfect for special occasions',
    'https://picsum.photos/seed/item4/400/400',
    '[]'::jsonb,
    3999,
    4.70,
    167,
    NULL,
    true,
    '{}'::jsonb
  ),
  (
    '00000000-0000-0000-0001-000000000005',
    '00000000-0000-0000-0000-000000000001',
    'Gourmet Snack Basket',
    'Curated selection of international and local gourmet snacks. Perfect for food lovers.',
    'International snacks for food enthusiasts – exotic flavors from around the world',
    'https://picsum.photos/seed/item5/400/400',
    '[]'::jsonb,
    1799,
    4.40,
    124,
    NULL,
    false,
    '{}'::jsonb
  ),
  (
    '00000000-0000-0000-0001-000000000006',
    '00000000-0000-0000-0000-000000000001',
    'Wireless Earbuds',
    'Premium wireless earbuds with noise cancellation. Perfect gift for music lovers.',
    'Wireless audio for music lovers – noise cancellation and premium sound quality',
    'https://picsum.photos/seed/item6/400/400',
    '[]'::jsonb,
    4999,
    4.90,
    312,
    'bestseller',
    false,
    '{}'::jsonb
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- 8. FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 9. FULL-TEXT SEARCH SETUP
-- ============================================================================

-- Add search columns for partners
ALTER TABLE public.partners ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_partners_search ON public.partners USING GIN(search_vector);

CREATE OR REPLACE FUNCTION public.partners_search_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.tagline, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER partners_search_vector_update
  BEFORE INSERT OR UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.partners_search_update();

-- Add search columns for items
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_items_search ON public.items USING GIN(search_vector);

CREATE OR REPLACE FUNCTION public.items_search_update()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.short_desc, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER items_search_vector_update
  BEFORE INSERT OR UPDATE ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.items_search_update();

-- ============================================================================
-- DONE! Run this migration in your Supabase SQL editor
-- ============================================================================

-- To apply: Copy this entire file and run in Supabase Dashboard → SQL Editor
-- Or use Supabase CLI: supabase db push

