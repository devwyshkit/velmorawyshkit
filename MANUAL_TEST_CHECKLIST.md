# 🧪 Manual Testing Checklist - All Credentials

**Status**: Ready for Testing  
**Dev Server**: http://localhost:8080 (must be running)

---

## ⚙️ Prerequisites

### 1. Supabase Setup Required
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy Edge Function
supabase functions deploy verify-kyc --no-verify-jwt

# Set IDfy credentials
supabase secrets set IDFY_API_KEY=a7cccddc-cd3c-4431-bd21-2d3f7694b955
supabase secrets set IDFY_ACCOUNT_ID=1a3dfae3d9a0/20fba821-ee50-46db-9e7e-6c1716da6cbb

# Run migrations
supabase db push
```

### 2. Create Test Accounts in Supabase Dashboard

Go to: **Supabase Dashboard → Authentication → Users → Add User**

**Create 3 users** (check "Auto Confirm Email"):
1. Email: `customer@wyshkit.com` | Password: `customer123`
2. Email: `partner@wyshkit.com` | Password: `partner123`
3. Email: `admin@wyshkit.com` | Password: `admin123`

### 3. Run SQL Setup

In **Supabase Dashboard → SQL Editor**, paste from `CREATE_TEST_ACCOUNTS.sql`:

```sql
-- Step 1: Get partner user_id
SELECT id, email FROM auth.users WHERE email = 'partner@wyshkit.com';

-- Step 2: Insert partner profile (replace USER_ID with result from step 1)
INSERT INTO partner_profiles (...) VALUES ('USER_ID', ...);

-- Step 3: Insert 3 test products
INSERT INTO partner_products (...) VALUES (...);

