-- ============================================================================
-- COMPLETE WYSHKIT PLATFORM REBUILD
-- Customer UI + Partner Portal + Admin Console
-- One script to rule them all! 🎯
-- ============================================================================
-- This creates EVERYTHING from scratch:
-- - All customer tables (orders, cart, wishlist)
-- - All partner tables (profiles, products, earnings)
-- - All relationships and foreign keys
-- - Test accounts for all roles
-- - Sample data so everything works together
-- ============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PART 1: NUCLEAR CLEANUP - Delete Everything
-- ============================================================================

-- Disable all constraints temporarily
SET CONSTRAINTS ALL DEFERRED;
SET session_replication_role = 'replica';

-- Drop views first
DROP VIEW IF EXISTS public.partner_earnings CASCADE;

-- Drop partner tables
DROP TABLE IF EXISTS public.partner_earnings CASCADE;
DROP TABLE IF EXISTS public.partner_products CASCADE;
DROP TABLE IF EXISTS public.partner_profiles CASCADE;

-- Drop customer tables
DROP TABLE IF EXISTS public.wishlist CASCADE;
DROP TABLE IF EXISTS public.cart CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;

-- Drop partner-specific columns from partners table if it exists
DROP TABLE IF EXISTS public.partners CASCADE;

-- Drop items table if exists
DROP TABLE IF EXISTS public.items CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_partner() CASCADE;
DROP FUNCTION IF EXISTS public.update_product_search_vector() CASCADE;
DROP FUNCTION IF EXISTS public.get_partner_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Delete ALL test accounts
DELETE FROM auth.users WHERE email IN (
  'customer@wyshkit.com',
  'partner@wyshkit.com', 
  'admin@wyshkit.com',
  'pending@wyshkit.com'
);

-- Re-enable constraints
SET session_replication_role = 'origin';

RAISE NOTICE '✅ Cleanup complete - starting fresh build...';

-- ============================================================================
-- PART 2: CUSTOMER TABLES (Customer UI needs these)
-- ============================================================================

-- 1. PARTNERS TABLE (for customer UI to browse partners)
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  rating DECIMAL(2,1) DEFAULT 4.5,
  delivery_time TEXT DEFAULT '3-5 days',
  min_order INTEGER DEFAULT 0,
  image TEXT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view partners"
  ON public.partners FOR SELECT
  USING (true);

-- 2. ITEMS TABLE (products for customer UI)
CREATE TABLE public.items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,
  image TEXT,
  category TEXT,
  badge TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view items"
  ON public.items FOR SELECT
  USING (true);

-- 3. ORDERS TABLE (customer orders)
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  partner_id UUID,  -- Will link to partner_profiles later
  order_number TEXT UNIQUE,
  customer_name TEXT,
  items TEXT,
  total INTEGER NOT NULL,
  status TEXT DEFAULT 'pending',
  partner_status TEXT DEFAULT 'pending',
  proof_urls TEXT[] DEFAULT '{}',
  proof_approved BOOLEAN DEFAULT false,
  proof_approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Users can create own orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- 4. CART TABLE
