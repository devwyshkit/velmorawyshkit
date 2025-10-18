-- ============================================
-- Partner Platform Schema
-- Mobile-first partner dashboard with IDfy KYC
-- ============================================

-- Partner Business Profiles (extends current partners table for auth users)
CREATE TABLE IF NOT EXISTS partner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  business_name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Tech Gifts', 'Gourmet', 'Chocolates', 'Personalized', 'Premium', 'Food & Beverage', 'Other')),
  tagline TEXT,
  email TEXT NOT NULL,
  phone TEXT NOT NULL CHECK (phone ~ '^[6-9][0-9]{9}$'),
  
  -- KYC Documents
  pan_number TEXT UNIQUE CHECK (pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]{1}$'),
  pan_verified BOOLEAN DEFAULT FALSE,
  gst_number TEXT UNIQUE CHECK (gst_number IS NULL OR gst_number ~ '^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$'),
  gst_verified BOOLEAN DEFAULT FALSE,
  tan_number TEXT CHECK (tan_number IS NULL OR tan_number ~ '^[A-Z]{4}[0-9]{5}[A-Z]{1}$'),
  tan_verified BOOLEAN DEFAULT FALSE,
  
  -- IDfy verification request IDs
  idfy_pan_request_id TEXT,
  idfy_gst_request_id TEXT,
  idfy_bank_request_id TEXT,
  
  -- Business Address
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  pincode TEXT NOT NULL CHECK (pincode ~ '^\d{6}$'),
  
  -- Bank Details
  bank_account_number TEXT NOT NULL,
  bank_ifsc TEXT NOT NULL CHECK (bank_ifsc ~ '^[A-Z]{4}0[A-Z0-9]{6}$'),
  bank_account_holder TEXT NOT NULL,
  bank_verified BOOLEAN DEFAULT FALSE,
  
  -- Status & Approval
  onboarding_status TEXT DEFAULT 'incomplete' CHECK (onboarding_status IN ('incomplete', 'pending_review', 'approved', 'rejected')),
  onboarding_step INT DEFAULT 1 CHECK (onboarding_step BETWEEN 1 AND 4),
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  
  -- Locations (multi-warehouse support - JSONB array)
  warehouse_locations JSONB DEFAULT '[]'::jsonb,
  
  -- Settings
  lead_time_days INT DEFAULT 3 CHECK (lead_time_days > 0),
  accepts_customization BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Product Catalog (partner's own products)
CREATE TABLE IF NOT EXISTS partner_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partner_profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  short_desc TEXT,
  category TEXT NOT NULL,
  
  -- Pricing (stored as paise for precision)
  price INTEGER NOT NULL CHECK (price > 0),
  original_price INTEGER CHECK (original_price IS NULL OR original_price > price),
  
  -- Images (Supabase Storage URLs)
  image_url TEXT NOT NULL,
  additional_images TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Inventory (multi-location support)
  stock_by_location JSONB DEFAULT '{}'::jsonb,
  total_stock INT DEFAULT 0 CHECK (total_stock >= 0),
  
  -- Specifications
  weight TEXT,
  dimensions TEXT,
  is_customizable BOOLEAN DEFAULT FALSE,
  customization_options JSONB DEFAULT '[]'::jsonb,
  
  -- Lead Time
  preparation_days INT DEFAULT 3 CHECK (preparation_days > 0),
  estimated_delivery_days TEXT DEFAULT '3-5 days',
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Full-text search
  search_vector TSVECTOR
);

-- Hamper Builder (multi-product assemblies - UNIQUE to gifting)
CREATE TABLE IF NOT EXISTS partner_hampers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partner_profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  short_desc TEXT,
  
  -- Components (products included in hamper)
  -- Format: [{"product_id": "uuid", "quantity": 2, "source": "own"|"vendor"}]
  components JSONB NOT NULL,
  
  -- Pricing (stored as paise)
  price INTEGER NOT NULL CHECK (price > 0),
  original_price INTEGER CHECK (original_price IS NULL OR original_price > price),
  
  -- Images
  mockup_image_url TEXT NOT NULL,
  component_images TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Inventory
  stock INT DEFAULT 0 CHECK (stock >= 0),
  
  -- Lead Time (longer for assembly)
  preparation_days INT DEFAULT 5 CHECK (preparation_days > 0),
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sourcing Hub (partners source from vendors - UNIQUE to Wyshkit)
CREATE TABLE IF NOT EXISTS sourcing_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partner_profiles(id) ON DELETE CASCADE NOT NULL,
  vendor_product_id UUID,
  vendor_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  target_price INTEGER CHECK (target_price IS NULL OR target_price > 0),
  
  -- Routing (auto-select nearest stock)
  preferred_location TEXT,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'fulfilled', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders (partner fulfillment view)
