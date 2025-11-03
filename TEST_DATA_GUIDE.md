# 🧪 Test Data Guide - Quick Setup for Testing

## Prerequisites

Make sure you have:
- Supabase project set up
- Database tables: `stores`, `store_items`, `partner_profiles`, `users`
- Environment variables configured

---

## 📋 Quick Test Data Setup

### 1. Create Test Store & Partner

#### Via Supabase Dashboard:

```sql
-- Step 1: Create test user (if not exists)
-- Use Supabase Auth to create user or use existing

-- Step 2: Get user ID (from auth.users table)
-- Note: Replace 'test-partner@example.com' with actual email

-- Step 3: Create partner profile
INSERT INTO partner_profiles (
  user_id,
  business_name,
  owner_name,
  phone,
  email,
  status
) VALUES (
  'YOUR_USER_ID_HERE',
  'GiftCraft Premium',
  'John Doe',
  '+919740803490',
  'test-partner@example.com',
  'approved'
);

-- Step 4: Create store
INSERT INTO stores (
  owner_id,
  name,
  slug,
  status
) VALUES (
  'YOUR_USER_ID_HERE',
  'GiftCraft Premium',
  'gift-masters',
  'active'
);

-- Step 5: Verify
SELECT s.id, s.name, s.slug, s.owner_id, pp.business_name
FROM stores s
JOIN partner_profiles pp ON s.owner_id = pp.user_id
WHERE s.slug = 'gift-masters';
```

### 2. Create Test Products

```sql
-- Get store_id from previous query
-- Replace 'STORE_ID_HERE' with actual store ID

-- Simple Product (No Customization)
INSERT INTO store_items (
  store_id,
  name,
  slug,
  description,
  short_desc,
  price,
  category,
  image_url,
  images,
  is_customizable,
  personalizations,
  moq,
  stock_quantity,
  is_active,
  status
) VALUES (
  'STORE_ID_HERE',
  'Premium Gift Hamper',
  'premium-gift-hamper',
  'Curated selection of premium items perfect for corporate gifting',
  'Perfect for corporate gifting',
  249900, -- ₹2499 in paise
  'Premium',
  'https://via.placeholder.com/400x400',
  ARRAY['https://via.placeholder.com/400x400'],
  false,
  NULL,
  1,
  50,
  true,
  'pending' -- Will be approved by admin
);

-- Customizable Product (With Personalizations)
INSERT INTO store_items (
  store_id,
  name,
  slug,
  description,
  short_desc,
  price,
  category,
  image_url,
  images,
  is_customizable,
  personalizations,
  moq,
  stock_quantity,
  is_active,
  status
) VALUES (
  'STORE_ID_HERE',
  'Custom Corporate Gift Box',
  'custom-corporate-gift-box',
  'Personalized gift box with your company branding',
  'Add your logo and branding',
  349900, -- ₹3499 in paise
  'Corporate',
  'https://via.placeholder.com/400x400',
  ARRAY['https://via.placeholder.com/400x400'],
  true,
  '[
    {
      "id": "logo-upload",
      "label": "Company Logo",
      "price": 20000,
      "instructions": "Upload logo in PNG or SVG format, minimum 300x300px",
      "requiresPreview": true
    },
    {
      "id": "greeting-card",
      "label": "Greeting Card",
      "price": 5000,
      "instructions": "Custom message on greeting card",
      "requiresPreview": false
    }
  ]'::jsonb,
  25, -- MOQ
  100,
  true,
  'pending'
);

-- Approved Product (For Customer Testing)
INSERT INTO store_items (
  store_id,
  name,
  slug,
  description,
  short_desc,
  price,
  category,
  image_url,
  images,
  is_customizable,
  personalizations,
  moq,
  stock_quantity,
  is_active,
  status,
  approved_by,
  approved_at
) VALUES (
  'STORE_ID_HERE',
  'Artisan Chocolate Box',
  'artisan-chocolate-box',
  'Handmade chocolates with premium packaging',
  'Handmade chocolates',
  129900, -- ₹1299 in paise
  'Gourmet',
  'https://via.placeholder.com/400x400',
  ARRAY['https://via.placeholder.com/400x400'],
  false,
  NULL,
  1,
  75,
  true,
  'approved', -- Already approved
  'YOUR_ADMIN_USER_ID',
  NOW()
);
```

---

## 🧪 Testing Scenarios

### Scenario 1: New Partner Onboarding
```sql
-- Create partner with pending status
INSERT INTO partner_profiles (
  user_id,
  business_name,
  owner_name,
  phone,
  email,
  status
) VALUES (
  'NEW_USER_ID',
  'New Partner Co',
  'Jane Smith',
  '+919876543210',
  'new-partner@example.com',
  'pending'
);

-- Store should not exist yet
-- Partner completes onboarding → store created
```

