-- Fix all remaining RLS policies that query user_profiles directly
-- Update them to use is_admin_user() function for consistency
-- Following Swiggy 2025 patterns - no recursion, consistent admin checks

-- Fix orders table
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  USING (is_admin_user(auth.uid()));

-- Fix payment_transactions table
DROP POLICY IF EXISTS "Admins can view all transactions" ON payment_transactions;
CREATE POLICY "Admins can view all transactions"
  ON payment_transactions FOR SELECT
  USING (is_admin_user(auth.uid()));

-- Fix payment_refunds table
DROP POLICY IF EXISTS "Admins can view all refunds" ON payment_refunds;
CREATE POLICY "Admins can view all refunds"
  ON payment_refunds FOR SELECT
  USING (is_admin_user(auth.uid()));

-- Fix vendor_settings table
DROP POLICY IF EXISTS "Admins can view all settings" ON vendor_settings;
CREATE POLICY "Admins can view all settings"
  ON vendor_settings FOR SELECT
  USING (is_admin_user(auth.uid()));

-- Fix delivery_slots table
DROP POLICY IF EXISTS "Admins can manage slots" ON delivery_slots;
CREATE POLICY "Admins can manage slots"
  ON delivery_slots FOR ALL
  USING (is_admin_user(auth.uid()));

-- Add comments
COMMENT ON POLICY "Admins can view all orders" ON orders IS 
  'Updated to use is_admin_user() function. Migration 040.';
COMMENT ON POLICY "Admins can view all transactions" ON payment_transactions IS 
  'Updated to use is_admin_user() function. Migration 040.';
COMMENT ON POLICY "Admins can view all refunds" ON payment_refunds IS 
  'Updated to use is_admin_user() function. Migration 040.';
COMMENT ON POLICY "Admins can view all settings" ON vendor_settings IS 
  'Updated to use is_admin_user() function. Migration 040.';
COMMENT ON POLICY "Admins can manage slots" ON delivery_slots IS 
  'Updated to use is_admin_user() function. Migration 040.';