CREATE TABLE public.cart (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Enable RLS
ALTER TABLE public.cart ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own cart"
  ON public.cart FOR ALL
  USING (auth.uid() = user_id);

-- 5. WISHLIST TABLE
CREATE TABLE public.wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Enable RLS
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own wishlist"
  ON public.wishlist FOR ALL
  USING (auth.uid() = user_id);

RAISE NOTICE '✅ Customer tables created';

-- ============================================================================
-- PART 3: PARTNER PLATFORM TABLES
-- ============================================================================

-- 1. PARTNER PROFILES (extends auth.users for business partners)
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

-- Link orders.partner_id to partner_profiles
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_partner_id_fkey;
ALTER TABLE public.orders ADD CONSTRAINT orders_partner_id_fkey 
  FOREIGN KEY (partner_id) REFERENCES public.partner_profiles(id);

-- Enable RLS
ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own profile"
  ON public.partner_profiles FOR SELECT
  USING (auth.uid() = id OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

CREATE POLICY "Partners can update own profile"
  ON public.partner_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage all partners"
  ON public.partner_profiles FOR ALL
  USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'admin');

-- 2. PARTNER PRODUCTS (partner's product catalog with branding options)
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
  
  -- Branding/Customization (Swiggy/Zomato add-ons pattern)
  is_customizable BOOLEAN DEFAULT false,
  add_ons JSONB DEFAULT '[]',  -- [{name, price, moq, requiresProof, description}]
  
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

-- 3. PARTNER EARNINGS VIEW (not a table!)
CREATE VIEW public.partner_earnings AS
SELECT 
  o.partner_id,
  DATE_TRUNC('week', o.created_at) as week_start,
  DATE_TRUNC('month', o.created_at) as month_start,
  COUNT(*) as order_count,
  SUM(o.total) as gross_revenue,
  SUM(o.total * COALESCE(p.commission_percent, 0.15)) as platform_commission,
  SUM(o.total * (1 - COALESCE(p.commission_percent, 0.15))) as partner_payout,
  AVG(o.total) as avg_order_value
FROM public.orders o
LEFT JOIN public.partner_profiles p ON p.id = o.partner_id
WHERE o.status = 'completed'
GROUP BY o.partner_id, week_start, month_start;

RAISE NOTICE '✅ Partner tables created';

-- ============================================================================
-- PART 4: FUNCTIONS & TRIGGERS
-- ============================================================================

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
    (SELECT COALESCE(rating, 0.0) FROM partner_profiles WHERE id = p_partner_id)
  FROM public.orders o
  WHERE o.partner_id = p_partner_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Auto-create partner profile on signup
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

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Function: Search vector for products
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

RAISE NOTICE '✅ Functions & triggers created';

-- ============================================================================
-- PART 5: INDEXES FOR PERFORMANCE
-- ============================================================================

-- Partner indexes
CREATE INDEX idx_partner_products_partner_id ON public.partner_products(partner_id);
CREATE INDEX idx_partner_products_active ON public.partner_products(is_active) WHERE is_active = true;
CREATE INDEX idx_partner_products_search ON public.partner_products USING gin(search_vector);
CREATE INDEX idx_partner_profiles_status ON public.partner_profiles(status);

-- Order indexes
CREATE INDEX idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX idx_orders_partner_id ON public.orders(partner_id) WHERE partner_id IS NOT NULL;
CREATE INDEX idx_orders_partner_status ON public.orders(partner_status);
CREATE INDEX idx_orders_status ON public.orders(status);

-- Customer indexes
CREATE INDEX idx_cart_user_id ON public.cart(user_id);
CREATE INDEX idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX idx_items_partner_id ON public.items(partner_id);

RAISE NOTICE '✅ Indexes created';

-- ============================================================================
-- PART 6: TEST ACCOUNTS (All Roles)
-- ============================================================================

-- ACCOUNT 1: CUSTOMER (customer@wyshkit.com / Customer@123)
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated', 'authenticated', 'customer@wyshkit.com',
  crypt('Customer@123', gen_salt('bf')), NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"customer","name":"Test Customer"}',
  NOW(), NOW(), '', '', '', ''
);

-- ACCOUNT 2: PARTNER (APPROVED) (partner@wyshkit.com / Partner@123)
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

-- ACCOUNT 3: ADMIN (admin@wyshkit.com / Admin@123)
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

-- ACCOUNT 4: PENDING PARTNER (pending@wyshkit.com / Pending@123)
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

RAISE NOTICE '✅ Test accounts created (4 accounts)';

-- ============================================================================
-- PART 7: SAMPLE DATA (So everything works together)
-- ============================================================================

-- Sample partners (for customer UI to browse)
INSERT INTO public.partners (id, name, category, rating, delivery_time, image, location) VALUES
  ('99999999-1111-1111-1111-111111111111'::uuid, 'GiftCraft Co', 'Tech Gifts', 4.8, '3-5 days', '/partner-1.jpg', 'Bangalore'),
  ('99999999-2222-2222-2222-222222222222'::uuid, 'Sweet Delights', 'Chocolates', 4.6, '1-2 days', '/partner-2.jpg', 'Mumbai'),
  ('99999999-3333-3333-3333-333333333333'::uuid, 'Personalized Gifts Hub', 'Personalized', 4.7, '5-7 days', '/partner-3.jpg', 'Delhi');

-- Sample items (for customer UI)
INSERT INTO public.items (partner_id, name, description, price, category, image) VALUES
  ('99999999-1111-1111-1111-111111111111'::uuid, 'Wireless Earbuds', 'Premium sound quality', 299900, 'Electronics', '/item-1.jpg'),
  ('99999999-1111-1111-1111-111111111111'::uuid, 'Smart Watch', 'Fitness tracking', 499900, 'Electronics', '/item-2.jpg'),
  ('99999999-2222-2222-2222-222222222222'::uuid, 'Chocolate Gift Box', 'Assorted chocolates', 89900, 'Food', '/item-3.jpg'),
  ('99999999-3333-3333-3333-333333333333'::uuid, 'Custom Mug', 'Photo printed', 39900, 'Personalized', '/item-4.jpg');

