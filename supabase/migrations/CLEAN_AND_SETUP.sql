-- ============================================================================
-- CLEAN DATABASE & FRESH INSTALL
-- This fixes the "column status does not exist" error
-- ============================================================================
-- Run this ONCE in Supabase SQL Editor to:
-- 1. Drop any existing partner tables (clean slate)
-- 2. Create fresh schema
-- 3. Create 3 working test accounts
-- ============================================================================

-- ============================================================================
-- PART 1: CLEANUP (Remove existing tables if any)
-- ============================================================================

-- Disable triggers temporarily
SET session_replication_role = 'replica';

-- Drop partner_earnings (could be view OR table - try TABLE first)
DROP TABLE IF EXISTS public.partner_earnings CASCADE;
DROP VIEW IF EXISTS public.partner_earnings CASCADE;

-- Drop tables (CASCADE removes dependencies)
DROP TABLE IF EXISTS public.partner_products CASCADE;
DROP TABLE IF EXISTS public.partner_profiles CASCADE;

-- Drop old functions/triggers
DROP FUNCTION IF EXISTS public.handle_new_partner() CASCADE;
DROP FUNCTION IF EXISTS public.update_product_search_vector() CASCADE;
DROP FUNCTION IF EXISTS public.get_partner_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;

-- Delete any existing test accounts from auth
DELETE FROM auth.users WHERE email IN ('partner@wyshkit.com', 'admin@wyshkit.com', 'pending@wyshkit.com');

-- Re-enable triggers
SET session_replication_role = 'origin';

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- PART 2: CREATE FRESH SCHEMA
-- ============================================================================

-- 1. PARTNER PROFILES TABLE
CREATE TABLE public.partner_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- Business Info
  business_name TEXT NOT NULL,
  category TEXT NOT NULL,
  business_type TEXT,
  address JSONB,
  phone TEXT,
  website TEXT,
  
  -- Approval Status (using 'status' not 'state')
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  rejection_reason TEXT,
  
  -- KYC Documents
  pan_number TEXT,
  pan_document_url TEXT,
  pan_verified BOOLEAN DEFAULT false,
  gst_number TEXT,
  gst_verified BOOLEAN DEFAULT false,
  fssai_number TEXT,
  fssai_document_url TEXT,
  fssai_expiry DATE,
  
  -- Banking
  bank_account_number TEXT,
  bank_ifsc TEXT,
  bank_account_name TEXT,
  bank_verified BOOLEAN DEFAULT false,
  
  -- Business Metrics
  rating DECIMAL(2,1) DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0,
  total_orders INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,
  commission_percent DECIMAL(3,2) DEFAULT 0.15,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Partners can view own profile"
  ON public.partner_profiles FOR SELECT
  USING (auth.uid() = id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Partners can update own profile"
  ON public.partner_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all partners"
  ON public.partner_profiles FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- 2. PARTNER PRODUCTS TABLE
CREATE TABLE public.partner_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partner_profiles(id) ON DELETE CASCADE NOT NULL,
  
  name TEXT NOT NULL,
  description TEXT,
  short_desc TEXT,
  price INTEGER NOT NULL,
  stock INTEGER DEFAULT 0,
  stock_alert_threshold INTEGER DEFAULT 50,
  images TEXT[] DEFAULT '{}',
  
  is_customizable BOOLEAN DEFAULT false,
  add_ons JSONB DEFAULT '[]',
  
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  badge TEXT,
  estimated_delivery_days TEXT DEFAULT '3-5 days',
  
  is_active BOOLEAN DEFAULT true,
  sponsored BOOLEAN DEFAULT false,
  search_vector tsvector,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.partner_products ENABLE ROW LEVEL SECURITY;

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
  USING (partner_id = auth.uid());

CREATE POLICY "Admins can view all products"
  ON public.partner_products FOR SELECT
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- 3. UPDATE ORDERS TABLE (add partner columns if they don't exist)
DO $$
BEGIN
  -- Add partner_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'partner_id') THEN
    ALTER TABLE public.orders ADD COLUMN partner_id UUID REFERENCES public.partner_profiles(id);
  END IF;
  
  -- Add partner_status column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'partner_status') THEN
    ALTER TABLE public.orders ADD COLUMN partner_status TEXT DEFAULT 'pending' 
      CHECK (partner_status IN ('pending', 'accepted', 'preparing', 'ready', 'shipped'));
  END IF;
  
  -- Add proof columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'proof_urls') THEN
    ALTER TABLE public.orders ADD COLUMN proof_urls TEXT[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'proof_approved') THEN
    ALTER TABLE public.orders ADD COLUMN proof_approved BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'orders' AND column_name = 'proof_approved_at') THEN
    ALTER TABLE public.orders ADD COLUMN proof_approved_at TIMESTAMPTZ;
  END IF;
END $$;

-- 4. PARTNER EARNINGS VIEW
CREATE VIEW public.partner_earnings AS
SELECT 
  o.partner_id,
  DATE_TRUNC('week', o.created_at) as week_start,
  DATE_TRUNC('month', o.created_at) as month_start,
  COUNT(*) as order_count,
  SUM(o.total) as gross_revenue,
  SUM(o.total * p.commission_percent) as platform_commission,
  SUM(o.total * (1 - p.commission_percent)) as partner_payout,
  AVG(o.total) as avg_order_value
FROM public.orders o
JOIN public.partner_profiles p ON p.id = o.partner_id
WHERE o.status = 'completed'
GROUP BY o.partner_id, DATE_TRUNC('week', o.created_at), DATE_TRUNC('month', o.created_at);

