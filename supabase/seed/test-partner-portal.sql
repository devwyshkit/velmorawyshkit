-- Partner Portal Seed Data
-- Comprehensive test data for partner dashboard testing
-- Includes: orders, earnings, reviews, products in various states

-- ============================================================================
-- PART 1: MORE ORDERS FOR EXISTING PARTNER STORES
-- ============================================================================

DO $$
DECLARE
  partner1_id UUID := '00000000-0000-0000-0000-000000000101'::uuid;
  partner2_id UUID := '00000000-0000-0000-0000-000000000102'::uuid;
  store1_id UUID;
  store2_id UUID;
  customer1_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
  customer2_id UUID := '00000000-0000-0000-0000-000000000002'::uuid;
  customer3_id UUID := '00000000-0000-0000-0000-000000000003'::uuid;
  item1_id UUID;
  item2_id UUID;
  order_id UUID;
  order_item_id UUID;
  order_num INTEGER := 2000;
BEGIN
  -- Get store IDs
  SELECT id INTO store1_id FROM stores WHERE owner_id = partner1_id LIMIT 1;
  SELECT id INTO store2_id FROM stores WHERE owner_id = partner2_id LIMIT 1;
  
  -- Get item IDs
  SELECT id INTO item1_id FROM store_items WHERE store_id = store1_id LIMIT 1;
  SELECT id INTO item2_id FROM store_items WHERE store_id = store2_id LIMIT 1;
  
  -- Today's orders for partner dashboard stats (10-15 orders)
  FOR i IN 1..12 LOOP
    order_id := gen_random_uuid();
    order_num := order_num + 1;
    
    INSERT INTO orders (
      id, order_number, customer_id, store_id, subtotal, delivery_fee, tax_amount,
      discount_amount, total_amount, status, payment_status, created_at,
      confirmed_at
    ) VALUES (
      order_id,
      'ORD-' || LPAD(order_num::text, 6, '0'),
      CASE (i % 3) WHEN 0 THEN customer1_id WHEN 1 THEN customer2_id ELSE customer3_id END,
      CASE (i % 2) WHEN 0 THEN store1_id ELSE store2_id END,
      (30000 + (random() * 200000)::int)::numeric, -- ₹300 - ₹2000
      CASE WHEN (random() * 100)::int < 30 THEN 0 ELSE 5000 END::numeric,
      ((30000 + (random() * 200000)::int) * 0.18)::numeric,
      0,
      ((30000 + (random() * 200000)::int) * 1.18 + 
       CASE WHEN (random() * 100)::int < 30 THEN 0 ELSE 5000 END)::numeric,
      CASE (i % 4) 
        WHEN 0 THEN 'placed'
        WHEN 1 THEN 'confirmed'
        WHEN 2 THEN 'preview_pending'
        ELSE 'in_production'
      END,
      CASE WHEN (i % 2) = 0 THEN 'captured' ELSE 'authorized' END,
      NOW() - ((i || ' hours')::interval),
      NOW() - ((i || ' hours')::interval) + '15 minutes'::interval
    );
    
    -- Create order item
    order_item_id := gen_random_uuid();
    INSERT INTO order_items (
      id, order_id, item_id, item_name, item_image_url, quantity,
      unit_price, total_price
    ) VALUES (
      order_item_id,
      order_id,
      CASE (i % 2) WHEN 0 THEN item1_id ELSE item2_id END,
      'Product ' || i,
      'https://via.placeholder.com/300',
      (1 + (random() * 3)::int),
      (3000 + (random() * 20000)::int)::numeric,
      ((3000 + (random() * 20000)::int) * (1 + (random() * 3)::int))::numeric
    );
  END LOOP;
  
  -- Completed orders for earnings calculation (30+ orders over last 30 days)
  FOR i IN 1..35 LOOP
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
      NOW() - ((i || ' days')::interval),
      NOW() - ((i || ' days')::interval) + '30 minutes'::interval,
      NOW() - ((i || ' days')::interval) + '2 days'::interval
    );
    
    order_item_id := gen_random_uuid();
    INSERT INTO order_items (
      id, order_id, item_id, item_name, item_image_url, quantity,
      unit_price, total_price
    ) VALUES (
      order_item_id,
      order_id,
      CASE (i % 2) WHEN 0 THEN item1_id ELSE item2_id END,
      'Completed Product ' || i,
      'https://via.placeholder.com/300',
      (1 + (random() * 5)::int),
      (5000 + (random() * 50000)::int)::numeric,
      ((5000 + (random() * 50000)::int) * (1 + (random() * 5)::int))::numeric
    );
    
    -- Create payment transaction for completed orders
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
      NOW() - ((i || ' days')::interval),
      NOW() - ((i || ' days')::interval) + '1 minute'::interval,
      NOW() - ((i || ' days')::interval) + '2 minutes'::interval
    );
  END LOOP;
  
  -- Orders in preview workflow states
  FOR i IN 1..5 LOOP
    order_id := gen_random_uuid();
    order_num := order_num + 1;
    
    INSERT INTO orders (
      id, order_number, customer_id, store_id, subtotal, delivery_fee, tax_amount,
      discount_amount, total_amount, status, payment_status, created_at,
      confirmed_at
    ) VALUES (
      order_id,
      'ORD-' || LPAD(order_num::text, 6, '0'),
      CASE (i % 3) WHEN 0 THEN customer1_id WHEN 1 THEN customer2_id ELSE customer3_id END,
      store1_id, -- Custom items from store1
      (80000 + (random() * 300000)::int)::numeric,
      0,
      ((80000 + (random() * 300000)::int) * 0.18)::numeric,
      0,
      ((80000 + (random() * 300000)::int) * 1.18)::numeric,
      CASE (i % 3)
        WHEN 0 THEN 'preview_pending'
        WHEN 1 THEN 'preview_ready'
        ELSE 'preview_approved'
      END,
      'authorized', -- Not captured yet
      NOW() - ((i || ' days')::interval),
      NOW() - ((i || ' days')::interval) + '30 minutes'::interval
    );
    
    order_item_id := gen_random_uuid();
    INSERT INTO order_items (
      id, order_id, item_id, item_name, item_image_url, quantity,
      unit_price, total_price, preview_status
    ) VALUES (
      order_item_id,
      order_id,
      item1_id,
      'Custom Product ' || i,
      'https://via.placeholder.com/300',
      1,
      (80000 + (random() * 300000)::int)::numeric,
      (80000 + (random() * 300000)::int)::numeric,
      CASE (i % 3)
        WHEN 0 THEN 'pending'
        WHEN 1 THEN 'preview_ready'
        ELSE 'approved'
      END
    );
  END LOOP;