-- Step 4: Set admin role
UPDATE auth.users 
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@wyshkit.com';
```

---

## 🧪 Test 1: Customer Interface

### Step 1.1: Navigate to Customer Login
- URL: http://localhost:8080/customer/login
- **Expected**: Clean login page with Wyshkit logo

### Step 1.2: Login with Customer Credentials
- Email: `customer@wyshkit.com`
- Password: `customer123`
- Click "Sign In"
- **Expected**: Redirect to `/customer/home`
- **Check**: No errors in browser console (F12)

### Step 1.3: Browse Products
- **Expected**: See partner products (if any exist)
- Click on a product
- **Expected**: Bottom sheet opens with product details
- Click "Add to Cart"
- **Expected**: Toast notification "Added to cart"

### Step 1.4: View Cart
- Click Cart icon in header/bottom nav
- **Expected**: See added product
- Update quantity
- **Expected**: Total updates

### Step 1.5: Checkout Flow
- Click "Proceed to Checkout"
- Fill address details
- **Expected**: Payment sheet opens (Razorpay test mode)
- ⚠️ Don't complete payment (test mode)

### Step 1.6: Profile
- Navigate to Profile
- **Expected**: Shows `customer@wyshkit.com`
- Try Dark Mode toggle
- **Expected**: Theme switches

### ✅ Customer Test Results
- [ ] Login successful
- [ ] Home page loads
- [ ] Products display
- [ ] Add to cart works
- [ ] Cart updates
- [ ] Checkout accessible
- [ ] Profile shows user info
- [ ] No console errors

---

## 🧪 Test 2: Partner Interface

### Step 2.1: Navigate to Partner Login
- URL: http://localhost:8080/partner/login
- **Expected**: Partner login page with Wyshkit Business logo

### Step 2.2: Login with Partner Credentials
- Email: `partner@wyshkit.com`
- Password: `partner123`
- Click "Sign In"
- **Expected**: Redirect to `/partner/dashboard` (Home)
- **Check**: No errors in browser console

### Step 2.3: Dashboard Home Page
- **Expected**: Shows stats cards (Orders, Earnings, Rating, Acceptance Rate)
- Check "Operating Hours" toggle
- **Expected**: Power icon turns green/red, stores open/closed status
- **Check**: Database updates (`partner_profiles.is_open`)

### Step 2.4: Catalog Manager
- Click "Catalog" in bottom nav
- **Expected**: Shows 3 test products (Premium Gift Hamper, Wireless Earbuds, Artisan Chocolate Box)
- **Check Features**:
  - [ ] Each product has "Available" toggle switch (Quick Stock Toggle)
  - [ ] Toggle switch ON → Product active
  - [ ] Toggle OFF → Toast "Product marked unavailable"
  - [ ] Edit button opens sheet with product form
  - [ ] Delete button works with confirmation

### Step 2.5: Add New Product
- Click "Add Product" button
- Fill form:
  - Name: Test Product
  - Description: Test description
  - Category: Tech Gifts
  - Price: 1999 (in rupees, displays as ₹19.99)
  - Stock: 10
  - Preparation Days: 2
- Upload image (optional)
- Click "Save"
- **Expected**: Toast "Product created", new product appears in list

### Step 2.6: Orders Page
- Click "Orders" in bottom nav
- **Expected**: Shows order list (empty for new account)
- **Check UI Elements**:
  - [ ] Status filter tabs (All, Pending, Preparing, Ready, Completed)
  - [ ] For pending orders: **Accept / Decline buttons** (Swiggy pattern)
  - [ ] Accept button → Status changes to "preparing"
  - [ ] For preparing orders: Proof upload section appears
  - [ ] Dispatch button with tracking number input

### Step 2.7: Earnings Page
- Click "Earnings" in bottom nav
- **Expected**: Shows earnings summary cards (Total, Pending, Paid)
- **Check Tabs**: 
  - [ ] "Today" tab selected by default
  - [ ] "This Week" tab clickable
  - [ ] "This Month" tab clickable
  - [ ] Empty state: "No orders today yet" (for new account)

### Step 2.8: Profile Page
- Click "Profile" in bottom nav
- **Expected**: Shows business details
- **Check Sections**:
  - [ ] Business Information (editable)
  - [ ] KYC Status (shows verification status)
  - [ ] Bank Details (masked for security)
  - [ ] Edit buttons work

### Step 2.9: Header Navigation
- **Check**: Wyshkit Business logo (top left)
- **Check**: "Partner" badge next to logo
- **Check**: Notification icon (top right)
- **Check**: Logo links back to `/partner/dashboard`

### ✅ Partner Test Results
- [ ] Login successful
- [ ] Dashboard loads with stats
- [ ] Operating hours toggle works
- [ ] Catalog shows 3 test products
- [ ] Quick stock toggle on each product
- [ ] Add product works
- [ ] Edit product works
- [ ] Delete product works
- [ ] Orders page accessible
- [ ] Accept/Decline buttons visible (for pending)
- [ ] Earnings tabs (Today/Week/Month) work
- [ ] Profile shows business details
- [ ] Bottom nav (5 items) works
- [ ] Header logo + badge present
- [ ] No console errors

---

## 🧪 Test 3: Admin Interface

### Step 3.1: Navigate to Admin
- URL: http://localhost:8080/admin/overview
- **Expected**: Redirects to partner login if not authenticated

### Step 3.2: Login with Admin Credentials
- Email: `admin@wyshkit.com`
- Password: `admin123`
- Click "Sign In"
- **Expected**: Redirect to `/admin/overview`
- **Check**: No errors in browser console

### Step 3.3: Admin Overview Page
- **Expected**: Shows platform-wide statistics
- **Check Cards**:
  - [ ] Total Partners
  - [ ] Pending Approvals
  - [ ] Total Orders
  - [ ] Revenue

### Step 3.4: Partner Approvals
- Navigate to "Partners" in sidebar/nav
- URL: http://localhost:8080/admin/partners
- **Expected**: Shows list of partner applications
- **Check List**:
  - [ ] See "Premium Gifts Co" (pre-approved test partner)
  - [ ] Status badge shows "Approved" in green

### Step 3.5: Review Partner Details
- Click on a pending partner (if any)
- **Expected**: Modal/sheet opens with details
- **Check Sections**:
  - [ ] Business Information
  - [ ] KYC Verification Status (PAN, GST, Bank)
  - [ ] IDfy verification badges (✓ or ✗)
  - [ ] Approve button (green)
  - [ ] Reject button (red)

### Step 3.6: Approve/Reject Actions
- Click "Approve" on a pending partner
- **Expected**: 
  - Confirmation dialog
  - Status updates to "Approved"
  - Partner can now access dashboard
  - Admin action logged in `admin_actions` table

### Step 3.7: Admin Header
- **Check**: Wyshkit logo (main brand, not Business logo)
- **Check**: "Admin" badge with Shield icon (red)
- **Check**: Logo links to `/admin/overview`

### ✅ Admin Test Results
- [ ] Login with admin credentials successful
- [ ] Overview page loads
- [ ] Platform stats display
- [ ] Partner Approvals accessible
- [ ] Partner list shows test data
- [ ] Click partner shows details
- [ ] IDfy status visible
- [ ] Approve button works
- [ ] Reject button works
- [ ] Admin actions logged
- [ ] Header logo + Admin badge present
- [ ] No console errors

---

## 🧪 Test 4: New Partner Onboarding (End-to-End)

### Step 4.1: Navigate to Partner Signup
- URL: http://localhost:8080/partner/signup
- **Expected**: Signup form with Wyshkit Business logo

### Step 4.2: Create New Partner Account
- Email: `newpartner@test.com`
- Password: `test123`
- Confirm Password: `test123`
- Click "Create Account"
- **Expected**: Account created, redirect to onboarding
- **Check**: Auth record in Supabase (`auth.users`)

### Step 4.3: Step 1 - Business Details
- **URL**: `/partner/onboarding` (Step 1)
- **Expected**: 4-step stepper at top (Step 1 highlighted)
- **Fill Form**:
  - Legal Business Name: Test Business Pvt Ltd
  - Display Name: Test Business
  - Category: Chocolates
  - Tagline: Premium handmade chocolates
  - Email: newpartner@test.com (pre-filled)
  - Phone: 9876543210
  - Address: Test Address, Mumbai, Maharashtra, 400001
- Click "Next"
- **Expected**: Auto-saves to database, moves to Step 2
- **Check**: `partner_profiles.onboarding_step = 2`

### Step 4.4: Step 2 - KYC Verification
- **Expected**: Step 2 highlighted in stepper
- **Fill Form**:
  - PAN Number: AAAPL1234C
  - Name on PAN: Test Business
  - Click "Verify PAN"
  - **Expected**: Loading indicator → Success (or Test Mode bypass if no Supabase)
  - GST Number: 22AAAAA0000A1Z5
  - Click "Verify GST"
  - **Expected**: Loading → Success
- Click "Next"
- **Expected**: Moves to Step 3
- **Check**: `partner_profiles.pan_verified = true, gst_verified = true`

### Step 4.5: Step 3 - Banking Details
- **Expected**: Step 3 highlighted
- **Fill Form**:
  - Account Number: 1234567890
  - IFSC Code: HDFC0000123
  - Account Holder Name: Test Business Pvt Ltd
  - Click "Verify Account"
  - **Expected**: Penny drop verification (or Test Mode)
- Click "Next"
- **Expected**: Moves to Step 4
- **Check**: `partner_profiles.bank_verified = true`

### Step 4.6: Step 4 - Initial Products
- **Expected**: Step 4 highlighted
- Click "Add Product"
- **Fill Form**:
  - Name: Test Chocolate Box
  - Description: Handmade chocolates
  - Category: Chocolates
  - Price: 999
  - Stock: 50
- Click "Save"
- **Expected**: Product added to list
- Click "Complete Onboarding"
- **Expected**: 
  - Status = 'pending_review'
  - Redirect to `/partner/pending`
  - **Check**: `partner_profiles.onboarding_status = 'pending_review', onboarding_step = 4`

### Step 4.7: Pending Approval Screen
- **Expected**: Message "Your application is under review"
- **Check**: Cannot access dashboard yet
- Logout

### Step 4.8: Admin Approves New Partner
- Login as admin (`admin@wyshkit.com`)
- Navigate to Partner Approvals
- **Expected**: See "Test Business" in pending list
- Click on Test Business
- Review details (KYC status all green ✓)
- Click "Approve"
- **Expected**: Status changes to "Approved"
- Logout

### Step 4.9: New Partner Accesses Dashboard
- Login as `newpartner@test.com`
- **Expected**: Redirect to `/partner/dashboard` (not pending anymore)
- **Check**: All dashboard features accessible
- Verify product appears in Catalog

### ✅ Onboarding Test Results
- [ ] Signup creates account
- [ ] Redirects to onboarding
- [ ] Step 1 form saves
- [ ] Step 2 KYC verification works (or test mode)
- [ ] Step 3 banking verification works
- [ ] Step 4 products upload
- [ ] Complete → Pending status
- [ ] Admin sees pending application
- [ ] Admin approve works
- [ ] Partner can login to dashboard
- [ ] Onboarded product visible
- [ ] No console errors throughout

---

## 🧪 Test 5: Database Verification

### Run in Supabase SQL Editor:

```sql
-- Check all test users exist
SELECT id, email, email_confirmed_at, 
       raw_app_meta_data->>'role' as role
