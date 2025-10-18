-- ============================================
-- Database Verification Script
-- Run in Supabase SQL Editor to verify setup
-- ============================================

-- ============================================
-- 1. CHECK AUTH USERS
-- ============================================

SELECT 
  id,
  email,
  email_confirmed_at,
  created_at,
  raw_app_meta_data->>'role' as role,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✓ Confirmed'
    ELSE '✗ Not Confirmed'
  END as email_status
FROM auth.users 
WHERE email LIKE '%@wyshkit.com' OR email LIKE '%@test.com'
ORDER BY created_at;

-- Expected Results:
-- - customer@wyshkit.com (no role)
-- - partner@wyshkit.com (no role)
-- - admin@wyshkit.com (role='admin')
-- - newpartner@test.com (if onboarding tested)
-- All should have email_confirmed_at populated

-- ============================================
-- 2. CHECK PARTNER PROFILES
-- ============================================

SELECT 
  id,
  user_id,
  business_name,
  display_name,
  email,
  onboarding_status,
  onboarding_step,
  CASE 
    WHEN pan_verified THEN '✓ PAN'
    ELSE '✗ PAN'
  END as pan,
  CASE 
    WHEN gst_verified THEN '✓ GST'
    ELSE '✗ GST'
  END as gst,
  CASE 
    WHEN bank_verified THEN '✓ Bank'
    ELSE '✗ Bank'
  END as bank,
  CASE 
    WHEN is_open THEN '🟢 Open'
    ELSE '🔴 Closed'
  END as status,
  approved_at,
  created_at
FROM partner_profiles
ORDER BY created_at;

-- Expected Results:
-- - Premium Gifts Co (approved, all verified)
-- - Test Business (if onboarding completed)
-- All should have onboarding_status = 'approved' after admin approval

-- ============================================
-- 3. CHECK PARTNER PRODUCTS
-- ============================================

SELECT 
  p.id,
  pr.business_name as partner,
  p.name,
  p.category,
  p.price / 100 as price_rupees,
  p.total_stock,
  CASE 
    WHEN p.is_active THEN '✓ Active'
    ELSE '✗ Inactive'
  END as status,
  p.created_at
FROM partner_products p
JOIN partner_profiles pr ON p.partner_id = pr.id
ORDER BY p.created_at;

-- Expected Results:
-- - 3 products for Premium Gifts Co (Premium Gift Hamper, Wireless Earbuds, Artisan Chocolate Box)
-- - Additional products if added during testing
-- All should have is_active = true initially

-- ============================================
-- 4. CHECK PARTNER ORDERS
-- ============================================

SELECT 
  po.id,
  pr.business_name as partner,
  po.order_number,
  po.total_amount / 100 as amount_rupees,
  po.status,
  po.created_at,
  po.updated_at
FROM partner_orders po
JOIN partner_profiles pr ON po.partner_id = pr.id
ORDER BY po.created_at DESC
LIMIT 10;

-- Expected Results:
-- - May be empty for new setup
-- - If customer placed orders, should show here

-- ============================================
-- 5. CHECK PARTNER EARNINGS
-- ============================================

SELECT 
  e.id,
  pr.business_name as partner,
  po.order_number,
  e.amount / 100 as gross_amount,
  e.commission_rate || '%' as commission,
  e.commission_amount / 100 as commission_amt,
  e.net_amount / 100 as net_amount,
  e.payout_status,
  e.payout_date,
  e.created_at
FROM partner_earnings e
JOIN partner_profiles pr ON e.partner_id = pr.id
LEFT JOIN partner_orders po ON e.order_id = po.id
ORDER BY e.created_at DESC
LIMIT 10;

-- Expected Results:
-- - May be empty for new setup
-- - If orders completed, earnings records should exist

-- ============================================
-- 6. CHECK ADMIN ACTIONS LOG
-- ============================================

SELECT 
  aa.id,
  aa.action_type,
  pr.business_name as target_partner,
  au.email as performed_by_email,
  aa.notes,
  aa.created_at
FROM admin_actions aa
LEFT JOIN partner_profiles pr ON aa.target_id = pr.id::text
LEFT JOIN auth.users au ON aa.performed_by = au.id
ORDER BY aa.created_at DESC
LIMIT 10;

-- Expected Results:
-- - Approval actions if admin approved partners
-- - Empty if no admin actions yet

-- ============================================
-- 7. CHECK RLS POLICIES
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE 
    WHEN roles = '{}'::name[] THEN 'All roles'
    ELSE array_to_string(roles, ', ')
  END as applies_to
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename LIKE 'partner%'
ORDER BY tablename, policyname;

-- Expected Results:
-- - Multiple policies per partner table
-- - Policies for SELECT, INSERT, UPDATE operations
-- - Should see: "Partners view own account", "Partners update own account", etc.

-- ============================================
-- 8. CHECK TABLE ROW LEVEL SECURITY STATUS
-- ============================================

SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN '✓ RLS Enabled'
    ELSE '✗ RLS Disabled'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE 'partner%'
ORDER BY tablename;

-- Expected Results:
-- - All partner tables should have RLS enabled

-- ============================================
-- 9. VERIFY FOREIGN KEY RELATIONSHIPS
-- ============================================

SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name LIKE 'partner%'
ORDER BY tc.table_name, tc.constraint_name;

