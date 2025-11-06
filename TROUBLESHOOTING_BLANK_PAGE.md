# 🔧 Troubleshooting Blank Page on Vercel

If your Vercel deployment shows a blank page, follow these steps:

## ✅ Step 1: Check Environment Variables

**You need BOTH environment variables, not just the URL:**

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add **both** of these:
   - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-key-here` ⚠️ **This is required!**

3. **Important:** After adding variables, you MUST redeploy:
   - Go to Deployments tab
   - Click the "⋯" menu on latest deployment
   - Click "Redeploy"

## ✅ Step 2: Check Browser Console

Open browser DevTools (F12) and check the Console tab for errors:

1. **If you see "Failed to fetch" or network errors:**
   - Supabase URL might be incorrect
   - Check CORS settings in Supabase

2. **If you see "Cannot read property" or undefined errors:**
   - Missing environment variables
   - Check that both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set

3. **If you see module loading errors:**
   - Build might have failed
   - Check Vercel build logs

## ✅ Step 3: Check Vercel Build Logs

1. Go to Vercel Dashboard → Your Project → Deployments
2. Click on the latest deployment
3. Check the "Build Logs" tab
4. Look for any errors or warnings

**Common build errors:**
- Missing dependencies
- TypeScript errors
- Import path errors

## ✅ Step 4: Verify Environment Variables Are Loaded

The app should work even without Supabase (it uses mock data). If the page is completely blank, it's likely:

1. **JavaScript error** - Check browser console
2. **Missing environment variable** - Both URL and ANON_KEY are required
3. **Build failure** - Check Vercel build logs

## ✅ Step 5: Quick Fix Checklist

- [ ] Added `VITE_SUPABASE_URL` to Vercel environment variables
- [ ] Added `VITE_SUPABASE_ANON_KEY` to Vercel environment variables ⚠️ **Critical!**
- [ ] Selected all environments (Production, Preview, Development)
- [ ] Redeployed after adding variables
- [ ] Checked browser console for errors
- [ ] Checked Vercel build logs for errors
- [ ] Verified Supabase project is active (not paused)

## 🔍 Debug Steps

### Check if it's a JavaScript Error:

1. Open https://velmorawyshkit.vercel.app/
2. Press F12 to open DevTools
3. Go to Console tab
4. Look for red error messages
5. Share the error message if you see any

### Check if Environment Variables Are Set:

The app should work with mock data even without Supabase. If it's completely blank, there's likely a JavaScript error preventing the app from loading.

### Test Locally First:

```bash
# Set environment variables locally
export VITE_SUPABASE_URL="https://your-project.supabase.co"
export VITE_SUPABASE_ANON_KEY="your-anon-key"

# Build and test
npm run build
npm run preview
```

## 🚨 Most Common Issue

**Missing `VITE_SUPABASE_ANON_KEY`** - You mentioned adding the URL, but you also need the anon key!

Get it from: Supabase Dashboard → Settings → API → **anon/public** key

## 📞 Still Not Working?

If the page is still blank after checking all above:

1. Share the browser console errors (F12 → Console)
2. Share Vercel build logs
3. Check if the build succeeded in Vercel

