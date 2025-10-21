-- Wyshkit Test Data with Realistic Images
-- Run this AFTER all 13 migrations are complete
-- Last Updated: October 20, 2025

-- ============================================
-- 1. BANNER IMAGES (Home Carousel)
-- ============================================

-- Using high-quality free stock images from Unsplash/Pexels (replace with your CDN URLs)
INSERT INTO banners (id, title, subtitle, image_url, cta_text, cta_link, is_active, display_order, created_at) VALUES
  (
    gen_random_uuid(),
    'Diwali Gifting Made Easy',
    'Premium hampers starting at ₹499',
    'https://images.unsplash.com/photo-1603910234550-7f2c0b5d9a5a?w=1200&h=400&fit=crop', -- Diwali diyas
    'Shop Now',
    '/customer/occasions/diwali',
    true,
    1,
    NOW()
  ),
  (
    gen_random_uuid(),
    'Corporate Gifts That Impress',
    'Bulk orders with custom branding',
    'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=1200&h=400&fit=crop', -- Gift boxes
    'Explore',
    '/customer/occasions/corporate',
    true,
    2,
    NOW()
  ),
  (
    gen_random_uuid(),
    'Wedding Season Specials',
    'Personalized gifts for your loved ones',
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&h=400&fit=crop', -- Wedding decor
    'View Collection',
    '/customer/occasions/wedding',
    true,
    3,
    NOW()
  ),
  (
    gen_random_uuid(),
    'Birthday Surprises Delivered',
    'Same-day delivery available',
    'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=1200&h=400&fit=crop', -- Birthday celebration
    'Browse Gifts',
    '/customer/occasions/birthday',
    true,
    4,
    NOW()
  );

-- ============================================
-- 2. OCCASION CARDS (Customer Home Grid)
-- ============================================

INSERT INTO occasions (id, name, slug, description, icon_emoji, image_url, is_active, display_order, created_at) VALUES
  (
    gen_random_uuid(),
    'Diwali',
    'diwali',
    'Festival of Lights celebration gifts',
    '🪔',
    'https://images.unsplash.com/photo-1603910234550-7f2c0b5d9a5a?w=400&h=300&fit=crop',
    true,
    1,
    NOW()
  ),
  (
    gen_random_uuid(),
    'Birthday',
    'birthday',
    'Make their special day memorable',
    '🎂',
    'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=400&h=300&fit=crop',
    true,
    2,
    NOW()
  ),
  (
    gen_random_uuid(),
    'Corporate',
    'corporate',
    'Professional gifts for business',
    '💼',
    'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop',
    true,
    3,
    NOW()
  ),
  (
    gen_random_uuid(),
    'Wedding',
    'wedding',
    'Celebrate love and new beginnings',
    '💍',
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=400&h=300&fit=crop',
    true,
    4,
    NOW()
  ),
  (
    gen_random_uuid(),
    'Anniversary',
    'anniversary',
    'Thoughtful gifts for milestones',
    '💐',
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=300&fit=crop',
    true,
    5,
    NOW()
  ),
  (
    gen_random_uuid(),
    'Housewarming',
    'housewarming',
    'Bless their new home',
    '🏡',
    'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=400&h=300&fit=crop',
    true,
    6,
    NOW()
  ),
  (
    gen_random_uuid(),
    'Thank You',
    'thank-you',
    'Express gratitude with gifts',
    '🙏',
    'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=400&h=300&fit=crop',
    true,
    7,
    NOW()
  ),
  (
    gen_random_uuid(),
    'Get Well Soon',
    'get-well-soon',
    'Send care and healing wishes',
    '🌻',
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=400&h=300&fit=crop',
    true,
    8,
    NOW()
  );

-- ============================================
-- 3. TEST PARTNERS (2 Partners)
-- ============================================

-- Partner 1: GiftCraft (Premium Hampers)
INSERT INTO partner_profiles (
  id,
  user_id,
  business_name,
  email,
  phone,
  gstin,
  pan,
  bank_account_number,
  bank_ifsc,
  bank_account_holder_name,
  business_address,
  onboarding_status,
  kyc_status,
  commission_percent,
  is_active,
  created_at
) VALUES (
  'partner-giftcraft-001',
  'partner-giftcraft-001', -- Assumes auth user created
  'GiftCraft Premium',
  'partner@giftcraft.com',
  '+919876543210',
  '27AABCU9603R1ZM',
  'AABCU9603R',
  '1234567890',
  'HDFC0001234',
  'GiftCraft Premium Pvt Ltd',
  '123, MG Road, Bangalore - 560001',
  'approved',
  'verified',
  20.00, -- 20% commission
  true,
  NOW()
);

