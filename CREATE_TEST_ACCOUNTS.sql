-- ============================================
-- Create Test Accounts for Wyshkit
-- Run this in Supabase SQL Editor
-- ============================================

-- Note: Passwords will need to be hashed by Supabase Auth
-- Use Supabase Dashboard → Authentication → Users → Add User

-- ============================================
-- 1. CUSTOMER TEST ACCOUNT
-- ============================================
-- Email: customer@wyshkit.com
-- Password: customer123
-- Create via Supabase Dashboard, then no additional setup needed

-- ============================================
-- 2. PARTNER TEST ACCOUNT
-- ============================================
-- Email: partner@wyshkit.com
-- Password: partner123
-- Create via Supabase Dashboard, then run:

-- After creating auth user, get the user_id and insert partner profile:
INSERT INTO partner_profiles (
  user_id,
  business_name,
  display_name,
  category,
  tagline,
  email,
  phone,
  pan_number,
  pan_verified,
  gst_number,
  gst_verified,
  bank_account_number,
  bank_ifsc,
  bank_account_holder,
  bank_verified,
  address_line1,
  city,
  state,
  pincode,
  onboarding_status,
  onboarding_step,
  approved_at,
  warehouse_locations,
  lead_time_days,
  accepts_customization
) VALUES (
  'REPLACE_WITH_AUTH_USER_ID', -- Get from auth.users after creating account
  'Premium Gifts Co Private Limited',
  'Premium Gifts Co',
  'Tech Gifts',
  'Premium tech accessories & gift hampers',
  'partner@wyshkit.com',
  '9876543210',
  'AAAPL1234C',
  true,
  '22AAAAA0000A1Z5',
  true,
  '1234567890',
  'HDFC0000123',
  'Premium Gifts Co',
  true,
  'Shop No. 123, Tech Park, Koramangala',
  'Bangalore',
  'Karnataka',
  '560001',
  'approved',
  4,
  NOW(),
  '[{"city": "Bangalore", "pincode": "560001", "address": "Shop No. 123, Tech Park"}]'::jsonb,
  3,
  true
);

-- Add some test products for the partner
INSERT INTO partner_products (
  partner_id,
  name,
  description,
  short_desc,
  category,
  price,
  original_price,
  image_url,
  total_stock,
  preparation_days,
  is_active
) VALUES 
(
  (SELECT id FROM partner_profiles WHERE email = 'partner@wyshkit.com'),
  'Premium Gift Hamper',
  'Curated selection of premium items including gourmet treats, artisan chocolates, and luxury accessories. Perfect for any special occasion.',
  'Premium treats & chocolates for special occasions – ideal for corporate gifting',
  'Premium',
  249900, -- ₹2,499
  299900, -- ₹2,999
  'https://picsum.photos/seed/hamper1/400/400',
  50,
  3,
  true
),
(
  (SELECT id FROM partner_profiles WHERE email = 'partner@wyshkit.com'),
  'Wireless Earbuds - Premium',
  'High-quality wireless earbuds with noise cancellation. Perfect gift for music lovers and tech enthusiasts.',
  'Wireless audio for music lovers – noise cancellation and premium sound',
  'Tech Gifts',
  499900, -- ₹4,999
  599900, -- ₹5,999
  'https://picsum.photos/seed/earbuds1/400/400',
  30,
  2,
  true
),
(
  (SELECT id FROM partner_profiles WHERE email = 'partner@wyshkit.com'),
  'Artisan Chocolate Box',
  'Hand-crafted chocolates made with premium Belgian cocoa. A delightful treat for chocolate connoisseurs.',
  'Belgian chocolates perfect for sweet lovers – handcrafted with premium ingredients',
  'Chocolates',
  129900, -- ₹1,299
  NULL,
  'https://picsum.photos/seed/chocolate1/400/400',
  100,
  1,
  true
);

-- ============================================
-- 3. ADMIN TEST ACCOUNT
-- ============================================
-- Email: admin@wyshkit.com
-- Password: admin123
-- Create via Supabase Dashboard → Authentication → Users → Add User
-- Then add admin role metadata:

-- After creating auth user, update user metadata:
UPDATE auth.users 
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@wyshkit.com';

-- ============================================
-- INSTRUCTIONS
-- ============================================

/*
1. Go to Supabase Dashboard → Authentication → Users → Add User

2. Create Customer Account:
   - Email: customer@wyshkit.com
   - Password: customer123
   - Confirm Email: YES (check the box)
   - Click "Create User"

3. Create Partner Account:
   - Email: partner@wyshkit.com
   - Password: partner123
   - Confirm Email: YES
   - Click "Create User"
   - Copy the user_id from the users table
   - Replace 'REPLACE_WITH_AUTH_USER_ID' in the INSERT statement above
   - Run the partner INSERT queries

4. Create Admin Account:
   - Email: admin@wyshkit.com
   - Password: admin123
   - Confirm Email: YES
   - Click "Create User"
   - Run the UPDATE query to add admin role

5. Verify:
   - SELECT * FROM auth.users WHERE email LIKE '%@wyshkit.com';
   - SELECT * FROM partner_profiles WHERE email = 'partner@wyshkit.com';

6. Test Login:
   - Customer: http://localhost:8080/customer/login
   - Partner: http://localhost:8080/partner/login
   - Admin: Use partner login for now (admin routes don't have separate auth yet)
*/

-- All done! Test accounts ready for comprehensive testing.

