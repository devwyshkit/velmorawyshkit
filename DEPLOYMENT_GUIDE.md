# 🚀 Deployment & Setup Guide

**Complete guide to deploy Supabase Edge Function, run migrations, and create test accounts**

---

## 📋 Prerequisites

- Node.js 18+ installed
- Supabase account (free tier works)
- Access to Supabase project
- Terminal/command line access

---

## Step 1: Install Supabase CLI

### macOS (Homebrew)
```bash
brew install supabase/tap/supabase
```

### npm (All platforms)
```bash
npm install -g supabase
```

### Verify installation
```bash
supabase --version
# Should show: supabase 1.x.x
```

---

## Step 2: Login to Supabase

```bash
# Login (opens browser)
supabase login

# Or use access token
supabase login --token YOUR_ACCESS_TOKEN
```

**Get Access Token**:
1. Go to https://supabase.com/dashboard/account/tokens
2. Generate new token
3. Copy and paste when prompted

---

## Step 3: Link to Your Project

```bash
# Find your project ref
# Go to: Supabase Dashboard → Project Settings → General → Reference ID

# Link project
supabase link --project-ref YOUR_PROJECT_REF

# Enter database password when prompted
```

**Example**:
```bash
supabase link --project-ref abcdefghijklmnop
```

---

## Step 4: Deploy Edge Function for IDfy

### Set Environment Variables
```bash
# Set IDfy credentials as secrets
supabase secrets set IDFY_API_KEY=a7cccddc-cd3c-4431-bd21-2d3f7694b955
supabase secrets set IDFY_ACCOUNT_ID=1a3dfae3d9a0/20fba821-ee50-46db-9e7e-6c1716da6cbb
```

### Deploy Function
```bash
# Deploy verify-kyc function
supabase functions deploy verify-kyc --no-verify-jwt

# Should see:
# ✓ Function verify-kyc deployed successfully
```

### Verify Deployment
1. Go to Supabase Dashboard → Edge Functions
2. Look for `verify-kyc` function
3. Status should be "Active"
4. Note the function URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/verify-kyc`

### Test Function (Optional)
```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/verify-kyc \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "type": "pan",
    "data": {
      "id_number": "AAAPL1234C",
      "name": "Test Business"
    }
  }'

# Should return JSON with verification result
```

---

## Step 5: Run Database Migrations

### Check Existing Migrations
```bash
# List migrations
supabase migration list

# Should show:
# - 000_complete_cleanup.sql
# - 001_initial_schema.sql
# - 002_fresh_customer_schema.sql
# - 003_add_full_text_search.sql
# - 004_partner_platform_schema.sql ← This is the important one
```

### Apply Migrations
```bash
# Push all pending migrations
supabase db push

# Or apply specific migration
supabase migration up
```

### Verify Migration Success
Go to Supabase Dashboard → SQL Editor and run:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'partner%';
```

**Expected tables**:
- partner_profiles
- partner_products
- partner_hampers
- partner_orders
- partner_earnings
- partner_sourcing_vendors
- admin_actions

---

## Step 6: Create Test Accounts

### Method 1: Supabase Dashboard (Recommended)

#### Create Users
1. Go to **Supabase Dashboard → Authentication → Users**
2. Click **"Add User"**
3. Create 3 users:

**Customer Account**:
- Email: `customer@wyshkit.com`
- Password: `customer123`
- ✅ Check "Auto Confirm Email"
- Click "Create User"