-- Partner 2: BoatAudio (Electronics - for sourcing test)
INSERT INTO partner_profiles (
  id,
  user_id,
  business_name,
  email,
  phone,
  gstin,
  pan,
  bank_account_number,
  bank_ifsc,
  bank_account_holder_name,
  business_address,
  onboarding_status,
  kyc_status,
  commission_percent,
  is_active,
  created_at
) VALUES (
  'partner-boat-002',
  'partner-boat-002',
  'Boat Audio India',
  'partner@boat.com',
  '+919876543211',
  '27AABCU9603R1ZN',
  'AABCU9603S',
  '9876543210',
  'ICICI0001234',
  'Boat Audio India Pvt Ltd',
  '456, Tech Park, Delhi - 110001',
  'approved',
  'verified',
  15.00, -- 15% premium partner commission
  true,
  NOW()
);

-- ============================================
-- 4. SAMPLE PRODUCTS (10 Products with Features)
-- ============================================

-- Product 1: Diwali Premium Hamper (GiftCraft)
INSERT INTO partner_products (
  id,
  partner_id,
  name,
  description,
  short_desc,
  price, -- in paise
  stock,
  images,
  is_customizable,
  add_ons,
  bulk_pricing,
  sponsored,
  sponsored_start_date,
  sponsored_end_date,
  sourcing_available,
  sourcing_limit_monthly,
  sourcing_limit_enabled,
  category,
  estimated_delivery_days,
  is_active,
  rating,
  rating_count,
  created_at
) VALUES (
  gen_random_uuid(),
  'partner-giftcraft-001',
  'Diwali Premium Hamper',
  'Curated selection of premium dry fruits, handmade chocolates, decorative diyas, and a personalized greeting card. Perfect for corporate gifting or family celebrations. Each item is carefully sourced and packaged in an elegant reusable box.',
  'Premium dry fruits, chocolates & diyas in elegant packaging',
  249900, -- ₹2,499
  150,
  ARRAY[
    'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1603910234550-7f2c0b5d9a5a?w=600&h=600&fit=crop'
  ],
  true, -- Customizable
  '[
    {"id": "addon-1", "name": "Company Logo Print", "price": 20000, "moq": 50, "requiresProof": true, "description": "Upload logo PNG/SVG (max 5MB)"},
    {"id": "addon-2", "name": "Premium Gift Wrapping", "price": 15000, "moq": 1, "requiresProof": false, "description": "Luxury velvet wrapping with ribbon"},
    {"id": "addon-3", "name": "Personalized Greeting Card", "price": 5000, "moq": 1, "requiresProof": true, "description": "Custom message (max 100 chars)"}
  ]'::jsonb,
  '[
    {"minQty": 10, "price": 239900, "discountPercent": 4},
    {"minQty": 25, "price": 224900, "discountPercent": 10},
    {"minQty": 50, "price": 212400, "discountPercent": 15}
  ]'::jsonb, -- Bulk pricing tiers
  true, -- Sponsored
  NOW(),
  NOW() + INTERVAL '30 days',
  false, -- Not for sourcing (final product)
  NULL,
  false,
  'Hampers',
  '3-5 days',
  true,
  4.8,
  234,
  NOW()
);

-- Product 2: Boat Rockerz 450 (Boat Audio) - For sourcing
INSERT INTO partner_products (
  id,
  partner_id,
  name,
  description,
  short_desc,
  price,
  stock,
  images,
  is_customizable,
  add_ons,
  bulk_pricing,
  sponsored,
  sourcing_available,
  sourcing_limit_monthly,
  sourcing_limit_enabled,
  category,
  estimated_delivery_days,
  is_active,
  rating,
  rating_count,
  created_at
) VALUES (
  gen_random_uuid(),
  'partner-boat-002',
  'Boat Rockerz 450 Bluetooth Headphones',
  'Premium wireless headphones with 15-hour battery life, immersive audio, and ergonomic design. Perfect for corporate gifts or personal use. Includes 1-year warranty.',
  'Wireless headphones with 15hr battery & premium sound',
  149900, -- ₹1,499
  5000,
  ARRAY[
    'https://images.unsplash.com/photo-1545127398-14699f92334b?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop'
  ],
  true,
  '[
    {"id": "addon-boat-1", "name": "Engraving (Company Name)", "price": 20000, "moq": 50, "requiresProof": true, "description": "Laser engraving on headband"}
  ]'::jsonb,
  '[
    {"minQty": 50, "price": 139900, "discountPercent": 7},
    {"minQty": 100, "price": 129900, "discountPercent": 13},
    {"minQty": 200, "price": 119900, "discountPercent": 20}
  ]'::jsonb,
  false, -- Not sponsored
  true, -- Available for sourcing (other partners can include in hampers)
  100, -- Max 100 units/month for sourcing
  true,
  'Electronics',
  '1-2 days',
  true,
  4.6,
  1842,
  NOW()
);

