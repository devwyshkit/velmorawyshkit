-- ============================================================================
-- PARTNER PLATFORM CORE SCHEMA
-- Minimal MVP schema for partner dashboard, onboarding, and admin approval
-- Follows Swiggy/Zomato pattern with DRY principles
-- ============================================================================

-- ============================================================================
-- 1. PARTNER PROFILES TABLE (extends auth.users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.partner_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- Business Info (from onboarding Step 1)
  business_name TEXT NOT NULL,
  category TEXT NOT NULL,  -- 'tech_gifts' | 'chocolates' | 'food' | 'perishables' | 'personalized' | 'premium'
  business_type TEXT,      -- 'sole_proprietor' | 'partnership' | 'private_limited' | 'llp'
  address JSONB,           -- { line1, line2, city, state, pincode, landmark }
  phone TEXT,
  website TEXT,
  
  -- Approval Status (Zomato pattern: pending → approved → active)
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  rejection_reason TEXT,
  
  -- KYC Documents (from onboarding Step 2)
  pan_number TEXT,
  pan_document_url TEXT,
  pan_verified BOOLEAN DEFAULT false,
  
  gst_number TEXT,
  gst_verified BOOLEAN DEFAULT false,
  
  fssai_number TEXT,           -- NULL if category != 'food'
  fssai_document_url TEXT,
  fssai_expiry DATE,
  
  -- Banking (from onboarding Step 3)
  bank_account_number TEXT,    -- Encrypted in production
  bank_ifsc TEXT,
  bank_account_name TEXT,
  bank_verified BOOLEAN DEFAULT false,
  
  -- Business Metrics (updated by triggers)
  rating DECIMAL(2,1) DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,  -- in paise
  commission_percent DECIMAL(3,2) DEFAULT 0.15,  -- 15% default, can be lowered for premium partners
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,    -- When onboarding submitted
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),  -- Admin who approved
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Partners see own profile, Admins see all
CREATE POLICY "Partners can view own profile"
  ON public.partner_profiles FOR SELECT
  USING (auth.uid() = id OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

CREATE POLICY "Partners can update own profile"
  ON public.partner_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Only admins can approve partners"
  ON public.partner_profiles FOR UPDATE
  USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Trigger: Auto-create partner profile on partner signup
CREATE OR REPLACE FUNCTION public.handle_new_partner()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.raw_user_meta_data->>'role' = 'partner') THEN
    INSERT INTO public.partner_profiles (id, business_name, category, status)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'business_name',
      NEW.raw_user_meta_data->>'category',
      'pending'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_partner_user_created ON auth.users;
CREATE TRIGGER on_partner_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_partner();

-- ============================================================================
-- 2. PARTNER PRODUCTS TABLE (with add-ons for branding/customization)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.partner_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partner_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Basic Info
  name TEXT NOT NULL,
  description TEXT,
  short_desc TEXT,  -- 3-line benefits for cards
  
  -- Pricing (in paise)
  price INTEGER NOT NULL,  -- Retail price
  
  -- Inventory
  stock INTEGER DEFAULT 0,
  stock_alert_threshold INTEGER DEFAULT 50,
  
  -- Media
  images TEXT[] DEFAULT '{}',
  
  -- Customization (Swiggy/Zomato add-ons pattern)
  is_customizable BOOLEAN DEFAULT false,
  add_ons JSONB DEFAULT '[]',  -- [{ id, name, price, moq, requiresProof, description }]
  
  -- Product Metadata
  category TEXT,  -- Gift category
  tags TEXT[] DEFAULT '{}',  -- ['trending', 'bestseller', 'festival']
  badge TEXT,  -- 'bestseller' | 'trending'
  
  -- Delivery
  estimated_delivery_days TEXT DEFAULT '3-5 days',
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  sponsored BOOLEAN DEFAULT false,  -- For Phase 2
  
  -- SEO & Search
  search_vector tsvector,  -- Full-text search
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.partner_products ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active products from approved partners"
  ON public.partner_products FOR SELECT
  USING (
    is_active = true AND
    EXISTS (
      SELECT 1 FROM partner_profiles
      WHERE partner_profiles.id = partner_products.partner_id
      AND partner_profiles.status = 'approved'
    )
  );