**Partner Account**:
- Email: `partner@wyshkit.com`
- Password: `partner123`
- ✅ Check "Auto Confirm Email"
- Click "Create User"
- **Copy the user_id** (you'll need this)

**Admin Account**:
- Email: `admin@wyshkit.com`
- Password: `admin123`
- ✅ Check "Auto Confirm Email"
- Click "Create User"

### Method 2: SQL (Alternative)

Go to **SQL Editor** and run:
```sql
-- Note: This creates users via Supabase API, not directly in SQL
-- Use Dashboard method instead for easier setup
```

---

## Step 7: Setup Partner Profile & Products

Go to **Supabase Dashboard → SQL Editor** and paste from `CREATE_TEST_ACCOUNTS.sql`:

### Step 7.1: Insert Partner Profile

**IMPORTANT**: Replace `REPLACE_WITH_AUTH_USER_ID` with the actual user_id from Step 6.

```sql
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
  'REPLACE_WITH_AUTH_USER_ID', -- Get from auth.users after creating partner@wyshkit.com
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
```

### Step 7.2: Insert Test Products

```sql
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
```

### Step 7.3: Set Admin Role

```sql
UPDATE auth.users 
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@wyshkit.com';
```

---

## Step 8: Verify Setup

Run the verification script:

```sql
-- Check all test users exist
SELECT id, email, email_confirmed_at, 
       raw_app_meta_data->>'role' as role
FROM auth.users 
WHERE email LIKE '%@wyshkit.com'
ORDER BY created_at;

-- Expected: 3 rows (customer, partner, admin)
-- admin should have role='admin'

-- Check partner profile
SELECT user_id, business_name, onboarding_status, approved_at
FROM partner_profiles 
WHERE email = 'partner@wyshkit.com';

-- Expected: 1 row, status='approved'

-- Check partner products
SELECT id, name, price, total_stock, is_active
FROM partner_products 
WHERE partner_id = (
  SELECT id FROM partner_profiles WHERE email = 'partner@wyshkit.com'
);

-- Expected: 3 rows (Premium Gift Hamper, Wireless Earbuds, Artisan Chocolate Box)
```

**All queries should return data. If not, check error messages.**

---

## Step 9: Update Frontend Environment Variables

Create `.env` file in project root:

```env
# Supabase
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Get these from:
# Supabase Dashboard → Project Settings → API → Project URL & anon key
```

**Restart dev server** after adding .env:
```bash
# Stop server (Ctrl+C)
npm run dev
```

---

## Step 10: Test Login Credentials

### Customer
- URL: http://localhost:8080/customer/login
- Email: `customer@wyshkit.com`
- Password: `customer123`
- **Expected**: Redirects to `/customer/home`

### Partner
- URL: http://localhost:8080/partner/login
- Email: `partner@wyshkit.com`
- Password: `partner123`
- **Expected**: Redirects to `/partner/dashboard`

### Admin
- URL: http://localhost:8080/partner/login (use partner login)
- Email: `admin@wyshkit.com`
- Password: `admin123`
- **Expected**: Redirects to `/admin/overview`

---

## Step 11: Disable Email Confirmation (Optional)

If you want to allow signups without email confirmation:

1. Go to **Supabase Dashboard → Authentication → Settings → Email Auth**
2. Uncheck **"Enable email confirmations"**
3. Click **Save**

**Note**: Not recommended for production, but useful for testing.

---

## 🐛 Troubleshooting

### Issue: "Function not found" error

**Solution**:
```bash
# Redeploy function
supabase functions deploy verify-kyc --no-verify-jwt

# Check function logs
supabase functions logs verify-kyc
```

### Issue: Migration fails with "relation already exists"

**Solution**:
```bash
# Reset database (⚠️ DELETES ALL DATA)
supabase db reset

# Or skip specific migration
supabase migration repair --status reverted 004_partner_platform_schema.sql
```

### Issue: "Email not confirmed" on login

**Solution**:
1. Go to Supabase Dashboard → Authentication → Users
2. Find the user
3. Click user → Edit → Check "Email Confirmed"
4. Save

### Issue: Partner profile not found after login

**Solution**:
Check if `user_id` in `partner_profiles` matches `auth.users.id`:
```sql
SELECT 
  au.id as auth_id,
  pp.user_id as profile_user_id,
  au.email
FROM auth.users au
LEFT JOIN partner_profiles pp ON au.id = pp.user_id
WHERE au.email = 'partner@wyshkit.com';
```

If `profile_user_id` is NULL, re-run the INSERT query with correct user_id.

### Issue: CORS error when calling Edge Function

**Solution**:
1. Verify function deployed with `--no-verify-jwt` flag
2. Check CORS headers in function code (should have `Access-Control-Allow-Origin: *`)
3. View function logs for errors:
```bash
supabase functions logs verify-kyc --tail
```

### Issue: RLS policies blocking queries

**Solution**:
Temporarily disable RLS for testing (⚠️ NOT for production):
```sql
ALTER TABLE partner_profiles DISABLE ROW LEVEL SECURITY;
-- Test queries
ALTER TABLE partner_profiles ENABLE ROW LEVEL SECURITY;
```

---

## ✅ Deployment Checklist

- [ ] Supabase CLI installed
- [ ] Logged into Supabase
- [ ] Project linked
- [ ] IDfy Edge Function deployed
- [ ] Edge Function secrets set
- [ ] Database migrations applied
- [ ] 7 partner tables created
- [ ] Customer account created
- [ ] Partner account created
- [ ] Admin account created
- [ ] Partner profile inserted
- [ ] 3 test products inserted
- [ ] Admin role set
- [ ] Frontend .env configured
- [ ] Dev server restarted
- [ ] Customer login tested ✓
- [ ] Partner login tested ✓
- [ ] Admin login tested ✓
- [ ] All console errors checked

---

## 🎯 Next Steps

After successful deployment:

1. **Manual Testing**: Follow `MANUAL_TEST_CHECKLIST.md`
2. **Database Verification**: Run `tests/verify-database.sql`
3. **End-to-End Test**: Complete new partner onboarding flow
4. **Feature Check**: Verify Swiggy/Zomato features (toggles, tabs, buttons)
5. **Production Deploy**: Deploy to Vercel/Netlify with environment variables

---

## 📚 Additional Resources

- **Supabase CLI Docs**: https://supabase.com/docs/guides/cli
- **Edge Functions Docs**: https://supabase.com/docs/guides/functions
- **RLS Policies**: https://supabase.com/docs/guides/auth/row-level-security
- **CREATE_TEST_ACCOUNTS.sql**: Full SQL script for test data
- **MANUAL_TEST_CHECKLIST.md**: Complete testing guide
- **tests/verify-database.sql**: Database verification queries

---

**Questions?** Check troubleshooting section or review error logs in Supabase Dashboard.

