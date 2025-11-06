-- Fix stores RLS policy to use is_admin_user() function for consistency
-- This ensures all admin checks use the same SECURITY DEFINER function

-- Drop existing admin policy on stores
DROP POLICY IF EXISTS "Admins can manage all stores" ON stores;

-- Recreate using the is_admin_user() function
CREATE POLICY "Admins can manage all stores"
  ON stores FOR ALL
  USING (is_admin_user(auth.uid()));

-- Add comment
COMMENT ON POLICY "Admins can manage all stores" ON stores IS 
  'Updated to use is_admin_user() function for consistency. Migration 039.';