CREATE TABLE IF NOT EXISTS partner_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL,
  partner_id UUID REFERENCES partner_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Order Items (JSONB for flexibility)
  items JSONB NOT NULL,
  
  -- Fulfillment
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'dispatched', 'completed', 'cancelled')),
  proof_images TEXT[] DEFAULT ARRAY[]::TEXT[],
  proof_approved BOOLEAN DEFAULT FALSE,
  proof_approved_at TIMESTAMPTZ,
  
  -- Tracking
  tracking_number TEXT,
  dispatched_at TIMESTAMPTZ,
  
  -- Financials (stored as paise)
  total_amount INTEGER NOT NULL CHECK (total_amount > 0),
  commission_rate DECIMAL(5,2) DEFAULT 15.00 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  partner_payout INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Earnings & Payouts
CREATE TABLE IF NOT EXISTS partner_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID REFERENCES partner_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Period
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL CHECK (year >= 2025),
  
  -- Financials (stored as paise)
  total_sales INTEGER DEFAULT 0 CHECK (total_sales >= 0),
  commission_amount INTEGER DEFAULT 0 CHECK (commission_amount >= 0),
  net_earnings INTEGER DEFAULT 0 CHECK (net_earnings >= 0),
  
  -- Payout
  payout_status TEXT DEFAULT 'pending' CHECK (payout_status IN ('pending', 'processing', 'paid')),
  payout_date TIMESTAMPTZ,
  razorpay_payout_id TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique constraint: one record per partner per month
  UNIQUE(partner_id, month, year)
);

-- Admin Activity Log
CREATE TABLE IF NOT EXISTS admin_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('approve_partner', 'reject_partner', 'suspend_partner', 'approve_product', 'other')),
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Indexes for Performance
-- ============================================