END $$;

-- ============================================================================
-- PART 2: REVIEWS FOR PARTNER STORES
-- ============================================================================

DO $$
DECLARE
  store1_id UUID;
  store2_id UUID;
  customer1_id UUID := '00000000-0000-0000-0000-000000000001'::uuid;
  customer2_id UUID := '00000000-0000-0000-0000-000000000002'::uuid;
  customer3_id UUID := '00000000-0000-0000-0000-000000000003'::uuid;
  order_id UUID;
  review_id UUID;
BEGIN
  SELECT id INTO store1_id FROM stores WHERE owner_id = '00000000-0000-0000-0000-000000000101'::uuid LIMIT 1;
  SELECT id INTO store2_id FROM stores WHERE owner_id = '00000000-0000-0000-0000-000000000102'::uuid LIMIT 1;
  
  -- Get some order IDs
  SELECT id INTO order_id FROM orders WHERE store_id = store1_id LIMIT 1;
  
  -- Store reviews (10-15 reviews)
  FOR i IN 1..12 LOOP
    review_id := gen_random_uuid();
    
    INSERT INTO reviews (
      id, reviewable_type, reviewable_id, customer_id, order_id,
      rating, title, comment, is_verified, is_approved, created_at
    ) VALUES (
      review_id,
      'store',
      CASE (i % 2) WHEN 0 THEN store1_id ELSE store2_id END,
      CASE (i % 3) WHEN 0 THEN customer1_id WHEN 1 THEN customer2_id ELSE customer3_id END,
      order_id,
      (4 + (random() * 1.0)::numeric)::int, -- 4-5 stars
      'Review Title ' || i,
      'This is a review comment for store ' || i || '. Great products and service!',
      true,
      true,
      NOW() - ((i || ' days')::interval)
    );
  END LOOP;
  
  -- Product reviews (15-20 reviews)
  FOR i IN 1..18 LOOP
    review_id := gen_random_uuid();
    
    INSERT INTO reviews (
      id, reviewable_type, reviewable_id, customer_id, order_id,
      rating, title, comment, is_verified, is_approved, created_at
    ) VALUES (
      review_id,
      'product',
      (SELECT id FROM store_items WHERE store_id = (CASE (i % 2) WHEN 0 THEN store1_id ELSE store2_id END) LIMIT 1),
      CASE (i % 3) WHEN 0 THEN customer1_id WHEN 1 THEN customer2_id ELSE customer3_id END,
      order_id,
      (4 + (random() * 1.0)::numeric)::int,
      'Product Review ' || i,
      'Loved this product! Quality is excellent.',
      true,
      true,
      NOW() - ((i || ' days')::interval)
    );
  END LOOP;
