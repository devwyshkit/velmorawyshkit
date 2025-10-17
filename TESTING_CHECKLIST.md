# 🧪 COMPLETE TESTING CHECKLIST - After SQL Migration

**Status**: SQL Migration Run ✅  
**Next**: Test all features to verify working correctly

---

## **🚀 QUICK START**

### **1. Start Dev Server**
```bash
cd /Users/prateek/Downloads/wyshkit-finale-66-main
npm run dev
```

Expected output:
```
✓ VITE v5.x.x ready in XXX ms
➜ Local: http://localhost:5173/
```

---

## **✅ CRITICAL TESTS (Must Pass)**

### **Test 1: Authentication - Signup Flow**

**Steps**:
1. Open: `http://localhost:5173/customer/signup`
2. Fill form:
   - Name: Test User
   - Email: test@example.com (use real email if you want to test verification)
   - Password: test123456
3. Click: "Create Account"

**Expected Results**:
- ✅ Toast appears: "Welcome to Wyshkit!"
- ✅ Redirects to: `http://localhost:5173/customer/home`
- ✅ User is logged in (can see email verification banner at top)
- ✅ Yellow banner says: "Please verify your email to unlock all features"
- ✅ No errors in browser console

**If This Fails**:
- Check browser console for errors
- Check Supabase Dashboard → Authentication → Users (new user should be listed)
- Verify .env file is loaded (restart dev server)

---

### **Test 2: Email Verification Banner**

**Steps**:
1. After signup, you should be on home page
2. Look for yellow banner at top (below header)

**Expected Results**:
- ✅ Banner visible with warning icon (amber color)
- ✅ Text: "Please verify your email to unlock all features. Resend email"
- ✅ "Resend email" is clickable link
- ✅ X button on right to dismiss
- ✅ Click "Resend email" → Toast: "Verification email sent!"
- ✅ Check email inbox for verification link

**Optional**: Click email verification link → Banner should disappear

---

### **Test 3: Login Flow**

**Steps**:
1. Logout (if logged in): Clear localStorage or navigate to `/customer/login`
2. Go to: `http://localhost:5173/customer/login`
3. Enter:
   - Email: test@example.com (from signup)
   - Password: test123456
4. Click: "Sign In"

**Expected Results**:
- ✅ Toast: "Welcome back!"
- ✅ Redirects to: `/customer/home`
- ✅ User is logged in
- ✅ Email verification banner shows (if not verified)
- ✅ No errors in console

---

### **Test 4: Session Persistence**

**Steps**:
1. Login (if not already)
2. Refresh page (F5 or Cmd+R)

**Expected Results**:
- ✅ User remains logged in
- ✅ No redirect to login page
- ✅ Email verification banner still shows (if applicable)

**Steps 2**:
1. Close browser tab
2. Reopen: `http://localhost:5173/customer/home`

**Expected Results**:
- ✅ User still logged in
- ✅ Session persisted

---

### **Test 5: Logout**

**Steps**:
1. Click: "Account" in bottom nav (mobile) or header (desktop)
2. Click: "Logout" button (if available in Profile page)
   - OR manually clear: Open DevTools → Application → Local Storage → Clear

**Expected Results**:
- ✅ User logged out
- ✅ Redirected to login or home (guest mode)
- ✅ Email verification banner gone

---

### **Test 6: Data Fetching from Supabase**

**Steps**:
1. Go to: `http://localhost:5173/customer/home`
2. Scroll to "Partners near you" section

**Expected Results**:
- ✅ 6 partners loaded (Premium Gifts Co, Artisan Hampers, etc.)
- ✅ Images display correctly
- ✅ Ratings show (4.5, 4.7, etc.)
- ✅ "Sponsored" badge on Premium Gifts Co (top-left, amber)
- ✅ No "Loading..." or empty state

**Check Console**:
- ✅ No "Supabase fetch failed" warnings (means real data loaded)
- OR
- ⚠️ "Supabase fetch failed, using mock data" (means fallback to mock)