CREATE INDEX idx_partner_profiles_user ON partner_profiles(user_id);
CREATE INDEX idx_partner_profiles_status ON partner_profiles(onboarding_status);
CREATE INDEX idx_partner_products_partner ON partner_products(partner_id);
CREATE INDEX idx_partner_products_active ON partner_products(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_partner_orders_partner ON partner_orders(partner_id);
CREATE INDEX idx_partner_orders_status ON partner_orders(status);
CREATE INDEX idx_partner_earnings_partner ON partner_earnings(partner_id);
CREATE INDEX idx_admin_actions_admin ON admin_actions(admin_id);
CREATE INDEX idx_admin_actions_type ON admin_actions(action_type);

-- Full-text search for partner products
CREATE INDEX idx_partner_products_search ON partner_products USING GIN(search_vector);

-- ============================================
-- Triggers
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_partner_profiles_updated_at BEFORE UPDATE ON partner_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partner_products_updated_at BEFORE UPDATE ON partner_products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partner_orders_updated_at BEFORE UPDATE ON partner_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sourcing_requests_updated_at BEFORE UPDATE ON sourcing_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-update search vector for partner products
CREATE TRIGGER update_partner_products_search
BEFORE INSERT OR UPDATE ON partner_products
FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.english', name, description, short_desc, category);

-- Auto-calculate partner payout on order insert/update
CREATE OR REPLACE FUNCTION calculate_partner_payout()
RETURNS TRIGGER AS $$
BEGIN
  NEW.partner_payout = NEW.total_amount - FLOOR(NEW.total_amount * NEW.commission_rate / 100);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_payout_before_insert BEFORE INSERT ON partner_orders FOR EACH ROW EXECUTE FUNCTION calculate_partner_payout();
CREATE TRIGGER calculate_payout_before_update BEFORE UPDATE OF total_amount, commission_rate ON partner_orders FOR EACH ROW EXECUTE FUNCTION calculate_partner_payout();

-- ============================================
-- Row Level Security (RLS)
-- ============================================

ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_hampers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sourcing_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_actions ENABLE ROW LEVEL SECURITY;

-- Partners can view and update their own profile
CREATE POLICY "Partners view own profile" ON partner_profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Partners update own profile" ON partner_profiles FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Partners insert own profile" ON partner_profiles FOR INSERT WITH CHECK (user_id = auth.uid());

-- Partners can manage their own products
CREATE POLICY "Partners view own products" ON partner_products FOR SELECT USING (partner_id IN (SELECT id FROM partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Partners insert own products" ON partner_products FOR INSERT WITH CHECK (partner_id IN (SELECT id FROM partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Partners update own products" ON partner_products FOR UPDATE USING (partner_id IN (SELECT id FROM partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Partners delete own products" ON partner_products FOR DELETE USING (partner_id IN (SELECT id FROM partner_profiles WHERE user_id = auth.uid()));

-- Customers can view active products from approved partners
CREATE POLICY "Customers view active products" ON partner_products FOR SELECT USING (
  is_active = TRUE AND 
  partner_id IN (SELECT id FROM partner_profiles WHERE onboarding_status = 'approved')
);

-- Partners can manage their own hampers
CREATE POLICY "Partners view own hampers" ON partner_hampers FOR SELECT USING (partner_id IN (SELECT id FROM partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Partners insert own hampers" ON partner_hampers FOR INSERT WITH CHECK (partner_id IN (SELECT id FROM partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Partners update own hampers" ON partner_hampers FOR UPDATE USING (partner_id IN (SELECT id FROM partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Partners delete own hampers" ON partner_hampers FOR DELETE USING (partner_id IN (SELECT id FROM partner_profiles WHERE user_id = auth.uid()));

-- Partners can manage their own sourcing requests
CREATE POLICY "Partners view own sourcing" ON sourcing_requests FOR SELECT USING (partner_id IN (SELECT id FROM partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Partners insert own sourcing" ON sourcing_requests FOR INSERT WITH CHECK (partner_id IN (SELECT id FROM partner_profiles WHERE user_id = auth.uid()));

-- Partners can view their own orders
CREATE POLICY "Partners view own orders" ON partner_orders FOR SELECT USING (partner_id IN (SELECT id FROM partner_profiles WHERE user_id = auth.uid()));
CREATE POLICY "Partners update own orders" ON partner_orders FOR UPDATE USING (partner_id IN (SELECT id FROM partner_profiles WHERE user_id = auth.uid()));

-- Partners can view their own earnings
CREATE POLICY "Partners view own earnings" ON partner_earnings FOR SELECT USING (partner_id IN (SELECT id FROM partner_profiles WHERE user_id = auth.uid()));

-- Admins can view all admin actions
CREATE POLICY "Admins view all actions" ON admin_actions FOR SELECT USING (TRUE);
CREATE POLICY "Admins insert actions" ON admin_actions FOR INSERT WITH CHECK (TRUE);

-- ============================================
-- Sample Data (for development)
-- ============================================

-- Insert sample partner profile (for testing)
-- Commented out - uncomment when needed
-- INSERT INTO partner_profiles (
--   user_id, business_name, display_name, category, email, phone,
--   pan_number, address_line1, city, state, pincode,
--   bank_account_number, bank_ifsc, bank_account_holder,
--   onboarding_status
-- ) VALUES (
--   '00000000-0000-0000-0000-000000000001',
--   'Premium Gifts Co Private Limited',
--   'Premium Gifts Co',
--   'Tech Gifts',
--   'partner@premiumgifts.com',
--   '9876543210',
--   'AAAAA9999A',
--   'Shop No. 123, Tech Park',
--   'Bangalore',
--   'Karnataka',
--   '560001',
--   '1234567890',
--   'HDFC0000123',
--   'Premium Gifts Co',
--   'approved'
-- );

-- Grant necessary permissions (run as superuser)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

