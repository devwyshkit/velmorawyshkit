# 🚀 Wyshkit Production Deployment Guide

**Complete step-by-step guide to deploy Wyshkit to production**

---

## 📋 Pre-Deployment Checklist

### ✅ Prerequisites
- [ ] Node.js 18+ installed
- [ ] Git repository with latest code
- [ ] Supabase project created and configured
- [ ] Google Places API key obtained
- [ ] Razorpay account setup (optional for testing)
- [ ] Domain name ready (optional)

### ✅ Environment Variables Required
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GOOGLE_PLACES_API_KEY=your_google_places_api_key
VITE_RAZORPAY_KEY_ID=your_razorpay_key_id
VITE_RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

---

## 🎯 Deployment Options

### Option 1: Vercel (Recommended)

#### Step 1: Prepare for Deployment
```bash
# 1. Build the project locally
npm run build

# 2. Test the build
npm run preview
```

#### Step 2: Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

#### Step 3: Configure Environment Variables
1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all required environment variables
3. Redeploy if needed

#### Step 4: Configure Custom Domain (Optional)
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed

### Option 2: Netlify

#### Step 1: Build and Deploy
```bash
# Build the project
npm run build

# Deploy to Netlify (using Netlify CLI)
npm i -g netlify-cli
netlify login
netlify deploy --prod --dir=dist
```

#### Step 2: Configure Environment Variables
1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add all required environment variables

### Option 3: AWS S3 + CloudFront

#### Step 1: Build and Upload
```bash
# Build the project
npm run build

# Upload dist/ folder to S3 bucket
aws s3 sync dist/ s3://your-bucket-name --delete
```

#### Step 2: Configure CloudFront
1. Create CloudFront distribution
2. Set S3 bucket as origin
3. Configure custom domain (optional)

---

## 🗄️ Database Setup (Supabase)

### Step 1: Run SQL Migrations
```bash
# Connect to your Supabase project
# Go to SQL Editor in Supabase Dashboard

# Run all migrations in order:
# 1. 001_initial_schema.sql
# 2. 002_fresh_customer_schema.sql
# 3. 003_partner_schema.sql
# 4. 004_admin_schema.sql
# 5. 005_orders_schema.sql
# 6. 006_campaigns_schema.sql
# 7. 007_hamper_builder.sql
# 8. 008_kitting_workflow.sql
# 9. 009_proof_approval.sql
# 10. 010_variable_commission.sql
# 11. 011_advanced_features.sql
```

### Step 2: Configure Authentication
1. Go to Supabase Dashboard → Authentication → Settings
2. Update Site URL to your production URL
3. Add Redirect URLs:
   - `https://your-domain.com/auth/callback`
   - `https://your-domain.com/partner/auth/callback`
   - `https://your-domain.com/admin/auth/callback`

### Step 3: Configure RLS Policies
- All RLS policies are included in the migrations
- Verify policies are active in Supabase Dashboard → Authentication → Policies

---

## 🔧 Post-Deployment Configuration

### Step 1: Update Supabase Configuration
1. **Site URL**: Set to your production domain
2. **Redirect URLs**: Add all callback URLs
3. **JWT Settings**: Verify JWT expiry (default: 3600 seconds)

### Step 2: Configure Google OAuth
1. Go to Google Cloud Console
2. Update Authorized JavaScript origins:
   - `https://your-domain.com`
3. Update Authorized redirect URIs:
   - `https://your-domain.com/auth/callback`

### Step 3: Configure Razorpay (Optional)
1. Update Razorpay webhook URLs:
   - `https://your-domain.com/api/razorpay/webhook`
2. Update return URLs in Razorpay dashboard

---

## 🧪 Testing Production Deployment

### Step 1: Basic Functionality Test
```bash
# Test all three portals
curl -I https://your-domain.com
curl -I https://your-domain.com/partner/login
curl -I https://your-domain.com/admin/login
```

### Step 2: Database Connection Test
1. Open Customer UI
2. Try to browse products
3. Check browser console for errors
4. Verify data loads from Supabase

