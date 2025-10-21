# 🧪 Browser Testing Guide - Wyshkit Platform

**Purpose:** Verify all features work correctly before launch  
**Time Required:** 30-60 minutes  
**Test on:** Desktop + Mobile (375px)

---

## ✅ **PRE-TESTING CHECKLIST**

**Before you start, ensure:**

1. ☑️ Dev server running: `npm run dev`
2. ☑️ All 5 SQL migrations run in Supabase:
   - `FIX_ADMIN_TABLES.sql` ✅
   - `ADD_VARIABLE_COMMISSION.sql` ⏳
   - `ADD_PARTNER_BADGES_TABLE.sql` ⏳
   - `ADD_PRODUCT_APPROVAL_WORKFLOW.sql` ⏳
   - `ADD_KAM_FEATURES.sql` ⏳

---

## 🧪 **TEST 1: ADMIN PANEL (15 minutes)**

### **1.1 Admin Login & Dashboard**
**URL:** `http://localhost:8080/admin/login`

**Steps:**
1. Enter credentials:
   - Email: `admin@wyshkit.com`
   - Password: `AdminWysh@2024`
2. Click "Sign In"
3. ✅ Should redirect to `/admin/dashboard`
4. ✅ Should see welcome toast
5. ✅ Check dashboard shows:
   - Stats cards (GMV, Orders, Partners, Disputes)
   - Action cards (Escalated Disputes: 5, Due Payouts: 120)
   - Recent Activity feed

**Mobile Test (resize to 375px):**
- ✅ Hamburger menu appears (top left)
- ✅ Bottom nav shows (Home, Partners, Orders, Payouts, More)
- ✅ Stats cards in 2-column grid
- ✅ No horizontal overflow

**If it fails:** Check browser console for errors, report to me

---

### **1.2 Product Approvals Page**
**URL:** `http://localhost:8080/admin/product-approvals`

**Steps:**
1. Navigate from dashboard or type URL
2. ✅ Should see "Product Approvals" page
3. ✅ Stats cards showing pending count
4. ✅ Tabs: Pending / Changes Requested
5. ✅ Mock data showing 2 pending products (GiftCraft hamper, Chocolate box)

**Desktop:**
- ✅ DataTable with columns (Product, Category, Price, Compliance, Actions)
- ✅ Preview button (eye icon)
- ✅ Approve button (green checkmark)
- ✅ Reject button (red X)

**Mobile (375px):**
- ✅ Card view instead of table
- ✅ Product images visible
- ✅ All actions accessible
- ✅ FSSAI warning on chocolate box

**Test Actions:**
- Click Preview → Should open dialog with image carousel
- Click Approve → Should show success toast
- Click Reject → Should prompt for reason

**If it fails:** Likely missing SQL migration or import error

---

### **1.3 Payouts Page (Mobile Test)**
**URL:** `http://localhost:8080/admin/payouts`

**Steps (Mobile 375px):**
1. Navigate to Payouts
2. ✅ Should see card view (NOT table)
3. ✅ 2 payout cards (GiftCraft ₹1,20,000, Boat ₹2,00,000)
4. ✅ Selection checkboxes visible
5. ✅ Tabs working (Pending, Scheduled, Completed)
6. ✅ Bottom nav visible
7. ✅ No overflow

**If table shows instead of cards:**
- Check `useIsMobile` hook
- Verify breakpoint is 768px
- Check console for errors

---

## 🧪 **TEST 2: PARTNER PORTAL (15 minutes)**

### **2.1 Partner Login**
**URL:** `http://localhost:8080/partner/login`

**Credentials:**
- Email: `partner@giftcraft.com`
- Password: `Tolu&gujja@5`

**Steps:**
1. Login
2. ✅ Redirect to `/partner/dashboard`
3. ✅ See welcome message

---

### **2.2 Commission Breakdown (NEW!)**
**URL:** `http://localhost:8080/partner/earnings`

**Steps:**
1. Navigate to Earnings
2. ✅ Should see "Commission Breakdown" card (NEW!)
3. ✅ Shows:
   - Your Category badge (e.g., "Premium Hampers: 18%")
   - Base Commission calculation
   - Badge Discount (if any badges earned)
   - Fulfillment Fees
   - Total Platform Fees
   - Your Net Earnings
4. ✅ Expandable "View calculation details"
5. ✅ Tip about earning badges

**If missing:**
- SQL migration not run (`ADD_VARIABLE_COMMISSION.sql`)
- Check browser console

---

### **2.3 Product Status Filters (NEW!)**
**URL:** `http://localhost:8080/partner/products`

**Steps:**
1. Navigate to Products
2. ✅ Should see 4 tabs:
   - All (total count)
   - Approved (live products)
   - Pending (awaiting review)
   - Rejected (need fixes)
3. ✅ Click each tab → DataTable filters correctly

**Add New Product:**
1. Click "Add Product"
2. ✅ Should see blue info alert: "New products are reviewed within 24 hours"
3. Fill form and save
4. ✅ Should show in "Pending" tab
5. ✅ Should NOT appear in customer UI (RLS policy!)

**If tabs missing:**
- Component didn't update
- Check console errors

---