-- Sample partner products (for partner dashboard)
INSERT INTO public.partner_products (
  partner_id, name, description, price, stock, is_customizable, add_ons, category, is_active
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
  'Premium Gift Hamper',
  'Curated gift hamper with premium items',
  299900,
  50,
  true,
  '[
    {"name":"Greeting Card","price":9900,"moq":1,"requiresProof":false,"description":"Add a personalized greeting card"},
    {"name":"Company Logo","price":20000,"moq":50,"requiresProof":true,"description":"Custom branding with your company logo"}
  ]'::jsonb,
  'Hampers',
  true
);

-- Sample order (links customer & partner)
INSERT INTO public.orders (
  customer_id, partner_id, order_number, customer_name, items, total, status
) VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
  'ORD-12345',
  'Test Customer',
  'Premium Gift Hamper x1',
  299900,
  'pending'
);

RAISE NOTICE '✅ Sample data created';

-- ============================================================================
-- FINAL VERIFICATION & SUCCESS MESSAGE
-- ============================================================================

DO $$
DECLARE
  table_count INTEGER;
  account_count INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO table_count 
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('orders', 'partners', 'items', 'partner_profiles', 'partner_products', 'cart', 'wishlist');
  
  -- Count accounts
  SELECT COUNT(*) INTO account_count
  FROM auth.users
  WHERE email IN ('customer@wyshkit.com', 'partner@wyshkit.com', 'admin@wyshkit.com', 'pending@wyshkit.com');
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '🎉 COMPLETE PLATFORM REBUILD SUCCESS!';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'TABLES CREATED: % of 7', table_count;
  RAISE NOTICE '  ✓ orders (customer orders)';
  RAISE NOTICE '  ✓ partners (for customer UI browsing)';
  RAISE NOTICE '  ✓ items (products for customer UI)';
  RAISE NOTICE '  ✓ partner_profiles (partner accounts)';
  RAISE NOTICE '  ✓ partner_products (partner catalog with add-ons)';
  RAISE NOTICE '  ✓ cart & wishlist';
  RAISE NOTICE '  ✓ partner_earnings (VIEW not table!)';
  RAISE NOTICE '';
  RAISE NOTICE 'TEST ACCOUNTS: % of 4', account_count;
  RAISE NOTICE '  1. Customer: customer@wyshkit.com / Customer@123';
  RAISE NOTICE '  2. Partner (APPROVED): partner@wyshkit.com / Partner@123';
  RAISE NOTICE '  3. Admin: admin@wyshkit.com / Admin@123';
  RAISE NOTICE '  4. Pending Partner (FOOD): pending@wyshkit.com / Pending@123';
  RAISE NOTICE '';
  RAISE NOTICE 'SAMPLE DATA:';
  RAISE NOTICE '  ✓ 3 browsable partners for customer UI';
  RAISE NOTICE '  ✓ 4 items for customer to browse';
  RAISE NOTICE '  ✓ 1 partner product with add-ons (branding ready!)';
  RAISE NOTICE '  ✓ 1 sample order linking customer & partner';
  RAISE NOTICE '';
  RAISE NOTICE '🚀 READY TO TEST ALL PLATFORMS!';
  RAISE NOTICE '';
  RAISE NOTICE 'Customer UI: http://localhost:8080/customer/home';
  RAISE NOTICE 'Partner Portal: http://localhost:8080/partner/login';
  RAISE NOTICE 'Admin Console: http://localhost:8080/admin/partner-approvals';
  RAISE NOTICE '═══════════════════════════════════════════════════════════';
END $$;

-- Final verification query
SELECT 
  email,
  raw_user_meta_data->>'role' as role,
  email_confirmed_at IS NOT NULL as confirmed,
  '✅ READY' as status
FROM auth.users
WHERE email IN ('customer@wyshkit.com', 'partner@wyshkit.com', 'admin@wyshkit.com', 'pending@wyshkit.com')
ORDER BY 
  CASE raw_user_meta_data->>'role'
    WHEN 'customer' THEN 1
    WHEN 'partner' THEN 2
    WHEN 'admin' THEN 3
    ELSE 4
  END;