FROM auth.users 
WHERE email LIKE '%@wyshkit.com' OR email = 'newpartner@test.com'
ORDER BY created_at;

-- Expected: 4 rows (customer, partner, admin, newpartner)
-- Expected: admin has role='admin'

-- Check partner profiles
SELECT user_id, business_name, display_name, 
       onboarding_status, onboarding_step, 
       pan_verified, gst_verified, bank_verified, is_open
FROM partner_profiles
WHERE email IN ('partner@wyshkit.com', 'newpartner@test.com');

-- Expected: 2 rows
-- Expected: partner@wyshkit.com has status='approved'
-- Expected: newpartner@test.com has status='approved' (after admin approval)

-- Check partner products
SELECT p.name, pr.business_name, p.price, p.total_stock, p.is_active
FROM partner_products p
JOIN partner_profiles pr ON p.partner_id = pr.id
ORDER BY p.created_at;

-- Expected: 4+ products (3 test + 1 from new partner)

-- Check admin actions
SELECT action_type, target_id, performed_by, notes
FROM admin_actions
WHERE action_type IN ('approve_partner', 'reject_partner')
ORDER BY created_at DESC
LIMIT 5;

-- Expected: See approval action for newpartner@test.com

-- Check RLS policies active
SELECT tablename, policyname, cmd
FROM pg_policies 
WHERE tablename LIKE 'partner%'
ORDER BY tablename, policyname;