**If Using Fallback**:
- Verify SQL migration ran correctly
- Check Supabase Dashboard → Database → Tables → partners has 6 rows
- Restart dev server (Ctrl+C, then `npm run dev`)

---

### **Test 7: Partner Page**

**Steps**:
1. On home page, click any partner card (e.g., "Premium Gifts Co")
2. Should navigate to: `/customer/partners/00000000-0000-0000-0000-000000000001`

**Expected Results**:
- ✅ Partner info displays (name, rating, delivery)
- ✅ Items grid shows products from that partner
- ✅ 6 items visible (Premium Gift Hamper, Artisan Chocolate Box, etc.)
- ✅ Images load correctly
- ✅ "Sponsored" badges on items #1 and #4

---

### **Test 8: Item Bottom Sheet**

**Steps**:
1. On partner page, click any item card
2. Bottom sheet should open from bottom

**Expected Results**:
- ✅ Sheet opens smoothly
- ✅ Item images in carousel (aspect-square)
- ✅ Item name, price, rating display
- ✅ Description shows (3 lines)
- ✅ Quantity stepper works
- ✅ Add-ons checkboxes work
- ✅ "Customers Also Bought" carousel at bottom
- ✅ Compliance accordion has 2 sections:
  - Product Details (weight, dimensions, materials)
  - Order Information (GST, refund, delivery)

---

### **Test 9: Cart with Authentication**

**Prerequisites**: Must be logged in

**Steps**:
1. Open item bottom sheet
2. Select quantity: 2
3. Select add-on: "Gift Wrapping"
4. Click: "Add to Cart"

**Expected Results**:
- ✅ Toast: "Added to cart"
- ✅ Cart badge updates in bottom nav (shows "2")
- ✅ Navigate to: `/customer/cart`
- ✅ Item appears in cart
- ✅ Partner name shows: "Items from Premium Gifts Co"

**Verify Supabase**:
1. Open: Supabase Dashboard → Table Editor → cart_items
2. Should see: New row with your user_id, product_id, partner_id
3. Refresh page
4. Cart should persist (item still there)

---

### **Test 10: Single-Partner Cart Enforcement**

**Steps**:
1. Add item from Partner A (e.g., Premium Gifts Co)
2. Go back to home
3. Click different partner (e.g., "Artisan Hampers")
4. Click any item
5. In bottom sheet, click "Add to Cart"

**Expected Results**:
- ✅ Modal appears: "Items already in cart"
- ✅ Message: "Your cart contains items from Premium Gifts Co. Do you want to discard and add from Artisan Hampers?"
- ✅ Two buttons: "Cancel" and "Start Fresh"
- ✅ Click "Start Fresh" → Cart clears, new item added
- ✅ Click "Cancel" → Modal closes, cart unchanged

---

### **Test 11: Carousel Pause on Hover (WCAG)**

**Steps**:
1. Go to: `/customer/home`
2. Watch hero banner carousel auto-rotate (every 5 seconds)
3. Hover mouse over carousel
4. Wait 5+ seconds while hovering

**Expected Results**:
- ✅ Carousel auto-rotates normally
- ✅ When hovering: Rotation PAUSES (slide stays)
- ✅ Move mouse away: Rotation RESUMES
- ✅ Click slide: Rotation PAUSES
- ✅ Drag carousel: Rotation STOPS

---

### **Test 12: Responsive Design**

**Mobile** (resize browser to <768px):
- ✅ Bottom nav visible (5 icons)
- ✅ Occasion cards have left padding (not touching edge)
- ✅ Occasion icons: 80x80px (larger, visible)
- ✅ 2-row occasion scroll
- ✅ Floating cart button: bottom-right (if cart has items)
- ✅ Bottom nav: 56px height (not cramped)

