# Quick Authentication Setup Checklist

## 🚀 Get Your Wyshkit Authentication Live in 15 Minutes

---

## Priority 1: Google OAuth (Recommended) ⭐

### Step 1: Google Cloud Console (5 min)
```
1. Go to https://console.cloud.google.com/
2. Create Project: "Wyshkit Partner Portal"
3. Enable "Google+ API"
4. Create OAuth Client ID:
   - Type: Web application
   - Redirect URI: https://[YOUR-SUPABASE-REF].supabase.co/auth/v1/callback
5. Copy Client ID and Client Secret
```

**Find Your Supabase Ref:**
- Supabase Dashboard → Project Settings → General → Reference ID
- Example: `abcdefghijklmnop`

### Step 2: Supabase Configuration (3 min)
```
1. Go to Supabase Dashboard
2. Authentication → Providers
3. Scroll to "Google"
4. Toggle ON
5. Paste Client ID
6. Paste Client Secret  
7. Save
```

### Step 3: Test (2 min)
```
1. Open http://localhost:8080/partner/login
2. Click "Continue with Google"
3. Log in with Google
4. Should redirect to dashboard
5. Check Supabase → Users (new user created)
```

**Status:** ✅ Done / ⏳ In Progress / ❌ Not Started

---

## Priority 2: Phone OTP (Optional, Great UX) 📱

### Using Supabase (Easiest)
```
1. Supabase Dashboard → Authentication → Providers → Phone
2. Toggle "Enable Phone Sign-Up" to ON
3. Save
4. Test with your phone number
```

**Limitations:**
- Free tier has SMS limits
- Good for testing, consider Twilio for production

### Using Twilio (Production Recommended)
```
1. Sign up at https://www.twilio.com/
2. Get credentials:
   - Account SID
   - Auth Token
   - Phone Number
3. Supabase → Auth → Providers → Phone
4. Enable "Use custom SMS provider" → Twilio
5. Paste credentials
6. Save
```

**Status:** ✅ Done / ⏳ In Progress / ❌ Not Started / 🚫 Skip for Now

---

## Priority 3: Facebook OAuth (Optional) 👥

### Only if you really need it
```
1. Go to https://developers.facebook.com/
2. Create App: "Wyshkit Partner Portal"
3. Add "Facebook Login" product
4. Settings → Basic:
   - Copy App ID
   - Copy App Secret
5. Facebook Login → Settings:
   - Add redirect: https://[SUPABASE-REF].supabase.co/auth/v1/callback
6. Toggle app to "Live" mode
7. Supabase → Auth → Providers → Facebook
8. Paste App ID and Secret
9. Save
```

**Status:** ✅ Done / ⏳ In Progress / ❌ Not Started / 🚫 Skip for Now

---

## Final Checklist Before Launch

### Required
- [ ] Email/password authentication works (already done ✅)
- [ ] Google OAuth enabled and tested
- [ ] All auth redirects to correct pages
- [ ] Users saved in Supabase database

### Recommended
- [ ] Phone OTP enabled (great mobile UX)
- [ ] Production URLs added to OAuth providers
- [ ] Test all flows in incognito mode

### Optional
- [ ] Facebook OAuth (only if targeting FB users)
- [ ] Real IDfy KYC (or keep using mock for now)

---

## Current Status

**What's Working Now:**
- ✅ Email/password authentication
- ✅ Partner onboarding (4 steps)
- ✅ Mock KYC verification (perfect for testing)
- ✅ Complete UI for social/phone login

**What Needs 15 Minutes:**
- ⏳ Enable Google OAuth in Supabase
- ⏳ (Optional) Enable Phone OTP

**What Can Wait:**
- ⏸️ Facebook OAuth (only if needed)
- ⏸️ Real IDfy integration (mock works fine)

---

## Quick Commands Reference

### Find Your Supabase Project Reference
```
Supabase Dashboard → Project Settings → General → Reference ID
```

### Google OAuth Redirect URI Format
```
https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
```

### Test Your Auth
```bash
# Start dev server
npm run dev

# Navigate to
http://localhost:8080/partner/login

# Test each login method
```

---

## Troubleshooting Quick Fixes

| Error | Fix |
|-------|-----|
| "redirect_uri_mismatch" | Double-check redirect URI in Google Console |
| Google button does nothing | Check browser console, verify Client ID |
| SMS not received | Verify Twilio number, check phone format (+91...) |
| Facebook "App Not Setup" | Toggle app to "Live" mode |

---

## Time Breakdown

- **Google OAuth:** 10 minutes (5 min Google + 3 min Supabase + 2 min test)
- **Phone OTP (Supabase):** 5 minutes (2 min setup + 3 min test)
- **Phone OTP (Twilio):** 10 minutes (5 min Twilio signup + 3 min config + 2 min test)
- **Facebook OAuth:** 15 minutes (10 min Facebook + 3 min Supabase + 2 min test)

**Total if doing all:** 30-40 minutes  
**Minimum recommended:** 10 minutes (Google only)

---

## What to Do Right Now

1. **First:** Enable Google OAuth (10 min)
   - Follow Priority 1 steps above
   - This gives 90% of users easy login

2. **Then:** Test everything
   - Use the Final Checklist
   - Try all 3 login methods

3. **Finally:** Deploy to production
   - Add production URLs to OAuth providers
   - Test on live site

---

## Support Links

- **Full Guide:** See `SUPABASE_AUTH_SETUP_GUIDE.md`
- **IDfy Setup:** See `IDFY_SETUP_GUIDE.md`
- **Supabase Docs:** https://supabase.com/docs/guides/auth
- **Google OAuth Docs:** https://developers.google.com/identity/protocols/oauth2

---

**Ready?** Start with Priority 1 (Google OAuth) - it's the fastest and most impactful! 🚀

