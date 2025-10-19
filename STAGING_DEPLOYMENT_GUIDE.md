# Wyshkit Customer UI - Staging Deployment Guide

**Version**: 1.0.0  
**Date**: October 19, 2025  
**Status**: Production-Ready  
**Build Verified**: ✅ Local smoke test passed

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Deployment Options](#deployment-options)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Tools
- Node.js 18+ and npm 9+
- Git
- Supabase account (for backend)
- Hosting platform account (Vercel/Netlify/AWS)

### Build Verification
✅ **Local Production Build**: Tested & working  
- Bundle size: 722.80 kB (gzipped: 211.42 kB)  
- CSS size: 91.60 kB (gzipped: 15.64 kB)  
- Build time: ~4 seconds  
- No critical errors

---

## Environment Setup

### Step 1: Environment Variables

Create `.env.production` file in project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# API Configuration (Optional for V1)
VITE_OPENAI_API_KEY=your-openai-key  # For AI recommendations (fallback exists)

# Analytics (Optional)
VITE_POSTHOG_KEY=your-posthog-key
VITE_POSTHOG_HOST=https://app.posthog.com

# Environment
VITE_ENV=staging
```

### Step 2: Supabase Setup

1. **Create Supabase Project**:
   - Go to https://supabase.com/dashboard
   - Create new project: `wyshkit-staging`
   - Note your project URL and anon key

2. **Run Database Migrations**:
   ```bash
   # From project root
   cd supabase/migrations
   
   # Run migrations in order
   psql $DATABASE_URL < 001_initial_schema.sql
   psql $DATABASE_URL < 002_fresh_customer_schema.sql
   psql $DATABASE_URL < 003_add_full_text_search.sql
   ```

3. **Verify Tables Created**:
   ```sql
   -- In Supabase SQL Editor
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_type = 'BASE TABLE';
   
   -- Expected: items, partners, cart, wishlist, orders, locations
   ```

4. **Insert Mock Data** (for staging testing):
   ```sql
   -- Example: Add test partners
   INSERT INTO partners (name, category, location, image, rating) VALUES
   ('Premium Gifts Co', 'Tech Gifts', 'Bangalore', '/placeholder.svg', 4.5),
   ('Sweet Delights', 'Chocolates', 'Bangalore', '/placeholder.svg', 4.6);
   
   -- Example: Add test items
   INSERT INTO items (name, partner_id, price, image, rating) VALUES
   ('Premium Gift Hamper', 1, 249900, '/placeholder.svg', 4.6),
   ('Chocolate Box', 2, 129900, '/placeholder.svg', 4.8);
   ```

---

## Deployment Options

### Option A: Vercel (Recommended)

**Why Vercel**: Zero-config React support, automatic HTTPS, global CDN, preview deployments

#### Steps:

1. **Install Vercel CLI**:
   ```bash
   npm i -g vercel
   ```

2. **Login**:
   ```bash
   vercel login
   ```

3. **Deploy**:
   ```bash
   # From project root
   vercel --prod
   
   # Or via Git integration (recommended)
   git push origin main  # Auto-deploys if GitHub connected
   ```

4. **Configure Environment Variables**:
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all variables from `.env.production`
   - Redeploy to apply

5. **Custom Domain** (optional):
   - Dashboard → Domains → Add `staging.wyshkit.com`
   - Update DNS: CNAME → cname.vercel-dns.com

**Estimated Time**: 5-10 minutes  
**Cost**: Free (Hobby plan) or $20/month (Pro)

---

### Option B: Netlify

**Why Netlify**: Similar to Vercel, great for React, built-in forms, functions

#### Steps:

1. **Install Netlify CLI**:
   ```bash
   npm i -g netlify-cli
   ```

2. **Login**:
   ```bash
   netlify login
   ```

3. **Deploy**:
   ```bash
   # From project root
   netlify deploy --prod
   
   # Publish directory: dist
   ```

4. **Configure**:
   - Create `netlify.toml`:
     ```toml
     [build]
       publish = "dist"
       command = "npm run build"
     
     [[redirects]]
       from = "/*"
       to = "/index.html"
       status = 200
     ```

5. **Environment Variables**:
   - Dashboard → Site settings → Environment → Add variables

**Estimated Time**: 5-10 minutes  
**Cost**: Free (Starter) or $19/month (Pro)

---

### Option C: AWS S3 + CloudFront

**Why AWS**: Full control, enterprise-grade, cost-effective at scale

#### Steps:

1. **Build for Production**:
   ```bash
   npm run build
   ```

2. **Create S3 Bucket**:
   ```bash
   aws s3 mb s3://wyshkit-staging --region us-east-1
   aws s3 website s3://wyshkit-staging --index-document index.html
   ```

3. **Upload Build**:
   ```bash
   aws s3 sync dist/ s3://wyshkit-staging --delete
   ```

4. **Configure CloudFront**:
   - Create distribution pointing to S3 bucket
   - Set default root object: `index.html`
   - Set error pages: 404 → /index.html (for SPA routing)

5. **Update DNS**:
   - CNAME: `staging.wyshkit.com` → CloudFront domain

**Estimated Time**: 20-30 minutes  
**Cost**: ~$5-10/month (depending on traffic)

---

## Post-Deployment Verification

### Automated Smoke Tests

Run these checks immediately after deployment:

```bash
# Check site is live
curl -I https://staging.wyshkit.com

# Expected: HTTP 200, content-type: text/html

# Check homepage loads
curl https://staging.wyshkit.com/customer/home | grep "WYSHKIT"

# Check assets load
curl -I https://staging.wyshkit.com/wyshkit-logo.png

# Expected: HTTP 200
```

### Manual Verification Checklist

Access staging URL and verify:

#### ✅ Core Pages Load
- [ ] Homepage (`/customer/home`)
- [ ] Search (`/customer/search`)
- [ ] Partner page (`/customer/partners/:id`)
- [ ] Item details (`/customer/items/:id`)
- [ ] Cart (`/customer/cart`)
- [ ] Checkout (`/customer/checkout`)

#### ✅ All 4 Fixed Issues Work
- [ ] Occasion cards route to search (not 404)
- [ ] Price filters actually filter partners
- [ ] "View All" button works
- [ ] Partners show no ₹0 price

#### ✅ Assets Load
- [ ] Wyshkit logo displays
- [ ] Partner images load
- [ ] Item images load
- [ ] Icons render correctly

#### ✅ Responsive Design
- [ ] Mobile (375px): Bottom nav, tap targets ≥48px
- [ ] Tablet (768px): Grid adjusts to 3 columns
- [ ] Desktop (1200px+): Max width 1280px, centered

#### ✅ Performance
- [ ] LCP < 2.5s (Lighthouse)
- [ ] CLS < 0.1 (no layout shifts)
- [ ] TTI < 3.5s

#### ✅ Authentication (if enabled)
- [ ] Guest mode works (browse without login)
- [ ] Login prompts on cart add
- [ ] Signup flow completes
- [ ] Logout works

#### ✅ Supabase Integration
- [ ] Partners load from database
- [ ] Items load from database
- [ ] Search queries Supabase (or falls back to mock)
- [ ] No CORS errors in console

---

## Troubleshooting

### Issue #1: Blank Page / White Screen

**Symptoms**: Deployment succeeds but site shows blank page  
**Causes**: Environment variables missing, routing config incorrect

**Solutions**:
1. Check browser console for errors
2. Verify environment variables in hosting platform
3. For SPA routing, ensure all routes redirect to `index.html`:
   - **Vercel**: Add `vercel.json`:
     ```json
     {
       "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
     }
     ```
   - **Netlify**: Add `_redirects` in `public/`:
     ```
     /*    /index.html   200
     ```
   - **AWS**: CloudFront error pages: 404 → /index.html

### Issue #2: Supabase Connection Fails

**Symptoms**: "Failed to fetch" errors, mock data shows instead  
**Causes**: CORS misconfiguration, wrong Supabase URL

**Solutions**:
1. Verify `.env.production` has correct Supabase URL
2. In Supabase Dashboard → Settings → API:
   - Add staging domain to allowed origins
   - Example: `https://staging.wyshkit.com`
3. Check RLS policies allow public read access:
   ```sql
   -- In Supabase SQL Editor
   SELECT * FROM items LIMIT 1;  -- Should return data
   ```

### Issue #3: Images Don't Load

**Symptoms**: Broken image icons, 404 for `/placeholder.svg`  
**Causes**: Assets not copied to build, incorrect paths

**Solutions**:
1. Verify `public/` folder copied to `dist/`:
   ```bash
   ls -la dist/  # Should see placeholder.svg, logos, etc.
   ```
2. If missing, rebuild:
   ```bash
   npm run build
   ```
3. Check image URLs in code use correct paths (relative, not absolute)

### Issue #4: 404 on Page Refresh

**Symptoms**: Works on first load, 404 on refresh  
**Causes**: SPA routing not configured

**Solutions**: See Issue #1 solutions (SPA redirects)

### Issue #5: Slow Load Times

**Symptoms**: LCP > 3s, users complain of slowness  
**Causes**: Large bundle, no CDN, no caching

**Solutions**:
1. Enable CDN (Vercel/Netlify do this automatically)
2. Add caching headers:
   ```
   Cache-Control: public, max-age=31536000, immutable  # For /assets/*
   Cache-Control: public, max-age=3600                 # For index.html
   ```
3. Consider code splitting (future optimization):
   ```typescript
   // In App.tsx
   const CustomerHome = lazy(() => import('./pages/customer/CustomerHome'));
   ```

---

## Security Checklist

Before going live:

- [ ] **Environment variables**: Never commit `.env` files
- [ ] **Supabase RLS**: Enable Row Level Security on all tables
- [ ] **HTTPS only**: Force HTTPS (Vercel/Netlify do this by default)
- [ ] **CORS**: Restrict to staging domain only
- [ ] **API keys**: Use project-specific keys (not personal)
- [ ] **Error logging**: Set up Sentry or similar (optional for staging)

---

## Performance Optimization (Post-Launch)

### Optional Enhancements

1. **Image Optimization**:
   - Use WebP format for hero images
   - Add `loading="lazy"` to below-fold images
   - Consider Cloudinary or imgix for dynamic optimization

2. **Code Splitting**:
   - Lazy load customer pages
   - Extract vendor chunks for better caching

3. **PWA Features**:
   - Enable service worker for offline support
   - Add app icons for "Add to Home Screen"

4. **Analytics**:
   - Add Google Analytics or PostHog
   - Track occasion card clicks, filter usage, conversion funnel

---

## Deployment Timeline

### Recommended Schedule

**Day 1 (Today)**:
- [x] Local production build verified
- [ ] Choose hosting platform (Vercel recommended)
- [ ] Set up Supabase project
- [ ] Run database migrations
- [ ] Deploy to staging
- [ ] Smoke test deployment

**Day 2**:
- [ ] User Acceptance Testing (see UAT_CHECKLIST.md)
- [ ] Fix any critical issues found
- [ ] Performance testing (Lighthouse)
- [ ] Mobile device testing (real devices)

**Day 3**:
- [ ] Final QA pass
- [ ] Stakeholder review
- [ ] Documentation review
- [ ] Go-live decision

---

## Support & Resources

### Documentation
- **Vite Deployment**: https://vitejs.dev/guide/static-deploy.html
- **Supabase Docs**: https://supabase.com/docs
- **Vercel Guide**: https://vercel.com/docs
- **Netlify Guide**: https://docs.netlify.com

### Internal Docs
- `ALL_FIXES_VERIFIED.md` - List of fixed issues
- `UAT_CHECKLIST.md` - User acceptance testing guide
- `README.md` - Project setup & development

### Contact
- **Technical Issues**: support@wyshkit.com
- **Deployment Help**: Check Vercel/Netlify support docs

---

## Next Steps

After successful staging deployment:

1. ✅ **Complete UAT** (see UAT_CHECKLIST.md)
2. **Collect Feedback**: Share staging URL with stakeholders
3. **Iterate**: Fix any issues found during UAT
4. **Production Deployment**: Repeat process with production domain
5. **Partner Platform**: Resume development (Phase 2)

---

**Deployment Status**: Ready for staging ✅  
**Last Updated**: October 19, 2025  
**Maintained By**: Wyshkit Engineering Team

