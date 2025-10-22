# 🔧 How to Create Admin Account - Step by Step

## Method 1: Via Supabase Dashboard (Easiest - 2 minutes)

### Step 1: Access Supabase Dashboard
1. Open browser and go to: https://supabase.com/dashboard
2. Login to your Supabase account
3. Click on project: **usiwuxudinfxttvrcczb**

### Step 2: Create Admin User
1. In left sidebar, click: **Authentication** → **Users**
2. Click the green **"Add user"** button (top right)
3. Fill in the form:
   - **Email:** `admin@wyshkit.com`
   - **Password:** `AdminWysh@2024`
   - **Auto Confirm User:** ✅ CHECK THIS BOX (important!)
4. Click **"Create user"**
5. **Copy the User ID** that appears (looks like: `6fdea e1c-3b22-4e9f-8200-0b5485aef97b`)

### Step 3: Add Admin Role
1. In left sidebar, click: **Table Editor**
2. Find and click: **`admin_users`** table
3. Click **"Insert row"** button
4. Fill in the row:
   - **id:** Paste the User ID you copied
   - **email:** `admin@wyshkit.com`
   - **role:** `admin`
   - **created_at:** Leave as default (auto-fills)
5. Click **"Save"**

### Step 4: Test Login
1. Go to: http://localhost:8080/admin/login
2. Enter:
   - Email: `admin@wyshkit.com`
   - Password: `AdminWysh@2024`
3. Click **"Sign In"**
4. ✅ You should see the Admin Dashboard!

---

## Method 2: Via SQL Editor (Advanced - 1 minute)

### Step 1: Open SQL Editor
1. Go to: https://supabase.com/dashboard/project/usiwuxudinfxttvrcczb
2. Click: **SQL Editor** in left sidebar
3. Click: **"New query"**

### Step 2: Run This SQL
```sql
-- Create admin user with email and password
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@wyshkit.com',
  crypt('AdminWysh@2024', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Admin User"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Create admin_users entry
INSERT INTO public.admin_users (id, email, role, created_at)
SELECT 
  id, 
  'admin@wyshkit.com',
  'admin',
  NOW()
FROM auth.users 
WHERE email = 'admin@wyshkit.com';
```

### Step 3: Execute
1. Click **"Run"** button (or press Cmd+Enter / Ctrl+Enter)
2. You should see: **"Success. 1 rows affected"**

### Step 4: Test Login
1. Go to: http://localhost:8080/admin/login
2. Login with:
   - Email: `admin@wyshkit.com`
   - Password: `AdminWysh@2024`
3. ✅ You're in!

---

## Method 3: Use Your Existing Google Account

Since you already logged in with Google OAuth before, you can use that account:

### Step 1: Find Your User in Supabase
1. Go to: Authentication → Users
2. Look for: `prateek@basecampmart.com`
3. **Copy the User ID**

### Step 2: Add Admin Role
1. Go to: Table Editor → `admin_users`
2. Insert row:
   - **id:** Your User ID
   - **email:** `prateek@basecampmart.com`
   - **role:** `admin`
3. Save

### Step 3: Login via Google OAuth
1. Go to: http://localhost:8080/admin/login
2. If there's a Google button, click it
3. If not, you'll need to add Google OAuth to admin login page

---

## ⚠️ Common Issues

### Issue: "email already exists"
**Solution:** The user already exists. Skip to Step 3 (Add Admin Role) using Method 1.

### Issue: "relation admin_users does not exist"
**Solution:** The `admin_users` table hasn't been created. Run this SQL first:
```sql
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Issue: SQL Editor shows errors
**Solution:** Run the queries separately:
1. First run only the INSERT INTO auth.users part
2. Then run the INSERT INTO admin_users part

---

## ✅ Verification

To verify the admin account was created successfully:

### Check Authentication
1. Go to: Authentication → Users
2. You should see: `admin@wyshkit.com` in the list

### Check Admin Role
1. Go to: Table Editor → `admin_users`
2. You should see a row with:
   - email: `admin@wyshkit.com`
   - role: `admin`

### Test Login
1. Go to: http://localhost:8080/admin/login
2. Enter credentials
3. Should redirect to: http://localhost:8080/admin/dashboard

---

## 🎯 Quick Commands

**Supabase Dashboard URL:**
```
https://supabase.com/dashboard/project/usiwuxudinfxttvrcczb
```

**Admin Login URL:**
```
http://localhost:8080/admin/login
```

**Admin Credentials:**
```
Email: admin@wyshkit.com
Password: AdminWysh@2024
```

---

**That's it!** Choose whichever method you're most comfortable with. Method 1 (Dashboard) is recommended for beginners.

