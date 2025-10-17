# 🔄 FRESH DATABASE SETUP - Complete Cleanup & Reinstall

**Problem**: Login failing - likely due to old tables/data from previous implementations  
**Solution**: Complete database cleanup + fresh customer-only schema

---

## **🚨 STEP-BY-STEP INSTRUCTIONS (15 Minutes)**

### **Step 1: Complete Database Cleanup**

**Run THIS file first**: `supabase/migrations/000_complete_cleanup.sql`

**Steps**:
1. Open: https://supabase.com/dashboard/project/usiwuxudinfxttvrcczb
2. Click: "SQL Editor" (left sidebar)
3. Click: "New query"
4. Open file: `000_complete_cleanup.sql`
5. Copy: Entire contents
6. Paste: Into Supabase SQL editor
7. Click: "Run"
8. Wait: Should see "Success. No rows returned"

**This will**:
- Drop ALL existing tables (clean slate)
- Remove old functions/triggers
- Clear old RLS policies
- Prepare for fresh schema

---

### **Step 2: Install Fresh Customer Schema**

**Run THIS file second**: `supabase/migrations/002_fresh_customer_schema.sql`

**Steps**:
1. In same SQL Editor (or click "New query")
2. Open file: `002_fresh_customer_schema.sql`
3. Copy: Entire contents
4. Paste: Into Supabase SQL editor
5. Click: "Run"
6. Wait: Should see "Success. No rows returned"

**This will**:
- Create 5 fresh tables (customer-only)
- Add RLS policies
- Add full-text search
- Insert 6 partners + 6 items
- Set up proper indexes

---

### **Step 3: Verify Tables Created**

**In Supabase Dashboard**:
1. Click: "Database" → "Tables" (left sidebar)
2. You should see ONLY these 5 tables:
   - `profiles`
   - `partners`
   - `items`
   - `cart_items`
   - `wishlist_items`

**If you see other tables** (like `sellers`, `admins`, `vendors`, etc.):
- Cleanup script didn't run correctly
- Re-run `000_complete_cleanup.sql`

---

### **Step 4: Verify Seed Data**

**In SQL Editor**, run:
```sql
-- Check partners
SELECT id, name, sponsored FROM partners ORDER BY name;
-- Expected: 6 rows

-- Check items
SELECT id, name, sponsored FROM items ORDER BY name;
-- Expected: 6 rows
```

**Expected Output**:
```
Partners:
1. Artisan Hampers (sponsored: false)
2. Custom Crafts (sponsored: false)
3. Gourmet Treats (sponsored: false)
4. Luxury Hampers (sponsored: false)
5. Premium Gifts Co (sponsored: true) ✓
6. Sweet Delights (sponsored: false)

Items:
1. Artisan Chocolate Box
2. Custom Photo Frame
3. Gourmet Snack Basket
4. Luxury Perfume Set (sponsored: true) ✓
5. Premium Gift Hamper (sponsored: true) ✓
6. Wireless Earbuds
```

---

### **Step 5: Clear All Users (Fresh Auth)**

**In Supabase Dashboard**:
1. Click: "Authentication" → "Users"
2. If there are ANY users listed: Delete them ALL
3. Click each user → "Delete user" → Confirm
4. This gives you a clean auth state

---

### **Step 6: Configure Auth Settings**

**Critical Settings**:
1. Click: "Authentication" → "Settings" tab
2. Scroll to: "Email Auth" section
3. Find: **"Enable email confirmations"**
4. **Turn it OFF** (disable) ← **CRITICAL FOR TESTING**
5. Click: "Save"

**Why**: This allows login without email verification (easier testing)

**Also Check**:
1. Site URL: Should be `http://localhost:5173`
2. Redirect URLs: Should include:
   - `http://localhost:5173/**`
   - `http://localhost:5173/customer/home`

---

### **Step 7: Restart Everything**

**Stop Dev Server**:
```bash
# In terminal, press: Ctrl+C
```

**Clear Browser Data**:
```
1. Open: DevTools (F12)
2. Application tab → Storage
3. Clear: Local Storage, Session Storage, Cookies
4. Close and reopen browser
```

**Restart Dev Server**:
```bash
npm run dev
```

---

### **Step 8: Test Fresh Signup**

**Steps**:
1. Go to: `http://localhost:5173/customer/signup`
2. Fill form with FRESH email (not used before):
   - Name: Test User
   - Email: fresh@example.com (or use your real email)
   - Password: Test123456
3. Click: "Create Account"

**Expected Results**:
- ✅ Toast: "Welcome to Wyshkit!"
- ✅ Redirects to: `/customer/home`
- ✅ NO email verification banner (because confirmation disabled)
- ✅ User is logged in

---

### **Step 9: Test Login**

**Steps**:
1. Logout (or open incognito window)
2. Go to: `http://localhost:5173/customer/login`
3. Enter:
   - Email: fresh@example.com
   - Password: Test123456
4. Click: "Sign In"

**Expected Results**:
- ✅ Toast: "Welcome back!"
- ✅ Redirects to: `/customer/home`
- ✅ User is logged in
- ✅ Session persists on refresh

---

## **🎯 SUCCESS CHECKLIST**

After completing all steps, verify:

- [ ] Only 5 tables in Database → Tables
- [ ] 6 partners in partners table
- [ ] 6 items in items table
- [ ] 0 users in Authentication → Users (before signup)
- [ ] "Enable email confirmations" is OFF
- [ ] Site URL is http://localhost:5173
- [ ] Signup works (auto-login)
- [ ] Login works (no errors)
- [ ] Session persists on refresh
- [ ] Partners load on home page (from Supabase)

---

## **📊 WHAT THIS FIXES**

**Before Cleanup**:
```
Old Tables: Unknown (possibly conflicting) ❌
Old Users: Possibly with wrong roles ❌
Email Confirmation: Probably ON ❌
Login: Failing ❌
```

**After Cleanup**:
```
Tables: 5 customer-only tables ✅
Users: Fresh, clean auth state ✅
Email Confirmation: OFF (testing) ✅
Login: Should work ✅
```

---

## **🔧 IF LOGIN STILL FAILS AFTER THIS**

**Then the issue is likely**:
1. Password mismatch (typo)
2. Supabase connection issue
3. Browser cache (clear and restart)

**Share with me**:
- Exact error message from toast
- Browser console error (F12 → Console)
- Screenshot of Supabase → Authentication → Users

---

## **🎯 TL;DR - QUICKEST FIX**

```
1. Supabase → SQL Editor → Run: 000_complete_cleanup.sql
2. Supabase → SQL Editor → Run: 002_fresh_customer_schema.sql
3. Supabase → Authentication → Settings → Disable "Enable email confirmations"
4. Supabase → Authentication → Users → Delete all users
5. Browser → Clear all site data
6. Terminal → Restart: npm run dev
7. Try signup with FRESH email
8. Login should work!
```

**This gives you a completely clean database with ONLY customer tables!** 🚀