-- Expected Results:
-- - partner_products.partner_id → partner_profiles.id
-- - partner_orders.partner_id → partner_profiles.id
-- - partner_earnings.partner_id → partner_profiles.id
-- - partner_earnings.order_id → partner_orders.id

-- ============================================
-- 10. CHECK FULL TEXT SEARCH INDEXES
-- ============================================

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename LIKE 'partner%'
  AND indexdef LIKE '%gin%'
ORDER BY tablename;

-- Expected Results:
-- - GIN indexes for full-text search on partner_products

-- ============================================
-- 11. VERIFY TRIGGERS
-- ============================================

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table LIKE 'partner%'
ORDER BY event_object_table, trigger_name;

-- Expected Results:
-- - update_partner_profiles_updated_at (for timestamps)
-- - Similar triggers for other partner tables

-- ============================================
-- 12. TEST DATA INTEGRITY
-- ============================================

-- Count records
SELECT 
  'auth.users' as table_name,
  COUNT(*) as count
FROM auth.users
WHERE email LIKE '%@wyshkit.com' OR email LIKE '%@test.com'
UNION ALL
SELECT 
  'partner_profiles',
  COUNT(*)
FROM partner_profiles
UNION ALL
SELECT 
  'partner_products',
  COUNT(*)
FROM partner_products
UNION ALL
SELECT 
  'partner_orders',
  COUNT(*)
FROM partner_orders
UNION ALL
SELECT 
  'partner_earnings',
  COUNT(*)
FROM partner_earnings
UNION ALL
SELECT 
  'admin_actions',
  COUNT(*)
FROM admin_actions;

-- Expected Minimums:
-- - auth.users: 3+ (customer, partner, admin)
-- - partner_profiles: 1+ (at least test partner)
-- - partner_products: 3+ (test products)
-- - Others may be 0 for fresh setup

-- ============================================
-- 13. CHECK FOR ORPHANED RECORDS
-- ============================================

-- Products without valid partner
SELECT COUNT(*) as orphaned_products
FROM partner_products p
LEFT JOIN partner_profiles pr ON p.partner_id = pr.id
WHERE pr.id IS NULL;

-- Orders without valid partner
SELECT COUNT(*) as orphaned_orders
FROM partner_orders po
LEFT JOIN partner_profiles pr ON po.partner_id = pr.id
WHERE pr.id IS NULL;

-- Earnings without valid partner
SELECT COUNT(*) as orphaned_earnings
FROM partner_earnings e
LEFT JOIN partner_profiles pr ON e.partner_id = pr.id
WHERE pr.id IS NULL;

-- Expected Results:
-- - All should be 0 (no orphaned records)

-- ============================================
-- 14. VERIFY SUPABASE EDGE FUNCTION
-- ============================================

-- Check if Edge Function is deployed (run this in Supabase Dashboard)
-- Cannot check via SQL, manually verify:
-- 1. Go to Supabase Dashboard → Edge Functions
-- 2. Look for "verify-kyc" function
-- 3. Check deployment status
-- 4. View logs for any errors

-- ============================================
-- SUMMARY REPORT
-- ============================================

SELECT 
  'VERIFICATION COMPLETE' as status,
  NOW() as checked_at,
  (SELECT COUNT(*) FROM auth.users WHERE email LIKE '%@wyshkit.com') as test_users,
  (SELECT COUNT(*) FROM partner_profiles) as partners,
  (SELECT COUNT(*) FROM partner_products) as products,
  (SELECT COUNT(*) FROM partner_orders) as orders,
  (SELECT COUNT(*) FROM partner_earnings) as earnings,
  (SELECT COUNT(*) FROM admin_actions) as admin_actions;

-- ============================================
-- TROUBLESHOOTING QUERIES
-- ============================================

-- If partner login fails:
-- 1. Check if user exists and email is confirmed
SELECT id, email, email_confirmed_at 
FROM auth.users 
WHERE email = 'partner@wyshkit.com';

-- 2. Check if partner profile exists
SELECT * FROM partner_profiles 
WHERE email = 'partner@wyshkit.com';

-- 3. Check if profile is linked to auth user
SELECT 
  au.id as auth_user_id,
  au.email,
  pp.id as profile_id,
  pp.user_id as profile_user_id,
  CASE 
    WHEN au.id = pp.user_id THEN '✓ Linked'
    ELSE '✗ NOT LINKED'
  END as link_status
FROM auth.users au
LEFT JOIN partner_profiles pp ON au.id = pp.user_id
WHERE au.email = 'partner@wyshkit.com';

-- If admin access fails:
-- 1. Check admin role metadata
SELECT 
  email,
  raw_app_meta_data,
  raw_app_meta_data->>'role' as role
FROM auth.users 
WHERE email = 'admin@wyshkit.com';

-- If products don't show:
-- 1. Check if products exist and are active
SELECT id, name, partner_id, is_active 
FROM partner_products 
WHERE partner_id IN (
  SELECT id FROM partner_profiles 
  WHERE email = 'partner@wyshkit.com'
);

-- 2. Check if partner_id matches
SELECT 
  pr.id as profile_id,
  pr.business_name,
  COUNT(p.id) as product_count
FROM partner_profiles pr
LEFT JOIN partner_products p ON pr.id = p.partner_id
GROUP BY pr.id, pr.business_name;

-- ============================================
-- END OF VERIFICATION SCRIPT
-- ============================================