### Step 3: Authentication Test
1. Test Google OAuth login
2. Test email/password login
3. Test partner signup flow
4. Test admin login

### Step 4: Mobile Responsiveness Test
1. Test on mobile devices (375px width)
2. Verify bottom navigation works
3. Check all forms are usable
4. Test touch interactions

---

## 📊 Performance Optimization

### Step 1: Enable Compression
```bash
# Vercel automatically enables gzip compression
# For other platforms, configure gzip in your server
```

### Step 2: Configure CDN
- Vercel: Automatic global CDN
- Netlify: Automatic global CDN
- AWS: Configure CloudFront

### Step 3: Optimize Images
- Images are already optimized using Unsplash CDN
- Consider adding WebP format support
- Implement lazy loading (already included)

---

## 🔒 Security Configuration

### Step 1: HTTPS Configuration
- Vercel: Automatic HTTPS
- Netlify: Automatic HTTPS
- AWS: Configure SSL certificate

### Step 2: Environment Variables Security
- Never commit `.env` files
- Use platform-specific secret management
- Rotate keys regularly

### Step 3: Database Security
- Enable RLS policies (already configured)
- Use connection pooling
- Monitor database usage

---

## 📈 Monitoring and Analytics

### Step 1: Set Up Monitoring
```bash
# Add monitoring tools
npm install @vercel/analytics
```

### Step 2: Configure Error Tracking
- Set up Sentry or similar
- Monitor JavaScript errors
- Track performance metrics

### Step 3: Database Monitoring
- Monitor Supabase usage
- Set up alerts for high usage
- Track query performance

---

## 🚨 Troubleshooting

### Common Issues

#### Issue 1: Build Fails
```bash
# Solution: Check for TypeScript errors
npm run build
# Fix any TypeScript errors
```

#### Issue 2: Environment Variables Not Working
```bash
# Solution: Verify variable names start with VITE_
# Check Vercel/Netlify environment variable configuration
```

#### Issue 3: Database Connection Issues
```bash
# Solution: Check Supabase URL and keys
# Verify RLS policies are enabled
# Check network connectivity
```

#### Issue 4: OAuth Not Working
```bash
# Solution: Update redirect URIs in Google Console
# Check Supabase Site URL configuration
# Verify callback URLs are correct
```

### Debug Commands
```bash
# Check build locally
npm run build
npm run preview

# Check environment variables
echo $VITE_SUPABASE_URL

# Test database connection
# Use Supabase Dashboard → SQL Editor
```

---

## 📞 Support and Maintenance

### Regular Maintenance Tasks
1. **Weekly**: Check error logs and performance
2. **Monthly**: Update dependencies
3. **Quarterly**: Security audit and key rotation

### Backup Strategy
- Supabase provides automatic backups
- Export database schema regularly
- Keep code repository updated

### Scaling Considerations
- Monitor database usage
- Consider connection pooling
- Plan for increased traffic

---

## ✅ Production Launch Checklist

### Pre-Launch
- [ ] All environment variables configured
- [ ] Database migrations completed
- [ ] OAuth redirect URIs updated
- [ ] SSL certificate active
- [ ] Custom domain configured (if applicable)

### Launch Day
- [ ] Deploy to production
- [ ] Test all three portals
- [ ] Verify database connections
- [ ] Test authentication flows
- [ ] Check mobile responsiveness
- [ ] Test payment integration (if enabled)

### Post-Launch
- [ ] Monitor error logs
- [ ] Check performance metrics
- [ ] Verify all features working
- [ ] Test with real users
- [ ] Document any issues

---

## 🎉 Success!

**Your Wyshkit platform is now live in production!**

**Next Steps:**
1. Share the production URL with your team
2. Start onboarding partners
3. Test with real customers
4. Monitor performance and usage
5. Plan for scaling based on usage

**Production URL**: `https://your-domain.com`

**Admin Access**: `https://your-domain.com/admin/login`
**Partner Portal**: `https://your-domain.com/partner/login`
**Customer UI**: `https://your-domain.com`

---

**Need Help?** Check the troubleshooting section or contact support.
