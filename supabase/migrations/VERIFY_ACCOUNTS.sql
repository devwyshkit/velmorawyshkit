-- ============================================================================
-- VERIFY TEST ACCOUNTS CREATED
-- Run this in Supabase SQL Editor to check if accounts exist
-- ============================================================================

-- Check if auth users were created
SELECT 
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  raw_user_meta_data->>'role' as role,
  raw_user_meta_data->>'business_name' as business_name,
  created_at
FROM auth.users
WHERE email IN ('partner@wyshkit.com', 'admin@wyshkit.com', 'pending@wyshkit.com')
ORDER BY email;

-- Expected result: 3 rows
-- If 0 rows: Accounts not created, SQL didn't run properly
-- If < 3 rows: Only some accounts created, SQL failed partway

-- Check if partner profiles were created
SELECT 
  id,
  business_name,
  category,
  status,
  created_at
FROM public.partner_profiles
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('partner@wyshkit.com', 'pending@wyshkit.com')
);

-- Expected result: 2 rows (partner and pending)
-- If 0 rows: partner_profiles table not created or trigger failed

-- Check if tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('partner_profiles', 'partner_products', 'orders')
ORDER BY table_name;

-- Expected result: 3 rows
-- If missing: Migration didn't run completely