-- Product 3: Birthday Special Gift Box (GiftCraft)
INSERT INTO partner_products (
  id,
  partner_id,
  name,
  description,
  short_desc,
  price,
  stock,
  images,
  is_customizable,
  add_ons,
  category,
  estimated_delivery_days,
  is_active,
  rating,
  rating_count,
  created_at
) VALUES (
  gen_random_uuid(),
  'partner-giftcraft-001',
  'Birthday Celebration Box',
  'Surprise your loved ones with this delightful birthday gift box containing handmade chocolates, aromatic candles, mini succulent plant, and a happy birthday balloon. Includes space for personalized message.',
  'Chocolates, candles, plant & balloon in festive packaging',
  99900, -- ₹999
  200,
  ARRAY[
    'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&h=600&fit=crop'
  ],
  true,
  '[
    {"id": "addon-bday-1", "name": "Birthday Greeting Card", "price": 5000, "moq": 1, "requiresProof": false, "description": "Pre-printed happy birthday card"}
  ]'::jsonb,
  'Birthday',
  '2-3 days',
  true,
  4.7,
  567,
  NOW()
);

-- Product 4: Corporate Executive Pen Set (GiftCraft) - Bestseller
INSERT INTO partner_products (
  id,
  partner_id,
  name,
  description,
  short_desc,
  price,
  stock,
  images,
  is_customizable,
  add_ons,
  bulk_pricing,
  category,
  estimated_delivery_days,
  is_active,
  rating,
  rating_count,
  tags,
  created_at
) VALUES (
  gen_random_uuid(),
  'partner-giftcraft-001',
  'Executive Pen Set - Parker Premium',
  'Elegant Parker ballpoint and fountain pen set in premium leatherette box. Ideal for corporate gifting to employees, clients, or executives. Can be personalized with name engraving.',
  'Parker premium pen set in leatherette box',
  349900, -- ₹3,499
  80,
  ARRAY[
    'https://images.unsplash.com/photo-1565837137-a3e2f8e97e08?w=600&h=600&fit=crop'
  ],
  true,
  '[
    {"id": "addon-pen-1", "name": "Name Engraving", "price": 30000, "moq": 10, "requiresProof": true, "description": "Engraved on pen cap (max 20 chars)"}
  ]'::jsonb,
  '[
    {"minQty": 10, "price": 329900, "discountPercent": 6},
    {"minQty": 25, "price": 314900, "discountPercent": 10}
  ]'::jsonb,
  'Corporate',
  '3-4 days',
  true,
  4.9,
  892,
  ARRAY['bestseller'],
  NOW()
);

-- Product 5: Wedding Trousseau Hamper (GiftCraft) - Trending
INSERT INTO partner_products (
  id,
  partner_id,
  name,
  description,
  short_desc,
  price,
  stock,
  images,
  is_customizable,
  category,
  estimated_delivery_days,
  is_active,
  rating,
  rating_count,
  tags,
  created_at
) VALUES (
  gen_random_uuid(),
  'partner-giftcraft-001',
  'Wedding Trousseau Hamper',
  'Luxurious wedding gift hamper with premium dry fruits, silver-plated items, decorative candles, and traditional sweets. Perfect for blessing the newlyweds.',
  'Premium dry fruits, silver items & traditional sweets',
  549900, -- ₹5,499
  50,
  ARRAY[
    'https://images.unsplash.com/photo-1519741497674-611481863552?w=600&h=600&fit=crop',
    'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=600&h=600&fit=crop'
  ],
  false,
  'Wedding',
  '5-7 days',
  true,
  4.8,
  345,
  ARRAY['trending'],
  NOW()
);

