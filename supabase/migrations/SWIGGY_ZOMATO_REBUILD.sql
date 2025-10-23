-- ============================================================================
-- SWIGGY/ZOMATO STYLE PLATFORM REBUILD
-- Complete database schema update for tiered pricing, delivery fees,
-- commission management, and B2B procurement (Wyshkit Supply)
-- ============================================================================

-- ============================================================================
-- PHASE 1: PRODUCT SCHEMA UPDATES FOR TIERED PRICING
-- ============================================================================

-- Add listing_type enum
DO $$ BEGIN
  CREATE TYPE listing_type AS ENUM ('individual', 'hamper', 'service');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Update partner_products table with new columns
ALTER TABLE public.partner_products 
ADD COLUMN IF NOT EXISTS listing_type listing_type DEFAULT 'individual',
ADD COLUMN IF NOT EXISTS tiered_pricing JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS whats_included JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS delivery_time_tiers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS preview_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_made_to_order BOOLEAN DEFAULT false;

-- Update add_ons structure to support standard vs bulk add-ons
-- add_ons JSONB structure:
-- [
--   {
--     "id": "uuid",
--     "name": "Premium Gift Wrapping",
--     "description": "Luxury fabric wrap with ribbon",
--     "price": 10000,
--     "type": "standard",
--     "requiresProof": false
--   },
--   {
--     "id": "uuid",
--     "name": "Company Branding",
--     "description": "Add your company logo and message",
--     "price": 20000,
--     "type": "bulk",
--     "minimumOrder": 50,
--     "requiresPreview": true,
--     "requiresProof": true
--   }
-- ]

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_partner_products_listing_type 
ON public.partner_products(listing_type);

CREATE INDEX IF NOT EXISTS idx_partner_products_tiered_pricing 
ON public.partner_products USING gin(tiered_pricing) 
WHERE tiered_pricing IS NOT NULL;

-- ============================================================================
-- PHASE 2: DELIVERY FEE CONFIGURATION
-- ============================================================================

-- Create delivery_fee_config table for dynamic delivery fee calculation
CREATE TABLE IF NOT EXISTS public.delivery_fee_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  order_value_min INTEGER NOT NULL, -- in paise
  order_value_max INTEGER, -- in paise, NULL for unlimited
  fee_amount INTEGER NOT NULL, -- in paise
  distance_min_km DECIMAL(10,2) DEFAULT 0,
  distance_max_km DECIMAL(10,2), -- NULL for unlimited
  distance_surcharge INTEGER DEFAULT 0, -- in paise
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- lower number = higher priority
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_order_value CHECK (order_value_min >= 0),
  CONSTRAINT valid_fee CHECK (fee_amount >= 0)
);

-- Create platform_config table for global settings
CREATE TABLE IF NOT EXISTS public.platform_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key TEXT UNIQUE NOT NULL,
  config_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Insert default delivery fee configuration
INSERT INTO public.delivery_fee_config (rule_name, order_value_min, order_value_max, fee_amount, priority)
VALUES 
  ('Tier 1: ₹0-999', 0, 99900, 8000, 1),
  ('Tier 2: ₹1000-2499', 100000, 249900, 5000, 2),
  ('Tier 3: ₹2500-4999', 250000, 499900, 3000, 3),
  ('Tier 4: ₹5000+', 500000, NULL, 0, 4)
ON CONFLICT DO NOTHING;

-- Insert free delivery threshold
INSERT INTO public.platform_config (config_key, config_value, description)
VALUES 
  ('free_delivery_threshold', '500000', 'Order value for free delivery (in paise)')
ON CONFLICT (config_key) DO NOTHING;

-- ============================================================================
-- PHASE 3: COMMISSION MANAGEMENT
-- ============================================================================

-- Create commission_rules table
CREATE TABLE IF NOT EXISTS public.commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('default', 'category', 'vendor', 'volume')),
  category_id UUID REFERENCES public.categories(id),
  vendor_id UUID REFERENCES auth.users(id),
  order_value_min INTEGER DEFAULT 0, -- in paise
  order_value_max INTEGER, -- in paise, NULL for unlimited
  order_quantity_min INTEGER DEFAULT 0,
  order_quantity_max INTEGER,
  commission_percent DECIMAL(5,2) NOT NULL CHECK (commission_percent >= 0 AND commission_percent <= 100),
  is_active BOOLEAN DEFAULT true,
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_until TIMESTAMPTZ,
  priority INTEGER DEFAULT 0, -- lower number = higher priority
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT valid_commission CHECK (commission_percent >= 0 AND commission_percent <= 100)
);