### **2.4 Badges Page (NEW!)**
**URL:** `http://localhost:8080/partner/badges`

**Steps:**
1. Navigate via More menu → Click More → Select from list
2. ✅ Should see Badges page
3. ✅ Stats cards (Earned Badges, Total Orders, Rating, On-Time %)
4. ✅ Earned badges section (if any)
5. ✅ Available badges section with progress bars
6. ✅ 5 badge types visible (🥉 🥈 🥇 ⚡ 💎)

**If missing:**
- Route not added or lazy import failed
- Check console

---

## 🧪 **TEST 3: CUSTOMER UI (10 minutes)**

### **3.1 Home Page Campaigns**
**URL:** `http://localhost:8080/customer/home`

**Steps:**
1. Load home page
2. ✅ Scroll down after banners
3. ✅ Should see "🎯 Active Offers" section (NEW!)
4. ✅ Shows campaign cards (if campaigns exist in DB)
5. ✅ Each card shows:
   - Campaign image or gradient
   - Discount badge (% OFF or ₹ OFF)
   - "Ending Soon" badge if <24h
   - Shop Now button

**If not visible:**
- No campaigns in database yet
- Check `featuredCampaigns` console log

---

### **3.2 Campaign Discount at Checkout**
**URL:** Add item to cart first, then `http://localhost:8080/customer/checkout`

**Steps:**
1. Add any product to cart
2. Go to checkout
3. ✅ If product has active campaign:
   - Toast: "🎉 Campaign discount applied!"
   - Order summary shows green "Campaign Discount" line
   - Total reduced by discount amount
4. ✅ GST calculated on discounted total

**If discount doesn't apply:**
- No active campaigns for that product
- Check console for campaign fetch errors
- Verify `campaigns` table has data

---

## 🔍 **WHAT TO CHECK FOR ISSUES**

### **Common Problems:**

**1. "Unauthorized" or "403 Forbidden"**
- RLS policies too restrictive
- User role not set correctly
- Check: `auth.users` user_metadata has correct role

**2. "Table does not exist"**
- SQL migration not run
- Check: Supabase Table Editor for missing tables

**3. "Column does not exist"**
- SQL migration partially run
- Check: Table schema in Supabase

**4. Mock data showing instead of real data**
- Database query failed (check console)
- Fallback to mock data activated
- Usually OK for testing!

**5. Horizontal scroll on mobile**
- Component not responsive
- Check: Screen width, overflow-x

**6. Navigation items missing**
- Route not added
- Lazy import missing
- Check: Browser console for import errors

---

## 📊 **EXPECTED RESULTS**

### **Admin:**
- ✅ All 9 nav items visible (Dashboard, Partners, Products, Orders, Disputes, Payouts, Analytics, Content, Settings)
- ✅ Product Approvals shows mock data (2 pending)
- ✅ Payouts shows card view on mobile
- ✅ Hamburger menu works
- ✅ Bottom nav on mobile

### **Partner:**
- ✅ Commission breakdown visible on Earnings
- ✅ Product tabs filter correctly
- ✅ Badges page accessible via More menu
- ✅ Bottom nav (5 items + More)

### **Customer:**
- ✅ Campaigns section visible (if campaigns in DB)
- ✅ Campaign discount applies at checkout
- ✅ Footer has partner link

---

## 🐛 **IF SOMETHING DOESN'T WORK**

**Quick Fixes:**

**Problem:** Page shows error or blank
- **Check:** Browser console (F12)
- **Report:** Error message to me
- **Likely:** Import error or missing component

**Problem:** Data not showing
- **Check:** Network tab for 400/500 errors
- **Check:** Console for "fetch failed, using mock"
- **Likely:** SQL migration not run or RLS policy blocking

**Problem:** Mobile layout broken
- **Check:** Screen width (should be 375px for testing)
- **Check:** Overflow-x on body
- **Likely:** Table not switching to card view

**Problem:** Cannot login
- **Check:** Credentials correct (case-sensitive!)
- **Check:** Network tab for auth error
- **Likely:** Wrong password or user doesn't exist

---

## ✅ **TESTING COMPLETION CHECKLIST**

### **Admin Panel:**
- [ ] Login works
- [ ] Dashboard loads with stats
- [ ] Product Approvals page accessible
- [ ] Product Approvals shows mock data
- [ ] Payouts shows cards on mobile (375px)
- [ ] Hamburger menu opens
- [ ] Bottom nav shows on mobile
- [ ] No horizontal scroll

### **Partner Portal:**
- [ ] Login works
- [ ] Earnings shows commission breakdown
- [ ] Products page has 4 tabs
- [ ] Badges page accessible
- [ ] Bottom nav optimized (5 items)
- [ ] All widgets showing

### **Customer UI:**
- [ ] Home shows campaigns (if exist)
- [ ] Checkout applies campaign discount (if applicable)
- [ ] Footer has partner link
- [ ] Bottom nav working

---

## 📝 **REPORT ISSUES**

**If you find issues, tell me:**
1. Which page/URL
2. What you expected
3. What actually happened
4. Browser console error (if any)
5. Screenshot (if helpful)

**I'll fix immediately!**

---

**Start testing and report any issues! Platform should be mostly working!** 🚀

