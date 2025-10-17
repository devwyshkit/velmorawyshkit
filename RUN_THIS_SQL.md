# 🚨 FIX "relation already exists" ERROR

**Error**: `ERROR: 42P07: relation "profiles" already exists`  
**Cause**: Tables were already created from previous SQL run  
**Solution**: Run COMPLETE_RESET.sql (drops everything, then recreates)

---

## **✅ SIMPLE FIX (5 Minutes)**

### **ONLY Run This ONE File**:

**File**: `supabase/migrations/COMPLETE_RESET.sql`

This file is **SAFE to run multiple times** because it:
1. Drops all tables (IF EXISTS - won't error if missing)
2. Drops all functions/triggers
3. Creates fresh customer-only schema
4. Inserts 6 partners + 6 items

---

## **📋 STEP-BY-STEP**

### **1. Open Supabase SQL Editor**
- Go to: https://supabase.com/dashboard/project/usiwuxudinfxttvrcczb
- Click: "SQL Editor" (left sidebar)
- Click: "New query"

### **2. Copy COMPLETE_RESET.sql**
- Open file: `supabase/migrations/COMPLETE_RESET.sql`
- Select ALL (Cmd+A or Ctrl+A)
- Copy ALL

### **3. Run in Supabase**
- Paste into SQL Editor
- Click: "Run" (green button)
- Wait: ~10 seconds
- Should see: "Success. No rows returned"

### **4. Verify**

Run this in SQL Editor:
```sql
-- Check tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Should show exactly 5 tables:
-- cart_items, items, partners, profiles, wishlist_items
```

---

## **🎯 AFTER RUNNING SQL**

### **Configure Auth (Critical)**:

1. **Disable Email Confirmation**:
   - Authentication → Settings → "Enable email confirmations" → **OFF**
   - Save

2. **Delete All Users** (fresh start):
   - Authentication → Users → Delete all existing users
   - This clears any old/broken user data

3. **Clear Browser Data**:
   - DevTools (F12) → Application → Clear all storage
   - Close and reopen browser

4. **Restart Dev Server**:
   ```bash
   # Stop: Ctrl+C
   npm run dev
   ```

---

## **🧪 TEST IMMEDIATELY**

### **Test 1: Signup**
1. Go to: http://localhost:5173/customer/signup
2. Fill: Name, Email (fresh email), Password
3. Click: "Create Account"
4. **Expected**: "Welcome to Wyshkit!" → Redirects to home
5. **Expected**: NO yellow banner (email confirmation disabled)

### **Test 2: Login**
1. Logout or open incognito
2. Go to: http://localhost:5173/customer/login
3. Enter: Same email + password
4. Click: "Sign In"
5. **Expected**: "Welcome back!" → Redirects to home
6. **Expected**: Login WORKS! ✅

---

## **📊 WHAT THIS FIXES**

**Issues**:
- ✅ "relation already exists" error
- ✅ Old tables from seller/KAM/admin UIs
- ✅ Conflicting RLS policies
- ✅ Old user data
- ✅ Email confirmation blocking login

**Result**:
- ✅ Clean database (customer-only)
- ✅ Fresh auth state
- ✅ Login working
- ✅ 6 partners + 6 items ready

---

## **🚀 TL;DR**

```
1. Run: COMPLETE_RESET.sql in Supabase SQL Editor
2. Disable: Email confirmation in Auth settings
3. Delete: All users in Authentication → Users
4. Clear: Browser data
5. Restart: npm run dev
6. Test: Signup + login with fresh email
```

**Login will work after this!** ✅

---

**Just run `COMPLETE_RESET.sql` and you're done!** 🎯