-- Create vendor_commission_overrides table for custom vendor rates
CREATE TABLE IF NOT EXISTS public.vendor_commission_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES auth.users(id),
  commission_percent DECIMAL(5,2) NOT NULL CHECK (commission_percent >= 0 AND commission_percent <= 100),
  reason TEXT,
  is_active BOOLEAN DEFAULT true,
  effective_from TIMESTAMPTZ DEFAULT NOW(),
  effective_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(vendor_id, effective_from)
);

-- Insert default commission rules (Swiggy/Zomato pattern)
INSERT INTO public.commission_rules (rule_name, rule_type, commission_percent, priority)
VALUES 
  ('Default Commission', 'default', 18.00, 100)
ON CONFLICT DO NOTHING;

INSERT INTO public.commission_rules (rule_name, rule_type, order_quantity_min, commission_percent, priority)
VALUES 
  ('Bulk Orders (50+)', 'volume', 50, 15.00, 50),
  ('Super Bulk (200+)', 'volume', 200, 12.00, 40)
ON CONFLICT DO NOTHING;

-- Create indexes for commission lookups
CREATE INDEX IF NOT EXISTS idx_commission_rules_type ON public.commission_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_commission_rules_vendor ON public.commission_rules(vendor_id) WHERE vendor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_commission_rules_category ON public.commission_rules(category_id) WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_commission_rules_active ON public.commission_rules(is_active) WHERE is_active = true;

-- ============================================================================
-- PHASE 4: WYSHKIT SUPPLY (B2B PROCUREMENT)
-- ============================================================================

-- Create brands table for wholesale suppliers
CREATE TABLE IF NOT EXISTS public.brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL UNIQUE,
  brand_logo TEXT,
  description TEXT,
  is_verified BOOLEAN DEFAULT false,
  warehouse_location TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create supply_products table for wholesale products
CREATE TABLE IF NOT EXISTS public.supply_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  product_description TEXT,
  product_images JSONB DEFAULT '[]'::jsonb,
  wholesale_price INTEGER NOT NULL, -- in paise
  retail_price INTEGER, -- MRP for reference, in paise
  minimum_order_qty INTEGER NOT NULL DEFAULT 10,
  maximum_order_qty INTEGER,
  stock_available INTEGER DEFAULT 0,
  lead_time_days INTEGER DEFAULT 5,
  warranty_info TEXT,
  technical_specs JSONB DEFAULT '{}'::jsonb,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT valid_wholesale_price CHECK (wholesale_price > 0),
  CONSTRAINT valid_moq CHECK (minimum_order_qty > 0)
);

