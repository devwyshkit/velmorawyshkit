# ⚡ Quick Start - Credential Testing

**5-Minute Guide to Test Login Credentials**

---

## 🎯 Goal

Test that login credentials work across all three interfaces:
- Customer (`customer@wyshkit.com`)
- Partner (`partner@wyshkit.com`)
- Admin (`admin@wyshkit.com`)

---

## ✅ Current Status

**✓ Frontend Ready**: All pages loading  
**⏳ Backend Setup**: Requires Supabase configuration

---

## 📋 Option 1: UX Testing (No Supabase - 2 mins)

Test the interfaces without actual login:

```bash
# Dev server should be running
# If not: npm run dev

# Test Partner Login Page
open http://localhost:8080/partner/login
# ✓ Verify: Logo, form fields, buttons display

# Test Customer Login Page
open http://localhost:8080/customer/login
# ✓ Verify: Logo, OAuth buttons, guest mode

# Test Partner Onboarding (Test Mode)
open http://localhost:8080/partner/onboarding
# ✓ Verify: 4-step stepper, form fields
# ✓ Can fill forms without login (test mode active)
```

**Result**: ✅ All pages load correctly

---

## 🔧 Option 2: Full Testing (With Supabase - 30 mins)

### Step 1: Install Supabase CLI (2 mins)
```bash
npm install -g supabase
supabase login
```

### Step 2: Link Your Project (1 min)
```bash
supabase link --project-ref YOUR_PROJECT_REF
# Get project ref from Supabase Dashboard → Settings → General
```

### Step 3: Deploy Edge Function (2 mins)
```bash
# Deploy IDfy verification proxy
supabase functions deploy verify-kyc --no-verify-jwt

# Set secrets
supabase secrets set IDFY_API_KEY=a7cccddc-cd3c-4431-bd21-2d3f7694b955
supabase secrets set IDFY_ACCOUNT_ID=1a3dfae3d9a0/20fba821-ee50-46db-9e7e-6c1716da6cbb
```

### Step 4: Run Migration (1 min)
```bash
supabase db push
```

### Step 5: Create Test Accounts (5 mins)

**In Supabase Dashboard → Authentication → Users → Add User**:

1. **Customer**: 
   - Email: `customer@wyshkit.com`
   - Password: `customer123`
   - ✅ Auto Confirm Email

2. **Partner**:
   - Email: `partner@wyshkit.com`
   - Password: `partner123`
   - ✅ Auto Confirm Email
   - **Copy user_id** (needed for next step)

3. **Admin**:
   - Email: `admin@wyshkit.com`
   - Password: `admin123`
   - ✅ Auto Confirm Email

### Step 6: Insert Test Data (5 mins)

**In Supabase Dashboard → SQL Editor**, run from `CREATE_TEST_ACCOUNTS.sql`:

```sql
-- 1. Insert partner profile (replace USER_ID with partner user_id from step 5)
INSERT INTO partner_profiles (user_id, business_name, ...) VALUES (...);

-- 2. Insert 3 test products
INSERT INTO partner_products (...) VALUES (...);

-- 3. Set admin role
UPDATE auth.users 
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@wyshkit.com';
```

### Step 7: Add Environment Variables (1 min)

Create `.env` in project root:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

Get these from: **Supabase Dashboard → Settings → API**

### Step 8: Restart Server (1 min)
```bash
# Stop server (Ctrl+C)
npm run dev
```

### Step 9: Test Credentials (10 mins)

**Test Partner Login**:
```bash
open http://localhost:8080/partner/login
```
- Email: `partner@wyshkit.com`
- Password: `partner123`
- **Expected**: Redirect to `/partner/dashboard`
- **Check**: See 3 test products in Catalog

**Test Customer Login**:
```bash
open http://localhost:8080/customer/login
```
- Email: `customer@wyshkit.com`
- Password: `customer123`
- **Expected**: Redirect to `/customer/home`

**Test Admin Login**:
```bash
open http://localhost:8080/partner/login
```
- Email: `admin@wyshkit.com`
- Password: `admin123`
- **Expected**: Redirect to `/admin/overview`
- **Check**: See partner in approval list

---

## 🧪 Verification Checklist

After testing, verify:

### Customer ✓
- [ ] Login successful
- [ ] Redirects to `/customer/home`
- [ ] Can browse products
- [ ] Cart works
- [ ] No console errors

### Partner ✓
- [ ] Login successful
- [ ] Redirects to `/partner/dashboard`
- [ ] Dashboard shows stats
- [ ] Catalog shows 3 products
- [ ] Can toggle operating hours
- [ ] Can toggle product availability
- [ ] No console errors

### Admin ✓
- [ ] Login successful
- [ ] Redirects to `/admin/overview`
- [ ] Overview shows stats
- [ ] Partner Approvals page accessible
- [ ] Can see pending partners
- [ ] No console errors

---

## 🐛 Quick Troubleshooting

### "Email not confirmed"
**Fix**: In Supabase Dashboard → Users → Click user → Edit → Check "Email Confirmed"

### "Partner profile not found"
**Fix**: Verify `user_id` in INSERT query matches auth user ID:
```sql
SELECT id, email FROM auth.users WHERE email = 'partner@wyshkit.com';
-- Use this ID in partner_profiles INSERT
```

### "CORS error" on KYC verification
**Fix**: Verify Edge Function deployed:
```bash
supabase functions list
# Should show verify-kyc as "Active"
```

### Login works but dashboard empty
**Fix**: Check products inserted correctly:
```sql
SELECT COUNT(*) FROM partner_products 
WHERE partner_id = (
  SELECT id FROM partner_profiles WHERE email = 'partner@wyshkit.com'
);
-- Should return 3
```

---

## 📚 Detailed Guides

Need more help? See:

- **DEPLOYMENT_GUIDE.md** - Complete Supabase setup
- **MANUAL_TEST_CHECKLIST.md** - Comprehensive testing
- **tests/verify-database.sql** - Database verification queries

---

## ✅ Success Looks Like

**Partner Dashboard After Login**:
```
✓ Header with Wyshkit Business logo
✓ "Partner" badge
✓ Stats cards (Orders, Earnings, Rating, Acceptance)
✓ Operating hours toggle (green power icon)
✓ Bottom nav (Home, Catalog, Orders, Earnings, Profile)
```

**Partner Catalog Page**:
```
✓ "Add Product" button
✓ 3 products displayed:
  - Premium Gift Hamper (₹2,499)
  - Wireless Earbuds - Premium (₹4,999)
  - Artisan Chocolate Box (₹1,299)
✓ Each product has "Available" toggle switch
✓ Edit and Delete buttons on each product
```

**Admin Overview**:
```
✓ Header with main Wyshkit logo
✓ "Admin" badge with shield icon
✓ Platform stats cards
✓ Sidebar/nav to Partner Approvals
```

---

## 🎯 Next Steps After Verification

1. ✅ Test complete onboarding flow (new partner)
2. ✅ Test all Swiggy/Zomato features (toggles, tabs, buttons)
3. ✅ Run database verification (`tests/verify-database.sql`)
4. ✅ Optional: Run Playwright tests (`npx playwright test`)
5. ✅ Remove test mode bypasses (search for `// TEMP:`)
6. 🚀 Deploy to production

---

**Ready to test! Choose Option 1 for quick UX check, or Option 2 for full credential verification.**

