-- Fix RLS Policy Recursion in user_profiles
-- The "Admins can view all profiles" policy was causing infinite recursion
-- by querying user_profiles table to check admin role
-- Solution: Use SECURITY DEFINER function to bypass RLS and avoid recursion

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "Admins can view all profiles" ON user_profiles;

-- Create SECURITY DEFINER function to check admin role (bypasses RLS)
CREATE OR REPLACE FUNCTION is_admin_user(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = user_id AND role = 'admin'
  );
END;
$$;

-- Recreate the policy using the function (no recursion)
CREATE POLICY "Admins can view all profiles"
  ON user_profiles FOR SELECT
  USING (is_admin_user(auth.uid()));

-- Add comment for tracking
COMMENT ON FUNCTION is_admin_user(UUID) IS 
  'SECURITY DEFINER function to check if user is admin. Bypasses RLS to avoid recursion. Migration 038.';
COMMENT ON POLICY "Admins can view all profiles" ON user_profiles IS 
  'Fixed recursion issue - now uses SECURITY DEFINER function instead of direct query. Migration 038.';