-- 5. FUNCTIONS & TRIGGERS

-- Function: Get partner stats
CREATE FUNCTION public.get_partner_stats(p_partner_id UUID)
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
    COUNT(DISTINCT CASE WHEN DATE(o.created_at) = CURRENT_DATE THEN o.id END)::INTEGER,
    COALESCE(SUM(CASE WHEN DATE(o.created_at) = CURRENT_DATE THEN o.total ELSE 0 END), 0)::INTEGER,
    (SELECT COUNT(*)::INTEGER FROM partner_products WHERE partner_id = p_partner_id AND is_active = true),
    COUNT(DISTINCT CASE WHEN o.partner_status = 'pending' THEN o.id END)::INTEGER,
    (SELECT rating FROM partner_profiles WHERE id = p_partner_id)
  FROM public.orders o
  WHERE o.partner_id = p_partner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Auto-create partner profile
CREATE FUNCTION public.handle_new_partner()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.raw_user_meta_data->>'role' = 'partner') THEN
    INSERT INTO public.partner_profiles (id, business_name, category, status)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'business_name', 'New Partner'),
      COALESCE(NEW.raw_user_meta_data->>'category', 'tech_gifts'),
      'pending'
    ) ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_partner_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_partner();

-- Function: Update timestamps
CREATE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_partner_profiles_updated_at
  BEFORE UPDATE ON public.partner_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_partner_products_updated_at
  BEFORE UPDATE ON public.partner_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function: Search vector
CREATE FUNCTION public.update_product_search_vector()
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

CREATE TRIGGER update_partner_products_search
  BEFORE INSERT OR UPDATE ON public.partner_products
  FOR EACH ROW EXECUTE FUNCTION public.update_product_search_vector();

-- 6. INDEXES
CREATE INDEX idx_partner_products_partner_id ON public.partner_products(partner_id);
CREATE INDEX idx_partner_products_active ON public.partner_products(is_active) WHERE is_active = true;
CREATE INDEX idx_partner_products_search ON public.partner_products USING gin(search_vector);
CREATE INDEX idx_orders_partner_id ON public.orders(partner_id);
CREATE INDEX idx_orders_partner_status ON public.orders(partner_status);
CREATE INDEX idx_partner_profiles_status ON public.partner_profiles(status);

-- ============================================================================
-- PART 3: CREATE TEST ACCOUNTS
-- ============================================================================

-- ACCOUNT 1: APPROVED PARTNER
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated', 'authenticated', 'partner@wyshkit.com',
  crypt('Partner@123', gen_salt('bf')), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"partner","business_name":"Test Partner Store"}',
  NOW(), NOW(), '', '', '', ''
);

INSERT INTO public.partner_profiles (
  id, business_name, category, status, phone, created_at, approved_at
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
  'Test Partner Store', 'tech_gifts', 'approved', '9876543210', NOW(), NOW()
);

-- ACCOUNT 2: ADMIN
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  'bbbbbbbb-cccc-dddd-eeee-222222222222'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated', 'authenticated', 'admin@wyshkit.com',
  crypt('Admin@123', gen_salt('bf')), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"admin"}',
  NOW(), NOW(), '', '', '', ''
);

-- ACCOUNT 3: PENDING PARTNER (FOOD CATEGORY)
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  'cccccccc-dddd-eeee-ffff-333333333333'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated', 'authenticated', 'pending@wyshkit.com',
  crypt('Pending@123', gen_salt('bf')), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"partner","business_name":"Pending Food Partner"}',
  NOW(), NOW(), '', '', '', ''
);

INSERT INTO public.partner_profiles (
  id, business_name, category, status, phone, pan_number, gst_number, fssai_number, created_at, submitted_at
) VALUES (
  'cccccccc-dddd-eeee-ffff-333333333333'::uuid,
  'Pending Food Partner', 'food', 'pending', '9876543211',
  'ABCDE1234F', '22ABCDE1234F1Z5', '12345678901234', NOW(), NOW()
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ CLEAN INSTALL COMPLETE!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'TABLES CREATED:';
  RAISE NOTICE '  ✓ partner_profiles (with status column)';
  RAISE NOTICE '  ✓ partner_products';
  RAISE NOTICE '  ✓ partner_earnings (view)';
  RAISE NOTICE '  ✓ orders (updated with partner columns)';
  RAISE NOTICE '';
  RAISE NOTICE 'TEST ACCOUNTS CREATED:';
  RAISE NOTICE '  1. Partner (Approved):';
  RAISE NOTICE '     Email: partner@wyshkit.com';
  RAISE NOTICE '     Password: Partner@123';
  RAISE NOTICE '';
  RAISE NOTICE '  2. Admin:';
  RAISE NOTICE '     Email: admin@wyshkit.com';
  RAISE NOTICE '     Password: Admin@123';
  RAISE NOTICE '';
  RAISE NOTICE '  3. Pending Partner (Food):';
  RAISE NOTICE '     Email: pending@wyshkit.com';
  RAISE NOTICE '     Password: Pending@123';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 READY TO TEST!';
  RAISE NOTICE 'Go to: http://localhost:8080/partner/login';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- Final verification
SELECT 
  email,
  raw_user_meta_data->>'role' as role,
  email_confirmed_at IS NOT NULL as confirmed
FROM auth.users
WHERE email IN ('partner@wyshkit.com', 'admin@wyshkit.com', 'pending@wyshkit.com')
ORDER BY email;

