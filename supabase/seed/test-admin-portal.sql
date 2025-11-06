-- Admin Portal Seed Data
-- Comprehensive test data for admin dashboard testing
-- Includes: stores in various states, orders, disputes, payment transactions, reviews, payouts

-- ============================================================================
-- PART 1: ADDITIONAL ADMIN USERS
-- ============================================================================

-- Admin 2
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, role
) VALUES (
  '00000000-0000-0000-0000-000000000998'::uuid,
  'admin2@wyshkit.com',
  crypt('Admin123!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider": "email", "providers": ["email"], "role": "admin"}'::jsonb,
  '{"full_name": "Admin User 2"}'::jsonb,
  false,
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (id, role, name, phone, is_email_verified, is_phone_verified)
VALUES (
  '00000000-0000-0000-0000-000000000998'::uuid,
  'admin',
  'Admin User 2',
  '+919876543998',
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name;

-- Admin 3
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
  raw_app_meta_data, raw_user_meta_data, is_super_admin, role
) VALUES (
  '00000000-0000-0000-0000-000000000997'::uuid,
  'admin3@wyshkit.com',
  crypt('Admin123!', gen_salt('bf')),
  NOW(), NOW(), NOW(),
  '{"provider": "email", "providers": ["email"], "role": "admin"}'::jsonb,
  '{"full_name": "Admin User 3"}'::jsonb,
  false,
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (id, role, name, phone, is_email_verified, is_phone_verified)
VALUES (
  '00000000-0000-0000-0000-000000000997'::uuid,
  'admin',
  'Admin User 3',
  '+919876543997',
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name;

-- ============================================================================
-- PART 2: STORES IN VARIOUS STATES
-- ============================================================================

-- Get existing store owner IDs
DO $$
DECLARE
  partner1_id UUID := '00000000-0000-0000-0000-000000000101'::uuid;
  partner2_id UUID := '00000000-0000-0000-0000-000000000102'::uuid;
  new_partner_id UUID;
BEGIN
  -- Pending Approval Stores (5-10 stores)
  FOR i IN 1..7 LOOP
    new_partner_id := gen_random_uuid();
    
    -- Create partner user
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, role
    ) VALUES (
      new_partner_id,
      'pending-partner' || i || '@test.com',
      crypt('TestUser123!', gen_salt('bf')),
      NOW(), NOW() - (i || ' days')::interval, NOW(),
      '{"provider": "email", "providers": ["email"], "role": "seller"}'::jsonb,
      jsonb_build_object('full_name', 'Pending Partner ' || i),
      false,
      'authenticated'
    )
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO user_profiles (id, role, name, phone, is_email_verified, is_phone_verified)
    VALUES (
      new_partner_id,
      'seller',
      'Pending Partner ' || i,
      '+919876543' || LPAD(i::text, 3, '0'),
      true,
      true
    )
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name;
    
    -- Create pending store
    INSERT INTO stores (
      id, owner_id, name, slug, email, phone, category, status, is_active,
      created_at
    ) VALUES (
      gen_random_uuid(),
      new_partner_id,
      'Pending Store ' || i,
      'pending-store-' || i,
      'pending-partner' || i || '@test.com',
      '+919876543' || LPAD(i::text, 3, '0'),
      CASE (i % 4) WHEN 0 THEN 'electronics' WHEN 1 THEN 'gourmet' WHEN 2 THEN 'wellness' ELSE 'corporate' END,
      'pending',
      false,
      NOW() - (i || ' days')::interval
    );
  END LOOP;
  
  -- Approved and Active Stores (20-30 stores)
  FOR i IN 1..25 LOOP
    new_partner_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, role
    ) VALUES (
      new_partner_id,
      'active-partner' || i || '@test.com',
      crypt('TestUser123!', gen_salt('bf')),
      NOW(), NOW() - ((i * 30) || ' days')::interval, NOW(),
      '{"provider": "email", "providers": ["email"], "role": "seller"}'::jsonb,
      jsonb_build_object('full_name', 'Active Partner ' || i),
      false,
      'authenticated'
    )
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO user_profiles (id, role, name, phone, is_email_verified, is_phone_verified)
    VALUES (
      new_partner_id,
      'seller',
      'Active Partner ' || i,
      '+919876544' || LPAD(i::text, 3, '0'),
      true,
      true
    )
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name;
    
    INSERT INTO stores (
      id, owner_id, name, slug, email, phone, category, status, is_active,
      rating, rating_count, created_at
    ) VALUES (
      gen_random_uuid(),
      new_partner_id,
      'Active Store ' || i,
      'active-store-' || i,
      'active-partner' || i || '@test.com',
      '+919876544' || LPAD(i::text, 3, '0'),
      CASE (i % 5) WHEN 0 THEN 'electronics' WHEN 1 THEN 'gourmet' WHEN 2 THEN 'wellness' WHEN 3 THEN 'corporate' ELSE 'lifestyle' END,
      'approved',
      true,
      (4.0 + (random() * 1.0))::numeric(3,2),
      (10 + (random() * 100)::int),
      NOW() - ((i * 30) || ' days')::interval
    );
  END LOOP;
  
  -- Suspended Stores (2-3 stores)
  FOR i IN 1..3 LOOP
    new_partner_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, role
    ) VALUES (
      new_partner_id,
      'suspended-partner' || i || '@test.com',
      crypt('TestUser123!', gen_salt('bf')),
      NOW(), NOW() - ((i * 60) || ' days')::interval, NOW(),
      '{"provider": "email", "providers": ["email"], "role": "seller"}'::jsonb,
      jsonb_build_object('full_name', 'Suspended Partner ' || i),
      false,
      'authenticated'
    )
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO user_profiles (id, role, name, phone, is_email_verified, is_phone_verified)
    VALUES (
      new_partner_id,
      'seller',
      'Suspended Partner ' || i,
      '+919876545' || LPAD(i::text, 3, '0'),
      true,
      true
    )
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name;
    
    INSERT INTO stores (
      id, owner_id, name, slug, email, phone, category, status, is_active,
      created_at
    ) VALUES (
      gen_random_uuid(),
      new_partner_id,
      'Suspended Store ' || i,
      'suspended-store-' || i,
      'suspended-partner' || i || '@test.com',
      '+919876545' || LPAD(i::text, 3, '0'),
      CASE (i % 3) WHEN 0 THEN 'electronics' WHEN 1 THEN 'gourmet' ELSE 'wellness' END,
      'suspended',
      false,
      NOW() - ((i * 60) || ' days')::interval
    );
  END LOOP;
  
  -- Rejected Stores (3-5 stores)
  FOR i IN 1..4 LOOP
    new_partner_id := gen_random_uuid();
    
    INSERT INTO auth.users (
      id, email, encrypted_password, email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data, is_super_admin, role
    ) VALUES (
      new_partner_id,
      'rejected-partner' || i || '@test.com',
      crypt('TestUser123!', gen_salt('bf')),
      NOW(), NOW() - ((i * 45) || ' days')::interval, NOW(),
      '{"provider": "email", "providers": ["email"], "role": "seller"}'::jsonb,
      jsonb_build_object('full_name', 'Rejected Partner ' || i),
      false,
      'authenticated'
    )
    ON CONFLICT (id) DO NOTHING;
    
    INSERT INTO user_profiles (id, role, name, phone, is_email_verified, is_phone_verified)
    VALUES (
      new_partner_id,
      'seller',
      'Rejected Partner ' || i,
      '+919876546' || LPAD(i::text, 3, '0'),
      true,
      true
    )
    ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, name = EXCLUDED.name;
    
    INSERT INTO stores (
      id, owner_id, name, slug, email, phone, category, status, is_active,
      created_at
    ) VALUES (
      gen_random_uuid(),
      new_partner_id,
      'Rejected Store ' || i,
      'rejected-store-' || i,
      'rejected-partner' || i || '@test.com',
      '+919876546' || LPAD(i::text, 3, '0'),
      CASE (i % 4) WHEN 0 THEN 'electronics' WHEN 1 THEN 'gourmet' WHEN 2 THEN 'wellness' ELSE 'corporate' END,
      'rejected',
      false,
      NOW() - ((i * 45) || ' days')::interval
    );
  END LOOP;
END $$;

-- ============================================================================
-- PART 3: COMPLETED ORDERS FOR GMV CALCULATION
-- ============================================================================

-- Get existing customer and store IDs
DO $$
DECLARE
  customer1_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
  customer2_id UUID := '00000000-0000-0000-0000-000000000002'::uuid;
  customer3_id UUID := '00000000-0000-0000-0000-000000000003'::uuid;
  store1_id UUID;
  store2_id UUID;
  order_id UUID;
  order_item_id UUID;
  item_id UUID;
  order_num INTEGER := 1000;
BEGIN
  -- Get store IDs
  SELECT id INTO store1_id FROM stores WHERE owner_id = '00000000-0000-0000-0000-000000000101'::uuid LIMIT 1;
  SELECT id INTO store2_id FROM stores WHERE owner_id = '00000000-0000-0000-0000-000000000102'::uuid LIMIT 1;
  
  -- Get item IDs
  SELECT id INTO item_id FROM store_items WHERE store_id = store1_id LIMIT 1;
  
  -- Create 50+ completed orders for GMV calculation
  FOR i IN 1..55 LOOP
    order_id := gen_random_uuid();
    order_num := order_num + 1;
    
    -- Create completed order
    INSERT INTO orders (
      id, order_number, customer_id, store_id, subtotal, delivery_fee, tax_amount,
      discount_amount, total_amount, status, payment_status, created_at,
      confirmed_at, delivered_at
    ) VALUES (
      order_id,
      'ORD-' || LPAD(order_num::text, 6, '0'),
      CASE (i % 3) WHEN 0 THEN customer1_id WHEN 1 THEN customer2_id ELSE customer3_id END,
      CASE (i % 2) WHEN 0 THEN store1_id ELSE store2_id END,
      (50000 + (random() * 500000)::int)::numeric, -- ₹500 - ₹5000
      CASE WHEN (random() * 100)::int < 30 THEN 0 ELSE 5000 END::numeric, -- Free delivery 30% of time
      ((50000 + (random() * 500000)::int) * 0.18)::numeric, -- 18% GST
      0,
      ((50000 + (random() * 500000)::int) * 1.18 + 
       CASE WHEN (random() * 100)::int < 30 THEN 0 ELSE 5000 END)::numeric,
      'delivered',
      'captured',
      NOW() - ((i || ' hours')::interval),
      NOW() - ((i || ' hours')::interval) + '30 minutes'::interval,
      NOW() - ((i || ' hours')::interval) + '2 hours'::interval
    );
    
    -- Create order item
    order_item_id := gen_random_uuid();
    INSERT INTO order_items (
      id, order_id, item_id, item_name, item_image_url, quantity,
      unit_price, total_price
    ) VALUES (
      order_item_id,
      order_id,
      item_id,
      'Test Product ' || i,
      'https://via.placeholder.com/300',
      (1 + (random() * 5)::int),
      (5000 + (random() * 50000)::int)::numeric,
      ((5000 + (random() * 50000)::int) * (1 + (random() * 5)::int))::numeric
    );
    
    -- Create payment transaction
    INSERT INTO payment_transactions (
      id, order_id, gateway, gateway_transaction_id, gateway_order_id,
      amount, currency, payment_method, status, initiated_at, authorized_at, captured_at
    ) VALUES (
      gen_random_uuid(),
      order_id,
      'razorpay',
      'txn_' || LPAD(order_num::text, 10, '0'),
      'order_' || LPAD(order_num::text, 10, '0'),
      ((50000 + (random() * 500000)::int) * 1.18 + 
       CASE WHEN (random() * 100)::int < 30 THEN 0 ELSE 5000 END)::numeric,
      'INR',
      CASE (i % 3) WHEN 0 THEN 'card' WHEN 1 THEN 'upi' ELSE 'netbanking' END,
      'captured',
      NOW() - ((i || ' hours')::interval),
      NOW() - ((i || ' hours')::interval) + '1 minute'::interval,
      NOW() - ((i || ' hours')::interval) + '2 minutes'::interval
    );
  END LOOP;
  
  -- Today's completed orders (for GMV Today stat)
  FOR i IN 1..15 LOOP
    order_id := gen_random_uuid();
    order_num := order_num + 1;
    
    INSERT INTO orders (
      id, order_number, customer_id, store_id, subtotal, delivery_fee, tax_amount,
      discount_amount, total_amount, status, payment_status, created_at,
      confirmed_at, delivered_at
    ) VALUES (
      order_id,
      'ORD-' || LPAD(order_num::text, 6, '0'),
      CASE (i % 3) WHEN 0 THEN customer1_id WHEN 1 THEN customer2_id ELSE customer3_id END,
      CASE (i % 2) WHEN 0 THEN store1_id ELSE store2_id END,
      (50000 + (random() * 500000)::int)::numeric,
      CASE WHEN (random() * 100)::int < 30 THEN 0 ELSE 5000 END::numeric,
      ((50000 + (random() * 500000)::int) * 0.18)::numeric,
      0,
      ((50000 + (random() * 500000)::int) * 1.18 + 
       CASE WHEN (random() * 100)::int < 30 THEN 0 ELSE 5000 END)::numeric,
      'delivered',
      'captured',
      NOW() - ((i || ' hours')::interval),
      NOW() - ((i || ' hours')::interval) + '30 minutes'::interval,
      NOW() - ((i || ' hours')::interval) + '2 hours'::interval
    );
    
    order_item_id := gen_random_uuid();
    INSERT INTO order_items (
      id, order_id, item_id, item_name, item_image_url, quantity,
      unit_price, total_price
    ) VALUES (
      order_item_id,
      order_id,
      item_id,
      'Today Product ' || i,
      'https://via.placeholder.com/300',
      (1 + (random() * 5)::int),
      (5000 + (random() * 50000)::int)::numeric,
      ((5000 + (random() * 50000)::int) * (1 + (random() * 5)::int))::numeric
    );
    
    INSERT INTO payment_transactions (
      id, order_id, gateway, gateway_transaction_id, gateway_order_id,
      amount, currency, payment_method, status, initiated_at, authorized_at, captured_at
    ) VALUES (
      gen_random_uuid(),
      order_id,
      'razorpay',
      'txn_' || LPAD(order_num::text, 10, '0'),
      'order_' || LPAD(order_num::text, 10, '0'),
      ((50000 + (random() * 500000)::int) * 1.18 + 
       CASE WHEN (random() * 100)::int < 30 THEN 0 ELSE 5000 END)::numeric,
      'INR',
      CASE (i % 3) WHEN 0 THEN 'card' WHEN 1 THEN 'upi' ELSE 'netbanking' END,
      'captured',
      NOW() - ((i || ' hours')::interval),
      NOW() - ((i || ' hours')::interval) + '1 minute'::interval,
      NOW() - ((i || ' hours')::interval) + '2 minutes'::interval
    );
  END LOOP;
END $$;

-- Note: Additional data like reviews, refunds can be added as needed
-- This seed file provides comprehensive data for admin dashboard testing
-- Disputes table may be added in future migrations