### Scenario 2: Partner Creates & Submits Product
```
1. Partner logs in (Store ID: 'gift-masters', Mobile: '+919740803490')
2. Navigates to Products → Create Product
3. Fills form with personalization requiring preview
4. Submits → Product status: 'pending'
5. Admin sees product in approval queue
```

### Scenario 3: Admin Approval Flow
```sql
-- Approve pending product
UPDATE store_items
SET 
  status = 'approved',
  approved_by = 'ADMIN_USER_ID',
  approved_at = NOW()
WHERE id = 'PRODUCT_ID' AND status = 'pending';

-- Verify customer can now see it
SELECT * FROM store_items 
WHERE status = 'approved' AND is_active = true;
```

---

## 📊 Useful Test Queries

### Check Pending Products
```sql
SELECT 
  si.id,
  si.name,
  si.status,
  s.name as store_name,
  pp.business_name as partner_name
FROM store_items si
JOIN stores s ON si.store_id = s.id
JOIN partner_profiles pp ON s.owner_id = pp.user_id
WHERE si.status = 'pending'
ORDER BY si.created_at DESC;
```

### Verify Personalizations Structure
```sql
SELECT 
  id,
  name,
  personalizations,
  jsonb_array_length(personalizations) as personalization_count
FROM store_items
WHERE personalizations IS NOT NULL
  AND jsonb_array_length(personalizations) > 0;
```

### Check Store Ownership
```sql
SELECT 
  s.id as store_id,
  s.slug,
  s.owner_id,
  u.email,
  pp.business_name
FROM stores s
JOIN auth.users u ON s.owner_id = u.id
LEFT JOIN partner_profiles pp ON s.owner_id = pp.user_id
WHERE s.slug = 'gift-masters';
```

### Products Requiring Preview
```sql
SELECT 
  id,
  name,
  personalizations
FROM store_items
WHERE personalizations IS NOT NULL
  AND EXISTS (
    SELECT 1 
    FROM jsonb_array_elements(personalizations) AS p
    WHERE (p->>'requiresPreview')::boolean = true
  );
```

---

## 🔧 Cleanup Test Data

```sql
-- Remove test products (be careful!)
DELETE FROM store_items 
WHERE store_id IN (
  SELECT id FROM stores WHERE slug = 'test-store-slug'
);

-- Remove test store
DELETE FROM stores WHERE slug = 'test-store-slug';

-- Remove test partner profile
DELETE FROM partner_profiles WHERE email = 'test-partner@example.com';
```

---

## 🚀 Quick Test Setup Script

Run this in Supabase SQL Editor:

```sql
-- 1. Set your test user ID
DO $$
DECLARE
  test_user_id UUID := 'YOUR_USER_ID_HERE'; -- Replace with actual user ID
  test_store_id UUID;
BEGIN
  -- Create partner profile
  INSERT INTO partner_profiles (
    user_id, business_name, owner_name, phone, email, status
  ) VALUES (
    test_user_id,
    'Test Gift Store',
    'Test Owner',
    '+919740803490',
    'test-partner@wyshkit.com',
    'approved'
  ) ON CONFLICT (user_id) DO NOTHING;

  -- Create store
  INSERT INTO stores (owner_id, name, slug, status)
  VALUES (
    test_user_id,
    'Test Gift Store',
    'test-gift-store',
    'active'
  )
  ON CONFLICT (slug) DO UPDATE SET status = 'active'
  RETURNING id INTO test_store_id;

  -- Create test product
  INSERT INTO store_items (
    store_id, name, slug, description, price, category,
    image_url, images, is_customizable, status
  ) VALUES (
    test_store_id,
    'Test Product',
    'test-product',
    'A test product for development',
    100000, -- ₹1000
    'Electronics',
    'https://via.placeholder.com/400x400',
    ARRAY['https://via.placeholder.com/400x400'],
    false,
    'pending'
  ) ON CONFLICT (slug, store_id) DO NOTHING;

  RAISE NOTICE 'Test data created successfully!';
  RAISE NOTICE 'Store ID: %', test_store_id;
  RAISE NOTICE 'Store Slug: test-gift-store';
END $$;
```

---

## ✅ Verification Checklist

After setting up test data:

- [ ] Partner profile exists with `status = 'approved'`
- [ ] Store exists with `slug = 'test-gift-store'`
- [ ] Store `owner_id` matches partner `user_id`
- [ ] Test product exists with `status = 'pending'`
- [ ] Can login with Store ID + Mobile OTP
- [ ] Can see product in partner products list
- [ ] Admin can see product in approval queue

---

## 🎯 Next Steps

1. Set up test data using SQL above
2. Test Partner Login workflow
3. Test Product Creation
4. Test Admin Approval
5. Test Customer View

See `TESTING_CHECKLIST.md` for detailed test cases.

