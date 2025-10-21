# 🔑 Supabase API Keys & Configuration

**Project:** Wyshkit Platform  
**Supabase Project ID:** `usiwuxudinfxttvrcczb`

---

## 📋 Supabase Credentials

### Supabase URL
```
https://usiwuxudinfxttvrcczb.supabase.co
```

### Supabase Anon Key
**To get your anon key:**

1. Go to: https://app.supabase.com/project/usiwuxudinfxttvrcczb/settings/api
2. Look for **"Project API keys"** section
3. Copy the **"anon" "public"** key
4. It's a long string starting with `eyJ...`

**Example format:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzaXd1eHVkaW5meHR0dnJjY3piIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODcyNzI5MjIsImV4cCI6MjAwMjg0ODkyMn0.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

## 🔧 How to Update Your `.env` File

**Current `.env` file content:**
```env
VITE_GOOGLE_PLACES_API_KEY=AIzaSyCP8hH5Ad-fSsh61PdH7yUjP5kAkb2Rgeo
```

**Update it to include Supabase:**
```bash
# Edit .env file
nano .env
```

**Add these lines:**
```env
# Google Maps API
VITE_GOOGLE_PLACES_API_KEY=AIzaSyCP8hH5Ad-fSsh61PdH7yUjP5kAkb2Rgeo

# Supabase Configuration
VITE_SUPABASE_URL=https://usiwuxudinfxttvrcczb.supabase.co
VITE_SUPABASE_ANON_KEY=<paste-your-anon-key-here>
```

**Save:** Ctrl+O, Enter, Ctrl+X

**Restart server:**
```bash
pkill -f "node.*vite" && npm run dev
```

---

## 🔍 Where to Find Anon Key

### Method 1: Supabase Dashboard (Recommended)

1. Open: https://app.supabase.com
2. Select your project: `usiwuxudinfxttvrcczb`
3. Go to: **Settings** → **API**
4. Find: **"Project API keys"** section
5. Copy: The key labeled **"anon" "public"**

### Method 2: Project Settings

1. Direct link: https://app.supabase.com/project/usiwuxudinfxttvrcczb/settings/api
2. Scroll to "Project API keys"
3. Copy the "anon" key

---

## ⚠️ Important Notes

### Security
- ✅ **Anon key is safe** for client-side code (it's public)
- ✅ **Never commit** `.env` file to git (already in `.gitignore`)
- ✅ **Row Level Security (RLS)** protects your data

### OAuth Callback URL
```
https://usiwuxudinfxttvrcczb.supabase.co/auth/v1/callback
```
- Already configured in your earlier message
- Use this for Google/Facebook OAuth setup

---

## 🧪 How to Test After Adding Keys

### Test 1: Check Connection
1. Update `.env` with both keys
2. Restart server
3. Open `http://localhost:8080`
4. **Open browser console** (F12)
5. Should see **no Supabase errors**

### Test 2: Try Login
1. Go to `/partner/login`
2. Try existing account (if any)
3. OR sign up with new account
4. Should create user in Supabase

### Test 3: Check Database
1. Open Supabase Dashboard → Table Editor
2. Check `auth.users` table
3. Should see new users created

---

## 📊 Current Configuration Status

| Item | Status | Notes |
|------|--------|-------|
| Google Places API | ✅ CONFIGURED | In `.env` file |
| Google Geocoding | ✅ CONFIGURED | Same key as Places |
| Supabase URL | ✅ KNOWN | `usiwuxudinfxttvrcczb` |
| Supabase Anon Key | ⚠️ NEEDED | Get from dashboard |
| OAuth Callback | ✅ KNOWN | Already provided |

---

## 🎯 Complete `.env` File Example

```env
# Google Maps API (for address autocomplete + reverse geocoding)
VITE_GOOGLE_PLACES_API_KEY=AIzaSyCP8hH5Ad-fSsh61PdH7yUjP5kAkb2Rgeo

# Supabase Configuration
VITE_SUPABASE_URL=https://usiwuxudinfxttvrcczb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzaXd1eHVkaW5meHR0dnJjY3piIiwicm9sZSI6ImFub24iLCJpYXQiOjE2ODcyNzI5MjIsImV4cCI6MjAwMjg0ODkyMn0.xxxxxxxxxxxxxxxx

# Optional: Razorpay (for payments)
# VITE_RAZORPAY_KEY_ID=your-razorpay-key

# Note: IDfy credentials are hardcoded in src/lib/api/idfy-real.ts
# Note: Twilio is configured in Supabase Dashboard (not .env)
```

**Replace `xxxxxxxxxxxxxxxx` with your actual anon key!**

---

## 🚀 Quick Setup

**Run these commands:**
```bash
# 1. Get your Supabase anon key from dashboard
# Visit: https://app.supabase.com/project/usiwuxudinfxttvrcczb/settings/api

# 2. Update .env file
echo 'VITE_SUPABASE_URL=https://usiwuxudinfxttvrcczb.supabase.co' >> .env
echo 'VITE_SUPABASE_ANON_KEY=<paste-your-key-here>' >> .env

# 3. Restart server
pkill -f "node.*vite" && npm run dev

# 4. Test at http://localhost:8080
```

---

## ✅ Summary

**What You Have:**
- ✅ Supabase URL: `https://usiwuxudinfxttvrcczb.supabase.co`
- ✅ Google API Key: Already in `.env`
- ✅ OAuth Callback: Known

**What You Need:**
- ⚠️ Supabase Anon Key: Get from dashboard (link above)

**Time to Get Key:** 1 minute (just copy from Supabase dashboard)

---

**Next Step:** Get anon key → Update `.env` → Restart server → Test! 🚀

