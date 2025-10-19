-- ============================================================================
-- WYSHKIT PARTNER PLATFORM - COMPLETE SETUP SQL
-- Run this ONCE in Supabase Dashboard → SQL Editor
-- ============================================================================
-- This script will:
-- 1. Create all partner platform tables (migration)
-- 2. Create 3 test accounts (partner, admin, pending partner)
-- 3. Verify everything is set up correctly
-- ============================================================================

-- ============================================================================
-- PART 1: DATABASE MIGRATION (Tables, Views, Functions)
-- ============================================================================

-- 1. PARTNER PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.partner_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  
  -- Business Info
  business_name TEXT NOT NULL,
  category TEXT NOT NULL,
  business_type TEXT,
  address JSONB,
  phone TEXT,
  website TEXT,
  
  -- Approval Status
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

ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Partners can view own profile" ON public.partner_profiles;
CREATE POLICY "Partners can view own profile"
  ON public.partner_profiles FOR SELECT
  USING (auth.uid() = id OR auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

DROP POLICY IF EXISTS "Partners can update own profile" ON public.partner_profiles;
CREATE POLICY "Partners can update own profile"
  ON public.partner_profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Only admins can approve partners" ON public.partner_profiles;
CREATE POLICY "Only admins can approve partners"
  ON public.partner_profiles FOR UPDATE
  USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION public.handle_new_partner()
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

DROP TRIGGER IF EXISTS on_partner_user_created ON auth.users;
CREATE TRIGGER on_partner_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_partner();

-- 2. PARTNER PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.partner_products (
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

ALTER TABLE public.partner_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active products from approved partners" ON public.partner_products;
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

DROP POLICY IF EXISTS "Partners can manage own products" ON public.partner_products;
CREATE POLICY "Partners can manage own products"
  ON public.partner_products FOR ALL
  USING (
    partner_id IN (
      SELECT id FROM partner_profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all products" ON public.partner_products;
CREATE POLICY "Admins can view all products"
  ON public.partner_products FOR SELECT
  USING (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- Search vector trigger
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

-- 3. UPDATE ORDERS TABLE
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.partner_profiles(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS partner_status TEXT DEFAULT 'pending' CHECK (partner_status IN ('pending', 'accepted', 'preparing', 'ready', 'shipped'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS proof_urls TEXT[] DEFAULT '{}';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS proof_approved BOOLEAN DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS proof_approved_at TIMESTAMPTZ;

-- 4. PARTNER EARNINGS VIEW
CREATE OR REPLACE VIEW public.partner_earnings AS
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

-- 5. INDEXES
CREATE INDEX IF NOT EXISTS idx_partner_products_partner_id ON public.partner_products(partner_id);
CREATE INDEX IF NOT EXISTS idx_partner_products_active ON public.partner_products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_partner_products_search ON public.partner_products USING gin(search_vector);
CREATE INDEX IF NOT EXISTS idx_orders_partner_id ON public.orders(partner_id);
CREATE INDEX IF NOT EXISTS idx_orders_partner_status ON public.orders(partner_status);
CREATE INDEX IF NOT EXISTS idx_partner_profiles_status ON public.partner_profiles(status);

-- 6. HELPER FUNCTIONS
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
    COUNT(DISTINCT CASE WHEN DATE(o.created_at) = CURRENT_DATE THEN o.id END)::INTEGER as today_orders,
    COALESCE(SUM(CASE WHEN DATE(o.created_at) = CURRENT_DATE THEN o.total ELSE 0 END), 0)::INTEGER as today_revenue,
    (SELECT COUNT(*)::INTEGER FROM partner_products WHERE partner_id = p_partner_id AND is_active = true) as active_products,
    COUNT(DISTINCT CASE WHEN o.partner_status = 'pending' THEN o.id END)::INTEGER as pending_orders,
    (SELECT rating FROM partner_profiles WHERE id = p_partner_id) as current_rating
  FROM public.orders o
  WHERE o.partner_id = p_partner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Updated timestamp trigger
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
-- PART 2: CREATE TEST ACCOUNTS
-- ============================================================================

-- ACCOUNT 1: APPROVED PARTNER (partner@wyshkit.com / Partner@123)
DO $$
DECLARE
  partner_user_id UUID;
BEGIN
  -- Delete existing if any
  DELETE FROM auth.users WHERE email = 'partner@wyshkit.com';
  
  -- Create auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'partner@wyshkit.com',
    crypt('Partner@123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"partner","business_name":"Test Partner Store"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO partner_user_id;
  
  -- Create partner profile (approved for immediate testing)
  INSERT INTO public.partner_profiles (
    id,
    business_name,
    category,
    status,
    phone,
    address,
    created_at,
    approved_at
  ) VALUES (
    partner_user_id,
    'Test Partner Store',
    'tech_gifts',
    'approved',  -- Pre-approved for testing
    '9876543210',
    '{"line1":"123 Test Street","city":"Bangalore","state":"Karnataka","pincode":"560001"}',
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ Partner account created: partner@wyshkit.com / Partner@123 (APPROVED)';
END $$;

-- ACCOUNT 2: ADMIN (admin@wyshkit.com / Admin@123)
DO $$
BEGIN
  -- Delete existing if any
  DELETE FROM auth.users WHERE email = 'admin@wyshkit.com';
  
  -- Create admin user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@wyshkit.com',
    crypt('Admin@123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"admin"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  );
  
  RAISE NOTICE '✅ Admin account created: admin@wyshkit.com / Admin@123';
END $$;

-- ACCOUNT 3: PENDING PARTNER (pending@wyshkit.com / Pending@123)
DO $$
DECLARE
  pending_user_id UUID;
BEGIN
  -- Delete existing if any
  DELETE FROM auth.users WHERE email = 'pending@wyshkit.com';
  
  -- Create auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'pending@wyshkit.com',
    crypt('Pending@123', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"role":"partner","business_name":"Pending Food Partner"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO pending_user_id;
  
  -- Create pending partner profile (food category for FSSAI testing)
  INSERT INTO public.partner_profiles (
    id,
    business_name,
    category,
    status,
    phone,
    pan_number,
    gst_number,
    fssai_number,
    address,
    created_at,
    submitted_at
  ) VALUES (
    pending_user_id,
    'Pending Food Partner',
    'food',  -- Food category (will show FSSAI in admin)
    'pending',  -- Pending approval
    '9876543211',
    'ABCDE1234F',
    '22ABCDE1234F1Z5',
    '12345678901234',  -- FSSAI for food partner
    '{"line1":"456 Food Street","city":"Mumbai","state":"Maharashtra","pincode":"400001"}',
    NOW(),
    NOW()
  );
  
  RAISE NOTICE '✅ Pending partner created: pending@wyshkit.com / Pending@123 (FOOD CATEGORY for FSSAI test)';
END $$;

-- ============================================================================
-- PART 3: VERIFICATION
-- ============================================================================

-- Verify tables created
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('partner_profiles', 'partner_products');
  
  IF table_count = 2 THEN
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '✅ DATABASE MIGRATION COMPLETE';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '';
    RAISE NOTICE 'TABLES CREATED:';
    RAISE NOTICE '  ✓ partner_profiles';
    RAISE NOTICE '  ✓ partner_products';
    RAISE NOTICE '  ✓ partner_earnings (view)';
    RAISE NOTICE '  ✓ orders (updated with partner columns)';
    RAISE NOTICE '';
    RAISE NOTICE 'TEST ACCOUNTS CREATED:';
    RAISE NOTICE '  1. Partner (Approved):';
    RAISE NOTICE '     Email: partner@wyshkit.com';
    RAISE NOTICE '     Password: Partner@123';
    RAISE NOTICE '     Status: APPROVED (full dashboard access)';
    RAISE NOTICE '';
    RAISE NOTICE '  2. Admin:';
    RAISE NOTICE '     Email: admin@wyshkit.com';
    RAISE NOTICE '     Password: Admin@123';
    RAISE NOTICE '     Access: Partner approval workflow';
    RAISE NOTICE '';
    RAISE NOTICE '  3. Pending Partner (Food):';
    RAISE NOTICE '     Email: pending@wyshkit.com';
    RAISE NOTICE '     Password: Pending@123';
    RAISE NOTICE '     Status: PENDING (shows in admin queue)';
    RAISE NOTICE '     Category: FOOD (FSSAI will display in admin)';
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '  1. Go to http://localhost:8080/partner/login';
    RAISE NOTICE '  2. Login with partner@wyshkit.com / Partner@123';
    RAISE NOTICE '  3. Verify dashboard loads';
    RAISE NOTICE '  4. Test admin approval: admin@wyshkit.com / Admin@123';
    RAISE NOTICE '';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
    RAISE NOTICE '🚀 READY FOR TESTING!';
    RAISE NOTICE '═══════════════════════════════════════════════════════════';
  ELSE
    RAISE EXCEPTION 'Migration failed: Expected 2 tables, found %', table_count;
  END IF;
END $$;

-- Final verification query
SELECT 
  email,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'business_name' as business_name,
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at
FROM auth.users
WHERE email IN ('partner@wyshkit.com', 'admin@wyshkit.com', 'pending@wyshkit.com')
ORDER BY email;

