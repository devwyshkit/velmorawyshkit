# 🔧 TROUBLESHOOTING: Login Failed

## ❌ **Issue**: "Invalid login credentials"

**What this means:**
- Test accounts weren't created in Supabase
- Either SQL didn't run completely, or failed silently
- Need to verify and re-run account creation

---

## 📋 **Step 1: Verify What Ran**

Run this in Supabase SQL Editor:

```sql
-- Copy from VERIFY_ACCOUNTS.sql
SELECT email, raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email IN ('partner@wyshkit.com', 'admin@wyshkit.com', 'pending@wyshkit.com');
```

**Expected**: 3 rows  
**If 0 rows**: Accounts not created - SQL failed  
**If 1-2 rows**: Only some created - SQL partially failed

---

## ✅ **Step 2: Manual Account Creation (Simpler)**

If verification shows 0 accounts, run this **simpler** SQL:

```sql
-- ============================================================================
-- SIMPLE ACCOUNT CREATION (No complex DO blocks)
-- ============================================================================

-- 1. PARTNER ACCOUNT
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_super_admin,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,  -- Fixed UUID for easy reference
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'partner@wyshkit.com',
  crypt('Partner@123', gen_salt('bf')),
  now(),
  NULL,
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{"role":"partner","business_name":"Test Partner Store"}',
  now(),
  now(),
  NULL,
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Create partner profile
INSERT INTO public.partner_profiles (
  id,
  business_name,
  category,
  status,
  phone,
  created_at,
  approved_at
) VALUES (
  'aaaaaaaa-bbbb-cccc-dddd-111111111111'::uuid,
  'Test Partner Store',
  'tech_gifts',
  'approved',
  '9876543210',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================

-- 2. ADMIN ACCOUNT
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_super_admin,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at
) VALUES (
  'bbbbbbbb-cccc-dddd-eeee-222222222222'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'admin@wyshkit.com',
  crypt('Admin@123', gen_salt('bf')),
  now(),
  NULL,
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{"role":"admin"}',
  now(),
  now(),
  NULL,
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================

-- 3. PENDING PARTNER
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_super_admin,
  phone,
  phone_confirmed_at,
  phone_change,
  phone_change_token,
  phone_change_sent_at,
  email_change_token_current,
  email_change_confirm_status,
  banned_until,
  reauthentication_token,
  reauthentication_sent_at
) VALUES (
  'cccccccc-dddd-eeee-ffff-333333333333'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  'pending@wyshkit.com',
  crypt('Pending@123', gen_salt('bf')),
  now(),
  NULL,
  NULL,
  '{"provider":"email","providers":["email"]}',
  '{"role":"partner","business_name":"Pending Food Partner"}',
  now(),
  now(),
  NULL,
  NULL,
  NULL,
  '',
  '',
  NULL,
  '',
  0,
  NULL,
  '',
  NULL
) ON CONFLICT (id) DO NOTHING;

-- Create pending partner profile
INSERT INTO public.partner_profiles (
  id,
  business_name,
  category,
  status,
  phone,
  pan_number,
  gst_number,
  fssai_number,
  created_at,
  submitted_at
) VALUES (
  'cccccccc-dddd-eeee-ffff-333333333333'::uuid,
  'Pending Food Partner',
  'food',
  'pending',
  '9876543211',
  'ABCDE1234F',
  '22ABCDE1234F1Z5',
  '12345678901234',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFY ACCOUNTS CREATED
-- ============================================================================

SELECT 
  email,
  raw_user_meta_data->>'role' as role,
  email_confirmed_at IS NOT NULL as confirmed,
  'CREATED ✅' as status
FROM auth.users
WHERE email IN ('partner@wyshkit.com', 'admin@wyshkit.com', 'pending@wyshkit.com')
ORDER BY email;

-- Should show 3 rows with "CREATED ✅"
```

---

## 🔍 **Step 3: Check Supabase Dashboard**

Alternative verification:
1. Go to: Supabase Dashboard → **Authentication** → **Users**
2. Look for: `partner@wyshkit.com`, `admin@wyshkit.com`, `pending@wyshkit.com`
3. If they exist: Password might be wrong
4. If they don't: Run the simple SQL above

---

## 🚀 **Step 4: Test Login Again**

After running simple SQL:
1. Go to: http://localhost:8080/partner/login
2. Email: `partner@wyshkit.com`
3. Password: `Partner@123`
4. Should work! ✅

---

## ⚠️ **Common Issues & Fixes**

### **Issue**: "Column does not exist"
→ **Fix**: Tables not created. Run migration first:
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'partner_profiles';

-- If empty, run SETUP_DATABASE_AND_ACCOUNTS.sql again
```

### **Issue**: "Cannot insert duplicate key"
→ **Fix**: Accounts already exist. Just test login directly.

### **Issue**: "crypt function does not exist"
→ **Fix**: Enable pgcrypto extension:
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

### **Issue**: Login still fails after creating accounts
→ **Fix**: Check if email is confirmed:
```sql
UPDATE auth.users 
SET email_confirmed_at = now() 
WHERE email IN ('partner@wyshkit.com', 'admin@wyshkit.com', 'pending@wyshkit.com');
```

---

## 📞 **QUICK RESOLUTION**

**If you're stuck**, just run these 2 SQL blocks in order:

1. **Enable extension** (if needed):
```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;
```

2. **Create accounts** (copy from "Simple Account Creation" above)

3. **Test login**: http://localhost:8080/partner/login

---

**Let me know what the verification SQL shows and I'll guide you through the fix!** 🔧

