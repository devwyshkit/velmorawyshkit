# Wyshkit Quick Start Guide

**Get your platform running with test data in 30 minutes!**

---

## 📋 Prerequisites

- ✅ Supabase project created (`usiwuxudinfxttvrcczb.supabase.co`)
- ✅ Dev server running (`npm run dev` - PID 49030)
- ✅ `.env` file with Supabase credentials

---

## 🚀 Step 1: Run Database Migrations (15 minutes)

### Option A: Supabase SQL Editor (Recommended - Easiest)

1. **Open Supabase SQL Editor:**
   ```
   https://supabase.com/dashboard/project/usiwuxudinfxttvrcczb/editor
   ```

2. **Run migrations in this exact order:**

**PHASE 1: Core Product Enhancements** (4 migrations)
```sql
-- Copy-paste content of each file and run:
1. ADD_BULK_PRICING_COLUMN.sql
2. ADD_SPONSORED_FIELDS.sql
3. ADD_SOURCING_LIMITS.sql
4. ADD_FSSAI_FIELD.sql
```

**PHASE 2: New Feature Tables** (9 migrations)
```sql
5. ADD_CAMPAIGNS_TABLE.sql
6. ADD_REVIEWS_TABLES.sql
7. ADD_DISPUTES_TABLES.sql
8. ADD_RETURNS_TABLES.sql
9. ADD_BADGES_TABLES.sql
10. ADD_REFERRALS_TABLES.sql
11. ADD_HELP_TABLES.sql
12. ADD_SOURCING_USAGE_TABLE.sql
13. ADD_SPONSORED_ANALYTICS_TABLE.sql
```

**PHASE 3: Admin Console** (optional)
```sql
14. ADD_ADMIN_TABLES.sql
```

3. **Verify migrations:**
```sql
-- Check if all tables were created
SELECT COUNT(*) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'campaigns', 'campaign_analytics',
  'reviews', 'review_responses', 'review_flags',
  'disputes', 'dispute_messages',
  'returns', 'return_events',
  'badge_definitions', 'partner_badges',
  'referral_codes', 'partner_referrals',
  'help_articles', 'support_tickets', 'ticket_messages',
  'sourcing_usage', 'sponsored_analytics'
);
-- Expected: 18 tables
```

---

## 🎨 Step 2: Add Test Data with Images (5 minutes)

1. **Run test data script:**
   - Open SQL Editor
   - Copy-paste content of `ADD_TEST_DATA_WITH_IMAGES.sql`
   - Click "Run"

2. **What it creates:**
   - ✅ 4 Banner carousel images (Diwali, Corporate, Wedding, Birthday)
   - ✅ 8 Occasion cards with images
   - ✅ 2 Test partners (GiftCraft, Boat Audio)
   - ✅ 10 Sample products with realistic images
   - ✅ All features enabled (bulk pricing, add-ons, sponsored, sourcing)
   - ✅ 2 Active campaigns
   - ✅ 3 Customer reviews

---

## 🔐 Step 3: Create Test User Accounts (5 minutes)

### Create Partner Accounts in Supabase Auth

1. **Open Supabase Authentication:**
   ```
   https://supabase.com/dashboard/project/usiwuxudinfxttvrcczb/auth/users
   ```

2. **Click "Add User" → "Create new user"**

3. **Partner 1 (GiftCraft):**
   - Email: `partner@giftcraft.com`
   - Password: `Password123!`
   - User ID: `partner-giftcraft-001` (IMPORTANT: Use this exact ID)
   - Confirm email: ✅ Yes

4. **Partner 2 (Boat Audio):**
   - Email: `partner@boat.com`
   - Password: `Password123!`
   - User ID: `partner-boat-002` (IMPORTANT: Use this exact ID)
   - Confirm email: ✅ Yes

5. **Customer (for testing customer UI):**
   - Email: `customer@test.com`
   - Password: `Password123!`
   - Confirm email: ✅ Yes

---

## 🌐 Step 4: Test in Browser (5 minutes)

### Partner Portal

1. **Open:**
   ```
   http://localhost:8080/partner/login
   ```

2. **Login with:**
   - Email: `partner@giftcraft.com`
   - Password: `Password123!`

