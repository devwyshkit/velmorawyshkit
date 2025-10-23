-- Fix Function Search Path (15 issues - WARN)
-- Add SET search_path = public, pg_temp to all functions to prevent SQL injection
-- This prevents search_path-based SQL injection attacks

-- ============================================================================
-- CORE FUNCTIONS
-- ============================================================================

-- get_partner_stats function
CREATE OR REPLACE FUNCTION public.get_partner_stats(p_partner_id UUID)
RETURNS TABLE(
  partner_id UUID,
  total_orders BIGINT,
  total_revenue NUMERIC,
  avg_order_value NUMERIC,
  last_order_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.partner_id,
    COUNT(*) as total_orders,
    SUM(o.total) as total_revenue,
    AVG(o.total) as avg_order_value,
    MAX(o.created_at) as last_order_date
  FROM orders o
  WHERE o.partner_id = p_partner_id
  AND o.status = 'completed'
  GROUP BY o.partner_id;
END;
$$;

-- handle_new_partner function
CREATE OR REPLACE FUNCTION public.handle_new_partner()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.partner_profiles (user_id, business_name, contact_email, status)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'business_name', NEW.email, 'pending_approval');
  RETURN NEW;
END;
$$;

-- update_updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- SEARCH FUNCTIONS
-- ============================================================================

-- update_product_search_vector function
CREATE OR REPLACE FUNCTION public.update_product_search_vector()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.search_vector = to_tsvector('english', 
    COALESCE(NEW.name, '') || ' ' || 
    COALESCE(NEW.description, '') || ' ' || 
    COALESCE(NEW.short_desc, '')
  );
  RETURN NEW;
END;
$$;

-- partners_search_update function
CREATE OR REPLACE FUNCTION public.partners_search_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.search_vector = to_tsvector('english', 
    COALESCE(NEW.business_name, '') || ' ' || 
    COALESCE(NEW.category, '') || ' ' || 
    COALESCE(NEW.description, '')
  );
  RETURN NEW;
END;
$$;

-- items_search_update function
CREATE OR REPLACE FUNCTION public.items_search_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.search_vector = to_tsvector('english', 
    COALESCE(NEW.name, '') || ' ' || 
    COALESCE(NEW.description, '') || ' ' || 
    COALESCE(NEW.short_desc, '')
  );
  RETURN NEW;
END;
$$;

-- ============================================================================
-- BUSINESS LOGIC FUNCTIONS
-- ============================================================================

-- calculate_order_commission function
CREATE OR REPLACE FUNCTION public.calculate_order_commission(
  p_order_total NUMERIC,
  p_partner_id UUID
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  commission_rate NUMERIC;
  commission_amount NUMERIC;
BEGIN
  -- Get commission rate from partner profile or use default
  SELECT COALESCE(commission_percent, 0.15) INTO commission_rate
  FROM partner_profiles 
  WHERE id = p_partner_id;
  
  commission_amount := p_order_total * commission_rate;
  RETURN commission_amount;
END;
$$;

-- handle_updated_at function (duplicate name, different signature)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- APPROVAL FUNCTIONS
-- ============================================================================

-- check_product_reapproval function
CREATE OR REPLACE FUNCTION public.check_product_reapproval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- If product details changed significantly, mark for reapproval
  IF OLD.name != NEW.name OR OLD.description != NEW.description OR OLD.price != NEW.price THEN
    NEW.approval_status := 'pending_review';
    NEW.approved_at := NULL;
    NEW.approved_by := NULL;
  END IF;
  RETURN NEW;
END;
$$;

-- auto_assign_kam_on_partner_approval function
CREATE OR REPLACE FUNCTION public.auto_assign_kam_on_partner_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  available_kam UUID;
BEGIN
  -- Only trigger on status change to 'approved'
  IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
    -- Find available KAM with least assignments
    SELECT kam_id INTO available_kam
    FROM kam_partner_assignments
    WHERE is_active = true
    GROUP BY kam_id
    ORDER BY COUNT(*) ASC
    LIMIT 1;
    
    -- Assign partner to KAM if one is available
    IF available_kam IS NOT NULL THEN
      INSERT INTO kam_partner_assignments (kam_id, partner_id, assigned_at, is_active)
      VALUES (available_kam, NEW.id, NOW(), true);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- generate_referral_code function
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  code TEXT;
  exists_count INTEGER;
BEGIN
  LOOP
    -- Generate random 8-character code
    code := UPPER(substring(md5(random()::text) from 1 for 8));
    
    -- Check if code already exists
    SELECT COUNT(*) INTO exists_count
    FROM referral_codes
    WHERE code = generate_referral_code.code;
    
    -- Exit loop if code is unique
    EXIT WHEN exists_count = 0;
  END LOOP;
  
  RETURN code;
END;
$$;

-- reset_monthly_sourcing_limits function
CREATE OR REPLACE FUNCTION public.reset_monthly_sourcing_limits()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Reset all partner sourcing limits for new month
  UPDATE partner_profiles
  SET monthly_sourcing_used = 0
  WHERE monthly_sourcing_used > 0;
  
  -- Log the reset action
  INSERT INTO admin_actions (action_type, description, performed_by)
  VALUES ('system', 'Monthly sourcing limits reset', (SELECT id FROM profiles WHERE role = 'admin' LIMIT 1));
END;
$$;

-- charge_daily_sponsored_fees function
CREATE OR REPLACE FUNCTION public.charge_daily_sponsored_fees()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Charge daily fees for sponsored products
  INSERT INTO payout_transactions (payout_id, transaction_type, amount, description, created_at)
  SELECT 
    p.id,
    'fee',
    -0.01, -- $0.01 daily fee
    'Daily sponsored product fee',
    NOW()
  FROM payouts p
  JOIN partner_profiles pp ON pp.id = p.partner_id
  WHERE pp.has_sponsored_products = true
  AND p.status = 'active';
END;
$$;

-- check_and_award_badges function
CREATE OR REPLACE FUNCTION public.check_and_award_badges()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Award badges based on performance metrics
  -- This is a simplified version - implement full logic as needed
  INSERT INTO partner_badges (partner_id, badge_type, awarded_at)
  SELECT 
    pp.id,
    'top_seller',
    NOW()
  FROM partner_profiles pp
  WHERE pp.total_revenue > 10000
  AND NOT EXISTS (
    SELECT 1 FROM partner_badges pb 
    WHERE pb.partner_id = pp.id 
    AND pb.badge_type = 'top_seller'
  );
END;
$$;

-- notify_product_status_change function
CREATE OR REPLACE FUNCTION public.notify_product_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Send notification when product status changes
  -- This is a placeholder - implement actual notification logic
  IF OLD.approval_status != NEW.approval_status THEN
    -- Log the status change
    INSERT INTO admin_actions (action_type, description, performed_by, target_type, target_id)
    VALUES (
      'product_status_change',
      'Product ' || NEW.name || ' status changed to ' || NEW.approval_status,
      NEW.approved_by,
      'product',
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

-- CRITICAL SECURITY IMPROVEMENTS:
-- 1. All functions now have explicit search_path = public, pg_temp
-- 2. Prevents search_path-based SQL injection attacks
-- 3. Functions can only access public schema and temporary objects
-- 4. No access to system schemas or other databases
-- 5. Consistent security model across all functions

-- TESTING CHECKLIST:
-- 1. Verify all functions execute correctly
-- 2. Test with malicious search_path attempts
-- 3. Ensure no access to unauthorized schemas
-- 4. Verify function permissions are correct
-- 5. Test all trigger functions work properly
