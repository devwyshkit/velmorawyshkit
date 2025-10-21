-- Migration: Variable Commission System
-- Description: Category-based commission + fulfillment fees + badge discounts
-- Based on Swiggy/Zomato/Amazon hybrid model

-- ============================================================================
-- 1. ADD COMMISSION FIELDS TO PARTNER_PROFILES
-- ============================================================================

-- Add category-based commission to partner_profiles
ALTER TABLE partner_profiles
ADD COLUMN IF NOT EXISTS commission_percent DECIMAL(5,2) DEFAULT 20.00,
ADD COLUMN IF NOT EXISTS fulfillment_fee INTEGER DEFAULT 5000, -- ₹50 in paise
ADD COLUMN IF NOT EXISTS badge_discount_percent DECIMAL(5,2) DEFAULT 0.00;

-- Update existing partners to use category-based commission
UPDATE partner_profiles
SET commission_percent = CASE category
  WHEN 'jewelry' THEN 1.00
  WHEN 'tech_gifts' THEN 5.00
  WHEN 'food' THEN 12.00
  WHEN 'perishables' THEN 12.00
  WHEN 'chocolates' THEN 15.00
  WHEN 'premium' THEN 18.00
  WHEN 'personalized' THEN 25.00
  ELSE 20.00
END
WHERE commission_percent = 20.00 OR commission_percent = 15.00; -- Only update defaults

-- ============================================================================
-- 2. ADD COMMISSION OVERRIDE PER PRODUCT (OPTIONAL)
-- ============================================================================

ALTER TABLE partner_products
ADD COLUMN IF NOT EXISTS custom_commission DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS commission_note TEXT;

COMMENT ON COLUMN partner_products.custom_commission IS 'Override partner-level commission for specific products (e.g., promotional items)';

-- ============================================================================
-- 3. UPDATE PAYOUTS TABLE FOR BREAKDOWN
-- ============================================================================

ALTER TABLE payouts
ADD COLUMN IF NOT EXISTS fulfillment_fees INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS badge_discount_amount INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_orders_count INTEGER DEFAULT 0;

COMMENT ON COLUMN payouts.fulfillment_fees IS 'Total fulfillment fees (₹50 × order count) in paise';
COMMENT ON COLUMN payouts.badge_discount_amount IS 'Badge loyalty discount in paise';

-- ============================================================================
-- 4. CATEGORY COMMISSION RATES REFERENCE TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS category_commission_rates (
  category VARCHAR(50) PRIMARY KEY,
  default_rate DECIMAL(5,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert industry-standard rates (based on Swiggy/Zomato/Amazon research)
INSERT INTO category_commission_rates (category, default_rate, description) VALUES
('jewelry', 1.00, 'Gold, silver, precious metals - ultra-low margin'),
('tech_gifts', 5.00, 'Electronics and tech accessories - low margin'),
('food', 12.00, 'Perishable food items - medium margin'),
('perishables', 12.00, 'Fresh products requiring quick delivery'),
('chocolates', 15.00, 'Chocolate boxes and confectionery'),
('premium', 18.00, 'Premium curated gift hampers'),
('personalized', 25.00, 'Custom/personalized gifts - high margin'),
('default', 20.00, 'All other gift categories')
ON CONFLICT (category) DO UPDATE SET
  default_rate = EXCLUDED.default_rate,
  description = EXCLUDED.description,
  updated_at = NOW();

-- ============================================================================
-- 5. BADGE DISCOUNT RATES
-- ============================================================================

CREATE TABLE IF NOT EXISTS badge_discount_rates (
  badge_type VARCHAR(50) PRIMARY KEY,
  discount_percent DECIMAL(5,2) NOT NULL,
  description TEXT
);

INSERT INTO badge_discount_rates (badge_type, discount_percent, description) VALUES
('new_star', 0.00, 'No discount for new sellers'),
('rising_seller', 2.00, '2% commission discount'),
('top_performer', 5.00, '5% commission discount'),
('quick_shipper', 2.00, '2% commission discount'),
('trusted_partner', 8.00, '8% commission discount - VIP rate')
ON CONFLICT (badge_type) DO UPDATE SET
  discount_percent = EXCLUDED.discount_percent;

-- ============================================================================
-- 6. FUNCTION: CALCULATE COMMISSION FOR AN ORDER
-- ============================================================================

CREATE OR REPLACE FUNCTION calculate_order_commission(
  p_partner_id UUID,
  p_product_id UUID,
  p_order_amount INTEGER, -- in paise
  p_includes_fulfillment BOOLEAN DEFAULT TRUE
)
RETURNS TABLE(
  base_commission INTEGER,
  fulfillment_fee INTEGER,
  badge_discount INTEGER,
  net_commission INTEGER
) AS $$
DECLARE
  v_commission_percent DECIMAL(5,2);
  v_fulfillment_fee INTEGER;
  v_badge_discount_percent DECIMAL(5,2) := 0.00;
  v_base_commission INTEGER;
  v_badge_discount INTEGER;
  v_net_commission INTEGER;
BEGIN
  -- Get partner commission rate (product custom rate or partner default)
  SELECT 
    COALESCE(pp.custom_commission, p.commission_percent)
  INTO v_commission_percent
  FROM partner_products pp
  JOIN partner_profiles p ON p.id = pp.partner_id
  WHERE pp.id = p_product_id AND pp.partner_id = p_partner_id;

  -- Get partner fulfillment fee
  SELECT fulfillment_fee INTO v_fulfillment_fee
  FROM partner_profiles WHERE id = p_partner_id;

  -- Get highest badge discount for partner
  SELECT MAX(bdr.discount_percent) INTO v_badge_discount_percent
  FROM partner_badges pb
  JOIN badge_discount_rates bdr ON bdr.badge_type = pb.badge_type
  WHERE pb.partner_id = p_partner_id;

  -- Calculate commission
  v_base_commission := ROUND(p_order_amount * v_commission_percent / 100);
  v_badge_discount := ROUND(p_order_amount * COALESCE(v_badge_discount_percent, 0) / 100);
  v_net_commission := v_base_commission - v_badge_discount;

  -- Add fulfillment fee if applicable
  IF p_includes_fulfillment THEN
    v_net_commission := v_net_commission + COALESCE(v_fulfillment_fee, 5000);
  END IF;

  -- Ensure minimum commission of ₹25
  IF v_net_commission < 2500 THEN
    v_net_commission := 2500;
  END IF;

  RETURN QUERY SELECT 
    v_base_commission,
    CASE WHEN p_includes_fulfillment THEN COALESCE(v_fulfillment_fee, 5000) ELSE 0 END,
    v_badge_discount,
    v_net_commission;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 7. INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_category_commission ON category_commission_rates(category);
CREATE INDEX IF NOT EXISTS idx_partner_commission ON partner_profiles(commission_percent);
CREATE INDEX IF NOT EXISTS idx_product_custom_commission ON partner_products(custom_commission) WHERE custom_commission IS NOT NULL;

-- ============================================================================
-- 8. COMMENTS
-- ============================================================================

COMMENT ON TABLE category_commission_rates IS 'Industry-standard commission rates by product category';
COMMENT ON TABLE badge_discount_rates IS 'Loyalty discount rates for badge holders';
COMMENT ON COLUMN partner_profiles.commission_percent IS 'Partner commission rate (category-based, can be customized)';
COMMENT ON COLUMN partner_profiles.fulfillment_fee IS 'Fee per order if platform handles shipping (default ₹50)';

-- Success message
SELECT 
  'Variable commission system created!' AS status,
  COUNT(*) AS category_rates_added
FROM category_commission_rates;