-- Product 6: Thank You Gift Box (GiftCraft)
INSERT INTO partner_products (
  id,
  partner_id,
  name,
  description,
  short_desc,
  price,
  stock,
  images,
  is_customizable,
  add_ons,
  category,
  estimated_delivery_days,
  is_active,
  rating,
  rating_count,
  created_at
) VALUES (
  gen_random_uuid(),
  'partner-giftcraft-001',
  'Gratitude Gift Box',
  'Express your appreciation with this thoughtfully curated thank you gift box. Contains premium chocolates, aromatic tea, handmade soap, and a "Thank You" card.',
  'Chocolates, tea, soap & thank you card',
  79900, -- ₹799
  180,
  ARRAY[
    'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?w=600&h=600&fit=crop'
  ],
  true,
  '[
    {"id": "addon-ty-1", "name": "Personalized Note", "price": 3000, "moq": 1, "requiresProof": true, "description": "Custom thank you message (max 50 chars)"}
  ]'::jsonb,
  'Thank You',
  '2-3 days',
  true,
  4.6,
  234,
  NOW()
);

-- Product 7: Boat Smartwatch (Boat Audio) - For sourcing
INSERT INTO partner_products (
  id,
  partner_id,
  name,
  description,
  short_desc,
  price,
  stock,
  images,
  is_customizable,
  sourcing_available,
  sourcing_limit_monthly,
  sourcing_limit_enabled,
  category,
  estimated_delivery_days,
  is_active,
  rating,
  rating_count,
  created_at
) VALUES (
  gen_random_uuid(),
  'partner-boat-002',
  'Boat Storm Smartwatch',
  'Feature-packed smartwatch with fitness tracking, heart rate monitor, 7-day battery life, and premium metal strap. Perfect for tech-savvy gift recipients.',
  'Fitness smartwatch with 7-day battery',
  299900, -- ₹2,999
  3000,
  ARRAY[
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop'
  ],
  false,
  true,
  50, -- Max 50 units/month for sourcing
  true,
  'Electronics',
  '1-2 days',
  true,
  4.5,
  1234,
  NOW()
);

-- Product 8: Anniversary Gift Hamper (GiftCraft)
INSERT INTO partner_products (
  id,
  partner_id,
  name,
  description,
  short_desc,
  price,
  stock,
  images,
  is_customizable,
  add_ons,
  category,
  estimated_delivery_days,
  is_active,
  rating,
  rating_count,
  created_at
) VALUES (
  gen_random_uuid(),
  'partner-giftcraft-001',
  'Anniversary Romance Hamper',
  'Celebrate love with this romantic anniversary hamper. Includes premium chocolates, scented candles, rose petals, and a beautiful photo frame.',
  'Chocolates, candles, rose petals & photo frame',
  179900, -- ₹1,799
  120,
  ARRAY[
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&h=600&fit=crop'
  ],
  true,
  '[
    {"id": "addon-ann-1", "name": "Anniversary Card", "price": 5000, "moq": 1, "requiresProof": false, "description": "Pre-printed anniversary wishes"}
  ]'::jsonb,
  'Anniversary',
  '2-3 days',
  true,
  4.7,
  456,
  NOW()
);

-- Product 9: Housewarming Essentials (GiftCraft)
INSERT INTO partner_products (
  id,
  partner_id,
  name,
  description,
  short_desc,
  price,
  stock,
  images,
  is_customizable,
  category,
  estimated_delivery_days,
  is_active,
  rating,
  rating_count,
  created_at
) VALUES (
  gen_random_uuid(),
  'partner-giftcraft-001',
  'Housewarming Essentials Box',
  'Bless the new home with this practical and thoughtful gift box. Contains decorative items, kitchen essentials, and traditional good luck charms.',
  'Decorative items, kitchen essentials & good luck charms',
  129900, -- ₹1,299
  90,
  ARRAY[
    'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=600&h=600&fit=crop'
  ],
  false,
  'Housewarming',
  '3-4 days',
  true,
  4.6,
  234,
  NOW()
);

-- Product 10: Get Well Soon Care Package (GiftCraft)
INSERT INTO partner_products (
  id,
  partner_id,
  name,
  description,
  short_desc,
  price,
  stock,
  images,
  is_customizable,
  category,
  estimated_delivery_days,
  is_active,
  rating,
  rating_count,
  created_at
) VALUES (
  gen_random_uuid(),
  'partner-giftcraft-001',
  'Get Well Soon Care Package',
  'Send healing wishes with this thoughtful care package. Includes healthy snacks, herbal tea, cozy socks, and an uplifting book.',
  'Healthy snacks, herbal tea, socks & uplifting book',
  89900, -- ₹899
  150,
  ARRAY[
    'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=600&h=600&fit=crop'
  ],
  false,
  'Get Well Soon',
  '1-2 days',
  true,
  4.7,
  189,
  NOW()
);

