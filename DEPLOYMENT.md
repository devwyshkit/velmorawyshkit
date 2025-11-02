# Deployment Instructions

## Database Setup

### Option 1: Supabase Dashboard (Recommended)
1. Go to Supabase Dashboard > SQL Editor
2. Run migrations in order (001 to 029) from `supabase/migrations/`
3. Verify all tables created successfully

### Option 2: Supabase CLI
```bash
supabase db push
```

### Required Tables (29 migrations)
- user_profiles, stores, store_items, favorites
- cart_items, addresses, orders, order_items
- reviews, banners, occasions, returns
- notifications, notification_preferences
- promo_codes, promo_code_usage
- payment_transactions, payment_refunds
- vendor_settings, delivery_slots
- gstin_verification_cache
- order_status_history, scheduled_jobs
- And more (see migrations folder)

### Edge Functions
Deploy 5 Edge Functions:
```bash
supabase functions deploy verify-gstin
supabase functions deploy generate-estimate
supabase functions deploy create-payment-order
supabase functions deploy process-design-files
supabase functions deploy send-notification
```

### Storage Buckets
Create buckets via Supabase Dashboard > Storage:
- product-images (public)
- design-files (authenticated)
- previews (authenticated)
- invoices (authenticated)

### Environment Variables
Set in Supabase Dashboard > Settings > Edge Functions:
- VITE_RAZORPAY_KEY
- RAZORPAY_KEY_SECRET
- VITE_IDFY_API_KEY
- VITE_IDFY_ACCOUNT_ID
- VITE_IDFY_BASE_URL
- VITE_REFRENS_API_KEY
- VITE_REFRENS_URL_KEY

## Frontend Deployment

### Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

### Deploy
Deploy the `dist/` folder to your hosting provider:
- Vercel
- Netlify
- Cloudflare Pages
- AWS S3 + CloudFront
- Azure Static Web Apps

## Verification Checklist
- [ ] All 29 database migrations applied
- [ ] All 5 Edge Functions deployed
- [ ] Storage buckets created with correct policies
- [ ] Environment variables configured
- [ ] RLS policies verified
- [ ] Frontend build successful
- [ ] Payment gateway configured
- [ ] IDfy API keys configured
- [ ] Refrens API keys configured

