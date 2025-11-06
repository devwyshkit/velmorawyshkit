# 🔧 Fix Blank Page on Vercel

## ⚠️ Most Common Issue: Missing ANON_KEY

You mentioned adding the Supabase URL, but you **ALSO need the ANON_KEY**:

### Required Environment Variables (Both!)

1. **VITE_SUPABASE_URL** ✅ (You added this)
2. **VITE_SUPABASE_ANON_KEY** ❌ (You need to add this!)

### How to Get ANON_KEY:

1. Go to Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy the **anon/public** key (NOT service_role key)
5. Add it to Vercel as `VITE_SUPABASE_ANON_KEY`

### Add to Vercel:

1. Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add:
   - Name: `VITE_SUPABASE_ANON_KEY`
   - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (your actual key)
   - Environment: Select **all** (Production, Preview, Development)
3. Click **Save**
4. **IMPORTANT:** Go to **Deployments** → Click **⋯** on latest → **Redeploy**

## 🔍 Debug Steps

### Step 1: Check Browser Console

1. Open https://velmorawyshkit.vercel.app/
2. Press **F12** (or right-click → Inspect)
3. Go to **Console** tab
4. Look for **red error messages**

**Common errors:**
- `Cannot read property 'X' of undefined` → Missing environment variable
- `Failed to fetch` → Supabase URL incorrect or CORS issue
- `Module not found` → Build issue

### Step 2: Check Network Tab

1. Open **Network** tab in DevTools
2. Refresh the page
3. Look for **failed requests** (red status codes)
4. Check if JavaScript files are loading (status 200)

### Step 3: Check Vercel Build Logs

1. Vercel Dashboard → Your Project → **Deployments**
2. Click on the latest deployment
3. Check **Build Logs**
4. Look for errors or warnings

## ✅ Quick Checklist

- [ ] Added `VITE_SUPABASE_URL` ✅
- [ ] Added `VITE_SUPABASE_ANON_KEY` ⚠️ **DO THIS!**
- [ ] Selected all environments (Production, Preview, Development)
- [ ] **Redeployed** after adding variables
- [ ] Checked browser console for errors
- [ ] Verified Supabase project is active (not paused)

## 🚨 If Still Blank After Adding ANON_KEY

The app should work with **mock data** even without Supabase. If it's still blank:

1. **Check browser console** - Share the error message
2. **Check Vercel build logs** - Did the build succeed?
3. **Try hard refresh**: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
4. **Clear browser cache** and try again

## 📝 Note

The app is designed to work with **mock data** even if Supabase is not configured. If you see a completely blank page, there's likely a **JavaScript error** preventing the app from loading.

**Share the browser console error** and I can help fix it!