-- Create supply_orders table for B2B procurement tracking
CREATE TABLE IF NOT EXISTS public.supply_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL,
  partner_id UUID NOT NULL REFERENCES auth.users(id),
  items JSONB NOT NULL, -- Array of {supply_product_id, quantity, price}
  subtotal INTEGER NOT NULL, -- in paise
  platform_fee INTEGER NOT NULL DEFAULT 0, -- 7% of subtotal, in paise
  gst_amount INTEGER NOT NULL DEFAULT 0, -- 18% of (subtotal + platform_fee), in paise
  delivery_fee INTEGER DEFAULT 0, -- in paise
  total_amount INTEGER NOT NULL, -- in paise
  delivery_address JSONB NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  order_status TEXT DEFAULT 'pending' CHECK (order_status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  tracking_info JSONB DEFAULT '{}'::jsonb,
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  invoice_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for supply tables
CREATE INDEX IF NOT EXISTS idx_supply_products_brand ON public.supply_products(brand_id);
CREATE INDEX IF NOT EXISTS idx_supply_products_active ON public.supply_products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_supply_orders_partner ON public.supply_orders(partner_id);
CREATE INDEX IF NOT EXISTS idx_supply_orders_status ON public.supply_orders(order_status);

-- ============================================================================
-- PHASE 5: ORDER ENHANCEMENTS FOR PREVIEW WORKFLOW
-- ============================================================================

-- Add preview workflow columns to orders table (if not exists)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS has_customization BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS preview_status TEXT CHECK (preview_status IN ('not_required', 'pending', 'uploaded', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS preview_url TEXT,
ADD COLUMN IF NOT EXISTS preview_uploaded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS preview_approved_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS can_be_refunded BOOLEAN DEFAULT true;

-- Create order_previews table for customization approval workflow
CREATE TABLE IF NOT EXISTS public.order_previews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  preview_url TEXT NOT NULL,
  preview_type TEXT DEFAULT 'image', -- image, pdf, video
  uploaded_by UUID REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  customer_feedback TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_previews_order ON public.order_previews(order_id);

-- ============================================================================
-- PHASE 6: HELPER FUNCTIONS
-- ============================================================================

-- Function to calculate tiered price based on quantity
CREATE OR REPLACE FUNCTION calculate_tiered_price(
  p_tiered_pricing JSONB,
  p_quantity INTEGER
) RETURNS TABLE (
  price_per_item INTEGER,
  total_price INTEGER,
  discount_percent DECIMAL,
  tier_info JSONB
) AS $$
DECLARE
  v_tier JSONB;
  v_best_tier JSONB;
BEGIN
  -- Find the applicable tier
  FOR v_tier IN SELECT * FROM jsonb_array_elements(p_tiered_pricing)
  LOOP
    IF (v_tier->>'minQty')::INTEGER <= p_quantity AND 
       ((v_tier->>'maxQty')::INTEGER IS NULL OR (v_tier->>'maxQty')::INTEGER >= p_quantity) THEN
      v_best_tier := v_tier;
    END IF;
  END LOOP;
  
  -- Return calculated values
  IF v_best_tier IS NOT NULL THEN
    RETURN QUERY SELECT 
      (v_best_tier->>'pricePerItem')::INTEGER,
      (v_best_tier->>'pricePerItem')::INTEGER * p_quantity,
      (v_best_tier->>'discountPercent')::DECIMAL,
      v_best_tier;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate delivery fee
CREATE OR REPLACE FUNCTION calculate_delivery_fee(
  p_order_value INTEGER,
  p_distance_km DECIMAL DEFAULT 0
) RETURNS TABLE (
  fee INTEGER,
  is_free BOOLEAN,
  amount_needed_for_free INTEGER,
  message TEXT
) AS $$
DECLARE
  v_config RECORD;
  v_free_threshold INTEGER;
BEGIN
  -- Get free delivery threshold
  SELECT (config_value::TEXT)::INTEGER INTO v_free_threshold
  FROM public.platform_config 
  WHERE config_key = 'free_delivery_threshold';
  
  -- Check if order qualifies for free delivery
  IF p_order_value >= v_free_threshold THEN
    RETURN QUERY SELECT 
      0::INTEGER,
      true,
      0::INTEGER,
      'FREE Delivery'::TEXT;
    RETURN;
  END IF;
  
  -- Find applicable delivery fee tier
  SELECT * INTO v_config
  FROM public.delivery_fee_config
  WHERE is_active = true
    AND p_order_value >= order_value_min
    AND (order_value_max IS NULL OR p_order_value < order_value_max)
  ORDER BY priority ASC
  LIMIT 1;
  
  IF v_config IS NOT NULL THEN
    RETURN QUERY SELECT 
      v_config.fee_amount::INTEGER,
      false,
      (v_free_threshold - p_order_value)::INTEGER,
      format('Add ₹%s more for FREE delivery', ((v_free_threshold - p_order_value) / 100)::TEXT);
  ELSE
    -- Default fee if no tier matches
    RETURN QUERY SELECT 
      5000::INTEGER,
      false,
      (v_free_threshold - p_order_value)::INTEGER,
      format('Add ₹%s more for FREE delivery', ((v_free_threshold - p_order_value) / 100)::TEXT);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate commission
CREATE OR REPLACE FUNCTION calculate_commission(
  p_vendor_id UUID,
  p_order_value INTEGER,
  p_order_quantity INTEGER,
  p_category_id UUID DEFAULT NULL
) RETURNS TABLE (
  commission_amount INTEGER,
  commission_percent DECIMAL,
  vendor_payout INTEGER,
  applied_rule_id UUID,
  rule_name TEXT
) AS $$
DECLARE
  v_rule RECORD;
  v_override RECORD;
BEGIN
  -- Check for vendor-specific override first
  SELECT * INTO v_override
  FROM public.vendor_commission_overrides
  WHERE vendor_id = p_vendor_id
    AND is_active = true
    AND effective_from <= NOW()
    AND (effective_until IS NULL OR effective_until > NOW())
  ORDER BY effective_from DESC
  LIMIT 1;
  
  IF v_override IS NOT NULL THEN
    RETURN QUERY SELECT 
      (p_order_value * v_override.commission_percent / 100)::INTEGER,
      v_override.commission_percent,
      (p_order_value * (100 - v_override.commission_percent) / 100)::INTEGER,
      v_override.id,
      'Vendor Override: ' || v_override.reason;
    RETURN;
  END IF;
  
  -- Find applicable commission rule (priority: vendor > volume > category > default)
  SELECT * INTO v_rule
  FROM public.commission_rules
  WHERE is_active = true
    AND effective_from <= NOW()
    AND (effective_until IS NULL OR effective_until > NOW())
    AND (
      (rule_type = 'vendor' AND vendor_id = p_vendor_id) OR
      (rule_type = 'volume' AND p_order_quantity >= order_quantity_min) OR
      (rule_type = 'category' AND category_id = p_category_id) OR
      (rule_type = 'default')
    )
  ORDER BY priority ASC
  LIMIT 1;
  
  IF v_rule IS NOT NULL THEN
    RETURN QUERY SELECT 
      (p_order_value * v_rule.commission_percent / 100)::INTEGER,
      v_rule.commission_percent,
      (p_order_value * (100 - v_rule.commission_percent) / 100)::INTEGER,
      v_rule.id,
      v_rule.rule_name;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PHASE 7: UPDATE EXISTING DATA (MIGRATION)
-- ============================================================================

-- Migrate existing products to have tiered pricing structure
-- This will convert single price to a simple tier
UPDATE public.partner_products
SET tiered_pricing = jsonb_build_array(
  jsonb_build_object(
    'minQty', 1,
    'maxQty', null,
    'pricePerItem', price,
    'discountPercent', 0
  )
)
WHERE tiered_pricing IS NULL AND price IS NOT NULL;

-- Set default listing type for existing products
UPDATE public.partner_products
SET listing_type = 'individual'
WHERE listing_type IS NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Swiggy/Zomato style rebuild migration completed!';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Summary:';
  RAISE NOTICE '  - listing_type column added to partner_products';
  RAISE NOTICE '  - tiered_pricing JSONB column added';
  RAISE NOTICE '  - whats_included JSONB column added';
  RAISE NOTICE '  - delivery_time_tiers JSONB column added';
  RAISE NOTICE '  - delivery_fee_config table created with 4 tiers';
  RAISE NOTICE '  - commission_rules table created with default rules';
  RAISE NOTICE '  - vendor_commission_overrides table created';
  RAISE NOTICE '  - brands table created for Wyshkit Supply';
  RAISE NOTICE '  - supply_products table created for wholesale';
  RAISE NOTICE '  - supply_orders table created for B2B procurement';
  RAISE NOTICE '  - order_previews table created for customization workflow';
  RAISE NOTICE '  - Helper functions created:';
  RAISE NOTICE '    * calculate_tiered_price()';
  RAISE NOTICE '    * calculate_delivery_fee()';
  RAISE NOTICE '    * calculate_commission()';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Next steps:';
  RAISE NOTICE '  1. Update ProductForm component for tiered pricing';
  RAISE NOTICE '  2. Build Swiggy-style product detail page';
  RAISE NOTICE '  3. Implement dynamic delivery fee calculation';
  RAISE NOTICE '  4. Create admin commission management interface';
  RAISE NOTICE '  5. Build Wyshkit Supply B2B portal';
END $$;