END $$;

-- ============================================================================
-- PART 3: MORE PRODUCTS FOR PARTNER STORES
-- ============================================================================

DO $$
DECLARE
  store1_id UUID;
  store2_id UUID;
  product_id UUID;
BEGIN
  SELECT id INTO store1_id FROM stores WHERE owner_id = '00000000-0000-0000-0000-000000000101'::uuid LIMIT 1;
  SELECT id INTO store2_id FROM stores WHERE owner_id = '00000000-0000-0000-0000-000000000102'::uuid LIMIT 1;
  
  -- Active products (10-15 more products)
  FOR i IN 1..12 LOOP
    product_id := gen_random_uuid();
    
    INSERT INTO store_items (
      id, store_id, name, slug, description, image_url, price, mrp,
      stock_quantity, category, status, is_active, created_at
    ) VALUES (
      product_id,
      CASE (i % 2) WHEN 0 THEN store1_id ELSE store2_id END,
      'Active Product ' || i,
      'active-product-' || i,
      'Description for active product ' || i,
      'https://via.placeholder.com/400',
      (29900 + (random() * 200000)::int)::numeric, -- ₹299 - ₹2299
      (39900 + (random() * 300000)::int)::numeric,
      (10 + (random() * 90)::int),
      CASE (i % 4) WHEN 0 THEN 'electronics' WHEN 1 THEN 'gourmet' WHEN 2 THEN 'wellness' ELSE 'corporate' END,
      'approved',
      true,
      NOW() - ((i * 7) || ' days')::interval
    );
  END LOOP;
  
  -- Pending approval products (3-5 products)
  FOR i IN 1..4 LOOP
    product_id := gen_random_uuid();
    
    INSERT INTO store_items (
      id, store_id, name, slug, description, image_url, price, mrp,
      stock_quantity, category, status, is_active, created_at
    ) VALUES (
      product_id,
      CASE (i % 2) WHEN 0 THEN store1_id ELSE store2_id END,
      'Pending Product ' || i,
      'pending-product-' || i,
      'Description for pending product ' || i,
      'https://via.placeholder.com/400',
      (19900 + (random() * 100000)::int)::numeric,
      (29900 + (random() * 200000)::int)::numeric,
      (5 + (random() * 45)::int),
      CASE (i % 3) WHEN 0 THEN 'electronics' WHEN 1 THEN 'gourmet' ELSE 'wellness' END,
      'pending',
      false,
      NOW() - ((i || ' days')::interval)
    );
  END LOOP;
  
  -- Draft products (2-3 products)
  FOR i IN 1..3 LOOP
    product_id := gen_random_uuid();
    
    INSERT INTO store_items (
      id, store_id, name, slug, description, image_url, price, mrp,
      stock_quantity, category, status, is_active, created_at
    ) VALUES (
      product_id,
      CASE (i % 2) WHEN 0 THEN store1_id ELSE store2_id END,
      'Draft Product ' || i,
      'draft-product-' || i,
      'Description for draft product ' || i,
      'https://via.placeholder.com/400',
      (14900 + (random() * 50000)::int)::numeric,
      (19900 + (random() * 100000)::int)::numeric,
      0,
      CASE (i % 2) WHEN 0 THEN 'electronics' ELSE 'gourmet' END,
      'draft',
      false,
      NOW() - ((i || ' hours')::interval)
    );
  END LOOP;
END $$;

-- Note: Earnings/Transaction data can be calculated from completed orders
-- Pending payouts can be calculated from completed orders that haven't been paid out yet
-- This seed file provides comprehensive data for partner dashboard testing