**Desktop** (resize browser to >768px):
- ✅ Bottom nav hidden
- ✅ Header shows: Search, Cart, Wishlist, Account icons
- ✅ Occasion grid: 1 row (no scroll)
- ✅ Partner cards: 4 columns
- ✅ Bottom sheets: Centered with max-width-640px

---

## **🐛 COMMON ISSUES & FIXES**

### **Issue: "Supabase fetch failed" in console**

**Possible Causes**:
1. SQL migration not run correctly
2. Tables don't exist
3. RLS policies blocking access

**Fix**:
```sql
-- Verify tables in Supabase Dashboard → SQL Editor
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
-- Should return: cart_items, items, partners, profiles, wishlist_items

-- Verify seed data
SELECT COUNT(*) FROM partners;  -- Should return: 6
SELECT COUNT(*) FROM items;     -- Should return: 6

-- If 0 rows, re-run seed data section of migration
```

---

### **Issue: Login fails with "Invalid credentials"**

**Possible Causes**:
1. Email/password incorrect
2. Email not in Supabase auth.users
3. Supabase email verification required (and not verified)

**Fix**:
```
1. Supabase Dashboard → Authentication → Users
2. Find your test user (test@example.com)
3. If not there: Signup didn't work (check console errors)
4. If there: Check "Email Confirmed" column
5. If not confirmed: Click user → "Send confirmation email" OR disable email confirmation in settings
```

---

### **Issue: Email verification banner doesn't show**

**Possible Causes**:
1. Email already verified
2. AuthContext not detecting user
3. Banner component not imported

**Fix**:
```
1. Check browser DevTools → Console
2. Look for: "User" object in logs
3. Check: user.isEmailVerified value
4. If undefined: AuthContext mapping issue
5. If true: Email is verified (banner won't show)
```

---

### **Issue: Carousel doesn't pause on hover**

**Possible Causes**:
1. Dev server not restarted after changes
2. Autoplay plugin not configured

**Fix**:
```bash
# Restart dev server
Ctrl+C (stop current server)
npm run dev
# Refresh browser
```

---

## **✅ SUCCESS INDICATORS**

**You'll know everything is working when**:

1. ✅ Signup auto-logs you in (goes to home, not login page)
2. ✅ Yellow email verification banner shows at top
3. ✅ Partners load on home page (6 partners visible)
4. ✅ Clicking partner shows their items
5. ✅ Adding to cart saves to Supabase (persists on refresh)
6. ✅ Cart replacement modal works (different partner)
7. ✅ Carousel pauses when you hover over it
8. ✅ Session persists on page refresh
9. ✅ Logout clears session
10. ✅ No console errors

---

## **📊 VERIFICATION STATUS**

**Before SQL Migration**:
```
Database Tables: 0 ❌
Seed Data: 0 rows ❌
Auth Working: Partially ⚠️
Data Fetching: Mock fallback only ⚠️
```

**After SQL Migration** (Expected):
```
Database Tables: 5 ✅
Seed Data: 12 rows (6 partners + 6 items) ✅
Auth Working: Fully ✅
Data Fetching: Real Supabase ✅
Session Management: Working ✅
```

---

## **🎯 NEXT ACTIONS**

### **1. Test Authentication (Critical)**
- [ ] Signup new user → Should auto-login
- [ ] Check email banner shows
- [ ] Login with credentials → Should work
- [ ] Refresh page → Should stay logged in

### **2. Test Data (Important)**
- [ ] Partners load on home page (check console for "Supabase fetch failed")
- [ ] Partner page shows items
- [ ] Item sheet opens with details
- [ ] Cart saves to database (check Supabase table)

### **3. Test UX (Nice to Have)**
- [ ] Carousel pauses on hover
- [ ] Occasion icons are 80px (bigger)
- [ ] Bottom nav is 56px (more padding)
- [ ] All spacing correct

---

**Start testing and let me know which test fails (if any)!** 🚀

**Expected**: All tests should pass if SQL migration ran successfully.