-- ============================================
-- 5. SAMPLE CAMPAIGNS (2 Active Campaigns)
-- ============================================

INSERT INTO campaigns (
  id,
  partner_id,
  name,
  type,
  discount_type,
  discount_value,
  products,
  start_date,
  end_date,
  featured,
  banner_url,
  terms,
  status,
  impressions,
  orders,
  revenue,
  created_at
) VALUES
  (
    gen_random_uuid(),
    'partner-giftcraft-001',
    'Diwali Mega Sale',
    'discount',
    'percentage',
    10,
    ARRAY(SELECT id FROM partner_products WHERE partner_id = 'partner-giftcraft-001' LIMIT 3)::text[],
    NOW(),
    NOW() + INTERVAL '15 days',
    true, -- Featured
    'https://images.unsplash.com/photo-1603910234550-7f2c0b5d9a5a?w=1200&h=400&fit=crop',
    'Valid for orders above ₹1,000. Not applicable with other offers.',
    'active',
    15420,
    234,
    58760000, -- ₹587,600 in paise
    NOW()
  ),
  (
    gen_random_uuid(),
    'partner-boat-002',
    'Tech Gifts Bonanza',
    'discount',
    'flat',
    50000, -- ₹500 off
    ARRAY(SELECT id FROM partner_products WHERE partner_id = 'partner-boat-002' LIMIT 2)::text[],
    NOW(),
    NOW() + INTERVAL '10 days',
    false,
    NULL,
    'Flat ₹500 off on purchases above ₹2,000',
    'active',
    8920,
    145,
    43450000, -- ₹434,500
    NOW()
  );

-- ============================================
-- 6. SAMPLE REVIEWS (5 Reviews)
-- ============================================

INSERT INTO reviews (
  id,
  partner_id,
  customer_id,
  order_id,
  product_id,
  rating,
  comment,
  helpful_count,
  created_at
) VALUES
  (
    gen_random_uuid(),
    'partner-giftcraft-001',
    'customer-test-001',
    'order-test-001',
    (SELECT id FROM partner_products WHERE name = 'Diwali Premium Hamper' LIMIT 1),
    5,
    'Absolutely loved the Diwali hamper! The packaging was premium and all items were of excellent quality. Highly recommend for corporate gifting.',
    23,
    NOW() - INTERVAL '5 days'
  ),
  (
    gen_random_uuid(),
    'partner-boat-002',
    'customer-test-002',
    'order-test-002',
    (SELECT id FROM partner_products WHERE name = 'Boat Rockerz 450 Bluetooth Headphones' LIMIT 1),
    4,
    'Great sound quality and battery life. The engraving for company logo came out perfect. Slightly delayed delivery though.',
    15,
    NOW() - INTERVAL '3 days'
  ),
  (
    gen_random_uuid(),
    'partner-giftcraft-001',
    'customer-test-003',
    'order-test-003',
    (SELECT id FROM partner_products WHERE name = 'Birthday Celebration Box' LIMIT 1),
    5,
    'Perfect birthday surprise! My sister loved every item in the box. The personalized card was a nice touch.',
    8,
    NOW() - INTERVAL '1 day'
  );

-- ============================================
-- 7. SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ Test data added successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Created:';
  RAISE NOTICE '- 4 Banner images (carousel)';
  RAISE NOTICE '- 8 Occasion cards';
  RAISE NOTICE '- 2 Test partners (GiftCraft, Boat Audio)';
  RAISE NOTICE '- 10 Sample products (with all features: bulk pricing, add-ons, sponsored, sourcing)';
  RAISE NOTICE '- 2 Active campaigns';
  RAISE NOTICE '- 3 Customer reviews';
  RAISE NOTICE '';
  RAISE NOTICE '🔑 Test Credentials:';
  RAISE NOTICE 'Partner 1: partner@giftcraft.com (password: set in Supabase Auth)';
  RAISE NOTICE 'Partner 2: partner@boat.com (password: set in Supabase Auth)';
  RAISE NOTICE '';
  RAISE NOTICE '🌐 Browse products at: http://localhost:8080/customer/home';
END $$;