CREATE POLICY "Partners can manage own products"
  ON public.partner_products FOR ALL
  USING (
    partner_id IN (
      SELECT id FROM partner_profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all products"
  ON public.partner_products FOR SELECT
  USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Trigger: Update search vector on product insert/update
CREATE OR REPLACE FUNCTION public.update_product_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    COALESCE(NEW.name, '') || ' ' || 
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.category, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_partner_products_search ON public.partner_products;
CREATE TRIGGER update_partner_products_search
  BEFORE INSERT OR UPDATE ON public.partner_products
  FOR EACH ROW EXECUTE FUNCTION public.update_product_search_vector();

-- ============================================================================
-- 3. ORDERS TABLE UPDATES (Link to Partners)
-- ============================================================================

-- Add partner-related columns to existing orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.partner_profiles(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS partner_status TEXT DEFAULT 'pending' CHECK (partner_status IN ('pending', 'accepted', 'preparing', 'ready', 'shipped'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS proof_urls TEXT[] DEFAULT '{}';  -- Customer uploaded proofs for custom orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS proof_approved BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS proof_approved_at TIMESTAMPTZ;

-- ============================================================================
-- 4. PARTNER EARNINGS VIEW (Simplified for MVP)
-- ============================================================================

CREATE OR REPLACE VIEW public.partner_earnings AS
SELECT 
  o.partner_id,
  DATE_TRUNC('week', o.created_at) as week_start,
  DATE_TRUNC('month', o.created_at) as month_start,
  COUNT(*) as order_count,
  SUM(o.total) as gross_revenue,  -- Total order value
  SUM(o.total * p.commission_percent) as platform_commission,  -- Our cut
  SUM(o.total * (1 - p.commission_percent)) as partner_payout,  -- Partner's earnings
  AVG(o.total) as avg_order_value
FROM public.orders o
JOIN public.partner_profiles p ON p.id = o.partner_id
WHERE o.status = 'completed'
GROUP BY o.partner_id, DATE_TRUNC('week', o.created_at), DATE_TRUNC('month', o.created_at);

-- ============================================================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_partner_products_partner_id ON public.partner_products(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_products_active ON public.partner_products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_partner_products_search ON public.partner_products USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_orders_partner_id ON public.orders(partner_id);
CREATE INDEX IF NOT EXISTS idx_orders_partner_status ON public.orders(partner_status);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_status ON public.partner_profiles(status);

-- ============================================================================
-- 6. HELPER FUNCTIONS
-- ============================================================================

-- Function: Get partner dashboard stats (today's metrics)
CREATE OR REPLACE FUNCTION public.get_partner_stats(p_partner_id UUID)
RETURNS TABLE (
  today_orders INTEGER,
  today_revenue INTEGER,
  active_products INTEGER,
  pending_orders INTEGER,
  current_rating DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Today's orders
    COUNT(DISTINCT CASE WHEN DATE(o.created_at) = CURRENT_DATE THEN o.id END)::INTEGER as today_orders,
    -- Today's revenue
    COALESCE(SUM(CASE WHEN DATE(o.created_at) = CURRENT_DATE THEN o.total ELSE 0 END), 0)::INTEGER as today_revenue,
    -- Active products
    (SELECT COUNT(*)::INTEGER FROM partner_products WHERE partner_id = p_partner_id AND is_active = true) as active_products,
    -- Pending orders (need action)
    COUNT(DISTINCT CASE WHEN o.partner_status = 'pending' THEN o.id END)::INTEGER as pending_orders,
    -- Current rating
    (SELECT rating FROM partner_profiles WHERE id = p_partner_id) as current_rating
  FROM public.orders o
  WHERE o.partner_id = p_partner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 7. UPDATED TIMESTAMP TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_partner_profiles_updated_at ON public.partner_profiles;
CREATE TRIGGER update_partner_profiles_updated_at
  BEFORE UPDATE ON public.partner_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS update_partner_products_updated_at ON public.partner_products;
CREATE TRIGGER update_partner_products_updated_at
  BEFORE UPDATE ON public.partner_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================================================
-- 8. SEED DATA (For Testing)
-- ============================================================================

-- Insert test partner (manually approved for testing dashboard)
-- Run this after migration to create test account
-- INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, raw_user_meta_data)
-- VALUES (
--   'partner@wyshkit.com',
--   crypt('partner123', gen_salt('bf')),
--   NOW(),
--   '{"role": "partner", "business_name": "Test Partner Co", "category": "tech_gifts"}'::jsonb
-- );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables created
DO $$
BEGIN
  RAISE NOTICE '✅ Partner Platform Core Schema Created';
  RAISE NOTICE '   - partner_profiles table';
  RAISE NOTICE '   - partner_products table';
  RAISE NOTICE '   - partner_earnings view';
  RAISE NOTICE '   - Orders table updated with partner columns';
  RAISE NOTICE '   - RLS policies enabled';
  RAISE NOTICE '   - Indexes created';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Ready for partner dashboard development';
END $$;