-- Expected: Multiple policies for each partner table
```

### ✅ Database Verification Results
- [ ] All 4 test users exist in `auth.users`
- [ ] Admin has `role='admin'` in metadata
- [ ] Partner profiles created with correct status
- [ ] KYC verified flags are true
- [ ] Partner products linked correctly
- [ ] Admin actions logged
- [ ] RLS policies active on all tables

---

## 🧪 Test 6: Swiggy/Zomato Feature Parity

### Operating Hours Toggle
- [ ] Partner Home has green Power icon when open
- [ ] Toggle switch next to operating hours
- [ ] Click toggle → Icon changes color
- [ ] Toast notification appears
- [ ] Database updates (`is_open` field)

### Quick Stock Toggle
- [ ] Each product in Catalog has "Available" toggle
- [ ] Toggle inside product card (not separate)
- [ ] One-tap mark unavailable (Swiggy pattern)
- [ ] Toast notification on change
- [ ] Database updates (`is_active` field)

### Order Accept/Decline
- [ ] Pending orders show dual buttons
- [ ] Accept button (green, primary)
- [ ] Decline button (red, destructive)
- [ ] Accept → Status changes to "preparing"
- [ ] Decline shows confirmation
- [ ] Proof upload appears after accept

### Earnings Tabs
- [ ] Three tabs: Today / This Week / This Month
- [ ] Today selected by default
- [ ] Tabs switch content
- [ ] Empty state for no data
- [ ] Zomato-style layout

### ✅ Feature Parity Results
- [ ] Operating hours toggle: PASS
- [ ] Quick stock toggle: PASS
- [ ] Accept/Decline buttons: PASS
- [ ] Earnings tabs: PASS
- [ ] Overall: 90%+ Swiggy/Zomato parity ✅

---

## 🧪 Test 7: Browser Console Check

### Open DevTools (F12) and check:

**Customer Interface**:
- [ ] No red errors in Console tab
- [ ] Network tab: All API calls 200/201 (or 401 if auth issue)
- [ ] No CORS errors

**Partner Interface**:
- [ ] No red errors in Console tab
- [ ] Supabase realtime connected (check WS in Network)
- [ ] IDfy calls route through Edge Function (no CORS)

**Admin Interface**:
- [ ] No red errors
- [ ] Database queries execute successfully

---

## 🎯 Success Criteria Summary

| Category | Pass Criteria | Status |
|----------|---------------|--------|
| Customer Login | Login works, home loads | [ ] |
| Partner Login | Login works, dashboard loads | [ ] |
| Admin Login | Login works, overview loads | [ ] |
| Partner Onboarding | 4 steps complete, approval works | [ ] |
| Catalog CRUD | Add/edit/delete products | [ ] |
| Swiggy Features | All 4 features working | [ ] |
| Database Integrity | All tables, policies, users | [ ] |
| No Console Errors | Clean console across all pages | [ ] |

**Overall Grade**: ___ / 8 Pass

---

## 🐛 Common Issues & Fixes

### Issue 1: "Email not confirmed"
**Fix**: In Supabase Dashboard → Auth → Email Templates → Disable email confirmation  
OR manually confirm users in Users table

### Issue 2: CORS error on IDfy calls
**Fix**: 
1. Deploy Edge Function: `supabase functions deploy verify-kyc`
2. Check function logs in Supabase Dashboard
3. Verify `--no-verify-jwt` flag used

### Issue 3: Partner profile not found
**Fix**: Run INSERT query from CREATE_TEST_ACCOUNTS.sql with correct `user_id`

### Issue 4: Admin can't access /admin routes
**Fix**: 
```sql
UPDATE auth.users 
SET raw_app_meta_data = jsonb_set(
  COALESCE(raw_app_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'
)
WHERE email = 'admin@wyshkit.com';
```

### Issue 5: Products don't show
**Fix**: Check `partner_id` in `partner_products` matches `partner_profiles.id`

---

## 📝 Test Notes

**Tester**: _____________  
**Date**: _____________  
**Environment**: Local Dev (http://localhost:8080)  
**Supabase Project**: _____________  
**Overall Status**: ⬜ Pass | ⬜ Fail | ⬜ Partial

**Additional Notes**:

