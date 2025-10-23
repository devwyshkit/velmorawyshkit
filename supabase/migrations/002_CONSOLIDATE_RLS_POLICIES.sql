-- Consolidate multiple permissive RLS policies into single policies
-- This reduces policy evaluation overhead by combining multiple policies with OR conditions

-- dispute_messages table - consolidate 4 roles × SELECT
DROP POLICY IF EXISTS "Customers can view dispute messages" ON dispute_messages;
DROP POLICY IF EXISTS "Partners can view dispute messages" ON dispute_messages;
DROP POLICY IF EXISTS "Admins can view dispute messages" ON dispute_messages;
DROP POLICY IF EXISTS "Support can view dispute messages" ON dispute_messages;

CREATE POLICY "Users can view dispute messages" ON dispute_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM disputes 
      WHERE id = dispute_id 
      AND (customer_id = (select auth.uid()) OR partner_id = (select auth.uid()))
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role IN ('admin', 'support')
    )
  );

-- disputes table - consolidate 4 roles × SELECT
DROP POLICY IF EXISTS "Customers can view own disputes" ON disputes;
DROP POLICY IF EXISTS "Partners can view own disputes" ON disputes;
DROP POLICY IF EXISTS "Admins can view all disputes" ON disputes;
DROP POLICY IF EXISTS "Support can view all disputes" ON disputes;

CREATE POLICY "Users can view disputes" ON disputes
  FOR SELECT USING (
    customer_id = (select auth.uid()) 
    OR partner_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role IN ('admin', 'support')
    )
  );

-- partner_badges table - consolidate 4 roles × SELECT
DROP POLICY IF EXISTS "Partners can view own badges" ON partner_badges;
DROP POLICY IF EXISTS "Admins can view all badges" ON partner_badges;
DROP POLICY IF EXISTS "Support can view all badges" ON partner_badges;
DROP POLICY IF EXISTS "Customers can view badges" ON partner_badges;

CREATE POLICY "Users can view badges" ON partner_badges
  FOR SELECT USING (
    partner_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role IN ('admin', 'support', 'customer')
    )
  );

-- partner_products table - consolidate 4 roles × SELECT/INSERT/UPDATE (12 total)
DROP POLICY IF EXISTS "Partners can view own products" ON partner_products;
DROP POLICY IF EXISTS "Admins can view all products" ON partner_products;
DROP POLICY IF EXISTS "Support can view all products" ON partner_products;
DROP POLICY IF EXISTS "Customers can view products" ON partner_products;

CREATE POLICY "Users can view products" ON partner_products
  FOR SELECT USING (
    partner_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role IN ('admin', 'support', 'customer')
    )
  );

-- partner_profiles table - consolidate 4 roles × SELECT/UPDATE (8 total)
DROP POLICY IF EXISTS "Partners can view own profile" ON partner_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON partner_profiles;
DROP POLICY IF EXISTS "Support can view all profiles" ON partner_profiles;
DROP POLICY IF EXISTS "Customers can view profiles" ON partner_profiles;

CREATE POLICY "Users can view profiles" ON partner_profiles
  FOR SELECT USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role IN ('admin', 'support', 'customer')
    )
  );

-- partner_referrals table - consolidate 4 roles × SELECT
DROP POLICY IF EXISTS "Partners can view own referrals" ON partner_referrals;
DROP POLICY IF EXISTS "Admins can view all referrals" ON partner_referrals;
DROP POLICY IF EXISTS "Support can view all referrals" ON partner_referrals;
DROP POLICY IF EXISTS "Customers can view referrals" ON partner_referrals;

CREATE POLICY "Users can view referrals" ON partner_referrals
  FOR SELECT USING (
    partner_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role IN ('admin', 'support', 'customer')
    )
  );

-- referral_codes table - consolidate 4 roles × SELECT
DROP POLICY IF EXISTS "Partners can view own referral codes" ON referral_codes;
DROP POLICY IF EXISTS "Admins can view all referral codes" ON referral_codes;
DROP POLICY IF EXISTS "Support can view all referral codes" ON referral_codes;
DROP POLICY IF EXISTS "Customers can view referral codes" ON referral_codes;

CREATE POLICY "Users can view referral codes" ON referral_codes
  FOR SELECT USING (
    partner_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role IN ('admin', 'support', 'customer')
    )
  );

-- returns table - consolidate 4 roles × SELECT
DROP POLICY IF EXISTS "Customers can view own returns" ON returns;
DROP POLICY IF EXISTS "Partners can view own returns" ON returns;
DROP POLICY IF EXISTS "Admins can view all returns" ON returns;
DROP POLICY IF EXISTS "Support can view all returns" ON returns;

CREATE POLICY "Users can view returns" ON returns
  FOR SELECT USING (
    customer_id = (select auth.uid()) 
    OR partner_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role IN ('admin', 'support')
    )
  );

-- reviews table - consolidate 4 roles × SELECT
DROP POLICY IF EXISTS "Customers can view reviews" ON reviews;
DROP POLICY IF EXISTS "Partners can view reviews" ON reviews;
DROP POLICY IF EXISTS "Admins can view all reviews" ON reviews;
DROP POLICY IF EXISTS "Support can view all reviews" ON reviews;

CREATE POLICY "Users can view reviews" ON reviews
  FOR SELECT USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role IN ('admin', 'support', 'partner')
    )
  );
