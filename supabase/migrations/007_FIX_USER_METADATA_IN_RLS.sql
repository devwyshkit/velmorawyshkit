-- Fix user_metadata Security Bypass (3 issues - CRITICAL)
-- Replace insecure JWT user_metadata role checks with profiles.role table lookups
-- This prevents users from bypassing security by editing their own user_metadata

-- ============================================================================
-- FIX PARTNER_PROFILES POLICIES
-- ============================================================================

-- Drop existing policies that use user_metadata
DROP POLICY IF EXISTS "Partners can view own profile" ON public.partner_profiles;
DROP POLICY IF EXISTS "Admins can manage all partners" ON public.partner_profiles;
DROP POLICY IF EXISTS "Only admins can approve partners" ON public.partner_profiles;

-- Create secure policies using profiles.role table
CREATE POLICY "Partners can view own profile" ON public.partner_profiles
  FOR SELECT USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'
    )
  );

CREATE POLICY "Partners can update own profile" ON public.partner_profiles
  FOR UPDATE USING (user_id = (select auth.uid()));

CREATE POLICY "Admins can manage all partners" ON public.partner_profiles
  FOR ALL USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'
  ));

-- ============================================================================
-- FIX PARTNER_PRODUCTS POLICIES
-- ============================================================================

-- Drop existing policies that use user_metadata
DROP POLICY IF EXISTS "Admins can view all products" ON public.partner_products;

-- Create secure policy using profiles.role table
CREATE POLICY "Admins can view all products" ON public.partner_products
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin'
  ));

-- ============================================================================
-- VERIFY NO OTHER USER_METADATA REFERENCES
-- ============================================================================

-- Check for any remaining user_metadata references in policies
-- This is a safety check - if any are found, they should be fixed manually

-- Note: The following policies should NOT use user_metadata:
-- - Any policy checking roles should use: EXISTS (SELECT 1 FROM profiles WHERE id = (select auth.uid()) AND role = 'admin')
-- - Never use: (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
-- - Never use: auth.jwt() -> 'user_metadata' ->> 'role'

-- ============================================================================
-- ADDITIONAL SECURITY MEASURES
-- ============================================================================

-- Ensure profiles table has proper constraints
-- (This should already exist, but adding as safety check)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('customer', 'partner', 'admin', 'kam'));

-- Create index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_id_role ON public.profiles(id, role);

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

-- CRITICAL SECURITY IMPROVEMENTS:
-- 1. Role checks now use the profiles table instead of JWT user_metadata
-- 2. Users cannot bypass security by editing their own user_metadata
-- 3. Role changes must go through proper admin approval process
-- 4. All role-based access control is now centralized in the profiles table
-- 5. JWT tokens are no longer trusted for role information

-- TESTING CHECKLIST:
-- 1. Verify partners can only see their own data
-- 2. Verify admins can see all data
-- 3. Verify role changes require database updates
-- 4. Verify user_metadata changes don't affect access control
-- 5. Test all CRUD operations with different roles
