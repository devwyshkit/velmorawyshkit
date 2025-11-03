-- =====================================================
-- DATABASE RPC FUNCTIONS
-- Server-side business logic functions
-- =====================================================

-- Calculate cart total with promotions
CREATE OR REPLACE FUNCTION calculate_cart_total(
  p_user_id UUID
)
RETURNS TABLE (
  subtotal NUMERIC,
  discount_amount NUMERIC,
  delivery_fee NUMERIC,
  tax_amount NUMERIC,
  total NUMERIC,
  eligible_for_free_delivery BOOLEAN
) AS $$
DECLARE
  v_subtotal NUMERIC := 0;
  v_discount NUMERIC := 0;
  v_delivery NUMERIC := 50;
  v_tax NUMERIC := 0;
  v_total NUMERIC := 0;
  v_free_delivery_threshold NUMERIC := 1000;
BEGIN
  -- Calculate subtotal
  SELECT COALESCE(SUM(price * quantity), 0)
  INTO v_subtotal
  FROM cart_items
  WHERE user_id = p_user_id;
  
  -- Apply delivery fee (free if over threshold)
  IF v_subtotal >= v_free_delivery_threshold THEN
    v_delivery := 0;
  END IF;
  
  -- Calculate tax (18% GST)
  v_tax := ROUND((v_subtotal * 0.18)::numeric, 2);
  
  -- Calculate total
  v_total := v_subtotal + v_delivery + v_tax - v_discount;
  
  RETURN QUERY SELECT
    v_subtotal,
    v_discount,
    v_delivery,
    v_tax,
    v_total,
    v_subtotal >= v_free_delivery_threshold;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply promo code
CREATE OR REPLACE FUNCTION apply_promo_code(
  p_code TEXT,
  p_user_id UUID,
  p_cart_total NUMERIC
)
RETURNS TABLE (
  valid BOOLEAN,
  discount_amount NUMERIC,
  discount_type TEXT,
  message TEXT
) AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
  v_uses_count INTEGER;
  v_user_uses_count INTEGER;
  v_discount NUMERIC := 0;
BEGIN
  -- Find promo code
  SELECT * INTO v_promo
  FROM promo_codes
  WHERE code = UPPER(p_code)
    AND is_active = true
    AND valid_from <= NOW()
    AND valid_until >= NOW();
  
  -- Check if code exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0::NUMERIC, 'error'::TEXT, 'Invalid promo code'::TEXT;
    RETURN;
  END IF;
  
  -- Check min cart value
  IF p_cart_total < v_promo.min_cart_value THEN
    RETURN QUERY SELECT 
      false, 
      0::NUMERIC, 
      'error'::TEXT, 
      format('Minimum order value: ₹%s', v_promo.min_cart_value)::TEXT;
    RETURN;
  END IF;
  
  -- Check total uses
  IF v_promo.max_uses IS NOT NULL THEN
    SELECT COUNT(*) INTO v_uses_count
    FROM promo_code_usage
    WHERE promo_code_id = v_promo.id;
    
    IF v_uses_count >= v_promo.max_uses THEN
      RETURN QUERY SELECT false, 0::NUMERIC, 'error'::TEXT, 'Promo code expired'::TEXT;
      RETURN;
    END IF;
  END IF;
  
  -- Check user uses
  SELECT COUNT(*) INTO v_user_uses_count
  FROM promo_code_usage
  WHERE promo_code_id = v_promo.id
    AND user_id = p_user_id;
  
  IF v_user_uses_count >= v_promo.max_uses_per_user THEN
    RETURN QUERY SELECT false, 0::NUMERIC, 'error'::TEXT, 'You have already used this code'::TEXT;
    RETURN;
  END IF;
  
  -- Calculate discount
  IF v_promo.discount_type = 'percentage' THEN
    v_discount := LEAST(
      ROUND((p_cart_total * v_promo.discount_value / 100)::numeric, 2),
      COALESCE(v_promo.max_discount, p_cart_total)
    );
  ELSIF v_promo.discount_type = 'fixed' THEN
    v_discount := LEAST(v_promo.discount_value, p_cart_total);
  ELSIF v_promo.discount_type = 'free_shipping' THEN
    v_discount := 50; -- Standard delivery fee
  END IF;
  
  RETURN QUERY SELECT true, v_discount, v_promo.discount_type, 'Discount applied'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get order timeline
CREATE OR REPLACE FUNCTION get_order_timeline(
  p_order_id UUID
)
RETURNS JSONB
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_has_custom BOOLEAN;
  v_timeline JSONB;
BEGIN
  -- Get order details
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id;
  
  IF NOT FOUND THEN
    RETURN '[]'::JSONB;
  END IF;
  
  -- Check if order has custom items
  SELECT EXISTS (
    SELECT 1
    FROM order_items
    WHERE order_id = p_order_id
      AND preview_status IS NOT NULL
  ) INTO v_has_custom;
  
  -- Build timeline based on status and custom items
  IF v_has_custom THEN
    v_timeline := '[
      {"label": "Order Placed", "status": "completed"},
      {"label": "Upload Your Files", "status": "active"},
      {"label": "Preview Ready", "status": "pending"},
      {"label": "Approved & Production Started", "status": "pending"},
      {"label": "Packed & Ready", "status": "pending"},
      {"label": "Out for Delivery", "status": "pending"},
      {"label": "Delivered", "status": "pending"}
    ]'::JSONB;
  ELSE
    v_timeline := '[
      {"label": "Order Placed", "status": "completed"},
      {"label": "Preparing Your Order", "status": "active"},
      {"label": "Out for Delivery", "status": "pending"},
      {"label": "Delivered", "status": "pending"}
    ]'::JSONB;
  END IF;
  
  RETURN v_timeline;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check stock availability
CREATE OR REPLACE FUNCTION check_stock_availability(
  p_item_id UUID,
  p_quantity INTEGER
)
RETURNS TABLE (
  available BOOLEAN,
  current_stock INTEGER,
  message TEXT
) AS $$
DECLARE
  v_stock INTEGER;
BEGIN
  SELECT stock_quantity INTO v_stock
  FROM store_items
  WHERE id = p_item_id;
  
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 0, 'Item not found'::TEXT;
    RETURN;
  END IF;
  
  IF v_stock IS NULL OR v_stock < p_quantity THEN
    RETURN QUERY SELECT 
      false, 
      COALESCE(v_stock, 0), 
      format('Only %s units available', COALESCE(v_stock, 0))::TEXT;
    RETURN;
  END IF;
  
  RETURN QUERY SELECT true, v_stock, 'In stock'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON FUNCTION calculate_cart_total IS 'Calculate cart total with discounts and delivery';
COMMENT ON FUNCTION apply_promo_code IS 'Validate and apply promo code to cart';
COMMENT ON FUNCTION get_order_timeline IS 'Generate dynamic order timeline based on status';
COMMENT ON FUNCTION check_stock_availability IS 'Check real-time stock availability';

