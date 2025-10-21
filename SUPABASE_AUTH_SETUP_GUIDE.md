# Supabase Authentication Setup Guide

## Complete Step-by-Step Instructions to Enable Social & Phone Auth

---

## 🎯 Overview

Your Wyshkit platform now has **3 authentication methods** ready to use:
1. ✅ **Email/Password** - Already working
2. ⏳ **Google OAuth** - Needs Supabase configuration
3. ⏳ **Facebook OAuth** - Needs Supabase configuration  
4. ⏳ **Phone OTP** - Needs Supabase/Twilio configuration

The UI is **100% complete**. You just need to enable providers in your Supabase dashboard.

---

## 📋 Prerequisites

Before you start, have these ready:

- [ ] Access to your Supabase project dashboard
- [ ] Google Cloud Console account (for Google OAuth)
- [ ] Meta Developer account (for Facebook OAuth - optional)
- [ ] Twilio account (for SMS OTP - optional, Supabase has free tier)

---

## Part 1: Enable Google OAuth (15 minutes)

### Step 1: Get Google OAuth Credentials

1. **Go to Google Cloud Console**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project** (if you don't have one)
   - Click "Select a project" → "New Project"
   - Name: "Wyshkit Partner Portal"
   - Click "Create"

3. **Enable Google+ API**
   - In the search bar, type "Google+ API"
   - Click "Google+ API"
   - Click "Enable"

4. **Create OAuth Credentials**
   - Go to: APIs & Services → Credentials
   - Click "+ CREATE CREDENTIALS" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Wyshkit Supabase Auth"

5. **Configure Redirect URIs**
   - Under "Authorized redirect URIs", click "+ ADD URI"
   - Add: `https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback`
   - **Find your project ref:** In Supabase → Project Settings → General → Reference ID
   - Example: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`

6. **Get Your Credentials**
   - Click "CREATE"
   - Copy the **Client ID** (looks like: `123456789-abc.apps.googleusercontent.com`)
   - Copy the **Client Secret** (looks like: `GOCSPX-abc123def456`)
   - Keep these safe!

### Step 2: Configure Supabase for Google

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard
   - Select your Wyshkit project

2. **Navigate to Authentication**
   - Left sidebar → Authentication → Providers

3. **Enable Google Provider**
   - Scroll to "Google" section
   - Toggle "Enable Sign in with Google" to **ON**

4. **Enter Google Credentials**
   - Paste your **Client ID** from Step 1.6
   - Paste your **Client Secret** from Step 1.6
   - Authorized Client IDs: Leave empty (optional)
   - Click "Save"

5. **Test Configuration**
   - The toggle should stay green/enabled
   - No error messages should appear

### Step 3: Test Google Login

1. **Open Your App**
   - Navigate to: http://localhost:8080/partner/login (or your deployed URL)

2. **Click "Continue with Google"**
   - You should be redirected to Google's login page
   - Select your Google account
   - Grant permissions

3. **Verify Redirect**
   - After login, you should redirect to `/partner/dashboard`
   - Check Supabase → Authentication → Users to see your new user

4. **Troubleshooting**
   - If redirect fails, check the redirect URI is exactly correct
   - Check browser console for errors
   - Verify Client ID/Secret are pasted correctly (no extra spaces)

---

## Part 2: Enable Facebook OAuth (15 minutes) - OPTIONAL

### Step 1: Get Facebook App Credentials

1. **Go to Meta Developer Dashboard**
   - Visit: https://developers.facebook.com/
   - Log in with your Facebook account

2. **Create an App**
   - Click "My Apps" → "Create App"
   - Use case: "Consumer"
   - App name: "Wyshkit Partner Portal"
   - App contact email: your@email.com
   - Click "Create App"

3. **Add Facebook Login Product**
   - In your app dashboard, find "Add Products to Your App"
   - Click "Set Up" on "Facebook Login"
   - Platform: "Web"
   - Site URL: `https://yourdomain.com` (or localhost for testing)

4. **Configure OAuth Redirect URIs**
   - Go to: Facebook Login → Settings
   - Valid OAuth Redirect URIs:
     - Add: `https://[YOUR-SUPABASE-PROJECT-REF].supabase.co/auth/v1/callback`
   - Save Changes

5. **Get Your App Credentials**
   - Go to: Settings → Basic
   - Copy **App ID** (numeric, like: `1234567890123456`)
   - Click "Show" next to **App Secret**, copy it
   - Keep these safe!

6. **Make App Live**
   - Toggle "App Mode" from "Development" to "Live" (top right)
   - This is required for Facebook login to work

### Step 2: Configure Supabase for Facebook

1. **Open Supabase Dashboard**
   - Authentication → Providers

2. **Enable Facebook Provider**
   - Scroll to "Facebook" section
   - Toggle "Enable Sign in with Facebook" to **ON**

3. **Enter Facebook Credentials**
   - Facebook client ID: Paste your **App ID** from Step 1.5
   - Facebook secret: Paste your **App Secret** from Step 1.5
   - Click "Save"

### Step 3: Test Facebook Login

1. **Open Your App**
   - Navigate to: http://localhost:8080/partner/login

2. **Click "Continue with Facebook"**
   - Redirects to Facebook login
   - Log in and grant permissions

3. **Verify Success**
   - Should redirect to `/partner/dashboard`
   - New user appears in Supabase → Authentication → Users

---

## Part 3: Enable Phone OTP (10 minutes)

You have **2 options** for SMS OTP:

### Option A: Supabase Phone Auth (Easiest, Free Tier Available)

1. **Open Supabase Dashboard**
   - Authentication → Providers

2. **Enable Phone Provider**
   - Scroll to "Phone" section
   - Toggle "Enable Phone Sign-Up" to **ON**

3. **Configure Phone Settings**
   - Phone template: (default is fine)
   - OTP expiry: 60 seconds (default)
   - OTP length: 6 digits (default)
   - Click "Save"

4. **Test Limits (Important!)**
   - Supabase free tier: **Limited SMS per month**
   - Check: Project Settings → Billing → Usage
   - For production: Consider upgrading or using Twilio

### Option B: Use Twilio (Recommended for Production)

1. **Create Twilio Account**
   - Go to: https://www.twilio.com/
   - Sign up for free trial (gives you test credits)

2. **Get Twilio Credentials**
   - Dashboard → Account Info
   - Copy **Account SID** (starts with `AC...`)
   - Copy **Auth Token** (click to reveal)
   - Phone Numbers → Get a number (free on trial)

3. **Configure Supabase**
   - Supabase Dashboard → Authentication → Providers → Phone
   - Enable "Use custom SMS provider"
   - Select "Twilio"

4. **Enter Twilio Credentials**
   - Twilio Account SID: Paste your Account SID
   - Twilio Auth Token: Paste your Auth Token
   - Twilio Message Service SID: (optional, leave blank to use phone number)
   - Twilio Phone Number: Your Twilio number (e.g., `+14155551234`)
   - Click "Save"

5. **Test Configuration**
   - Go to your app: http://localhost:8080/partner/login
   - Click "Phone" tab
   - Enter your phone: `9740803490` (use your actual number)
   - Click "Send OTP"
   - Check your phone for the 6-digit code
   - Enter code and verify

---

## Part 4: Update Environment Variables (5 minutes)

Add these to your `.env` file (if needed):

```env
# Supabase (already configured)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# IDfy (optional, for real KYC)
VITE_IDFY_ACCOUNT_ID=your-idfy-account-id
VITE_IDFY_API_KEY=your-idfy-api-key

# Twilio (only if using Option B for SMS)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE_NUMBER=+1234567890
```

**Note:** Supabase OAuth credentials are stored in Supabase dashboard, NOT in your .env file.

---

## Part 5: Testing Checklist

### Test Email/Password (Already Working)
- [ ] Partner can sign up with email
- [ ] Email verification sent
- [ ] Can log in with email/password
- [ ] Redirects to onboarding

### Test Google OAuth
- [ ] "Continue with Google" button works
- [ ] Redirects to Google login
- [ ] After login, redirects to `/partner/dashboard`
- [ ] New user created in Supabase
- [ ] User metadata includes role: 'partner'

### Test Facebook OAuth (if enabled)
- [ ] "Continue with Facebook" button works
- [ ] Redirects to Facebook login
- [ ] After login, redirects to `/partner/dashboard`
- [ ] New user created in Supabase

### Test Phone OTP (if enabled)
- [ ] Can enter 10-digit phone number
- [ ] "Send OTP" button works
- [ ] Receives SMS with 6-digit code
- [ ] Can verify OTP successfully
- [ ] Redirects to `/partner/dashboard`
- [ ] New user created with phone as identifier

---

## Part 6: Production Deployment

When deploying to production:

1. **Update Google OAuth Redirect URI**
   - Add production URL to Google Cloud Console
   - Example: `https://your-project.supabase.co/auth/v1/callback`

2. **Update Facebook OAuth Redirect URI**
   - Add production URL to Meta Developer settings
   - Example: `https://your-project.supabase.co/auth/v1/callback`

3. **Verify Supabase Project Settings**
   - Supabase → Authentication → URL Configuration
   - Site URL: Your production URL (e.g., `https://wyshkit.com`)
   - Redirect URLs: Add your production domain

4. **Test All Flows on Production**
   - Use incognito mode to test fresh signups
   - Verify redirects work correctly
   - Check email deliverability

---

## Troubleshooting

### Google OAuth Issues

**Error: "redirect_uri_mismatch"**
- ✅ Fix: Double-check your Supabase redirect URI in Google Cloud Console
- Must be exactly: `https://[PROJECT-REF].supabase.co/auth/v1/callback`

**Error: "access_denied"**
- ✅ Fix: Make sure Google+ API is enabled in Google Cloud Console

### Facebook OAuth Issues

**Error: "App Not Set Up"**
- ✅ Fix: Toggle your Facebook app to "Live" mode (not Development)

**Error: "Invalid redirect_uri"**
- ✅ Fix: Add exact Supabase callback URL to Facebook Login settings

### Phone OTP Issues

**SMS Not Received**
- ✅ Check Twilio phone number is verified
- ✅ For free trial, verify recipient number first
- ✅ Check Twilio logs: Console → Monitor → Logs → Errors

**OTP Verification Fails**
- ✅ Make sure OTP hasn't expired (60 seconds default)
- ✅ Check phone number format: `+91` prefix for India

---

## Quick Reference

### Supabase Dashboard URLs
- **Your Project:** https://supabase.com/dashboard/project/[PROJECT-REF]
- **Auth Providers:** https://supabase.com/dashboard/project/[PROJECT-REF]/auth/providers
- **Users:** https://supabase.com/dashboard/project/[PROJECT-REF]/auth/users

### External Services
- **Google Cloud Console:** https://console.cloud.google.com/
- **Meta Developers:** https://developers.facebook.com/
- **Twilio Console:** https://console.twilio.com/

---

## What Happens After Setup

Once you enable these providers:

1. **Users can sign up/login with 3 methods:**
   - Email/password
   - Google (one-click)
   - Facebook (one-click)
   - Phone OTP

2. **All authentication flows redirect correctly:**
   - New users → `/partner/onboarding`
   - Existing users → `/partner/dashboard`

3. **Supabase handles everything:**
   - User creation
   - Session management
   - Token refresh
   - Email verification (for email signups)

4. **Your code already works:**
   - No code changes needed
   - Just enable providers in Supabase
   - Test and go live!

---

## Summary

**Time Required:**
- Google OAuth: ~15 minutes
- Facebook OAuth: ~15 minutes (optional)
- Phone OTP: ~10 minutes (optional)
- **Total: 15-40 minutes** depending on what you enable

**What You Need:**
- Supabase dashboard access ✅
- Google Cloud Console account (free)
- Meta Developer account (free, optional)
- Twilio account (free trial, optional)

**What's Already Done:**
- ✅ All UI components built
- ✅ All authentication handlers coded
- ✅ Mobile-responsive design
- ✅ Error handling
- ✅ Loading states

**Your Next Steps:**
1. Follow Part 1 (Google OAuth) - **Recommended**
2. Follow Part 3 (Phone OTP) - **Optional but good UX**
3. Skip Part 2 (Facebook) unless you really need it
4. Test everything in Part 5
5. Deploy and celebrate! 🎉

---

Need help? Check the troubleshooting section or reach out with specific error messages!

