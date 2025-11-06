# 🚀 Vercel Deployment Guide

## Environment Variables Setup

To deploy this application to Vercel, you need to configure environment variables in your Vercel project settings.

### Required Environment Variables

#### 1. Supabase Configuration

**VITE_SUPABASE_URL**
- Description: Your Supabase project URL
- Example: `https://xxxxxxxxxxxxx.supabase.co`
- How to get it:
  1. Go to your Supabase project dashboard
  2. Navigate to **Settings** → **API**
  3. Copy the **Project URL**

**VITE_SUPABASE_ANON_KEY**
- Description: Your Supabase anonymous/public key
- Example: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- How to get it:
  1. Go to your Supabase project dashboard
  2. Navigate to **Settings** → **API**
  3. Copy the **anon/public** key (NOT the service_role key)

### Optional Environment Variables

**VITE_RAZORPAY_KEY** (Optional)
- Description: Razorpay API key for payments
- Example: `rzp_test_xxxxxxxxxxxxx`

**VITE_GOOGLE_PLACES_API_KEY** (Optional)
- Description: Google Places API key for address autocomplete
- Example: `AIzaSy...`

**VITE_OPENAI_API_KEY** (Optional)
- Description: OpenAI API key for AI features
- Example: `sk-...`

**VITE_API_BASE_URL** (Optional)
- Description: Base URL for API calls
- Default: `/api/v1`

## How to Add Environment Variables in Vercel

### Method 1: Via Vercel Dashboard (Recommended)

1. Go to your Vercel project dashboard
2. Click on **Settings** tab
3. Click on **Environment Variables** in the sidebar
4. Add each variable:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: Your Supabase project URL
   - **Environment**: Select all (Production, Preview, Development)
5. Click **Save**
6. Repeat for `VITE_SUPABASE_ANON_KEY` and other variables

### Method 2: Via Vercel CLI

```bash
# Install Vercel CLI if not already installed
npm i -g vercel

# Login to Vercel
vercel login

# Link your project
vercel link

# Add environment variables
vercel env add VITE_SUPABASE_URL
vercel env add VITE_SUPABASE_ANON_KEY

# Pull environment variables to verify
vercel env pull
```

### Method 3: Via Vercel Dashboard - Bulk Import

1. Go to **Settings** → **Environment Variables**
2. Click **Import** button
3. Paste your `.env` file content (one variable per line)
4. Select environments (Production, Preview, Development)
5. Click **Import**

## After Adding Environment Variables

1. **Redeploy your application**:
   - Go to **Deployments** tab
   - Click the **⋯** menu on the latest deployment
   - Click **Redeploy**
   - Or push a new commit to trigger automatic deployment

2. **Verify the deployment**:
   - Check the build logs to ensure environment variables are loaded
   - Test the application to confirm Supabase connection works

## Important Notes

⚠️ **Security Best Practices:**
- Never commit `.env` files to git
- Use Vercel's environment variables instead of hardcoding
- The `anon` key is safe to expose in frontend code (it's public)
- Never expose the `service_role` key in frontend code

✅ **Vite Environment Variables:**
- All environment variables must be prefixed with `VITE_` to be accessible in the frontend
- Variables are embedded at build time, not runtime
- After adding new variables, you must rebuild/redeploy

## Troubleshooting

### Build fails with "Cannot find module" errors
- Ensure all environment variables are set in Vercel
- Check that variable names start with `VITE_`
- Redeploy after adding variables

### Supabase connection not working
- Verify `VITE_SUPABASE_URL` format: `https://xxxxx.supabase.co`
- Verify `VITE_SUPABASE_ANON_KEY` is the correct anon key (not service_role)
- Check browser console for connection errors
- Verify Supabase project is active and not paused

### Environment variables not updating
- Variables are embedded at build time
- You must redeploy after changing environment variables
- Clear browser cache if testing locally

## Quick Setup Checklist

- [ ] Get Supabase URL from project settings
- [ ] Get Supabase anon key from project settings
- [ ] Add `VITE_SUPABASE_URL` to Vercel environment variables
- [ ] Add `VITE_SUPABASE_ANON_KEY` to Vercel environment variables
- [ ] Select all environments (Production, Preview, Development)
- [ ] Redeploy the application
- [ ] Verify Supabase connection works

## Support

If you encounter issues:
1. Check Vercel build logs
2. Check browser console for errors
3. Verify environment variables are set correctly
4. Ensure Supabase project is active

