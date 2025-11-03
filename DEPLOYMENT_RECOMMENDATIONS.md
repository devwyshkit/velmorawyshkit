# Deployment Recommendations - Best Product Team Practices

## Pre-Deployment Checklist

### 1. Environment Variables ✅

Create `.env.production` with:
```bash
# Supabase (Required)
VITE_SUPABASE_URL=https://jadkxkwdlypgvaeawahq.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Razorpay (Required for Payments)
RAZORPAY_KEY_ID=your-key-id
RAZORPAY_KEY_SECRET=your-key-secret

# IDfy (Required for GSTIN Verification)
VITE_IDFY_ACCOUNT_ID=your-account-id
VITE_IDFY_API_KEY=your-api-key
VITE_IDFY_BASE_URL=https://eve.idfy.com/v3

# Refrens (Required for Invoices/Estimates)
REFRENS_API_KEY=your-api-key
REFRENS_COMPANY_ID=your-company-id

# Google Places (Optional - for address autocomplete)
VITE_GOOGLE_PLACES_API_KEY=your-api-key
```

### 2. Supabase Setup ✅

**Migrations:**
1. Apply all 29 migrations in order (001-029)
2. Run seed files: `test-users.sql`, `test-stores-items.sql`

**Edge Functions:**
Deploy all 5 Edge Functions:
```bash
supabase functions deploy verify-gstin
supabase functions deploy generate-estimate
supabase functions deploy create-payment-order
supabase functions deploy process-design-files
supabase functions deploy send-notification
```

**Storage Buckets:**
Create via Supabase Dashboard:
1. `product-images` (public read, authenticated write)
2. `design-files` (authenticated only)
3. `previews` (authenticated only)
4. `invoices` (authenticated only)

**RLS Policies:**
- Verify all tables have proper RLS policies
- Test with anon key and service role

### 3. Code Quality ✅

**Completed:**
- ✅ Removed all mock data
- ✅ Removed unused imports
- ✅ Proper error handling (no fallbacks to mocks)

**Still To Do:**
- [ ] Remove unused routes
- [ ] Consolidate notifications
- [ ] Fix TypeScript `any` types
- [ ] Remove console.logs (keep only errors)
- [ ] Clean up TODOs

### 4. Testing Strategy

**Before Deploy:**
1. **Test User Flow:**
   - Login with test user
   - Browse stores/items
   - Add to cart
   - Complete checkout
   - Upload design files
   - Approve preview

2. **Test Business Flow:**
   - Enter GSTIN
   - Download estimate
   - Complete payment

3. **Test Edge Cases:**
   - Empty states (no stores/items)
   - Network errors
   - Payment failures
   - Preview deadline expiration

### 5. Performance Optimization

- [ ] Check bundle size: `npm run build` → analyze output
- [ ] Verify lazy loading works
- [ ] Test on slow 3G connection
- [ ] Verify images are optimized

### 6. Security Audit

- [ ] No API keys in code (only env vars)
- [ ] RLS policies tested
- [ ] No sensitive data in comments
- [ ] Error messages don't leak info
- [ ] CORS properly configured

### 7. Monitoring Setup

**Recommended:**
- Supabase Dashboard for database monitoring
- Error tracking (Sentry, LogRocket, etc.)
- Analytics (Plausible, PostHog, etc.)
- Uptime monitoring (UptimeRobot, etc.)

### 8. Documentation

**Keep Only:**
- `README.md` - Main documentation
- `DEPLOYMENT.md` - Deployment guide
- `ROUTES.md` - Route documentation (to be created)
- `NOTIFICATION_STRATEGY.md` - Notification system docs (to be created)

**Delete:**
- Old READMEs
- Outdated docs
- Duplicate guides

---

## Deployment Steps

1. **Build:**
   ```bash
   npm run build
   ```

2. **Test Build:**
   ```bash
   npm run preview
   ```

3. **Deploy:**
   - Frontend: Vercel/Netlify/AWS
   - Edge Functions: Already in Supabase
   - Database: Already in Supabase

4. **Post-Deploy:**
   - Test all critical flows
   - Monitor error logs
   - Check analytics

---

## Rollback Plan

1. Keep previous deployment tagged
2. Database migrations are reversible (have rollback scripts)
3. Edge Functions versioned in Supabase
4. Frontend: Deploy previous version

---

## Success Metrics

- ✅ Zero mock data confusion
- ✅ All flows work with real Supabase data
- ✅ Proper error handling
- ✅ Empty states show correctly
- ✅ Test user can complete full flow



