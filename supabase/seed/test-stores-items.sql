-- Test Stores and Items Seed Data
-- Comprehensive test data matching real Supabase schema
-- Run this after migrations and test-users.sql

-- Test Store 1: Premium Gifts Co
INSERT INTO stores (
  id,
  owner_id,
  name,
  slug,
  description,
  tagline,
  logo_url,
  banner_url,
  category,
  email,
  phone,
  address,
  city,
  state,
  pincode,
  gstin,
  pan,
  business_type,
  status,
  is_active,
  rating,
  rating_count,
  delivery_time,
  min_order_value,
  is_sponsored,
  is_verified,
  badge
) VALUES (
  '00000000-0000-0000-0000-000000000101'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid, -- Test user as owner
  'Premium Gifts Co',
  'premium-gifts-co',
  'Your one-stop destination for premium gifting solutions',
  'Premium tech accessories',
  'https://via.placeholder.com/150',
  'https://via.placeholder.com/800x200',
  'Tech Gifts',
  'contact@premiumgifts.co',
  '+919876543211',
  '456 Business Park, Tech Hub',
  'Mumbai',
  'Maharashtra',
  '400001',
  '27AAAAA0000A1Z5',
  'AAAAA0000A',
  'Private Limited',
  'approved',
  true,
  4.5,
  234,
  '1-2 days',
  500.00,
  true,
  true,
  'bestseller'
)
ON CONFLICT (id) DO NOTHING;

-- Test Store 2: Gourmet Delights
INSERT INTO stores (
  id,
  owner_id,
  name,
  slug,
  description,
  tagline,
  logo_url,
  banner_url,
  category,
  email,
  phone,
  address,
  city,
  state,
  pincode,
  status,
  is_active,
  rating,
  rating_count,
  delivery_time,
  min_order_value,
  badge
) VALUES (
  '00000000-0000-0000-0000-000000000102'::uuid,
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Gourmet Delights',
  'gourmet-delights',
  'Curated gourmet food hampers for every occasion',
  'Curated gourmet experiences',
  'https://via.placeholder.com/150',
  'https://via.placeholder.com/800x200',
  'Gourmet',
  'hello@gourmetdelights.in',
  '+919876543212',
  '789 Food Street, Culinary District',
  'Delhi',
  'Delhi',
  '110001',
  'approved',
  true,
  4.8,
  567,
  '2-3 days',
  1000.00,
  'trending'
)
ON CONFLICT (id) DO NOTHING;

-- Test Items for Premium Gifts Co
INSERT INTO store_items (
  id,
  store_id,
  name,
  slug,
  description,
  short_desc,
  image_url,
  price,
  mrp,
  stock_quantity,
  moq,
  category,
  is_customizable,
  personalizations,
  preparation_time,
  delivery_time,
  rating,
  rating_count,
  badge,
  is_active,
  status
) VALUES (
  '00000000-0000-0000-0000-000000000201'::uuid,
  '00000000-0000-0000-0000-000000000101'::uuid,
  'Custom Branded T-Shirt',
  'custom-branded-t-shirt',
  'Premium quality cotton t-shirt with custom branding options. Perfect for corporate gifting.',
  'Premium cotton • Custom branding • Fast delivery',
  'https://via.placeholder.com/400',
  599.00,
  899.00,
  100,
  25,
  'Apparel',
  true,
  '[
    {"id": "front-print", "label": "Front Print Design", "price": 100, "requiresPreview": true},
    {"id": "back-print", "label": "Back Print Design", "price": 100, "requiresPreview": true},
    {"id": "gift-wrap", "label": "Premium Gift Wrap", "price": 50, "requiresPreview": false}
  ]'::jsonb,
  '2-3 days',
  '3-5 days',
  4.5,
  89,
  'bestseller',
  true,
  'approved'
),
(
  '00000000-0000-0000-0000-000000000202'::uuid,
  '00000000-0000-0000-0000-000000000101'::uuid,
  'Wireless Earbuds Pro',
  'wireless-earbuds-pro',
  'High-quality wireless earbuds with noise cancellation. Great for tech enthusiasts.',
  'Noise cancellation • 24hr battery • Premium sound',
  'https://via.placeholder.com/400',
  1999.00,
  2999.00,
  50,
  1,
  'Electronics',
  false,
  '[]'::jsonb,
  '1 day',
  '1-2 days',
  4.7,
  234,
  'trending',
  true,
  'approved'
),
(
  '00000000-0000-0000-0000-000000000203'::uuid,
  '00000000-0000-0000-0000-000000000101'::uuid,
  'Engraved Metal Water Bottle',
  'engraved-metal-water-bottle',
  'Stainless steel water bottle with custom engraving option. Eco-friendly and durable.',
  'Stainless steel • Custom engraving • BPA free',
  'https://via.placeholder.com/400',
  799.00,
  1299.00,
  75,
  10,
  'Accessories',
  true,
  '[
    {"id": "engraving", "label": "Custom Engraving Text", "price": 150, "requiresPreview": true},
    {"id": "gift-box", "label": "Gift Box", "price": 50, "requiresPreview": false}
  ]'::jsonb,
  '3-4 days',
  '2-3 days',
  4.6,
  156,
  NULL,
  true,
  'approved'
)
ON CONFLICT (id) DO NOTHING;

-- Test Items for Gourmet Delights
INSERT INTO store_items (
  id,
  store_id,
  name,
  slug,
  description,
  short_desc,
  image_url,
  price,
  mrp,
  stock_quantity,
  moq,
  category,
  is_customizable,
  preparation_time,
  delivery_time,
  rating,
  rating_count,
  badge,
  is_active,
  status
) VALUES (
  '00000000-0000-0000-0000-000000000301'::uuid,
  '00000000-0000-0000-0000-000000000102'::uuid,
  'Premium Chocolate Hamper',
  'premium-chocolate-hamper',
  'Curated selection of premium chocolates from around the world. Perfect for special occasions.',
  'International selection • Handpicked • Fresh',
  'https://via.placeholder.com/400',
  2499.00,
  3499.00,
  30,
  1,
  'Hampers',
  false,
  '1-2 days',
  '1-2 days',
  4.8,
  445,
  'bestseller',
  true,
  'approved'
),
(
  '00000000-0000-0000-0000-000000000302'::uuid,
  '00000000-0000-0000-0000-000000000102'::uuid,
  'Gourmet Coffee Selection',
  'gourmet-coffee-selection',
  'Exclusive blend of premium coffee beans from different regions. For coffee connoisseurs.',
  'Premium blends • Fresh roasted • 5 varieties',
  'https://via.placeholder.com/400',
  1499.00,
  1999.00,
  40,
  1,
  'Beverages',
  false,
  '2-3 days',
  '2-3 days',
  4.6,
  278,
  NULL,
  true,
  'approved'
)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE stores IS 'Test stores seeded for development';
COMMENT ON TABLE store_items IS 'Test items seeded for development';










