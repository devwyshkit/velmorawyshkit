-- Comprehensive Customer UI Test Data Seed
-- Covers complete customer flow: browse, cart, checkout, payment, preview, tracking
-- Run after migrations and test-users.sql, test-stores-items.sql
-- Follows Swiggy 2025 and Fiverr 2025 patterns - NO MOCKS, backend only

-- ============================================================================
-- PART 1: ADDITIONAL USERS (Customers, Partners, Admin)
-- ============================================================================

-- Customer 2
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, role
) VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'priya.sharma@example.com',
  crypt('TestUser123!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider": "phone", "providers": ["phone"]}'::jsonb,
  '{"full_name": "Priya Sharma", "phone": "+919876543220"}'::jsonb,
  false,
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (id, role, name, phone, is_email_verified, is_phone_verified)
VALUES (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'customer',
  'Priya Sharma',
  '+919876543220',
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name, phone = EXCLUDED.phone;

-- Customer 3
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, role
) VALUES (
  '00000000-0000-0000-0000-000000000003'::uuid,
  'rahul.kumar@example.com',
  crypt('TestUser123!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider": "phone", "providers": ["phone"]}'::jsonb,
  '{"full_name": "Rahul Kumar", "phone": "+919876543230"}'::jsonb,
  false,
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (id, role, name, phone, is_email_verified, is_phone_verified)
VALUES (
  '00000000-0000-0000-0000-000000000003'::uuid,
  'customer',
  'Rahul Kumar',
  '+919876543230',
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name, phone = EXCLUDED.phone;

-- Partner 1 (already has store in test-stores-items.sql)
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, role
) VALUES (
  '00000000-0000-0000-0000-000000000101'::uuid,
  'partner1@premiumgifts.co',
  crypt('TestUser123!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider": "email", "providers": ["email"], "role": "seller"}'::jsonb,
  '{"full_name": "Premium Gifts Owner", "phone": "+919876543211"}'::jsonb,
  false,
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (id, role, name, phone, is_email_verified, is_phone_verified)
VALUES (
  '00000000-0000-0000-0000-000000000101'::uuid,
  'seller',
  'Premium Gifts Owner',
  '+919876543211',
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name, phone = EXCLUDED.phone;

-- Partner 2
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, role
) VALUES (
  '00000000-0000-0000-0000-000000000102'::uuid,
  'partner2@gourmetdelights.in',
  crypt('TestUser123!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider": "email", "providers": ["email"], "role": "seller"}'::jsonb,
  '{"full_name": "Gourmet Delights Owner", "phone": "+919876543212"}'::jsonb,
  false,
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (id, role, name, phone, is_email_verified, is_phone_verified)
VALUES (
  '00000000-0000-0000-0000-000000000102'::uuid,
  'seller',
  'Gourmet Delights Owner',
  '+919876543212',
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name, phone = EXCLUDED.phone;

-- Admin User
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, role
) VALUES (
  '00000000-0000-0000-0000-000000000999'::uuid,
  'admin@wyshkit.com',
  crypt('Admin123!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider": "email", "providers": ["email"], "role": "admin"}'::jsonb,
  '{"full_name": "Admin User", "phone": "+919876543999"}'::jsonb,
  false,
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (id, role, name, phone, is_email_verified, is_phone_verified)
VALUES (
  '00000000-0000-0000-0000-000000000999'::uuid,
  'admin',
  'Admin User',
  '+919876543999',
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name, phone = EXCLUDED.phone;

-- Update store owners to use partner users
UPDATE stores SET owner_id = '00000000-0000-0000-0000-000000000101'::uuid WHERE id = '00000000-0000-0000-0000-000000000101'::uuid;
UPDATE stores SET owner_id = '00000000-0000-0000-0000-000000000102'::uuid WHERE id = '00000000-0000-0000-0000-000000000102'::uuid;

-- ============================================================================
-- PART 2: ADDITIONAL STORES & PRODUCTS
-- ============================================================================

-- Store 3: Corporate Gifts Hub
INSERT INTO stores (
  id, owner_id, name, slug, description, tagline, logo_url, banner_url,
  category, email, phone, address, city, state, pincode,
  status, is_active, rating, rating_count, delivery_time, min_order_value,
  is_sponsored, is_verified, badge
) VALUES (
  '00000000-0000-0000-0000-000000000103'::uuid,
  '00000000-0000-0000-0000-000000000101'::uuid,
  'Corporate Gifts Hub',
  'corporate-gifts-hub',
  'Professional corporate gifting solutions for businesses',
  'Corporate excellence delivered',
  'https://via.placeholder.com/150',
  'https://via.placeholder.com/800x200',
  'Corporate',
  'contact@corpgiftshub.in',
  '+919876543213',
  '321 Corporate Avenue, Business District',
  'Bangalore',
  'Karnataka',
  '560001',
  'approved',
  true,
  4.7,
  189,
  '3-5 days',
  2000.00,
  false,
  true,
  NULL
)
ON CONFLICT (id) DO NOTHING;

-- Store 4: Lifestyle Essentials
INSERT INTO stores (
  id, owner_id, name, slug, description, tagline, logo_url, banner_url,
  category, email, phone, address, city, state, pincode,
  status, is_active, rating, rating_count, delivery_time, min_order_value,
  is_sponsored, is_verified, badge
) VALUES (
  '00000000-0000-0000-0000-000000000104'::uuid,
  '00000000-0000-0000-0000-000000000102'::uuid,
  'Lifestyle Essentials',
  'lifestyle-essentials',
  'Curated lifestyle products for modern living',
  'Elevate your lifestyle',
  'https://via.placeholder.com/150',
  'https://via.placeholder.com/800x200',
  'Lifestyle',
  'hello@lifestyleessentials.in',
  '+919876543214',
  '654 Lifestyle Lane, Urban Center',
  'Pune',
  'Maharashtra',
  '411001',
  'approved',
  true,
  4.6,
  312,
  '2-4 days',
  1500.00,
  true,
  false,
  'trending'
)
ON CONFLICT (id) DO NOTHING;

-- Additional Products for existing stores
INSERT INTO store_items (
  id, store_id, name, slug, description, short_desc, image_url, price, mrp,
  stock_quantity, moq, category, is_customizable, personalizations,
  preparation_time, delivery_time, rating, rating_count, badge, is_active, status
) VALUES
-- More products for Premium Gifts Co
(
  '00000000-0000-0000-0000-000000000204'::uuid,
  '00000000-0000-0000-0000-000000000101'::uuid,
  'Custom Logo Mug',
  'custom-logo-mug',
  'Ceramic mug with custom logo printing. Perfect for corporate branding.',
  'Ceramic • Custom logo • 11oz capacity',
  'https://via.placeholder.com/400',
  399.00,
  599.00,
  200,
  50,
  'Drinkware',
  true,
  '[{"id": "logo-print", "label": "Logo Design", "price": 200, "requiresPreview": true}]'::jsonb,
  '2-3 days',
  '3-5 days',
  4.4,
  67,
  NULL,
  true,
  'approved'
),
(
  '00000000-0000-0000-0000-000000000205'::uuid,
  '00000000-0000-0000-0000-000000000101'::uuid,
  'Wireless Charging Pad',
  'wireless-charging-pad',
  'Fast wireless charging pad compatible with all devices.',
  'Fast charging • Universal compatibility • LED indicator',
  'https://via.placeholder.com/400',
  1299.00,
  1999.00,
  80,
  1,
  'Electronics',
  false,
  '[]'::jsonb,
  '1 day',
  '1-2 days',
  4.5,
  123,
  NULL,
  true,
  'approved'
),
-- Products for Corporate Gifts Hub
(
  '00000000-0000-0000-0000-000000000401'::uuid,
  '00000000-0000-0000-0000-000000000103'::uuid,
  'Premium Corporate Hamper',
  'premium-corporate-hamper',
  'Luxury corporate gift hamper with customizable branding options.',
  'Premium selection • Custom branding • Corporate packaging',
  'https://via.placeholder.com/400',
  4999.00,
  6999.00,
  25,
  10,
  'Hampers',
  true,
  '[{"id": "company-logo", "label": "Company Logo", "price": 500, "requiresPreview": true}, {"id": "gift-message", "label": "Gift Message", "price": 0, "requiresPreview": false}]'::jsonb,
  '5-7 days',
  '3-5 days',
  4.8,
  45,
  'bestseller',
  true,
  'approved'
),
-- Products for Lifestyle Essentials
(
  '00000000-0000-0000-0000-000000000501'::uuid,
  '00000000-0000-0000-0000-000000000104'::uuid,
  'Aromatherapy Diffuser Set',
  'aromatherapy-diffuser-set',
  'Premium aromatherapy diffuser with essential oils. Perfect for relaxation.',
  'LED lights • Timer function • Whisper quiet',
  'https://via.placeholder.com/400',
  2499.00,
  3499.00,
  60,
  1,
  'Wellness',
  false,
  '[]'::jsonb,
  '2 days',
  '2-3 days',
  4.6,
  89,
  NULL,
  true,
  'approved'
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 3: CATEGORIES & OCCASIONS
-- ============================================================================

-- Categories (if not already in migration)
INSERT INTO categories (id, name, slug, description, display_order, is_active)
VALUES
('00000000-0000-0000-0000-00000000C001'::uuid, 'Electronics', 'electronics', 'Electronic gadgets and accessories', 1, true),
('00000000-0000-0000-0000-00000000C002'::uuid, 'Apparel', 'apparel', 'Clothing and fashion items', 2, true),
('00000000-0000-0000-0000-00000000C003'::uuid, 'Gourmet', 'gourmet', 'Premium food and beverages', 3, true),
('00000000-0000-0000-0000-00000000C004'::uuid, 'Corporate', 'corporate', 'Corporate gifting solutions', 4, true),
('00000000-0000-0000-0000-00000000C005'::uuid, 'Lifestyle', 'lifestyle', 'Lifestyle and wellness products', 5, true),
('00000000-0000-0000-0000-00000000C006'::uuid, 'Drinkware', 'drinkware', 'Mugs, bottles, and drink containers', 6, true),
('00000000-0000-0000-0000-00000000C007'::uuid, 'Hampers', 'hampers', 'Curated gift hampers', 7, true),
('00000000-0000-0000-0000-00000000C008'::uuid, 'Wellness', 'wellness', 'Health and wellness products', 8, true)
ON CONFLICT (id) DO NOTHING;

-- Occasions
INSERT INTO occasions (id, name, slug, description, icon, image_url, position, is_active, is_featured)
VALUES
('00000000-0000-0000-0000-00000000O001'::uuid, 'Birthday', 'birthday', 'Celebrate birthdays with perfect gifts', '🎂', 'https://via.placeholder.com/300', 1, true, true),
('00000000-0000-0000-0000-00000000O002'::uuid, 'Anniversary', 'anniversary', 'Anniversary gifts for loved ones', '💝', 'https://via.placeholder.com/300', 2, true, true),
('00000000-0000-0000-0000-00000000O003'::uuid, 'Corporate', 'corporate', 'Corporate gifting solutions', '💼', 'https://via.placeholder.com/300', 3, true, true),
('00000000-0000-0000-0000-00000000O004'::uuid, 'Festival', 'festival', 'Festival celebration gifts', '🎉', 'https://via.placeholder.com/300', 4, true, false),
('00000000-0000-0000-0000-00000000O005'::uuid, 'Graduation', 'graduation', 'Graduation celebration gifts', '🎓', 'https://via.placeholder.com/300', 5, true, false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 4: BANNERS & PROMOTIONAL OFFERS
-- ============================================================================

-- Banners
INSERT INTO banners (id, title, subtitle, image_url, mobile_image_url, cta_text, cta_url, is_active, position, start_date, end_date)
VALUES
('00000000-0000-0000-0000-00000000B001'::uuid, 'New Year Special', 'Up to 30% off on all products', 'https://via.placeholder.com/800x200', 'https://via.placeholder.com/400x200', 'Shop Now', '/search?q=new+year', true, 1, NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days'),
('00000000-0000-0000-0000-00000000B002'::uuid, 'Corporate Gifting', 'Bulk orders get special discounts', 'https://via.placeholder.com/800x200', 'https://via.placeholder.com/400x200', 'Learn More', '/stores/corporate-gifts-hub', true, 2, NOW() - INTERVAL '1 day', NOW() + INTERVAL '60 days')
ON CONFLICT (id) DO NOTHING;

-- Promotional Offers (Platform-wide)
INSERT INTO promotional_offers (
  id, created_by_type, created_by_id, store_id, title, description,
  discount_type, discount_value, min_order_value_paise, applicable_to,
  start_date, end_date, status, is_active
) VALUES
('00000000-0000-0000-0000-00000000P001'::uuid, 'admin', '00000000-0000-0000-0000-000000000999'::uuid, NULL, 'New Year Sale', 'Platform-wide discount',
 'percentage', 20, 200000, 'all_stores', NOW() - INTERVAL '1 day', NOW() + INTERVAL '30 days', 'active', true),
('00000000-0000-0000-0000-00000000P002'::uuid, 'admin', '00000000-0000-0000-0000-000000000999'::uuid, NULL, 'Free Delivery', 'Free delivery on orders above ₹500',
 'free_delivery', 0, 500000, 'all_stores', NOW() - INTERVAL '1 day', NOW() + INTERVAL '60 days', 'active', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 5: ADDRESSES FOR TEST CUSTOMERS
-- ============================================================================

INSERT INTO addresses (
  id, user_id, type, name, phone, address_line1, address_line2, landmark,
  city, state, pincode, is_default
) VALUES
-- Customer 1 addresses
('00000000-0000-0000-0000-00000000A011'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'home', 'Test User', '+919876543210', '123 Test Street', 'Apt 4B', 'Near Test Mall', 'Mumbai', 'Maharashtra', '400001', true),
('00000000-0000-0000-0000-00000000A012'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, 'office', 'Test User Office', '+919876543210', '456 Business Park', 'Floor 5', 'Tech Hub', 'Mumbai', 'Maharashtra', '400002', false),
-- Customer 2 addresses
('00000000-0000-0000-0000-00000000A021'::uuid, '00000000-0000-0000-0000-000000000002'::uuid, 'home', 'Priya Sharma', '+919876543220', '789 Residential Complex', 'Block C', 'Near Park', 'Delhi', 'Delhi', '110001', true),
-- Customer 3 addresses
('00000000-0000-0000-0000-00000000A031'::uuid, '00000000-0000-0000-0000-000000000003'::uuid, 'home', 'Rahul Kumar', '+919876543230', '321 Main Road', 'House 45', 'Near School', 'Bangalore', 'Karnataka', '560001', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 6: CART ITEMS FOR TESTING
-- ============================================================================

INSERT INTO cart_items (
  id, user_id, store_id, item_id, quantity, unit_price, total_price, personalizations
) VALUES
-- Customer 1 cart
('00000000-0000-0000-0000-00000000C101'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, '00000000-0000-0000-0000-000000000201'::uuid, 2, 59900, 119800, '[{"id": "front-print", "label": "Front Print Design", "price": 100, "requiresPreview": true}]'::jsonb),
('00000000-0000-0000-0000-00000000C102'::uuid, '00000000-0000-0000-0000-000000000001'::uuid, '00000000-0000-0000-0000-000000000101'::uuid, '00000000-0000-0000-0000-000000000202'::uuid, 1, 199900, 199900, '[]'::jsonb),
-- Customer 2 cart
('00000000-0000-0000-0000-00000000C201'::uuid, '00000000-0000-0000-0000-000000000002'::uuid, '00000000-0000-0000-0000-000000000102'::uuid, '00000000-0000-0000-0000-000000000301'::uuid, 1, 249900, 249900, '[]'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 7: ORDERS IN DIFFERENT STATES (Fiverr 2025 Pattern)
-- ============================================================================

-- Order 1: Payment authorized, waiting for customer file upload
-- Items with requiresPreview: true, payment_status: authorized, preview_status: pending
INSERT INTO orders (
  id, order_number, customer_id, store_id, subtotal, delivery_fee, tax_amount,
  discount_amount, total_amount, delivery_address, status, payment_status,
  payment_method, created_at, confirmed_at
) VALUES (
  '00000000-0000-0000-0000-00000000O101'::uuid,
  'ORD-2025-001',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000101'::uuid,
  179800, -- 2x Custom T-Shirt (599 * 2) + personalizations
  5000, -- Delivery fee
  36960, -- 18% GST
  0,
  220760, -- Total in paise
  '{"address_line1": "123 Test Street", "address_line2": "Apt 4B", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001", "name": "Test User", "phone": "+919876543210"}'::jsonb,
  'confirmed',
  'authorized', -- Payment authorized but not captured
  'razorpay',
  NOW() - INTERVAL '2 hours',
  NOW() - INTERVAL '2 hours'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (
  id, order_id, item_id, item_name, item_image_url, quantity, unit_price, total_price,
  personalizations, preview_status, customization_files
) VALUES (
  '00000000-0000-0000-0000-00000000OI101'::uuid,
  '00000000-0000-0000-0000-00000000O101'::uuid,
  '00000000-0000-0000-0000-000000000201'::uuid,
  'Custom Branded T-Shirt',
  'https://via.placeholder.com/400',
  2,
  59900,
  119800,
  '[{"id": "front-print", "label": "Front Print Design", "price": 100, "requiresPreview": true}]'::jsonb,
  'pending', -- Waiting for customer to upload files
  '[]'::jsonb -- No files uploaded yet
)
ON CONFLICT (id) DO NOTHING;

-- Order 2: Customer files uploaded, waiting for partner preview
INSERT INTO orders (
  id, order_number, customer_id, store_id, subtotal, delivery_fee, tax_amount,
  discount_amount, total_amount, delivery_address, status, payment_status,
  payment_method, created_at, confirmed_at
) VALUES (
  '00000000-0000-0000-0000-00000000O102'::uuid,
  'ORD-2025-002',
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000103'::uuid,
  549900, -- Premium Corporate Hamper + logo
  5000,
  99978,
  0,
  654878,
  '{"address_line1": "789 Residential Complex", "address_line2": "Block C", "city": "Delhi", "state": "Delhi", "pincode": "110001", "name": "Priya Sharma", "phone": "+919876543220"}'::jsonb,
  'preview_pending',
  'authorized',
  'razorpay',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (
  id, order_id, item_id, item_name, item_image_url, quantity, unit_price, total_price,
  personalizations, preview_status, customization_files
) VALUES (
  '00000000-0000-0000-0000-00000000OI102'::uuid,
  '00000000-0000-0000-0000-00000000O102'::uuid,
  '00000000-0000-0000-0000-000000000401'::uuid,
  'Premium Corporate Hamper',
  'https://via.placeholder.com/400',
  1,
  499900,
  499900,
  '[{"id": "company-logo", "label": "Company Logo", "price": 500, "requiresPreview": true}]'::jsonb,
  'pending', -- Files uploaded, waiting for partner preview
  '["https://via.placeholder.com/800/logo1.png", "https://via.placeholder.com/800/logo2.png"]'::jsonb -- Customer uploaded files
)
ON CONFLICT (id) DO NOTHING;

-- Order 3: Preview ready, waiting for customer approval
INSERT INTO orders (
  id, order_number, customer_id, store_id, subtotal, delivery_fee, tax_amount,
  discount_amount, total_amount, delivery_address, status, payment_status,
  payment_method, created_at, confirmed_at
) VALUES (
  '00000000-0000-0000-0000-00000000O103'::uuid,
  'ORD-2025-003',
  '00000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000101'::uuid,
  94900, -- Custom Logo Mug
  5000,
  17982,
  0,
  117882,
  '{"address_line1": "321 Main Road", "address_line2": "House 45", "city": "Bangalore", "state": "Karnataka", "pincode": "560001", "name": "Rahul Kumar", "phone": "+919876543230"}'::jsonb,
  'preview_ready',
  'authorized',
  'razorpay',
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (
  id, order_id, item_id, item_name, item_image_url, quantity, unit_price, total_price,
  personalizations, preview_status, preview_url, preview_generated_at, customization_files
) VALUES (
  '00000000-0000-0000-0000-00000000OI103'::uuid,
  '00000000-0000-0000-0000-00000000O103'::uuid,
  '00000000-0000-0000-0000-000000000204'::uuid,
  'Custom Logo Mug',
  'https://via.placeholder.com/400',
  1,
  39900,
  39900,
  '[{"id": "logo-print", "label": "Logo Design", "price": 200, "requiresPreview": true}]'::jsonb,
  'preview_ready', -- Partner uploaded preview
  '["https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&h=600&fit=crop", "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&h=600&fit=crop&q=80", "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&h=600&fit=crop&q=80"]'::jsonb, -- Preview URLs (multiple angles)
  NOW() - INTERVAL '12 hours', -- Generated 12 hours ago
  '["https://via.placeholder.com/800/customer-logo.png"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Note: preview_history table not yet created - uncomment when migration is added
-- INSERT INTO preview_history (
--   id, order_item_id, preview_url, preview_notes, uploaded_by, uploaded_at, status
-- ) VALUES (
--   '00000000-0000-0000-0000-00000000PH001'::uuid,
--   '00000000-0000-0000-0000-00000000OI103'::uuid,
--   'https://via.placeholder.com/800/preview-mug.png',
--   'Logo applied to mug as per customer specifications',
--   '00000000-0000-0000-0000-000000000101'::uuid, -- Partner user
--   NOW() - INTERVAL '12 hours',
--   'submitted'
-- )
-- ON CONFLICT (id) DO NOTHING;

-- Order 4: Preview approved, payment captured, in production
INSERT INTO orders (
  id, order_number, customer_id, store_id, subtotal, delivery_fee, tax_amount,
  discount_amount, total_amount, delivery_address, status, payment_status,
  payment_method, payment_id, created_at, confirmed_at
) VALUES (
  '00000000-0000-0000-0000-00000000O104'::uuid,
  'ORD-2025-004',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000101'::uuid,
  94800, -- Engraved Metal Water Bottle
  5000,
  17964,
  0,
  117764,
  '{"address_line1": "123 Test Street", "address_line2": "Apt 4B", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001", "name": "Test User", "phone": "+919876543210"}'::jsonb,
  'production', -- In production
  'captured', -- Payment captured after preview approval
  'razorpay',
  'pay_test123456',
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (
  id, order_id, item_id, item_name, item_image_url, quantity, unit_price, total_price,
  personalizations, preview_status, preview_url, preview_generated_at, preview_approved_at,
  customization_files, revision_count
) VALUES (
  '00000000-0000-0000-0000-00000000OI104'::uuid,
  '00000000-0000-0000-0000-00000000O104'::uuid,
  '00000000-0000-0000-0000-000000000203'::uuid,
  'Engraved Metal Water Bottle',
  'https://via.placeholder.com/400',
  1,
  79900,
  79900,
  '[{"id": "engraving", "label": "Custom Engraving Text", "price": 150, "requiresPreview": true}]'::jsonb,
  'preview_approved', -- Customer approved
  '["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop", "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop&q=80"]'::jsonb, -- Preview URLs
  NOW() - INTERVAL '3 days' + INTERVAL '1 day', -- Generated 2 days ago
  NOW() - INTERVAL '2 days', -- Approved 2 days ago
  '["https://via.placeholder.com/800/engraving-text.png"]'::jsonb,
  0 -- No revisions
)
ON CONFLICT (id) DO NOTHING;

-- Note: preview_history table not yet created - uncomment when migration is added
-- INSERT INTO preview_history (
--   id, order_item_id, preview_url, preview_notes, uploaded_by, uploaded_at, status, customer_feedback
-- ) VALUES (
--   '00000000-0000-0000-0000-00000000PH002'::uuid,
--   '00000000-0000-0000-0000-00000000OI104'::uuid,
--   'https://via.placeholder.com/800/preview-bottle.png',
--   'Engraving applied as requested',
--   '00000000-0000-0000-0000-000000000101'::uuid,
--   NOW() - INTERVAL '3 days' + INTERVAL '1 day',
--   'approved',
--   'Looks perfect! Proceed with production.'
-- )
-- ON CONFLICT (id) DO NOTHING;

-- Order 5: Logistics assigned, ready for tracking
INSERT INTO orders (
  id, order_number, customer_id, store_id, subtotal, delivery_fee, tax_amount,
  discount_amount, total_amount, delivery_address, status, payment_status,
  payment_method, payment_id, logistics_provider, tracking_number,
  logistics_assigned_at, logistics_status, created_at, confirmed_at, shipped_at
) VALUES (
  '00000000-0000-0000-0000-00000000O105'::uuid,
  'ORD-2025-005',
  '00000000-0000-0000-0000-000000000002'::uuid,
  '00000000-0000-0000-0000-000000000102'::uuid,
  249900, -- Premium Chocolate Hamper
  0, -- Free delivery (above threshold)
  44982,
  0,
  294882,
  '{"address_line1": "789 Residential Complex", "address_line2": "Block C", "city": "Delhi", "state": "Delhi", "pincode": "110001", "name": "Priya Sharma", "phone": "+919876543220"}'::jsonb,
  'out_for_delivery',
  'captured',
  'razorpay',
  'pay_test123457',
  'porter', -- Porter logistics
  'PORTER-20250115-123456', -- Tracking number
  NOW() - INTERVAL '1 day',
  'assigned',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (
  id, order_id, item_id, item_name, item_image_url, quantity, unit_price, total_price,
  personalizations
) VALUES (
  '00000000-0000-0000-0000-00000000OI105'::uuid,
  '00000000-0000-0000-0000-00000000O105'::uuid,
  '00000000-0000-0000-0000-000000000301'::uuid,
  'Premium Chocolate Hamper',
  'https://via.placeholder.com/400',
  1,
  249900,
  249900,
  '[]'::jsonb -- No customization
)
ON CONFLICT (id) DO NOTHING;

-- Note: logistics_tracking_events table not yet created - uncomment when migration is added
-- INSERT INTO logistics_tracking_events (
--   id, order_id, event_type, event_description, location, event_time, raw_data
-- ) VALUES
-- ('00000000-0000-0000-0000-00000000LT001'::uuid, '00000000-0000-0000-0000-00000000O105'::uuid, 'pickup', 'Order picked up from store', 'Mumbai Warehouse', NOW() - INTERVAL '1 day', '{"status": "picked_up", "location": "Mumbai Warehouse"}'::jsonb),
-- ('00000000-0000-0000-0000-00000000LT002'::uuid, '00000000-0000-0000-0000-00000000O105'::uuid, 'in_transit', 'Order in transit to Delhi', 'Mumbai', NOW() - INTERVAL '20 hours', '{"status": "in_transit", "current_location": "Mumbai"}'::jsonb),
-- ('00000000-0000-0000-0000-00000000LT003'::uuid, '00000000-0000-0000-0000-00000000O105'::uuid, 'out_for_delivery', 'Out for delivery', 'Delhi', NOW() - INTERVAL '2 hours', '{"status": "out_for_delivery", "estimated_delivery": "2 hours"}'::jsonb)
-- ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 8: PAYMENT TRANSACTIONS
-- ============================================================================

-- Payment transactions for orders
INSERT INTO payment_transactions (
  id, order_id, gateway, gateway_transaction_id, gateway_order_id, amount,
  currency, payment_method, status, initiated_at, authorized_at, captured_at
) VALUES
-- Order 1: Authorized but not captured
('00000000-0000-0000-0000-00000000PT001'::uuid, '00000000-0000-0000-0000-00000000O101'::uuid, 'razorpay', 'pay_test001', 'order_test001', 220760, 'INR', 'card', 'authorized', NOW() - INTERVAL '2 hours', NOW() - INTERVAL '2 hours', NULL),
-- Order 2: Authorized but not captured
('00000000-0000-0000-0000-00000000PT002'::uuid, '00000000-0000-0000-0000-00000000O102'::uuid, 'razorpay', 'pay_test002', 'order_test002', 654878, 'INR', 'card', 'authorized', NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', NULL),
-- Order 3: Authorized but not captured
('00000000-0000-0000-0000-00000000PT003'::uuid, '00000000-0000-0000-0000-00000000O103'::uuid, 'razorpay', 'pay_test003', 'order_test003', 117882, 'INR', 'card', 'authorized', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NULL),
-- Order 4: Captured after preview approval
('00000000-0000-0000-0000-00000000PT004'::uuid, '00000000-0000-0000-0000-00000000O104'::uuid, 'razorpay', 'pay_test123456', 'order_test004', 117764, 'INR', 'card', 'captured', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days'),
-- Order 5: Captured
('00000000-0000-0000-0000-00000000PT005'::uuid, '00000000-0000-0000-0000-00000000O105'::uuid, 'razorpay', 'pay_test123457', 'order_test005', 294882, 'INR', 'card', 'captured', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days')
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PART 9: EDGE CASES - MULTIPLE REVISIONS & FAILED PAYMENT SCENARIOS
-- ============================================================================

-- Order 6: Multiple revisions scenario (revision requested, partner uploaded revised preview)
INSERT INTO orders (
  id, order_number, customer_id, store_id, subtotal, delivery_fee, tax_amount,
  discount_amount, total_amount, delivery_address, status, payment_status,
  payment_method, created_at, confirmed_at
) VALUES (
  '00000000-0000-0000-0000-00000000O106'::uuid,
  'ORD-2025-006',
  '00000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000101'::uuid,
  129900, -- Custom Engraved Pen with revisions
  5000,
  24282,
  0,
  159182,
  '{"address_line1": "123 Test Street", "address_line2": "Apt 4B", "city": "Mumbai", "state": "Maharashtra", "pincode": "400001", "name": "Test User", "phone": "+919876543210"}'::jsonb,
  'preview_ready', -- Revised preview ready
  'authorized', -- Payment still authorized (not captured yet)
  'razorpay',
  NOW() - INTERVAL '4 days',
  NOW() - INTERVAL '4 days'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (
  id, order_id, item_id, item_name, item_image_url, quantity, unit_price, total_price,
  personalizations, preview_status, preview_url, preview_generated_at, 
  revision_count, revision_notes, revision_requested_at, customization_files
) VALUES (
  '00000000-0000-0000-0000-00000000OI106'::uuid,
  '00000000-0000-0000-0000-00000000O106'::uuid,
  '00000000-0000-0000-0000-000000000201'::uuid,
  'Custom Engraved Pen',
  'https://via.placeholder.com/400',
  1,
  120000,
  120000,
  '[{"id": "engrave-text", "name": "Engrave Text", "type": "text", "price": 10000, "requiresPreview": true}]'::jsonb,
  'preview_ready', -- Revised preview ready after revision request
  '["https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&h=600&fit=crop", "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&h=600&fit=crop&q=80"]'::jsonb, -- Revised preview URLs
  NOW() - INTERVAL '6 hours', -- Revised preview generated 6 hours ago
  1, -- One revision requested
  'Please adjust the font size and make text bolder', -- Revision notes
  NOW() - INTERVAL '1 day', -- Revision requested 1 day ago
  '["https://via.placeholder.com/800/engraving-text.png"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Order 7: Payment capture failure scenario (authorized but capture failed)
INSERT INTO orders (
  id, order_number, customer_id, store_id, subtotal, delivery_fee, tax_amount,
  discount_amount, total_amount, delivery_address, status, payment_status,
  payment_method, payment_id, created_at, confirmed_at
) VALUES (
  '00000000-0000-0000-0000-00000000O107'::uuid,
  'ORD-2025-007',
  '00000000-0000-0000-0000-000000000003'::uuid,
  '00000000-0000-0000-0000-000000000102'::uuid,
  89900, -- Gift Box Set
  5000,
  17082,
  0,
  111982,
  '{"address_line1": "321 Main Road", "address_line2": "House 45", "city": "Bangalore", "state": "Karnataka", "pincode": "560001", "name": "Rahul Kumar", "phone": "+919876543230"}'::jsonb,
  'preview_approved', -- Preview approved but payment capture failed
  'authorized', -- Payment authorized but capture failed (should be captured)
  'razorpay',
  'pay_test_failed',
  NOW() - INTERVAL '6 hours',
  NOW() - INTERVAL '6 hours'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO order_items (
  id, order_id, item_id, item_name, item_image_url, quantity, unit_price, total_price,
  personalizations, preview_status, preview_url, preview_generated_at, preview_approved_at,
  customization_files, revision_count
) VALUES (
  '00000000-0000-0000-0000-00000000OI107'::uuid,
  '00000000-0000-0000-0000-00000000O107'::uuid,
  '00000000-0000-0000-0000-000000000302'::uuid,
  'Gift Box Set',
  'https://via.placeholder.com/400',
  1,
  89900,
  89900,
  '[{"id": "custom-design", "label": "Custom Design", "price": 200, "requiresPreview": true}]'::jsonb,
  'preview_approved', -- Customer approved
  'https://via.placeholder.com/800/preview-giftbox.png',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '6 hours', -- Approved 6 hours ago, but payment capture failed
  '["https://via.placeholder.com/800/custom-design.png"]'::jsonb,
  0 -- No revisions
)
ON CONFLICT (id) DO NOTHING;

-- Payment transaction for failed capture scenario
INSERT INTO payment_transactions (
  id, order_id, gateway, gateway_transaction_id, gateway_order_id, amount,
  currency, payment_method, status, initiated_at, authorized_at, captured_at, failure_reason
) VALUES (
  '00000000-0000-0000-0000-00000000PT006'::uuid,
  '00000000-0000-0000-0000-00000000O107'::uuid,
  'razorpay',
  'pay_test_failed',
  'order_test_failed',
  111982,
  'INR',
  'card',
  'authorized', -- Authorized but capture failed
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day',
  NULL, -- Not captured
  'Payment capture failed: Network timeout' -- Failure reason
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE orders IS 'Test orders in various states for customer UI testing - includes edge cases';
COMMENT ON TABLE order_items IS 'Test order items with preview workflow states - includes revision scenarios';
COMMENT ON TABLE payment_transactions IS 'Payment transactions for testing - includes failed capture scenarios';
-- Note: preview_history and logistics_tracking_events tables not yet created