3. **Test features:**
   - ✅ Dashboard loads with stats
   - ✅ Products page shows 8 GiftCraft products
   - ✅ Click "Add Product" → All 7 sections visible (Basic Info, Pricing, Images, Bulk Pricing, Sponsored, Sourcing, Customization)
   - ✅ Campaigns page shows "Diwali Mega Sale"
   - ✅ Reviews page shows 2 reviews
   - ✅ All 11 pages load without errors

### Customer UI

1. **Open:**
   ```
   http://localhost:8080/customer/home
   ```

2. **Verify:**
   - ✅ 4 Banners in carousel (auto-scroll)
   - ✅ 8 Occasion cards in grid
   - ✅ 10 Products display with images
   - ✅ Sponsored badge on "Diwali Premium Hamper"
   - ✅ Click product → Bulk pricing shows
   - ✅ Increase quantity → Toast "Bulk pricing applied!"
   - ✅ Add-ons display for customizable products

---

## 🎯 Quick Test Checklist

### Partner Portal
- [ ] Login successful
- [ ] Dashboard stats show data
- [ ] Products list displays 8 items
- [ ] Add Product form has all 7 sections
- [ ] Bulk Pricing accordion expands
- [ ] Sponsored Toggle shows fee calculator
- [ ] Customization shows add-ons builder
- [ ] Campaigns page shows 1 active campaign
- [ ] Reviews page shows 2 reviews

### Customer UI
- [ ] Banner carousel auto-scrolls
- [ ] 8 Occasion cards clickable
- [ ] Products have images
- [ ] Sponsored badge visible on 1 product
- [ ] Click product → Detail page loads
- [ ] Bulk pricing tiers display
- [ ] Quantity change triggers toast
- [ ] Add-ons show as checkboxes
- [ ] Add to cart works

---

## 🐛 Troubleshooting

### "Relation does not exist"
**Fix:** Run migrations in correct order (PHASE 1 → PHASE 2 → PHASE 3)

### "Permission denied for table X"
**Fix:** Check RLS policies are disabled for testing, or use service role key

### "Images not loading"
**Fix:** Images are from Unsplash (external URLs). Internet connection required. Replace with your Cloudinary URLs in production.

### "Partner products not showing"
**Fix:** Ensure User ID in Supabase Auth matches partner_id in test data:
- `partner-giftcraft-001` (exact match required)
- `partner-boat-002` (exact match required)

### "Bulk pricing not applying"
**Fix:** Check browser console for errors. Ensure ItemDetails.tsx has bulk_pricing logic (lines 270-319)

---

## 📸 Image Credits

All test images are from **Unsplash** (royalty-free):
- Banner/Occasion images: High-quality festival, gift, celebration photos
- Product images: Professional product photography
- **Production:** Replace with your own images or Cloudinary URLs

**Recommended Image Specs:**
- Banners: 1200×400px (horizontal carousel)
- Occasion cards: 400×300px (aspect ratio 4:3)
- Product images: 600×600px (square, 1:1 aspect ratio)

---

## ✅ Success Criteria

After completing all steps, you should have:

1. **Database:**
   - ✅ 18 new tables created
   - ✅ 7 badges pre-seeded
   - ✅ 3 help articles pre-seeded
   - ✅ 2 partners with 10 products
   - ✅ 2 active campaigns
   - ✅ 3 customer reviews

2. **Partner Portal:**
   - ✅ All 11 pages functional
   - ✅ Product form with all 7 features
   - ✅ Real data from database (no mock)

3. **Customer UI:**
   - ✅ Banners carousel
   - ✅ Occasion cards grid
   - ✅ Products with bulk pricing
   - ✅ Sponsored badges
   - ✅ Add-ons integration

---

## 🚀 Next Steps

1. **Replace mock images** with your own Cloudinary URLs
2. **Add more test products** (different categories)
3. **Test order flow** (customer → cart → checkout → partner fulfillment)
4. **Implement Zoho integration** (see ZOHO_INTEGRATION_IMPLEMENTATION.md)
5. **Build Admin Console** (see ADMIN_CONSOLE_SWIGGY_ZOMATO_PATTERNS.md)

---

## 📞 Support

**Issues?** Check:
- `MIGRATIONS_RUN_ORDER.md` - Detailed migration sequence
- `SUCCESS_ALL_WORKING_CREDENTIALS.md` - Test credentials
- `IMPLEMENTATION_STATUS_SUMMARY.md` - Complete feature audit

---

**READY TO GO!** 🎉

Your Wyshkit platform is now fully functional with realistic test data!

